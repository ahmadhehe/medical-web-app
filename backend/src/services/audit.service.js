const prisma = require('../lib/prisma');

const createAuditLog = async ({ actorId, actionType, targetType, targetId, description, ipAddress }) => {
  return prisma.auditLog.create({
    data: {
      actorId:     actorId    ?? null,
      actionType,
      targetType,
      targetId:    targetId   ?? null,
      description: description ?? null,
      ipAddress:   ipAddress  ?? null,
    },
  });
};

const getAuditLogs = async (filters = {}) => {
  const { actorId, actionType, targetType, startDate, endDate, page = 1, limit = 50 } = filters;

  const where = {};
  if (actorId)     where.actorId     = actorId;
  if (actionType)  where.actionType  = actionType;
  if (targetType)  where.targetType  = targetType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate)   where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip:  (Number(page) - 1) * Number(limit),
      take:  Number(limit),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: Number(page), limit: Number(limit) };
};

const exportAuditLogs = async (filters = {}) => {
  const { logs } = await getAuditLogs({ ...filters, limit: 10000 });

  const header = 'Timestamp,Actor,Role,Action Type,Target Type,Target ID,Description,IP Address';
  const rows = logs.map((l) => [
    l.createdAt.toISOString(),
    l.actor?.fullName  ?? 'System',
    l.actor?.role      ?? '-',
    l.actionType,
    l.targetType,
    l.targetId         ?? '-',
    `"${(l.description ?? '').replace(/"/g, '""')}"`,
    l.ipAddress        ?? '-',
  ].join(','));

  return [header, ...rows].join('\n');
};

module.exports = { createAuditLog, getAuditLogs, exportAuditLogs };
