// contenedor compartido de las páginas de auth: tarjeta de dos paneles (marca + formulario)
// con corte diagonal entre ambos; en móvil se aplana a una franja horizontal
import letras from "@/assets/img/letras.svg";
import circulo1 from "@/assets/img/circulos/circulo1.svg";
import circulo5 from "@/assets/img/circulos/circulo5.svg";
import circulo9 from "@/assets/img/circulos/circulo9.svg";

// solo 3 acentos decorativos: menos elementos, para que el logo sea el único foco
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

// mismo bloque en las 3 pantallas de auth; solo cambia brandTitle/brandTagline
function AuthBrandPanel({ brandTitle, brandTagline }) {
  return (
    <div className="auth-card-brand">
      <AuthBubbles />
      <div className="auth-brand-content">
        <div className="auth-brand-badge">
          <img src={letras} alt="Edumon" draggable={false} />
        </div>
        <div className="auth-brand-copy">
          <h2>{brandTitle}</h2>
          {brandTagline && <p className="auth-brand-tagline">{brandTagline}</p>}
        </div>
      </div>
    </div>
  );
}

// topAction: contenido opcional fuera de la tarjeta (ej. "Volver al inicio")
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

// estas pantallas viven fuera de .app-shell: el azul usa el token crudo --edu-blue-500,
// no --color-primary (que resolvería al morado de :root)
export const AUTH_CSS = `
.auth-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--edu-blue-50, #EFF6FF);
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

/* clip-path recorta un ángulo en el borde derecho: la tarjeta blanca de fondo
   se asoma por ese corte, creando la costura diagonal sin elementos extra en el DOM */
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
    radial-gradient(circle at 50% 40%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.09) 30%, transparent 60%),
    linear-gradient(155deg, var(--edu-blue-900, #042A54) 0%, var(--edu-blue-700, #084A8C) 48%, var(--edu-blue-500, #0C6AC4) 100%);
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
  width: 135px;
  height: 135px;
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
.auth-form-head { margin-bottom: 20px; text-align: center; }

.auth-form-head h1 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.auth-form-head p {
  font-size: 13.5px;
  color: var(--color-text-muted);
  margin: 0;
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

/* ══ FORM ══ */
.auth-form { display: flex; flex-direction: column; gap: 14px; }

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
  background: var(--edu-blue-500, #0C6AC4);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(12,106,196,0.25);
  transition: background 150ms ease, transform 100ms ease, box-shadow 100ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.auth-submit:hover:not(:disabled) {
  background: var(--edu-blue-600, #0958A5);
  box-shadow: 0 4px 14px rgba(12,106,196,0.32);
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

/* clip-path solo tiene sentido con los paneles lado a lado; se desactiva bajo 760px */
@media (max-width: 760px) {
  .auth-card { flex-direction: column; }
  .auth-card-brand {
    flex: 0 0 auto;
    width: 100%;
    clip-path: none;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    padding: 20px 22px;
  }
  .auth-brand-content { flex-direction: row; align-items: center; gap: 16px; }
  .auth-brand-badge {
    width: 56px; height: 56px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.18);
  }
  .auth-brand-badge img { width: 50px; height: 50px; }
  .auth-brand-copy h2 { font-size: 1.05rem; margin: 0; }
  .auth-brand-copy h2::after { display: none; }
  .auth-brand-copy .auth-brand-tagline { display: none; }
  .auth-card-body { padding: 26px 22px 24px; max-height: none; overflow-y: visible; }
  .auth-form-head h1 { font-size: 1.25rem; }
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