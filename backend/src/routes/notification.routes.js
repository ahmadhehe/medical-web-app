const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET   /api/notifications          - get notifications for logged-in user
// PATCH /api/notifications/:id/read - mark a notification as read
// PATCH /api/notifications/read-all - mark all as read
// DELETE /api/notifications/:id     - delete a notification

router.get('/',                    authenticate, notificationController.getNotifications);
router.patch('/read-all',          authenticate, notificationController.markAllAsRead);
router.patch('/:id/read',          authenticate, notificationController.markAsRead);
router.delete('/:id',              authenticate, notificationController.deleteNotification);

module.exports = router;
