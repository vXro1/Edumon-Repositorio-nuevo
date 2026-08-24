// src/features/cursos/components/shared/ui.jsx
import { useState } from "react";
import { Star } from "lucide-react";
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0, overflowWrap: "anywhere" }}>
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

// `label`: texto visible junto al ícono. Omitirlo solo para acciones de
// significado verdaderamente universal (actualizar, cerrar "X") — cualquier
// acción específica del dominio (editar, eliminar, ver, archivar,
// participantes, responder...) debe pasar `label` para no depender de que
// el usuario adivine qué hace el ícono (ver plan de corrección UX/UI).
export function IconBtn({ color, onClick, title, label, children, disabled = false }) {
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      disabled={disabled}
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        borderRadius: 7,
        padding: label ? "7px 12px" : 7,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: label ? 6 : 0,
        fontSize: 12.5,
        fontWeight: 700,
        fontFamily: "inherit",
        transition: "background var(--transition-fast)",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `color-mix(in srgb, ${color} 22%, transparent)`; }}
      onMouseLeave={e => (e.currentTarget.style.background = `color-mix(in srgb, ${color} 12%, transparent)`)}
    >
      {children}
      {label && <span>{label}</span>}
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

// ── Calificación de entregas: el backend valora entregas de 1 a 5 estrellas
// (calificarEntregaValidator.js), no con una nota numérica. Un solo par de
// componentes de estrellas usado en todas las pantallas de entregas
// (EntregasTab, CalificarEntrega, EntregasPage) evita que cada una invente
// su propia variante visual/de datos.

// Estrellas de solo lectura — para mostrar una valoración ya guardada.
export function StarRating({ value, size = 14, showLabel = false }) {
  const n = Number.isInteger(value) ? value : 0;
  if (n < 1) {
    return (
      <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic" }}>
        Sin valoración
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: size, height: size,
            fill: i <= n ? "#F59E0B" : "none",
            color: i <= n ? "#F59E0B" : "var(--color-border)",
          }}
        />
      ))}
      {showLabel && (
        <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginLeft: 4 }}>
          {n}/5
        </span>
      )}
    </span>
  );
}

// Estrellas interactivas — para elegir una valoración al calificar.
export function StarRatingInput({ value, onChange, size = 26 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 2, display: "flex", alignItems: "center",
            }}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{
                width: size, height: size,
                fill: filled ? "#F59E0B" : "none",
                color: filled ? "#F59E0B" : "var(--color-border)",
                transition: "all 120ms",
              }}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span style={{ fontSize: 13, color: "var(--color-text-muted)", marginLeft: 4 }}>
          {value} de 5
        </span>
      )}
    </div>
  );
}