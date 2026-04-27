import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAppointments } from '../../services/appointment.service';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
const resolveUrl = (p) => (!p ? '' : p.startsWith('http') ? p : `${API_ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`);

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default function MedicalRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAppointments({ limit: 200 })
      .then((r) => { if (alive) setAppointments(r.data?.appointments ?? []); })
      .catch((err) => { if (alive) toast(err.response?.data?.error ?? 'Failed to load records', 'error'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [toast]);

  // Collect all images across all appointments
  const records = appointments.flatMap((a) =>
    (a.medicalImages ?? []).map((img) => ({
      ...img,
      patient:     a.patient,
      scheduledAt: a.scheduledAt,
      appointmentId: a.id,
    }))
  );

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.patient?.fullName?.toLowerCase().includes(q) ||
      r.fileName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">Medical Records</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">X-rays, scans, and documents from your patients</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            placeholder="Search by patient or filename..."
            type="text"
          />
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatChip icon="folder_open"   label="Total Records" value={loading ? '—' : records.length}                                         tint="bg-primary/10 text-primary" />
          <StatChip icon="radiology"     label="X-rays / Scans" value={loading ? '—' : records.filter((r) => r.mimeType?.startsWith('image/')).length} tint="bg-blue-100 dark:bg-blue-900/30 text-blue-600" />
          <StatChip icon="picture_as_pdf" label="Documents"    value={loading ? '—' : records.filter((r) => !r.mimeType?.startsWith('image/')).length} tint="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <span className="material-symbols-outlined text-5xl">folder_off</span>
            <p className="font-semibold">{records.length === 0 ? 'No records yet' : 'No records match your search'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((img) => {
              const isImage = img.mimeType?.startsWith('image/');
              const thumb = resolveUrl(img.annotatedImagePath ?? img.storagePath);
              return (
                <div
                  key={img.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:border-primary/40 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <img src={thumb} alt={img.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <span className="material-symbols-outlined text-red-400 text-5xl">picture_as_pdf</span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{img.fileName}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{img.patient?.fullName ?? 'Unknown patient'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(img.uploadedAt ?? img.scheduledAt)}</p>

                    <button
                      onClick={() =>
                        isImage
                          ? navigate(`/doctor/xray/${img.id}`)
                          : window.open(resolveUrl(img.storagePath), '_blank')
                      }
                      className="mt-3 w-full py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {isImage ? 'View X-ray' : 'Open Document'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
