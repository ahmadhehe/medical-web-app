import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProfile } from '../../services/patient.service';
import { getAppointments } from '../../services/appointment.service';
import { getScreeningsByPatient } from '../../services/screening.service';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function relativeDay(iso) {
  if (!iso) return '';
  const d     = new Date(iso);
  const today = new Date();
  const diff  = Math.round((d.setHours(0,0,0,0) - today.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

const STATUS_BADGE = {
  pending:     { label: 'Upcoming',    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-primary/10 text-primary' },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [screenings,   setScreenings]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;

    Promise.allSettled([
      getProfile(user.id),
      getAppointments({ limit: 10 }),
      getScreeningsByPatient(user.id),
    ]).then(([profRes, apptRes, scrRes]) => {
      if (!alive) return;
      if (profRes.status === 'fulfilled') setProfile(profRes.value.data?.profile ?? null);
      if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data?.appointments ?? []);
      if (scrRes.status  === 'fulfilled') setScreenings(scrRes.value.data?.screenings ?? scrRes.value.data ?? []);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [user?.id]);

  const upcomingAppts = appointments
    .filter((a) => a.status === 'pending' || a.status === 'confirmed')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const nextAppt      = upcomingAppts[0] ?? null;
  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const lastScreening  = [...screenings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ?? null;
  const profileComplete = !!(profile?.bloodType && profile?.gender && profile?.dateOfBirth);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">{greeting}, {user?.fullName?.split(' ')[0] ?? 'there'}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Here's your health summary</p>
        </div>
        <button
          onClick={() => navigate('/patient/screening')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          Start AI Screening
        </button>
      </header>

      <div className="p-8 space-y-6 max-w-5xl">

        {/* Profile incomplete banner */}
        {!loading && !profileComplete && (
          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl">
            <span className="material-symbols-outlined text-amber-500 text-2xl shrink-0">warning</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Complete your medical profile</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">Add your blood type, date of birth and other details so your doctor has accurate information.</p>
            </div>
            <button
              onClick={() => navigate('/patient/profile')}
              className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatChip
            icon="event_available"
            label="Upcoming"
            value={loading ? '—' : upcomingAppts.length}
            tint="bg-primary/10 text-primary"
          />
          <StatChip
            icon="check_circle"
            label="Completed Visits"
            value={loading ? '—' : completedAppts}
            tint="bg-green-100 dark:bg-green-900/30 text-green-600"
          />
          <StatChip
            icon="smart_toy"
            label="AI Screenings"
            value={loading ? '—' : screenings.length}
            tint="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
          />
          <StatChip
            icon="person"
            label="Profile"
            value={loading ? '—' : (profileComplete ? 'Complete' : 'Incomplete')}
            tint={profileComplete ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Next appointment */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">event</span>
              Next Appointment
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Loading…
              </div>
            ) : nextAppt ? (
              <div className="space-y-3">
                <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Dr. {nextAppt.doctor?.fullName ?? 'Your Doctor'}
                      </p>
                      <p className="text-xs text-slate-500">{nextAppt.doctor?.specialization ?? 'General Practice'}</p>
                    </div>
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (STATUS_BADGE[nextAppt.status]?.cls ?? '')}>
                      {STATUS_BADGE[nextAppt.status]?.label ?? nextAppt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
                      {formatDate(nextAppt.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                      {formatTime(nextAppt.scheduledAt)}
                    </span>
                  </div>
                  {nextAppt.reason && (
                    <p className="text-xs text-slate-500 mt-2 italic">"{nextAppt.reason}"</p>
                  )}
                </div>
                <p className="text-xs text-primary font-semibold">{relativeDay(nextAppt.scheduledAt)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                <span className="material-symbols-outlined text-4xl">event_busy</span>
                <p className="text-sm font-medium">No upcoming appointments</p>
              </div>
            )}
          </section>

          {/* Health snapshot */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">favorite</span>
                Health Snapshot
              </h3>
              <button
                onClick={() => navigate('/patient/profile')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Edit
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Loading…
              </div>
            ) : profile ? (
              <div className="grid grid-cols-2 gap-3">
                <InfoChip icon="water_drop"     label="Blood Type"  value={profile.bloodType?.replace('_POS','+').replace('_NEG','-') ?? '—'} />
                <InfoChip icon="person"         label="Gender"      value={profile.gender ?? '—'} capitalize />
                <InfoChip icon="cake"           label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                <InfoChip icon="height"         label="Height"      value={profile.height ? `${profile.height} cm` : '—'} />
                <InfoChip icon="monitor_weight" label="Weight"      value={profile.weight ? `${profile.weight} kg` : '—'} />
                <InfoChip icon="bloodtype"      label="Conditions"  value={
                  [
                    profile.hasHypertension && 'Hypertension',
                    profile.hasDiabetes     && 'Diabetes',
                    profile.hasAsthma       && 'Asthma',
                    profile.hasHeartDisease && 'Heart Disease',
                  ].filter(Boolean).join(', ') || 'None recorded'
                } />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                <span className="material-symbols-outlined text-4xl">person_off</span>
                <p className="text-sm font-medium">No profile yet</p>
                <button
                  onClick={() => navigate('/patient/profile')}
                  className="text-xs text-primary font-semibold hover:underline mt-1"
                >
                  Set up your profile
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Recent appointments */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Appointment History</h3>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <span className="material-symbols-outlined text-4xl">calendar_month</span>
              <p className="text-sm font-medium">No appointments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments
                .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                .slice(0, 5)
                .map((a) => {
                  const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
                  return (
                    <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-bold text-slate-500">{formatDate(a.scheduledAt)}</p>
                        <p className="text-xs text-slate-400">{formatTime(a.scheduledAt)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          Dr. {a.doctor?.fullName ?? 'Doctor'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{a.reason ?? 'No reason specified'}</p>
                      </div>
                      <span className={'text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ' + badge.cls}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Last screening */}
        {!loading && lastScreening && (
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                Last AI Screening
              </h3>
              <button
                onClick={() => navigate(`/patient/screening/results?id=${lastScreening.id}`)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View Report
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Screening Session</p>
                <p className="text-xs text-slate-500">{formatDate(lastScreening.createdAt)}</p>
              </div>
              <span className={
                'text-xs font-semibold px-2.5 py-1 rounded-full ' +
                (lastScreening.status === 'completed'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400')
              }>
                {lastScreening.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </section>
        )}

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
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value, capitalize }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={'text-xs font-semibold text-slate-800 dark:text-slate-200 truncate' + (capitalize ? ' capitalize' : '')}>{value}</p>
      </div>
    </div>
  );
}
