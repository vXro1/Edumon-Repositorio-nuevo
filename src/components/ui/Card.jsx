// src/components/ui/Card.jsx
import { useState } from "react";

/* ─── BADGE ─── */
export function EdumonBadge({ children, className = "" }) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${className}`}
      style={{
        background: "var(--color-primary-light)",
        color: "var(--color-primary)",
      }}
    >
      {children}
    </span>
  );
}

/* ─── PROGRESS ─── */
export function EdumonProgress({ value = 0 }) {
  const pct = Math.min(100, Math.max(0, value));

  const barColor =
    pct >= 80
      ? "var(--color-success)"
      : pct >= 50
      ? "var(--color-primary)"
      : "var(--color-secondary)";

  return (
    <div className="mt-3">
      <div
        className="flex justify-between text-xs mb-1.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>Progreso</span>
        <span className="font-semibold" style={{ color: barColor }}>
          {pct}%
        </span>
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--color-border)" }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: barColor,
          }}
        />
      </div>
    </div>
  );
}

/* ─── AVATAR ─── */
export function EdumonAvatar({ initials }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold -ml-2 first:ml-0 border-2 flex-shrink-0"
      style={{
        background: "var(--color-primary-light)",
        color: "var(--color-primary)",
        borderColor: "var(--color-surface)",
      }}
    >
      {initials}
    </div>
  );
}

/* ─── CARD ─── */
export default function EdumonCard({
  title,
  description,
  badges = [],
  children,
  footerLeft,
  footerRight,
  onClick,
  coverContent,
  className = "",
}) {
  const [hover, setHover] = useState(false);
  const isInteractive = Boolean(onClick);

  return (
    <article
      role={isInteractive ? "button" : "article"}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={title}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={[
        "relative rounded-2xl overflow-hidden flex flex-col",
        "border",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2",
        isInteractive ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      style={{
        background: "var(--color-surface)",
        borderColor: hover
          ? "var(--color-primary)"
          : "var(--color-border)",
        boxShadow: hover
          ? "var(--clay-card-hover)"
          : "var(--clay-card)",
      }}
    >
      {/* BORDE DEGRADADO */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          padding: "1.5px",
          background: hover
            ? "var(--gradient-brand-full)"
            : "transparent",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: hover ? 1 : 0,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* PORTADA */}
        {coverContent && (
          <div className="h-40 w-full overflow-hidden">
            {coverContent}
          </div>
        )}

        {/* CUERPO */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <EdumonBadge key={i}>{b.label}</EdumonBadge>
              ))}
            </div>
          )}

          {title && (
            <h3
              className="text-base sm:text-lg font-semibold leading-snug"
              style={{ color: "var(--color-text)" }}
            >
              {title}
            </h3>
          )}

          {description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {description}
            </p>
          )}

          {children}

          {(footerLeft || footerRight) && (
            <div
              className="flex items-center justify-between mt-auto pt-4 text-sm"
              style={{
                borderTop: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {footerLeft}
              </div>

              <div className="flex items-center">
                {footerRight}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── STAT CARD ─── */
export function EdumonStatCard({ value, label, icon }) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {icon && (
        <div
          className="mb-3 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
          }}
        >
          {icon}
        </div>
      )}

      <p
        className="text-2xl sm:text-3xl font-bold"
        style={{ color: "var(--color-text)" }}
      >
        {value}
      </p>

      <p
        className="text-sm mt-0.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}