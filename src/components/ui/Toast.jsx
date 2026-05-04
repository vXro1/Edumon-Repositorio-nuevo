// src/components/ui/Toast.jsx
// Canonical Toast notification — fixed bottom-right, auto-dismisses via makeNotify.
// API: <Toast msg="..." type="success|error|info" />
// Renders nothing when msg is falsy.
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const VARIANTS = {
  success: {
    bg:     "rgba(65, 217, 88, 0.10)",
    border: "rgba(65, 217, 88, 0.30)",
    color:  "var(--color-success-hover)",
    Icon:   CheckCircle2,
  },
  error: {
    bg:     "rgba(239, 68, 68, 0.10)",
    border: "rgba(239, 68, 68, 0.28)",
    color:  "var(--color-error)",
    Icon:   AlertCircle,
  },
  info: {
    bg:     "rgba(140, 56, 240, 0.08)",
    border: "rgba(140, 56, 240, 0.25)",
    color:  "var(--color-primary)",
    Icon:   Info,
  },
};

export default function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const { bg, border, color, Icon } = VARIANTS[type] ?? VARIANTS.success;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: bg,
      border: `1px solid ${border}`,
      color,
      padding: "12px 18px",
      borderRadius: 12,
      fontSize: 13.5,
      fontWeight: 600,
      boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      maxWidth: 360,
      pointerEvents: "none",
    }}>
      <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
      {msg}
    </div>
  );
}
