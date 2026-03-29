const vitalService = require('../services/vital.service');

const getVitalsByPatient = async (req, res, next) => { try { res.status(200).json(await vitalService.getVitalsByPatient(req.params.patientId)); } catch (err) { next(err); } };
const createVitals       = async (req, res, next) => { try { res.status(201).json(await vitalService.createVitals(req.body)); } catch (err) { next(err); } };
const getVitalsById      = async (req, res, next) => { try { res.status(200).json(await vitalService.getVitalsById(req.params.id)); } catch (err) { next(err); } };
const updateVitals       = async (req, res, next) => { try { res.status(200).json(await vitalService.updateVitals(req.params.id, req.body)); } catch (err) { next(err); } };
const deleteVitals       = async (req, res, next) => { try { await vitalService.deleteVitals(req.params.id); res.status(204).send(); } catch (err) { next(err); } };

module.exports = { getVitalsByPatient, createVitals, getVitalsById, updateVitals, deleteVitals };
