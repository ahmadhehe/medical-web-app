const prisma = require('../lib/prisma');

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    activeUsers,
    inactiveUsers,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    todayAppointments,
    totalScreenings,
    recentAlerts,
    recentRegistrations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'patient' } }),
    prisma.user.count({ where: { role: 'doctor' } }),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { status: 'inactive' } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'pending' } }),
    prisma.appointment.count({ where: { status: 'confirmed' } }),
    prisma.appointment.count({ where: { status: 'completed' } }),
    prisma.appointment.count({ where: { status: 'cancelled' } }),
    (() => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end   = new Date(); end.setHours(23, 59, 59, 999);
      return prisma.appointment.count({ where: { scheduledAt: { gte: start, lte: end } } });
    })(),
    prisma.aiScreening.count(),
    // Recent high-urgency screenings as alerts
    prisma.aiScreening.findMany({
      where: { urgencyLevel: { in: ['high', 'emergency'] } },
      include: { patient: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Users registered in the last 7 days
    prisma.user.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    users: { total: totalUsers, patients: totalPatients, doctors: totalDoctors, active: activeUsers, inactive: inactiveUsers },
    appointments: { total: totalAppointments, pending: pendingAppointments, confirmed: confirmedAppointments, completed: completedAppointments, cancelled: cancelledAppointments, today: todayAppointments },
    screenings: { total: totalScreenings },
    recentAlerts,
    recentRegistrations,
  };
};

module.exports = { getDashboardStats };
