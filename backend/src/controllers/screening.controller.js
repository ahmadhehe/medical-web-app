const screeningService = require('../services/screening.service');

const startScreening = async (req, res, next) => {
  try {
    const session = await screeningService.startScreening(req.body.patientId);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await screeningService.sendMessage(req.params.id, req.body.message, res);
  } catch (err) {
    next(err);
  }
};

const finalizeScreening = async (req, res, next) => {
  try {
    const result = await screeningService.finalizeScreening(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getScreeningById = async (req, res, next) => {
  try {
    res.status(200).json(await screeningService.getScreeningById(req.params.id));
  } catch (err) {
    next(err);
  }
};

const getScreeningsByPatient = async (req, res, next) => {
  try {
    res.status(200).json(await screeningService.getScreeningsByPatient(req.params.patientId));
  } catch (err) {
    next(err);
  }
};

module.exports = { startScreening, sendMessage, finalizeScreening, getScreeningById, getScreeningsByPatient };
