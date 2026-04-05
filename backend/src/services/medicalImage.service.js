const prisma = require('../lib/prisma');
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');
const { createAuditLog } = require('./audit.service');

// ─── Roboflow X-Ray Detection ────────────────────────────────────────────────
const ROBOFLOW_API_KEY  = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_ID = process.env.ROBOFLOW_MODEL_ID || 'x-ray-3h2z9/2';

// NIH Chest X-ray 14 class labels
const CLASS_LABELS = {
  '0': 'Atelectasis',
  '1': 'Cardiomegaly',
  '2': 'Effusion',
  '3': 'Infiltration',
  '4': 'Mass',
  '5': 'Nodule',
  '6': 'Pneumonia',
  '7': 'Pneumothorax',
  '8': 'Consolidation',
  '9': 'Edema',
  '10': 'Emphysema',
  '11': 'Fibrosis',
  '12': 'Pleural Thickening',
  '13': 'Hernia',
};

const BOX_COLORS = ['#FF0000', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FF6347', '#7FFF00'];

const mapSeverity = (confidence) => {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'moderate';
  return 'low';
};

const drawAnnotatedImage = async (originalPath, predictions, outputPath) => {
  const image = sharp(originalPath);
  const metadata = await image.metadata();
  const imgW = metadata.width;
  const imgH = metadata.height;

  // Build SVG overlay with bounding boxes and labels
  const rects = predictions.map((p, i) => {
    const label = CLASS_LABELS[p.class] || p.class;
    const conf  = Math.round(p.confidence * 100);
    const color = BOX_COLORS[i % BOX_COLORS.length];
    const x = Math.round(p.x - p.width / 2);
    const y = Math.round(p.y - p.height / 2);
    const w = Math.round(p.width);
    const h = Math.round(p.height);

    return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="3"/>
      <rect x="${x}" y="${Math.max(0, y - 22)}" width="${Math.max(w, (label.length + 5) * 8)}" height="22" fill="${color}" opacity="0.85"/>
      <text x="${x + 4}" y="${Math.max(0, y - 22) + 16}" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#000">${label} ${conf}%</text>
    `;
  }).join('');

  const svg = `<svg width="${imgW}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

  await image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile(outputPath);
};

const drawNoAnomalyLabel = async (originalPath, outputPath) => {
  const image = sharp(originalPath);
  const metadata = await image.metadata();
  const imgW = metadata.width;

  const svg = `<svg width="${imgW}" height="40" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${imgW}" height="40" fill="#00C853" opacity="0.85"/>
    <text x="${imgW / 2}" y="27" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle">No Anomaly Detected</text>
  </svg>`;

  await image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile(outputPath);
};

const analyzeXrayWithAI = async (storagePath) => {
  try {
    const filePath = path.join(__dirname, '../../', storagePath);
    const imageBase64 = fs.readFileSync(filePath).toString('base64');

    const url = `https://serverless.roboflow.com/${ROBOFLOW_MODEL_ID}?api_key=${ROBOFLOW_API_KEY}&confidence=0.2`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: imageBase64,
    });

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      return { findings: [{ findingNumber: 1, description: 'No anomalies detected', confidence: 100.0, severity: 'low' }], predictions: [] };
    }

    const findings = data.predictions.map((p, i) => ({
      findingNumber: i + 1,
      description:   `${CLASS_LABELS[p.class] || p.class} detected at (${Math.round(p.x)}, ${Math.round(p.y)})`,
      confidence:    Math.round(p.confidence * 100),
      severity:      mapSeverity(p.confidence),
    }));

    return { findings, predictions: data.predictions };
  } catch (err) {
    console.error('Roboflow API error:', err.message);
    return { findings: [{ findingNumber: 1, description: 'AI analysis unavailable', confidence: 0, severity: 'low' }], predictions: [] };
  }
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
    const { findings, predictions } = await analyzeXrayWithAI(image.storagePath);
    await prisma.xrayAiFinding.createMany({
      data: findings.map((f) => ({ imageId: image.id, ...f })),
    });

    // Draw annotated version (with bounding boxes or "No Anomaly" label)
    const outputDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const originalPath = path.join(__dirname, '../../', image.storagePath);
    const annotatedName = `annotated-${path.basename(image.storagePath)}`;
    const annotatedStoragePath = `/output/${annotatedName}`;
    const annotatedFullPath = path.join(outputDir, annotatedName);

    if (predictions.length > 0) {
      await drawAnnotatedImage(originalPath, predictions, annotatedFullPath);
    } else {
      await drawNoAnomalyLabel(originalPath, annotatedFullPath);
    }

    await prisma.medicalImage.update({
      where: { id: image.id },
      data:  { annotatedImagePath: annotatedStoragePath },
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
