const router = require('express').Router();
const screeningController = require('../controllers/screening.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// POST /api/screenings         - start a new AI screening session
// GET  /api/screenings/:id     - get screening result by id
// GET  /api/screenings/patient/:patientId - get all screenings for a patient

router.post('/',                        authenticate, authorize('patient'), screeningController.createScreening);
router.get('/:id',                      authenticate, screeningController.getScreeningById);
router.get('/patient/:patientId',       authenticate, screeningController.getScreeningsByPatient);

module.exports = router;
