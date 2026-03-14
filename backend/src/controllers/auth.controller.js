// backend/src/controllers/auth.controller.js
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOtpEmail } = require('../services/email.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
function isUniversityEmail(email) {
  return (
    email.endsWith('.edu')   ||
    /\.ac\.\w+$/.test(email) ||  // .ac.in .ac.uk
    /\.edu\.\w+$/.test(email)    // .edu.au
  );
}
 
function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
 
// POST /api/auth/register  — validates email, creates OTP, emails it
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
 
    const { email } = req.body;
    if (!isUniversityEmail(email)) {
      return res.status(400).json({
        error: 'Please use your university email (.edu or .ac.in)',
      });
    }
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
 
    // TODO: Uncomment after running: npx prisma migrate dev
    await prisma.otpCode.create({ data: { email, code: otp, expiresAt } });
 
    await sendOtpEmail(email, otp);
    res.json({ message: 'Verification code sent to your university email.' });
  } catch (err) { next(err); }
};
 
// POST /api/auth/verify-otp  — validates OTP, creates user, returns JWT
exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
 
    const { email, otp, name, password } = req.body;
 
    // TODO: Uncomment after migrations
    const record = await prisma.otpCode.findFirst({
      where: { email, code: otp, used: false, expiresAt: { gt: new Date() } },
    });
    if (!record) return res.status(400).json({ error: 'Invalid or expired code.' });
 
    const hashedPassword = await bcrypt.hash(password, 12);
 
    // TODO: Uncomment after migrations
    const user = await prisma.user.upsert({
      where: { email },
      update: { verified: true, name, password: hashedPassword },
      create: { email, name, password: hashedPassword, verified: true },
    });
    await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });

    res.json({ token: signToken(user.id), user: { id: user.id, email, name: user.name } });
  } catch (err) { next(err); }
};
 
// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
 
    const { email, password } = req.body;
 
    // TODO: Uncomment after migrations
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.verified) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    res.json({ token: signToken(user.id), user: { id: user.id, email, name: user.name } });
  } catch (err) { next(err); }
};
 
// GET /api/auth/me  — requires authMiddleware
exports.getMe = async (req, res, next) => {
  try {
    // TODO: Uncomment after migrations
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, name: true, avatar: true,
        department: true, year: true, verified: true,
        isLister: true, rating: true, createdAt: true
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};
