import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { buzonEnviar } from "@/features/buzon/services/buzonService";
import { normalizePhone } from "@/utils/normalizePhone";
import logo from "@/assets/icons/logo.svg";
import edumonLetras from "@/assets/img/letras.svg";
import mascota from "@/assets/img/cuerpocompleto.svg";
import letras from "@/assets/img/letras.svg";
import soporte from "@/assets/img/Buzonsoporte.svg";

/* ─── Burbujas decorativas (assets reales) ─── */
import circulo1 from "@/assets/img/circulos/circulo1.svg";
import circulo2 from "@/assets/img/circulos/circulo2.svg";
import circulo3 from "@/assets/img/circulos/circulo3.svg";
import circulo4 from "@/assets/img/circulos/circulo4.svg";
import circulo5 from "@/assets/img/circulos/circulo5.svg";
import circulo6 from "@/assets/img/circulos/circulo6.svg";
import circulo7 from "@/assets/img/circulos/circulo7.svg";
import circulo8 from "@/assets/img/circulos/circulo8.svg";
import circulo9 from "@/assets/img/circulos/circulo9.svg";
import circulo10 from "@/assets/img/circulos/circulo10.svg";
import circulo11 from "@/assets/img/circulos/circulo11.svg";
import circulo12 from "@/assets/img/circulos/circulo12.svg";

import "./LandingPage.css";

const CIRCULOS = [
  circulo1, circulo2, circulo3, circulo4, circulo5, circulo6,
  circulo7, circulo8, circulo9, circulo10, circulo11, circulo12,
];

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

/* ─── Iconos de los módulos de aprendizaje ─── */
const IconApple = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.5c-3.5 0-6.5 2.7-6.5 7.3 0 4 2.7 8.2 5.5 8.2 1 0 1.5-.5 2-.5s1 .5 2 .5c2.3 0 4-2.8 5-5.6" />
    <path d="M12 6.5c0-2.1 1.6-3.8 3.7-3.8" />
    <path d="M15.3 9.3c2.1 0 3.9 2 3.9 4.7" />
  </svg>
);

const IconHeartHandshake = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 7c-1.3-1.9-3.7-2.5-5.6-1.2C4.6 7 3.8 9.7 5.2 11.8L12 19l6.8-7.2c1.4-2.1.6-4.8-1.4-6.1C15.5 4.5 13.3 5.1 12 7z" />
    <path d="M8 12.5l2 2 2-2 2 2" />
  </svg>
);

const IconSmile = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const IconShieldCheck = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconMessageCircle = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-1L3 21l2-4.5a8.4 8.4 0 01-1-4A8.5 8.5 0 0112.5 3 8.5 8.5 0 0121 11.5z" />
  </svg>
);

const IconSprout = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21V10" />
    <path d="M12 10C12 6 9 4 5 4c0 4 2 7 7 7z" />
    <path d="M12 10c0-3.5 2.5-5 6-5 0 3.5-1.5 6.5-6 6.5" />
  </svg>
);

const IconRepeat = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);

const IconPuzzle = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h3.3a1.5 1.5 0 000-3H7V3h4v1.3a1.5 1.5 0 003 0V3h4v4h-1.3a1.5 1.5 0 000 3H20v4h-1.3a1.5 1.5 0 000 3H20v4h-4v-1.3a1.5 1.5 0 00-3 0V21H9v-1.3a1.5 1.5 0 00-3 0V21H4v-4h1.3a1.5 1.5 0 000-3H4z" />
  </svg>
);

const IconCompass = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polygon points="15 9 13 13 9 15 11 11 15 9" />
  </svg>
);

const IconSmartphone = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

/* ── Datos ── */
const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Pilares", href: "#pilares" },
  { label: "Aprende", href: "#aprende" },
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

const MODULOS = [
  { icon: <IconApple />, color: "#16a34a", title: "Alimentación saludable", desc: "Ideas simples para que las comidas en casa sean más sanas y menos peleas." },
  { icon: <IconHeartHandshake />, color: "#7c3aed", title: "Crianza respetuosa", desc: "Acompañar el crecimiento de tu hijo respetando su ritmo y su voz." },
  { icon: <IconSmile />, color: "#f59e0b", title: "Manejo de emociones", desc: "Cómo entender y acompañar lo que siente tu hijo, incluso en las rabietas." },
  { icon: <IconShieldCheck />, color: "#06b6d4", title: "Límites saludables", desc: "Poner reglas claras sin gritos, con cariño y firmeza al mismo tiempo." },
  { icon: <IconMessageCircle />, color: "#db2777", title: "Comunicación familiar", desc: "Conversaciones que abren confianza en vez de cerrarla." },
  { icon: <IconSprout />, color: "#16a34a", title: "Desarrollo infantil", desc: "Entender qué es esperable en cada etapa para acompañar mejor." },
  { icon: <IconRepeat />, color: "#f59e0b", title: "Hábitos y rutinas", desc: "Rutinas simples que le dan estructura y seguridad al día a día." },
  { icon: <IconUsers size={24} />, color: "#7c3aed", title: "Tiempo de calidad", desc: "Momentos cortos y significativos que fortalecen el vínculo." },
  { icon: <IconPuzzle />, color: "#06b6d4", title: "Resolución de conflictos", desc: "Herramientas para resolver peleas y desacuerdos sin gritos." },
  { icon: <IconCompass />, color: "#db2777", title: "Autonomía", desc: "Ayudar a tu hijo a ganar independencia con confianza y sin miedo." },
  { icon: <IconSmartphone />, color: "#16a34a", title: "Tecnología con medida", desc: "Acuerdos sanos sobre pantallas, sin pelear todos los días por eso." },
];

/* ── Config de burbujas decorativas por sección ──
   circulo: índice 1-12 del asset (src/assets/img/circulos/circuloN.svg)
   anim: variante de animación flotante (a | b | c)
   Todas usan position absolute dentro de un contenedor .deco-bubbles */
const HERO_BUBBLES = [
  { circulo: 1, top: "4%", left: "1%", size: "150px", opacity: 0.9, anim: "a", delay: "0s" },
  { circulo: 4, top: "12%", left: "20%", size: "52px", opacity: 0.7, anim: "b", delay: "1.1s" },
  { circulo: 7, bottom: "8%", left: "6%", size: "100px", opacity: 0.85, anim: "c", delay: "0.5s" },
  { circulo: 9, top: "36%", left: "42%", size: "34px", opacity: 0.5, anim: "a", delay: "2s" },
  { circulo: 2, top: "6%", right: "4%", size: "90px", opacity: 0.85, anim: "b", delay: "0.3s" },
  { circulo: 10, top: "26%", right: "18%", size: "48px", opacity: 0.6, anim: "c", delay: "1.5s" },
  { circulo: 5, bottom: "4%", right: "3%", size: "130px", opacity: 0.9, anim: "a", delay: "0.8s" },
  { circulo: 12, bottom: "22%", right: "22%", size: "38px", opacity: 0.55, anim: "b", delay: "1.8s" },
];

const PILARES_BUBBLES = [
  { circulo: 3, top: "0%", left: "3%", size: "80px", opacity: 0.5, anim: "a", delay: "0.2s" },
  { circulo: 6, top: "55%", left: "-2%", size: "60px", opacity: 0.4, anim: "b", delay: "1.3s" },
  { circulo: 8, top: "8%", right: "5%", size: "70px", opacity: 0.5, anim: "c", delay: "0.6s" },
  { circulo: 11, bottom: "0%", right: "10%", size: "56px", opacity: 0.45, anim: "a", delay: "1.9s" },
  { circulo: 2, bottom: "12%", left: "20%", size: "36px", opacity: 0.35, anim: "b", delay: "0.9s" },
];

const APRENDE_BUBBLES = [
  { circulo: 9, top: "2%", left: "2%", size: "64px", opacity: 0.45, anim: "b", delay: "0.4s" },
  { circulo: 4, bottom: "6%", left: "8%", size: "44px", opacity: 0.4, anim: "a", delay: "1.6s" },
  { circulo: 12, top: "10%", right: "3%", size: "58px", opacity: 0.45, anim: "c", delay: "1s" },
  { circulo: 7, bottom: "2%", right: "6%", size: "80px", opacity: 0.5, anim: "b", delay: "0.2s" },
  { circulo: 1, top: "50%", right: "1%", size: "30px", opacity: 0.35, anim: "a", delay: "2.1s" },
];

const QUIENES_BUBBLES = [
  { circulo: 5, top: "6%", right: "2%", size: "110px", opacity: 0.5, anim: "a", delay: "0s" },
  { circulo: 8, bottom: "6%", left: "3%", size: "70px", opacity: 0.5, anim: "b", delay: "1.2s" },
  { circulo: 3, top: "40%", left: "-3%", size: "44px", opacity: 0.4, anim: "c", delay: "0.7s" },
  { circulo: 10, bottom: "18%", right: "20%", size: "50px", opacity: 0.4, anim: "a", delay: "1.7s" },
  { circulo: 6, top: "12%", left: "34%", size: "34px", opacity: 0.35, anim: "b", delay: "2.2s" },
  { circulo: 11, bottom: "0%", right: "38%", size: "40px", opacity: 0.35, anim: "c", delay: "1.4s" },
];

const CONTACTO_BUBBLES = [
  { circulo: 2, top: "2%", left: "0%", size: "90px", opacity: 0.4, anim: "a", delay: "0.3s" },
  { circulo: 12, bottom: "4%", left: "16%", size: "50px", opacity: 0.4, anim: "b", delay: "1.5s" },
  { circulo: 4, top: "16%", right: "2%", size: "66px", opacity: 0.4, anim: "c", delay: "0.9s" },
  { circulo: 9, bottom: "10%", right: "10%", size: "40px", opacity: 0.35, anim: "a", delay: "2s" },
  { circulo: 7, top: "60%", left: "4%", size: "36px", opacity: 0.3, anim: "b", delay: "1.1s" },
  { circulo: 1, bottom: "40%", right: "0%", size: "56px", opacity: 0.35, anim: "c", delay: "0.5s" },
];

const FOOTER_BUBBLES = [
  { circulo: 6, top: "4%", left: "4%", size: "60px", opacity: 0.18, anim: "a", delay: "0.4s" },
  { circulo: 10, bottom: "8%", left: "18%", size: "40px", opacity: 0.15, anim: "b", delay: "1.3s" },
  { circulo: 3, top: "10%", right: "6%", size: "70px", opacity: 0.18, anim: "c", delay: "0.8s" },
  { circulo: 8, bottom: "4%", right: "16%", size: "46px", opacity: 0.15, anim: "a", delay: "1.9s" },
];

/* ── Componente de burbujas decorativas reutilizable ── */
function DecoBubbles({ items, className = "" }) {
  return (
    <div className={`deco-bubbles ${className}`} aria-hidden="true">
      {items.map((b, i) => (
        <img
          key={i}
          src={CIRCULOS[b.circulo - 1]}
          alt=""
          draggable={false}
          className={`deco-bubble deco-bubble--${b.anim ?? "a"}`}
          style={{
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            width: b.size,
            opacity: b.opacity ?? 1,
            animationDelay: b.delay ?? "0s",
          }}
        />
      ))}
    </div>
  );
}

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

/* ── Tarjeta individual del carrusel ── */
function ModuloCard({ m }) {
  return (
    <article className="modulo-card">
      <div className="modulo-card__bar" style={{ background: m.color }} />
      <div className="modulo-card__body">
        <div
          className="modulo-card__icon"
          style={{ background: `${m.color}1f`, color: m.color }}
        >
          {m.icon}
        </div>
        <h3 className="modulo-card__title">{m.title}</h3>
        <p className="modulo-card__desc">{m.desc}</p>
      </div>
    </article>
  );
}

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/* Hook: calcula, para cada slide, su distancia (en fracción de
   "snap") respecto al punto de scroll actual. Es el patrón oficial
   de Embla para animar scale/opacity en función del scroll, sin
   tocar `left`/`width` (todo vía transform, barato para el GPU). */
function useEmblaTween(emblaApi) {
  const [tweenValues, setTweenValues] = useState([]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = emblaApi.scrollProgress();
    const snaps = emblaApi.scrollSnapList();
    setTweenValues(snaps.map((snap) => snap - progress));
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll();
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);
    return () => {
      emblaApi.off("scroll", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll]);

  return tweenValues;
}

/* ── Carrusel de módulos ("Featured Cards") ──
   La tarjeta activa queda centrada a escala completa; las vecinas
   se asoman parcialmente, más pequeñas y atenuadas. Construido
   sobre Embla Carousel: el motor resuelve el snap/drag/swipe/touch,
   nosotros solo mapeamos su progreso de scroll a scale/opacity. */
function ModuloCarousel() {
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  const autoplay = useRef(
    Autoplay({
      delay: 5000,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      playOnInit: !reduceMotion.current,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "center", loop: false, skipSnaps: false },
    [autoplay.current]
  );

  const tweenValues = useEmblaTween(emblaApi);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  const onViewportKeyDown = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); scrollPrev(); }
    if (e.key === "ArrowRight") { e.preventDefault(); scrollNext(); }
  };

  return (
    <div className="modulo-embla">
      <div
        className="modulo-embla__viewport"
        ref={emblaRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Módulos de aprendizaje"
        onKeyDown={onViewportKeyDown}
      >
        <div className="modulo-embla__container">
          {MODULOS.map((m, i) => {
            const diff = tweenValues[i] ?? 0;
            const scale = clamp(1 - Math.abs(diff) * 0.24, 0.82, 1);
            const opacity = clamp(1 - Math.abs(diff) * 0.65, 0.4, 1);
            const isActive = i === selectedIndex;
            return (
              <div
                className="modulo-embla__slide"
                key={m.title}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${MODULOS.length}: ${m.title}`}
              >
                <div
                  className={`modulo-embla__slide__inner ${isActive ? "is-active" : ""}`}
                  style={{ transform: `scale(${scale})`, opacity }}
                  onClick={() => { if (!isActive) scrollTo(i); }}
                  tabIndex={isActive ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!isActive && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      scrollTo(i);
                    }
                  }}
                >
                  <ModuloCard m={m} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="modulo-embla__arrow modulo-embla__arrow--prev"
        onClick={scrollPrev}
        disabled={!canPrev}
        aria-label="Módulo anterior"
      >
        <IconChevronLeft size={20} />
      </button>
      <button
        type="button"
        className="modulo-embla__arrow modulo-embla__arrow--next"
        onClick={scrollNext}
        disabled={!canNext}
        aria-label="Siguiente módulo"
      >
        <IconChevronRight size={20} />
      </button>

      <div className="modulo-embla__dots" role="tablist" aria-label="Selecciona un módulo">
        {MODULOS.map((m, i) => (
          <button
            type="button"
            key={m.title}
            role="tab"
            aria-selected={i === selectedIndex}
            aria-label={`Ir al módulo ${i + 1}: ${m.title}`}
            className={`modulo-embla__dot ${i === selectedIndex ? "is-active" : ""}`}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [formData, setFormData] = useState({
    nombre: "", correo: "", telefono: "", institucion: "", mensaje: "",
  });
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, loading, navigate]);

  const heroRef = useRef(null);
  const pilaresRef = useRef(null);
  const aprendeRef = useRef(null);
  const quienesRef = useRef(null);
  const contactoRef = useRef(null);

  const pilaresVis = useIntersect(pilaresRef);
  const aprendeVis = useIntersect(aprendeRef);
  const quienesVis = useIntersect(quienesRef);
  const contactoVis = useIntersect(contactoRef);

  useEffect(() => {
    const sections = ["inicio", "pilares", "aprende", "quienes", "contacto"];
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

      <section id="inicio" className="landing-hero" ref={heroRef}>
        <DecoBubbles items={HERO_BUBBLES} />

        <div className="landing-hero__content-row">
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

          <div className="edumon-mascot-visual" aria-hidden="true">
            <div className="edumon-mascot-ring" />
            <img
              src={mascota}
              alt="Mascota Edumon"
              className="edumon-mascot-img"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section
        id="pilares"
        className="landing-pilares"
        ref={pilaresRef}
        style={{ opacity: pilaresVis ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        <DecoBubbles items={PILARES_BUBBLES} />

        <div className="pilares-content">
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
        </div>
      </section>

      <section
        id="aprende"
        className="landing-aprende"
        ref={aprendeRef}
        style={{ opacity: aprendeVis ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}
      >
        <DecoBubbles items={APRENDE_BUBBLES} />

        <div className="aprende-content">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto", padding: "0 1.5rem 8px" }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed",
                textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10,
              }}
            >
              <IconSparkles size={13} />
              Módulos de aprendizaje
            </div>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
              ¿Qué podrás aprender en Edumon?
            </h2>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "#64748b", margin: 0 }}>
              Cada módulo trae retos prácticos para aplicar con tus hijos desde
              el primer día — nada de teoría complicada.
            </p>
          </div>

          <ModuloCarousel />
        </div>
      </section>

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
        <DecoBubbles items={QUIENES_BUBBLES} />

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
        <DecoBubbles items={CONTACTO_BUBBLES} />

        <div className="landing-contacto">

          <div className="contacto-left">

            <div className="contacto-left__badge">
              <IconStar size={13} />
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
              Nuestro equipo acompaña a cada institución durante todo el proceso de
              implementación. Te ayudamos con la configuración, capacitación y soporte
              continuo para que comiences rápidamente.
            </p>

            <div className="contacto-beneficios">
              <div className="beneficio"><span>✓</span> Implementación guiada</div>
              <div className="beneficio"><span>✓</span> Capacitación para docentes</div>
              <div className="beneficio"><span>✓</span> Soporte continuo</div>
            </div>

            <div className="contacto-left__img-wrap">

              <img
                src={soporte}
                alt="Buzón de soporte Edumon"
                className="contacto-left__letras"
              />

            </div>

          </div>

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

      <footer className="landing-footer">
        <DecoBubbles items={FOOTER_BUBBLES} />

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