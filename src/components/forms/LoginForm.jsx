import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertTriangle, X, ArrowLeft } from "lucide-react";
import { Input, PhoneInput } from "@/components";
import AuthLayout from "./AuthLayout";
import { toLocalPhone, normalizePhone, isValidPhone, PHONE_ERROR } from "@/utils/normalizePhone";

const validate = ({ telefono, contrasena }) => {
  const e = {};
  if (!telefono.trim())           e.telefono   = "El teléfono es requerido";
  else if (!isValidPhone(telefono)) e.telefono = PHONE_ERROR;
  if (!contrasena)                e.contrasena = "La contraseña es requerida";
  else if (contrasena.length < 6) e.contrasena = "Mínimo 6 caracteres";
  return e;
};

const LoginForm = ({ onSubmit, loading = false, error = "", sessionExpired = false }) => {
  const navigate = useNavigate();
  const [form,      setForm]      = useState({ telefono: "", contrasena: "" });
  const [errors,    setErrors]    = useState({});
  const [remember,  setRemember]  = useState(false);
  const [warnDismissed, setWarnDismissed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // toLocalPhone deja siempre los 10 dígitos que muestra el input, sea cual sea el formato pegado
    const v = name === "telefono" ? toLocalPhone(value) : value;
    setForm(p => ({ ...p, [name]: v }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = validate(form);
    if (Object.keys(ve).length) { setErrors(ve); return; }
    onSubmit({ ...form, telefono: normalizePhone(form.telefono) });
  };

  return (
    <AuthLayout
      topAction={
        <button type="button" className="auth-back-link" onClick={() => navigate("/")}>
          <ArrowLeft size={13} />
          Volver al inicio
        </button>
      }
    >
      {/* Encabezado */}
      <div className="auth-form-head">
        <h1>Inicia sesión</h1>
        <p>Accede con tu número de teléfono y contraseña</p>
      </div>

      {/* Alertas */}
      {sessionExpired && !warnDismissed && (
        <div className="auth-warn" role="alert" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Tu sesión expiró. Inicia sesión de nuevo.</span>
          <button
            type="button"
            onClick={() => setWarnDismissed(true)}
            aria-label="Cerrar aviso"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", opacity: 0.7 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">

        {/* Teléfono */}
        <PhoneInput
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          error={errors.telefono}
          hint={null}
          autoFocus
        />

        {/* Contraseña */}
        <Input
          label="Contraseña"
          name="contrasena"
          type="password"
          placeholder="Tu contraseña"
          value={form.contrasena}
          onChange={handleChange}
          leftIcon={<Lock size={16} />}
          error={errors.contrasena}
          autoComplete="current-password"
        />

        {/* Recordar + recuperar */}
        <div className="auth-row-between">
          <label className="check-label">
            <input
              type="checkbox"
              className="check-input"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Recordarme</span>
          </label>
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => navigate("/forgot-password")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading
            ? <><span className="auth-spinner" /> Iniciando sesión...</>
            : "Ingresar"
          }
        </button>
      </form>


    </AuthLayout>
  );
};

export default LoginForm;