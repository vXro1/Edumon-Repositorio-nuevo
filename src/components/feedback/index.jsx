// src/components/feedback/index.jsx
// Loading, ErrorState, Toast
 
import { useEffect, useState } from "react";
 
// ── Loading ───────────────────────────────────────────────────
export const Loading = ({ message = "Cargando..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  </div>
);
 
// ── ErrorState ────────────────────────────────────────────────
export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="text-sm text-red-700">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-sm font-semibold text-red-600 underline">
        Intentar nuevamente
      </button>
    )}
  </div>
);
 
// ── Toast ─────────────────────────────────────────────────────
export const Toast = ({ message, type = "success", onClose }) => {
  const [visible, setVisible] = useState(true);
 
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
 
  const styles = {
    success: "bg-teal-600 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };
 
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-4 shadow-xl
        transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        ${styles[type]}`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
};
 
// ── useToast hook ─────────────────────────────────────────────
export const useToast = () => {
  const [toast, setToast] = useState(null);
 
  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };
 
  const ToastRenderer = () =>
    toast ? (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    ) : null;
 
  return { showToast, ToastRenderer };
};
 