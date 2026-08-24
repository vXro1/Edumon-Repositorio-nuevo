// src/features/auth/components/ForgotPasswordForm.jsx
import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Input, PhoneInput } from "@/components";
import AuthLayout from "./AuthLayout";
import { normalizePhone, isValidPhone, PHONE_ERROR } from "@/utils/normalizePhone";

const validateEmail = ({ correo }) => {
  const e = {};
  if (!correo.trim())
    e.correo = "El correo es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    e.correo = "Ingresa un correo válido";
  return e;
};

const validatePhone = ({ telefono }) => {
  const e = {};
  if (!telefono.trim())
    e.telefono = "El número es requerido";
  else if (!isValidPhone(telefono))
    e.telefono = PHONE_ERROR;
  return e;
};

const ForgotPasswordForm = ({
  onSubmit,
  loading = false,
  error = "",
  sent = false,
  emailSent = "",
  phoneSent = "",
  onContinue,
  onBack,
}) => {
  const [method, setMethod] = useState("phone");
  const [form,   setForm]   = useState({ correo: "", telefono: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = method === "email" ? validateEmail(form) : validatePhone(form);
    if (Object.keys(ve).length) { setErrors(ve); return; }
    if (method === "email") {
      onSubmit({ correo: form.correo });
    } else {
      // Al backend siempre viaja "+57XXXXXXXXXX", igual que en el login.
      onSubmit({ telefono: normalizePhone(form.telefono), method: "phone" });
    }
  };

  const sentLabel = method === "email"
    ? `Revisa tu correo ${emailSent}`
    : `Revisa tu WhatsApp ${phoneSent}`;

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <h1>Recuperar contraseña</h1>
        <p>
          {sent ? sentLabel : "Ingresa tu número de teléfono y te enviaremos un código para restablecer tu contraseña."}
        </p>
      </div>

      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      {sent ? (
        <>
          <div className="auth-success" role="status" />
          <button className="auth-submit" onClick={onContinue}>
            Ingresar código
          </button>
          <div className="auth-row-between" style={{ marginTop: 12, justifyContent: "center" }}>
            <button type="button" className="auth-link-btn" onClick={onBack}>
              ← Volver al inicio de sesión
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Toggle método */}
          <div style={{
            display: "flex", borderRadius: 10, overflow: "hidden",
            border: "1.5px solid var(--color-border)", marginBottom: 2,
          }}>
            {[
              { key: "phone", label: "Teléfono", icon: <Phone size={14} /> },
              { key: "email", label: "Correo", icon: <Mail size={14} /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMethod(key); setErrors({}); }}
                aria-pressed={method === key}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "9px 0", fontSize: 13, fontWeight: 600, border: "none",
                  cursor: "pointer", transition: "background 150ms, color 150ms",
                  background: method === key ? "var(--edu-blue-500, #0C6AC4)" : "transparent",
                  color: method === key ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {method === "email" ? (
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
              autoFocus
            />
          ) : (
            <PhoneInput
              label="Número de teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              error={errors.telefono}
              autoFocus
            />
          )}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading
              ? <><span className="auth-spinner" /> Enviando...</>
              : "Enviar código"
            }
          </button>

          <div className="auth-row-between" style={{ justifyContent: "center" }}>
            <button type="button" className="auth-link-btn" onClick={onBack}>
              ← Volver al inicio de sesión
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
export default ForgotPasswordForm;
