// RUTA EDUMON WEB/src/features/auth/components/LoginForm.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";
import logoSvg from "@/assets/icons/logo.svg";

// ── Helpers ──────────────────────────────────────────────────
const normalizePhone = (v) =>
  v.replace(/^\+?57/, "").replace(/\D/g, "").slice(0, 10);

const validate = ({ telefono, contrasena }) => {
  const e = {};
  if (!telefono.trim()) {
    e.telefono = "El teléfono es requerido";
  } else if (!/^\d{10}$/.test(telefono.trim())) {
    e.telefono = "Ingresa los 10 dígitos (sin +57)";
  }
  if (!contrasena) {
    e.contrasena = "La contraseña es requerida";
  } else if (contrasena.length < 6) {
    e.contrasena = "Mínimo 6 caracteres";
  }
  return e;
};

// ── Eye icons ────────────────────────────────────────────────
const EyeOpen = () => (
  <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOff = () => (
  <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

// ── Logo inline fallback ─────────────────────────────────────
const LogoIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="12" fill="#FCF7ED" />
    <path d="M8 30 Q14 10 22 22 Q30 34 36 14" stroke="#05C7F2" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <circle cx="22" cy="22" r="5" fill="#F23D7F" opacity="0.9" />
    <circle cx="12" cy="28" r="3" fill="#41D958" opacity="0.85" />
    <circle cx="32" cy="16" r="3" fill="#05C7F2" opacity="0.85" />
  </svg>
);

const EdumonLogo = () => {
  const [logoError, setLogoError] = useState(false);
  return logoError ? (
    <LogoIcon />
  ) : (
    <img
      src={logoSvg}
      alt="Edumon logo"
      width={44}
      height={44}
      onError={() => setLogoError(true)}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
};

// ── LoginForm ────────────────────────────────────────────────
const LoginForm = ({ onSubmit, loading = false, error = "" }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ telefono: "", contrasena: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "telefono" ? normalizePhone(value) : value;
    setForm((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({ ...form, telefono: `+57${form.telefono.trim()}` });
  };

  return (
    <div className="login-form-wrap">
      <style>{`/* estilos sin cambios */`}</style>

      <div aria-hidden="true" className="login-bubble login-bubble--cyan" />
      <div aria-hidden="true" className="login-bubble login-bubble--pink" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-area">
          <EdumonLogo />
          <span className="login-logo-text">
            Edu<span style={{ color: "#05C7F2" }}>mon</span>
          </span>
        </div>

        <div className="login-accent-bar" />
        <p className="login-tagline">Bienvenido — ingresa a tu cuenta</p>

        {error && (
          <div className="login-api-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Teléfono */}
          <div className="login-field">
            <label htmlFor="telefono"
              className={`login-label${errors.telefono ? " login-label--error" : ""}`}>
              Teléfono
            </label>
            <div className="login-input-group">
              <span className="login-prefix">+57</span>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                value={form.telefono}
                onChange={handleChange}
                autoComplete="tel"
                autoFocus
                className={`login-input login-input--prefix${errors.telefono ? " login-input--error" : ""}`}
              />
            </div>
            {errors.telefono && (
              <p className="login-error-msg">⬤ {errors.telefono}</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="login-field">
            <label
              htmlFor="contrasena"
              className={`login-label${errors.contrasena ? " login-label--error" : ""}`}
            >
              Contraseña
            </label>

            <div style={{ position: "relative" }}>
              <input
                id="contrasena"
                name="contrasena"
                type={showPass ? "text" : "password"}
                placeholder="Tu contraseña"
                value={form.contrasena}
                onChange={handleChange}
                autoComplete="current-password"
                className={`login-input login-input--password${errors.contrasena ? " login-input--error" : ""}`}
              />

              <IconBtn
                color="var(--color-text-muted)"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {showPass ? <EyeOff /> : <EyeOpen />}
              </IconBtn>
            </div>

            {errors.contrasena && (
              <p className="login-error-msg">⬤ {errors.contrasena}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full mt-1"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>

        <p className="login-footer">
          ¿Olvidaste tu contraseña?{" "}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/forgot-password")}
          >
            Recupérala aquí
          </Button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;