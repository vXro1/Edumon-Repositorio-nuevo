// src/features/auth/components/shared/AuthLayout.jsx
// Shared shell for all auth pages: LoginForm, ForgotPasswordForm, ResetPasswordForm.
// Usage:
//   <AuthLayout panelContent={<LeftPanel />}>
//     <form ...>...</form>
//   </AuthLayout>

import { useState } from "react";
import logoSvg from "@/assets/icons/logo.svg";

/* ─────────────────────────────────────────────
   Logo con fallback
───────────────────────────────────────────── */
const LogoFallback = () => (
  <svg width="52" height="52" viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="14" fill="rgba(255,255,255,0.2)" />
    <path d="M8 30 Q14 10 22 22 Q30 34 36 14" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
    <circle cx="22" cy="22" r="5" fill="#fff" opacity="0.9" />
    <circle cx="12" cy="28" r="3" fill="#fff" opacity="0.7" />
    <circle cx="32" cy="16" r="3" fill="#fff" opacity="0.7" />
  </svg>
);

export const EdumonLogo = () => {
  const [err, setErr] = useState(false);
  return err
    ? <LogoFallback />
    : <img
        src={logoSvg}
        alt="Edumon"
        width={200}
        height={200}
        onError={() => setErr(true)}
        style={{ objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
      />;
};

/* ─────────────────────────────────────────────
   Panel izquierdo por defecto (idéntico al de LoginForm).
   Puedes sobreescribir con panelContent prop si quieres
   variación por formulario en el futuro.
───────────────────────────────────────────── */
export const DefaultLeftPanel = () => (
  <div className="auth-panel-left">

    {/* Orbes — confinados al panel izquierdo */}
    <div className="auth-orbs" aria-hidden="true">
      <span className="auth-orb auth-orb1" />
      <span className="auth-orb auth-orb2" />
      <span className="auth-orb auth-orb3" />
      <span className="auth-orb auth-orb4" />
      <span className="auth-orb auth-orb5" />
    </div>

    {/* Partículas — confinadas al panel izquierdo */}
    <div className="auth-particles" aria-hidden="true">
      {[...Array(12)].map((_, i) => (
        <span key={i} className={`auth-dot auth-dot${i + 1}`} />
      ))}
    </div>

    <div className="auth-panel-waves">
      <svg viewBox="0 0 200 600" preserveAspectRatio="none" className="auth-wave-svg">
        <path d="M200 0 Q120 150 160 300 Q200 450 140 600 L200 600 Z" fill="rgba(255,255,255,0.06)" />
        <path d="M200 0 Q80 200 130 350 Q180 500 100 600 L200 600 Z" fill="rgba(255,255,255,0.04)" />
      </svg>
    </div>

    <div className="auth-panel-content">
      <div className="auth-panel-logo">
        <EdumonLogo />
      </div>
      <h2 className="auth-panel-title">Bienvenido a</h2>
      <p className="auth-panel-brand">Edumon</p>
      <p className="auth-panel-sub">
        Educación conectada,<br />familias unidas.
      </p>
    </div>

  </div>
);

/* ─────────────────────────────────────────────
   Shell principal
   - panelContent: nodo React para el panel izquierdo
                   (default: DefaultLeftPanel)
   - children: contenido del panel derecho (el form)
───────────────────────────────────────────── */
const AuthLayout = ({ panelContent, children }) => (
  <>
    <style>{AUTH_CSS}</style>
    <div className="auth-root">
      {/* Card split */}
      <div className="auth-card">
        {panelContent ?? <DefaultLeftPanel />}
        <div className="auth-panel-right">
          {children}
        </div>
      </div>
    </div>
  </>
);
export default AuthLayout;
/* ─────────────────────────────────────────────
   CSS compartido (todas las clases llevan prefijo `auth-`)
───────────────────────────────────────────── */
export const AUTH_CSS = `
/* ══ ROOT ══ */
.auth-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f7 0%, #e8eaf2 50%, #f4f0f8 100%);
  padding: 16px;
  position: relative;
}

/* Subtle dot pattern on the bg */
.auth-root::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, rgba(140,56,240,0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
  z-index: 0;
}

/* ══ ORBES — solo dentro del panel izquierdo ══ */
.auth-orbs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
}

.auth-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(50px);
  animation: auth-orb-float linear infinite;
}

.auth-orb1 { width:220px; height:220px; background:rgba(255,107,53,0.45);  top:-60px;    left:-60px;   animation-duration:20s; }
.auth-orb2 { width:180px; height:180px; background:rgba(0,126,167,0.35);   top:15%;      right:-50px;  animation-duration:16s; animation-delay:-5s; }
.auth-orb3 { width:160px; height:160px; background:rgba(247,197,159,0.50); bottom:-40px; left:5%;      animation-duration:24s; animation-delay:-8s; }
.auth-orb4 { width:140px; height:140px; background:rgba(199,125,255,0.35); bottom:10%;   right:10%;    animation-duration:18s; animation-delay:-3s; }
.auth-orb5 { width:100px; height:100px; background:rgba(255,77,109,0.30);  top:45%;      left:35%;     animation-duration:14s; animation-delay:-6s; }

@keyframes auth-orb-float {
  0%   { transform: translateY(0)     scale(1);    }
  50%  { transform: translateY(-30px) scale(1.08); }
  100% { transform: translateY(0)     scale(1);    }
}

/* ══ PARTÍCULAS — solo dentro del panel izquierdo ══ */
.auth-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.auth-dot {
  position: absolute;
  width: 7px; height: 7px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.55);
  animation: auth-dot-rise linear infinite;
}

.auth-dot1  { left:5%;   animation-duration:8s;  animation-delay:0s;   width:5px;  height:5px; }
.auth-dot2  { left:15%;  animation-duration:11s; animation-delay:-2s;  width:9px;  height:9px;  background:rgba(255,200,100,0.65); }
.auth-dot3  { left:28%;  animation-duration:9s;  animation-delay:-4s;  }
.auth-dot4  { left:40%;  animation-duration:13s; animation-delay:-1s;  width:5px;  height:5px; }
.auth-dot5  { left:52%;  animation-duration:10s; animation-delay:-6s;  background:rgba(128,206,215,0.75); }
.auth-dot6  { left:63%;  animation-duration:7s;  animation-delay:-3s;  width:10px; height:10px; }
.auth-dot7  { left:72%;  animation-duration:14s; animation-delay:-5s;  background:rgba(255,107,53,0.65); }
.auth-dot8  { left:82%;  animation-duration:9s;  animation-delay:-7s;  width:5px;  height:5px; }
.auth-dot9  { left:88%;  animation-duration:11s; animation-delay:-2s;  background:rgba(247,197,159,0.75); }
.auth-dot10 { left:20%;  animation-duration:8s;  animation-delay:-4s;  width:8px;  height:8px; }
.auth-dot11 { left:45%;  animation-duration:12s; animation-delay:-1s;  background:rgba(199,125,255,0.65); }
.auth-dot12 { left:70%;  animation-duration:15s; animation-delay:-9s;  width:6px;  height:6px; }

@keyframes auth-dot-rise {
  0%   { bottom: -16px; opacity: 0;   transform: translateX(0)   scale(0.8); }
  10%  { opacity: 1; }
  90%  { opacity: 0.55; }
  100% { bottom: 105%;  opacity: 0;   transform: translateX(20px) scale(1.2); }
}

/* ══ CARD ══ */
.auth-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  max-width: 860px;
  min-height: 520px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow:
    0 32px 80px rgba(0,0,0,0.25),
    0 8px 24px rgba(0,0,0,0.15);
  animation: auth-card-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
}

@keyframes auth-card-in {
  from { opacity: 0; transform: scale(0.9) translateY(30px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}

/* ══ PANEL IZQUIERDO ══ */
.auth-panel-left {
  width: 42%;
  flex-shrink: 0;
  background: linear-gradient(160deg,
    #FF6B35 0%, #FF8C42 25%, #FF4D6D 60%, #C77DFF 100%
  );
  background-size: 200% 200%;
  animation: auth-panel-shift 8s ease infinite;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  overflow: hidden;
}

@keyframes auth-panel-shift {
  0%   { background-position: 0%   0%; }
  50%  { background-position: 100% 100%; }
  100% { background-position: 0%   0%; }
}

.auth-panel-waves { position: absolute; inset: 0; pointer-events: none; }
.auth-wave-svg    { position: absolute; right: 0; top: 0; height: 100%; width: 60%; }

.auth-panel-content { position: relative; z-index: 1; text-align: center; color: #fff; }

.auth-panel-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  animation: auth-logo-bounce 3s ease-in-out infinite;
}

@keyframes auth-logo-bounce {
  0%,100% { transform: translateY(0);    }
  50%      { transform: translateY(-8px); }
}

.auth-panel-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  margin: 0 0 4px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-panel-brand {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 900;
  color: #fff;
  margin: 0 0 12px;
  letter-spacing: -0.04em;
  text-shadow: 0 4px 20px rgba(0,0,0,0.20);
}

.auth-panel-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.80);
  line-height: 1.6;
  margin: 0;
}

/* ══ PANEL DERECHO ══ */
.auth-panel-right {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px 40px;
  overflow-y: auto;
  position: relative;
}

/* Subtle texture on the right panel */
.auth-panel-right::before {
  content: "";
  position: absolute;
  top: -60px;
  right: -60px;
  width: 200px;
  height: 200px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(140,56,240,0.05) 0%, transparent 70%);
  pointer-events: none;
}

/* ══ CHECK LABEL ══ */
.check-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  user-select: none;
}
.check-input {
  width: 15px;
  height: 15px;
  accent-color: #FF6B35;
  cursor: pointer;
}

/* ══ ENCABEZADO DE FORMULARIO ══ */
.auth-form-head { margin-bottom: 24px; }

.auth-form-head h1 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 6px;
  letter-spacing: -0.03em;
}

.auth-form-head p {
  font-size: 13.5px;
  color: var(--color-text-muted);
  margin: 0;
}

/* ══ ALERTAS ══ */
.auth-warn {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--color-warning-light);
  border-left: 3px solid var(--color-warning);
  font-size: 13px;
  color: var(--color-warning-hover);
  font-weight: 500;
}

.auth-error {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--color-error-light);
  border-left: 3px solid var(--color-error);
  font-size: 13px;
  color: var(--color-error);
  font-weight: 500;
}

.auth-success {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--color-success-light, #e6f9f0);
  border-left: 3px solid var(--color-success, #22c55e);
  font-size: 13px;
  color: var(--color-success-hover, #15803d);
  font-weight: 500;
}

/* ══ FORM ══ */
.auth-form { display: flex; flex-direction: column; gap: 16px; }

/* Prefijo +57 del teléfono */
.auth-prefix {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  pointer-events: none;
  z-index: 1;
}
.auth-input-prefix { padding-left: 4.5rem !important; }

/* Fila recordar / recuperar */
.auth-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Botón de texto (recuperar, volver, etc.) */
.auth-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: #FF6B35;
  padding: 0;
  transition: color var(--transition-fast);
}
.auth-link-btn:hover { color: #d4521e; text-decoration: underline; }

/* ══ BOTÓN SUBMIT ══ */
.auth-submit {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #FF6B35 0%, #FF4D6D 50%, #C77DFF 100%);
  background-size: 200% 200%;
  animation: auth-btn-shift 4s ease infinite;
  color: #fff;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(180,60,30,0.4), 0 8px 24px rgba(255,107,53,0.35);
  transition: transform 100ms ease, box-shadow 100ms ease, filter 100ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

@keyframes auth-btn-shift {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(180,60,30,0.4), 0 12px 32px rgba(255,107,53,0.45);
  filter: brightness(1.06);
}
.auth-submit:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: none;
}
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; animation: none; }

/* ══ SPINNER ══ */
.auth-spinner {
  width: 16px; height: 16px;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 9999px;
  animation: auth-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes auth-spin { to { transform: rotate(360deg); } }

/* ══ RESPONSIVE ══ */
@media (max-width: 680px) {
  .auth-card { flex-direction: column; max-width: 400px; min-height: unset; }
  .auth-panel-left { width: 100%; min-height: 180px; padding: 28px 24px; }
  .auth-panel-brand { font-size: 2rem; }
  .auth-panel-right { padding: 28px 24px; }
  .auth-form-head h1 { font-size: 1.3rem; }
}
`;