const prisma = require('../lib/prisma');

const getAllDoctors = async () => {
  return prisma.user.findMany({
    where:   { role: 'doctor' },
    select: {
      id: true, fullName: true, email: true, status: true,
      doctorProfile: { select: { specialization: true, licenseNumber: true } },
    },
  });
};

const getProfile = async (userId) => {
  const profile = await prisma.doctorProfile.findUnique({
    where:   { userId },
    include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
  });
  if (!profile) {
    const error = new Error('Doctor profile not found');
    error.status = 404;
    throw error;
  }
  return profile;
};

const createProfile = async (userId, data) => {
  const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (existing) {
    const error = new Error('Doctor profile already exists. Use PUT to update it.');
    error.status = 409;
    throw error;
  }
  return prisma.doctorProfile.create({
    data: {
      userId,
      specialization: data.specialization,
      licenseNumber:  data.licenseNumber,
    },
    include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
  });
};

const updateProfile = async (userId, data) => {
  const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!existing) {
    const error = new Error('Doctor profile not found');
    error.status = 404;
    throw error;
  }
  return prisma.doctorProfile.update({
    where: { userId },
    data: {
      ...(data.specialization && { specialization: data.specialization }),
      ...(data.licenseNumber  && { licenseNumber:  data.licenseNumber }),
    },
  });
};

const getSchedule = async (userId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return prisma.appointment.findMany({
    where: {
      doctorId:    userId,
      scheduledAt: { gte: start, lte: end },
    },
    include: {
      patient: { select: { id: true, fullName: true, email: true } },
      aiScreenings: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });
};

module.exports = { getAllDoctors, createProfile, getProfile, updateProfile, getSchedule };
