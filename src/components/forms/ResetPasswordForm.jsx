// src/features/auth/components/forms/ResetPasswordForm.jsx
import { useState, useRef, useEffect } from "react";
import { Mail, Phone, Lock } from "lucide-react";
import { Input } from "@/components";
import AuthLayout from "./AuthLayout";

const CODE_LENGTH = 6;

const validate = ({ correo, telefono, codigo, contrasenaNueva, confirmar, method }) => {
  const e = {};
  if (method === "phone") {
    if (!telefono?.trim()) e.telefono = "El número es requerido";
  } else {
    if (!correo?.trim())
      e.correo = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      e.correo = "Ingresa un correo válido";
  }
  if (!codigo.trim())
    e.codigo = "El código es requerido";
  else if (!/^\d{4,8}$/.test(codigo.trim()))
    e.codigo = "El código debe tener entre 4 y 8 dígitos";
  if (!contrasenaNueva)
    e.contrasenaNueva = "La contraseña es requerida";
  else if (contrasenaNueva.length < 6)
    e.contrasenaNueva = "Mínimo 6 caracteres";
  if (confirmar !== contrasenaNueva)
    e.confirmar = "Las contraseñas no coinciden";
  return e;
};

/* Oculta parcialmente el teléfono/correo al que se envió el código —
   puramente visual, no toca el valor real que se envía al backend. */
function maskContact(value, method) {
  if (!value) return "";
  if (method === "phone") {
    const digits = value.replace(/\D/g, "");
    const last4 = digits.slice(-4) || digits;
    return `+57 *** *** ${last4}`;
  }
  const [user, domain] = value.split("@");
  if (!domain) return value;
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(user.length - 1, 3))}@${domain}`;
}

/* ── Componente de código OTP — N casillas individuales que se combinan en
   un único string, con el mismo contrato (value/onChange) que cualquier
   input controlado, así que se conecta directo a form.codigo sin tocar
   validate()/handleSubmit(). ── */
function OtpInput({ value, onChange, error, length = CODE_LENGTH, autoFocus = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = (i, char) => {
    const next = digits.slice();
    next[i] = char;
    onChange(next.join(""));
  };

  const handleInput = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setDigit(i, ""); return; }
    const char = raw.slice(-1);
    setDigit(i, char);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    requestAnimationFrame(() => {
      refs.current[Math.min(text.length, length - 1)]?.focus();
    });
  };

  return (
    <div>
      <div className="auth-otp-row" role="group" aria-label="Código de verificación">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            onChange={e => handleInput(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            autoFocus={autoFocus && i === 0}
            aria-label={`Dígito ${i + 1} de ${length}`}
            className={`auth-otp-digit${d ? " filled" : ""}${error ? " otp-error" : ""}`}
          />
        ))}
      </div>
      {error && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-error-hover)", margin: "6px 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}

const RESEND_COOLDOWN = 45;

const ResetPasswordForm = ({
  onSubmit,
  loading = false,
  error = "",
  success = false,
  defaultEmail = "",
  defaultPhone = "",
  method = "email",
  onBack,
  onGoLogin,
  onResend,
}) => {
  const [form, setForm] = useState({
    correo:          defaultEmail,
    telefono:        defaultPhone,
    codigo:          "",
    contrasenaNueva: "",
    confirmar:       "",
  });
  const [errors, setErrors] = useState({});
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleCodeChange = (codigo) => {
    setForm(p => ({ ...p, codigo }));
    if (errors.codigo) setErrors(p => ({ ...p, codigo: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = validate({ ...form, method });
    if (Object.keys(ve).length) { setErrors(ve); return; }
    const { confirmar, ...rest } = form;
    onSubmit({ ...rest, method });
  };

  const handleResend = async () => {
    if (cooldown > 0 || !onResend || resending) return;
    setResending(true);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setResending(false);
    }
  };

  const contactValue = method === "phone" ? form.telefono : form.correo;

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <h1>Verifica tu código</h1>
        <p>
          {success
            ? "Tu contraseña fue actualizada correctamente."
            : `Enviamos un código de verificación a tu ${method === "phone" ? "teléfono" : "correo"}.`}
        </p>
      </div>

      {!success && contactValue && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="auth-contact-chip">
            {method === "phone" ? <Phone size={13} /> : <Mail size={13} />}
            {maskContact(contactValue, method)}
          </span>
        </div>
      )}

      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      {success ? (
        <>
          <div className="auth-success" role="status">
            ¡Contraseña actualizada! Ya puedes iniciar sesión.
          </div>
          <button className="auth-submit" onClick={onGoLogin}>
            Ir al inicio de sesión
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Si se llegó sin pasar por "Recuperar contraseña" (sin router
              state), no hay teléfono/correo que mostrar — se deja el campo
              editable como respaldo en vez de perder la posibilidad de usar
              esta pantalla como punto de entrada directo. */}
          {!contactValue && (
            method === "phone" ? (
              <Input
                label="Número de teléfono"
                name="telefono"
                type="tel"
                placeholder="+573113014875"
                value={form.telefono}
                onChange={handleChange}
                leftIcon={<Phone size={16} />}
                error={errors.telefono}
                autoComplete="tel"
              />
            ) : (
              <Input
                label="Correo electrónico"
                name="correo"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={form.correo}
                onChange={handleChange}
                leftIcon={<Mail size={16} />}
                error={errors.correo}
                autoComplete="email"
              />
            )
          )}

          {/* Código OTP */}
          <OtpInput value={form.codigo} onChange={handleCodeChange} error={errors.codigo} autoFocus={!!contactValue} />

          {/* Reenvío */}
          <p className="auth-resend">
            ¿No recibiste el código?{" "}
            {cooldown > 0 ? (
              <span>Puedes solicitar uno nuevo en 00:{String(cooldown).padStart(2, "0")}</span>
            ) : (
              <button type="button" className="auth-link-btn" onClick={handleResend} disabled={resending}>
                {resending ? "Reenviando..." : "Reenviar código"}
              </button>
            )}
          </p>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14, marginTop: 2 }}>
            <Input
              label="Nueva contraseña"
              name="contrasenaNueva"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.contrasenaNueva}
              onChange={handleChange}
              leftIcon={<Lock size={16} />}
              error={errors.contrasenaNueva}
              autoComplete="new-password"
            />
          </div>

          <Input
            label="Confirmar contraseña"
            name="confirmar"
            type="password"
            placeholder="Repite tu contraseña"
            value={form.confirmar}
            onChange={handleChange}
            leftIcon={<Lock size={16} />}
            error={errors.confirmar}
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading} className="auth-submit">
            {loading
              ? <><span className="auth-spinner" /> Verificando...</>
              : "Verificar código"
            }
          </button>

          <div className="auth-row-between" style={{ justifyContent: "center" }}>
            <button type="button" className="auth-link-btn" onClick={onBack}>
              ← Volver
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
export default ResetPasswordForm;
