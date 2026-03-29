const auditService = require('../services/audit.service');

const getAuditLogs    = async (req, res, next) => { try { res.status(200).json(await auditService.getAuditLogs(req.query)); } catch (err) { next(err); } };
const exportAuditLogs = async (req, res, next) => { try { const csv = await auditService.exportAuditLogs(req.query); res.header('Content-Type', 'text/csv'); res.attachment('audit-logs.csv'); res.send(csv); } catch (err) { next(err); } };

module.exports = { getAuditLogs, exportAuditLogs };
