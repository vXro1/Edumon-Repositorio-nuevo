// src/features/cursos/components/hub/HubHeader.jsx
import { Users } from "lucide-react";
import { Sk } from "../shared/ui";
import { ROLES } from "@/security/roleMatrix";

const FALLBACK_FROM = "var(--color-primary)";
const FALLBACK_TO   = "#1E3A6E";

function shade(hex, amount) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HubHeader({ curso, loading, role }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <Sk h={28} w={240} r={8} />
        <Sk h={14} w={160} r={6} />
      </div>
    );
  }

  if (!curso) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", marginBottom: 20 }}>
        Curso no encontrado
      </div>
    );
  }

  const roleLabel =
    role === ROLES.PADRE
      ? "Seguimiento"
      : role === ROLES.ESTUDIANTE
      ? "Mi curso"
      : "Curso";

  const color = curso.color || null;
  const gradient = color
    ? `linear-gradient(135deg, ${color} 0%, ${shade(color, 0.45)} 100%)`
    : `linear-gradient(135deg, ${FALLBACK_FROM} 0%, ${FALLBACK_TO} 100%)`;

  return (
    <>
      <style>{HUBHEADER_CSS}</style>
      <div className="hhead-card" style={{ background: gradient, "--hhead-color": color || FALLBACK_FROM }}>
        {curso.fotoPortada && (
          <img src={curso.fotoPortada} alt="" aria-hidden="true" className="hhead-bg-img" />
        )}

        <div className="hhead-content">
          <span className="hhead-eyebrow">{roleLabel}</span>
          <h1 className="hhead-title">{curso.nombre}</h1>

          {curso.descripcion && (
            <p className="hhead-desc">{curso.descripcion}</p>
          )}

          <div className="hhead-meta-row">
            <span className="hhead-pill">
              <Users style={{ width: 13, height: 13 }} />
              {curso.participantes?.length ?? 0} participantes
            </span>
            {curso.docente && (
              <span className="hhead-pill hhead-pill-docente">
                {curso.docente.nombre} {curso.docente.apellido}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const HUBHEADER_CSS = `
.hhead-card {
  position: relative;
  border-radius: 24px;
  padding: 26px 26px 24px;
  overflow: hidden;
  margin-bottom: 24px;
  border: 3px solid rgba(255,255,255,0.25);
  box-shadow: 0 5px 0 rgba(0,0,0,0.18), 0 10px 26px rgba(0,0,0,0.18);
}

.hhead-bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  opacity: 0.18;
  pointer-events: none;
}

.hhead-content {
  position: relative;
  z-index: 1;
}

.hhead-eyebrow {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.16);
  padding: 3px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.hhead-title {
  font-size: clamp(1.25rem, 3.4vw, 1.7rem);
  font-weight: 800;
  color: #fff;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-shadow: 0 2px 6px rgba(0,0,0,0.25);
  overflow-wrap: anywhere;
}

.hhead-desc {
  font-size: 13.5px;
  color: rgba(255,255,255,0.82);
  margin: 8px 0 0;
  max-width: 60ch;
  line-height: 1.5;
}

.hhead-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.hhead-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: rgba(255,255,255,0.16);
  border: 1.5px solid rgba(255,255,255,0.25);
  padding: 5px 11px;
  border-radius: 999px;
  white-space: nowrap;
}

.hhead-pill-docente {
  background: rgba(255,255,255,0.94);
  color: var(--hhead-color);
  border-color: transparent;
}

@media (max-width: 560px) {
  .hhead-card { padding: 20px 18px 18px; border-radius: 20px; }
  .hhead-meta-row { gap: 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .hhead-card { transition: none; }
}
`;