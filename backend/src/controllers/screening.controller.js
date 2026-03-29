const screeningService = require('../services/screening.service');

const createScreening       = async (req, res, next) => { try { res.status(201).json(await screeningService.createScreening(req.body)); } catch (err) { next(err); } };
const getScreeningById      = async (req, res, next) => { try { res.status(200).json(await screeningService.getScreeningById(req.params.id)); } catch (err) { next(err); } };
const getScreeningsByPatient = async (req, res, next) => { try { res.status(200).json(await screeningService.getScreeningsByPatient(req.params.patientId)); } catch (err) { next(err); } };

module.exports = { createScreening, getScreeningById, getScreeningsByPatient };
