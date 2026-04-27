import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notification.service';

const TYPE_META = {
  info:    { icon: 'calendar_month', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  success: { icon: 'task_alt',       cls: 'bg-green-100 dark:bg-green-900/30 text-green-600'   },
  warning: { icon: 'lab_profile',    cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'      },
  urgent:  { icon: 'warning',        cls: 'bg-red-100 dark:bg-red-900/30 text-red-600'         },
};

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [marking,       setMarking]       = useState(false);
  const [filter,        setFilter]        = useState('all');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getNotifications()
      .then((r) => { if (alive) setNotifications(Array.isArray(r.data) ? r.data : []); })
      .catch(() => toast('Failed to load notifications', 'error'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [toast]);

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'urgent') return n.type === 'urgent';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkRead(id) {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast('Failed to mark as read', 'error');
    }
  }

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast('All notifications marked as read', 'success');
    } catch {
      toast('Failed to mark all as read', 'error');
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="flex flex-col font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Notifications</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark all read
          </button>
        )}
      </header>

      <div className="p-8 max-w-3xl">
        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
          {[
            { key: 'all',    label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'urgent', label: `Urgent (${notifications.filter((n) => n.type === 'urgent').length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={
                'px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ' +
                (filter === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-4xl">notifications_off</span>
              <p className="text-sm font-medium">No notifications here</p>
            </div>
          ) : (
            filtered.map((n, i) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.info;
              return (
                <div
                  key={n.id}
                  className={
                    'flex gap-4 p-5 transition-colors ' +
                    (!n.isRead ? 'bg-primary/5 dark:bg-primary/10 ' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 ') +
                    (i < filtered.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : '')
                  }
                >
                  <div className={'size-10 rounded-full flex items-center justify-center shrink-0 ' + meta.cls}>
                    <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        <span className="font-bold">{n.title}</span>
                        {n.message ? <> — {n.message}</> : null}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs text-slate-400">{relativeTime(n.createdAt)}</span>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
