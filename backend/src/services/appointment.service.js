// TODO: implement appointment CRUD, status updates, and consultation notes

const getAppointments    = async (user, filters) =>       { throw new Error('Not implemented'); };
const createAppointment  = async (data) =>                { throw new Error('Not implemented'); };
const getAppointmentById = async (id) =>                  { throw new Error('Not implemented'); };
const updateAppointment  = async (id, data) =>            { throw new Error('Not implemented'); };
const deleteAppointment  = async (id) =>                  { throw new Error('Not implemented'); };
const updateStatus       = async (id, status, actor) =>   { throw new Error('Not implemented'); };
const getNotes           = async (appointmentId) =>       { throw new Error('Not implemented'); };
const addNote            = async (appointmentId, doctorId, data) => { throw new Error('Not implemented'); };
const updateNote         = async (noteId, data) =>        { throw new Error('Not implemented'); };

module.exports = { getAppointments, createAppointment, getAppointmentById, updateAppointment, deleteAppointment, updateStatus, getNotes, addNote, updateNote };
