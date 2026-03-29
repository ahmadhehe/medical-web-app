import api from './api';

export const createScreening        = (data)      => api.post('/screenings', data);
export const getScreeningById       = (id)        => api.get(`/screenings/${id}`);
export const getScreeningsByPatient = (patientId) => api.get(`/screenings/patient/${patientId}`);
