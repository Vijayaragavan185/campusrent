const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ALLOWED_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

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
      select: { id: true, ownerId: true, available: true, pricePerDay: true },
    });

    if (!listing || !listing.available) {
      return res.status(404).json({ error: 'Listing is not available for booking' });
    }
    if (listing.ownerId === req.userId) {
      return res.status(400).json({ error: 'You cannot book your own listing' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: ['pending', 'accepted', 'completed'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });

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

    res.status(201).json(booking);
  } catch (err) { next(err); }
};

// GET /api/bookings/my
exports.getMy = async (req, res, next) => {
  try {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookings);
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
exports.getOne = async (req, res, next) => {
  try {
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
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isRenter = booking.renterId === req.userId;
    const isOwner = booking.listing.ownerId === req.userId;
    if (!isRenter && !isOwner) {
      return res.status(403).json({ error: 'You do not have access to this booking' });
    }

    res.json(booking);
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
          select: { ownerId: true },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.listing.ownerId === req.userId;
    const isRenter = booking.renterId === req.userId;
    const canCancelAsRenter = isRenter && status === 'cancelled';

    if (!isOwner && !canCancelAsRenter) {
      return res.status(403).json({ error: 'You are not allowed to change this booking status' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updatedBooking);
  } catch (err) { next(err); }
};