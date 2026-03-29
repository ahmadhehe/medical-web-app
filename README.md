# MediConnect

A full-stack medical management platform that unifies clinic operations and patient care. Features role-based access control for Patients, Doctors, and Admins, AI-powered patient pre-screening, doctor scheduling, and a full admin audit system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (hosted on Supabase) |
| ORM | Prisma |
| Auth | bcryptjs + jsonwebtoken |

---

## Project Structure

```
medical-web-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema & models
│   └── src/
│       ├── app.js              # Express app setup
│       ├── server.js           # Entry point
│       ├── lib/
│       │   └── prisma.js       # Prisma client singleton
│       ├── routes/             # URL definitions
│       ├── controllers/        # Request/response handling
│       ├── services/           # Business logic & DB operations
│       └── middleware/
│           ├── auth.middleware.js   # JWT verification
│           ├── role.middleware.js   # Role-based access control
│           └── error.middleware.js  # Global error handler
└── frontend/
    └── src/
        ├── App.jsx             # Route definitions
        ├── pages/              # One folder per role
        │   ├── auth/
        │   ├── patient/
        │   ├── doctor/
        │   └── admin/
        └── services/           # Axios API wrappers
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project with the database schema applied

### 1. Clone the repository

```bash
git clone <repo-url>
cd medical-web-app
```

### 2. Configure environment variables

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
```

Your `DATABASE_URL` can be found in: **Supabase → Project Settings → Database → Connection string → URI**.

### 3. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 4. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the development servers

From the root directory:

```bash
npm run dev
```

Or individually:

```bash
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:3000
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and receive JWT | Public |

### Users

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users` | List all users (with filters) | Admin |
| GET | `/users/:id` | Get user by ID | Authenticated |
| PUT | `/users/:id` | Update user | Authenticated |
| DELETE | `/users/:id` | Delete user | Admin |
| PATCH | `/users/:id/status` | Activate / deactivate user | Admin |
| POST | `/users/:id/reset-password` | Reset user password | Admin |

### Patients

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/patients/:id/profile` | Get patient profile | Authenticated |
| POST | `/patients/:id/profile` | Create patient profile | Patient |
| PUT | `/patients/:id/profile` | Update patient profile | Patient, Doctor |
| GET | `/patients/:id/allergies` | List allergies | Authenticated |
| POST | `/patients/:id/allergies` | Add allergy | Patient, Doctor |
| DELETE | `/patients/:id/allergies/:aid` | Remove allergy | Patient, Doctor |

### Doctors

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/doctors` | List all doctors | Authenticated |
| GET | `/doctors/:id/profile` | Get doctor profile | Authenticated |
| PUT | `/doctors/:id/profile` | Update doctor profile | Doctor, Admin |
| GET | `/doctors/:id/schedule` | Get doctor's daily schedule | Doctor, Admin |

### Appointments

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/appointments` | List appointments (scoped by role) | Authenticated |
| POST | `/appointments` | Create appointment | Patient |
| GET | `/appointments/:id` | Get appointment by ID | Authenticated |
| PUT | `/appointments/:id` | Update appointment | Authenticated |
| DELETE | `/appointments/:id` | Delete appointment | Admin |
| PATCH | `/appointments/:id/status` | Update appointment status | Doctor |
| GET | `/appointments/:id/notes` | Get consultation notes | Authenticated |
| POST | `/appointments/:id/notes` | Add consultation note | Doctor |
| PUT | `/appointments/:id/notes/:nid` | Update consultation note | Doctor |

### AI Screenings

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/screenings` | Start AI pre-screening session | Patient |
| GET | `/screenings/:id` | Get screening result | Authenticated |
| GET | `/screenings/patient/:patientId` | Get all screenings for a patient | Authenticated |

### Medical Images

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/medical-images/patient/:patientId` | List images for a patient | Authenticated |
| POST | `/medical-images` | Upload image record | Doctor, Admin |
| GET | `/medical-images/:id` | Get image by ID | Authenticated |
| DELETE | `/medical-images/:id` | Delete image | Doctor, Admin |
| GET | `/medical-images/:id/findings` | Get AI findings | Authenticated |
| POST | `/medical-images/:id/findings` | Save AI findings | Doctor |
| GET | `/medical-images/:id/radiology-notes` | Get radiological notes | Authenticated |
| POST | `/medical-images/:id/radiology-notes` | Add radiological note | Doctor |
| PUT | `/medical-images/:id/radiology-notes/:nid` | Update radiological note | Doctor |

### Vitals

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/vitals/patient/:patientId` | Get all vitals for a patient | Authenticated |
| POST | `/vitals` | Record new vitals | Doctor |
| GET | `/vitals/:id` | Get vitals by ID | Authenticated |
| PUT | `/vitals/:id` | Update vitals | Doctor |
| DELETE | `/vitals/:id` | Delete vitals record | Doctor, Admin |

### Notifications

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/notifications` | Get notifications for logged-in user | Authenticated |
| PATCH | `/notifications/read-all` | Mark all notifications as read | Authenticated |
| PATCH | `/notifications/:id/read` | Mark notification as read | Authenticated |
| DELETE | `/notifications/:id` | Delete notification | Authenticated |

### Audit Logs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/audit-logs` | List audit logs (with filters) | Admin |
| GET | `/audit-logs/export` | Export audit logs as CSV | Admin |

---

## Request & Response Format

All endpoints accept and return `application/json`.

**Authentication header:**
```
Authorization: Bearer <token>
```

**Success response:**
```json
{
  "id": "uuid",
  "field": "value"
}
```

**Error response:**
```json
{
  "error": "Message describing what went wrong"
}
```

---

## Key Workflows

### Workflow 1 — Patient Registration & AI Pre-Screening
1. Patient registers at `POST /auth/register` with role `patient`
2. Logs in at `POST /auth/login` to receive a JWT
3. Creates medical profile at `POST /patients/:id/profile`
4. Initiates AI screening at `POST /screenings`
5. Receives urgency level, severity, and suggested specialization in the response

### Workflow 2 — Doctor's Daily Schedule & Patient Review
1. Doctor logs in and fetches today's schedule at `GET /doctors/:id/schedule`
2. Selects a patient and views their profile, allergies, vitals, and screening results
3. Reviews uploaded X-rays with AI findings at `GET /medical-images/:id/findings`
4. Adds consultation notes at `POST /appointments/:id/notes`
5. Updates appointment status at `PATCH /appointments/:id/status`

### Workflow 3 — Admin User Management & Audit Logs
1. Admin views all users at `GET /users` with role/status filters
2. Activates or deactivates accounts at `PATCH /users/:id/status`
3. Resets user passwords at `POST /users/:id/reset-password`
4. Reviews audit logs at `GET /audit-logs` filtered by user, date, and action type
5. Exports logs as CSV at `GET /audit-logs/export`

---

## Group Members

- Ahmad Murtaza (24478)
- Fizza Zehra (26944)
