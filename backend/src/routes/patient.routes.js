const router = require('express').Router();
const patientController = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET  /api/patients/:id/profile   - get patient profile
// POST /api/patients/:id/profile   - create patient profile
// PUT  /api/patients/:id/profile   - update patient profile

// GET    /api/patients/:id/allergies      - list allergies
// POST   /api/patients/:id/allergies      - add allergy
// DELETE /api/patients/:id/allergies/:aid - remove allergy

router.get('/:id/profile',  authenticate, patientController.getProfile);
router.post('/:id/profile', authenticate, authorize('patient'), patientController.createProfile);
router.put('/:id/profile',  authenticate, authorize('patient', 'doctor'), patientController.updateProfile);

router.get('/:id/allergies',         authenticate, patientController.getAllergies);
router.post('/:id/allergies',        authenticate, authorize('patient', 'doctor'), patientController.addAllergy);
router.delete('/:id/allergies/:aid', authenticate, authorize('patient', 'doctor'), patientController.removeAllergy);

module.exports = router;
