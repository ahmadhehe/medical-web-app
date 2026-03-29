import api from './api';

export const getProfile    = (id)         => api.get(`/patients/${id}/profile`);
export const createProfile = (id, data)   => api.post(`/patients/${id}/profile`, data);
export const updateProfile = (id, data)   => api.put(`/patients/${id}/profile`, data);

export const getAllergies  = (id)         => api.get(`/patients/${id}/allergies`);
export const addAllergy    = (id, data)   => api.post(`/patients/${id}/allergies`, data);
export const removeAllergy = (id, aid)    => api.delete(`/patients/${id}/allergies/${aid}`);
