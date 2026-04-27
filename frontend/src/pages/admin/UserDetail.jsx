import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser, updateUserStatus, resetPassword } from '../../services/user.service';
import { useToast } from '../../context/ToastContext';

const ROLE_BADGE = {
  patient: 'bg-slate-100 text-slate-600',
  doctor:  'bg-primary/10 text-primary',
  admin:   'bg-slate-800 text-white',
};

const STATUS_BADGE = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-600',
  pending:  'bg-amber-100 text-amber-700',
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    fullName:   '',
    email:      '',
    role:       '',
    department: '',
    phone:      '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await getUserById(id);
        const u   = res.data;
        setUser(u);
        setForm({
          fullName:   u.fullName   ?? '',
          email:      u.email      ?? '',
          role:       u.role       ?? '',
          department: u.department ?? '',
          phone:      u.phone      ?? '',
        });
      } catch (err) {
        showToast(err.response?.data?.error ?? 'User not found', 'error');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(id, form);
      showToast('User updated successfully', 'success');
      const res = await getUserById(id);
      setUser(res.data);
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    const next = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(id, next);
      setUser((u) => ({ ...u, status: next }));
      showToast(`User ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Status update failed', 'error');
    }
  }

  async function handleResetPassword() {
    try {
      await resetPassword(id, null);
      showToast('Password reset link sent', 'success');
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Reset failed', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-background-light">
        <header className="h-16 bg-white border-t-[3px] border-primary border-b border-slate-200 flex items-center px-8">
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
        </header>
        <div className="p-8 space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  const initials = user.fullName?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className="flex flex-col min-h-full bg-background-light">

      {/* Header */}
      <header className="h-16 bg-white border-t-[3px] border-primary border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">User Profile</h2>
            <p className="text-xs text-slate-500">Edit details for {user.fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetPassword}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">vpn_key</span>
            Reset Password
          </button>
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              user.status === 'active'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {user.status === 'active' ? 'block' : 'check_circle'}
            </span>
            {user.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-6">
            <div className="size-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-900">{user.fullName}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${ROLE_BADGE[user.role] ?? ROLE_BADGE.patient}`}>
                  {user.role}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[user.status] ?? STATUS_BADGE.pending}`}>
                  {user.status ?? 'pending'}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 shrink-0">
              <p>Joined</p>
              <p className="font-medium text-slate-600">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
              {user.lastLogin && (
                <>
                  <p className="mt-2">Last login</p>
                  <p className="font-medium text-slate-600">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit</span>
              Edit Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Cardiology, Radiology…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
