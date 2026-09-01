// sistema global de toasts: <ToastProvider> + useToast().notify(msg, type)
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

let _id = 0;
const nextId = () => ++_id;

// "info" usa --color-primary, que está scopeado a .app-shell — cambia de azul a
// morado entre dashboard y login automáticamente, sin lógica aquí
const VARIANTS = {
  success: {
    bg:      "color-mix(in srgb, var(--color-success) 10%, transparent)",
    border:  "color-mix(in srgb, var(--color-success) 30%, transparent)",
    color:   "var(--edu-green-700)", // más oscuro que --color-success-hover, mejor contraste como texto
    accent:  "var(--color-success)",
    Icon:    CheckCircle2,
  },
  error: {
    bg:      "color-mix(in srgb, var(--color-error) 10%, transparent)",
    border:  "color-mix(in srgb, var(--color-error) 28%, transparent)",
    color:   "var(--color-error-hover)",
    accent:  "var(--color-error)",
    Icon:    AlertCircle,
  },
  info: {
    bg:      "color-mix(in srgb, var(--color-primary) 8%, transparent)",
    border:  "color-mix(in srgb, var(--color-primary) 24%, transparent)",
    color:   "var(--color-primary)",
    accent:  "var(--color-primary)",
    Icon:    Info,
  },
  warning: {
    bg:      "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    border:  "color-mix(in srgb, var(--color-warning) 30%, transparent)",
    color:   "var(--edu-yellow-700)", // más oscuro que --color-warning-hover, mejor contraste como texto
    accent:  "var(--color-warning)",
    Icon:    AlertTriangle,
  },
};

// ─── Elemento Toast individual ───────────────────────────────────────────────
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
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 9, flexShrink: 0,
        background: v.bg, color: v.accent,
      }}>
        <v.Icon style={{ width: 15, height: 15 }} />
      </span>
      <span style={{ flex: 1, paddingTop: 3 }}>{msg}</span>
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

// ─── Contenedor de Toasts ────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return createPortal(
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
    </>,
    document.body
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
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]); // máx 5 toasts

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
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
};
