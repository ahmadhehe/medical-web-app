import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getProfile, updateProfile, createProfile,
  getAllergies, addAllergy, removeAllergy,
} from '../../services/patient.service';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
const GENDERS     = ['male', 'female', 'other'];

const CONDITIONS = [
  { id: 'hasHypertension', icon: 'blood_pressure', label: 'Hypertension' },
  { id: 'hasDiabetes',     icon: 'glucose',         label: 'Diabetes'     },
  { id: 'hasAsthma',       icon: 'pulmonology',     label: 'Asthma'       },
  { id: 'hasHeartDisease', icon: 'cardiology',      label: 'Heart Disease'},
];

const selectCls =
  'w-full h-11 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 ' +
  'focus:ring-primary focus:border-primary transition-colors text-sm';

const inputCls =
  'flex-1 h-11 rounded-l-lg border border-slate-200 dark:border-slate-700 ' +
  'dark:bg-slate-800 focus:ring-primary focus:border-primary border-r-0 px-4 outline-none text-sm';

export default function MedicalProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [hasProfile,       setHasProfile]       = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [heightUnit,       setHeightUnit]       = useState('cm');
  const [weightUnit,       setWeightUnit]       = useState('kg');
  const [allergyInput,     setAllergyInput]     = useState('');
  const [noKnownAllergies, setNoKnownAllergies] = useState(false);
  const [allergies,        setAllergies]        = useState([]);
  const [form,             setForm]             = useState({
    dateOfBirth: '', gender: '', bloodType: '',
    height: '', weight: '',
    hasHypertension: false, hasDiabetes: false,
    hasAsthma: false, hasHeartDisease: false,
    additionalNotes: '',
  });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getProfile(user.id)
        .then(({ data: p }) => {
          setHasProfile(true);
          setForm({
            dateOfBirth:    p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
            gender:         p.gender      || '',
            bloodType:      p.bloodType   || '',
            height:         p.heightCm    != null ? String(p.heightCm) : '',
            weight:         p.weightKg    != null ? String(p.weightKg) : '',
            hasHypertension: p.hasHypertension ?? false,
            hasDiabetes:     p.hasDiabetes     ?? false,
            hasAsthma:       p.hasAsthma        ?? false,
            hasHeartDisease: p.hasHeartDisease  ?? false,
            additionalNotes: p.additionalNotes  || '',
          });
        })
        .catch(e => { if (e.response?.status !== 404) toast('Failed to load profile'); }),
      getAllergies(user.id)
        .then(({ data }) => setAllergies(data))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  async function handleAllergyKeyDown(e) {
    if (e.key !== 'Enter' || !allergyInput.trim()) return;
    e.preventDefault();
    try {
      const { data } = await addAllergy(user.id, { name: allergyInput.trim() });
      setAllergies(prev => [...prev, data]);
      setAllergyInput('');
    } catch {
      toast('Failed to add allergy');
    }
  }

  async function handleRemoveAllergy(aid) {
    try {
      await removeAllergy(user.id, aid);
      setAllergies(prev => prev.filter(a => a.id !== aid));
    } catch {
      toast('Failed to remove allergy');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
        ...(form.gender      ? { gender: form.gender }           : {}),
        bloodType:       form.bloodType   || null,
        heightCm:        form.height      ? parseFloat(form.height) : null,
        weightKg:        form.weight      ? parseFloat(form.weight) : null,
        hasHypertension: form.hasHypertension,
        hasDiabetes:     form.hasDiabetes,
        hasAsthma:       form.hasAsthma,
        hasHeartDisease: form.hasHeartDisease,
        additionalNotes: form.additionalNotes || null,
      };

      if (hasProfile) {
        await updateProfile(user.id, payload);
      } else {
        await createProfile(user.id, payload);
        setHasProfile(true);
      }
      toast('Profile saved!', 'success');
      navigate('/patient/screening');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-[680px] mx-auto px-6 py-8 font-display">

      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
          {hasProfile ? 'Update Profile' : 'Setup'}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Medical Profile</h1>
        <p className="text-primary text-sm font-medium mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          This helps us personalize your care experience.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Basic Health Info ── */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">monitor_heart</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Basic Health Info</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-11 border border-slate-200 dark:border-slate-700">
                {GENDERS.map(g => (
                  <label key={g} className="flex-1 cursor-pointer">
                    <input
                      type="radio" name="gender" value={g}
                      checked={form.gender === g}
                      onChange={() => setForm(f => ({ ...f, gender: g }))}
                      className="sr-only"
                    />
                    <div className={`h-full flex items-center justify-center rounded-md text-xs font-bold capitalize transition-all ${
                      form.gender === g ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
                    }`}>
                      {g}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Blood Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Blood Type
              </label>
              <select
                value={form.bloodType}
                onChange={e => setForm(f => ({ ...f, bloodType: e.target.value }))}
                className={selectCls}
              >
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map(t => (
                  <option key={t} value={t}>{t === 'unknown' ? "I don't know" : t}</option>
                ))}
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Height
              </label>
              <div className="flex h-11">
                <input
                  type="number" min="0"
                  placeholder={heightUnit === 'cm' ? '175' : '5.9'}
                  value={form.height}
                  onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                  className={inputCls}
                />
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-r-lg border border-slate-200 dark:border-slate-700">
                  {['cm', 'ft'].map(u => (
                    <button key={u} type="button" onClick={() => setHeightUnit(u)}
                      className={`px-3 rounded text-xs font-bold uppercase transition-all ${heightUnit === u ? 'bg-primary text-white' : 'text-slate-500'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Weight
              </label>
              <div className="flex h-11">
                <input
                  type="number" min="0"
                  placeholder={weightUnit === 'kg' ? '70' : '154'}
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                  className={inputCls}
                />
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-r-lg border border-slate-200 dark:border-slate-700">
                  {['kg', 'lbs'].map(u => (
                    <button key={u} type="button" onClick={() => setWeightUnit(u)}
                      className={`px-3 rounded text-xs font-bold uppercase transition-all ${weightUnit === u ? 'bg-primary text-white' : 'text-slate-500'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Allergies ── */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">warning</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Allergies</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Known allergies
              </label>
              <div className="min-h-[2.75rem] p-2 flex flex-wrap gap-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                {allergies.map(a => (
                  <span key={a.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                    {a.name}
                    <button type="button" onClick={() => handleRemoveAllergy(a.id)} className="hover:text-primary/60 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={allergies.length ? 'Add another...' : 'Type and press Enter...'}
                  value={allergyInput}
                  onChange={e => setAllergyInput(e.target.value)}
                  onKeyDown={handleAllergyKeyDown}
                  disabled={noKnownAllergies}
                  className="flex-1 min-w-[140px] bg-transparent border-0 focus:ring-0 p-1 text-sm outline-none disabled:opacity-40"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={noKnownAllergies}
                onChange={e => setNoKnownAllergies(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">I have no known allergies</span>
            </label>
          </div>
        </section>

        {/* ── Medical History ── */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">history_edu</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Medical History</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {CONDITIONS.map(({ id, icon, label }) => (
              <label
                key={id}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  form[id]
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-100 dark:border-slate-800 hover:border-primary/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form[id]}
                  onChange={() => setForm(f => ({ ...f, [id]: !f[id] }))}
                  className="sr-only"
                />
                <span className={`material-symbols-outlined mb-1.5 ${form[id] ? 'text-primary' : 'text-slate-400'}`}>
                  {icon}
                </span>
                <span className="text-xs font-medium text-center leading-tight">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Notes
            </label>
            <textarea
              value={form.additionalNotes}
              onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))}
              placeholder="Specify other conditions or details..."
              rows={3}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary transition-colors text-sm"
            />
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving
              ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              : <span className="material-symbols-outlined">arrow_forward</span>
            }
            Save Profile &amp; Continue
          </button>
          <button
            type="button"
            onClick={() => navigate('/patient/screening')}
            className="text-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-sm font-medium underline underline-offset-4 decoration-slate-300 transition-colors"
          >
            Skip for now
          </button>
        </div>

      </form>
    </div>
  );
}
