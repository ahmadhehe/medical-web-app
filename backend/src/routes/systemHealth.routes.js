const router = require('express').Router();
const systemHealthController = require('../controllers/systemHealth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET /api/system/health - get system health status (admin only)
router.get('/health', authenticate, authorize('admin'), systemHealthController.getSystemHealth);

module.exports = router;
