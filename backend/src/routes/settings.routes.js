const router = require('express').Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET    /api/settings          - get all settings (admin only)
// GET    /api/settings/:key     - get a single setting by key
// PUT    /api/settings/:key     - create or update a setting
// PUT    /api/settings          - bulk upsert multiple settings
// DELETE /api/settings/:key     - delete a setting

router.get('/',        authenticate, authorize('admin'), settingsController.getAllSettings);
router.put('/bulk',    authenticate, authorize('admin'), settingsController.upsertMany);
router.get('/:key',    authenticate, authorize('admin'), settingsController.getSetting);
router.put('/:key',    authenticate, authorize('admin'), settingsController.upsertSetting);
router.delete('/:key', authenticate, authorize('admin'), settingsController.deleteSetting);

module.exports = router;
