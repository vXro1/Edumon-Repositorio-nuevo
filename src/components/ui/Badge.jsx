// src/components/ui/Badge.jsx

/* ─────────────────────────────────────────────────────────────────────────
   Badges — Soft UI:
   • Relleno de color suave (10-15%) + borde fino del mismo tono
   • box-shadow: var(--clay-pill) — una sombra suave fija, no una "base" 3D
   • Sin bounce de entrada ni sombra que se hunde al presionar
   • Todo sale de tokens (--color-..., --edu-...), nada hardcodeado
───────────────────────────────────────────────────────────────────────── */

/* ── KEYFRAMES inyectados una sola vez ─────────────────────────────────── */
const CSS = `
@keyframes badge-in {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes badge-pulse-dot {
  0%, 100%    { transform: scale(1);    opacity: 1; }
  50%         { transform: scale(0.55); opacity: 0.55; }
}
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-sans);
  font-weight: var(--font-semibold);
  letter-spacing: 0.01em;
  white-space: nowrap;
  border-radius: 100px;
  outline: none;
  cursor: default;
  user-select: none;
  animation: badge-in 150ms ease both;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
}
.ui-badge-interactive { cursor: pointer; }
.ui-badge-interactive:hover { transform: translateY(-1px); }
.ui-badge-interactive:active { transform: scale(0.97); }
.ui-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
  opacity: 0.75;
}
.ui-dot-pulse {
  animation: badge-pulse-dot 1.5s ease-in-out infinite;
}
.ui-badge-sm  { font-size: 10px; padding: 3px 9px;  }
.ui-badge-md  { font-size: 11px; padding: 5px 12px; }
.ui-badge-lg  { font-size: 13px; padding: 7px 16px; }
`;

/* ── PALETA — todo referencia tokens semánticos, nada hardcodeado ──────── */
const PALETTE = {
  success: { bg: "var(--color-success-light)", text: "var(--edu-green-700)",      ring: "var(--color-success)" },
  error:   { bg: "var(--color-error-light)",   text: "var(--color-error-hover)",  ring: "var(--color-error)" },
  warning: { bg: "var(--color-warning-light)", text: "var(--edu-yellow-700)",     ring: "var(--color-warning)" },
  info:    { bg: "var(--color-info-light)",    text: "var(--edu-cyan-700)",       ring: "var(--color-info)" },
  purple:  { bg: "var(--color-primary-light)", text: "var(--color-primary-hover)",ring: "var(--color-primary)" },
  neutral: { bg: "var(--color-surface-3)",     text: "var(--color-text-muted)",   ring: "var(--color-border-strong)" },
  dark:    { bg: "var(--edu-neutral-800)",     text: "#fff",                      ring: "var(--edu-neutral-900)" },
};

/* ── TAMAÑOS ────────────────────────────────────────────────────────────── */
const SIZE_CLASS = { sm: "ui-badge-sm", md: "ui-badge-md", lg: "ui-badge-lg" };

/* ── CSS ya inyectado? ──────────────────────────────────────────────────── */
let injected = false;
function injectOnce() {
  if (injected) return;
  const el = document.createElement("style");
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

/* ════════════════════════════════════════════════════════════════════════
   Badge principal
   Props:
     variant    : "success" | "error" | "warning" | "info" | "purple" | "neutral" | "dark"
     size       : "sm" | "md" | "lg"
     dot        : bool  — muestra punto de estado
     pulse      : bool  — el punto pulsa (activo/en vivo)
     interactive: bool  — hover + press effect
     icon       : node  — ícono a la izquierda
     onClose    : fn    — muestra X para chip removible
     className  : string
════════════════════════════════════════════════════════════════════════ */
export default function Badge({
  variant     = "info",
  size        = "md",
  dot         = false,
  pulse       = false,
  interactive = false,
  icon        = null,
  onClose     = null,
  children,
  className   = "",
  style       = {},
}) {
  injectOnce();

  const p = PALETTE[variant] ?? PALETTE.info;
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  return (
    <span
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={[
        "ui-badge",
        sizeClass,
        interactive ? "ui-badge-interactive" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        background: p.bg,
        color:      p.text,
        border:     `1px solid color-mix(in srgb, ${p.ring} 22%, transparent)`,
        boxShadow:  "var(--clay-pill)",
        ...style,
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}

      {(dot || pulse) && (
        <span
          className={["ui-dot", pulse ? "ui-dot-pulse" : ""].filter(Boolean).join(" ")}
          style={{ background: p.ring }}
          aria-hidden="true"
        />
      )}

      {children}

      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Eliminar"
          style={{
            background:   "color-mix(in srgb, currentColor 15%, transparent)",
            border:       "none",
            borderRadius: "50%",
            width:        "14px",
            height:       "14px",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            cursor:       "pointer",
            padding:      0,
            color:        p.text,
            fontSize:     "9px",
            fontWeight:   700,
            lineHeight:   1,
            flexShrink:   0,
          }}
        >
          ✕
        </button>
      )}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   NotifBadge — contador de notificaciones (el punto rojo del ícono)
════════════════════════════════════════════════════════════════════════ */
export function NotifBadge({ count = 0, variant = "error" }) {
  injectOnce();
  const p = PALETTE[variant] ?? PALETTE.error;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={`${label} notificaciones`}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        minWidth:       "18px",
        height:         "18px",
        padding:        "0 4px",
        borderRadius:   "100px",
        background:     p.ring,
        boxShadow:      "var(--clay-pill)",
        color:          "#fff",
        fontSize:       "10px",
        fontWeight:     700,
        lineHeight:     1,
        fontFamily:     "var(--font-sans)",
        animation:      "badge-in 150ms ease both",
      }}
    >
      {label}
    </span>
  );
}
