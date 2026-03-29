const router = require('express').Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET    /api/appointments             - list appointments (filtered by role)
// POST   /api/appointments             - create appointment
// GET    /api/appointments/:id         - get appointment by id
// PUT    /api/appointments/:id         - update appointment
// DELETE /api/appointments/:id         - delete appointment
// PATCH  /api/appointments/:id/status  - update appointment status (doctor)

// Consultation notes
// GET  /api/appointments/:id/notes     - get notes for appointment
// POST /api/appointments/:id/notes     - add note (doctor)
// PUT  /api/appointments/:id/notes/:nid - update note (doctor)

router.get('/',    authenticate, appointmentController.getAppointments);
router.post('/',   authenticate, authorize('patient'), appointmentController.createAppointment);
router.get('/:id', authenticate, appointmentController.getAppointmentById);
router.put('/:id', authenticate, appointmentController.updateAppointment);
router.delete('/:id', authenticate, authorize('admin'), appointmentController.deleteAppointment);
router.patch('/:id/status', authenticate, authorize('doctor'), appointmentController.updateStatus);

router.get('/:id/notes',       authenticate, appointmentController.getNotes);
router.post('/:id/notes',      authenticate, authorize('doctor'), appointmentController.addNote);
router.put('/:id/notes/:nid',  authenticate, authorize('doctor'), appointmentController.updateNote);

module.exports = router;
