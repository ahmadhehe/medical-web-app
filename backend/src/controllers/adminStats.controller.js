const adminStatsService = require('../services/adminStats.service');

const getDashboardStats = async (req, res, next) => {
  try {
    res.status(200).json(await adminStatsService.getDashboardStats());
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats };
