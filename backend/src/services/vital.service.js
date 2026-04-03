const prisma = require('../lib/prisma');

const getVitalsByPatient = async (patientId) => {
  return prisma.vital.findMany({
    where:   { patientId },
    orderBy: { recordedAt: 'desc' },
  });
};

const createVitals = async (data) => {
  return prisma.vital.create({
    data: {
      patientId:     data.patientId,
      appointmentId: data.appointmentId ?? null,
      bloodPressure: data.bloodPressure  ?? null,
      temperatureC:  data.temperatureC   ?? null,
      heartRate:     data.heartRate      ?? null,
      oxygenSat:     data.oxygenSat      ?? null,
    },
  });
};

const getVitalsById = async (id) => {
  const vitals = await prisma.vital.findUnique({ where: { id } });
  if (!vitals) {
    const error = new Error('Vitals record not found');
    error.status = 404;
    throw error;
  }
  return vitals;
};

const updateVitals = async (id, data) => {
  await getVitalsById(id);
  return prisma.vital.update({
    where: { id },
    data: {
      ...(data.bloodPressure !== undefined && { bloodPressure: data.bloodPressure }),
      ...(data.temperatureC  !== undefined && { temperatureC:  data.temperatureC }),
      ...(data.heartRate     !== undefined && { heartRate:     data.heartRate }),
      ...(data.oxygenSat     !== undefined && { oxygenSat:     data.oxygenSat }),
    },
  });
};

const deleteVitals = async (id) => {
  await getVitalsById(id);
  return prisma.vital.delete({ where: { id } });
};

module.exports = { getVitalsByPatient, createVitals, getVitalsById, updateVitals, deleteVitals };
