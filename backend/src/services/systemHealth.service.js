const prisma = require('../lib/prisma');

const getSystemHealth = async () => {
  const start = Date.now();

  // Database connectivity check
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = 'unhealthy';
  }

  // Table row counts
  const [users, appointments, screenings, notifications, auditLogs, medicalImages] = await Promise.all([
    prisma.user.count(),
    prisma.appointment.count(),
    prisma.aiScreening.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.medicalImage.count(),
  ]);

  // Memory usage
  const mem = process.memoryUsage();

  return {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    memory: {
      rss:       formatBytes(mem.rss),
      heapUsed:  formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
      external:  formatBytes(mem.external),
    },
    tables: { users, appointments, screenings, notifications, auditLogs, medicalImages },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    responseTimeMs: Date.now() - start,
  };
};

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

const formatBytes = (bytes) => {
  const mb = (bytes / 1024 / 1024).toFixed(2);
  return `${mb} MB`;
};

module.exports = { getSystemHealth };
