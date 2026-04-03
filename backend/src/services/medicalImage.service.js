const prisma = require('../lib/prisma');
const { createAuditLog } = require('./audit.service');

// ─── Roboflow CV stub ─────────────────────────────────────────────────────────
// TODO: Replace this with the real Roboflow API call when the model is ready.
// The real implementation should:
//   1. Send the image file/URL to your Roboflow model endpoint
//   2. Parse the response which contains bounding boxes + labels + confidence
//   3. Return findings in the same format below
const analyzeXrayWithAI = async (storagePath) => {
  return [
    { findingNumber: 1, description: 'Possible opacity in lower lobe', confidence: 74.0, severity: 'moderate' },
    { findingNumber: 2, description: 'Irregular density detected',     confidence: 61.0, severity: 'low' },
    { findingNumber: 3, description: 'Normal cardiac silhouette',      confidence: 98.0, severity: 'low' },
  ];
};
// ─────────────────────────────────────────────────────────────────────────────

const getImagesByPatient = async (patientId) => {
  return prisma.medicalImage.findMany({
    where:   { patientId },
    include: { xrayAiFindings: true },
    orderBy: { uploadedAt: 'desc' },
  });
};

const createImage = async (data, actorId, ipAddress) => {
  const image = await prisma.medicalImage.create({
    data: {
      patientId:     data.patientId,
      appointmentId: data.appointmentId ?? null,
      fileName:      data.fileName,
      storagePath:   data.storagePath,
      mimeType:      data.mimeType,
      uploadedById:  actorId,
    },
  });

  // Auto-run AI analysis if it's an image (not a PDF)
  if (image.mimeType.startsWith('image/')) {
    const findings = await analyzeXrayWithAI(image.storagePath);
    await prisma.xrayAiFinding.createMany({
      data: findings.map((f) => ({ imageId: image.id, ...f })),
    });
  }

  await createAuditLog({
    actorId, actionType: 'CREATE', targetType: 'medical_image',
    targetId: image.id, description: `Medical image uploaded: ${image.fileName}`, ipAddress,
  });

  return prisma.medicalImage.findUnique({
    where:   { id: image.id },
    include: { xrayAiFindings: true },
  });
};

const getImageById = async (id) => {
  const image = await prisma.medicalImage.findUnique({
    where:   { id },
    include: { xrayAiFindings: true, radiologicalNotes: true },
  });
  if (!image) {
    const error = new Error('Image not found');
    error.status = 404;
    throw error;
  }
  return image;
};

const deleteImage = async (id, actorId, ipAddress) => {
  await getImageById(id);
  await prisma.medicalImage.delete({ where: { id } });
  await createAuditLog({
    actorId, actionType: 'DELETE', targetType: 'medical_image',
    targetId: id, description: `Medical image deleted`, ipAddress,
  });
};

const getFindings = async (imageId) => {
  await getImageById(imageId);
  return prisma.xrayAiFinding.findMany({
    where:   { imageId },
    orderBy: { findingNumber: 'asc' },
  });
};

const saveFindings = async (imageId, data) => {
  await getImageById(imageId);
  // Delete existing findings and replace with new ones
  await prisma.xrayAiFinding.deleteMany({ where: { imageId } });
  return prisma.xrayAiFinding.createMany({ data: data.findings.map((f) => ({ imageId, ...f })) });
};

const getRadiologyNotes = async (imageId) => {
  await getImageById(imageId);
  return prisma.radiologicalNote.findMany({
    where:   { imageId },
    include: { doctor: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

const addRadiologyNote = async (imageId, doctorId, data, ipAddress) => {
  await getImageById(imageId);
  const note = await prisma.radiologicalNote.create({
    data:    { imageId, doctorId, content: data.content },
    include: { doctor: { select: { id: true, fullName: true } } },
  });
  await createAuditLog({
    actorId: doctorId, actionType: 'CREATE', targetType: 'radiological_note',
    targetId: note.id, description: `Radiological note added`, ipAddress,
  });
  return note;
};

const updateRadiologyNote = async (noteId, data, actorId, ipAddress) => {
  const existing = await prisma.radiologicalNote.findUnique({ where: { id: noteId } });
  if (!existing) {
    const error = new Error('Radiological note not found');
    error.status = 404;
    throw error;
  }
  const note = await prisma.radiologicalNote.update({
    where:   { id: noteId },
    data:    { content: data.content },
    include: { doctor: { select: { id: true, fullName: true } } },
  });
  await createAuditLog({
    actorId, actionType: 'UPDATE', targetType: 'radiological_note',
    targetId: noteId, description: `Radiological note updated`, ipAddress,
  });
  return note;
};

module.exports = {
  getImagesByPatient, createImage, getImageById, deleteImage,
  getFindings, saveFindings,
  getRadiologyNotes, addRadiologyNote, updateRadiologyNote,
};
