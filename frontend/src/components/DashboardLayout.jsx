import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = {
  admin: [
    { to: '/admin/dashboard',  icon: 'dashboard',      label: 'Dashboard' },
    { to: '/admin/users',      icon: 'group',           label: 'User Management' },
    { to: '/admin/audit-logs', icon: 'history_edu',     label: 'Audit Logs' },
  ],
  doctor: [
    { to: '/doctor/dashboard',      icon: 'dashboard',     label: 'Dashboard' },
    { to: '/doctor/notifications',  icon: 'notifications', label: 'Notifications' },
  ],
  patient: [
    { to: '/patient/profile',   icon: 'person',    label: 'My Profile' },
    { to: '/patient/screening', icon: 'smart_toy', label: 'AI Screening' },
  ],
};

const ROLE_LABEL = {
  admin:   'Administrator',
  doctor:  'Doctor',
  patient: 'Patient',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_LINKS[user?.role] ?? [];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden font-display bg-background-light dark:bg-background-dark">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-sidebar flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">medical_services</span>
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">MediConnect</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ' +
                (isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5')
              }
            >
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-slate-400 text-xs">{ROLE_LABEL[user?.role] ?? user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
