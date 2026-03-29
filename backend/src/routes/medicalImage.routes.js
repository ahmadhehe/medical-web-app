const router = require('express').Router();
const medicalImageController = require('../controllers/medicalImage.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET    /api/medical-images/patient/:patientId  - list images for a patient
// POST   /api/medical-images                     - upload a new image record
// GET    /api/medical-images/:id                 - get image by id
// DELETE /api/medical-images/:id                 - delete image

// AI findings
// GET  /api/medical-images/:id/findings          - get AI findings for an image
// POST /api/medical-images/:id/findings          - save AI findings

// Radiological notes
// GET  /api/medical-images/:id/radiology-notes   - get doctor notes
// POST /api/medical-images/:id/radiology-notes   - add doctor note
// PUT  /api/medical-images/:id/radiology-notes/:nid - update note

router.get('/patient/:patientId',  authenticate, medicalImageController.getImagesByPatient);
router.post('/',                   authenticate, authorize('doctor', 'admin'), medicalImageController.createImage);
router.get('/:id',                 authenticate, medicalImageController.getImageById);
router.delete('/:id',              authenticate, authorize('doctor', 'admin'), medicalImageController.deleteImage);

router.get('/:id/findings',        authenticate, medicalImageController.getFindings);
router.post('/:id/findings',       authenticate, authorize('doctor'), medicalImageController.saveFindings);

router.get('/:id/radiology-notes',        authenticate, medicalImageController.getRadiologyNotes);
router.post('/:id/radiology-notes',       authenticate, authorize('doctor'), medicalImageController.addRadiologyNote);
router.put('/:id/radiology-notes/:nid',   authenticate, authorize('doctor'), medicalImageController.updateRadiologyNote);

module.exports = router;
