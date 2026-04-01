const router = require('express').Router();
const screeningController = require('../controllers/screening.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// POST /api/screenings/start           - start a new screening session
// POST /api/screenings/:id/message     - send a message, get streamed Gemini reply
// POST /api/screenings/:id/finalize    - finalize session, generate & save assessment
// GET  /api/screenings/:id             - get a completed screening by id
// GET  /api/screenings/patient/:patientId - get all screenings for a patient

router.post('/start',                   authenticate, authorize('patient'), screeningController.startScreening);
router.post('/:id/message',             authenticate, authorize('patient'), screeningController.sendMessage);
router.post('/:id/finalize',            authenticate, authorize('patient'), screeningController.finalizeScreening);
router.get('/patient/:patientId',       authenticate, screeningController.getScreeningsByPatient);
router.get('/:id',                      authenticate, screeningController.getScreeningById);

module.exports = router;
