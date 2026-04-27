import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = {
  admin: [
    { to: '/admin/dashboard',  icon: 'dashboard',   label: 'Dashboard' },
    { to: '/admin/users',      icon: 'group',        label: 'User Management' },
    { to: '/admin/audit-logs', icon: 'history_edu',  label: 'Audit Logs' },
  ],
  doctor: [
    { to: '/doctor/dashboard',     icon: 'dashboard',      label: 'Dashboard' },
    { to: '/doctor/schedule',      icon: 'calendar_today', label: 'My Schedule' },
    { to: '/doctor/patients',      icon: 'group',          label: 'Patients' },
    { to: '/doctor/records',       icon: 'description',    label: 'Medical Records' },
    { to: '/doctor/notifications', icon: 'notifications',  label: 'Notifications', dot: true },
    { to: '/doctor/audit-log',     icon: 'history_edu',    label: 'Audit Log' },
    { to: '/doctor/settings',      icon: 'settings',       label: 'Settings' },
  ],
  patient: [
    { to: '/patient/profile',   icon: 'person',    label: 'My Profile' },
    { to: '/patient/screening', icon: 'smart_toy', label: 'AI Screening' },
  ],
};

const SIDEBAR_BG = {
  admin:   '#1e293b',
  doctor:  '#0F4C45',
  patient: '#1e293b',
};

const ROLE_LABEL = {
  admin:   'Administrator',
  doctor:  'Doctor',
  patient: 'Patient',
};

export default function DashboardLayout({ hasUnread = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_LINKS[user?.role] ?? [];
  const bg = SIDEBAR_BG[user?.role] ?? '#1e293b';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden font-display bg-background-light dark:bg-background-dark">
      {/* ── Sidebar ── */}
      <aside
        className="w-[220px] shrink-0 flex flex-col justify-between py-6"
        style={{ backgroundColor: bg }}
      >
        <div>
          <div className="px-6 mb-8 flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1">
              <span className="material-symbols-outlined text-white">medical_services</span>
            </div>
            <h1 className="text-white font-bold text-lg tracking-tight">MediConnect</h1>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map(({ to, icon, label, dot }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  'flex items-center gap-3 px-6 py-3 transition-colors relative ' +
                  (isActive
                    ? 'text-white bg-white/10 border-l-4 border-primary'
                    : 'text-white/70 hover:text-white hover:bg-white/5')
                }
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
                {dot && hasUnread && (
                  <span className="absolute right-6 top-3.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
            <div className="size-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-white font-bold shrink-0">
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.fullName ?? 'User'}</p>
              <p className="text-white/50 text-[10px] truncate">{ROLE_LABEL[user?.role] ?? user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-white/60 hover:text-white p-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
