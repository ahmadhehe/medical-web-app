const patientService = require('../services/patient.service');

const getProfile    = async (req, res, next) => { try { res.status(200).json(await patientService.getProfile(req.params.id)); } catch (err) { next(err); } };
const createProfile = async (req, res, next) => { try { res.status(201).json(await patientService.createProfile(req.params.id, req.body)); } catch (err) { next(err); } };
const updateProfile = async (req, res, next) => { try { res.status(200).json(await patientService.updateProfile(req.params.id, req.body)); } catch (err) { next(err); } };

const getAllergies  = async (req, res, next) => { try { res.status(200).json(await patientService.getAllergies(req.params.id)); } catch (err) { next(err); } };
const addAllergy   = async (req, res, next) => { try { res.status(201).json(await patientService.addAllergy(req.params.id, req.body)); } catch (err) { next(err); } };
const removeAllergy = async (req, res, next) => { try { await patientService.removeAllergy(req.params.aid); res.status(204).send(); } catch (err) { next(err); } };

module.exports = { getProfile, createProfile, updateProfile, getAllergies, addAllergy, removeAllergy };
