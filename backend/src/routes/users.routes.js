const express = require('express');
const { body, param } = require('express-validator');

const router = express.Router();
const users = require('../controllers/users.controller');
const authMW = require('../middleware/auth');

router.put('/me', authMW,
  [
    body('name').optional().trim().notEmpty(),
    body('department').optional().trim(),
    body('year').optional().trim(),
    body('avatar').optional().trim(),
    body('isLister').optional().isBoolean().toBoolean(),
  ],
  users.updateProfile);

router.put('/me/payout', authMW,
  [body('upiId').trim().notEmpty().withMessage('UPI ID is required')],
  users.updatePayoutDetails);

router.get('/:id',
  [param('id').trim().notEmpty()],
  users.getProfile);

module.exports = router;