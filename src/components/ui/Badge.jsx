// src/components/ui/Badge.jsx

/* ─────────────────────────────────────────────────────────────────────────
   Duolingo-style badges:
   • Sombra inferior gruesa = efecto "botón 3D"
   • Colores sólidos, saturados, sin transparencias
   • Borde inferior más oscuro que el fondo (la "base")
   • Micro-animación bounce al montar
   • Al hover: sube 1px (como si se presionara)
   • Al active: baja a la base (press)
───────────────────────────────────────────────────────────────────────── */

/* ── KEYFRAMES inyectados una sola vez ─────────────────────────────────── */
const CSS = `
@keyframes duo-bounce {
  0%          { transform: scale(0.6);  opacity: 0; }
  60%         { transform: scale(1.15); opacity: 1; }
  80%         { transform: scale(0.95); }
  100%        { transform: scale(1);   }
}
@keyframes duo-pulse-dot {
  0%, 100%    { transform: scale(1);    opacity: 1; }
  50%         { transform: scale(0.55); opacity: 0.55; }
}
.duo-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: "Nunito", "Fredoka One", system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
  border-radius: 100px;
  border: none;
  outline: none;
  cursor: default;
  user-select: none;
  animation: duo-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  /* La sombra INFERIOR simula la "base" del badge */
  transition: transform 90ms ease, box-shadow 90ms ease;
}
.duo-badge-interactive { cursor: pointer; }
.duo-badge-interactive:hover {
  transform: translateY(-2px);
}
.duo-badge-interactive:hover .duo-shadow { box-shadow: none; }
.duo-badge-interactive:active {
  transform: translateY(2px);
}
.duo-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
  opacity: 0.75;
}
.duo-dot-pulse {
  animation: duo-pulse-dot 1.5s ease-in-out infinite;
}
.duo-badge-sm  { font-size: 10px; padding: 3px 9px;  }
.duo-badge-md  { font-size: 11px; padding: 5px 12px; }
.duo-badge-lg  { font-size: 13px; padding: 7px 16px; }
`;

/* ── PALETA (colores planos + sombra base, estilo Duolingo) ────────────── */
const PALETTE = {
  success: {
    bg:     "#58CC02",
    shadow: "#46A302",
    color:  "#fff",
    dot:    "#fff",
  },
  error: {
    bg:     "#FF4B4B",
    shadow: "#CC2B2B",
    color:  "#fff",
    dot:    "#fff",
  },
  warning: {
    bg:     "#FFC800",
    shadow: "#CC9E00",
    color:  "#7C5000",
    dot:    "#7C5000",
  },
  info: {
    bg:     "#1CB0F6",
    shadow: "#0C8EC7",
    color:  "#fff",
    dot:    "#fff",
  },
  purple: {
    bg:     "#CE82FF",
    shadow: "#A35DD4",
    color:  "#fff",
    dot:    "#fff",
  },
  neutral: {
    bg:     "#E5E5E5",
    shadow: "#B0B0B0",
    color:  "#5E5E5E",
    dot:    "#5E5E5E",
  },
  dark: {
    bg:     "#3C3C3C",
    shadow: "#1A1A1A",
    color:  "#fff",
    dot:    "#fff",
  },
};

/* ── TAMAÑOS ────────────────────────────────────────────────────────────── */
const SIZE_CLASS = { sm: "duo-badge-sm", md: "duo-badge-md", lg: "duo-badge-lg" };

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

  // Sombra inferior = "base" del badge (efecto 3D Duolingo)
  const shadowHeight = size === "sm" ? "3px" : size === "lg" ? "5px" : "4px";

  return (
    <span
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={[
        "duo-badge",
        sizeClass,
        interactive ? "duo-badge-interactive" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        background: p.bg,
        color:      p.color,
        boxShadow:  `0 ${shadowHeight} 0 ${p.shadow}`,
        ...style,
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}

      {(dot || pulse) && (
        <span
          className={["duo-dot", pulse ? "duo-dot-pulse" : ""].filter(Boolean).join(" ")}
          style={{ background: p.dot }}
          aria-hidden="true"
        />
      )}

      {children}

      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Eliminar"
          style={{
            background:   "rgba(0,0,0,0.15)",
            border:       "none",
            borderRadius: "50%",
            width:        "14px",
            height:       "14px",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            cursor:       "pointer",
            padding:      0,
            color:        p.color,
            fontSize:     "9px",
            fontWeight:   900,
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
   NotifBadge — contador de notificaciones (el bolita roja del ícono)
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
        background:     p.bg,
        boxShadow:      `0 3px 0 ${p.shadow}`,
        color:          p.color,
        fontSize:       "10px",
        fontWeight:     900,
        lineHeight:     1,
        fontFamily:     '"Nunito", system-ui, sans-serif',
        animation:      "duo-bounce 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   XpBadge — badge especial de XP / streak / logro (estilo Duolingo puro)
   Incluye llama o estrella opcional
════════════════════════════════════════════════════════════════════════ */
export function XpBadge({ xp, streak = false }) {
  injectOnce();

  return (
    <span
      className="duo-badge duo-badge-md"
      style={{
        background: streak ? "#FF9600" : "#FFC800",
        color:      streak ? "#fff"    : "#7C5000",
        boxShadow:  streak ? "0 4px 0 #C75C00" : "0 4px 0 #CC9E00",
        fontFamily: '"Nunito", system-ui, sans-serif',
        fontWeight: 900,
        gap:        4,
      }}
    >
      <span style={{ fontSize: "1.1em" }}>{streak ? "🔥" : "⭐"}</span>
      {xp}
    </span>
  );
}