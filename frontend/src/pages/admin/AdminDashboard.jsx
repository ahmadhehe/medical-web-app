import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../../services/adminStats.service';
import { getHealth } from '../../services/systemHealth.service';
import { useToast } from '../../context/ToastContext';

const ROLE_BADGE = {
  patient: 'bg-slate-100 text-slate-600',
  doctor:  'bg-primary/10 text-primary',
  admin:   'bg-slate-800 text-white',
};

const ACTION_COLOR = {
  'New Registration': { text: 'text-green-600', dot: 'bg-green-500' },
  'Profile Update':   { text: 'text-blue-600',  dot: 'bg-blue-500'  },
  'Audit Log Export': { text: 'text-amber-600', dot: 'bg-amber-500' },
  'Login':            { text: 'text-primary',   dot: 'bg-primary'   },
};

function StatCard({ label, value, sub, subColor, iconName, iconColor, iconBg }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-start justify-between shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value ?? '—'}</h3>
        <p className={`text-xs font-semibold flex items-center gap-1 ${subColor}`}>{sub}</p>
      </div>
      <div className={`p-3 ${iconBg} rounded-lg`}>
        <span className={`material-symbols-outlined ${iconColor}`}>{iconName}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [health, setHealth]   = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [s, h] = await Promise.all([getStats(), getHealth()]);
        setStats(s.data);
        setHealth(h.data);
      } catch (err) {
        showToast(err.response?.data?.error ?? 'Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.totalUsers?.toLocaleString(),
          sub: (
            <>
              <span className="material-symbols-outlined text-xs">trending_up</span>{' '}
              {stats.newUsersThisMonth ?? 0} new this month
            </>
          ),
          subColor: 'text-primary',
          iconName: 'group', iconColor: 'text-primary', iconBg: 'bg-primary/10',
        },
        {
          label: 'Active Appointments',
          value: stats.activeAppointments?.toLocaleString(),
          sub: 'Currently in progress',
          subColor: 'text-slate-400',
          iconName: 'calendar_month', iconColor: 'text-blue-500', iconBg: 'bg-blue-50',
        },
        {
          label: 'Screenings Today',
          value: stats.screeningsToday?.toLocaleString(),
          sub: 'AI screenings completed',
          subColor: 'text-amber-500',
          iconName: 'smart_toy', iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
        },
        {
          label: 'System Alerts',
          value: (stats.systemAlerts ?? 0).toLocaleString(),
          sub: (
            <>
              <span className="material-symbols-outlined text-xs">warning</span>{' '}
              {(stats.systemAlerts ?? 0) > 0 ? 'Critical errors detected' : 'All systems normal'}
            </>
          ),
          subColor: (stats.systemAlerts ?? 0) > 0 ? 'text-red-500' : 'text-green-500',
          iconName: 'error',
          iconColor: (stats.systemAlerts ?? 0) > 0 ? 'text-red-500' : 'text-green-500',
          iconBg:   (stats.systemAlerts ?? 0) > 0 ? 'bg-red-50'   : 'bg-green-50',
        },
      ]
    : [];

  const recentActivity = stats?.recentActivity ?? [];
  const alerts         = stats?.recentAlerts   ?? [];

  return (
    <div className="flex flex-col min-h-full bg-background-light">

      {/* ── Page header ── */}
      <header className="h-16 bg-white border-t-[3px] border-primary border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-bold text-slate-800">Admin Dashboard</h2>
          <span className="text-sm text-slate-500 font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
        </div>
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            className="w-full bg-slate-100 border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary placeholder:text-slate-400"
            placeholder="Search system..."
          />
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((c) => <StatCard key={c.label} {...c} />)}
          </div>
        )}

        {/* Charts + Alerts row */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* Registrations chart */}
          <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-800">User Registrations</h4>
              <select className="text-xs font-semibold border-none bg-slate-100 rounded px-2 py-1 focus:ring-0">
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="flex-1 min-h-[180px] relative">
              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#0d968b" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <line x1="0" x2="400" y1="140" y2="140" stroke="#cbd5e1" strokeDasharray="4" />
                <line x1="0" x2="400" y1="100" y2="100" stroke="#cbd5e1" strokeDasharray="4" />
                <line x1="0" x2="400" y1="60"  y2="60"  stroke="#cbd5e1" strokeDasharray="4" />
                <path
                  d="M 0 120 Q 50 110, 80 80 T 150 70 T 220 100 T 300 40 T 400 30"
                  fill="none" stroke="#0d968b" strokeWidth="3" strokeLinecap="round"
                />
                <path
                  d="M 0 120 Q 50 110, 80 80 T 150 70 T 220 100 T 300 40 T 400 30 V 150 H 0 Z"
                  fill="url(#cg)" opacity="0.12"
                />
              </svg>
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>

          {/* User breakdown donut */}
          <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="font-bold text-slate-800 mb-6 text-center">User Breakdown</h4>
            <div className="flex-1 flex flex-col items-center justify-center space-y-5">
              {(() => {
                const patPct = stats?.userBreakdown?.patientPct ?? 65;
                const docPct = stats?.userBreakdown?.doctorPct  ?? 25;
                const admPct = stats?.userBreakdown?.adminPct   ?? 10;
                return (
                  <>
                    <div className="relative size-36">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-primary" strokeWidth="4"
                          strokeDasharray={`${patPct} 100`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#22c55e" strokeWidth="4"
                          strokeDasharray={`${docPct} 100`} strokeDashoffset={`-${patPct}`} />
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="4"
                          strokeDasharray={`${admPct} 100`} strokeDashoffset={`-${patPct + docPct}`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold">
                          {stats?.totalUsers
                            ? stats.totalUsers >= 1000
                              ? (stats.totalUsers / 1000).toFixed(1) + 'k'
                              : stats.totalUsers
                            : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      {[
                        { label: 'Patients', pct: patPct, dot: 'bg-primary'    },
                        { label: 'Doctors',  pct: docPct, dot: 'bg-green-500'  },
                        { label: 'Admins',   pct: admPct, dot: 'bg-slate-800'  },
                      ].map(({ label, pct, dot }) => (
                        <div key={label} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${dot}`} />
                            <span className="text-slate-600 font-medium">{label}</span>
                          </div>
                          <span className="font-bold">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              Recent Alerts
              {alerts.length > 0 && (
                <span className="size-5 rounded bg-red-100 text-red-600 text-[10px] flex items-center justify-center font-bold">
                  {alerts.length}
                </span>
              )}
            </h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {loading && <div className="h-20 bg-slate-100 rounded animate-pulse" />}
              {!loading && alerts.length === 0 && (
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-xs font-bold text-green-700">All Systems Normal</p>
                  <p className="text-[10px] text-green-600/70 mt-1 font-medium">No recent alerts.</p>
                </div>
              )}
              {alerts.map((alert, i) => {
                const cm = {
                  critical: { bg: 'bg-red-50',    border: 'border-red-500',    title: 'text-red-700',    body: 'text-red-600/70',    time: 'text-red-400'    },
                  warning:  { bg: 'bg-amber-50',   border: 'border-amber-500',  title: 'text-amber-700',  body: 'text-amber-600/70',  time: 'text-amber-400'  },
                  info:     { bg: 'bg-slate-50',   border: 'border-slate-400',  title: 'text-slate-700',  body: 'text-slate-500',     time: 'text-slate-400'  },
                };
                const c = cm[alert.severity] ?? cm.info;
                return (
                  <div key={i} className={`p-3 ${c.bg} rounded-lg border-l-4 ${c.border}`}>
                    <p className={`text-xs font-bold ${c.title}`}>{alert.title}</p>
                    <p className={`text-[10px] ${c.body} mt-1 font-medium`}>{alert.message}</p>
                    <span className={`text-[9px] ${c.time} font-bold uppercase mt-2 block`}>{alert.time}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/admin/audit-logs')}
              className="mt-4 text-xs font-bold text-primary hover:underline text-center"
            >
              View Audit Logs
            </button>
          </div>
        </div>

        {/* System Health panel */}
        {health && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">health_and_safety</span>
              System Health
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'DB Status',  value: health.database?.status ?? '—',                                      ok: health.database?.status === 'healthy' },
                { label: 'DB Latency', value: health.database?.latency != null ? `${health.database.latency}ms` : '—', ok: (health.database?.latency ?? 0) < 200 },
                { label: 'Uptime',     value: health.uptime ?? '—',                                                ok: true },
                { label: 'Memory',     value: health.memory?.used ?? '—',                                         ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-sm font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-slate-800">Live Activity Feed</h4>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-[10px] font-bold text-green-600">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">group</span> Manage Users
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No recent activity.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((row, i) => {
                    const role     = row.role?.toLowerCase() ?? 'patient';
                    const badge    = ROLE_BADGE[role] ?? ROLE_BADGE.patient;
                    const ac       = ACTION_COLOR[row.action] ?? { text: 'text-slate-600', dot: 'bg-slate-400' };
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {row.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{row.name}</p>
                              <p className="text-[10px] text-slate-500">{row.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${badge}`}>{row.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${ac.text}`}>
                            <span className={`size-1.5 rounded-full ${ac.dot}`} /> {row.action}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{row.timestamp}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/users/${row.userId}`)}
                            className="material-symbols-outlined text-slate-400 hover:text-primary text-xl"
                          >
                            arrow_forward
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
