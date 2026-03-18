// backend/src/routes/admin.routes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const adminAuth = require('../middleware/adminAuth');
const admin = require('../controllers/admin.controller');

// All admin routes require admin authentication
router.use(adminAuth);

// Dashboard
router.get('/dashboard/info', admin.getDashboardInfo);
router.get('/stats', admin.getStats);

// Bookings
router.get('/bookings', admin.getAllBookings);

// Payouts
router.get('/payouts', admin.getAllPayouts);
router.put(
  '/payouts/:payoutId/mark-processed',
  [body('transactionId').optional().trim()],
  admin.markPayoutProcessed
);
router.put(
  '/payouts/:payoutId/mark-failed',
  [body('failureReason').optional().trim()],
  admin.markPayoutFailed
);

// Users
router.get('/users', admin.getAllUsers);

// Content Moderation
router.put(
  '/listings/:listingId/block',
  [body('reason').trim().notEmpty().withMessage('Please provide a reason for blocking.')],
  admin.blockListing
);
router.put('/listings/:listingId/unblock', admin.unblockListing);
router.get('/listings/blocked', admin.getBlockedListings);

// Notifications
router.get('/notifications', admin.getNotifications);
router.put('/notifications/:notificationId/read', admin.markNotificationRead);

module.exports = router;
