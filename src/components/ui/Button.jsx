// src/components/ui/Button.jsx

const SIZE = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

const BASE =
  "relative inline-flex items-center justify-center font-semibold rounded-xl " +
  "transition-all duration-200 select-none " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-[color:var(--color-primary)] " +
  "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

export default function EdumonButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}) {
  const sizeClass = SIZE[size] ?? SIZE.md;

  if (variant === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
        className={`${BASE} ${sizeClass} border-2 border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-transparent hover:bg-[color:var(--color-primary)] hover:text-white ${className}`}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
        className={`${BASE} ${sizeClass} bg-transparent text-[color:var(--color-text)] border border-[color:var(--color-border)] hover:bg-black/5 ${className}`}
      >
        {children}
      </button>
    );
  }

  // primary (default) — full gradient fill
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${BASE} ${sizeClass} text-white hover:brightness-110 ${className}`}
      style={{
        background: "var(--gradient-brand)",
        boxShadow: "var(--shadow-primary)",
      }}
    >
      {children}
    </button>
  );
}
