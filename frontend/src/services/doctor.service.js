import api from './api';

export const getDoctors = () => api.get('/doctors');
export const getSchedule = (doctorId) => api.get(`/doctors/${doctorId}/schedule`);
