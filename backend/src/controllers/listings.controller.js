const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function buildListingWhere(query = {}) {
  const where = {};

  if (query.q) {
    where.OR = [
      { title:       { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { category:    { contains: query.q, mode: 'insensitive' } },
      { location:    { contains: query.q, mode: 'insensitive' } },
    ];
  }

  if (query.category) where.category = query.category;
  if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
  if (query.available !== undefined) where.available = query.available === true || query.available === 'true';
  if (query.featured !== undefined) where.featured = query.featured === true || query.featured === 'true';

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    where.pricePerDay = {};
    if (!Number.isNaN(minPrice)) where.pricePerDay.gte = minPrice;
    if (!Number.isNaN(maxPrice)) where.pricePerDay.lte = maxPrice;
  }

  return where;
}

// GET /api/listings
exports.getAll = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const listings = await prisma.listing.findMany({
      where: buildListingWhere(req.query),
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true,
            rating: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(listings);
  } catch (err) { next(err); }
};

// GET /api/listings/search
exports.search = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const listings = await prisma.listing.findMany({
      where: buildListingWhere(req.query),
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, verified: true },
        },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(listings);
  } catch (err) { next(err); }
};

// GET /api/listings/:id
exports.getOne = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            year: true,
            verified: true,
            rating: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true, avatar: true, verified: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
};

// POST /api/listings
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      title,
      description,
      category,
      condition,
      pricePerDay,
      images = [],
      location,
      available = true,
      featured = false,
    } = req.body;

    // TODO: Uncomment after running: npx prisma migrate dev
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        category,
        condition,
        pricePerDay: Number(pricePerDay),
        images,
        location,
        available: Boolean(available),
        featured: Boolean(featured),
        ownerId: req.userId,
      },
    });

    res.status(201).json(listing);
  } catch (err) { next(err); }
};

// PUT /api/listings/:id
exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const existing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true },
    });

    if (!existing) return res.status(404).json({ error: 'Listing not found' });
    if (existing.ownerId !== req.userId) {
      return res.status(403).json({ error: 'You can only update your own listings' });
    }

    const updateData = {};
    const fields = ['title', 'description', 'category', 'condition', 'images', 'location', 'available', 'featured'];
    for (const field of fields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    if (req.body.pricePerDay !== undefined) updateData.pricePerDay = Number(req.body.pricePerDay);

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(listing);
  } catch (err) { next(err); }
};

// DELETE /api/listings/:id
exports.remove = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // TODO: Uncomment after running: npx prisma migrate dev
    const existing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true },
    });

    if (!existing) return res.status(404).json({ error: 'Listing not found' });
    if (existing.ownerId !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { listingId: req.params.id } }),
      prisma.booking.deleteMany({ where: { listingId: req.params.id } }),
      prisma.listing.delete({ where: { id: req.params.id } }),
    ]);

    res.json({ message: 'Listing deleted successfully' });
  } catch (err) { next(err); }
};