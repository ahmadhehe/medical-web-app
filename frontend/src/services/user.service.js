import api from './api';

export const getAllUsers       = (params) => api.get('/users', { params });
export const getUserById       = (id)     => api.get(`/users/${id}`);
export const updateUser        = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser        = (id)     => api.delete(`/users/${id}`);
export const updateUserStatus  = (id, status) => api.patch(`/users/${id}/status`, { status });
export const resetPassword     = (id, newPassword) => api.post(`/users/${id}/reset-password`, { newPassword });
