import api from './api';

export const getHealth = () => api.get('/system/health');
