// TODO: implement audit log querying and CSV export

const getAuditLogs    = async (filters) => { throw new Error('Not implemented'); };
const exportAuditLogs = async (filters) => { throw new Error('Not implemented'); };

// Helper called internally by other services to write a log entry
const createAuditLog = async ({ actorId, actionType, targetType, targetId, description, ipAddress }) => {
  throw new Error('Not implemented');
};

module.exports = { getAuditLogs, exportAuditLogs, createAuditLog };
