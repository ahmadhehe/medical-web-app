const prisma = require('../lib/prisma');

const getProfile = async (userId) => {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
    include: { allergies: true },
  });
  if (!profile) {
    const error = new Error('Patient profile not found');
    error.status = 404;
    throw error;
  }
  return profile;
};

const createProfile = async (userId, data) => {
  const existing = await prisma.patientProfile.findUnique({ where: { userId } });
  if (existing) {
    const error = new Error('Profile already exists. Use PUT to update it.');
    error.status = 409;
    throw error;
  }
  return prisma.patientProfile.create({
    data: {
      userId,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      bloodType: data.bloodType,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      hasHypertension: data.hasHypertension ?? false,
      hasDiabetes: data.hasDiabetes ?? false,
      hasAsthma: data.hasAsthma ?? false,
      hasHeartDisease: data.hasHeartDisease ?? false,
      additionalNotes: data.additionalNotes,
    },
    include: { allergies: true },
  });
};

const updateProfile = async (userId, data) => {
  const existing = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!existing) {
    const error = new Error('Patient profile not found');
    error.status = 404;
    throw error;
  }
  return prisma.patientProfile.update({
    where: { userId },
    data: {
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      ...(data.gender && { gender: data.gender }),
      ...(data.bloodType !== undefined && { bloodType: data.bloodType }),
      ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
      ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
      ...(data.hasHypertension !== undefined && { hasHypertension: data.hasHypertension }),
      ...(data.hasDiabetes !== undefined && { hasDiabetes: data.hasDiabetes }),
      ...(data.hasAsthma !== undefined && { hasAsthma: data.hasAsthma }),
      ...(data.hasHeartDisease !== undefined && { hasHeartDisease: data.hasHeartDisease }),
      ...(data.additionalNotes !== undefined && { additionalNotes: data.additionalNotes }),
    },
    include: { allergies: true },
  });
};

const getAllergies = async (userId) => {
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) {
    const error = new Error('Patient profile not found');
    error.status = 404;
    throw error;
  }
  return prisma.allergy.findMany({ where: { patientId: profile.id } });
};

const addAllergy = async (userId, data) => {
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) {
    const error = new Error('Patient profile not found');
    error.status = 404;
    throw error;
  }
  return prisma.allergy.create({
    data: { patientId: profile.id, name: data.name },
  });
};

const removeAllergy = async (allergyId) => {
  const existing = await prisma.allergy.findUnique({ where: { id: allergyId } });
  if (!existing) {
    const error = new Error('Allergy not found');
    error.status = 404;
    throw error;
  }
  return prisma.allergy.delete({ where: { id: allergyId } });
};

module.exports = { getProfile, createProfile, updateProfile, getAllergies, addAllergy, removeAllergy };
