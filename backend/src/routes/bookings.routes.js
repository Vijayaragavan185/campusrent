const express = require('express');
const { body, param } = require('express-validator');

const router = express.Router();
const bookings = require('../controllers/bookings.controller');
const authMW = require('../middleware/auth');

router.post('/', authMW,
  [
    body('listingId').trim().notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('totalCost').optional().isFloat({ min: 0 }).toFloat(),
  ],
  bookings.create);

router.get('/my', authMW, bookings.getMy);

router.get('/:id', authMW,
  [param('id').trim().notEmpty()],
  bookings.getOne);

router.put('/:id/status', authMW,
  [
    param('id').trim().notEmpty(),
    body('status').trim().isIn(['pending', 'accepted', 'rejected', 'cancelled', 'completed']),
  ],
  bookings.updateStatus);

module.exports = router;