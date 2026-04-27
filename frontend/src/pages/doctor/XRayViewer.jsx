import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  getImageById,
  addRadiologyNote,
  getRadiologyNotes,
} from '../../services/medicalImage.service';

const SEVERITY_BADGE = {
  high:     { label: 'HIGH SEVERITY',     cls: 'bg-red-100 text-red-700' },
  moderate: { label: 'MODERATE SEVERITY', cls: 'bg-amber-100 text-amber-700' },
  low:      { label: 'LOW SEVERITY',      cls: 'bg-slate-100 text-slate-600' },
};

const SEVERITY_BAR = {
  high:     'bg-red-500',
  moderate: 'bg-amber-500',
  low:      'bg-emerald-500',
};

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

function resolveImageUrl(p) {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return `${API_ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`;
}

export default function XRayViewer() {
  const { imageId } = useParams();
  const navigate    = useNavigate();
  const toast       = useToast();

  const [image, setImage]       = useState(null);
  const [notes, setNotes]       = useState([]);
  const [draft, setDraft]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [zoom, setZoom]         = useState(1);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(false);
  const [grid, setGrid]         = useState(false);
  const imgRef                  = useRef(null);

  useEffect(() => {
    if (!imageId) return;
    let alive = true;
    setLoading(true);
    Promise.all([getImageById(imageId), getRadiologyNotes(imageId)])
      .then(([img, ns]) => {
        if (!alive) return;
        setImage(img.data);
        setNotes(ns.data ?? []);
      })
      .catch((err) => {
        if (!alive) return;
        toast(err.response?.data?.error ?? 'Failed to load image', 'error');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [imageId, toast]);

  const findings = useMemo(
    () => (image?.xrayAiFindings ?? []).slice().sort((a, b) => a.findingNumber - b.findingNumber),
    [image],
  );

  const displaySrc = resolveImageUrl(image?.annotatedImagePath ?? image?.storagePath);

  async function handleSaveNote() {
    if (!draft.trim()) { toast('Note is empty', 'error'); return; }
    setSaving(true);
    try {
      const res = await addRadiologyNote(imageId, { content: draft.trim() });
      setNotes((prev) => [...prev, res.data]);
      setDraft('');
      toast('Radiological note saved', 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to save note', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    if (!displaySrc) return;
    const link = document.createElement('a');
    link.href = displaySrc;
    link.download = image?.fileName ?? 'xray.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="flex flex-col h-full font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {image?.patient?.fullName ?? (loading ? 'Loading…' : 'Unknown Patient')}
          </h2>
          <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 min-w-0">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">fingerprint</span>
              #{image?.id?.slice(0, 8) ?? '—'}
            </span>
            <span className="hidden md:flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              {image?.uploadedAt
                ? new Date(image.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </span>
            <span className="flex items-center gap-1 font-mono truncate">
              <span className="material-symbols-outlined text-[18px]">attachment</span>
              <span className="truncate max-w-[200px]">{image?.fileName ?? '—'}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => image?.patientId ? navigate(`/doctor/patients/${image.patientId}`) : navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to Patient Record
        </button>
      </header>

      {/* Diagnostic content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer */}
        <section className="w-[70%] relative flex flex-col overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
          <div className="absolute top-4 left-6 z-10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Diagnostic View
            </h3>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-8">
            <div className="relative max-h-full max-w-full bg-black shadow-2xl overflow-hidden flex items-center justify-center" style={{ minWidth: 320, minHeight: 400 }}>
              {loading ? (
                <p className="text-white/50 text-sm p-12">Loading image…</p>
              ) : displaySrc ? (
                <img
                  ref={imgRef}
                  src={displaySrc}
                  alt={image?.fileName ?? 'X-ray'}
                  className="h-full w-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    filter: contrast ? 'contrast(1.6) brightness(1.1)' : 'none',
                  }}
                />
              ) : (
                <p className="text-white/50 text-sm p-12">No image available</p>
              )}

              {grid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />
              )}

              <span className="absolute top-4 right-4 text-white/40 text-sm font-bold">R</span>
              <span className="absolute top-4 left-4 text-white/40 text-sm font-bold">L</span>
            </div>
          </div>

          {/* Toolbar */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 border border-white/10 rounded-full p-2 shadow-2xl backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(15,23,42,0.8)' }}
          >
            <ToolBtn icon="zoom_in"      onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} />
            <ToolBtn icon="zoom_out"     onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(2)))} />
            <span className="w-px h-6 bg-white/10 mx-1" />
            <ToolBtn icon="rotate_right" onClick={() => setRotation((r) => (r + 90) % 360)} />
            <ToolBtn icon="contrast"     active={contrast} onClick={() => setContrast((c) => !c)} />
            <ToolBtn icon="grid_on"      active={grid}     onClick={() => setGrid((g) => !g)} />
            <span className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={handleDownload}
              disabled={!displaySrc}
              className="p-2.5 text-primary hover:bg-primary/20 rounded-full transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </section>

        {/* AI findings panel */}
        <aside className="w-[30%] bg-white dark:bg-background-dark border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
              <h3 className="font-bold text-slate-900 dark:text-white">AI Anomaly Detection</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">
              {loading ? '…' : 'Active'}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            {loading ? (
              <p className="text-sm text-slate-400">Loading findings…</p>
            ) : findings.length === 0 ? (
              <p className="text-sm text-slate-400">No AI findings recorded.</p>
            ) : (
              findings.map((f, i) => <FindingCard key={f.id} f={f} primary={i === 0} />)
            )}
          </div>

          <div className="mt-auto space-y-4">
            {notes.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {n.doctor?.fullName ?? 'Doctor'}
                      <span className="text-slate-400 font-normal ml-2">{new Date(n.createdAt).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">edit_note</span>
              <label className="font-bold text-sm text-slate-700 dark:text-slate-300">Doctor's Radiological Notes</label>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Enter clinical observations, confirm AI findings, or provide diagnosis details..."
            />
            <button
              onClick={handleSaveNote}
              disabled={saving || !draft.trim()}
              className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              {saving ? 'Saving…' : 'Save Radiological Notes'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToolBtn({ icon, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={
        'p-2.5 rounded-full transition-all ' +
        (active ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10')
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}

function FindingCard({ f, primary }) {
  const sev   = f.severity ?? 'low';
  const badge = SEVERITY_BADGE[sev] ?? SEVERITY_BADGE.low;
  const bar   = SEVERITY_BAR[sev]   ?? SEVERITY_BAR.low;
  const conf  = Number(f.confidence ?? 0);
  const pct   = conf > 1 ? Math.min(100, Math.round(conf)) : Math.round(conf * 100);

  return (
    <div className={
      'p-4 rounded-xl border transition-all ' +
      (primary ? 'border-primary/20 bg-primary/5 hover:border-primary' : 'border-slate-200 dark:border-slate-800 hover:border-primary')
    }>
      <div className="flex items-center justify-between mb-2">
        <span className={'text-xs font-bold uppercase tracking-wider ' + (primary ? 'text-primary' : 'text-slate-400')}>
          Finding #{f.findingNumber}
        </span>
        <span className={'text-[10px] px-2 py-0.5 rounded font-bold ' + badge.cls}>{badge.label}</span>
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{f.description}</h4>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={'h-full ' + bar} style={{ width: `${pct}%` }} />
        </div>
        <span className={'text-xs font-bold ' + (primary ? 'text-primary' : 'text-slate-600 dark:text-slate-400')}>
          {pct}% Confidence
        </span>
      </div>
    </div>
  );
}
