// src/features/auth/components/LoginForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, AlertTriangle, X, ArrowLeft, BookOpen } from "lucide-react";
import { Input } from "@/components";
import AuthLayout from "./AuthLayout";
const normalizePhone = (v) =>
  v.replace(/^\+?57/, "").replace(/\D/g, "").slice(0, 10);

const validate = ({ telefono, contrasena }) => {
  const e = {};
  if (!telefono.trim())                e.telefono   = "El teléfono es requerido";
  else if (!/^\d{10}$/.test(telefono)) e.telefono   = "Ingresa los 10 dígitos sin +57";
  if (!contrasena)                     e.contrasena = "La contraseña es requerida";
  else if (contrasena.length < 6)      e.contrasena = "Mínimo 6 caracteres";
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
    const v = name === "telefono" ? normalizePhone(value) : value;
    setForm(p => ({ ...p, [name]: v }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ve = validate(form);
    if (Object.keys(ve).length) { setErrors(ve); return; }
    onSubmit({ ...form, telefono: `+57${form.telefono.trim()}` });
  };

  return (
    <AuthLayout>
      {/* Volver al inicio */}
      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         5,
          background:  "none",
          border:      "none",
          cursor:      "pointer",
          fontSize:    12,
          fontWeight:  600,
          color:       "var(--color-text-muted)",
          padding:     "0 0 18px 0",
          transition:  "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--color-text)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-muted)"}
      >
        <ArrowLeft size={13} />
        Volver al inicio
      </button>

      {/* Encabezado */}
      <div className="auth-form-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 9, background: "rgba(255,107,53,0.10)",
          }}>
            <BookOpen size={15} style={{ color: "#FF6B35" }} />
          </span>
          <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
            Bienvenido de nuevo
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text-muted)" }}>
          Accede con tu número de teléfono y contraseña
        </p>
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
        <div className="field">
          <label className="field-label">Teléfono</label>
          <div className="input-wrapper">
            <span className="input-adornment input-adornment-left">
              <Phone size={16} />
            </span>
            <span className="auth-prefix">+57</span>
            <input
              name="telefono"
              type="tel"
              inputMode="numeric"
              placeholder="3001234567"
              value={form.telefono}
              onChange={handleChange}
              autoComplete="tel"
              autoFocus
              className={`input input-icon-left auth-input-prefix${errors.telefono ? " input-error" : ""}`}
            />
          </div>
          {errors.telefono && (
            <span className="field-error" role="alert">{errors.telefono}</span>
          )}
        </div>

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