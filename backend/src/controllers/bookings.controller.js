const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  sendBookingRequestOwnerEmail,
  sendBookingDecisionRenterEmail,
  sendBookingDueReminderEmail,
} = require('../services/email.service');

const prisma = new PrismaClient();
const ALLOWED_STATUSES = ['pending', 'accepted', 'requested_return', 'returned', 'rejected', 'cancelled', 'completed'];
const BLOCKING_STATUSES = ['pending', 'accepted', 'requested_return', 'returned'];
const ACTIVE_LIFECYCLE_STATUSES = ['accepted', 'requested_return', 'returned'];
const EXTENSION_STATUSES = ['none', 'pending', 'approved', 'rejected'];
const LATE_FEE_PER_DAY = Number(process.env.LATE_FEE_PER_DAY || 5);
const DUE_REMINDER_WINDOW_HOURS = Number(process.env.DUE_REMINDER_WINDOW_HOURS || 24);

function buildConversationId(userA, userB, listingId) {
  return [userA, userB].sort().join('_') + `_${listingId}`;
}

function formatDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function toDateKey(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function getDateRangeKeys(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  const keys = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function getLifecycleMeta(booking) {
  const now = new Date();
  const end = new Date(booking.endDate);
  if (Number.isNaN(end.getTime())) {
    return {
      daysRemaining: null,
      isOverdue: false,
      lifecycleStatus: booking.status,
    };
  }

  const diffMs = end.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isActiveLifecycle = ACTIVE_LIFECYCLE_STATUSES.includes(booking.status);
  const isOverdue = isActiveLifecycle && diffMs < 0;

  return {
    daysRemaining,
    isOverdue,
    lifecycleStatus: booking.status,
  };
}

function calculateLateFee(booking, now = new Date()) {
  const end = new Date(booking.endDate);
  if (Number.isNaN(end.getTime()) || now <= end) return 0;
  const overdueDays = Math.max(1, Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
  const perDay = Number(booking.lateFeePerDay ?? LATE_FEE_PER_DAY);
  return Number((overdueDays * perDay).toFixed(2));
}

function decorateBooking(booking) {
  const lateFeeAccrued = Number(booking.lateFeeAccrued || 0);

  return {
    ...booking,
    ...getLifecycleMeta(booking),
    lateFeePerDay: Number(booking.lateFeePerDay ?? LATE_FEE_PER_DAY),
    lateFeeAccrued,
    potentialLateFee: Math.max(lateFeeAccrued, calculateLateFee(booking)),
    extensionStatus: EXTENSION_STATUSES.includes(booking.extensionStatus) ? booking.extensionStatus : 'none',
    paymentStatus: booking.payment?.status || null,
  };
}

async function logBookingEvent({ bookingId, fromStatus, toStatus, action, actorId, metadata }) {
  await prisma.bookingStatusEvent.create({
    data: {
      bookingId,
      fromStatus,
      toStatus,
      action,
      actorId,
      metadata,
    },
  });
}

async function updateLateFeeForBooking(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      endDate: true,
      lateFeePerDay: true,
      lateFeeAccrued: true,
    },
  });

  if (!booking) return;
  const trackableStatuses = ['accepted', 'requested_return', 'returned', 'completed'];
  if (!trackableStatuses.includes(booking.status)) return;

  const computed = calculateLateFee(booking);
  if (computed === Number(booking.lateFeeAccrued || 0)) return;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      lateFeeAccrued: computed,
      lastOverdueFeeCalculatedAt: new Date(),
    },
  });
}

async function updateLateFeesForBookings(bookings) {
  for (const booking of bookings) {
    await updateLateFeeForBooking(booking.id);
  }
}

async function sendDueDateReminders() {
  const now = new Date();
  const reminderThreshold = new Date(now.getTime() + DUE_REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const dueSoon = await prisma.booking.findMany({
    where: {
      status: { in: ACTIVE_LIFECYCLE_STATUSES },
      reminderSentAt: null,
      endDate: {
        gt: now,
        lte: reminderThreshold,
      },
    },
    include: {
      listing: {
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      renter: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  for (const booking of dueSoon) {
    const dueLabel = formatDateLabel(booking.endDate);
    await Promise.all([
      sendBookingDueReminderEmail(booking.renter?.email, {
        recipientName: booking.renter?.name,
        listingTitle: booking.listing?.title,
        dueDateLabel: dueLabel,
        role: 'renter',
      }),
      sendBookingDueReminderEmail(booking.listing?.owner?.email, {
        recipientName: booking.listing?.owner?.name,
        listingTitle: booking.listing?.title,
        dueDateLabel: dueLabel,
        role: 'owner',
      }),
    ]).catch((err) => {
      console.warn('Failed to send due-date reminder email', err?.message || err);
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
  }
}

async function hasBookingOverlap({ listingId, startDate, endDate, excludeBookingId }) {
  const conflict = await prisma.booking.findFirst({
    where: {
      listingId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: BLOCKING_STATUSES },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true },
  });

  return Boolean(conflict);
}

function isAllowedTransition(currentStatus, nextStatus, { isOwner, isRenter }) {
  if (currentStatus === nextStatus) return true;

  if (currentStatus === 'pending') {
    if (isOwner && ['accepted', 'rejected', 'cancelled'].includes(nextStatus)) return true;
    if (isRenter && nextStatus === 'cancelled') return true;
    return false;
  }

  if (currentStatus === 'accepted') {
    if (isRenter && nextStatus === 'requested_return') return true;
    if (isOwner && ['cancelled', 'completed'].includes(nextStatus)) return true;
    return false;
  }

  if (currentStatus === 'requested_return') {
    if (isOwner && ['returned', 'cancelled', 'completed'].includes(nextStatus)) return true;
    return false;
  }

  if (currentStatus === 'returned') {
    if (isOwner && nextStatus === 'completed') return true;
    return false;
  }

  return false;
}

async function syncListingAvailability(listingId) {
  const activeBookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: BLOCKING_STATUSES },
    },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  const blockedDateSet = new Set();
  for (const booking of activeBookings) {
    for (const key of getDateRangeKeys(booking.startDate, booking.endDate)) {
      blockedDateSet.add(key);
    }
  }

  const blockedDates = Array.from(blockedDateSet).sort();
  const todayKey = toDateKey(new Date());
  const isBlockedToday = todayKey ? blockedDateSet.has(todayKey) : false;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      blockedDates,
      available: !isBlockedToday,
    },
  });
}

async function autoCompleteExpiredBookings() {
  const now = new Date();
  const expired = await prisma.booking.findMany({
    where: {
      status: { in: ACTIVE_LIFECYCLE_STATUSES },
      endDate: { lt: now },
    },
    select: {
      id: true,
      listingId: true,
    },
  });

  if (!expired.length) return;

  for (const booking of expired) {
    await updateLateFeeForBooking(booking.id);
  }

  const expiredIds = expired.map((booking) => booking.id);
  await prisma.booking.updateMany({
    where: { id: { in: expiredIds } },
    data: {
      status: 'completed',
      completedAt: now,
    },
  });

  const listingIds = Array.from(new Set(expired.map((booking) => booking.listingId)));
  for (const listingId of listingIds) {
    await syncListingAvailability(listingId);
  }

  for (const booking of expired) {
    await logBookingEvent({
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: 'completed',
      action: 'auto_completed_on_due_passed',
      actorId: null,
      metadata: { reason: 'endDate_passed' },
    });
  }
}

// POST /api/bookings
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { listingId, startDate, endDate, totalCost } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ error: 'endDate must be later than startDate' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        available: true,
        pricePerDay: true,
        location: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.ownerId === req.userId) {
      return res.status(400).json({ error: 'You cannot book your own listing' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const conflictingBooking = await hasBookingOverlap({ listingId, startDate: start, endDate: end });

    if (conflictingBooking) {
      return res.status(409).json({ error: 'Listing is already booked for the selected dates' });
    }

    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
    const computedTotal = Number((durationDays * listing.pricePerDay).toFixed(2));

    // TODO: Uncomment after running: npx prisma migrate dev
    const booking = await prisma.booking.create({
      data: {
        listingId,
        renterId: req.userId,
        startDate: start,
        endDate: end,
        lateFeePerDay: LATE_FEE_PER_DAY,
        totalCost: totalCost !== undefined ? Number(totalCost) : computedTotal,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            pricePerDay: true,
            images: true,
            ownerId: true,
          },
        },
      },
    });

    const renter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true },
    });

    const conversationId = buildConversationId(req.userId, listing.ownerId, listing.id);
    const startDateLabel = formatDateLabel(start);
    const endDateLabel = formatDateLabel(end);

    // Create an in-app booking request message so owner gets dashboard/inbox awareness.
    await prisma.message.create({
      data: {
        conversationId,
        senderId: req.userId,
        content: `Booking request for ${listing.title}. Pickup at ${listing.location || 'On Campus'} | Start: ${startDateLabel} | Deadline: ${endDateLabel}.`,
      },
    });

    // Non-blocking owner email notification (SES in production, console in development).
    sendBookingRequestOwnerEmail(listing.owner?.email, {
      ownerName: listing.owner?.name,
      renterName: renter?.name || 'A renter',
      listingTitle: listing.title,
      location: listing.location,
      startDateLabel,
      endDateLabel,
      totalCost: booking.totalCost,
    }).catch((emailErr) => {
      console.warn('Failed to send owner booking request email', emailErr?.message || emailErr);
    });

    await syncListingAvailability(listing.id);

    await logBookingEvent({
      bookingId: booking.id,
      fromStatus: null,
      toStatus: booking.status,
      action: 'created',
      actorId: req.userId,
      metadata: {
        startDate,
        endDate,
      },
    });

    res.status(201).json(decorateBooking(booking));
  } catch (err) { next(err); }
};

// GET /api/bookings/my
exports.getMy = async (req, res, next) => {
  try {
    await autoCompleteExpiredBookings();
    await sendDueDateReminders();

    // TODO: Uncomment after running: npx prisma migrate dev
    const bookings = await prisma.booking.findMany({
      where: { renterId: req.userId },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await updateLateFeesForBookings(bookings);

    const refreshedBookings = await prisma.booking.findMany({
      where: { renterId: req.userId },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(refreshedBookings.map(decorateBooking));
  } catch (err) { next(err); }
};

// GET /api/bookings/lending
exports.getLending = async (req, res, next) => {
  try {
    await autoCompleteExpiredBookings();
    await sendDueDateReminders();

    // TODO: Uncomment after running: npx prisma migrate dev
    const bookings = await prisma.booking.findMany({
      where: {
        listing: {
          ownerId: req.userId,
        },
      },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, avatar: true, verified: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await updateLateFeesForBookings(bookings);

    const refreshedBookings = await prisma.booking.findMany({
      where: {
        listing: {
          ownerId: req.userId,
        },
      },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, avatar: true, verified: true, email: true },
        },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(refreshedBookings.map(decorateBooking));
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
exports.getOne = async (req, res, next) => {
  try {
    await autoCompleteExpiredBookings();
    await sendDueDateReminders();

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, email: true, avatar: true, verified: true },
        },
        statusEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isRenter = booking.renterId === req.userId;
    const isOwner = booking.listing.ownerId === req.userId;
    if (!isRenter && !isOwner) {
      return res.status(403).json({ error: 'You do not have access to this booking' });
    }

    await updateLateFeeForBooking(booking.id);

    const refreshedBooking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, email: true, avatar: true, verified: true },
        },
        statusEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(decorateBooking(refreshedBooking));
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          select: {
            id: true,
            ownerId: true,
            title: true,
            location: true,
            owner: {
              select: { id: true, name: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.listing.ownerId === req.userId;
    const isRenter = booking.renterId === req.userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({ error: 'You are not allowed to change this booking status' });
    }

    if (!isAllowedTransition(booking.status, status, { isOwner, isRenter })) {
      return res.status(400).json({ error: `Invalid status transition from ${booking.status} to ${status}` });
    }

    if (status === 'accepted') {
      const overlapConflict = await hasBookingOverlap({
        listingId: booking.listing.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        excludeBookingId: booking.id,
      });

      if (overlapConflict) {
        return res.status(409).json({ error: 'Another active booking already overlaps these dates' });
      }
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const now = new Date();
    const statusUpdateData = {
      status,
      requestedReturnAt: status === 'requested_return' ? now : booking.requestedReturnAt,
      returnedAt: status === 'returned' ? now : booking.returnedAt,
      completedAt: status === 'completed' ? now : booking.completedAt,
      extensionStatus: ['completed', 'cancelled'].includes(status) ? 'none' : booking.extensionStatus,
      extensionRequestedEndDate: ['completed', 'cancelled'].includes(status) ? null : booking.extensionRequestedEndDate,
      extensionRequestedAt: ['completed', 'cancelled'].includes(status) ? null : booking.extensionRequestedAt,
      extensionResolvedAt: ['completed', 'cancelled'].includes(status) ? now : booking.extensionResolvedAt,
    };

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: statusUpdateData,
    });

    await updateLateFeeForBooking(updatedBooking.id);

    await syncListingAvailability(booking.listing.id);

    const startDateLabel = formatDateLabel(booking.startDate);
    const endDateLabel = formatDateLabel(booking.endDate);

    // Owner decision should notify renter in-app and by email.
    if (isOwner && ['accepted', 'rejected'].includes(status)) {
      const conversationId = buildConversationId(booking.renterId, booking.listing.ownerId, booking.listing.id);
      const decisionText = status === 'accepted' ? 'accepted' : 'rejected';

      await prisma.message.create({
        data: {
          conversationId,
          senderId: booking.listing.ownerId,
          content: `Booking ${decisionText} for ${booking.listing.title}. Pickup: ${booking.listing.location || 'On Campus'} | Start: ${startDateLabel} | Deadline: ${endDateLabel}.`,
        },
      });

      sendBookingDecisionRenterEmail(booking.renter?.email, {
        renterName: booking.renter?.name,
        ownerName: booking.listing.owner?.name,
        listingTitle: booking.listing.title,
        location: booking.listing.location,
        startDateLabel,
        endDateLabel,
        status,
      }).catch((emailErr) => {
        console.warn('Failed to send renter booking decision email', emailErr?.message || emailErr);
      });
    }

    await logBookingEvent({
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: status,
      action: 'status_updated',
      actorId: req.userId,
      metadata: {
        byRole: isOwner ? 'owner' : 'renter',
      },
    });

    res.json(decorateBooking(updatedBooking));
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/extend
exports.requestExtension = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { requestedEndDate } = req.body;
    const requestedEnd = new Date(requestedEndDate);
    if (Number.isNaN(requestedEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid requestedEndDate' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          select: { id: true, ownerId: true, title: true },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renterId !== req.userId) {
      return res.status(403).json({ error: 'Only renter can request extension' });
    }

    if (!ACTIVE_LIFECYCLE_STATUSES.includes(booking.status)) {
      return res.status(400).json({ error: 'Extension is only allowed for active bookings' });
    }

    if (requestedEnd <= new Date(booking.endDate)) {
      return res.status(400).json({ error: 'requestedEndDate must be after current endDate' });
    }

    const hasConflict = await hasBookingOverlap({
      listingId: booking.listingId,
      startDate: booking.startDate,
      endDate: requestedEnd,
      excludeBookingId: booking.id,
    });

    if (hasConflict) {
      return res.status(409).json({ error: 'Requested extension overlaps with another booking' });
    }

    const now = new Date();
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        extensionStatus: 'pending',
        extensionRequestedEndDate: requestedEnd,
        extensionRequestedAt: now,
        extensionResolvedAt: null,
      },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, email: true, avatar: true, verified: true },
        },
      },
    });

    await logBookingEvent({
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: booking.status,
      action: 'extension_requested',
      actorId: req.userId,
      metadata: {
        requestedEndDate,
      },
    });

    const conversationId = buildConversationId(booking.renterId, booking.listing.ownerId, booking.listing.id);
    await prisma.message.create({
      data: {
        conversationId,
        senderId: booking.renterId,
        content: `Extension requested for ${booking.listing.title}. New requested return date: ${formatDateLabel(requestedEnd)}.`,
      },
    });

    res.json(decorateBooking(updated));
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/extend/decision
exports.decideExtension = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { decision } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved or rejected' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, email: true, avatar: true, verified: true },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.listing.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only listing owner can decide extension request' });
    }
    if (booking.extensionStatus !== 'pending' || !booking.extensionRequestedEndDate) {
      return res.status(400).json({ error: 'No pending extension request found' });
    }

    if (decision === 'approved') {
      const hasConflict = await hasBookingOverlap({
        listingId: booking.listingId,
        startDate: booking.startDate,
        endDate: booking.extensionRequestedEndDate,
        excludeBookingId: booking.id,
      });

      if (hasConflict) {
        return res.status(409).json({ error: 'Cannot approve extension due to overlap with another booking' });
      }
    }

    const now = new Date();
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        endDate: decision === 'approved' ? booking.extensionRequestedEndDate : booking.endDate,
        extensionStatus: decision,
        extensionResolvedAt: now,
        extensionRequestedEndDate: null,
      },
      include: {
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
        },
        renter: {
          select: { id: true, name: true, email: true, avatar: true, verified: true },
        },
      },
    });

    await syncListingAvailability(booking.listing.id);
    await updateLateFeeForBooking(updated.id);

    const conversationId = buildConversationId(booking.renterId, booking.listing.ownerId, booking.listing.id);
    await prisma.message.create({
      data: {
        conversationId,
        senderId: booking.listing.ownerId,
        content: decision === 'approved'
          ? `Extension approved for ${booking.listing.title}. New return date: ${formatDateLabel(updated.endDate)}.`
          : `Extension rejected for ${booking.listing.title}. Original return date remains ${formatDateLabel(booking.endDate)}.`,
      },
    });

    await logBookingEvent({
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: updated.status,
      action: decision === 'approved' ? 'extension_approved' : 'extension_rejected',
      actorId: req.userId,
      metadata: {
        previousEndDate: booking.endDate,
        requestedEndDate: booking.extensionRequestedEndDate,
        finalEndDate: updated.endDate,
      },
    });

    res.json(decorateBooking(updated));
  } catch (err) { next(err); }
};

// GET /api/bookings/:id/audit
exports.getAuditTrail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: { select: { ownerId: true } },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isAllowed = booking.renterId === req.userId || booking.listing.ownerId === req.userId;
    if (!isAllowed) return res.status(403).json({ error: 'You do not have access to this booking audit trail' });

    const events = await prisma.bookingStatusEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(events);
  } catch (err) { next(err); }
};