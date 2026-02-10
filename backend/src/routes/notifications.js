const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendNotification,
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');

// Send notification (Admin/Leader only)
router.post('/send', protect, authorize('ADMIN', 'LEADER'), sendNotification);

// Get user's notifications
router.get('/', protect, getNotifications);

// Mark notification as read
router.put('/:id/read', protect, markAsRead);

module.exports = router;
