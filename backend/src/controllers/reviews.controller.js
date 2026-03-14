const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/reviews/listing/:listingId
exports.getForListing = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const reviews = await prisma.review.findMany({
      where: { listingId: req.params.listingId },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true, verified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
  } catch (err) { next(err); }
};

// GET /api/reviews/user/:userId
exports.getForUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const reviews = await prisma.review.findMany({
      where: { reviewerId: req.params.userId },
      include: {
        listing: {
          select: { id: true, title: true, images: true, ownerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
  } catch (err) { next(err); }
};

// POST /api/reviews
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { listingId, rating, comment } = req.body;

    // TODO: Uncomment after running: npx prisma migrate dev
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.ownerId === req.userId) {
      return res.status(400).json({ error: 'You cannot review your own listing' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const existingReview = await prisma.review.findFirst({
      where: { listingId, reviewerId: req.userId },
      select: { id: true },
    });

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this listing' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const review = await prisma.review.create({
      data: {
        listingId,
        reviewerId: req.userId,
        rating: Number(rating),
        comment,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true, verified: true },
        },
      },
    });

    res.status(201).json(review);
  } catch (err) { next(err); }
};