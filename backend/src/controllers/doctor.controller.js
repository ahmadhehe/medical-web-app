const doctorService = require('../services/doctor.service');

const getAllDoctors = async (req, res, next) => { try { res.status(200).json(await doctorService.getAllDoctors()); } catch (err) { next(err); } };
const getProfile   = async (req, res, next) => { try { res.status(200).json(await doctorService.getProfile(req.params.id)); } catch (err) { next(err); } };
const updateProfile = async (req, res, next) => { try { res.status(200).json(await doctorService.updateProfile(req.params.id, req.body)); } catch (err) { next(err); } };
const getSchedule  = async (req, res, next) => { try { res.status(200).json(await doctorService.getSchedule(req.params.id)); } catch (err) { next(err); } };

module.exports = { getAllDoctors, getProfile, updateProfile, getSchedule };
