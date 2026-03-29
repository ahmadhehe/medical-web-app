const appointmentService = require('../services/appointment.service');

const getAppointments    = async (req, res, next) => { try { res.status(200).json(await appointmentService.getAppointments(req.user, req.query)); } catch (err) { next(err); } };
const createAppointment  = async (req, res, next) => { try { res.status(201).json(await appointmentService.createAppointment(req.body)); } catch (err) { next(err); } };
const getAppointmentById = async (req, res, next) => { try { res.status(200).json(await appointmentService.getAppointmentById(req.params.id)); } catch (err) { next(err); } };
const updateAppointment  = async (req, res, next) => { try { res.status(200).json(await appointmentService.updateAppointment(req.params.id, req.body)); } catch (err) { next(err); } };
const deleteAppointment  = async (req, res, next) => { try { await appointmentService.deleteAppointment(req.params.id); res.status(204).send(); } catch (err) { next(err); } };
const updateStatus       = async (req, res, next) => { try { res.status(200).json(await appointmentService.updateStatus(req.params.id, req.body.status, req.user)); } catch (err) { next(err); } };

const getNotes    = async (req, res, next) => { try { res.status(200).json(await appointmentService.getNotes(req.params.id)); } catch (err) { next(err); } };
const addNote     = async (req, res, next) => { try { res.status(201).json(await appointmentService.addNote(req.params.id, req.user.id, req.body)); } catch (err) { next(err); } };
const updateNote  = async (req, res, next) => { try { res.status(200).json(await appointmentService.updateNote(req.params.nid, req.body)); } catch (err) { next(err); } };

module.exports = { getAppointments, createAppointment, getAppointmentById, updateAppointment, deleteAppointment, updateStatus, getNotes, addNote, updateNote };
