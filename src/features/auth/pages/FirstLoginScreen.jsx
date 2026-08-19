// src/features/auth/pages/FirstLoginScreen.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usersGetDefaultPhotos, usersUpdateMyPhoto, usersUpdate } from "@/services/usersService";
import { authChangePassword } from "@/services/authService";
import { humanizeError } from "@/utils/humanizeError";
import logoSvg from "@/assets/icons/logo.svg";
import { readLoginPassword, clearLoginPassword } from "../utils/firstLoginPassword";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Camera,
  ArrowLeft,
  User,
  Mail,
} from "lucide-react";
import circulo1  from "@/assets/img/circulos/circulo1.svg";
import circulo2  from "@/assets/img/circulos/circulo2.svg";
import circulo3  from "@/assets/img/circulos/circulo3.svg";
import circulo4  from "@/assets/img/circulos/circulo4.svg";
import circulo5  from "@/assets/img/circulos/circulo5.svg";
import circulo6  from "@/assets/img/circulos/circulo6.svg";
import circulo7  from "@/assets/img/circulos/circulo7.svg";
import circulo8  from "@/assets/img/circulos/circulo8.svg";
import circulo9  from "@/assets/img/circulos/circulo9.svg";
import circulo10 from "@/assets/img/circulos/circulo10.svg";
import circulo11 from "@/assets/img/circulos/circulo11.svg";
import circulo12 from "@/assets/img/circulos/circulo12.svg";

const ROLE_REDIRECTS = {
  superadmin:    "/admin",
  administrador: "/admin",
  docente:       "/docente",
  padre:         "/padre",
  "padre/tutor": "/padre",
};

/* ── Validación ─────────────────────────────────────────────── */
function validateDataForm(form) {
  const e = {};
  if (!form.nombre.trim())   e.nombre   = "Este campo es requerido";
  if (!form.apellido.trim()) e.apellido = "Este campo es requerido";
  if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim()))
    e.correo = "Ingresa un correo válido";
  if (!form.contraseñaNueva) {
    e.contraseñaNueva = "Este campo es requerido";
  } else if (form.contraseñaNueva.length < 6) {
    e.contraseñaNueva = "Mínimo 6 caracteres";
  } else if (!/[A-Z]/.test(form.contraseñaNueva)) {
    e.contraseñaNueva = "Debe contener al menos una mayúscula";
  } else if (!/[a-z]/.test(form.contraseñaNueva)) {
    e.contraseñaNueva = "Debe contener al menos una minúscula";
  } else if (!/[0-9]/.test(form.contraseñaNueva)) {
    e.contraseñaNueva = "Debe contener al menos un número";
  }
  if (!form.confirmar) {
    e.confirmar = "Confirma tu contraseña";
  } else if (form.confirmar !== form.contraseñaNueva) {
    e.confirmar = "Las contraseñas no coinciden";
  }
  return e;
}

/* ══════════════════════════════════════════════════════════════
   Estilos y animaciones inyectados una única vez — puramente
   presentacionales, no tocan lógica ni estado.
   ══════════════════════════════════════════════════════════════ */
const FLS_CSS = `
@keyframes fls-pop-in {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fls-ring-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.38); }
  70%  { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
  100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
}
@keyframes fls-idle-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.16); }
  50%      { box-shadow: 0 0 0 9px rgba(99,102,241,0.04); }
}
@keyframes fls-preview-in {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fls-check-in {
  0%   { opacity: 0; transform: scale(0) rotate(-50deg); }
  65%  { transform: scale(1.3) rotate(10deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes fls-skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes fls-step-glow {
  0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.15), 0 4px 14px rgba(99,102,241,0.22); }
  50%      { box-shadow: 0 0 0 7px rgba(99,102,241,0.08), 0 4px 18px rgba(99,102,241,0.30); }
}
@keyframes fls-alert-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fls-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fls-float-a {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-14px) rotate(5deg); }
}
@keyframes fls-float-b {
  0%, 100% { transform: translateY(0) translateX(0); }
  50%      { transform: translateY(10px) translateX(-8px); }
}
@keyframes fls-float-c {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-8px) rotate(-4deg); }
}

.fls-avatar-skeleton { animation: fls-skeleton-pulse 1.3s ease-in-out infinite; }

.fls-preview-ring { transition: border-color 250ms, box-shadow 250ms; }
.fls-preview-ring.idle { animation: fls-idle-glow 2.4s ease-in-out infinite; }
.fls-preview-ring img { animation: fls-preview-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }

.fls-avatar-option {
  animation: fls-pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 180ms, background 180ms;
}
.fls-avatar-option:hover  { transform: scale(1.08); }
.fls-avatar-option:active { transform: scale(0.95); }
.fls-avatar-option.selected { animation: fls-pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both, fls-ring-pulse 1.5s ease-out 1; }
.fls-check-badge { animation: fls-check-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }

.fls-step-btn.active { animation: fls-step-glow 2.2s ease-in-out infinite; }

.fls-alert { animation: fls-alert-in 220ms ease both; }
.fls-panel { animation: fls-fade-up 320ms ease both; }

.fls-bg-decor { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.fls-bubble { position: absolute; user-select: none; }
.fls-bubble--a { animation: fls-float-a 8s ease-in-out infinite; }
.fls-bubble--b { animation: fls-float-b 10s ease-in-out infinite; }
.fls-bubble--c { animation: fls-float-c 12s ease-in-out infinite; }

@media (max-width: 420px) {
  .fls-step-line { width: 34px !important; }
}

/* Los usuarios que prefieren menos movimiento siguen viendo los mismos
   estados (seleccionado, activo, error) — solo se apagan las animaciones. */
@media (prefers-reduced-motion: reduce) {
  .fls-avatar-skeleton, .fls-preview-ring.idle, .fls-preview-ring img,
  .fls-avatar-option, .fls-avatar-option.selected, .fls-check-badge,
  .fls-step-btn.active, .fls-alert, .fls-panel, .fls-bubble--a, .fls-bubble--b, .fls-bubble--c {
    animation: none !important;
  }
  * { transition-duration: 0.01ms !important; }
}
`;

/* Círculos decorativos — mismos assets que LandingPage.jsx
   (src/assets/img/circulos/circuloN.svg), concentrados en los bordes
   inferiores para no interferir con el contenido. width/height iguales +
   aspect-ratio explícito evitan que se vean ovalados. */
const CIRCULO_SRC = {
  1: circulo1, 2: circulo2, 3: circulo3, 4: circulo4, 5: circulo5, 6: circulo6,
  7: circulo7, 8: circulo8, 9: circulo9, 10: circulo10, 11: circulo11, 12: circulo12,
};
const BG_BUBBLES = [
  // clúster inferior — el más denso, usa los 12 colores disponibles
  { circulo: 1,  bottom: "-7%",  left: "-2%",  size: 120, opacity: 0.45, anim: "a" },
  { circulo: 4,  bottom: "0%",   left: "8%",   size: 34,  opacity: 0.4,  anim: "b" },
  { circulo: 5,  bottom: "-9%",  left: "15%",  size: 62,  opacity: 0.35, anim: "c" },
  { circulo: 9,  bottom: "4%",   left: "25%",  size: 26,  opacity: 0.35, anim: "a" },
  { circulo: 12, bottom: "-4%",  left: "32%",  size: 46,  opacity: 0.35, anim: "b" },
  { circulo: 6,  bottom: "6%",   left: "43%",  size: 24,  opacity: 0.3,  anim: "c" },
  { circulo: 10, bottom: "-6%",  left: "51%",  size: 52,  opacity: 0.35, anim: "a" },
  { circulo: 3,  bottom: "-8%",  left: "60%",  size: 70,  opacity: 0.4,  anim: "b" },
  { circulo: 7,  bottom: "5%",   left: "71%",  size: 34,  opacity: 0.35, anim: "c" },
  { circulo: 2,  bottom: "-5%",  left: "79%",  size: 58,  opacity: 0.35, anim: "a" },
  { circulo: 8,  bottom: "3%",   right: "10%", size: 36,  opacity: 0.35, anim: "b" },
  { circulo: 11, bottom: "-12%", right: "-4%", size: 140, opacity: 0.4,  anim: "c" },

  // acentos superiores — muy sutiles, no compiten con el contenido
  { circulo: 4,  top: "4%",  left: "-5%",  size: 76, opacity: 0.12, anim: "a" },
  { circulo: 6,  top: "8%",  left: "6%",   size: 30, opacity: 0.14, anim: "b" },
  { circulo: 8,  top: "3%",  right: "-5%", size: 68, opacity: 0.12, anim: "c" },
  { circulo: 12, top: "9%",  right: "5%",  size: 32, opacity: 0.14, anim: "a" },

  // laterales medios — dan profundidad sin invadir el contenido central
  { circulo: 9,  top: "42%", left: "-3%",  size: 40, opacity: 0.16, anim: "b" },
  { circulo: 10, top: "48%", right: "-3%", size: 44, opacity: 0.16, anim: "c" },
];

function BackgroundDecor() {
  return (
    <div className="fls-bg-decor" aria-hidden="true">
      {BG_BUBBLES.map((b, i) => (
        <img
          key={i}
          src={CIRCULO_SRC[b.circulo]}
          alt=""
          draggable={false}
          className={`fls-bubble fls-bubble--${b.anim}`}
          style={{
            top: b.top, left: b.left, right: b.right, bottom: b.bottom,
            width: b.size, height: b.size, aspectRatio: "1 / 1",
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ── Micro-componentes ──────────────────────────────────────── */
// maxStep = paso más lejano ya alcanzado. Los pasos ya completados (num <
// maxStep) se pueden reabrir haciendo clic para corregir algo; los que aún
// no se han completado (num > maxStep) no son clicables — se avanza solo
// terminando el paso actual, nunca saltando adelante.
function Stepper({ step, maxStep, onStepClick }) {
  const steps = ["Foto", "Datos", "Listo"];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 36 }}>
      {steps.map((label, i) => {
        const num       = i + 1;
        const done      = maxStep > num;
        const active    = step === num;
        const clickable = num <= maxStep && num !== step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div
                className="fls-step-line"
                style={{
                  width: 56,
                  height: 3,
                  borderRadius: 2,
                  marginTop: -18,
                  background: maxStep > i ? "linear-gradient(90deg, #6366F1, var(--edu-blue-500))" : "var(--color-border)",
                  transition: "background 450ms ease",
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              <button
                type="button"
                onClick={() => clickable && onStepClick(num)}
                disabled={!clickable}
                aria-label={`Paso ${num}: ${label}${clickable ? " (volver)" : ""}`}
                aria-current={active ? "step" : undefined}
                className={active ? "fls-step-btn active" : "fls-step-btn"}
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  minHeight: 36,
                  borderRadius: "50%",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done
                    ? "var(--edu-green-600)"
                    : active
                    ? "linear-gradient(135deg, #6366F1, var(--edu-blue-500))"
                    : "var(--color-border)",
                  color: (done || active) ? "white" : "var(--color-text-muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "background 300ms, transform 150ms",
                  boxShadow: active ? "0 0 0 4px rgba(99,102,241,0.15), 0 4px 14px rgba(99,102,241,0.22)" : "none",
                  cursor: clickable ? "pointer" : "default",
                }}
                onMouseEnter={e => { if (clickable) e.currentTarget.style.transform = "scale(1.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {done
                  ? <CheckCircle2 style={{ width: 17, height: 17 }} />
                  : num
                }
              </button>
              <span style={{
                fontSize: 11.5,
                fontWeight: active ? 700 : 500,
                color: active ? "#6366F1" : done ? "var(--edu-green-600)" : "var(--color-text-muted)",
                transition: "color 300ms",
              }}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--color-text-muted)",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: "var(--color-error-hover)", marginTop: 4, display: "flex", alignItems: "center", gap: 4, margin: "4px 0 0" }}>
          <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} /> {error}
        </p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", disabled = false, hasError = false, icon = null }) {
  const [focused, setFocused] = useState(false);
  const border = hasError ? "var(--color-error-hover)" : focused ? "#6366F1" : "var(--color-border)";
  const shadow = hasError
    ? "0 0 0 3px rgba(220,38,38,0.12)"
    : focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none";
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{
          position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
          color: focused ? "#6366F1" : "var(--color-text-subtle)",
          display: "flex", pointerEvents: "none", transition: "color 150ms",
        }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: icon ? "11px 13px 11px 38px" : "11px 13px",
          fontSize: 14,
          borderRadius: 12,
          border: `1.5px solid ${border}`,
          outline: "none",
          background: disabled ? "var(--color-bg)" : "var(--color-surface)",
          color: disabled ? "var(--color-text-muted)" : "var(--color-text)",
          boxShadow: shadow,
          transition: "border-color 150ms, box-shadow 150ms",
          cursor: disabled ? "not-allowed" : "text",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, hasError = false }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const border = hasError ? "var(--color-error-hover)" : focused ? "#6366F1" : "var(--color-border)";
  const shadow = hasError
    ? "0 0 0 3px rgba(220,38,38,0.12)"
    : focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none";
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "11px 42px 11px 13px",
          fontSize: 14,
          borderRadius: 12,
          border: `1.5px solid ${border}`,
          outline: "none",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          boxShadow: shadow,
          transition: "border-color 150ms, box-shadow 150ms",
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
      >
        {show
          ? <EyeOff style={{ width: 16, height: 16 }} />
          : <Eye    style={{ width: 16, height: 16 }} />
        }
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: "6+ caracteres", ok: password.length >= 6 },
    { label: "Mayúscula",     ok: /[A-Z]/.test(password) },
    { label: "Minúscula",     ok: /[a-z]/.test(password) },
    { label: "Número",        ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor = ["var(--color-error-hover)", "var(--color-error-hover)", "#F59E0B", "var(--edu-green-600)", "var(--edu-green-600)"][score];
  const strengthLabel = ["", "Débil", "Regular", "Buena", "Fuerte"][score];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {checks.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < score ? barColor : "var(--color-border)",
              transition: "background 250ms",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: 11, color: c.ok ? "var(--edu-green-600)" : "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <span>{c.ok ? "✓" : "○"}</span> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{strengthLabel}</span>
        )}
      </div>
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div
      className="fls-avatar-skeleton"
      style={{ width: 60, height: 60, minWidth: 60, minHeight: 60, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }}
    />
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="fls-alert" style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 14px",
      borderRadius: 12,
      background: "rgba(220,38,38,0.06)",
      border: "1px solid rgba(220,38,38,0.18)",
      boxShadow: "0 2px 10px rgba(220,38,38,0.06)",
      marginBottom: 16,
    }}>
      <span style={{
        width: 24, height: 24, minWidth: 24, minHeight: 24, borderRadius: "50%", flexShrink: 0,
        background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AlertCircle style={{ width: 14, height: 14, color: "var(--color-error-hover)" }} />
      </span>
      <p style={{ fontSize: 13, color: "var(--color-error-hover)", margin: 0, lineHeight: 1.4 }}>{message}</p>
    </div>
  );
}

function PrimaryButton({ onClick, disabled, loading, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: 14,
        border: "none",
        background: (disabled || loading)
          ? "var(--color-border)"
          : "linear-gradient(135deg, #6366F1 0%, var(--edu-blue-500) 100%)",
        color: "white",
        fontSize: 15,
        fontWeight: 700,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "opacity 150ms, background 150ms, transform 150ms",
        boxShadow: (disabled || loading) ? "none" : "0 6px 18px rgba(99,102,241,0.30)",
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={e => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   Paso 1 — Selección de avatar
   ══════════════════════════════════════════════════════════════ */
function StepAvatar({ currentPhotoUrl, onComplete }) {
  const [defaultPhotos, setDefaultPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photosError,   setPhotosError]   = useState(false);
  const [selected,      setSelected]      = useState(null); // cadena URL
  const [previewUrl,    setPreviewUrl]    = useState(currentPhotoUrl ?? null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    setPhotosError(false);
    try {
      const data = await usersGetDefaultPhotos();
      const fotos = data.fotos ?? [];
      setDefaultPhotos(fotos);
      if (currentPhotoUrl) {
        const match = fotos.find(f => f.url === currentPhotoUrl);
        if (match) setSelected(match.url);
      }
    } catch {
      setPhotosError(true);
    } finally {
      setLoadingPhotos(false);
    }
  }, [currentPhotoUrl]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleSelectDefault = (url) => {
    setSelected(prev => prev === url ? null : url);
    setPreviewUrl(prev => prev === url ? (currentPhotoUrl ?? null) : url);
    setError("");
  };

  const hasSelection = selected !== null;

  // Los avatares son predeterminados (vienen del backend) — no se permite
  // subir una foto propia en este paso, así que solo se guarda la URL
  // elegida. usersUpdateMyPhoto (PUT /users/me/foto-perfil) es el mismo
  // endpoint que ya usa PerfilPage para esto; el intento anterior llamaba a
  // PATCH /users/foto-perfil, una ruta que no existe (404).
  const handleContinue = async () => {
    if (!hasSelection) {
      setError("Debes seleccionar un avatar para continuar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("fotoPredeterminadaUrl", selected);
      const data   = await usersUpdateMyPhoto(fd);
      const newUrl = data?.fotoPerfilUrl ?? selected;
      onComplete({ fotoPerfilUrl: newUrl }, newUrl);
    } catch (err) {
      setError(humanizeError(err, "Error al guardar el avatar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Vista previa del avatar actual — object-fit: contain (no cover) para
          que ningún personaje quede cortado sin importar la proporción
          original de la imagen; el fondo detrás del avatar rellena el
          espacio sobrante en vez de recortar. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <div
          className={`fls-preview-ring${!hasSelection ? " idle" : ""}`}
          style={{
            width: 108,
            height: 108,
            minWidth: 108,
            minHeight: 108,
            borderRadius: "50%",
            overflow: "hidden",
            padding: hasSelection ? 6 : 0,
            border: hasSelection ? "3px solid transparent" : "3px solid var(--color-border)",
            backgroundImage: hasSelection ? "linear-gradient(var(--color-bg), var(--color-bg)), linear-gradient(135deg, #6366F1, var(--edu-blue-500))" : "none",
            backgroundOrigin: "border-box",
            backgroundClip: "content-box, border-box",
            background: hasSelection ? undefined : "var(--edu-neutral-100, #F3F4F6)",
            boxShadow: hasSelection ? "0 8px 22px rgba(99,102,241,0.25)" : "none",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--edu-neutral-100, #F3F4F6)" }}>
            {previewUrl
              ? <img key={previewUrl} src={previewUrl} alt="Vista previa" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera style={{ width: 28, height: 28, color: "var(--color-text-muted)" }} />
                </div>
            }
          </div>
        </div>
        <p style={{
          fontSize: 12.5,
          fontWeight: hasSelection ? 700 : 400,
          color: hasSelection ? "#6366F1" : "var(--color-text-muted)",
          marginTop: 12,
          transition: "color 200ms",
        }}>
          {hasSelection ? "Avatar seleccionado ✓" : "Sin avatar seleccionado"}
        </p>
      </div>

      <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", textAlign: "center", marginBottom: 20, fontWeight: 500 }}>
        Elige el avatar que te represente
      </p>

      {/* Grid de avatares predeterminados — cada tile tiene un fondo suave
          propio y usa object-fit:contain, así ningún avatar (cuadrado,
          vertical, horizontal, redondo, con personajes grandes o
          pequeños) se recorta ni se deforma. */}
      {loadingPhotos ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => <AvatarSkeleton key={i} />)}
        </div>
      ) : photosError ? (
        <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 24 }}>
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 8 }}>
            No se pudieron cargar los avatares
          </p>
          <button
            type="button"
            onClick={fetchPhotos}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#6366F1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} /> Reintentar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 26 }}>
          {defaultPhotos.map((foto, i) => {
            const active = selected === foto.url;
            return (
              <button
                key={foto.publicId}
                type="button"
                onClick={() => handleSelectDefault(foto.url)}
                aria-label={`Elegir avatar ${foto.nombre ?? ""}`}
                aria-pressed={active}
                className={`fls-avatar-option${active ? " selected" : ""}`}
                style={{
                  position: "relative",
                  width: 60,
                  height: 60,
                  minWidth: 60,
                  minHeight: 60,
                  borderRadius: "50%",
                  padding: 6,
                  border: `${active ? "2.5px" : "1.5px"} solid ${active ? "#6366F1" : "var(--color-border)"}`,
                  background: active ? "rgba(99,102,241,0.08)" : "var(--edu-neutral-100, #F3F4F6)",
                  cursor: "pointer",
                  flexShrink: 0,
                  overflow: "visible",
                  animationDelay: `${i * 45}ms`,
                }}
              >
                <span style={{ display: "block", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
                  <img
                    src={foto.url}
                    alt={foto.nombre}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                </span>
                {active && (
                  <span className="fls-check-badge" style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    minHeight: 20,
                    borderRadius: "50%",
                    background: "var(--edu-green-600)",
                    border: "2px solid var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <CheckCircle2 style={{ width: 11, height: 11, color: "white" }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ErrorBanner message={error} />

      <PrimaryButton
        onClick={handleContinue}
        disabled={!hasSelection}
        loading={saving}
      >
        Continuar →
      </PrimaryButton>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Paso 2 — Actualización de datos (correo + contraseña)
   ══════════════════════════════════════════════════════════════ */
function StepData({ user, loginPassword, onComplete, onBack }) {
  const [form, setForm] = useState({
    nombre:          user?.nombre    ?? "",
    apellido:        user?.apellido  ?? "",
    correo:          user?.correo    ?? "",
    contraseñaNueva: "",
    confirmar:       "",
  });
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [submitError, setSubmitError] = useState("");

  const f = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const errs = validateDataForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!loginPassword) {
      setSubmitError("No se encontró la contraseña de acceso. Por favor cierra sesión e inicia de nuevo.");
      return;
    }

    setSaving(true);
    try {
      // 1. Actualizar correo (y nombre/apellido si fueron editados)
      const updateBody = {
        correo:   form.correo.trim(),
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
      };
      const userData = await usersUpdate(user.id, updateBody);

      // 2. Cambiar contraseña — el backend pone primerInicioSesion en false
      // al cambiarla, pero su respuesta no trae el usuario actualizado (solo
      // un mensaje), así que el merge de abajo lo refleja a mano; si no,
      // ProtectedRoute seguiría viendo primerInicioSesion:true y devolvería
      // al usuario a este mismo wizard en cuanto navegue a otra pantalla.
      await authChangePassword({
        contrasenaActual: loginPassword,
        contrasenaNueva:  form.contraseñaNueva,
      });
      clearLoginPassword();

      onComplete({ ...(userData?.user ?? {}), primerInicioSesion: false });
    } catch (err) {
      setSubmitError(humanizeError(err, "Error al guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Nombre y Apellido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Nombre *" error={errors.nombre}>
            <TextInput
              value={form.nombre}
              onChange={f("nombre")}
              placeholder="Juan"
              hasError={!!errors.nombre}
              icon={<User style={{ width: 15, height: 15 }} />}
            />
          </Field>
          <Field label="Apellido *" error={errors.apellido}>
            <TextInput
              value={form.apellido}
              onChange={f("apellido")}
              placeholder="Pérez"
              hasError={!!errors.apellido}
              icon={<User style={{ width: 15, height: 15 }} />}
            />
          </Field>
        </div>

        {/* Correo */}
        <Field label="Correo electrónico *" error={errors.correo}>
          <TextInput
            value={form.correo}
            onChange={f("correo")}
            type="email"
            placeholder="usuario@correo.com"
            hasError={!!errors.correo}
            icon={<Mail style={{ width: 15, height: 15 }} />}
          />
        </Field>

        {/* Separador contraseña */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 14 }}>
            Crea tu contraseña
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nueva contraseña *" error={errors.contraseñaNueva}>
              <PasswordInput
                value={form.contraseñaNueva}
                onChange={f("contraseñaNueva")}
                placeholder="Mínimo 6 caracteres"
                hasError={!!errors.contraseñaNueva}
              />
            </Field>
            <PasswordStrength password={form.contraseñaNueva} />
            <Field label="Confirmar contraseña *" error={errors.confirmar}>
              <PasswordInput
                value={form.confirmar}
                onChange={f("confirmar")}
                placeholder="Repite la contraseña"
                hasError={!!errors.confirmar}
              />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <ErrorBanner message={submitError} />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            aria-label="Volver al paso anterior"
            style={{
              flex: "0 0 auto",
              padding: "14px 18px",
              borderRadius: 14,
              border: "1.5px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "background 150ms, color 150ms, border-color 150ms",
            }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "var(--color-bg)"; e.currentTarget.style.color = "var(--color-text)"; e.currentTarget.style.borderColor = "#6366F1"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface)"; e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} />
            Volver
          </button>
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={handleSubmit} loading={saving}>
              Guardar y finalizar →
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Paso 3 — Confirmación y redirección
   ══════════════════════════════════════════════════════════════ */
function StepDone({ userRol }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      navigate(ROLE_REDIRECTS[userRol] ?? "/", { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, userRol, navigate]);

  return (
    <div className="fls-panel" style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{
        width: 84,
        height: 84,
        minWidth: 84,
        minHeight: 84,
        borderRadius: "50%",
        background: "rgba(22,163,74,0.1)",
        border: "2px solid var(--edu-green-600)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 22px",
        boxShadow: "0 8px 24px rgba(22,163,74,0.18)",
      }}>
        <CheckCircle2 style={{ width: 40, height: 40, color: "var(--edu-green-600)" }} />
      </div>
      <h2 style={{ fontSize: 23, fontWeight: 800, color: "var(--color-text)", margin: "0 0 10px" }}>
        ¡Todo listo!
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 22px", lineHeight: 1.6 }}>
        Tu perfil está configurado. Bienvenido a Edumon.
      </p>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
        Redirigiendo en <strong style={{ color: "var(--color-text)" }}>{countdown}</strong>...
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pantalla principal
   ══════════════════════════════════════════════════════════════ */
const STEP_TITLES = [
  { title: "Elige tu foto de perfil", subtitle: "Esta imagen te representará en la plataforma." },
  { title: "Actualiza tus datos",     subtitle: "Completa tu correo y crea tu contraseña de acceso." },
  { title: "¡Perfil completado!",     subtitle: "" },
];

export default function FirstLoginScreen() {
  const { user, updateUser, logout } = useAuth();
  // Ver utils/firstLoginPassword.js — se lee de sessionStorage en vez de
  // location.state porque el bloqueo del botón "atrás" (más abajo) toca el
  // History API nativo y puede dejar el state de la ruta en null.
  const [loginPassword] = useState(() => readLoginPassword());

  const [step, setStep]       = useState(1);
  const [maxStep, setMaxStep] = useState(1);

  // Prevenir la navegación hacia atrás del navegador durante el flujo — la
  // salida real ahora es el botón "Salir" de la cabecera, que sí cierra
  // sesión de forma explícita en vez de dejar al usuario a medio autenticar.
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const handlePop = () => {
      window.history.pushState(null, document.title, window.location.href);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Ir a un paso ya alcanzado (retroceder para corregir algo). Nunca permite
  // adelantar: goToStep se llama solo desde controles que ya validan
  // num <= maxStep (Stepper, botón "Volver").
  const goToStep = (n) => setStep(n);

  const handlePhotoComplete = (updatedUser, _photoUrl) => {
    if (updatedUser) updateUser(updatedUser);
    setStep(2);
    setMaxStep(m => Math.max(m, 2));
  };

  const handleDataComplete = (updatedUser) => {
    if (updatedUser) updateUser(updatedUser);
    setStep(3);
    setMaxStep(m => Math.max(m, 3));
  };

  const { title, subtitle } = STEP_TITLES[step - 1];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #FFFFFF 0%, var(--edu-blue-50, #EFF6FF) 100%)",
      position: "relative",
      overflowX: "hidden",
    }}>
      <style>{FLS_CSS}</style>
      <BackgroundDecor />

      {/* Botón de salida — fijo, siempre visible y alcanzable sin importar
          el scroll ni el paso en el que esté el usuario. */}
      <button
        type="button"
        onClick={() => { clearLoginPassword(); logout(); }}
        title="Cancelar y cerrar sesión"
        aria-label="Cancelar y cerrar sesión"
        style={{
          position: "fixed",
          top: 18,
          right: 18,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 16px",
          borderRadius: 999,
          border: "1.5px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-muted)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          transition: "background 150ms, color 150ms, border-color 150ms, transform 150ms",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "var(--color-error-hover)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface)"; e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
        onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
        onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} />
        Salir
      </button>

      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 20px 80px",
      }}>
        <div style={{ width: "100%", maxWidth: 540 }}>

          {/* ── Logo / Cabecera ── */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 60,
              height: 60,
              minWidth: 60,
              minHeight: 60,
              borderRadius: 18,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 10px 26px rgba(99,102,241,0.16)",
            }}>
              <img src={logoSvg} alt="Edumon" style={{ width: 38, height: 38, objectFit: "contain" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", margin: "0 0 7px", letterSpacing: "-0.01em" }}>
              {step === 1 ? "¡Bienvenido a Edumon!" : "Configura tu cuenta"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
              Completa estos pasos antes de continuar
            </p>
          </div>

          {/* ── Tarjeta única: pasos + título + contenido del paso ── */}
          <div className="fls-panel" style={{
            background: "var(--color-surface)",
            borderRadius: 24,
            border: "1px solid var(--color-border)",
            boxShadow: "var(--clay-card)",
            padding: "32px 28px",
          }}>
            <Stepper step={step} maxStep={maxStep} onStepClick={goToStep} />

            {/* Título del paso */}
            {step < 3 && (
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Contenido del paso */}
            {step === 1 && (
              <StepAvatar
                currentPhotoUrl={user?.fotoPerfilUrl ?? null}
                onComplete={handlePhotoComplete}
              />
            )}
            {step === 2 && (
              <StepData
                user={user}
                loginPassword={loginPassword}
                onComplete={handleDataComplete}
                onBack={() => goToStep(1)}
              />
            )}
            {step === 3 && (
              <StepDone userRol={user?.rol} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
