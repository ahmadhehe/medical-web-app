const prisma = require('../lib/prisma');

// Internal helper used by other services to send notifications
const sendNotification = async ({ userId, title, message, type }) => {
  return prisma.notification.create({
    data: { userId, title, message, type },
  });
};

const getNotifications = async (userId) => {
  return prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const markAsRead = async (id) => {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
};

const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });
};

const deleteNotification = async (id) => {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }
  return prisma.notification.delete({ where: { id } });
};

module.exports = { sendNotification, getNotifications, markAsRead, markAllAsRead, deleteNotification };
