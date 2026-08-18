// src/components/ui/Toast.jsx
// Canonical Toast notification — fixed bottom-right, auto-dismisses via makeNotify.
// API: <Toast msg="..." type="success|error|info" />
// Renders nothing when msg is falsy.
//
// Usa createPortal para escapar de cualquier ancestro con transform que crearía
// un stacking context separado y pondría el toast detrás del modal overlay.
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

// Todo depende de tokens semánticos vía color-mix() — nada hardcodeado.
// "info" usa --color-primary, scopeado a .app-shell (ver MainLayout.jsx):
// azul en el dashboard, morado en login/landing, automático.
const VARIANTS = {
  success: {
    bg:     "color-mix(in srgb, var(--color-success) 10%, transparent)",
    border: "color-mix(in srgb, var(--color-success) 30%, transparent)",
    color:  "var(--edu-green-700)",
    accent: "var(--color-success)",
    Icon:   CheckCircle2,
  },
  error: {
    bg:     "color-mix(in srgb, var(--color-error) 10%, transparent)",
    border: "color-mix(in srgb, var(--color-error) 28%, transparent)",
    color:  "var(--color-error-hover)",
    accent: "var(--color-error)",
    Icon:   AlertCircle,
  },
  info: {
    bg:     "color-mix(in srgb, var(--color-primary) 8%, transparent)",
    border: "color-mix(in srgb, var(--color-primary) 24%, transparent)",
    color:  "var(--color-primary)",
    accent: "var(--color-primary)",
    Icon:   Info,
  },
};

export default function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const { bg, border, color, accent, Icon } = VARIANTS[type] ?? VARIANTS.success;

  return createPortal(
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "color-mix(in srgb, var(--color-surface) 97%, transparent)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${border}`,
      borderLeft: `3px solid ${accent}`,
      color,
      padding: "10px 16px 10px 12px",
      borderRadius: 12,
      fontSize: 13.5,
      fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      maxWidth: 360,
      pointerEvents: "none",
    }}>
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 9, flexShrink: 0,
        background: bg, color: accent,
      }}>
        <Icon style={{ width: 15, height: 15 }} />
      </span>
      {msg}
    </div>,
    document.body
  );
}
