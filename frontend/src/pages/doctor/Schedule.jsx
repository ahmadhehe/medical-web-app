import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSchedule } from '../../services/doctor.service';

const STATUS_BADGE = {
  pending:     { label: 'Upcoming',    cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',       dot: 'bg-slate-400' },
  confirmed:   { label: 'In Progress', cls: 'bg-primary/10 text-primary',                                              dot: 'bg-primary'   },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    dot: 'bg-green-500'  },
  rescheduled: { label: 'Rescheduled', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',    dot: 'bg-amber-500'  },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',            dot: 'bg-red-500'    },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLong(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function Schedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [weekStart,    setWeekStart]    = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    setLoading(true);
    getSchedule(user.id)
      .then((r) => { if (alive) setAppointments(Array.isArray(r.data) ? r.data : []); })
      .catch((err) => { if (alive) toast(err.response?.data?.error ?? 'Failed to load schedule', 'error'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user?.id, toast]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const apptsByDay = weekDays.map((day) =>
    appointments
      .filter((a) => sameDay(new Date(a.scheduledAt), day))
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
  );

  const today = new Date();
  const totalThisWeek = apptsByDay.flat().length;
  const upcomingToday = apptsByDay[today.getDay()]?.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  ).length ?? 0;

  return (
    <div className="flex flex-col font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">My Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Weekly appointment overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[200px] text-center">
            {MONTHS[weekStart.getMonth()]} {weekStart.getDate()} – {MONTHS[weekDays[6].getMonth()]} {weekDays[6].getDate()}, {weekDays[6].getFullYear()}
          </span>
          <button
            onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Today
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatChip icon="event_available" label="This Week"    value={loading ? '—' : totalThisWeek} tint="bg-primary/10 text-primary" />
          <StatChip icon="today"           label="Today"        value={loading ? '—' : (apptsByDay[today.getDay()]?.length ?? 0)} tint="bg-blue-100 dark:bg-blue-900/30 text-blue-600" />
          <StatChip icon="pending_actions" label="Upcoming Today" value={loading ? '—' : upcomingToday} tint="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
          <StatChip icon="check_circle"   label="Completed"    value={loading ? '—' : appointments.filter((a) => a.status === 'completed').length} tint="bg-green-100 dark:bg-green-900/30 text-green-600" />
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, i) => {
            const isToday = sameDay(day, today);
            const dayAppts = apptsByDay[i];
            return (
              <div key={i} className={
                'rounded-xl border overflow-hidden ' +
                (isToday
                  ? 'border-primary shadow-sm shadow-primary/10'
                  : 'border-slate-200 dark:border-slate-800')
              }>
                {/* Day header */}
                <div className={
                  'px-3 py-2 text-center ' +
                  (isToday ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300')
                }>
                  <p className="text-[10px] font-bold uppercase tracking-wider">{DAYS[day.getDay()]}</p>
                  <p className="text-lg font-extrabold leading-tight">{day.getDate()}</p>
                </div>

                {/* Appointments */}
                <div className="p-2 space-y-1.5 min-h-[120px] bg-white dark:bg-slate-900">
                  {loading ? (
                    <div className="flex items-center justify-center h-16">
                      <span className="material-symbols-outlined text-slate-300 animate-spin text-sm">progress_activity</span>
                    </div>
                  ) : dayAppts.length === 0 ? (
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center pt-4">Free</p>
                  ) : dayAppts.map((a) => {
                    const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
                    return (
                      <button
                        key={a.id}
                        onClick={() => a.patient?.id && navigate(`/doctor/patients/${a.patient.id}`)}
                        className="w-full text-left p-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-primary truncate">{formatTime(a.scheduledAt)}</p>
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{a.patient?.fullName ?? 'Patient'}</p>
                        <span className={'inline-flex items-center gap-1 text-[9px] font-bold mt-0.5'}>
                          <span className={'w-1.5 h-1.5 rounded-full ' + badge.dot} />
                          <span className="text-slate-500">{badge.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* List view for selected week */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">This Week's Appointments</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">Loading…</div>
            ) : apptsByDay.flat().length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">No appointments this week.</div>
            ) : weekDays.map((day, i) => (
              apptsByDay[i].map((a) => {
                const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
                return (
                  <div
                    key={a.id}
                    onClick={() => a.patient?.id && navigate(`/doctor/patients/${a.patient.id}`)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-xs font-bold text-slate-500 uppercase">{DAYS[day.getDay()]}, {MONTHS[day.getMonth()].slice(0,3)} {day.getDate()}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatTime(a.scheduledAt)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{a.patient?.fullName ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{a.reason ?? 'No reason specified'}</p>
                    </div>
                    <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' + badge.cls}>
                      <span className={'w-1.5 h-1.5 rounded-full ' + badge.dot} />
                      {badge.label}
                    </span>
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, tint }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
      <div className={'p-2 rounded-lg ' + tint}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
