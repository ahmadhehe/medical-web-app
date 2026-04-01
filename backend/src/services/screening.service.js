const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../lib/prisma');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a medical pre-screening assistant for MediConnect, a clinic management platform.
Your job is to conduct a friendly, concise symptom screening with the patient.
Ask one focused question at a time about their symptoms, duration, severity, and relevant medical context.
Do not diagnose. Do not prescribe. Keep responses short and conversational.
After 4-6 exchanges you will have enough information — do not keep asking indefinitely.
Always be empathetic and professional.`;

const FINALIZE_PROMPT = `Based on the conversation so far, generate a structured medical pre-screening assessment.
Respond with ONLY valid JSON in exactly this format, no markdown, no extra text:
{
  "severity": "mild or moderate or severe",
  "urgencyLevel": "low or medium or high or emergency",
  "preliminaryAssessment": "2-3 sentence summary of the patient condition",
  "suggestedSpecialization": "e.g. General Practitioner, Pulmonologist, Cardiologist",
  "priorityTimeframe": "e.g. Within 24 hours, Within 48 hours, Within a week, Immediate"
}`;

// The hidden system-level user turn that seeds the conversation
const SEED_USER_TURN = 'Greet the patient warmly and ask them what brings them in today.';

// Converts our stored chatHistory into Gemini's required format.
// Gemini requires history to strictly alternate user→model starting with user.
// We prepend the hidden seed turn so the opening assistant message is valid.
const toGeminiHistory = (chatHistory) => {
  const seed = [
    { role: 'user',  parts: [{ text: SEED_USER_TURN }] },
    { role: 'model', parts: [{ text: chatHistory[0].content }] },
  ];
  const rest = chatHistory.slice(1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
  return [...seed, ...rest];
};

// Start a new session — gets opening message from Gemini and saves session
const startScreening = async (patientId) => {
  const user = await prisma.user.findUnique({ where: { id: patientId } });
  if (!user) {
    const error = new Error('Patient not found');
    error.status = 404;
    throw error;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
  });

  const chat = model.startChat({ history: [] });
  const opening = await chat.sendMessage(SEED_USER_TURN);
  const openingText = opening.response.text();

  const session = await prisma.aiScreening.create({
    data: {
      patientId,
      chatHistory: [{ role: 'assistant', content: openingText }],
    },
  });

  return { sessionId: session.id, message: openingText };
};

// Send a user message — streams Gemini reply back via SSE
const sendMessage = async (sessionId, userMessage, res) => {
  const session = await prisma.aiScreening.findUnique({ where: { id: sessionId } });
  if (!session) {
    const error = new Error('Screening session not found');
    error.status = 404;
    throw error;
  }
  if (session.preliminaryAssessment) {
    const error = new Error('This screening session has already been finalized');
    error.status = 400;
    throw error;
  }

  const history = session.chatHistory || [];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
  });

  const chat = model.startChat({ history: toGeminiHistory(history) });
  const streamResult = await chat.sendMessageStream(userMessage);

  let fullReply = '';
  for await (const chunk of streamResult.stream) {
    const chunkText = chunk.text();
    fullReply += chunkText;
    res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
  }

  const updatedHistory = [
    ...history,
    { role: 'user',      content: userMessage },
    { role: 'assistant', content: fullReply },
  ];

  await prisma.aiScreening.update({
    where: { id: sessionId },
    data: { chatHistory: updatedHistory },
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
};

// Finalize — ask Gemini to summarize and save the assessment
const finalizeScreening = async (sessionId) => {
  const session = await prisma.aiScreening.findUnique({ where: { id: sessionId } });
  if (!session) {
    const error = new Error('Screening session not found');
    error.status = 404;
    throw error;
  }
  if (session.preliminaryAssessment) {
    const error = new Error('This screening session has already been finalized');
    error.status = 400;
    throw error;
  }

  const history = session.chatHistory || [];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
  });

  const chat = model.startChat({ history: toGeminiHistory(history) });
  const result = await chat.sendMessage(FINALIZE_PROMPT);
  const raw = result.response.text().trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let assessment;
  try {
    assessment = JSON.parse(raw);
  } catch {
    const error = new Error('Failed to parse AI assessment response');
    error.status = 500;
    throw error;
  }

  return prisma.aiScreening.update({
    where: { id: sessionId },
    data: {
      severity:                assessment.severity,
      urgencyLevel:            assessment.urgencyLevel,
      preliminaryAssessment:   assessment.preliminaryAssessment,
      suggestedSpecialization: assessment.suggestedSpecialization,
      priorityTimeframe:       assessment.priorityTimeframe,
    },
  });
};

const getScreeningById = async (id) => {
  const screening = await prisma.aiScreening.findUnique({
    where: { id },
    include: { patient: { select: { id: true, fullName: true, email: true } } },
  });
  if (!screening) {
    const error = new Error('Screening not found');
    error.status = 404;
    throw error;
  }
  return screening;
};

const getScreeningsByPatient = async (patientId) => {
  const user = await prisma.user.findUnique({ where: { id: patientId } });
  if (!user) {
    const error = new Error('Patient not found');
    error.status = 404;
    throw error;
  }
  return prisma.aiScreening.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = { startScreening, sendMessage, finalizeScreening, getScreeningById, getScreeningsByPatient };
