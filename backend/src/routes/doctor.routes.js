const router = require('express').Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET /api/doctors                - list all doctors
// GET /api/doctors/:id/profile    - get doctor profile
// PUT /api/doctors/:id/profile    - update doctor profile
// GET /api/doctors/:id/schedule   - get today's schedule for a doctor

router.get('/',                authenticate, doctorController.getAllDoctors);
router.get('/:id/profile',     authenticate, doctorController.getProfile);
router.put('/:id/profile',     authenticate, authorize('doctor', 'admin'), doctorController.updateProfile);
router.get('/:id/schedule',    authenticate, authorize('doctor', 'admin'), doctorController.getSchedule);

module.exports = router;
