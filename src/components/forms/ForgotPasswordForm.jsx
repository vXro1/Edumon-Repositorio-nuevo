import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components";
import AuthLayout from "./AuthLayout";

const validateEmail = ({ correo }) => {
  const e = {};
  if (!correo.trim())
    e.correo = "El correo es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    e.correo = "Ingresa un correo válido";
  return e;
};

const ForgotPasswordForm = ({
  onSubmit,
  loading = false,
  error = "",
  sent = false,
  emailSent = "",
  onContinue,
  onBack,
}) => {
  const [form,   setForm]   = useState({ correo: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = validateEmail(form);
    if (Object.keys(ve).length) { setErrors(ve); return; }
    onSubmit({ correo: form.correo });
  };

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <h1>Recuperar contraseña</h1>
        <p>
          {sent
            ? `Revisa tu correo ${emailSent}`
            : "Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña."}
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
