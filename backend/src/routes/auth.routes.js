// backend/src/routes/auth.routes.js
const express     = require('express');
const router      = express.Router();
const { body }    = require('express-validator');
const rateLimit   = require('express-rate-limit');
const auth        = require('../controllers/auth.controller');
const authMW      = require('../middleware/auth');
 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // max 10 auth attempts per 15 minutes
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});
 
router.post('/register',   authLimiter,
  [body('email').isEmail().normalizeEmail()],
  auth.register);
 
router.post('/verify-otp', authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('name').trim().notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  auth.verifyOtp);
 
router.post('/login', authLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  auth.login);
 
router.get('/me', authMW, auth.getMe);

module.exports = router;
