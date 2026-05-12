import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buzonEnviar } from "@/lib/apiClient";
import { normalizePhone } from "@/utils/normalizePhone";
import logo from "@/assets/icons/logo.svg";
import edumonLetras from "@/assets/img/edumonletras.svg";
import mascota from "@/assets/img/edumoncuerpocompleto.png";
import avatar1 from "@/assets/img/avatars/avatar1.svg";
import avatar2 from "@/assets/img/avatars/avatar2.svg";
import avatar3 from "@/assets/img/avatars/avatar3.svg";
import avatar4 from "@/assets/img/avatars/avatar4.svg";
import avatar5 from "@/assets/img/avatars/avatar5.svg";
import letras from "@/assets/img/edumonletras.svg";

/* ─── Iconos SVG inline ─── */
const IconSparkles = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.88 5.76L20 10l-5.76 1.88L12 18l-1.88-5.76L4 10l5.76-1.88z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
  </svg>
);

const IconHome = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const IconUsers = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const IconAward = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M8.56 14.59L7 22l5-3 5 3-1.56-7.41" />
  </svg>
);

const IconArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconPlay = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconSend = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconMail = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2 4 12 13 22 4" />
  </svg>
);

const IconPhone = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
  </svg>
);

const IconMapPin = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconFacebook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const IconInstagram = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const IconBook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

const IconHeart = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconNavigation = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const IconShare = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconStar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconChevronLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ── Datos ── */
const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Pilares", href: "#pilares" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "Quiénes somos", href: "#quienes" },
  { label: "Contáctanos", href: "#contacto" },
];

const PILARES = [
  {
    icon: <IconHome size={40} />,
    title: "Formación integral en un solo espacio",
    desc: "Crea y asigna actividades sobre valores, bienestar emocional, convivencia familiar y prevención, todo desde un panel intuitivo. No solo académico, sino humano.",
  },
  {
    icon: <IconUsers size={40} />,
    title: "La familia como parte activa del aprendizaje",
    desc: "Los padres y tutores reciben notificaciones, entregan actividades y hacen seguimiento al proceso formativo de sus hijos en tiempo real, desde cualquier dispositivo.",
  },
  {
    icon: <IconAward size={40} />,
    title: "Motivación que se ve y se siente",
    desc: "Edumon gamifica el aprendizaje para mantener a estudiantes y familias comprometidos con su formación a través de recompensas y logros.",
  },
];

const TESTIMONIOS = [
  {
    name: "María González",
    role: "Mamá",
    text: "Edumon cambió completamente la manera en que me comunico con los docentes de mi hija. ¡Es increíble lo fácil que es!",
    institution: "Colegio San José",
    avatar: avatar1,
  },
  {
    name: "Carlos Herrera",
    role: "Docente de Primaria",
    text: "Por fin una plataforma pensada para docentes. Crear actividades formativas nunca fue tan sencillo.",
    institution: "Escuela Nacional Simón Bolívar",
    avatar: avatar2,
  },
  {
    name: "Ana Mejía",
    role: "Rectora",
    text: "Desde que migramos a Edumon, la satisfacción de padres y docentes aumentó notablemente. Una herramienta transformadora.",
    institution: "Institución Educativa Bolívar",
    avatar: avatar3,
  },
  {
    name: "Juan Pérez",
    role: "Padre de Familia",
    text: "Ahora puedo hacer seguimiento al proceso de mis hijos desde el celular. ¡Edumon es exactamente lo que necesitábamos!",
    institution: "Colegio Los Andes",
    avatar: avatar4,
  },
  {
    name: "Laura Torres",
    role: "Coordinadora Académica",
    text: "La implementación fue rápida y el equipo de Edumon estuvo siempre disponible. Los resultados han sido increíbles.",
    institution: "Colegio Santa María",
    avatar: avatar5,
  },
];

/* ── Intersection Observer hook ── */
function useIntersect(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [activeTestimonio, setActiveTestimonio] = useState(0);
  const [formData, setFormData] = useState({
    nombre: "", correo: "", telefono: "", institucion: "", mensaje: "",
  });
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  /* Refs para animaciones */
  const heroRef = useRef(null);
  const pilaresRef = useRef(null);
  const testimonRef = useRef(null);
  const quienesRef = useRef(null);
  const contactoRef = useRef(null);

  const pilaresVis = useIntersect(pilaresRef);
  const testimonVis = useIntersect(testimonRef);
  const quienesVis = useIntersect(quienesRef);
  const contactoVis = useIntersect(contactoRef);

  /* Helper índice circular para el carrusel */
  const tIdx = (i) => ((i % TESTIMONIOS.length) + TESTIMONIOS.length) % TESTIMONIOS.length;

  /* Actualiza sección activa al hacer scroll */
  useEffect(() => {
    const sections = ["inicio", "pilares", "testimonios", "quienes", "contacto"];
    const handler = () => {
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleNav = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus("idle");
    setSubmitError("");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSubmitStatus("loading");
    setSubmitError("");
    try {
      const payload = {
        ...formData,
        telefono: normalizePhone(formData.telefono) ?? formData.telefono,
      };
      await buzonEnviar(payload);
      setSubmitStatus("success");
      setFormData({ nombre: "", correo: "", telefono: "", institucion: "", mensaje: "" });
    } catch (err) {
      setSubmitStatus("error");
      if (err.validationErrors?.length) {
        const FIELD_LABELS = {
          nombre: "Nombre", correo: "Correo",
          telefono: "Teléfono", mensaje: "Mensaje",
        };
        const msgs = err.validationErrors.map(
          (ve) => `${FIELD_LABELS[ve.path] ?? ve.path}: ${ve.msg}`
        );
        setSubmitError(msgs.join(" · "));
      } else {
        setSubmitError(err.message || "No se pudo enviar el mensaje. Intenta de nuevo.");
      }
    }
  };

  return (
    <div className="landing">

      {/* ── NAVBAR ── */}
      <header className="landing-header">
        <nav className="landing-nav">
          <a href="#inicio" className="landing-nav__logo" onClick={(e) => handleNav(e, "#inicio")}>
            <img src={logo} alt="Edumon logo" />
            <span className="landing-nav__wordmark">edu<span>mon</span></span>
          </a>

          <ul className="landing-nav__links">
            {NAV_LINKS.map((l, index) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => handleNav(e, l.href)}
                  className={`${activeSection === l.href.replace("#", "") ? "active" : ""} nav-color-${index + 1}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <button className="landing-nav__cta" onClick={() => navigate("/login")}>
            <IconBook size={16} />
            Inicio de sesión
          </button>

          <button
            className="landing-nav__hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          </button>
        </nav>

        <div className={`landing-nav__mobile-menu ${menuOpen ? "open" : ""}`}>
          {NAV_LINKS.map((l, index) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => { handleNav(e, l.href); setMenuOpen(false); }}
              className={`nav-color-${index + 1}`}
            >
              {l.label}
            </a>
          ))}
          <button
            className="landing-nav__mobile-cta"
            onClick={() => { navigate("/login"); setMenuOpen(false); }}
          >
            <IconBook size={16} />
            Inicio de sesión
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="inicio" className="landing-hero" ref={heroRef}>
        <div className="landing-bubbles" aria-hidden="true">
          <div className="bubble bubble--1" />
          <div className="bubble bubble--2" />
          <div className="bubble bubble--3" />
        </div>

        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <IconSparkles size={13} />
            Plataforma educativa integral · Colombia 2026
          </div>

          <h1 className="landing-hero__title">
            Educación conectada,{" "}
            <span className="gradient-word">familias unidas</span>
          </h1>

          <p className="landing-hero__subtitle">
            Edumon es la plataforma que une a docentes, estudiantes y familias
            en un solo espacio para impulsar el desarrollo académico, emocional
            y social de cada niño.
          </p>

          <div className="landing-hero__actions">
            <a
              href="#contacto"
              className="landing-hero__btn-primary"
              onClick={(e) => handleNav(e, "#contacto")}
            >
              Quiero saber más <IconArrowRight size={16} />
            </a>
            <a
              href="#pilares"
              className="landing-hero__btn-secondary"
              onClick={(e) => handleNav(e, "#pilares")}
            >
              <IconPlay size={14} /> Ver cómo funciona
            </a>
          </div>
        </div>

        <div className="landing-hero__mascot-wrapper" aria-hidden="true">
          <div className="landing-hero__ring" />
          <img
            src={mascota}
            alt="Mascota Edumon"
            className="landing-hero__mascot"
            loading="eager"
          />
        </div>
      </section>

      {/* ── PILARES ── */}
      <section
        id="pilares"
        className="landing-pilares"
        ref={pilaresRef}
        style={{ opacity: pilaresVis ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        <div className="pilares-label">
          <IconSparkles size={13} />
          Características
        </div>

        <h2 className="pilares-title">
          Aprende de forma{" "}
          <span className="pilares-rainbow">integral</span>
        </h2>

        <div className="pilares-divider" />

        <p className="pilares-subtitle">
          Tres pilares que transforman la experiencia educativa
          de toda la comunidad escolar.
        </p>

        <div className="pilares-grid">
          {PILARES.map((p) => (
            <div className="pilar-card" key={p.title}>
              <div className="pilar-card__icon-circle">
                {p.icon}
              </div>
              <h3 className="pilar-card__title">{p.title}</h3>
              <p className="pilar-card__desc">{p.desc}</p>
              <div className="pilar-card__bar" />
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section
        id="testimonios"
        className="landing-testimonios"
        ref={testimonRef}
        style={{ opacity: testimonVis ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}
      >
        <div className="testimonios-header">
          <div className="testimonios-eyebrow">
            <IconSparkles size={13} />
            Lo que dicen de nosotros
          </div>
          <h2 className="testimonios-title">
            <span className="t-rainbow">T</span>ESTIMONIOS
          </h2>
        </div>

        <div className="testimonios-carousel">
          <div className="testimonios-track">

            {/* Card izquierda */}
            <div
              className="t-card t-card--prev"
              onClick={() => setActiveTestimonio(tIdx(activeTestimonio - 1))}
              aria-label="Ver testimonio anterior"
            >
              {(() => {
                const t = TESTIMONIOS[tIdx(activeTestimonio - 1)];
                return (
                  <>
                    <div className="t-card__avatar-wrap">
                      <div className="t-card__avatar-ring" />
                      <img src={t.avatar} alt={t.name} className="t-card__avatar" />
                      <div className="t-card__avatar-glow" />
                    </div>
                    <div className="t-card__name">{t.name}</div>
                    <span className="t-card__role">{t.role}</span>
                    <p className="t-card__text">{t.text}</p>
                    <div className="t-card__institution">{t.institution}</div>
                  </>
                );
              })()}
            </div>

            {/* Card central — activa */}
            <div className="t-card t-card--active">
              {(() => {
                const t = TESTIMONIOS[activeTestimonio];
                return (
                  <>
                    <div className="t-card__avatar-wrap">
                      <div className="t-card__avatar-ring" />
                      <img src={t.avatar} alt={t.name} className="t-card__avatar" />
                      <div className="t-card__avatar-glow" />
                    </div>
                    <div className="t-card__name">{t.name}</div>
                    <span className="t-card__role">{t.role}</span>
                    <p className="t-card__text">{t.text}</p>
                    <div className="t-card__sep" />
                    <div className="t-card__institution">{t.institution}</div>
                  </>
                );
              })()}
            </div>

            {/* Card derecha */}
            <div
              className="t-card t-card--next"
              onClick={() => setActiveTestimonio(tIdx(activeTestimonio + 1))}
              aria-label="Ver testimonio siguiente"
            >
              {(() => {
                const t = TESTIMONIOS[tIdx(activeTestimonio + 1)];
                return (
                  <>
                    <div className="t-card__avatar-wrap">
                      <div className="t-card__avatar-ring" />
                      <img src={t.avatar} alt={t.name} className="t-card__avatar" />
                      <div className="t-card__avatar-glow" />
                    </div>
                    <div className="t-card__name">{t.name}</div>
                    <span className="t-card__role">{t.role}</span>
                    <p className="t-card__text">{t.text}</p>
                    <div className="t-card__institution">{t.institution}</div>
                  </>
                );
              })()}
            </div>

          </div>
        </div>

        {/* Controles */}
        <div className="testimonios-controls">
          <button
            className="t-arrow"
            onClick={() => setActiveTestimonio(tIdx(activeTestimonio - 1))}
            aria-label="Anterior"
          >
            <IconChevronLeft size={18} />
          </button>

          <div className="t-dots">
            {TESTIMONIOS.map((_, i) => (
              <button
                key={i}
                className={`t-dot${i === activeTestimonio ? " t-dot--active" : ""}`}
                onClick={() => setActiveTestimonio(i)}
                aria-label={`Ir al testimonio ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="t-arrow"
            onClick={() => setActiveTestimonio(tIdx(activeTestimonio + 1))}
            aria-label="Siguiente"
          >
            <IconChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section
        id="quienes"
        className="landing-section--alt"
        ref={quienesRef}
        style={{
          opacity: quienesVis ? 1 : 0,
          transform: quienesVis ? "none" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="landing-bubbles" aria-hidden="true">
          <div className="bubble" style={{ width: 100, height: 100, top: "8%", right: "3%", background: "#e0e7ff" }} />
          <div className="bubble bubble--alt" style={{ width: 60, height: 60, bottom: "8%", left: "5%", background: "#fce7f3" }} />
        </div>

        <div className="landing-quienes">
          <div className="quienes-content">
            <div className="section-label">
              <IconSparkles size={14} />
              Quiénes somos
            </div>

            <h2 className="quienes-content__title">Nacimos en un aula</h2>
            <div className="quienes-content__sub">
              <span>pensando </span>
              <span>en </span>
              <span>todas </span>
              <span>las </span>
              <span>familias</span>
            </div>

            <p className="quienes-content__text">
              Edumon es un proyecto educativo desarrollado por dos estudiantes
              colombianos, con la convicción de que la tecnología puede fortalecer
              la relación entre escuela y familia.
            </p>
            <p className="quienes-content__text">
              Nació como proyecto de aula, pero creció con un propósito real:
              crear una plataforma integral que acompañe el desarrollo académico,
              emocional y social de los estudiantes, involucrando activamente a
              sus familias y docentes.
            </p>
            <p className="quienes-content__tagline">
              Hecho con esfuerzo, código y mucho amor por la educación.
            </p>
          </div>

          <div className="quienes-cards">
            <div className="quienes-member-card">
              <div style={{
                width: "100%", height: "clamp(90px,16vw,140px)", borderRadius: "10px",
                background: "linear-gradient(145deg,#fbcfe8,#fce7f3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "0.75rem", fontSize: "clamp(2rem,5vw,3rem)",
                fontWeight: 800, color: "#be185d",
                fontFamily: "var(--font-heading,'Poppins',sans-serif)",
              }}>
                VM
              </div>
              <div className="quienes-member-card__name">Veronica Mancilla</div>
              <span className="quienes-member-card__role">Diseñadora UX/UI</span>
            </div>

            <div className="quienes-member-card">
              <div style={{
                width: "100%", height: "clamp(90px,16vw,140px)", borderRadius: "10px",
                background: "linear-gradient(145deg,#bae6fd,#e0f2fe)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "0.75rem", fontSize: "clamp(2rem,5vw,3rem)",
                fontWeight: 800, color: "#0369a1",
                fontFamily: "var(--font-heading,'Poppins',sans-serif)",
              }}>
                BY
              </div>
              <div className="quienes-member-card__name">Bryan David Yepes</div>
              <span className="quienes-member-card__role">Desarrollador Backend</span>
            </div>
          </div>
        </div>
      </section>

{/* ════════════════════════════════════════
          CONTÁCTANOS
          ════════════════════════════════════════ */}
      <section
        id="contacto"
        ref={contactoRef}
        className="landing-contacto-section"
        style={{
          opacity: contactoVis ? 1 : 0,
          transform: contactoVis ? "none" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <div className="landing-contacto">

          {/* ── Columna izquierda ── */}
          <div className="contacto-left">

            <div className="contacto-left__badge">
              <IconStar size={12} />
              Instituciones educativas
            </div>

            <h2 className="contacto-left__title">
              ¿Tu institución quiere ser parte de{" "}
              <span className="highlight-1">E</span>
              <span className="highlight-2">d</span>
              <span className="highlight-3">u</span>
              mon?
            </h2>

            <p className="contacto-left__text">
              Trabajamos directamente con cada institución. Escríbenos y te
              acompañamos en todo el proceso de acceso y configuración.
            </p>

            {/* Imagen de letras Edumon */}
            <div className="contacto-left__img-wrap">
              <img
                src={letras}
                alt="Edumon"
                className="contacto-left__letras"
              />
            </div>

          </div>

          {/* ── Formulario ── */}
          <div className="contacto-form-card">
            <div className="contacto-form-card__title">Solicitar información</div>
            <div className="contacto-form-card__sub">
              Completa el formulario y te contactamos pronto.
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    id="nombre" name="nombre" type="text"
                    placeholder="Tu nombre"
                    value={formData.nombre} onChange={handleFormChange} required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="correo">Correo electrónico</label>
                  <input
                    id="correo" name="correo" type="email"
                    placeholder="correo@institución.edu"
                    value={formData.correo} onChange={handleFormChange} required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="telefono">Número de contacto</label>
                  <input
                    id="telefono" name="telefono" type="tel"
                    placeholder="300 000 0000"
                    value={formData.telefono} onChange={handleFormChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="institucion">Nombre de la institución</label>
                  <input
                    id="institucion" name="institucion" type="text"
                    placeholder="Colegio / Escuela"
                    value={formData.institucion} onChange={handleFormChange} required
                  />
                </div>
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="mensaje">¿Cómo podemos ayudarte?</label>
                <textarea
                  id="mensaje" name="mensaje" rows={4}
                  placeholder="Cuéntanos sobre tu institución y lo que necesitas..."
                  value={formData.mensaje} onChange={handleFormChange}
                />
              </div>

              <button
                type="submit"
                className="contacto-form-card__submit"
                disabled={submitStatus === "loading" || submitStatus === "success"}
                style={{
                  opacity: submitStatus === "loading" ? 0.7 : 1,
                  cursor: submitStatus === "loading" ? "wait" : undefined,
                }}
              >
                <IconSend size={15} />
                {submitStatus === "loading" ? "Enviando…" : "Enviar información"}
              </button>

              {submitStatus === "success" && (
                <p className="form-msg form-msg--ok">
                  ¡Mensaje enviado! Te contactaremos pronto.
                </p>
              )}
              {submitStatus === "error" && (
                <p className="form-msg form-msg--err">{submitError}</p>
              )}
            </form>

            <p className="contacto-form-card__privacy">
              Tu información es confidencial y nunca será compartida.
            </p>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer__grid">
          <div className="footer-brand">
            <div className="footer-brand__wordmark">
              <span>E</span><span>D</span><span>U</span>
              <span>M</span><span>O</span><span>N</span>
            </div>
            <p className="footer-brand__tagline">
              Educación conectada, <strong>familias unidas.</strong>
            </p>
            <div className="footer-brand__made">
              <IconHeart size={13} />
              Hecho con amor en Colombia
            </div>
            <div className="footer-brand__authors">
              Por Veronica Mancilla &amp; Bryan Yepes
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-col__title">
              <IconNavigation size={15} />
              Navegación
            </div>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={(e) => handleNav(e, l.href)}>
                    <IconArrowRight size={12} />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <div className="footer-col__title">
              <IconMail size={15} />
              Contacto
            </div>
            <div className="footer-contact-item">
              <IconMail size={15} />
              edumon@gmail.com
            </div>
            <div className="footer-contact-item">
              <IconPhone size={15} />
              +57 000 000 0000
            </div>
            <div className="footer-contact-item">
              <IconMapPin size={15} />
              Popayán, Cauca, Colombia
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-col__title">
              <IconShare size={15} />
              Redes sociales
            </div>
            <a href="#" className="footer-social-btn footer-social-btn--fb">
              <IconFacebook size={16} />
              Facebook
            </a>
            <a href="#" className="footer-social-btn footer-social-btn--ig">
              <IconInstagram size={16} />
              Instagram
            </a>
            <p className="footer-social-sub">
              Síguenos y mantente al día con las novedades de Edumon.
            </p>
          </div>
        </div>

        <div className="landing-footer__bottom">
          © 2026 Edumon. Todos los derechos reservados. Proyecto educativo sin fines de lucro.
        </div>
      </footer>

      {/* ── MODAL DE CONFIRMACIÓN ── */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 20, padding: "2rem",
            width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", gap: "1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IconSend size={18} color="#fff" />
              </div>
              <div>
                <h2 id="confirm-modal-title" style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111" }}>
                  Confirmar envío
                </h2>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Revisa tu información antes de enviar
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                { label: "Nombre", value: formData.nombre },
                { label: "Correo", value: formData.correo },
                { label: "Teléfono", value: normalizePhone(formData.telefono) ?? formData.telefono },
                { label: "Institución", value: formData.institucion || "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: 700, color: "#475569", minWidth: 90 }}>{label}:</span>
                  <span style={{ color: "#0f172a", wordBreak: "break-word" }}>{value}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.6rem", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Mensaje:</span>
                <span style={{ color: "#0f172a", lineHeight: 1.5, display: "block" }}>{formData.mensaje}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "0.6rem 1.25rem", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#475569", fontWeight: 600, fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Editar
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: "0.6rem 1.5rem", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: "#fff", fontWeight: 700, fontSize: "0.875rem",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <IconSend size={14} />
                Confirmar y enviar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}