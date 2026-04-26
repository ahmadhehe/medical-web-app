import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { login as loginApi, register as registerApi } from '../../services/auth.service';

const ROLE_HOME = {
  patient: '/patient/profile',
  doctor:  '/doctor/dashboard',
  admin:   '/admin/dashboard',
};

const BG_ICONS = [
  'medical_services', 'favorite',      'pulse_alert',  'pill',
  'vaccines',         'stethoscope',   'health_metrics','ecg_heart',
  'emergency',        'dermatology',   'monitor_heart', 'clinical_notes',
];

function passwordStrength(pw) {
  if (!pw) return { bars: 0, label: '', color: 'bg-slate-200' };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { bars: 0, label: '',       color: 'bg-slate-200 dark:bg-slate-700' },
    { bars: 1, label: 'Weak',   color: 'bg-red-500' },
    { bars: 2, label: 'Fair',   color: 'bg-yellow-400' },
    { bars: 3, label: 'Good',   color: 'bg-primary' },
    { bars: 4, label: 'Strong', color: 'bg-green-500' },
  ][s];
}

const inputCls =
  'w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 ' +
  'focus:border-primary transition-all outline-none text-sm';

export default function Login({ initialMode = 'login' }) {
  const [mode, setMode]           = useState(initialMode);
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [agreed, setAgreed]       = useState(false);
  const [form, setForm]           = useState({
    fullName: '', email: '', phone: '', role: 'patient', password: '', confirmPassword: '',
  });

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();
  const strength   = passwordStrength(form.password);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function switchMode(next) {
    setMode(next);
    setForm({ fullName: '', email: '', phone: '', role: 'patient', password: '', confirmPassword: '' });
    setAgreed(false);
    setShowPw(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'register') {
      if (form.password !== form.confirmPassword) { toast('Passwords do not match'); return; }
      if (!agreed) { toast('Please accept the terms to continue'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data } = await loginApi({ email: form.email, password: form.password });
        login(data.token, data.user);
        navigate(ROLE_HOME[data.user.role] ?? '/login', { replace: true });
      } else {
        const { data } = await registerApi({
          fullName: form.fullName, email: form.email,
          phone: form.phone,       role: form.role,
          password: form.password,
        });
        login(data.token, data.user);
        navigate(ROLE_HOME[data.user.role] ?? '/login', { replace: true });
      }
    } catch (err) {
      toast(err.response?.data?.error ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark font-display p-4 md:p-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl rounded-xl overflow-hidden flex flex-col lg:flex-row min-h-[580px] relative z-10">

        {/* ── Left panel ── */}
        <section className="lg:w-5/12 bg-teal-gradient relative flex flex-col justify-center p-10 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none grid grid-cols-4 gap-6 p-6 rotate-12 scale-125">
            {BG_ICONS.map((icon, i) => (
              <span key={i} className="material-symbols-outlined text-7xl">{icon}</span>
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <span className="material-symbols-outlined text-white text-2xl">medical_services</span>
              </div>
              <span className="text-xl font-bold tracking-tight">MediConnect</span>
            </div>

            {mode === 'login' ? (
              <>
                <h1 className="text-4xl font-black leading-tight mb-4">
                  Welcome back to MediConnect
                </h1>
                <p className="text-teal-50 text-base font-medium leading-relaxed">
                  Your secure gateway to clinical care, patient data, and AI-powered health insights.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-black leading-tight mb-4">
                  Your health journey starts here
                </h1>
                <p className="text-teal-50 text-base font-medium leading-relaxed">
                  Join thousands of patients and clinicians on the world's most intuitive healthcare platform.
                </p>
              </>
            )}

            <div className="mt-10 flex items-center gap-2 text-sm font-medium text-white/70">
              <span className="material-symbols-outlined text-base">verified_user</span>
              <span>HIPAA Compliant · 256-bit Encrypted</span>
            </div>
          </div>
        </section>

        {/* ── Right panel ── */}
        <section className="lg:w-7/12 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="max-w-md mx-auto w-full">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Heading */}
              <div className="mb-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {mode === 'login'
                    ? 'Sign in to access your dashboard'
                    : 'Set up your MediConnect account'}
                </p>
              </div>

              {/* Full name — register only */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text" placeholder="John Doe" required
                    value={form.fullName} onChange={setField('fullName')}
                    className={inputCls}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email" placeholder="name@example.com" required
                  value={form.email} onChange={setField('email')}
                  className={inputCls}
                />
              </div>

              {/* Phone + Role — register only */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel" placeholder="+1 234 567 890"
                      value={form.phone} onChange={setField('phone')}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      I am a
                    </label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-11">
                      {['patient', 'doctor'].map((r) => (
                        <label key={r} className="flex-1 cursor-pointer">
                          <input
                            type="radio" name="role" value={r}
                            checked={form.role === r} onChange={setField('role')}
                            className="sr-only"
                          />
                          <div className={`h-full flex items-center justify-center rounded-md text-xs font-bold capitalize transition-all ${
                            form.role === r
                              ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                              : 'text-slate-500'
                          }`}>
                            {r}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <a href="#" className="text-xs font-semibold text-primary hover:underline">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                    value={form.password} onChange={setField('password')}
                    className={inputCls + ' pr-11'}
                  />
                  <button
                    type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Strength meter — register only */}
                {mode === 'register' && form.password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Strength</span>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${
                        strength.bars >= 3 ? 'text-primary' : strength.bars === 2 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`h-1 rounded-full transition-colors ${
                            bar <= strength.bars ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password — register only */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                    value={form.confirmPassword} onChange={setField('confirmPassword')}
                    className={inputCls}
                  />
                </div>
              )}

              {/* Terms — register only */}
              {mode === 'register' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                    I agree to the{' '}
                    <a href="#" className="text-primary font-semibold hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a>
                  </span>
                </label>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full h-11 bg-teal-gradient text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && (
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                )}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              {/* Mode toggle */}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary font-semibold hover:underline ml-1"
                >
                  {mode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </p>

            </form>
          </div>
        </section>

      </main>
    </div>
  );
}
