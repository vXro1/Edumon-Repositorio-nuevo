// src/features/cursos/components/CursoCard.jsx
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ClipboardList, CheckSquare,
  TrendingUp, Users, ArrowUpRight,
} from "lucide-react";
import { getCourseActionsByRole, getCourseMainPath } from "../utils/courseActions";
import { Button } from "@/components";

/* ── Design-system palette (maps to CSS tokens) ─────────────────── */
const PALETTE = [
  { bg: "var(--edu-purple-50)", border: "var(--edu-purple-200)", strip: "var(--edu-purple-500)", color: "var(--edu-purple-700)" },
  { bg: "var(--edu-cyan-50)",   border: "var(--edu-cyan-200)",   strip: "var(--edu-cyan-500)",   color: "var(--edu-cyan-700)" },
  { bg: "var(--edu-green-50)",  border: "var(--edu-green-200)",  strip: "var(--edu-green-500)",  color: "var(--edu-green-700)" },
  { bg: "var(--edu-yellow-50)", border: "var(--edu-yellow-200)", strip: "var(--edu-yellow-500)", color: "var(--edu-yellow-700)" },
  { bg: "var(--edu-pink-50)",   border: "var(--edu-pink-200)",   strip: "var(--edu-pink-400)",   color: "var(--edu-pink-700)" },
  { bg: "var(--edu-purple-100)", border: "var(--edu-purple-300)", strip: "var(--edu-purple-600)", color: "var(--edu-purple-800)" },
  { bg: "var(--edu-cyan-100)",  border: "var(--edu-cyan-300)",  strip: "var(--edu-cyan-600)",   color: "var(--edu-cyan-800)" },
  { bg: "var(--edu-green-100)", border: "var(--edu-green-300)", strip: "var(--edu-green-600)",  color: "var(--edu-green-800)" },
];
const palette = (i) => PALETTE[i % PALETTE.length];

const ICON_MAP = { BookOpen, ClipboardList, CheckSquare, TrendingUp, Users };

/* ── Quick action button ───────────────────────────────────────── */
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

/* ── CursoCard ─────────────────────────────────────────────────── */
export default function CursoCard({
  curso,
  role      = "docente",
  idx       = 0,
  onClick   = null,
  coverSrc  = null,
  showCover = false,
  compact   = false,
}) {
  const navigate  = useNavigate();
  const cc        = palette(idx);
  const actions   = compact ? [] : getCourseActionsByRole(role, curso._id ?? curso.id);
  const mainPath  = getCourseMainPath(curso._id ?? curso.id);

  const handleCardClick = () => { if (onClick) { onClick(); return; } navigate(mainPath); };
  const handleNavigate  = (path) => navigate(path);

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir curso: ${curso.nombre}`}
      className="curso-card"
      style={{ "--cc-border": cc.border, "--cc-strip": cc.strip, "--cc-bg": cc.bg, "--cc-color": cc.color }}
    >
      {/* Color strip */}
      <div className="curso-card__strip" aria-hidden="true" />

      {/* Cover image */}
      {showCover && (
        <div className="curso-card__cover">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              loading="lazy"
              onError={e => {
                e.target.onerror = null;
                e.target.style.objectFit = "contain";
                e.target.style.padding   = "12px";
                e.target.style.opacity   = "0.35";
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="curso-card__cover-icon">
              <BookOpen size={20} aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="curso-card__body">
        <h3 className="curso-card__title">{curso.nombre}</h3>

        {curso.descripcion && (
          <p className="curso-card__desc">{curso.descripcion}</p>
        )}

        <div style={{ flex: 1, minHeight: 8 }} />

        {/* Footer meta */}
        <div className="curso-card__footer">
          <span className="curso-card__meta">
            <Users size={11} aria-hidden="true" />
            {curso.participantes?.length ?? curso.totalParticipantes ?? 0}
            {" "}{role === "padre" ? "participantes" : "alumnos"}
          </span>
          <ArrowUpRight size={14} className="curso-card__arrow" aria-hidden="true" />
        </div>

        {/* Quick actions */}
        {!compact && actions.length > 0 && (
          <div
            className="curso-card__actions"
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
}
