import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient
import MedicalProfile from './pages/patient/MedicalProfile';
import AiScreening    from './pages/patient/AiScreening';
import ScreeningResults from './pages/patient/ScreeningResults';

// Doctor
import DoctorDashboard  from './pages/doctor/DoctorDashboard';
import PatientsList     from './pages/doctor/PatientsList';
import PatientDetail    from './pages/doctor/PatientDetail';
import XRayViewer       from './pages/doctor/XRayViewer';
import Notifications    from './pages/doctor/Notifications';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import UserDetail     from './pages/admin/UserDetail';
import AuditLogs      from './pages/admin/AuditLogs';

// Shared (audit logs reuses the admin component, role-aware sidebar)
const DoctorAuditLog = AuditLogs;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient */}
        <Route path="/patient/profile"           element={<MedicalProfile />} />
        <Route path="/patient/screening"         element={<AiScreening />} />
        <Route path="/patient/screening/results" element={<ScreeningResults />} />

        {/* Doctor */}
        <Route path="/doctor/dashboard"          element={<DoctorDashboard />} />
        <Route path="/doctor/patients"           element={<PatientsList />} />
        <Route path="/doctor/patients/:id"       element={<PatientDetail />} />
        <Route path="/doctor/xray/:imageId"      element={<XRayViewer />} />
        <Route path="/doctor/notifications"      element={<Notifications />} />
        <Route path="/doctor/audit-log"          element={<DoctorAuditLog />} />

        {/* Admin */}
        <Route path="/admin/dashboard"           element={<AdminDashboard />} />
        <Route path="/admin/users"               element={<UserManagement />} />
        <Route path="/admin/users/:id"           element={<UserDetail />} />
        <Route path="/admin/audit-logs"          element={<AuditLogs />} />

        {/* Default */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
