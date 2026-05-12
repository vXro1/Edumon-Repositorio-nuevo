// src/features/cursos/components/shared/ui.jsx
import { Button } from "@/components";

export function Sk({ h = 16, w = "100%", r = 8 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div style={{
      textAlign: "center", padding: "52px 24px",
      background: "var(--color-surface)", borderRadius: 16,
      border: "1px solid var(--color-border)",
    }}>
      {Icon && (
        <Icon style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
      )}
      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>
        {title}
      </p>
      {desc && (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 18px" }}>
          {desc}
        </p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
        {title}
      </h3>
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 11.5, fontWeight: 700,
        color: "var(--color-text-muted)", textTransform: "uppercase",
        letterSpacing: "0.06em", marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function StTextarea({ ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1.5px solid var(--color-border)", background: "var(--color-bg)",
        color: "var(--color-text)", fontSize: 13.5, outline: "none",
        resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
      onBlur={(e)  => (e.target.style.borderColor = "var(--color-border)")}
    />
  );
}

export function InfoBlock({ label, children }) {
  return (
    <div style={{
      background: "var(--color-bg)", borderRadius: 10,
      border: "1px solid var(--color-border)", padding: "12px 14px",
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export function IconBtn({ color, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        borderRadius: 7,
        padding: 7,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background var(--transition-fast)",
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = `color-mix(in srgb, ${color} 22%, transparent)`)}
      onMouseLeave={e => (e.currentTarget.style.background = `color-mix(in srgb, ${color} 12%, transparent)`)}
    >
      {children}
    </button>
  );
}

export const iconBtn = (color) => ({
  background: `color-mix(in srgb, ${color} 12%, transparent)`,
  border: "none", borderRadius: 7, padding: 7, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color, transition: "background 150ms",
});

export const ESTADO_VARIANT = {
  borrador:   "neutral",
  enviada:    "info",
  tarde:      "warning",
  calificada: "success",
};