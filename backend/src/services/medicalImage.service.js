// TODO: implement medical image CRUD, AI findings, and radiological notes

const getImagesByPatient  = async (patientId) =>                     { throw new Error('Not implemented'); };
const createImage         = async (data) =>                          { throw new Error('Not implemented'); };
const getImageById        = async (id) =>                            { throw new Error('Not implemented'); };
const deleteImage         = async (id) =>                            { throw new Error('Not implemented'); };
const getFindings         = async (imageId) =>                       { throw new Error('Not implemented'); };
const saveFindings        = async (imageId, data) =>                 { throw new Error('Not implemented'); };
const getRadiologyNotes   = async (imageId) =>                       { throw new Error('Not implemented'); };
const addRadiologyNote    = async (imageId, doctorId, data) =>       { throw new Error('Not implemented'); };
const updateRadiologyNote = async (noteId, data) =>                  { throw new Error('Not implemented'); };

module.exports = { getImagesByPatient, createImage, getImageById, deleteImage, getFindings, saveFindings, getRadiologyNotes, addRadiologyNote, updateRadiologyNote };
