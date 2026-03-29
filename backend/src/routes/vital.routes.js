const router = require('express').Router();
const vitalController = require('../controllers/vital.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET  /api/vitals/patient/:patientId   - get all vitals for a patient
// POST /api/vitals                      - record new vitals
// GET  /api/vitals/:id                  - get vitals by id
// PUT  /api/vitals/:id                  - update vitals
// DELETE /api/vitals/:id                - delete vitals record

router.get('/patient/:patientId', authenticate, vitalController.getVitalsByPatient);
router.post('/',                  authenticate, authorize('doctor'), vitalController.createVitals);
router.get('/:id',                authenticate, vitalController.getVitalsById);
router.put('/:id',                authenticate, authorize('doctor'), vitalController.updateVitals);
router.delete('/:id',             authenticate, authorize('doctor', 'admin'), vitalController.deleteVitals);

module.exports = router;
