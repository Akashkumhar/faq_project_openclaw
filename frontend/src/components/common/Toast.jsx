import { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext(null);

let toastId = 0;
let addToastFn = null;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Expose globally via window for easy access
  useEffect(() => {
    window.toast = addToast;
    return () => { delete window.toast; };
  }, []);

  const bgColors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        maxWidth: '360px',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              padding: '12px 16px',
              background: bgColors[t.type] || bgColors.info,
              color: 'white',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export function toast(message, type = 'info') {
  if (typeof window !== 'undefined' && window.toast) {
    window.toast(message, type);
  }
}

export default toast;