import { forwardRef, useId } from "react";
import { AlertCircle, Phone } from "lucide-react";
import {
  toLocalPhone, PHONE_PREFIX, PHONE_PLACEHOLDER, PHONE_HINT,
} from "@/utils/normalizePhone";

/* ══════════════════════════════════════════════════════════════
   PHONE INPUT — campo de teléfono ÚNICO de toda la app
   ══════════════════════════════════════════════════════════════
   Un solo comportamiento en login, registro de docentes, usuarios,
   participantes, instituciones, perfil y recuperación de contraseña:

   · Muestra "+57" como prefijo fijo (no editable, no se borra).
   · El usuario puede escribir o pegar "+57 300 123 4567", "573001234567"
     o "3001234567": siempre queda en los 10 dígitos locales.
   · El valor que entrega por onChange son SIEMPRE los 10 dígitos locales;
     al enviar al backend se usa normalizePhone() para obtener "+57XXXXXXXXXX".

   El ícono, el "+57" y el campo de texto son hijos de un mismo flexbox
   — a propósito NO se usa position:absolute + padding-left calculado a
   mano (así era antes, en Input.jsx y en el markup propio del login, y
   los dos apenas se llevaban entre 6 y 10px de aire): con flexbox cada
   segmento reserva su propio espacio, así que "+57" nunca puede pisar
   el placeholder ni lo que el usuario escribe, sea cual sea la fuente,
   el ancho de la columna o el navegador.
   ══════════════════════════════════════════════════════════════ */
export const PhoneInput = forwardRef(function PhoneInput({
  value = "",
  onChange,
  name = "telefono",
  label = "Teléfono",
  hint = PHONE_HINT,
  error,
  size = "md",
  placeholder = PHONE_PLACEHOLDER,
  showIcon = true,
  required = false,
  disabled = false,
  className = "",
  id,
  ...rest
}, ref) {
  const autoId  = useId();
  const inputId = id ?? autoId;
  const local   = toLocalPhone(value);

  const sizeClass  = size === "sm" ? "input-sm" : size === "lg" ? "input-lg" : "";
  const stateClass = error ? "input-error" : "";

  const handleChange = (e) => {
    const next = toLocalPhone(e.target.value);
    onChange?.({ target: { name, value: next }, currentTarget: { name, value: next } });
  };

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

      <div className={["input", sizeClass, stateClass, "phone-field", className].filter(Boolean).join(" ")}>
        {showIcon && (
          <span className="phone-field-icon" aria-hidden="true">
            <Phone size={16} />
          </span>
        )}

        <span className="phone-field-prefix" aria-hidden="true">
          {PHONE_PREFIX}
        </span>

        <input
          ref={ref}
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder={placeholder}
          value={local}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className="phone-field-input"
          {...rest}
        />
      </div>

      {error && (
        <span id={`${inputId}-error`} className="field-error" role="alert">
          <AlertCircle size={13} strokeWidth={2.5} />
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${inputId}-hint`} className="field-hint">{hint}</span>
      )}
    </div>
  );
});

export default PhoneInput;
