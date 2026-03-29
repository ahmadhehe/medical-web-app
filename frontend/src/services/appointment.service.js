import api from './api';

export const getAppointments    = (params) => api.get('/appointments', { params });
export const createAppointment  = (data)   => api.post('/appointments', data);
export const getAppointmentById = (id)     => api.get(`/appointments/${id}`);
export const updateAppointment  = (id, data) => api.put(`/appointments/${id}`, data);
export const deleteAppointment  = (id)     => api.delete(`/appointments/${id}`);
export const updateStatus       = (id, status) => api.patch(`/appointments/${id}/status`, { status });

export const getNotes   = (id)            => api.get(`/appointments/${id}/notes`);
export const addNote    = (id, data)      => api.post(`/appointments/${id}/notes`, data);
export const updateNote = (id, nid, data) => api.put(`/appointments/${id}/notes/${nid}`, data);
