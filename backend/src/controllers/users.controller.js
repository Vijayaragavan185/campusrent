const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/users/:id
exports.getProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        year: true,
        avatar: true,
        verified: true,
        isLister: true,
        rating: true,
        createdAt: true,
        listings: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            listing: {
              select: { id: true, title: true, images: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

// PUT /api/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updateData = {};
    const fields = ['name', 'department', 'year', 'avatar', 'isLister'];
    for (const field of fields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        year: true,
        avatar: true,
        verified: true,
        isLister: true,
        rating: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (err) { next(err); }
};

// PUT /api/users/me/payout
exports.updatePayoutDetails = async (req, res, next) => {
  try {
    const { upiId } = req.body;
    if (!upiId || typeof upiId !== 'string' || !upiId.trim()) {
      return res.status(400).json({ error: 'Valid UPI ID is required' });
    }

    const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      return res.status(400).json({ error: 'Invalid UPI ID format (e.g. yourname@okaxis)' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { payoutUpiId: upiId.trim() },
      select: { id: true, payoutUpiId: true },
    });

    res.json({ success: true, payoutUpiId: user.payoutUpiId });
  } catch (err) { next(err); }
};