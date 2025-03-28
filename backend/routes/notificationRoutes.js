const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendAdminMessage,
  getNotificationById,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notificationController');
const { emitNotification, emitNotificationToAll } = require('../services/socketService');

// User notification preferences routes (no admin auth required)
router.get('/preferences', auth, getNotificationPreferences);
router.put('/preferences', auth, updateNotificationPreferences);

// Regular user notification routes
router.get('/list', auth, getUserNotifications);
router.put('/read-all', auth, markAllAsRead);
router.get('/:id', auth, getNotificationById);
router.put('/:id/read', auth, markAsRead);

// Admin only routes
router.post('/admin-message', auth, adminAuth, sendAdminMessage);

// Admin notification routes
router.get('/admin/list', auth, adminAuth, getUserNotifications);

module.exports = router; 