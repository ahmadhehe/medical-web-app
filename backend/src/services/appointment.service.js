const prisma = require('../lib/prisma');
const { createAuditLog } = require('./audit.service');
const { sendNotification } = require('./notification.service');

const APPOINTMENT_INCLUDE = {
  patient: { select: { id: true, fullName: true, email: true } },
  doctor:  { select: { id: true, fullName: true, email: true } },
};

const getAppointments = async (user, filters = {}) => {
  const { status, date, page = 1, limit = 20 } = filters;

  const where = {};
  if (user.role === 'patient') where.patientId = user.id;
  if (user.role === 'doctor')  where.doctorId  = user.id;
  if (status) where.status = status;
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    where.scheduledAt = { gte: start, lt: end };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include:  APPOINTMENT_INCLUDE,
      orderBy:  { scheduledAt: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total, page: Number(page), limit: Number(limit) };
};

const createAppointment = async (data, actorId, ipAddress) => {
  const appointment = await prisma.appointment.create({
    data: {
      patientId:    data.patientId,
      doctorId:     data.doctorId,
      scheduledAt:  new Date(data.scheduledAt),
      urgencyLevel: data.urgencyLevel ?? null,
      reason:       data.reason       ?? null,
    },
    include: APPOINTMENT_INCLUDE,
  });
  await createAuditLog({
    actorId, actionType: 'CREATE', targetType: 'appointment',
    targetId: appointment.id, description: `Appointment booked with doctor ${appointment.doctor.fullName}`, ipAddress,
  });
  return appointment;
};

const getAppointmentById = async (id) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      ...APPOINTMENT_INCLUDE,
      consultationNotes: { include: { doctor: { select: { id: true, fullName: true } } } },
      vitals:            true,
      aiScreenings:      true,
    },
  });
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }
  return appointment;
};

const updateAppointment = async (id, data) => {
  await getAppointmentById(id);
  return prisma.appointment.update({
    where: { id },
    data: {
      ...(data.scheduledAt  && { scheduledAt: new Date(data.scheduledAt) }),
      ...(data.urgencyLevel && { urgencyLevel: data.urgencyLevel }),
      ...(data.reason       && { reason: data.reason }),
    },
    include: APPOINTMENT_INCLUDE,
  });
};

const deleteAppointment = async (id, actorId, ipAddress) => {
  await getAppointmentById(id);
  await prisma.appointment.delete({ where: { id } });
  await createAuditLog({
    actorId, actionType: 'DELETE', targetType: 'appointment',
    targetId: id, description: `Appointment deleted`, ipAddress,
  });
};

const updateStatus = async (id, status, actor, ipAddress) => {
  await getAppointmentById(id);
  const appointment = await prisma.appointment.update({
    where: { id },
    data:  { status },
    include: APPOINTMENT_INCLUDE,
  });
  await createAuditLog({
    actorId: actor.id, actionType: 'UPDATE', targetType: 'appointment',
    targetId: id, description: `Appointment status updated to ${status}`, ipAddress,
  });

  const statusMessages = {
    completed:   { title: 'Appointment Completed',   type: 'success', message: `Your appointment with ${appointment.doctor.fullName} has been marked as completed.` },
    rescheduled: { title: 'Appointment Rescheduled', type: 'warning', message: `Your appointment with ${appointment.doctor.fullName} has been rescheduled.` },
    cancelled:   { title: 'Appointment Cancelled',   type: 'warning', message: `Your appointment with ${appointment.doctor.fullName} has been cancelled.` },
    confirmed:   { title: 'Appointment Confirmed',   type: 'info',    message: `Your appointment with ${appointment.doctor.fullName} has been confirmed.` },
  };

  if (statusMessages[status]) {
    await sendNotification({ userId: appointment.patientId, ...statusMessages[status] });
  }

  return appointment;
};

const getNotes = async (appointmentId) => {
  await getAppointmentById(appointmentId);
  return prisma.consultationNote.findMany({
    where:   { appointmentId },
    include: { doctor: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

const addNote = async (appointmentId, doctorId, data, ipAddress) => {
  await getAppointmentById(appointmentId);
  const note = await prisma.consultationNote.create({
    data:    { appointmentId, doctorId, content: data.content },
    include: { doctor: { select: { id: true, fullName: true } } },
  });
  await createAuditLog({
    actorId: doctorId, actionType: 'CREATE', targetType: 'consultation_note',
    targetId: note.id, description: `Consultation note added`, ipAddress,
  });
  return note;
};

const updateNote = async (noteId, data, actorId, ipAddress) => {
  const existing = await prisma.consultationNote.findUnique({ where: { id: noteId } });
  if (!existing) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }
  const note = await prisma.consultationNote.update({
    where: { id: noteId },
    data:  { content: data.content },
    include: { doctor: { select: { id: true, fullName: true } } },
  });
  await createAuditLog({
    actorId, actionType: 'UPDATE', targetType: 'consultation_note',
    targetId: noteId, description: `Consultation note updated`, ipAddress,
  });
  return note;
};

module.exports = {
  getAppointments, createAppointment, getAppointmentById,
  updateAppointment, deleteAppointment, updateStatus,
  getNotes, addNote, updateNote,
};
