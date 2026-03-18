// backend/src/middleware/adminAuth.js
// Admin-only middleware: checks JWT token AND isAdmin flag
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const adminAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, isAdmin: true, email: true },
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userEmail = user.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = adminAuthMiddleware;
