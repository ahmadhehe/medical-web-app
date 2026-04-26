import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAppointments } from '../../services/appointment.service';
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

const STATUS_BADGE = {
  pending:     { label: 'Pending',     cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  confirmed:   { label: 'In Progress', cls: 'bg-primary/10 text-primary' },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const URGENT = new Set(['high', 'emergency']);
const ACTIVE = new Set(['pending', 'confirmed']);

const PAGE_SIZE = 10;

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default function PatientsList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      getAppointments({ limit: 200 }),
      getNotifications(),
    ])
      .then(([ap, nt]) => {
        if (!alive) return;
        setAppointments(ap.data?.appointments ?? []);
        setNotifications(Array.isArray(nt.data) ? nt.data : []);
      })
      .catch((err) => {
        if (!alive) return;
        toast(err.response?.data?.error ?? 'Failed to load patients', 'error');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [toast]);

  // Roll appointments up by patientId
  const patients = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      if (!a.patient) continue;
      const existing = map.get(a.patient.id);
      const isLatest = !existing || new Date(a.scheduledAt) > new Date(existing.lastVisit);
      const totalCount = (existing?.totalCount ?? 0) + 1;
      const hasActive  = (existing?.hasActive ?? false) || ACTIVE.has(a.status);
      const hasUrgent  = (existing?.hasUrgent ?? false) || URGENT.has(a.urgencyLevel);
      const lastStatus = isLatest ? a.status      : existing.lastStatus;
      const lastReason = isLatest ? a.reason      : existing.lastReason;
      const lastVisit  = isLatest ? a.scheduledAt : existing.lastVisit;
      map.set(a.patient.id, {
        id:         a.patient.id,
        fullName:   a.patient.fullName,
        email:      a.patient.email,
        lastVisit, lastStatus, lastReason,
        totalCount, hasActive, hasUrgent,
      });
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastVisit) - new Date(a.lastVisit),
    );
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (filter === 'active' && !p.hasActive) return false;
      if (filter === 'urgent' && !p.hasUrgent) return false;
      if (!q) return true;
      return (
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });
  }, [patients, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const showing    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:  patients.length,
    active: patients.filter((p) => p.hasActive).length,
    urgent: patients.filter((p) => p.hasUrgent).length,
  }), [patients]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const unread = notifications.filter((n) => !n.isRead).length;

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
                {dot && unread > 0 && (
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
            <h2 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Patients</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Patients you've consulted with</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                placeholder="Search by name or email..."
                type="text"
              />
            </div>
            <button
              onClick={() => navigate('/doctor/notifications')}
              className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unread}
                </span>
              )}
            </button>
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {user?.fullName?.[0]?.toUpperCase() ?? 'D'}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Stat strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatPill label="Total Patients" value={loading ? '—' : stats.total}  icon="group"          tint="bg-primary/10 text-primary" />
            <StatPill label="Active Cases"   value={loading ? '—' : stats.active} icon="event_available" tint="bg-blue-100 dark:bg-blue-900/30 text-blue-600" />
            <StatPill label="Urgent Cases"   value={loading ? '—' : stats.urgent} icon="emergency"       tint="bg-amber-100 dark:bg-amber-900/50 text-amber-600" accent={!loading && stats.urgent > 0} />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
            <FilterTab active={filter === 'all'}    onClick={() => { setFilter('all');    setPage(1); }} label={`All (${patients.length})`} />
            <FilterTab active={filter === 'active'} onClick={() => { setFilter('active'); setPage(1); }} label={`Active (${stats.active})`} />
            <FilterTab active={filter === 'urgent'} onClick={() => { setFilter('urgent'); setPage(1); }} label={`Urgent (${stats.urgent})`} />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Visit</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Visits</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
                  ) : showing.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      {patients.length === 0 ? 'No patients yet — they will appear here once you have appointments.' : 'No patients match your filters.'}
                    </td></tr>
                  ) : showing.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/doctor/patients/${p.id}`)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {p.fullName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                              {p.fullName}
                              {p.hasUrgent && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">URGENT</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(p.lastVisit)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[220px]">{p.lastReason ?? '—'}</td>
                      <td className="px-6 py-4">
                        {p.lastStatus && (
                          <span className={'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ' + (STATUS_BADGE[p.lastStatus]?.cls ?? 'bg-slate-100 text-slate-700')}>
                            {STATUS_BADGE[p.lastStatus]?.label ?? p.lastStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.totalCount}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/doctor/patients/${p.id}`); }}
                          className="text-primary font-bold text-sm hover:text-primary/80"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="text-sm text-slate-500">
                  Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} patients
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm font-bold bg-primary text-white border border-primary rounded">{safePage}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatPill({ label, value, icon, tint, accent = false }) {
  return (
    <div className={
      'p-6 rounded-xl border shadow-sm flex justify-between items-center ' +
      (accent
        ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800')
    }>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
        <h3 className={'text-2xl font-bold mt-1 ' + (accent ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100')}>
          {value}
        </h3>
      </div>
      <div className={'p-3 rounded-lg ' + tint}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ' +
        (active
          ? 'border-primary text-primary'
          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')
      }
    >
      {label}
    </button>
  );
}
