const router = require('express').Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET /api/audit-logs         - list audit logs (admin only, with filters)
// GET /api/audit-logs/export  - export audit logs as CSV (admin only)

router.get('/',        authenticate, authorize('admin', 'doctor'), auditController.getAuditLogs);
router.get('/export',  authenticate, authorize('admin', 'doctor'), auditController.exportAuditLogs);

module.exports = router;
