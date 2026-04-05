const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { createAuditLog } = require('./audit.service');

const SAFE_USER_SELECT = {
  id: true, fullName: true, email: true,
  phone: true, role: true, department: true, status: true,
  createdAt: true, updatedAt: true,
};

const getAllUsers = async (filters = {}) => {
  const { role, status, department, search, page = 1, limit = 20 } = filters;

  const where = {};
  if (role)       where.role       = role;
  if (status)     where.status     = status;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email:    { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: Number(page), limit: Number(limit) };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
};

const updateUser = async (id, data) => {
  await getUserById(id);
  const { passwordHash, role, ...safeData } = data;
  return prisma.user.update({ where: { id }, data: safeData, select: SAFE_USER_SELECT });
};

const deleteUser = async (id, actorId, ipAddress) => {
  await getUserById(id);
  await prisma.user.delete({ where: { id } });
  await createAuditLog({
    actorId, actionType: 'DELETE', targetType: 'user',
    targetId: id, description: `User account deleted`, ipAddress,
  });
};

const updateUserStatus = async (id, status, actorId, ipAddress) => {
  await getUserById(id);
  const user = await prisma.user.update({
    where: { id }, data: { status }, select: SAFE_USER_SELECT,
  });
  await createAuditLog({
    actorId, actionType: 'UPDATE', targetType: 'user',
    targetId: id, description: `User status changed to ${status}`, ipAddress,
  });
  return user;
};

const resetPassword = async (id, newPassword, actorId, ipAddress) => {
  await getUserById(id);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await createAuditLog({
    actorId, actionType: 'UPDATE', targetType: 'user',
    targetId: id, description: `Password reset by admin`, ipAddress,
  });
};

const getDepartments = async () => {
  const results = await prisma.user.groupBy({
    by: ['department'],
    where: { department: { not: null } },
    _count: { id: true },
  });
  return results.map((r) => ({ department: r.department, userCount: r._count.id }));
};

const getUsersByDepartment = async (department, filters = {}) => {
  const { role, status, page = 1, limit = 20 } = filters;

  const where = { department };
  if (role)   where.role   = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: Number(page), limit: Number(limit) };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updateUserStatus, resetPassword, getDepartments, getUsersByDepartment };
