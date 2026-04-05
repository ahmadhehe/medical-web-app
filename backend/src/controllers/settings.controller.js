const settingsService = require('../services/settings.service');

const getAllSettings = async (req, res, next) => {
  try {
    res.status(200).json(await settingsService.getAllSettings());
  } catch (err) { next(err); }
};

const getSetting = async (req, res, next) => {
  try {
    res.status(200).json(await settingsService.getSetting(req.params.key));
  } catch (err) { next(err); }
};

const upsertSetting = async (req, res, next) => {
  try {
    res.status(200).json(await settingsService.upsertSetting(req.params.key, req.body.value, req.user.id, req.ip));
  } catch (err) { next(err); }
};

const upsertMany = async (req, res, next) => {
  try {
    res.status(200).json(await settingsService.upsertMany(req.body.settings, req.user.id, req.ip));
  } catch (err) { next(err); }
};

const deleteSetting = async (req, res, next) => {
  try {
    await settingsService.deleteSetting(req.params.key, req.user.id, req.ip);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { getAllSettings, getSetting, upsertSetting, upsertMany, deleteSetting };
