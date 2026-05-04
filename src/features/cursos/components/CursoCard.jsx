// src/features/cursos/components/CursoCard.jsx
// ENTRY POINT navegable del sistema de cursos.
// ─────────────────────────────────────────────
// Props:
//   curso      — objeto normalizado (normalizeCurso)
//   role       — rol del usuario ("docente" | "padre" | "estudiante" | "admin")
//   idx        — índice para paleta de colores (default 0)
//   onClick    — override del click global (opcional; por defecto navega a /cursos/:id)
//   coverSrc   — URL de la imagen de portada (opcional)
//   showCover  — mostrar área de imagen (default false)
//   compact    — modo compacto sin acciones (default false)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ClipboardList, CheckSquare,
  TrendingUp, Users, ArrowUpRight,
} from "lucide-react";
import { getCourseActionsByRole, getCourseMainPath } from "../utils/courseActions";
import { Button } from "@/components";

// ── Paleta de colores por índice ──────────────────────────────────────────────
const PALETTE = [
  { bg: "#EFF6FF", border: "#BFDBFE", accent: "#1D4ED8", strip: "#0C6AC4" },
  { bg: "#F0FDF4", border: "#BBF7D0", accent: "#166534", strip: "#16A34A" },
  { bg: "#FAF5FF", border: "#DDD6FE", accent: "#5B21B6", strip: "#7C3AED" },
  { bg: "#FFF7ED", border: "#FED7AA", accent: "#9A3412", strip: "#EA580C" },
  { bg: "#F0F9FF", border: "#BAE6FD", accent: "#075985", strip: "#0284C7" },
  { bg: "#FDF4FF", border: "#F0ABFC", accent: "#7E22CE", strip: "#A21CAF" },
  { bg: "#FFFBEB", border: "#FDE68A", accent: "#92400E", strip: "#D97706" },
  { bg: "#FFF1F2", border: "#FECDD3", accent: "#9F1239", strip: "#E11D48" },
];
const palette = (i) => PALETTE[i % PALETTE.length];

// ── Mapa icono → componente ───────────────────────────────────────────────────
const ICON_MAP = {
  BookOpen,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  Users,
};

// ── Botón de acción rápida ────────────────────────────────────────────────────
function ActionBtn({ action, accent, onNavigate }) {
  const Icon = ICON_MAP[action.icon] ?? BookOpen;

  const variantStyles = {
    primary: { background: accent, color: "#fff" },
    outline: { background: "transparent", color: accent, border: `1.5px solid ${accent}55` },
    ghost:   { color: "var(--color-text-muted)", border: "1px solid var(--color-border)" },
  };

  return (
    <Button
      variant="custom"
      size="xs"
      onClick={(e) => { e.stopPropagation(); onNavigate(action.path); }}
      style={variantStyles[action.variant]}
      aria-label={action.label}
    >
      <Icon style={{ width: 12, height: 12 }} />
      {action.label}
    </Button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CursoCard({
  curso,
  role      = "docente",
  idx       = 0,
  onClick   = null,
  coverSrc  = null,
  showCover = false,
  compact   = false,
}) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const cc      = palette(idx);
  const actions = compact ? [] : getCourseActionsByRole(role, curso._id ?? curso.id);
  const mainPath = getCourseMainPath(curso._id ?? curso.id);

  const handleCardClick = () => {
    if (onClick) { onClick(); return; }
    navigate(mainPath);
  };

  const handleNavigate = (path) => navigate(path);

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(); }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir curso: ${curso.nombre}`}
      style={{
        background:    "var(--color-surface)",
        borderRadius:  16,
        border:        `1px solid ${hov ? cc.border : "var(--color-border)"}`,
        boxShadow:     hov ? "var(--shadow-md)" : "var(--shadow-card)",
        cursor:        "pointer",
        transition:    "all 200ms ease",
        transform:     hov ? "translateY(-3px)" : "translateY(0)",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Franja de color superior (siempre visible) ── */}
      <div style={{
        height:     4,
        background: cc.strip,
        flexShrink: 0,
      }} />

      {/* ── Portada opcional ── */}
      {showCover && (
        <div style={{
          height:          96,
          overflow:        "hidden",
          background:      cc.bg,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          flexShrink:      0,
        }}>
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={curso.nombre ?? "Curso"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.objectFit = "contain";
                e.target.style.padding   = "12px";
                e.target.style.opacity   = "0.4";
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width:           40,
              height:          40,
              borderRadius:    10,
              background:      `${cc.strip}20`,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}>
              <BookOpen style={{ width: 18, height: 18, color: cc.strip }} />
            </div>
          )}
        </div>
      )}

      {/* ── Cuerpo ── */}
      <div style={{
        padding:       showCover ? "12px 16px 14px" : "16px 16px 14px",
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        gap:           0,
      }}>

        {/* Nombre */}
        <h3 style={{
          fontSize:             14,
          fontWeight:           700,
          color:                "var(--color-text)",
          lineHeight:           1.35,
          margin:               0,
          display:              "-webkit-box",
          WebkitLineClamp:      2,
          WebkitBoxOrient:      "vertical",
          overflow:             "hidden",
        }}>
          {curso.nombre}
        </h3>

        {/* Descripción */}
        {curso.descripcion && (
          <p style={{
            fontSize:             12,
            color:                "var(--color-text-muted)",
            marginTop:            6,
            lineHeight:           1.5,
            display:              "-webkit-box",
            WebkitLineClamp:      2,
            WebkitBoxOrient:      "vertical",
            overflow:             "hidden",
          }}>
            {curso.descripcion}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 8 }} />

        {/* ── Footer: participantes + flecha ── */}
        <div style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          paddingTop:      10,
          borderTop:       "1px solid var(--color-border)",
          marginTop:       10,
        }}>
          <span style={{
            display:    "flex",
            alignItems: "center",
            gap:        4,
            fontSize:   11.5,
            color:      "var(--color-text-muted)",
          }}>
            <Users style={{ width: 11, height: 11 }} />
            {curso.participantes?.length ?? curso.totalParticipantes ?? 0}
            {" "}
            {role === "padre" ? "participantes" : "alumnos"}
          </span>
          <ArrowUpRight style={{ width: 14, height: 14, color: cc.strip, opacity: hov ? 1 : 0.5, transition: "opacity 200ms" }} />
        </div>

        {/* ── Acciones por rol ── */}
        {!compact && actions.length > 0 && (
          <div
            style={{
              display:        "flex",
              flexWrap:       "wrap",
              gap:            6,
              marginTop:      12,
              paddingTop:     10,
              borderTop:      "1px solid var(--color-border)",
            }}
            // Evita que el click en acciones propague al artículo
            onClick={(e) => e.stopPropagation()}
          >
            {[...actions]
              .sort((a, b) => a.order - b.order)
              .map((action) => (
                <ActionBtn
                  key={action.key}
                  action={action}
                  accent={cc.strip}
                  onNavigate={handleNavigate}
                />
              ))
            }
          </div>
        )}
      </div>
    </article>
  );
}

// ── Utilidad de color ─────────────────────────────────────────────────────────
function shadeDown(hex) {
  // oscurece un color hex ~15%
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - 30);
  const g = Math.max(0, ((n >> 8) & 0xff) - 30);
  const b = Math.max(0, (n & 0xff) - 30);
  return `rgb(${r},${g},${b})`;
}