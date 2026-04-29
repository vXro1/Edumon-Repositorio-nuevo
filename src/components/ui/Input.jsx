// src/components/ui/Input.jsx
import { useState, useId } from "react";

const ICONS = {
  search: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="17" y1="17" x2="22" y2="22" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
};

export default function EdumonInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  iconLeft,
  showToggle = false,
  error,
  helper,
  disabled = false,
  required = false,
  className = "",
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const [showPwd, setShowPwd] = useState(false);

  const isError = Boolean(error);
  const resolvedType = type === "password" ? (showPwd ? "text" : "password") : type;
  const hasLeftPad = Boolean(iconLeft);
  const hasRightPad = type === "password" && showToggle;

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>

      {/* LABEL */}
      {label && (
        <label
          htmlFor={id}
          className="text-[13px] font-semibold"
          style={{ color: isError ? "var(--color-error)" : "var(--color-text-muted)" }}
        >
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: "var(--color-error)" }} className="ml-0.5">*</span>
          )}
        </label>
      )}

      {/* INPUT WRAPPER */}
      <div className="relative group">

        {/* FOCUS GLOW */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 blur-md pointer-events-none transition-opacity duration-300 group-focus-within:opacity-25"
          style={{ background: "var(--gradient-brand)" }}
          aria-hidden="true"
        />

        {/* ICON LEFT */}
        {iconLeft && ICONS[iconLeft] && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
            style={{ color: "var(--color-text-muted)" }}
          >
            {ICONS[iconLeft]}
          </span>
        )}

        {/* INPUT */}
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={isError}
          {...rest}
          aria-describedby={
            [isError && errorId, !isError && helper && helperId]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={[
            "relative w-full rounded-xl text-sm font-medium",
            "border outline-none transition-all duration-200",
            "placeholder:text-[color:var(--color-text-muted)] placeholder:font-normal",
            "focus:ring-2",
            hasLeftPad ? "pl-10" : "pl-4",
            hasRightPad ? "pr-10" : "pr-4",
            "py-2.5",
            disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "",
            isError
              ? "border-[color:var(--color-error)] bg-[color:var(--color-error-light)] focus:ring-[color:var(--color-error)]/20"
              : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] focus:border-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]/20",
          ].join(" ")}
          style={{ color: "var(--color-text)" }}
        />

        {/* PASSWORD TOGGLE */}
        {type === "password" && showToggle && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {showPwd ? ICONS.eyeOff : ICONS.eye}
          </button>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <p id={errorId} role="alert" className="text-[12px] font-semibold" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      {/* HELPER */}
      {helper && !error && (
        <p id={helperId} className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          {helper}
        </p>
      )}
    </div>
  );
}
