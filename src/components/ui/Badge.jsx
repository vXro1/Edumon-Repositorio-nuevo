// src/components/ui/Badge.jsx

/* ─── TOKENS ─── */
const TOKENS = {
  success: {
    soft:     { background: "var(--color-success-light)", color: "var(--color-success)" },
    solid:    { background: "var(--color-success)",       color: "#fff" },
    outlined: { background: "transparent",                color: "var(--color-success)", outline: "1px solid var(--color-success)" },
    dot:      "var(--color-success)",
  },
  error: {
    soft:     { background: "var(--color-error-light)",   color: "var(--color-error)" },
    solid:    { background: "var(--color-error)",         color: "#fff" },
    outlined: { background: "transparent",                color: "var(--color-error)",   outline: "1px solid var(--color-error)" },
    dot:      "var(--color-error)",
  },
  info: {
    soft:     { background: "var(--color-primary-light)", color: "var(--color-primary)" },
    solid:    { background: "var(--color-primary)",       color: "#fff" },
    outlined: { background: "transparent",                color: "var(--color-primary)", outline: "1px solid var(--color-primary)" },
    dot:      "var(--color-primary)",
  },
  warning: {
    soft:     { background: "var(--color-warning-light)", color: "var(--color-warning)" },
    solid:    { background: "var(--color-warning)",       color: "#fff" },
    outlined: { background: "transparent",                color: "var(--color-warning)", outline: "1px solid var(--color-warning)" },
    dot:      "var(--color-warning)",
  },
  neutral: {
    soft:     { background: "rgba(107,114,128,0.12)",     color: "var(--color-text-muted)" },
    solid:    { background: "var(--color-text-muted)",    color: "#fff" },
    outlined: { background: "transparent",                color: "var(--color-text-muted)", outline: "1px solid var(--color-text-muted)" },
    dot:      "var(--color-text-muted)",
  },
};

const SIZE = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3.5 py-1.5",
};

/* ─── DOT ─── */
function Dot({ color, pulse }) {
  return (
    <span
      aria-hidden="true"
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{
        background: color,
        animation: pulse ? "edu-pulse 1.5s ease-in-out infinite" : "none",
      }}
    />
  );
}

/* ─── BADGE ─── */
export default function EdumonBadge({
  variant   = "info",
  styleType = "soft",
  size      = "md",
  dot       = false,
  pulse     = false,
  children,
  className = "",
}) {
  const token = TOKENS[variant] ?? TOKENS.info;
  const styles = token[styleType] ?? token.soft;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        "transition-transform duration-150 hover:scale-105",
        "edu-fade-in",
        SIZE[size] ?? SIZE.md,
        className,
      ].join(" ")}
      style={styles}
    >
      {(dot || pulse) && <Dot color={token.dot} pulse={pulse} />}
      {children}
    </span>
  );
}

/* ─── NOTIFICATION BADGE ─── */
export function EdumonNotifBadge({ count, variant = "error" }) {
  const display = count > 99 ? "99+" : count;
  const bg = variant === "error" ? "var(--color-error)" : "var(--color-primary)";

  return (
    <span
      className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white edu-fade-in"
      style={{ background: bg }}
      aria-label={`${display} notificaciones`}
    >
      {display}
    </span>
  );
}
