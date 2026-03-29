const notificationService = require('../services/notification.service');

const getNotifications    = async (req, res, next) => { try { res.status(200).json(await notificationService.getNotifications(req.user.id)); } catch (err) { next(err); } };
const markAsRead          = async (req, res, next) => { try { res.status(200).json(await notificationService.markAsRead(req.params.id)); } catch (err) { next(err); } };
const markAllAsRead       = async (req, res, next) => { try { await notificationService.markAllAsRead(req.user.id); res.status(200).json({ message: 'All notifications marked as read' }); } catch (err) { next(err); } };
const deleteNotification  = async (req, res, next) => { try { await notificationService.deleteNotification(req.params.id); res.status(204).send(); } catch (err) { next(err); } };

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
