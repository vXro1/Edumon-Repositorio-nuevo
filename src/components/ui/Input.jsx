import { useState, useId, forwardRef } from "react";
import { AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   INPUT
   Props nuevos vs versión anterior:
   - successMsg : string — mensaje de éxito con checkmark animado
   - success    : bool   — solo borde verde sin mensaje

   Nota: el campo de teléfono con prefijo "+57" NO se resuelve aquí — ver
   src/components/ui/PhoneInput.jsx, que usa un layout de flexbox propio
   en vez de padding-left calculado a mano (esa versión anterior hacía que
   el prefijo y el placeholder terminaran pegados o superpuestos).
   ══════════════════════════════════════════════════════════════ */
export const Input = forwardRef(function Input({
  label,
  hint,
  error,
  success,
  successMsg,
  size       = "md",
  leftIcon,
  rightIcon,
  type       = "text",
  required   = false,
  disabled   = false,
  className  = "",
  id,
  ...rest
}, ref) {
  const autoId   = useId();
  const inputId  = id ?? autoId;
  const [showPwd, setShowPwd] = useState(false);

  const isPassword     = type === "password";
  const resolvedType   = isPassword ? (showPwd ? "text" : "password") : type;
  const sizeClass      = size === "sm" ? "input-sm" : size === "lg" ? "input-lg" : "";
  const isSuccess      = !!(success || successMsg);
  const stateClass     = error     ? "input-error"
                       : isSuccess ? "input-success"
                       : "";
  const iconLeftClass  = leftIcon                  ? "input-icon-left"  : "";
  const iconRightClass = (rightIcon || isPassword) ? "input-icon-right" : "";

  return (
    <div className="field">
      {label && (
        <label
          htmlFor={inputId}
          className={`field-label${required ? " field-label-required" : ""}`}
        >
          {label}
        </label>
      )}

      <div className="input-wrapper">
        {leftIcon && (
          <span className="input-adornment input-adornment-left">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error      ? `${inputId}-error`   :
            successMsg ? `${inputId}-success` :
            hint       ? `${inputId}-hint`    : undefined
          }
          className={[
            "input",
            sizeClass,
            stateClass,
            iconLeftClass,
            iconRightClass,
            className,
          ].filter(Boolean).join(" ")}
          {...rest}
        />

        {isPassword ? (
          <span className="input-adornment input-adornment-right">
            <button
              type="button"
              className="input-adornment-btn"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        ) : rightIcon ? (
          <span className="input-adornment input-adornment-right">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {/* Error de validación */}
      {error && (
        <span id={`${inputId}-error`} className="field-error" role="alert">
          <AlertCircle size={13} strokeWidth={2.5} />
          {error}
        </span>
      )}

      {/* Mensaje de éxito */}
      {!error && successMsg && (
        <span id={`${inputId}-success`} className="field-success-msg">
          <CheckCircle size={13} strokeWidth={2.5} className="field-check-icon" />
          {successMsg}
        </span>
      )}

      {/* Texto de ayuda */}
      {!error && !successMsg && hint && (
        <span id={`${inputId}-hint`} className="field-hint">{hint}</span>
      )}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   ÁREA DE TEXTO
   ══════════════════════════════════════════════════════════════ */
export const Textarea = forwardRef(function Textarea({
  label,
  hint,
  error,
  size      = "md",
  required  = false,
  disabled  = false,
  className = "",
  id,
  ...rest
}, ref) {
  const autoId     = useId();
  const textareaId = id ?? autoId;
  const sizeClass  = size === "sm" ? "textarea-sm" : size === "lg" ? "textarea-lg" : "";
  const stateClass = error ? "input-error" : "";

  return (
    <div className="field">
      {label && (
        <label
          htmlFor={textareaId}
          className={`field-label${required ? " field-label-required" : ""}`}
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        className={["textarea", sizeClass, stateClass, className].filter(Boolean).join(" ")}
        {...rest}
      />

      {error && (
        <span id={`${textareaId}-error`} className="field-error" role="alert">
          <AlertCircle size={13} strokeWidth={2.5} />
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${textareaId}-hint`} className="field-hint">{hint}</span>
      )}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   SELECTOR
   ══════════════════════════════════════════════════════════════ */
export const Select = forwardRef(function Select({
  label,
  hint,
  error,
  size      = "md",
  required  = false,
  disabled  = false,
  className = "",
  children,
  id,
  ...rest
}, ref) {
  const autoId    = useId();
  const selectId  = id ?? autoId;
  const sizeClass = size === "sm" ? "select-sm" : size === "lg" ? "select-lg" : "";
  const stateClass = error ? "input-error" : "";

  return (
    <div className="field">
      {label && (
        <label
          htmlFor={selectId}
          className={`field-label${required ? " field-label-required" : ""}`}
        >
          {label}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        className={["select", sizeClass, stateClass, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {children}
      </select>

      {error && (
        <span id={`${selectId}-error`} className="field-error" role="alert">
          <AlertCircle size={13} strokeWidth={2.5} />
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${selectId}-hint`} className="field-hint">{hint}</span>
      )}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   INTERRUPTOR
   ══════════════════════════════════════════════════════════════ */
export const Toggle = forwardRef(function Toggle({
  label,
  disabled  = false,
  className = "",
  id,
  ...rest
}, ref) {
  const autoId   = useId();
  const toggleId = id ?? autoId;

  return (
    <label className={`toggle ${className}`} htmlFor={toggleId}>
      <input
        ref={ref}
        id={toggleId}
        type="checkbox"
        className="toggle-input"
        disabled={disabled}
        {...rest}
      />
      <span className="toggle-track" aria-hidden="true" />
      {label && <span className="toggle-label-text">{label}</span>}
    </label>
  );
});

/* ══════════════════════════════════════════════════════════════
   CASILLA DE VERIFICACIÓN
   ══════════════════════════════════════════════════════════════ */
export const Checkbox = forwardRef(function Checkbox({
  label,
  disabled  = false,
  className = "",
  size      = "md",
  ...rest
}, ref) {
  const sizeClass = size === "sm" ? " check-sm" : "";
  return (
    <label className={`check-label ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className={`check-input${sizeClass}`}
        disabled={disabled}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
});

/* ══════════════════════════════════════════════════════════════
   BOTÓN DE OPCIÓN
   ══════════════════════════════════════════════════════════════ */
export const Radio = forwardRef(function Radio({
  label,
  disabled  = false,
  className = "",
  ...rest
}, ref) {
  return (
    <label className={`check-label ${className}`}>
      <input
        ref={ref}
        type="radio"
        className="radio-input"
        disabled={disabled}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
});

export default Input;