import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Settings() {
  const { user } = useAuth();
  const toast    = useToast();

  const [notifications, setNotifications] = useState({
    emailAppointments:  true,
    emailUrgent:        true,
    pushAppointments:   true,
    pushUrgent:         true,
  });

  const [availability, setAvailability] = useState({
    mon: true, tue: true, wed: true,
    thu: true, fri: true, sat: false, sun: false,
  });

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast('Settings saved', 'success');
  }

  return (
    <div className="flex flex-col font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Manage your preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
        >
          {saving
            ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            : <span className="material-symbols-outlined text-[18px]">save</span>
          }
          Save Changes
        </button>
      </header>

      <div className="p-8 max-w-2xl space-y-6">

        {/* Profile */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person</span>
            Profile
          </h3>
          <div className="flex items-center gap-5 mb-6">
            <div className="size-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
              {user?.fullName?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{user?.fullName ?? 'Doctor'}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-primary font-semibold mt-0.5 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                defaultValue={user?.fullName ?? ''}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                defaultValue={user?.email ?? ''}
                type="email"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specialization</label>
              <input
                defaultValue={user?.specialization ?? ''}
                placeholder="e.g. Cardiology"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                defaultValue={user?.phone ?? ''}
                placeholder="+1 234 567 8900"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>
        </section>

        {/* Availability */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            Working Days
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(availability).map(([day, active]) => (
              <button
                key={day}
                onClick={() => setAvailability((a) => ({ ...a, [day]: !a[day] }))}
                className={
                  'px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all border ' +
                  (active
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/40')
                }
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { key: 'emailAppointments', label: 'Email — New appointments',  icon: 'mail' },
              { key: 'emailUrgent',       label: 'Email — Urgent cases',      icon: 'mail' },
              { key: 'pushAppointments',  label: 'Push — New appointments',   icon: 'notifications' },
              { key: 'pushUrgent',        label: 'Push — Urgent cases',       icon: 'notifications' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">{icon}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </div>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                  className={
                    'relative w-11 h-6 rounded-full transition-colors ' +
                    (notifications[key] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700')
                  }
                >
                  <span className={
                    'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ' +
                    (notifications[key] ? 'translate-x-5' : '')
                  } />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Password */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            Change Password
          </h3>
          <div className="space-y-4">
            {['Current Password', 'New Password', 'Confirm New Password'].map((label) => (
              <div key={label}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  type="password"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            ))}
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Update Password
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
