// RUTA EDUMON WEB/src/features/auth/components/LoginForm.jsx
// ============================================================
// Formulario de login — Paleta Edumon
// Colores: Cian #05C7F2 · Rosa #F23D7F · Verde #41D958
//          Crema #FCF7ED · Negro #0D0D0D
// ============================================================

import { useState } from "react";
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
  <svg
    width="19"
    height="19"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const EyeOff = () => (
  <svg
    width="19"
    height="19"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  </svg>
);

// ── Logo inline fallback ─────────────────────────────────────
const LogoIcon = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="44" height="44" rx="12" fill="#FCF7ED" />
    <path
      d="M8 30 Q14 10 22 22 Q30 34 36 14"
      stroke="#05C7F2"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="22" cy="22" r="5" fill="#F23D7F" opacity="0.9" />
    <circle cx="12" cy="28" r="3" fill="#41D958" opacity="0.85" />
    <circle cx="32" cy="16" r="3" fill="#05C7F2" opacity="0.85" />
  </svg>
);

// ── Logo inteligente (real + fallback) ──────────────────────
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
      style={{
        display: "block",
        objectFit: "contain",
      }}
    />
  );
};

// ── Bubble decorativa ────────────────────────────────────────
const Bubble = ({ size, color, style }) => (
  <div
    aria-hidden="true"
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      opacity: 0.18,
      pointerEvents: "none",
      ...style,
    }}
  />
);

// ── LoginForm ────────────────────────────────────────────────
export const LoginForm = ({ onSubmit, loading = false, error = "" }) => {
  const [form, setForm] = useState({
    telefono: "",
    contrasena: "",
  });

  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  // ── Handlers ───────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    const processedValue =
      name === "telefono" ? normalizePhone(value) : value;

    setForm((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit({
      ...form,
      telefono: `+57${form.telefono.trim()}`,
    });
  };

  // ── Styles ────────────────────────────────────────────────
  const s = {
    wrap: {
      minHeight: "100vh",
      background: "#FCF7ED",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Nunito', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "2rem 1rem",
    },

    card: {
      background: "#fff",
      borderRadius: 24,
      padding: "2.2rem 2rem 2rem",
      width: "100%",
      maxWidth: 400,
      position: "relative",
      zIndex: 10,
      boxShadow:
        "0 8px 40px rgba(5,199,242,0.10), 0 2px 12px rgba(242,61,127,0.08)",
      border: "1.5px solid rgba(5,199,242,0.13)",
    },

    logoArea: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: "0.2rem",
    },

    logoText: {
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: "-0.03em",
      color: "#0D0D0D",
    },

    accentBar: {
      height: 4,
      borderRadius: 99,
      background:
        "linear-gradient(90deg, #F23D7F, #05C7F2, #41D958)",
      width: 60,
      margin: "0.8rem auto 1.2rem",
    },

    tagline: {
      textAlign: "center",
      fontSize: 13,
      color: "#888",
      fontWeight: 600,
      marginBottom: "1.6rem",
    },

    field: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      marginBottom: "1.1rem",
    },

    label: (hasError) => ({
      fontSize: 13,
      fontWeight: 700,
      color: hasError ? "#F23D7F" : "#555",
      paddingLeft: 2,
    }),

    inputGroup: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },

    prefix: {
      position: "absolute",
      left: 14,
      fontSize: 14,
      fontWeight: 700,
      color: "#05C7F2",
      pointerEvents: "none",
      zIndex: 2,
    },

    input: (hasError, withPrefix) => ({
      width: "100%",
      padding: `11px 14px 11px ${withPrefix ? 48 : 14}px`,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: "'Nunito', sans-serif",
      border: `2px solid ${hasError ? "#F23D7F" : "#E8E0D4"}`,
      borderRadius: 14,
      background: hasError ? "#FFF0F5" : "#FDFAF5",
      color: "#0D0D0D",
      outline: "none",
      transition: "all 0.2s ease",
      boxShadow: hasError
        ? "0 0 0 3px rgba(242,61,127,0.10)"
        : "none",
    }),

    toggleBtn: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#aaa",
      display: "flex",
      alignItems: "center",
      padding: 4,
    },

    errorMsg: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "#F23D7F",
      display: "flex",
      alignItems: "center",
      gap: 4,
    },

    apiError: {
      background: "#FFF0F5",
      border: "1.5px solid #F23D7F",
      color: "#F23D7F",
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 13,
      fontWeight: 700,
      marginBottom: "1rem",
      textAlign: "center",
    },

    submitBtn: {
      width: "100%",
      padding: 13,
      fontSize: 15,
      fontWeight: 800,
      fontFamily: "'Nunito', sans-serif",
      border: "none",
      borderRadius: 14,
      cursor: loading ? "not-allowed" : "pointer",
      color: "#fff",
      background:
        "linear-gradient(135deg, #05C7F2 0%, #41D958 100%)",
      boxShadow: "0 4px 16px rgba(5,199,242,0.30)",
      opacity: loading ? 0.7 : 1,
      marginTop: "0.3rem",
      letterSpacing: "0.01em",
      transition: "all 0.2s ease",
    },

    footerLink: {
      textAlign: "center",
      marginTop: "1rem",
      fontSize: 13,
      color: "#999",
      fontWeight: 600,
    },
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={s.wrap}>
      {/* Burbujas */}
      <Bubble
        size={120}
        color="#05C7F2"
        style={{
          top: -30,
          left: -30,
          animation: "float 6s ease-in-out infinite",
        }}
      />

      <Bubble
        size={80}
        color="#F23D7F"
        style={{
          top: 40,
          right: 10,
          animation: "float 8s ease-in-out infinite",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .edu-input:focus {
          border-color: #05C7F2 !important;
          box-shadow: 0 0 0 3px rgba(5,199,242,0.15) !important;
          background: #fff !important;
        }

        .edu-toggle:hover {
          color: #05C7F2 !important;
        }
      `}</style>

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoArea}>
          <EdumonLogo />

          <span style={s.logoText}>
            Edu<span style={{ color: "#05C7F2" }}>mon</span>
          </span>
        </div>

        <div style={s.accentBar} />

        <p style={s.tagline}>
          Bienvenido — ingresa a tu cuenta
        </p>

        {/* Error API */}
        {error && (
          <div style={s.apiError} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Teléfono */}
          <div style={s.field}>
            <label
              htmlFor="telefono"
              style={s.label(!!errors.telefono)}
            >
              Teléfono
            </label>

            <div style={s.inputGroup}>
              <span style={s.prefix}>+57</span>

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
                className="edu-input"
                style={s.input(!!errors.telefono, true)}
              />
            </div>

            {errors.telefono && (
              <p style={s.errorMsg}>
                ⬤ {errors.telefono}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div style={s.field}>
            <label
              htmlFor="contrasena"
              style={s.label(!!errors.contrasena)}
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
                className="edu-input"
                style={{
                  ...s.input(!!errors.contrasena, false),
                  paddingRight: 44,
                }}
              />

              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={s.toggleBtn}
                className="edu-toggle"
                tabIndex={0}
                aria-label={
                  showPass
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPass ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>

            {errors.contrasena && (
              <p style={s.errorMsg}>
                ⬤ {errors.contrasena}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={s.submitBtn}
          >
            {loading ? (
              <span
                style={{
                  display: "inline-block",
                  width: 17,
                  height: 17,
                  border:
                    "2.5px solid rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  verticalAlign: "middle",
                }}
              />
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <p style={s.footerLink}>
          ¿Olvidaste tu contraseña?{" "}
          <a
            href="/recuperar"
            style={{
              color: "#F23D7F",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Recupérala aquí
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;