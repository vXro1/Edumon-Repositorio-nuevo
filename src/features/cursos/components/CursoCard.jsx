// src/features/cursos/components/CursoCard.jsx
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ClipboardList, CheckSquare,
  TrendingUp, Users, ChevronRight,
} from "lucide-react";
import { getCourseActionsByRole, getCourseMainPath } from "../utils/courseActions";
import { Button } from "@/components";
import letrasImg from "@/assets/img/letras.svg"; // fallback para cursos sin portada

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const DEFAULT_COLOR = "var(--color-primary)"; // mismo fallback usado en CursosPage / CursoContext

const ICON_MAP = { BookOpen, ClipboardList, CheckSquare, TrendingUp, Users };

/* ── Botón de acción rápida ─────────────────────────────────────── */
function ActionBtn({ action, onNavigate }) {
  const Icon = ICON_MAP[action.icon] ?? BookOpen;
  const variantMap = { primary: "primary", outline: "outline-neutral", ghost: "ghost" };
  return (
    <Button
      variant={variantMap[action.variant] ?? "outline-neutral"}
      size="xs"
      onClick={e => { e.stopPropagation(); onNavigate(action.path); }}
      leftIcon={<Icon style={{ width: 12, height: 12 }} />}
      aria-label={action.label}
    >
      {action.label}
    </Button>
  );
}

/* ── CursoCard ──────────────────────────────────────────────────── */
export default memo(function CursoCard({
  curso,
  role      = "docente",
  idx       = 0,
  onClick   = null,
  compact   = false,
}) {
  const navigate = useNavigate();

  // Color determinado por el usuario en backend, con fallback consistente
  const cursoColor = HEX_RE.test(curso?.color || "") ? curso.color : DEFAULT_COLOR;

  // Imagen del curso — siempre presente: portada real o fallback por defecto
  const coverSrc = curso?.fotoPortada || curso?.fotoPortadaUrl || curso?.imagen || letrasImg;

  const actions  = compact ? [] : getCourseActionsByRole(role, curso._id ?? curso.id);
  const mainPath = getCourseMainPath(curso._id ?? curso.id);

  const handleCardClick = () => { if (onClick) { onClick(); return; } navigate(mainPath); };
  const handleNavigate  = (path) => navigate(path);

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir curso: ${curso.nombre}`}
      className="curso-card curso-card--square"
      style={{
        "--cc-color": cursoColor,
        aspectRatio: "1 / 1",
        border: `2px solid ${cursoColor}`,
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--color-surface)",
        transition: "transform 0.14s ease, box-shadow 0.14s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 14px color-mix(in srgb, ${cursoColor} 30%, transparent)`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Imagen de portada — siempre visible, con fallback */}
      <div style={{
        width: "100%",
        aspectRatio: "16 / 9",
        flexShrink: 0,
        background: "var(--color-bg)",
        overflow: "hidden",
      }}>
        <img
          src={coverSrc}
          alt={curso.nombre ?? "Curso"}
          loading="lazy"
          onError={e => { e.target.onerror = null; e.target.src = letrasImg; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Cuerpo */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "12px 14px",
        minHeight: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            background: cursoColor,
          }} />
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {curso.nombre}
          </h3>
        </div>

        {curso.descripcion && (
          <p style={{
            fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 8px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {curso.descripcion}
          </p>
        )}

        <div style={{ flex: 1, minHeight: 4 }} />

        {/* Meta del pie */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11.5, color: "var(--color-text-muted)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={11} aria-hidden="true" />
            {curso.participantes?.length ?? curso.totalParticipantes ?? 0}
            {" "}{role === "padre" ? "participantes" : "alumnos"}
          </span>
          {/* Antes era solo una flecha diagonal (ArrowUpRight): un ícono sin
              texto no le dice a un usuario adulto que la tarjeta se puede
              abrir. "Ver curso" dice exactamente qué pasa al hacer clic. */}
          <span style={{
            display: "flex", alignItems: "center", gap: 2,
            fontSize: 11.5, fontWeight: 700, color: cursoColor,
          }}>
            Ver curso
            <ChevronRight size={13} aria-hidden="true" />
          </span>
        </div>

        {/* Acciones rápidas */}
        {!compact && actions.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}
            onClick={e => e.stopPropagation()}
          >
            {[...actions]
              .sort((a, b) => a.order - b.order)
              .map(action => (
                <ActionBtn key={action.key} action={action} onNavigate={handleNavigate} />
              ))}
          </div>
        )}
      </div>
    </article>
  );
});