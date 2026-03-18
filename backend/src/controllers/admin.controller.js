// backend/src/controllers/admin.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/admin/stats
 * Dashboard overview stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalListings = await prisma.listing.count();
    const totalBookings = await prisma.booking.count();
    const totalPayments = await prisma.payment.count();
    const totalPayouts = await prisma.payout.count();

    const payoutStats = await prisma.payout.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amountInPaise: true },
    });

    const pendingPayouts = await prisma.payout.findMany({
      where: { status: 'pending' },
      select: { id: true, amountInPaise: true, createdAt: true, bookingId: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      totalUsers,
      totalListings,
      totalBookings,
      totalPayments,
      totalPayouts,
      payoutStats,
      recentPendingPayouts: pendingPayouts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings
 * Get all bookings with filters
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const where = status ? { status } : {};

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, location: true } },
        renter: { select: { id: true, name: true, email: true } },
        payment: { select: { id: true, amount: true, status: true } },
        payout: { select: { id: true, status: true, amountInPaise: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.booking.count({ where });

    res.json({ bookings, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/payouts
 * Get all payouts with filter options
 */
exports.getAllPayouts = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const where = status ? { status } : {};

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            renter: { select: { id: true, name: true, email: true } },
            listing: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.payout.count({ where });

    res.json({ payouts, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/payouts/:payoutId/mark-processed
 * Manually mark payout as processed (for manual settlement tracking)
 */
exports.markPayoutProcessed = async (req, res, next) => {
  try {
    const { payoutId } = req.params;
    const { transactionId } = req.body;

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'processed',
        razorpayPayoutId: transactionId || payout.razorpayPayoutId,
      },
    });

    res.json({ success: true, payout: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/payouts/:payoutId/mark-failed
 * Mark payout as failed with reason
 */
exports.markPayoutFailed = async (req, res, next) => {
  try {
    const { payoutId } = req.params;
    const { failureReason } = req.body;

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'failed',
        failureReason: failureReason || 'Manually marked as failed',
      },
    });

    res.json({ success: true, payout: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * Get all users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
        isLister: true,
        isAdmin: true,
        rating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.user.count({ where });

    res.json({ users, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/dashboard/info
 * Admin dashboard info (top-level overview)
 */
exports.getDashboardInfo = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalListings,
      totalBookings,
      totalPayments,
      totalPayouts,
      pendingPayouts,
      processedPayouts,
      failedPayouts,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.payout.count(),
      prisma.payout.count({ where: { status: 'pending' } }),
      prisma.payout.count({ where: { status: 'processed' } }),
      prisma.payout.count({ where: { status: 'failed' } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { title: true } },
          renter: { select: { name: true, email: true } },
          payment: { select: { amount: true, status: true } },
        },
      }),
    ]);

    const totalPaymentAmount = await prisma.payment.aggregate({
      _sum: { amount: true },
    });

    const totalPayoutAmount = await prisma.payout.aggregate({
      _sum: { amountInPaise: true },
      where: { status: 'processed' },
    });

    res.json({
      stats: {
        totalUsers,
        totalListings,
        totalBookings,
        totalPayments,
        totalPayouts,
        pendingPayouts,
        processedPayouts,
        failedPayouts,
        totalPaymentAmount: totalPaymentAmount._sum.amount || 0,
        totalProcessedPayoutAmount: (totalPayoutAmount._sum.amountInPaise || 0) / 100,
      },
      recentBookings,
    });
  } catch (err) {
    next(err);
  }
};
