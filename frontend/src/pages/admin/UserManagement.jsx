import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllUsers,
  deleteUser,
  updateUserStatus,
  resetPassword,
} from '../../services/user.service';
import api from '../../services/api';
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

/* ── Reset Password Modal ── */
function ResetPasswordModal({ user, onClose, onDone }) {
  const [method, setMethod]     = useState('link');
  const [tempPwd, setTempPwd]   = useState('');
  const [loading, setLoading]   = useState(false);
  const { showToast } = useToast();

  async function handleSubmit() {
    setLoading(true);
    try {
      if (method === 'temp') {
        if (!tempPwd.trim()) { showToast('Enter a temporary password', 'error'); return; }
        await resetPassword(user.id, tempPwd);
      } else {
        await resetPassword(user.id, null);
      }
      showToast('Password reset initiated', 'success');
      onDone();
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">vpn_key</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Reset User Password</h2>
              <p className="text-sm text-slate-500">Update security credentials for {user.fullName}</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Toggle */}
            <div className="bg-slate-50 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setMethod('link')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  method === 'link' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
                }`}
              >
                Send Link
              </button>
              <button
                onClick={() => setMethod('temp')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  method === 'temp' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
                }`}
              >
                Generate Temp
              </button>
            </div>

            {method === 'link' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Method details</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A secure, time-sensitive reset link will be sent to the user's registered email address.
                  This link expires in 24 hours.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Temporary Password</label>
                <input
                  type="text"
                  value={tempPwd}
                  onChange={(e) => setTempPwd(e.target.value)}
                  placeholder="Enter temporary password..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            )}

            {/* Preview */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Notification Preview
              </div>
              <p className="text-sm text-slate-600 italic">
                {method === 'link'
                  ? `"An email will be sent to ${user.email} with instructions to securely reset their password."`
                  : `"A temporary password will be set. The user will be required to change it on next login."`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Sending…' : method === 'link' ? 'Send Reset Link' : 'Set Temp Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Deactivate Modal ── */
function DeactivateModal({ user, onClose, onDone }) {
  const [reason, setReason]   = useState('End of contract / Employment');
  const [notes, setNotes]     = useState('');
  const [notify, setNotify]   = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleDeactivate() {
    setLoading(true);
    try {
      await updateUserStatus(user.id, 'inactive');
      showToast(`${user.fullName} has been deactivated`, 'success');
      onDone();
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Deactivation failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Deactivate Account</h2>
              <p className="text-sm text-slate-500">Disable access for {user.fullName}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <span className="material-symbols-outlined text-amber-600 shrink-0">info</span>
              <p className="text-xs text-amber-800 leading-normal">
                <strong>Warning:</strong> The user will lose access to all clinical records, history, and
                scheduled appointments immediately. This action can only be undone by a Super Admin.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Deactivation</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary py-2 px-3"
              >
                <option>End of contract / Employment</option>
                <option>Security breach suspected</option>
                <option>Administrative error</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Internal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Provide additional context for this action..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary px-3 py-2 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <input
                id="notify-user"
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="notify-user" className="text-sm font-medium text-slate-700">
                Notify user via email/SMS
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Deactivating…' : 'Deactivate Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirm dialog ── */
function DeleteDialog({ user, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteUser(user.id);
      showToast(`${user.fullName} deleted`, 'success');
      onDone();
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Delete failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined">delete</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Delete User</h2>
            <p className="text-sm text-slate-500">This action is permanent.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to permanently delete <strong>{user.fullName}</strong>? All associated data will be removed.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Row action menu ── */
function ActionMenu({ user, onReset, onDeactivate, onDelete, onView }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="material-symbols-outlined text-slate-400 hover:text-primary text-xl"
      >
        more_vert
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-20 overflow-hidden">
            <button onClick={() => { setOpen(false); onView(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person</span> View Profile
            </button>
            <button onClick={() => { setOpen(false); onReset(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">vpn_key</span> Reset Password
            </button>
            {user.status === 'active' ? (
              <button onClick={() => { setOpen(false); onDeactivate(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">block</span> Deactivate
              </button>
            ) : (
              <button onClick={async () => {
                setOpen(false);
                try { await updateUserStatus(user.id, 'active'); onView(); }
                catch {}
              }}
                className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span> Activate
              </button>
            )}
            <button onClick={() => { setOpen(false); onDelete(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">delete</span> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function UserManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers]           = useState([]);
  const [departments, setDepts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const limit = 10;

  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [deptFilter, setDept]       = useState('');

  const [resetTarget, setResetTarget]       = useState(null);
  const [deactivateTarget, setDeactivate]   = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({
        search: search || undefined,
        role:   roleFilter || undefined,
        status: statusFilter || undefined,
        department: deptFilter || undefined,
        page,
        limit,
      });
      setUsers(res.data.users ?? res.data);
      setTotal(res.data.total ?? res.data.length);
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, deptFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    api.get('/users/departments')
      .then((r) => {
        const raw = r.data ?? [];
        setDepts(raw.map((d) => (typeof d === 'string' ? d : d.department ?? d.name ?? String(d))));
      })
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handleApply(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div className="flex flex-col min-h-full bg-background-light">

      {/* Modals */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => { setResetTarget(null); fetchUsers(); }}
        />
      )}
      {deactivateTarget && (
        <DeactivateModal
          user={deactivateTarget}
          onClose={() => setDeactivate(null)}
          onDone={() => { setDeactivate(null); fetchUsers(); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={() => { setDeleteTarget(null); fetchUsers(); }}
        />
      )}

      {/* Header */}
      <header className="h-16 bg-white border-t-[3px] border-primary border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">User Management</h2>
          <p className="text-xs text-slate-500">{total.toLocaleString()} total users</p>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Add User
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Filter bar */}
        <form onSubmit={handleApply} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or email…"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary"
              >
                <option value="">All Roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDept(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary"
              >
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Apply */}
            <div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">filter_alt</span>
                Apply Filters
              </button>
            </div>
          </div>
        </form>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-primary/20">
            <span className="material-symbols-outlined text-sm">analytics</span>
            {loading ? 'Loading…' : `${total.toLocaleString()} users found`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-8 bg-slate-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}
                {!loading && users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.fullName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${ROLE_BADGE[u.role] ?? ROLE_BADGE.patient}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.department ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_BADGE[u.status] ?? STATUS_BADGE.pending}`}>
                        {u.status ?? 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        user={u}
                        onView={() => navigate(`/admin/users/${u.id}`)}
                        onReset={() => setResetTarget(u)}
                        onDeactivate={() => setDeactivate(u)}
                        onDelete={() => setDeleteTarget(u)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500">
              Showing {users.length === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg;
                if (totalPages <= 5) {
                  pg = i + 1;
                } else if (page <= 3) {
                  pg = i + 1;
                } else if (page >= totalPages - 2) {
                  pg = totalPages - 4 + i;
                } else {
                  pg = page - 2 + i;
                }
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                      pg === page
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}

              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="text-slate-400">...</span>
                  <button onClick={() => setPage(totalPages)}
                    className="w-8 h-8 rounded text-xs font-bold hover:bg-slate-200 text-slate-600">
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
