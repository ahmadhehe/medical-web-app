const router = require('express').Router();
const medicalImageController = require('../controllers/medicalImage.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const upload           = require('../lib/upload');

router.get('/patient/:patientId',  authenticate, medicalImageController.getImagesByPatient);
router.post('/',                   authenticate, authorize('doctor', 'admin'), upload.single('file'), medicalImageController.createImage);
router.get('/:id',                 authenticate, medicalImageController.getImageById);
router.delete('/:id',              authenticate, authorize('doctor', 'admin'), medicalImageController.deleteImage);

router.get('/:id/findings',        authenticate, medicalImageController.getFindings);
router.post('/:id/findings',       authenticate, authorize('doctor'), medicalImageController.saveFindings);

router.get('/:id/radiology-notes',        authenticate, medicalImageController.getRadiologyNotes);
router.post('/:id/radiology-notes',       authenticate, authorize('doctor'), medicalImageController.addRadiologyNote);
router.put('/:id/radiology-notes/:nid',   authenticate, authorize('doctor'), medicalImageController.updateRadiologyNote);

module.exports = router;
