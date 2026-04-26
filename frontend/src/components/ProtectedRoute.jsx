import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  patient: '/patient/profile',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};

export default function ProtectedRoute({ roles }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
  }

  return <Outlet />;
}
