<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" />
  <img src="https://img.shields.io/badge/Roboflow-6706CE?style=for-the-badge&logo=roboflow&logoColor=white" />
</p>

<h1 align="center">MediConnect</h1>

<p align="center">
  <strong>A full-stack medical management platform that unifies clinic operations and patient care.</strong><br/>
  AI-powered pre-screening &bull; X-ray anomaly detection &bull; Role-based dashboards &bull; Audit system
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Integrations](#ai-integrations)
- [Workflows](#workflows)
- [Database Schema](#database-schema)
- [Team](#team)

---

## Features

**Patient Portal**
- Self-registration with medical profile (blood type, conditions, allergies)
- AI-powered symptom pre-screening with conversational Gemini chatbot
- Automated urgency assessment & doctor specialization suggestions
- Real-time notifications on appointment status changes

**Doctor Dashboard**
- Daily schedule view with patient queue
- Full patient history: profile, allergies, vitals, AI screening results
- X-ray upload with automatic anomaly detection (14 chest conditions)
- Annotated output images with bounding boxes & confidence scores
- Consultation notes & appointment status management

**Admin Panel**
- Dashboard KPIs: user counts, appointment stats, recent alerts
- User management with role/status/department filters & search
- Department-wise user organization
- Complete audit trail with CSV export
- System health monitoring (DB, memory, uptime)
- Key-value system settings

---

## Tech Stack

| Layer | Technology | Purpose |
|:---:|---|---|
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | PostgreSQL (Supabase) | Persistent storage |
| **ORM** | Prisma | Type-safe database access |
| **Auth** | bcryptjs + JWT | Password hashing & token auth |
| **AI Screening** | Google Gemini 2.5 Flash | Conversational symptom assessment (SSE streaming) |
| **X-Ray Detection** | Roboflow Serverless API | NIH Chest X-ray 14 object detection |
| **Image Processing** | Sharp | Bounding box annotation on X-rays |
| **File Upload** | Multer | Multipart form handling (10MB limit) |
| **Frontend** | React 18 + Vite | Single-page application |

---

## Project Structure

```
medical-web-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # 13 models, 9 enums
│   ├── uploads/                        # Original uploaded images
│   ├── output/                         # AI-annotated images (bounding boxes)
│   └── src/
│       ├── app.js                      # Express app + route mounting
│       ├── server.js                   # Entry point
│       ├── lib/
│       │   ├── prisma.js               # Prisma client singleton
│       │   └── upload.js               # Multer config (JPEG/PNG/WebP/PDF)
│       ├── routes/                     # 13 route files
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── patient.routes.js
│       │   ├── doctor.routes.js
│       │   ├── appointment.routes.js
│       │   ├── screening.routes.js
│       │   ├── medicalImage.routes.js
│       │   ├── vital.routes.js
│       │   ├── notification.routes.js
│       │   ├── audit.routes.js
│       │   ├── adminStats.routes.js
│       │   ├── systemHealth.routes.js
│       │   └── settings.routes.js
│       ├── controllers/                # Request/response handling
│       ├── services/                   # Business logic & DB operations
│       └── middleware/
│           ├── auth.middleware.js       # JWT verification
│           ├── role.middleware.js       # Role-based access control
│           └── error.middleware.js      # Global error handler
└── frontend/
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── auth/                   # Login, Register
        │   ├── patient/                # Medical Profile, AI Screening, Results
        │   ├── doctor/                 # Dashboard, Patient Detail, X-Ray Viewer
        │   └── admin/                  # Dashboard, User Management, Audit Logs
        └── services/                   # Axios API wrappers
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- A **[Supabase](https://supabase.com)** project (free tier works)

### Installation

```bash
# 1. Clone
git clone <repo-url>
cd medical-web-app

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Set up environment (see section below)
cp .env.example backend/.env

# 4. Run database migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 5. Start
cd backend && node src/server.js        # API at http://localhost:5000
cd frontend && npm run dev              # UI at http://localhost:3000
```

---

## Environment Variables

Create `backend/.env`:

```env
# Database (from Supabase > Settings > Database > Connection string)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Auth
JWT_SECRET="your-long-random-secret"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# AI Services
GEMINI_API_KEY="your-gemini-api-key"
ROBOFLOW_API_KEY="your-roboflow-api-key"
ROBOFLOW_MODEL_ID="x-ray-3h2z9/2"
```

---

## API Reference

> Base URL: `http://localhost:5000/api`
> Auth: `Authorization: Bearer <token>` on all protected routes

### Authentication

```
POST /auth/register          Register a new user (public)
POST /auth/login             Login and receive JWT (public)
```

### Patient Profile

```
GET    /patients/:id/profile          Get patient profile
POST   /patients/:id/profile          Create profile              [Patient]
PUT    /patients/:id/profile          Update profile              [Patient, Doctor]
GET    /patients/:id/allergies        List allergies
POST   /patients/:id/allergies        Add allergy                 [Patient, Doctor]
DELETE /patients/:id/allergies/:aid   Remove allergy              [Patient, Doctor]
```

### Doctors

```
GET    /doctors                       List all doctors
POST   /doctors/:id/profile           Create doctor profile       [Doctor, Admin]
GET    /doctors/:id/profile           Get doctor profile
PUT    /doctors/:id/profile           Update doctor profile       [Doctor, Admin]
GET    /doctors/:id/schedule          Get today's schedule        [Doctor, Admin]
```

### Appointments

```
GET    /appointments                  List (scoped by role, filters: status, date)
POST   /appointments                  Book appointment            [Patient]
GET    /appointments/:id              Get detail (+ notes, vitals, screenings)
PUT    /appointments/:id              Update appointment
DELETE /appointments/:id              Delete                      [Admin]
PATCH  /appointments/:id/status       Update status (auto-notifies patient)  [Doctor]
GET    /appointments/:id/notes        Get consultation notes
POST   /appointments/:id/notes        Add note                    [Doctor]
PUT    /appointments/:id/notes/:nid   Update note                 [Doctor]
```

### AI Screenings (Gemini)

```
POST   /screenings/start              Start screening session     [Patient]
POST   /screenings/:id/message        Send message (SSE stream)   [Patient]
POST   /screenings/:id/finalize       Generate assessment         [Patient]
GET    /screenings/:id                Get screening result
GET    /screenings/patient/:pid       Get all screenings for patient
```

### Medical Images & X-Ray Detection (Roboflow)

```
POST   /medical-images                Upload image (multipart)    [Doctor, Admin]
GET    /medical-images/patient/:pid   List images for patient
GET    /medical-images/:id            Get image (+ findings + notes)
DELETE /medical-images/:id            Delete image                [Doctor, Admin]
GET    /medical-images/:id/findings   Get AI findings
POST   /medical-images/:id/findings   Save findings               [Doctor]
GET    /medical-images/:id/radiology-notes      Get radiology notes
POST   /medical-images/:id/radiology-notes      Add note          [Doctor]
PUT    /medical-images/:id/radiology-notes/:nid Update note       [Doctor]
```

### Vitals

```
GET    /vitals/patient/:pid           Get all vitals for patient
POST   /vitals                        Record vitals               [Doctor]
GET    /vitals/:id                    Get vitals by ID
PUT    /vitals/:id                    Update vitals               [Doctor]
DELETE /vitals/:id                    Delete vitals               [Doctor, Admin]
```

### Notifications

```
GET    /notifications                 Get user's notifications
PATCH  /notifications/read-all        Mark all as read
PATCH  /notifications/:id/read        Mark one as read
DELETE /notifications/:id             Delete notification
```

### Audit Logs

```
GET    /audit-logs                    List logs (filters: actorId, actionType, targetType, dates)  [Admin]
GET    /audit-logs/export             Export as CSV                [Admin]
```

### Admin Dashboard

```
GET    /admin/stats                   KPIs: users, appointments, screenings, alerts  [Admin]
```

### System Health

```
GET    /system/health                 DB status, latency, memory, uptime, table counts  [Admin]
```

### Settings

```
GET    /settings                      Get all settings            [Admin]
GET    /settings/:key                 Get single setting          [Admin]
PUT    /settings/:key                 Create/update setting       [Admin]
PUT    /settings/bulk                 Bulk upsert                 [Admin]
DELETE /settings/:key                 Delete setting              [Admin]
```

### User Management

```
GET    /users                         List all (filters: role, status, department, search)  [Admin]
GET    /users/departments             List departments with counts  [Admin]
GET    /users/departments/:dept       Users in department         [Admin]
GET    /users/:id                     Get user detail
PUT    /users/:id                     Update user
DELETE /users/:id                     Delete user                 [Admin]
PATCH  /users/:id/status              Activate/deactivate         [Admin]
POST   /users/:id/reset-password      Reset password              [Admin]
```

---

## AI Integrations

### 1. Gemini Pre-Screening

Conversational AI chatbot that conducts patient symptom assessments.

| Step | What Happens |
|---|---|
| `POST /screenings/start` | Gemini greets the patient and asks opening question |
| `POST /screenings/:id/message` | Patient replies; Gemini streams follow-up questions via SSE |
| `POST /screenings/:id/finalize` | Gemini generates structured JSON assessment |

**Assessment output:**
```json
{
  "severity": "moderate",
  "urgencyLevel": "high",
  "preliminaryAssessment": "Patient presents with chest tightness and cough...",
  "suggestedSpecialization": "Pulmonologist",
  "priorityTimeframe": "Within 24 hours"
}
```

### 2. Roboflow X-Ray Detection

Automatic chest X-ray anomaly detection using a model trained on the NIH Chest X-ray 14 dataset.

| Step | What Happens |
|---|---|
| Doctor uploads X-ray | Image saved to `uploads/` |
| Base64 sent to Roboflow | `POST https://serverless.roboflow.com/x-ray-3h2z9/2` |
| Predictions returned | Bounding boxes with class labels and confidence scores |
| Annotated image generated | Sharp draws colored boxes + labels, saved to `output/` |
| Results stored in DB | `XrayAiFinding` records with description, confidence, severity |

**Detectable conditions (14 classes):**

| Class | Class | Class |
|---|---|---|
| Atelectasis | Cardiomegaly | Effusion |
| Infiltration | Mass | Nodule |
| Pneumonia | Pneumothorax | Consolidation |
| Edema | Emphysema | Fibrosis |
| Pleural Thickening | Hernia | |

**Example annotated output:**
- Bounding boxes drawn in distinct colors per finding
- Labels show condition name + confidence percentage
- Images with no anomalies get a green "No Anomaly Detected" banner

---

## Workflows

### Workflow 1 &mdash; Patient Registration & AI Pre-Screening
> **Contributor:** Ahmad Murtaza

```
Register --> Login --> Create Profile --> Add Allergies
    --> Start AI Screening --> Chat with Gemini --> Finalize
    --> Receive: severity, urgency, specialization, timeframe
```

### Workflow 2 &mdash; Doctor's Daily Schedule & Patient Review
> **Contributor:** Ahmad Murtaza

```
Login --> View Today's Schedule --> Select Patient
    --> Review: Profile, Allergies, Vitals, AI Screening
    --> Upload X-Ray --> Auto AI Detection + Annotated Image
    --> Add Consultation Notes --> Update Appointment Status
    --> Patient Auto-Notified --> All Actions Audit-Logged
```

### Workflow 3 &mdash; Admin User Management & System Monitoring
> **Contributor:** Fizza Zehra

```
Login --> View Dashboard KPIs (users, appointments, alerts)
    --> Manage Users (filter by role/status/department/search)
    --> Activate/Deactivate Accounts --> Reset Passwords
    --> Review Audit Logs (filter + export CSV)
    --> Monitor System Health --> Manage Settings
```

---

## Database Schema

### Models

| Model | Key Fields | Description |
|---|---|---|
| **User** | fullName, email, role, department, status | All platform users |
| **PatientProfile** | dateOfBirth, gender, bloodType, conditions | Patient medical info |
| **DoctorProfile** | specialization, licenseNumber | Doctor credentials |
| **Appointment** | patientId, doctorId, scheduledAt, status, urgencyLevel | Bookings |
| **AiScreening** | chatHistory, severity, urgencyLevel, suggestedSpecialization | Gemini sessions |
| **ConsultationNote** | appointmentId, doctorId, content | Doctor notes |
| **Vital** | bloodPressure, temperatureC, heartRate, oxygenSat | Patient vitals |
| **MedicalImage** | storagePath, annotatedImagePath, mimeType | Uploaded images |
| **XrayAiFinding** | description, confidence, severity | AI detection results |
| **RadiologicalNote** | imageId, doctorId, content | Doctor radiology notes |
| **Notification** | title, message, type, isRead | User notifications |
| **AuditLog** | actorId, actionType, targetType, description, ipAddress | System audit trail |
| **SystemSetting** | key, value | App configuration |

### Enums

`Role` (patient, doctor, admin, researcher) &bull; `UserStatus` (active, inactive) &bull; `Gender` (male, female, other) &bull; `BloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-) &bull; `AppointmentStatus` (pending, confirmed, completed, rescheduled, cancelled) &bull; `UrgencyLevel` (low, medium, high, emergency) &bull; `Severity` (mild, moderate, severe) &bull; `FindingSeverity` (low, moderate, high) &bull; `NotificationType` (info, warning, urgent, success)

---

## Response Format

**Success:**
```json
{ "id": "uuid", "field": "value" }
```

**Paginated:**
```json
{ "users": [...], "total": 50, "page": 1, "limit": 20 }
```

**Error:**
```json
{ "error": "Message describing what went wrong" }
```

---

## Team

| Name | Roll Number | Contributions |
|---|---|---|
| **Ahmad Murtaza** | 24478 | Workflow 1 & 2, AI integrations (Gemini + Roboflow), Backend architecture |
| **Fizza Zehra** | 26944 | Workflow 3, Admin dashboard, User management, System monitoring |

---

<p align="center">
  Built with Express.js, PostgreSQL, Gemini AI & Roboflow CV
</p>
