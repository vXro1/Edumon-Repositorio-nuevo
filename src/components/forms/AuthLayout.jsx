// src/features/auth/components/shared/AuthLayout.jsx
// Contenedor compartido para todas las páginas de autenticación: LoginForm, ForgotPasswordForm, ResetPasswordForm.
// Tarjeta de dos paneles: panel de marca (degradado azul + logo con halo) y
// panel de formulario (blanco). El corte diagonal entre ambos es el
// elemento de firma del rediseño — en móvil se desactiva y el panel de
// marca se aplana a una franja horizontal compacta arriba.
import logo from "@/assets/icons/logo.svg";
import circulo1 from "@/assets/img/circulos/circulo1.svg";
import circulo5 from "@/assets/img/circulos/circulo5.svg";
import circulo9 from "@/assets/img/circulos/circulo9.svg";

// Solo 3 acentos decorativos (antes 12 disponibles / 8 en uso): dos anclas
// grandes recortadas por el borde y un satélite pequeño. Menos elementos,
// más aire — para que el logo sea lo único que compite por la atención.
const AUTH_BUBBLES = [
  { src: circulo1, top: "-16%", left: "-14%", size: 240, opacity: 0.28 },
  { src: circulo5, bottom: "-18%", right: "-12%", size: 210, opacity: 0.24 },
  { src: circulo9, top: "60%", left: "8%", size: 30, opacity: 0.4 },
];

function AuthBubbles() {
  return (
    <div className="auth-bubbles" aria-hidden="true">
      {AUTH_BUBBLES.map((b, i) => (
        <img
          key={i}
          src={b.src}
          alt=""
          draggable={false}
          className="auth-bubble"
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

/* ─────────────────────────────────────────────
   Panel de marca — degradado azul + logo con halo.
   Mismo bloque en las 3 pantallas; solo cambia brandTitle / brandTagline.
───────────────────────────────────────────── */
const Star = ({ className, size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l7.1-1.01z" />
  </svg>
);

function AuthBrandPanel({ brandTitle, brandTagline }) {
  return (
    <div className="auth-card-brand">
      <AuthBubbles />
      <Star className="auth-spark auth-spark--1" size={18} />
      <Star className="auth-spark auth-spark--2" size={12} />
      <Star className="auth-spark auth-spark--3" size={22} />
      <Star className="auth-spark auth-spark--4" size={14} />
      <Star className="auth-spark auth-spark--5" size={10} />
      <div className="auth-brand-content">
        <div className="auth-brand-badge">
          <img src={logo} alt="Edumon" draggable={false} />
        </div>
        <div className="auth-brand-copy">
          <h2>{brandTitle}</h2>
          {brandTagline && <p className="auth-brand-tagline">{brandTagline}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Contenedor principal — tarjeta de dos paneles, centrada.
   topAction: contenido opcional FUERA de la tarjeta (ej. "Volver al
   inicio"), alineado al mismo ancho que la tarjeta, encima de ella.
   brandTitle / brandTagline: copy del panel de marca. Traen defaults
   pensados para la pantalla de login.
   children: contenido del formulario, dentro del panel blanco.
───────────────────────────────────────────── */
const AuthLayout = ({
  children,
  topAction,
  brandTitle = <>Bienvenido a<br /><strong>Edumon</strong></>,
  brandTagline = "Educación conectada, familias unidas.",
}) => (
  <>
    <style>{AUTH_CSS}</style>
    <div className="auth-root">
      <div className="auth-stack">
        {topAction && <div className="auth-topbar">{topAction}</div>}
        <div className="auth-card">
          <AuthBrandPanel brandTitle={brandTitle} brandTagline={brandTagline} />
          <div className="auth-card-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  </>
);
export default AuthLayout;

/* ─────────────────────────────────────────────
   CSS compartido (todas las clases llevan prefijo `auth-`)
   Colores tomados de los tokens del proyecto. Estas pantallas viven
   fuera de .app-shell, así que el azul de marca se toma del token
   crudo --edu-blue-500/700/900 (var(--color-primary) resolvería al
   morado de :root, no al azul del dashboard).
───────────────────────────────────────────── */
export const AUTH_CSS = `
.auth-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Fondo con más vida (antes un azul plano muy apagado). */
  background:
    radial-gradient(circle at 12% 10%, rgba(5, 199, 242, 0.18) 0%, transparent 40%),
    radial-gradient(circle at 88% 90%, rgba(124, 58, 237, 0.14) 0%, transparent 42%),
    linear-gradient(160deg, #EAF4FF 0%, var(--edu-blue-100, #D9EFFC) 100%);
  padding: 24px 16px;
}

/* ══ COLUMNA EXTERNA (topbar + tarjeta) ══ */
.auth-stack {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-topbar { display: flex; }

.auth-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 7px 14px 7px 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  box-shadow: 0 1px 3px rgba(12,106,196,0.08);
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 100ms ease;
}
.auth-back-link:hover {
  color: var(--color-text);
  border-color: var(--edu-blue-200, #B9D8F2);
  box-shadow: 0 3px 10px rgba(12,106,196,0.14);
}
.auth-back-link:active { transform: scale(0.97); }
.auth-back-link:focus-visible {
  outline: 2px solid var(--edu-blue-500, #0C6AC4);
  outline-offset: 2px;
}

/* ══ TARJETA DE DOS PANELES ══ */
.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 880px;
  display: flex;
  align-items: stretch;
  background: #fff;
  border-radius: 26px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(4,42,84,0.06), 0 20px 48px rgba(4,42,84,0.14);
  overflow: hidden;
}

/* ══ PANEL DE MARCA ══
   Degradado azul diagonal (misma familia de color, sin mezclar tonos
   nuevos) + halo radial detrás de la insignia, para que el logo sea
   el punto focal. El clip-path recorta un ángulo en el borde derecho:
   la tarjeta blanca de fondo se asoma por ese corte, creando la costura
   diagonal sin agregar ningún elemento extra al DOM. */
.auth-card-brand {
  position: relative;
  flex: 0 0 300px;
  min-width: 0;
  color: #fff;
  padding: 36px 30px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  text-align: center;
  overflow: hidden;
  clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%);
  background:
    radial-gradient(circle at 50% 38%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 30%, transparent 60%),
    radial-gradient(circle at 78% 88%, rgba(5, 199, 242, 0.45) 0%, transparent 45%),
    linear-gradient(155deg, var(--edu-blue-900, #042A54) 0%, var(--edu-blue-600, #0A5AA8) 45%, var(--edu-blue-400, #46A8EA) 100%);
}

/* ══ BURBUJAS DECORATIVAS — solo 3, muy suaves ══ */
.auth-bubbles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.auth-bubble { position: absolute; user-select: none; }

/* ══ ESTRELLITAS ══ centelleo sutil sobre el panel de marca ══ */
.auth-spark {
  position: absolute;
  z-index: 1;
  color: rgba(255, 255, 255, 0.9);
  pointer-events: none;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5));
}
.auth-spark--1 { top: 12%; left: 16%; color: var(--edu-yellow, #FCBD00); }
.auth-spark--2 { top: 26%; right: 18%; }
.auth-spark--3 { bottom: 30%; left: 12%; color: var(--edu-cyan, #05C7F2); }
.auth-spark--4 { bottom: 16%; right: 14%; }
.auth-spark--5 { top: 46%; right: 30%; color: var(--edu-yellow, #FCBD00); }
@media (prefers-reduced-motion: no-preference) {
  .auth-spark { animation: auth-twinkle 3s ease-in-out infinite; }
  .auth-spark--2 { animation-delay: -0.7s; }
  .auth-spark--3 { animation-delay: -1.3s; }
  .auth-spark--4 { animation-delay: -1.9s; }
  .auth-spark--5 { animation-delay: -2.5s; }
}
@keyframes auth-twinkle {
  0%, 100% { transform: scale(0.7); opacity: 0.35; }
  50%      { transform: scale(1.1); opacity: 1; }
}

.auth-brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

/* ══ LOGO — insignia con halo doble para que resalte del degradado ══ */
.auth-brand-badge {
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.32),
    0 0 0 16px rgba(255,255,255,0.05),
    0 18px 40px rgba(4,42,84,0.45),
    0 4px 12px rgba(0,0,0,0.18);
}

.auth-brand-badge img {
  width: 150px;
  height: 150px;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

/* ══ TEXTO DE MARCA ══ */
.auth-brand-copy h2 {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0;
}
.auth-brand-copy h2::after {
  content: "";
  display: block;
  width: 38px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.5);
  margin: 12px auto 10px;
}

.auth-brand-copy .auth-brand-tagline {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  opacity: 0.88;
}

/* ══ PANEL DE FORMULARIO ══ */
.auth-card-body {
  flex: 1 1 auto;
  min-width: 0;
  max-height: 88vh;
  overflow-y: auto;
  padding: 40px 40px 32px;
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

/* ══ ENCABEZADO DE FORMULARIO ══ */
.auth-form-head { margin-bottom: 22px; text-align: center; }

/* Título grande, con la fuente redondeada (Baloo 2) y DEGRADADO de
   marca azul→cian, para que destaque claramente del subtítulo y del
   resto del formulario. Debajo, una línea de acento centrada. */
.auth-form-head h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.12;
  margin: 0 0 10px;
  letter-spacing: 0.005em;
  background: linear-gradient(
    120deg,
    var(--edu-blue-700, #084A8C) 0%,
    var(--edu-blue-500, #0C6AC4) 45%,
    var(--edu-cyan, #05C7F2) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.auth-form-head h1::after {
  content: "";
  display: block;
  width: 46px;
  height: 4px;
  margin: 12px auto 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--edu-blue-500, #0C6AC4), var(--edu-cyan, #05C7F2));
}

.auth-form-head p {
  font-size: 13.5px;
  color: var(--color-text-subtle, #94a3b8);
  font-weight: 500;
  margin: 12px 0 0;
  line-height: 1.5;
}

/* ══ ALERTAS ══ */
.auth-warn {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  font-size: 13px;
  color: var(--color-warning-hover);
  font-weight: 500;
}

.auth-error {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  font-size: 13px;
  color: var(--color-error);
  font-weight: 500;
}

.auth-success {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-success-light, #e6f9f0);
  border: 1px solid var(--color-success, #22c55e);
  font-size: 13px;
  color: var(--color-success-hover, #15803d);
  font-weight: 500;
}
/* Variante con ícono + más aire para la confirmación de "código enviado" */
.auth-success--lg {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
  line-height: 1.45;
}
.auth-success--lg svg { flex-shrink: 0; margin-top: 1px; }

/* ══ FORM ══ */
.auth-form { display: flex; flex-direction: column; gap: 14px; }

/* ══ CAMPOS DE ENTRADA EN AUTH ══
   Estas pantallas viven fuera de .app-shell, así que --color-primary
   y --shadow-focus-soft resuelven al MORADO de :root — el campo de
   teléfono se enfocaba en morado (y el anillo suave se leía como una
   "segunda caja" lila alrededor del blanco). Aquí forzamos el mismo
   azul de marca del resto del login para todos los campos, y quitamos
   el fondo raro que Chrome pinta al autocompletar. */
.auth-card-body .input,
.auth-card-body .phone-field {
  border-radius: 14px;
  box-shadow: none;
}
.auth-card-body .input:hover:not(:disabled):not(.input-error):not(.input-success),
.auth-card-body .phone-field:hover:not(.input-error):not(.input-success) {
  border-color: var(--edu-blue-300, #7FC7F5);
}
.auth-card-body .input:focus:not(.input-error):not(.input-success),
.auth-card-body .phone-field:focus-within:not(.input-error):not(.input-success) {
  border-color: var(--edu-blue-500, #0C6AC4);
  box-shadow: 0 0 0 3px rgba(12, 106, 196, 0.16);
}
.auth-card-body .phone-field:focus-within .phone-field-icon,
.auth-card-body .phone-field:focus-within .phone-field-prefix {
  color: var(--edu-blue-600, #0958A5);
}
/* El <input> interno del teléfono nunca dibuja su propia caja: hereda
   el fondo del contenedor .phone-field y no tiene borde/anillo propio. */
.auth-card-body .phone-field-input {
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 0;
}
/* Autocompletado de Chrome: sin recuadro amarillo/gris/azul interno,
   ni en el estado "relleno" ni en el de "sugerencia disponible". */
.auth-card-body input:-webkit-autofill,
.auth-card-body input:-webkit-autofill:hover,
.auth-card-body input:-webkit-autofill:focus,
.auth-card-body input:-webkit-autofill:active,
.auth-card-body input:autofill {
  -webkit-text-fill-color: var(--color-text) !important;
  -webkit-box-shadow: 0 0 0 1000px var(--color-surface, #fff) inset !important;
  box-shadow: 0 0 0 1000px var(--color-surface, #fff) inset !important;
  caret-color: var(--color-text);
  transition: background-color 9999s ease-out 0s !important;
}

.auth-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.auth-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--edu-blue-500, #0C6AC4);
  padding: 0;
  transition: color var(--transition-fast);
}
.auth-link-btn:hover { color: var(--edu-blue-600, #0958A5); text-decoration: underline; }

.auth-link-btn--accent { color: var(--color-secondary, #F23D7F); }
.auth-link-btn--accent:hover { color: var(--color-secondary-hover, #D42B68); }

/* ══ BOTÓN SUBMIT ══ */
.auth-submit {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--edu-blue-700, #084A8C), var(--edu-blue-500, #0C6AC4) 55%, var(--edu-cyan, #05C7F2));
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(12,106,196,0.32);
  transition: filter 150ms ease, transform 100ms ease, box-shadow 100ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.auth-submit:hover:not(:disabled) {
  filter: saturate(1.15) brightness(1.04);
  box-shadow: 0 8px 22px rgba(12,106,196,0.4);
}
.auth-submit:active:not(:disabled) { transform: scale(0.98); }
.auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }
.auth-submit:focus-visible { outline: 2px solid var(--edu-blue-500, #0C6AC4); outline-offset: 2px; }

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

/* ══ CÓDIGO OTP ══ */
.auth-otp-row { display: flex; gap: 8px; justify-content: center; margin: 4px 0; }
.auth-otp-digit {
  width: 44px;
  height: 52px;
  border-radius: 12px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  font-family: var(--font-display);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.auth-otp-digit:focus {
  outline: none;
  border-color: var(--edu-blue-500, #0C6AC4);
  box-shadow: 0 0 0 3px rgba(12,106,196,0.15);
}
.auth-otp-digit.filled { border-color: var(--edu-blue-300, #86B6E0); background: var(--edu-blue-50, #EFF6FF); }
.auth-otp-digit.otp-error { border-color: var(--color-error); }

.auth-contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--edu-blue-50, #EFF6FF);
  color: var(--edu-blue-700, #0A4A85);
  font-size: 13px;
  font-weight: 700;
  margin: 0 auto 4px;
}

.auth-resend {
  text-align: center;
  font-size: 12.5px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* ══ RESPONSIVE ══
   El corte diagonal (clip-path) solo tiene sentido con los paneles uno
   junto al otro, así que se desactiva por debajo de 760px. En móvil el
   panel de marca pasa a ser una "cabecera" centrada y generosa (no una
   franja apretada): el logo grande es el protagonista. */
@media (max-width: 760px) {
  .auth-card { flex-direction: column; border-radius: 22px; }
  .auth-card-brand {
    flex: 0 0 auto;
    width: 100%;
    clip-path: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 32px 22px 36px;
  }
  .auth-brand-content { flex-direction: column; align-items: center; gap: 14px; }
  .auth-brand-badge {
    width: 112px; height: 112px;
    padding: 12px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.32),
      0 0 0 10px rgba(255,255,255,0.06),
      0 12px 30px rgba(4,42,84,0.4);
  }
  .auth-brand-badge img { width: 86px; height: 86px; }
  .auth-brand-copy h2 { font-size: 1.2rem; margin: 0; }
  .auth-brand-copy h2::after { display: block; margin: 8px auto 6px; }
  .auth-brand-copy .auth-brand-tagline { display: block; font-size: 12.5px; }
  .auth-spark--3, .auth-spark--5 { display: none; }
  .auth-card-body {
    position: relative;
    margin-top: -16px;
    border-radius: 26px 26px 0 0;
    background: #fff;
    padding: 28px 22px 24px;
    max-height: none;
    overflow-y: visible;
  }
  .auth-form-head h1 { font-size: 1.6rem; }
  .auth-otp-digit { width: 38px; height: 46px; font-size: 18px; }
  .auth-otp-row { gap: 6px; }
}
@media (max-width: 380px) {
  .auth-otp-digit { width: 32px; height: 42px; font-size: 16px; }
  .auth-otp-row { gap: 5px; }
}

@media (max-height: 700px) {
  .auth-root { align-items: flex-start; padding-top: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-spinner { animation-duration: 1.4s; }
}
`;