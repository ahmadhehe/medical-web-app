import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSchedule } from '../../services/doctor.service';
import { getNotifications } from '../../services/notification.service';

const NAV_ITEMS = [
  { to: '/doctor/dashboard',     icon: 'dashboard',       label: 'Dashboard' },
  { to: '/doctor/schedule',      icon: 'calendar_today',  label: 'My Schedule' },
  { to: '/doctor/patients',      icon: 'group',           label: 'Patients' },
  { to: '/doctor/records',       icon: 'description',     label: 'Medical Records' },
  { to: '/doctor/notifications', icon: 'notifications',   label: 'Notifications', dot: true },
  { to: '/doctor/audit-log',     icon: 'history_edu',     label: 'Audit Log' },
  { to: '/doctor/settings',      icon: 'settings',        label: 'Settings' },
];

const URGENT_LEVELS = new Set(['high', 'emergency']);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 22) return 'Good Evening';
  return 'Good Night';
}

function formatDate(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const STATUS_BADGE = {
  pending:     { label: 'Upcoming',    cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-slate-400' },
  confirmed:   { label: 'In Progress', cls: 'bg-primary/10 text-primary',                                       dot: 'bg-primary' },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-600' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500', dot: 'bg-slate-400' },
};

const URGENT_BADGE = {
  label: 'Urgent',
  cls:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  dot:   'bg-red-600',
};

const NOTIF_ICON = {
  info:    { icon: 'calendar_month', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  success: { icon: 'task_alt',       cls: 'bg-green-100 dark:bg-green-900/30 text-green-600'   },
  warning: { icon: 'lab_profile',    cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'      },
  urgent:  { icon: 'warning',        cls: 'bg-red-100 dark:bg-red-900/30 text-red-600'         },
};

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    setLoading(true);
    Promise.all([getSchedule(user.id), getNotifications()])
      .then(([sched, notif]) => {
        if (!alive) return;
        setAppointments(Array.isArray(sched.data) ? sched.data : []);
        setNotifications(Array.isArray(notif.data) ? notif.data : []);
      })
      .catch((err) => {
        if (!alive) return;
        toast(err.response?.data?.error ?? 'Failed to load dashboard', 'error');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user?.id, toast]);

  const stats = useMemo(() => {
    const todays    = appointments.length;
    const pending   = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
    const newRecords = new Set(
      appointments.flatMap((a) => (a.aiScreenings ?? []).map((s) => s.id)),
    ).size;
    const urgent = appointments.filter(
      (a) => URGENT_LEVELS.has(a.urgencyLevel) ||
             (a.aiScreenings?.[0]?.urgencyLevel && URGENT_LEVELS.has(a.aiScreenings[0].urgencyLevel)) ||
             a.aiScreenings?.[0]?.severity === 'severe',
    ).length;
    return { todays, pending, newRecords, urgent };
  }, [appointments]);

  const flagged = useMemo(
    () => appointments
      .filter((a) => {
        const s = a.aiScreenings?.[0];
        if (!s) return false;
        return s.severity === 'severe' || URGENT_LEVELS.has(s.urgencyLevel);
      })
      .slice(0, 4),
    [appointments],
  );

  const recentNotifs = notifications.slice(0, 4);
  const hasUnread    = notifications.some((n) => !n.isRead);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex min-h-screen font-display">
      {/* Sidebar */}
      <aside
        className="w-[220px] fixed h-full flex flex-col justify-between py-6 z-20"
        style={{ backgroundColor: '#0F4C45' }}
      >
        <div>
          <div className="px-6 mb-8 flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1">
              <span className="material-symbols-outlined text-white">medical_services</span>
            </div>
            <h1 className="text-white font-bold text-lg tracking-tight">MediConnect</h1>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, icon, label, dot }) => (
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
              {user?.fullName?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.fullName ?? 'Doctor'}</p>
              <p className="text-white/50 text-[10px] truncate">{user?.department ?? 'Doctor'}</p>
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

      {/* Main */}
      <main className="flex-1 ml-[220px] flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-slate-900 dark:text-slate-100 font-bold text-lg">
              {greeting()}, {user?.fullName ? `Dr. ${user.fullName.split(' ').slice(-1)[0]}` : 'Doctor'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(new Date())}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                placeholder="Search patients, records..."
                type="text"
              />
            </div>
            <button
              onClick={() => navigate('/doctor/notifications')}
              className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {user?.fullName?.[0]?.toUpperCase() ?? 'D'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="event_available"  iconCls="bg-primary/10 text-primary"
                      label="Today's Appts"    value={loading ? '—' : stats.todays} />
            <StatCard icon="rate_review"      iconCls="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                      label="Pending Reviews" value={loading ? '—' : stats.pending} />
            <StatCard icon="folder_shared"    iconCls="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                      label="New Patient Records" value={loading ? '—' : stats.newRecords} />
            <StatCard icon="emergency"        iconCls="bg-amber-100 dark:bg-amber-900/50 text-amber-600"
                      label="Urgent Cases"    value={loading ? '—' : stats.urgent}
                      accent />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Schedule */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Today's Schedule</h3>
                <button
                  onClick={() => navigate('/doctor/schedule')}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">Loading…</td></tr>
                    ) : appointments.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">No appointments today.</td></tr>
                    ) : (
                      appointments.map((a) => <ScheduleRow key={a.id} appt={a} navigate={navigate} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-4 space-y-6">
              {/* AI flagged */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">AI Flagged Cases</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                  {loading ? (
                    <p className="text-sm text-slate-400">Loading…</p>
                  ) : flagged.length === 0 ? (
                    <p className="text-sm text-slate-400">No flagged cases.</p>
                  ) : (
                    flagged.map((appt, i) => (
                      <FlaggedCard
                        key={appt.id}
                        appt={appt}
                        primary={i === 0}
                        navigate={navigate}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Recent Notifications</h3>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  {loading ? (
                    <p className="p-4 text-sm text-slate-400">Loading…</p>
                  ) : recentNotifs.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400">No notifications.</p>
                  ) : (
                    recentNotifs.map((n, i) => (
                      <NotifRow key={n.id} notif={n} last={i === recentNotifs.length - 1} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, iconCls, label, value, accent = false }) {
  return (
    <div className={
      'p-6 rounded-xl border shadow-sm ' +
      (accent
        ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800')
    }>
      <div className="flex justify-between items-start mb-4">
        <div className={'p-2 rounded-lg ' + iconCls}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {accent && <div className="size-2 rounded-full bg-amber-500 animate-pulse" />}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <h3 className={
        'text-2xl font-bold mt-1 ' +
        (accent ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100')
      }>{value}</h3>
    </div>
  );
}

function ScheduleRow({ appt, navigate }) {
  const isUrgent = URGENT_LEVELS.has(appt.urgencyLevel);
  const badge    = isUrgent ? URGENT_BADGE : (STATUS_BADGE[appt.status] ?? STATUS_BADGE.pending);
  const muted    = appt.status === 'completed' || appt.status === 'cancelled';
  const highlight = appt.status === 'confirmed';

  return (
    <tr className={
      'transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ' +
      (highlight ? 'bg-primary/5' : '')
    }>
      <td className={'px-6 py-4 text-sm font-medium ' + (muted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400')}>
        {formatTime(appt.scheduledAt)}
      </td>
      <td className="px-6 py-4">
        <p className={'text-sm font-bold ' + (muted ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100')}>
          {appt.patient?.fullName ?? 'Unknown patient'}
        </p>
      </td>
      <td className={'px-6 py-4 text-sm ' + (muted ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400')}>
        {appt.reason ?? '—'}
      </td>
      <td className="px-6 py-4">
        <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + badge.cls}>
          <span className={'w-1.5 h-1.5 rounded-full ' + badge.dot} />
          {badge.label}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => appt.patient?.id && navigate(`/doctor/patients/${appt.patient.id}`)}
          className={
            'font-bold text-sm transition-colors ' +
            (muted ? 'text-slate-400 hover:text-slate-600' : 'text-primary hover:text-primary/80')
          }
        >
          View
        </button>
      </td>
    </tr>
  );
}

function FlaggedCard({ appt, primary, navigate }) {
  const screening = appt.aiScreenings?.[0];
  const summary   = screening?.preliminaryAssessment ?? 'Abnormal findings detected';

  if (primary) {
    return (
      <div className="flex items-start gap-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 shrink-0">
          <span className="material-symbols-outlined">warning</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{appt.patient?.fullName}</p>
          <p className="text-xs text-red-600 font-medium mb-3 italic line-clamp-2">{summary}</p>
          <button
            onClick={() => appt.patient?.id && navigate(`/doctor/patients/${appt.patient.id}`)}
            className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded transition-all"
          >
            Review Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 shrink-0">
        <span className="material-symbols-outlined">analytics</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{appt.patient?.fullName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{summary}</p>
        <button
          onClick={() => appt.patient?.id && navigate(`/doctor/patients/${appt.patient.id}`)}
          className="w-full border border-primary text-primary hover:bg-primary/5 text-xs font-bold py-2 px-4 rounded transition-all"
        >
          Review Now
        </button>
      </div>
    </div>
  );
}

function NotifRow({ notif, last }) {
  const meta = NOTIF_ICON[notif.type] ?? NOTIF_ICON.info;
  return (
    <div className={
      'p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ' +
      (last ? '' : 'border-b border-slate-100 dark:border-slate-800')
    }>
      <div className={'size-8 rounded-full flex items-center justify-center shrink-0 ' + meta.cls}>
        <span className="material-symbols-outlined text-sm">{meta.icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
          <span className="font-bold">{notif.title}</span>
          {notif.message ? <> — {notif.message}</> : null}
        </p>
        <p className="text-xs text-slate-500 mt-1">{relativeTime(notif.createdAt)}</p>
      </div>
    </div>
  );
}
