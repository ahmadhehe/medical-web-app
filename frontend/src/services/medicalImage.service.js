import api from './api';

export const getImagesByPatient = (patientId) => api.get(`/medical-images/patient/${patientId}`);
export const createImage        = (data)      => api.post('/medical-images', data);
export const getImageById       = (id)        => api.get(`/medical-images/${id}`);
export const deleteImage        = (id)        => api.delete(`/medical-images/${id}`);

export const getFindings  = (id)      => api.get(`/medical-images/${id}/findings`);
export const saveFindings = (id, data) => api.post(`/medical-images/${id}/findings`, data);

export const getRadiologyNotes   = (id)           => api.get(`/medical-images/${id}/radiology-notes`);
export const addRadiologyNote    = (id, data)     => api.post(`/medical-images/${id}/radiology-notes`, data);
export const updateRadiologyNote = (id, nid, data) => api.put(`/medical-images/${id}/radiology-notes/${nid}`, data);
