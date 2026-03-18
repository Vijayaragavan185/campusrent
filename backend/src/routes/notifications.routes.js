// backend/src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const notifications = require('../controllers/notifications.controller');

// All notification routes require authentication
router.use(auth);

// Get user's notifications
router.get('/', notifications.getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', notifications.markAsRead);

// Mark all notifications as read
router.put('/read-all', notifications.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notifications.delete);

module.exports = router;
