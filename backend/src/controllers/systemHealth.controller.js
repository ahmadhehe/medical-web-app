const systemHealthService = require('../services/systemHealth.service');

const getSystemHealth = async (req, res, next) => {
  try {
    res.status(200).json(await systemHealthService.getSystemHealth());
  } catch (err) { next(err); }
};

module.exports = { getSystemHealth };
