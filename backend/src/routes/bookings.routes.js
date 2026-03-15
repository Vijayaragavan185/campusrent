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
router.get('/lending', authMW, bookings.getLending);

router.get('/:id', authMW,
  [param('id').trim().notEmpty()],
  bookings.getOne);

router.get('/:id/audit', authMW,
  [param('id').trim().notEmpty()],
  bookings.getAuditTrail);

router.put('/:id/status', authMW,
  [
    param('id').trim().notEmpty(),
    body('status').trim().isIn(['pending', 'accepted', 'requested_return', 'returned', 'rejected', 'cancelled', 'completed']),
  ],
  bookings.updateStatus);

router.put('/:id/extend', authMW,
  [
    param('id').trim().notEmpty(),
    body('requestedEndDate').isISO8601(),
  ],
  bookings.requestExtension);

router.put('/:id/extend/decision', authMW,
  [
    param('id').trim().notEmpty(),
    body('decision').trim().isIn(['approved', 'rejected']),
  ],
  bookings.decideExtension);

module.exports = router;