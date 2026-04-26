import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in ${
            t.type === 'error'
              ? 'bg-red-600'
              : t.type === 'success'
              ? 'bg-primary'
              : 'bg-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">
            {t.type === 'error' ? 'error' : t.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
