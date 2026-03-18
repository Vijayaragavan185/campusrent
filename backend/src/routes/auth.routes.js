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
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
  ],
  auth.register);
 
router.post('/verify-otp', authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('Enter the 6-digit verification code from your email.')
      .isNumeric()
      .withMessage('Verification code should contain only numbers.'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Please enter your full name.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.'),
  ],
  auth.verifyOtp);
 
router.post('/login', authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.'),
    body('password')
      .notEmpty()
      .withMessage('Please enter your password.'),
  ],
  auth.login);
 
router.post('/create-admin',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Please enter a name.'),
  ],
  auth.createAdmin);

router.get('/me', authMW, auth.getMe);

module.exports = router;
