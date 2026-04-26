import api from './api';

export const getPatientVitals = (patientId) => api.get(`/vitals/patient/${patientId}`);
export const addVital = (data) => api.post('/vitals', data);
