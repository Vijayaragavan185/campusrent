// backend/src/controllers/auth.controller.js
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOtpEmail } = require('../services/email.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getValidationError(req) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;

  const firstError = errors.array()[0];
  const err = new Error(firstError?.msg || 'Invalid request.');
  err.status = 400;
  return err;
}

function mapEmailDeliveryError(error) {
  const rawMessage = error?.message || '';
  const errorName = error?.name || '';
  const combined = `${errorName} ${rawMessage}`.toLowerCase();

  if (combined.includes('email address is not verified') || combined.includes('message rejected')) {
    const friendly = new Error('We could not send the verification email yet. Our email sender is not fully verified in AWS SES. Please try again later or contact support.');
    friendly.status = 503;
    return friendly;
  }

  if (combined.includes('sandbox')) {
    const friendly = new Error('Email delivery is still in AWS SES sandbox mode. Verification emails can currently be sent only to approved addresses.');
    friendly.status = 503;
    return friendly;
  }

  if (combined.includes('credentials') || combined.includes('access key') || combined.includes('secret access key')) {
    const friendly = new Error('Email service is temporarily unavailable due to a server email configuration issue. Please try again later.');
    friendly.status = 503;
    return friendly;
  }

  const friendly = new Error('We could not send the verification email right now. Please try again in a few minutes.');
  friendly.status = 503;
  return friendly;
}
 
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
    const validationError = getValidationError(req);
    if (validationError) return next(validationError);
 
    const { email } = req.body;
    if (!isUniversityEmail(email)) {
      return res.status(400).json({
        error: 'Please use your university email (.edu or .ac.in)',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser?.verified) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in instead.',
      });
    }
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
 
    // TODO: Uncomment after running: npx prisma migrate dev
    await prisma.otpCode.create({ data: { email, code: otp, expiresAt } });
 
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      return next(mapEmailDeliveryError(emailError));
    }

    res.json({ message: 'Verification code sent to your university email.' });
  } catch (err) { next(err); }
};
 
// POST /api/auth/verify-otp  — validates OTP, creates user, returns JWT
exports.verifyOtp = async (req, res, next) => {
  try {
    const validationError = getValidationError(req);
    if (validationError) return next(validationError);
 
    const { email, otp, name, password } = req.body;
 
    // TODO: Uncomment after migrations
    const record = await prisma.otpCode.findFirst({
      where: { email, code: otp, used: false, expiresAt: { gt: new Date() } },
    });
    if (!record) {
      return res.status(400).json({
        error: 'That verification code is invalid or expired. Please request a new code and try again.',
      });
    }
 
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
    const validationError = getValidationError(req);
    if (validationError) return next(validationError);
 
    const { email, password } = req.body;
 
    // TODO: Uncomment after migrations
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        error: 'No account was found for this email. Please sign up first.',
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        error: 'This account is not verified yet. Please complete the email verification step first.',
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: 'Incorrect password. Please try again.',
      });
    }

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
        isLister: true, isAdmin: true, rating: true, payoutUpiId: true, createdAt: true
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

// POST /api/auth/create-admin — creates an admin user (direct creation)
exports.createAdmin = async (req, res, next) => {
  try {
    const validationError = getValidationError(req);
    if (validationError) return next(validationError);

    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        verified: true,
        isAdmin: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin,
      token: signToken(admin.id),
    });
  } catch (err) {
    next(err);
  }
};
