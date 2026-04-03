const userService = require('../services/user.service');

const getAllUsers = async (req, res, next) => {
  try {
    res.status(200).json(await userService.getAllUsers(req.query));
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    res.status(200).json(await userService.getUserById(req.params.id));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    res.status(200).json(await userService.updateUser(req.params.id, req.body));
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.id, req.ip);
    res.status(204).send();
  } catch (err) { next(err); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    res.status(200).json(await userService.updateUserStatus(req.params.id, req.body.status, req.user.id, req.ip));
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    await userService.resetPassword(req.params.id, req.body.newPassword, req.user.id, req.ip);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updateUserStatus, resetPassword };
