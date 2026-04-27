import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { getUserById } from '../../services/user.service';
import { getProfile as getPatientProfile, getAllergies } from '../../services/patient.service';
import { getScreeningsByPatient } from '../../services/screening.service';
import { getAppointments, updateStatus, updateAppointment, addNote } from '../../services/appointment.service';
import { getImagesByPatient } from '../../services/medicalImage.service';
import { getPatientVitals } from '../../services/vital.service';

const URGENCY_BADGE = {
  low:       { label: 'Low Urgency',      cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: 'task_alt' },
  medium:    { label: 'Moderate Urgency', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',         icon: 'warning' },
  high:      { label: 'High Urgency',     cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',     icon: 'priority_high' },
  emergency: { label: 'Emergency',        cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',                 icon: 'emergency' },
};

const SEVERITY_PCT = { mild: 30, moderate: 60, severe: 90 };

const APPT_STATUS_BADGE = {
  pending:     'bg-slate-100 text-slate-700',
  confirmed:   'bg-primary/10 text-primary',
  completed:   'bg-green-100 text-green-700',
  rescheduled: 'bg-amber-100 text-amber-700',
  cancelled:   'bg-red-100 text-red-700',
};

const APPT_STATUS_LABEL = {
  pending: 'Pending', confirmed: 'In Progress', completed: 'Completed',
  rescheduled: 'Rescheduled', cancelled: 'Cancelled',
};

const ACTIVE_STATUSES = new Set(['pending', 'confirmed']);

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
const resolveUrl = (p) => (!p ? '' : p.startsWith('http') ? p : `${API_ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`);

function ageFrom(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function bloodTypeLabel(bt) {
  if (!bt) return null;
  return bt.replace('_POS', '+').replace('_NEG', '-');
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function chronicConditions(profile) {
  if (!profile) return [];
  const out = [];
  if (profile.hasHypertension) out.push('Hypertension');
  if (profile.hasDiabetes)     out.push('Diabetes');
  if (profile.hasAsthma)       out.push('Asthma');
  if (profile.hasHeartDisease) out.push('Heart Disease');
  return out;
}

export default function PatientDetail() {
  const { id: patientId } = useParams();
  const navigate          = useNavigate();
  const toast             = useToast();

  const [patient,      setPatient]      = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [allergies,    setAllergies]    = useState([]);
  const [screenings,   setScreenings]   = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [images,       setImages]       = useState([]);
  const [vitals,       setVitals]       = useState([]);
  const [loading,      setLoading]      = useState(true);

  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [confidential, setConfidential] = useState(true);
  const [followUp, setFollowUp] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let alive = true;
    setLoading(true);
    Promise.allSettled([
      getUserById(patientId),
      getPatientProfile(patientId),
      getAllergies(patientId),
      getScreeningsByPatient(patientId),
      getAppointments({ limit: 100 }),
      getImagesByPatient(patientId),
      getPatientVitals(patientId),
    ]).then(([u, p, al, sc, ap, im, vi]) => {
      if (!alive) return;
      if (u.status === 'fulfilled') setPatient(u.value.data);
      else                          toast('Patient not found', 'error');
      if (p.status  === 'fulfilled') setProfile(p.value.data);
      if (al.status === 'fulfilled') setAllergies(al.value.data ?? []);
      if (sc.status === 'fulfilled') setScreenings(sc.value.data ?? []);
      if (ap.status === 'fulfilled') {
        const all = ap.value.data?.appointments ?? [];
        setAppointments(all.filter((a) => a.patientId === patientId));
      }
      if (im.status === 'fulfilled') setImages(im.value.data ?? []);
      if (vi.status === 'fulfilled') setVitals(vi.value.data ?? []);
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [patientId, toast]);

  const latestScreening = useMemo(
    () => (screenings.length ? screenings[0] : null),
    [screenings],
  );

  const currentAppointment = useMemo(() => {
    const active = appointments
      .filter((a) => ACTIVE_STATUSES.has(a.status))
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    return active[0] ?? null;
  }, [appointments]);

  const pastAppointments = useMemo(
    () => appointments
      .filter((a) => !ACTIVE_STATUSES.has(a.status))
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)),
    [appointments],
  );

  const latestVitals = vitals[0] ?? null;
  const urgency = latestScreening?.urgencyLevel ?? null;
  const urgencyMeta = urgency ? URGENCY_BADGE[urgency] : null;

  async function handleSaveNote() {
    if (!currentAppointment) {
      toast('No active appointment for this patient', 'error');
      return;
    }
    if (!noteDraft.trim()) {
      toast('Notes are empty', 'error');
      return;
    }
    setSavingNote(true);
    try {
      const prefix = [];
      if (confidential) prefix.push('[Confidential]');
      if (followUp)     prefix.push('[Follow-up needed]');
      const content = (prefix.length ? prefix.join(' ') + '\n' : '') + noteDraft.trim();
      await addNote(currentAppointment.id, { content });
      setNoteDraft('');
      toast('Consultation note saved', 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to save note', 'error');
    } finally {
      setSavingNote(false);
    }
  }

  async function handleStatusChange(status, payload = {}) {
    if (!currentAppointment) {
      toast('No active appointment to update', 'error');
      return;
    }
    try {
      if (status === 'rescheduled' && payload.scheduledAt) {
        await updateAppointment(currentAppointment.id, {
          scheduledAt: payload.scheduledAt,
        });
        await updateStatus(currentAppointment.id, 'rescheduled');
      } else {
        await updateStatus(currentAppointment.id, status);
      }
      // Refresh appointments
      const res = await getAppointments({ limit: 100 });
      const all = res.data?.appointments ?? [];
      setAppointments(all.filter((a) => a.patientId === patientId));
      toast(`Appointment ${status}`, 'success');
      setModalOpen(false);
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to update appointment', 'error');
    }
  }

  return (
    <div className="font-display text-slate-900 dark:text-slate-100">
          {/* Breadcrumbs */}
          <header className="sticky top-0 z-10 backdrop-blur-md px-8 py-4 border-b border-slate-200 dark:border-slate-800" style={{ backgroundColor: 'rgba(246,248,248,0.8)' }}>
            <nav className="flex text-sm font-medium">
              <ol className="flex items-center space-x-2">
                <li><button onClick={() => navigate('/doctor/dashboard')} className="text-slate-500 hover:text-primary transition-colors">Dashboard</button></li>
                <li className="text-slate-400"><span className="material-symbols-outlined text-xs">chevron_right</span></li>
                <li><button onClick={() => navigate('/doctor/schedule')} className="text-slate-500 hover:text-primary transition-colors">My Schedule</button></li>
                <li className="text-slate-400"><span className="material-symbols-outlined text-xs">chevron_right</span></li>
                <li className="text-primary font-semibold">Patient: {patient?.fullName ?? '…'}</li>
              </ol>
            </nav>
          </header>

          <div className="p-8 max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              {/* Left column */}
              <div className="space-y-6">
                {/* Patient header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 text-primary text-2xl font-bold">
                      {patient?.fullName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {loading ? 'Loading…' : (patient?.fullName ?? 'Unknown patient')}
                        </h2>
                        {urgencyMeta && (
                          <span className={'px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ' + urgencyMeta.cls}>
                            <span className="material-symbols-outlined text-sm">{urgencyMeta.icon}</span>
                            {urgencyMeta.label}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {[
                          ageFrom(profile?.dateOfBirth) && `${ageFrom(profile.dateOfBirth)}`,
                          profile?.gender && profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1),
                          bloodTypeLabel(profile?.bloodType) && `${bloodTypeLabel(profile.bloodType)} Blood Type`,
                        ].filter(Boolean).join(', ') || 'Profile incomplete'}
                      </p>
                      {allergies.length > 0 && (
                        <p className="text-sm mt-2">
                          <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter text-[10px]">Allergies: </span>
                          <span className="text-slate-600 dark:text-slate-300">{allergies.map((a) => a.name).join(', ')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/users/${patientId}`)}
                    className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-semibold text-sm transition-colors border border-primary/20"
                  >
                    View Full Profile
                  </button>
                </div>

                {/* AI summary */}
                <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Pre-Screening Summary</h3>
                  </div>
                  {latestScreening ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-primary uppercase tracking-widest">Symptom Assessment</label>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold capitalize">{latestScreening.severity ?? 'Unknown severity'}</p>
                          {latestScreening.priorityTimeframe && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">Timeframe: {latestScreening.priorityTimeframe}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${SEVERITY_PCT[latestScreening.severity] ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold capitalize">{latestScreening.severity ?? '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-bold text-primary uppercase tracking-widest">Clinical Insight</label>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {latestScreening.preliminaryAssessment ?? 'No assessment recorded.'}
                        </p>
                        {latestScreening.suggestedSpecialization && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-primary/20 text-xs font-semibold">
                            <span className="material-symbols-outlined text-xs">stethoscope</span>
                            Rec: {latestScreening.suggestedSpecialization}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No AI pre-screening on record.</p>
                  )}
                </div>

                {/* Medical history */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">history</span>
                    Medical History
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {chronicConditions(profile).length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No chronic conditions recorded.</span>
                    ) : chronicConditions(profile).map((c) => (
                      <span key={c} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Reason</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Doctor</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pastAppointments.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No prior consultations.</td></tr>
                        ) : pastAppointments.map((a) => (
                          <tr key={a.id}>
                            <td className="px-4 py-3 text-sm">{formatDate(a.scheduledAt)}</td>
                            <td className="px-4 py-3 text-sm font-medium">{a.reason ?? '—'}</td>
                            <td className="px-4 py-3 text-sm">{a.doctor?.fullName ?? '—'}</td>
                            <td className={'px-4 py-3 text-xs font-bold ' + (
                              a.status === 'completed'   ? 'text-green-600 dark:text-green-400' :
                              a.status === 'cancelled'   ? 'text-red-600 dark:text-red-400' :
                              a.status === 'rescheduled' ? 'text-amber-600 dark:text-amber-400' :
                              'text-slate-500')}>
                              {APPT_STATUS_LABEL[a.status] ?? a.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Consultation notes */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4">Consultation Notes</h3>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-primary focus:border-primary placeholder:text-slate-400 mb-4 outline-none"
                    placeholder={currentAppointment ? 'Start typing clinical notes here...' : 'No active appointment to attach notes to.'}
                    disabled={!currentAppointment}
                  />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex gap-6">
                      <Toggle checked={confidential} onChange={setConfidential} label="Confidential" />
                      <Toggle checked={followUp}     onChange={setFollowUp}     label="Follow-up needed" />
                    </div>
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote || !currentAppointment || !noteDraft.trim()}
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-8 rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingNote ? 'Saving…' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Appointment actions */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Appointment</h3>
                    {currentAppointment ? (
                      <span className={'px-3 py-1 text-xs font-bold rounded-full ' + (APPT_STATUS_BADGE[currentAppointment.status] ?? 'bg-slate-100 text-slate-700')}>
                        {APPT_STATUS_LABEL[currentAppointment.status] ?? currentAppointment.status}
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500">No active appt</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setModalOpen(true)}
                      disabled={!currentAppointment}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Mark as Completed
                    </button>
                    <button
                      onClick={() => setModalOpen(true)}
                      disabled={!currentAppointment}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-primary text-primary hover:bg-primary/5 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reschedule Appointment
                    </button>
                    <button
                      onClick={() => setModalOpen(true)}
                      disabled={!currentAppointment}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">folder_open</span>
                      Documents
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {images.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
                    ) : images.map((img) => <DocumentCard key={img.id} img={img} navigate={navigate} />)}
                  </div>
                </div>

                {/* Vitals */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-400">Current Vitals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <VitalCell label="Weight" value={profile?.weightKg ? `${profile.weightKg} kg` : '—'} />
                    <VitalCell label="Height" value={profile?.heightCm ? `${profile.heightCm} cm` : '—'} />
                    <VitalCell label="BP"     value={latestVitals?.bloodPressure ?? '—'} />
                    <VitalCell
                      label="Temp"
                      value={latestVitals?.temperatureC ? `${latestVitals.temperatureC}°C` : '—'}
                      accent={latestVitals?.temperatureC && Number(latestVitals.temperatureC) >= 38}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

      {modalOpen && currentAppointment && (
        <StatusModal
          patientName={patient?.fullName ?? 'Patient'}
          onClose={() => setModalOpen(false)}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
      <span className="ms-3 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
    </label>
  );
}

function VitalCell({ label, value, accent = false }) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <p className="text-[10px] text-slate-500 font-bold uppercase">{label}</p>
      <p className={'text-lg font-bold ' + (accent ? 'text-amber-500' : '')}>{value}</p>
    </div>
  );
}

function DocumentCard({ img, navigate }) {
  const isImage = img.mimeType?.startsWith('image/');
  const thumb = resolveUrl(img.annotatedImagePath ?? img.storagePath);
  return (
    <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/30 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        {isImage ? (
          <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0">
            <img src={thumb} alt={img.fileName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{img.fileName}</p>
          <p className="text-[10px] text-slate-500 font-medium">Uploaded {formatDate(img.uploadedAt)}</p>
        </div>
      </div>
      <button
        onClick={() => isImage ? navigate(`/doctor/xray/${img.id}`) : window.open(resolveUrl(img.storagePath), '_blank')}
        className="w-full mt-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {isImage ? 'View X-ray' : 'Open Report'}
      </button>
    </div>
  );
}

function StatusModal({ patientName, onClose, onConfirm }) {
  const [selected, setSelected]       = useState('completed');
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const PREVIEW = {
    completed:   { word: 'Completed',   cls: 'text-emerald-600 bg-emerald-50' },
    rescheduled: { word: 'Rescheduled', cls: 'text-amber-600 bg-amber-50' },
    cancelled:   { word: 'Cancelled',   cls: 'text-red-600 bg-red-50' },
  };

  async function submit() {
    if (selected === 'rescheduled' && !rescheduleAt) return;
    setSubmitting(true);
    await onConfirm(selected, selected === 'rescheduled' ? { scheduledAt: rescheduleAt } : {});
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Update Appointment Status</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 gap-3">
            <StatusCard
              icon="check"          iconBg="bg-emerald-500"        title="Completed"
              subtitle="Mark as finished"
              active={selected === 'completed'}
              onClick={() => setSelected('completed')}
            />
            <StatusCard
              icon="event_repeat"   iconBg="bg-primary/10 text-primary !text-primary" title="Reschedule"
              subtitle="Change date/time"
              active={selected === 'rescheduled'}
              onClick={() => setSelected('rescheduled')}
            />
            <StatusCard
              icon="close"          iconBg="bg-red-50 text-red-500" title="Cancel"
              subtitle="Remove from schedule"
              active={selected === 'cancelled'}
              onClick={() => setSelected('cancelled')}
              danger
            />
          </div>

          {selected === 'rescheduled' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Date / Time</label>
              <input
                type="datetime-local"
                value={rescheduleAt}
                onChange={(e) => setRescheduleAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Notification preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Patient Notification Preview</h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 relative">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-white">medical_services</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">MediConnect</span>
                  <span className="text-[10px] text-slate-400 ml-auto">Just now</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Hi <span className="font-semibold">{patientName.split(' ')[0]}</span>, your appointment at MediConnect has been marked as{' '}
                  <span className={'font-bold px-1.5 py-0.5 rounded ' + (PREVIEW[selected]?.cls ?? 'text-slate-700 bg-slate-50')}>
                    {PREVIEW[selected]?.word}
                  </span>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500 mr-2">Send via:</span>
              <DeliveryChip icon="notifications" label="Push" active />
              <DeliveryChip icon="mail"          label="Email" />
              <DeliveryChip icon="sms"           label="SMS" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
          <button
            onClick={submit}
            disabled={submitting || (selected === 'rescheduled' && !rescheduleAt)}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {submitting ? 'Sending…' : 'Confirm & Notify Patient'}
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
          <button onClick={onClose} className="w-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-colors py-1">
            Cancel and close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, iconBg, title, subtitle, active, onClick, danger = false }) {
  const borderCls = active
    ? (danger ? 'border-red-500 bg-red-50/50' : 'border-primary bg-primary/5')
    : (danger ? 'border-red-200 hover:border-red-500' : 'border-primary/40 hover:border-primary');
  return (
    <div
      onClick={onClick}
      className={'cursor-pointer p-4 rounded-lg border-2 transition-all ' + borderCls}
    >
      <div className="flex items-center gap-4">
        <div className={'w-12 h-12 rounded-full flex items-center justify-center text-white ' + iconBg}>
          <span className="material-symbols-outlined font-bold">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {active && (
          <div className={'w-6 h-6 rounded-full flex items-center justify-center text-white ' + (danger ? 'bg-red-500' : 'bg-primary')}>
            <span className="material-symbols-outlined text-xs">check</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryChip({ icon, label, active = false }) {
  return (
    <div className={
      'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ' +
      (active
        ? 'bg-primary text-white border-primary'
        : 'bg-slate-100 text-slate-600 border-slate-200')
    }>
      <span className="material-symbols-outlined text-xs">{icon}</span> {label}
    </div>
  );
}
