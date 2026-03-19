const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.get('/', authenticate, notificationController.getNotifications);
router.post('/read-all', authenticate, notificationController.markAllAsRead);
router.post('/:notificationId/read', authenticate, notificationController.markAsRead);

module.exports = router;
