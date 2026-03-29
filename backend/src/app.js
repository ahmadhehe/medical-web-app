require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes          = require('./routes/auth.routes');
const userRoutes          = require('./routes/user.routes');
const patientRoutes       = require('./routes/patient.routes');
const doctorRoutes        = require('./routes/doctor.routes');
const appointmentRoutes   = require('./routes/appointment.routes');
const screeningRoutes     = require('./routes/screening.routes');
const notificationRoutes  = require('./routes/notification.routes');
const auditRoutes         = require('./routes/audit.routes');
const medicalImageRoutes  = require('./routes/medicalImage.routes');
const vitalRoutes         = require('./routes/vital.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/doctors',       doctorRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/screenings',    screeningRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs',    auditRoutes);
app.use('/api/medical-images',medicalImageRoutes);
app.use('/api/vitals',        vitalRoutes);

app.use(errorHandler);

module.exports = app;
