const medicalImageService = require('../services/medicalImage.service');

const getImagesByPatient  = async (req, res, next) => { try { res.status(200).json(await medicalImageService.getImagesByPatient(req.params.patientId)); } catch (err) { next(err); } };
const getImageById        = async (req, res, next) => { try { res.status(200).json(await medicalImageService.getImageById(req.params.id)); } catch (err) { next(err); } };
const deleteImage         = async (req, res, next) => { try { await medicalImageService.deleteImage(req.params.id, req.user.id, req.ip); res.status(204).send(); } catch (err) { next(err); } };

const createImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const data = {
      patientId:     req.body.patientId,
      appointmentId: req.body.appointmentId ?? null,
      fileName:      req.file.originalname,
      storagePath:   `/uploads/${req.file.filename}`,
      mimeType:      req.file.mimetype,
    };
    res.status(201).json(await medicalImageService.createImage(data, req.user.id, req.ip));
  } catch (err) { next(err); }
};

const getFindings         = async (req, res, next) => { try { res.status(200).json(await medicalImageService.getFindings(req.params.id)); } catch (err) { next(err); } };
const saveFindings        = async (req, res, next) => { try { res.status(201).json(await medicalImageService.saveFindings(req.params.id, req.body)); } catch (err) { next(err); } };
const getRadiologyNotes   = async (req, res, next) => { try { res.status(200).json(await medicalImageService.getRadiologyNotes(req.params.id)); } catch (err) { next(err); } };
const addRadiologyNote    = async (req, res, next) => { try { res.status(201).json(await medicalImageService.addRadiologyNote(req.params.id, req.user.id, req.body, req.ip)); } catch (err) { next(err); } };
const updateRadiologyNote = async (req, res, next) => { try { res.status(200).json(await medicalImageService.updateRadiologyNote(req.params.nid, req.body, req.user.id, req.ip)); } catch (err) { next(err); } };

module.exports = { getImagesByPatient, createImage, getImageById, deleteImage, getFindings, saveFindings, getRadiologyNotes, addRadiologyNote, updateRadiologyNote };
