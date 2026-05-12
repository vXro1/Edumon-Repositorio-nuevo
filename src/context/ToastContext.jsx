// src/context/ToastContext.jsx
// Global toast system. Wrap app with <ToastProvider>, then call:
//   const { notify } = useToast();
//   notify("Guardado", "success");
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

let _id = 0;
const nextId = () => ++_id;

const VARIANTS = {
  success: {
    bg:      "rgba(65,217,88,0.10)",
    border:  "rgba(65,217,88,0.28)",
    color:   "#15803d",
    accent:  "rgba(65,217,88,0.85)",
    Icon:    CheckCircle2,
  },
  error: {
    bg:      "rgba(239,68,68,0.10)",
    border:  "rgba(239,68,68,0.26)",
    color:   "#dc2626",
    accent:  "rgba(239,68,68,0.85)",
    Icon:    AlertCircle,
  },
  info: {
    bg:      "rgba(140,56,240,0.08)",
    border:  "rgba(140,56,240,0.22)",
    color:   "var(--color-primary, #8C38F0)",
    accent:  "rgba(140,56,240,0.8)",
    Icon:    Info,
  },
  warning: {
    bg:      "rgba(252,189,0,0.10)",
    border:  "rgba(252,189,0,0.26)",
    color:   "#92400e",
    accent:  "rgba(252,189,0,0.85)",
    Icon:    AlertTriangle,
  },
};

// ─── Single Toast item ────────────────────────────────────────────────────────
const ToastItem = ({ id, msg, type = "success", onDismiss }) => {
  const v = VARIANTS[type] ?? VARIANTS.info;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display:       "flex",
        alignItems:    "flex-start",
        gap:           10,
        background:    "rgba(255,255,255,0.97)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border:        `1px solid ${v.border}`,
        borderLeft:    `3px solid ${v.accent}`,
        borderRadius:  12,
        padding:       "12px 14px",
        boxShadow:     "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        maxWidth:      360,
        animation:     "toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        fontSize:      13.5,
        fontWeight:    500,
        color:         v.color,
        lineHeight:    1.4,
      }}
    >
      <v.Icon style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{msg}</span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Cerrar notificación"
        style={{
          background:  "none",
          border:      "none",
          cursor:      "pointer",
          padding:     2,
          display:     "flex",
          opacity:     0.5,
          transition:  "opacity 0.15s",
          flexShrink:  0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
        onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
      >
        <X size={13} />
      </button>
    </div>
  );
};

// ─── Toast container ──────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>
      <div
        aria-live="polite"
        style={{
          position:      "fixed",
          bottom:        24,
          right:         24,
          zIndex:        99999,
          display:       "flex",
          flexDirection: "column",
          gap:           10,
          pointerEvents: "none",
          alignItems:    "flex-end",
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem {...t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const notify = useCallback((msg, type = "success", duration = 4500) => {
    const id = nextId();
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]); // max 5 toasts

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};
