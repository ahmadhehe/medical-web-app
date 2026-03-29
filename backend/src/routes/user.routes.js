const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

// GET    /api/users           - list all users (admin only)
// GET    /api/users/:id       - get a user by id
// PUT    /api/users/:id       - update a user
// DELETE /api/users/:id       - delete a user (admin only)
// PATCH  /api/users/:id/status - activate / deactivate (admin only)
// POST   /api/users/:id/reset-password - reset password (admin only)

router.get('/',                   authenticate, authorize('admin'), userController.getAllUsers);
router.get('/:id',                authenticate, userController.getUserById);
router.put('/:id',                authenticate, userController.updateUser);
router.delete('/:id',             authenticate, authorize('admin'), userController.deleteUser);
router.patch('/:id/status',       authenticate, authorize('admin'), userController.updateUserStatus);
router.post('/:id/reset-password',authenticate, authorize('admin'), userController.resetPassword);

module.exports = router;
