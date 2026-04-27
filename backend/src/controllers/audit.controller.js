const auditService = require('../services/audit.service');

// Doctors can only see their own actions; admins see everything.
const scopeFilters = (req) => {
  const filters = { ...req.query };
  if (req.user.role === 'doctor') filters.actorId = req.user.id;
  return filters;
};

const getAuditLogs = async (req, res, next) => {
  try {
    res.status(200).json(await auditService.getAuditLogs(scopeFilters(req)));
  } catch (err) { next(err); }
};

const exportAuditLogs = async (req, res, next) => {
  try {
    const csv = await auditService.exportAuditLogs(scopeFilters(req));
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-logs.csv');
    res.send(csv);
  } catch (err) { next(err); }
};

module.exports = { getAuditLogs, exportAuditLogs };
