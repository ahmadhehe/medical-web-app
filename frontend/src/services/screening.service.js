import api from './api';

export const startScreening         = (patientId) => api.post('/screenings/start', { patientId });
export const finalizeScreening      = (id)        => api.post(`/screenings/${id}/finalize`);
export const getScreeningById       = (id)        => api.get(`/screenings/${id}`);
export const getScreeningsByPatient = (patientId) => api.get(`/screenings/patient/${patientId}`);
