import api from './api';

export const getAuditLogs    = (params) => api.get('/audit-logs', { params });
export const exportAuditLogs = (params) => api.get('/audit-logs/export', { params, responseType: 'blob' });
