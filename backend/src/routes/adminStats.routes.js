const router = require('express').Router();
const adminStatsController = require('../controllers/adminStats.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET /api/admin/stats - get dashboard statistics (admin only)
router.get('/stats', authenticate, authorize('admin'), adminStatsController.getDashboardStats);

module.exports = router;
