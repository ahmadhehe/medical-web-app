import api from './api';

export const getSettings = () => api.get('/settings');
export const updateSetting = (key, value) => api.put(`/settings/${key}`, { value });
export const deleteSetting = (key) => api.delete(`/settings/${key}`);
