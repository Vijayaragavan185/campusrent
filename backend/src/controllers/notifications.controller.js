// backend/src/controllers/notifications.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/notifications
 * Get user's notifications
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = parseInt(offset) || 0;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: offsetNum,
    });

    const totalCount = await prisma.notification.count({
      where: { userId: req.userId },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, read: false },
    });

    res.json({
      notifications,
      totalCount,
      unreadCount,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notifications/:notificationId/read
 * Mark notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.json({
      success: true,
      notification: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });

    res.json({
      success: true,
      updated: result.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
exports.delete = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (err) {
    next(err);
  }
};
