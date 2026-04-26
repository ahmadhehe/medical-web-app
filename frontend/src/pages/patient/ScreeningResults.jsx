import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getScreeningById } from '../../services/screening.service';
import { getDoctors } from '../../services/doctor.service';
import { createAppointment } from '../../services/appointment.service';

const URGENCY_BADGE = {
  emergency: 'bg-red-100    text-red-800    border-red-200    dark:bg-red-900/30    dark:text-red-400',
  high:      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  medium:    'bg-amber-100  text-amber-800  border-amber-200  dark:bg-amber-900/30  dark:text-amber-400',
  low:       'bg-green-100  text-green-800  border-green-200  dark:bg-green-900/30  dark:text-green-400',
};
const URGENCY_DOT = {
  emergency: 'bg-red-500',
  high:      'bg-orange-500',
  medium:    'bg-amber-500',
  low:       'bg-green-500',
};

export default function ScreeningResults() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();
  const [params]   = useSearchParams();
  const screeningId = params.get('id');

  const [screening,      setScreening]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [showBooking,    setShowBooking]    = useState(false);
  const [doctors,        setDoctors]        = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [booking,        setBooking]        = useState({ doctorId: '', scheduledAt: '' });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!screeningId) { navigate('/patient/screening'); return; }
    getScreeningById(screeningId)
      .then(r => setScreening(r.data))
      .catch(() => toast('Failed to load results'))
      .finally(() => setLoading(false));
  }, [screeningId]);

  async function openBooking() {
    setShowBooking(true);
    if (doctors.length > 0) return;
    setDoctorsLoading(true);
    getDoctors()
      .then(r => setDoctors(r.data))
      .catch(() => toast('Failed to load doctors'))
      .finally(() => setDoctorsLoading(false));
  }

  async function handleBook(e) {
    e.preventDefault();
    if (!booking.doctorId || !booking.scheduledAt) { toast('Please fill in all fields'); return; }
    setBookingLoading(true);
    try {
      await createAppointment({
        patientId:   user.id,
        doctorId:    booking.doctorId,
        scheduledAt: new Date(booking.scheduledAt).toISOString(),
        screeningId,
      });
      toast('Appointment booked!', 'success');
      setShowBooking(false);
      navigate('/patient/profile');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  if (!screening) return null;

  const urgency = (screening.urgencyLevel || 'low').toLowerCase();
  const specializations = screening.suggestedSpecialization
    ? screening.suggestedSpecialization.split(',').map(s => s.trim())
    : [];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 space-y-6 font-display">

      {/* Title */}
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          AI Pre-Screening Complete
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Based on your reported symptoms and medical history.
        </p>
      </div>

      {/* Assessment summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <span className="material-symbols-outlined text-xl">content_paste</span>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Assessment Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Severity</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                {screening.severity}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Urgency Level</span>
              <div className="pt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${URGENCY_BADGE[urgency] ?? URGENCY_BADGE.low}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${URGENCY_DOT[urgency] ?? URGENCY_DOT.low}`} />
                  {screening.urgencyLevel?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Suggested Specialization</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {screening.suggestedSpecialization}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority Timeframe</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {screening.priorityTimeframe}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI insight */}
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 border-l-4 border-primary">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">psychology</span>
          AI Preliminary Insight
        </h4>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
          "{screening.preliminaryAssessment}"
        </p>
      </div>

      {/* Recommended specialist */}
      {specializations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border-slate-200 dark:border-slate-800 border border-l-[6px] border-l-primary overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recommended Specialist</h3>
              {screening.priorityTimeframe && (
                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-900/30">
                  <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                  Priority: {screening.priorityTimeframe}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {specializations.map(s => (
                <span key={s} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">stethoscope</span>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={openBooking}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">calendar_today</span>
          Book Appointment Now
        </button>
        <button
          onClick={() => navigate('/patient/profile')}
          className="w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-all text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Return to Dashboard
        </button>
      </div>

      {/* Disclaimer */}
      <footer className="pt-2 pb-8">
        <div className="flex items-start gap-3 text-left max-w-[600px] mx-auto text-slate-400 text-[11px] leading-relaxed">
          <span className="material-symbols-outlined text-base mt-0.5 shrink-0">info</span>
          <p>
            <strong>Medical Disclaimer:</strong> This assessment is generated by AI for informational
            purposes only and is not a formal diagnosis. If you are experiencing a medical emergency,
            please call emergency services immediately.
          </p>
        </div>
      </footer>

      {/* ── Book Appointment Modal ── */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Book Appointment</h3>
              <button
                onClick={() => setShowBooking(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleBook} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Doctor
                </label>
                {doctorsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    Loading doctors...
                  </div>
                ) : (
                  <select
                    value={booking.doctorId}
                    onChange={e => setBooking(b => ({ ...b, doctorId: e.target.value }))}
                    required
                    className="w-full h-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm"
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}{d.specialization ? ` — ${d.specialization}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={booking.scheduledAt}
                  onChange={e => setBooking(b => ({ ...b, scheduledAt: e.target.value }))}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full h-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm px-3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {bookingLoading && (
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  )}
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
