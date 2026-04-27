import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAuditLogs, exportAuditLogs } from '../../services/audit.service';

const ADMIN_NAV = [
  { to: '/admin/dashboard',   icon: 'dashboard',     label: 'Dashboard' },
  { to: '/admin/users',       icon: 'group',         label: 'Patients' },
  { to: '/admin/appointments',icon: 'calendar_today',label: 'Appointments' },
  { to: '/admin/audit-logs',  icon: 'verified_user', label: 'Audit Log' },
  { to: '/admin/settings',    icon: 'settings',      label: 'Settings' },
];

const DOCTOR_NAV = [
  { to: '/doctor/dashboard',     icon: 'dashboard',      label: 'Dashboard' },
  { to: '/doctor/schedule',      icon: 'calendar_today', label: 'Appointments' },
  { to: '/doctor/patients',      icon: 'group',          label: 'Patients' },
  { to: '/doctor/audit-log',     icon: 'verified_user',  label: 'Audit Log' },
  { to: '/doctor/settings',      icon: 'settings',       label: 'Settings' },
];

const ACTION_OPTIONS = [
  { value: '',       label: 'All Actions' },
  { value: 'CREATE', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
  { value: 'LOGIN',  label: 'Login' },
];

const ACTION_BADGE = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  LOGIN:  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  VIEW:   'bg-primary/10 text-primary dark:bg-primary/20',
};

const PAGE_SIZE = 10;

function formatTimestamp(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function readableTarget(targetType, targetId) {
  if (!targetType) return '—';
  const pretty = targetType.replace(/_/g, ' ');
  return targetId ? `${pretty} · ${targetId.slice(0, 8)}` : pretty;
}

export default function AuditLogs() {
  const { user, logout } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();
  const isDoctor = user?.role === 'doctor';
  const navItems = isDoctor ? DOCTOR_NAV : ADMIN_NAV;

  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate:  '',
    endDate:    '',
    actionType: '',
    actorId:    '',
  });
  const [pendingFilters, setPendingFilters] = useState(filters);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = {
      page,
      limit: PAGE_SIZE,
      ...(filters.startDate  && { startDate: filters.startDate  }),
      ...(filters.endDate    && { endDate:   filters.endDate    }),
      ...(filters.actionType && { actionType: filters.actionType }),
      ...(filters.actorId    && !isDoctor && { actorId: filters.actorId }),
    };
    getAuditLogs(params)
      .then((res) => {
        if (!alive) return;
        setLogs(res.data?.logs ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch((err) => {
        if (!alive) return;
        toast(err.response?.data?.error ?? 'Failed to load audit logs', 'error');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [page, filters, isDoctor, toast]);

  const actorOptions = useMemo(() => {
    const seen = new Map();
    logs.forEach((l) => { if (l.actor) seen.set(l.actor.id, l.actor.fullName); });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo   = Math.min(page * PAGE_SIZE, total);

  function applyFilters() {
    setPage(1);
    setFilters(pendingFilters);
  }

  async function handleExport() {
    try {
      const params = {
        ...(filters.startDate  && { startDate: filters.startDate  }),
        ...(filters.endDate    && { endDate:   filters.endDate    }),
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.actorId    && !isDoctor && { actorId: filters.actorId }),
      };
      const res  = await exportAuditLogs(params);
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to export', 'error');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 text-white flex flex-col shrink-0" style={{ backgroundColor: '#083b37' }}>
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white">medical_services</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none tracking-tight">MediConnect</h1>
              <p className="text-xs text-primary/70 font-medium">Clinical ERP</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ' +
                  (isActive
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-300 hover:bg-white/10')
                }
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300 text-left">
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm font-medium">Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300 text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Audit Log</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Monitor comprehensive clinical histories, record accesses, and system modifications to ensure medical compliance and accountability.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</label>
              <input
                type="date"
                value={pendingFilters.startDate}
                onChange={(e) => setPendingFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</label>
              <input
                type="date"
                value={pendingFilters.endDate}
                onChange={(e) => setPendingFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action Type</label>
              <select
                value={pendingFilters.actionType}
                onChange={(e) => setPendingFilters((f) => ({ ...f, actionType: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary outline-none"
              >
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {!isDoctor && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actor</label>
                <select
                  value={pendingFilters.actorId}
                  onChange={(e) => setPendingFilters((f) => ({ ...f, actorId: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">All Actors</option>
                  {actorOptions.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={applyFilters}
              className={
                'h-11 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all ' +
                (isDoctor ? 'md:col-start-4' : 'md:col-span-4 md:max-w-[200px] md:justify-self-end')
              }
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Personnel</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No audit log entries.</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-200 whitespace-nowrap">{formatTimestamp(l.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">
                      {l.actor?.fullName ?? 'System'}
                      {l.actor?.role && <span className="text-xs text-slate-400 ml-1">({l.actor.role})</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (ACTION_BADGE[l.actionType] ?? 'bg-slate-100 text-slate-700')}>
                        {l.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{readableTarget(l.targetType, l.targetId)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[260px]" title={l.description ?? ''}>
                      {l.description ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{l.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <span className="text-sm text-slate-500">
              Showing {showingFrom} to {showingTo} of {total} entries
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <PageNumbers page={page} totalPages={totalPages} onChange={setPage} />
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined text-[16px]">lock_person</span>
          <p className="text-xs italic">
            Compliance Notice: All logs are immutable, encrypted, and timestamped via MediConnect Secure Ledger.
          </p>
        </div>
      </main>
    </div>
  );
}

function PageNumbers({ page, totalPages, onChange }) {
  const pages = [];
  const start = Math.max(1, page - 1);
  const end   = Math.min(totalPages, start + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages.map((p) => (
    <button
      key={p}
      onClick={() => onChange(p)}
      className={
        'px-3 py-1 text-sm rounded font-bold ' +
        (p === page
          ? 'bg-primary text-white border border-primary'
          : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 font-normal')
      }
    >
      {p}
    </button>
  ));
}
