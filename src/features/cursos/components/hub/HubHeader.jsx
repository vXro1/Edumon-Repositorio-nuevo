// src/features/cursos/components/hub/HubHeader.jsx
import { Users, Archive } from "lucide-react";
import { Sk } from "../shared/ui";
// Mismo fallback que ya usan CursoCard.jsx/CursosPage.jsx/FamiliaCursosPage.jsx
// para "curso sin portada" — antes esta cabecera usaba un degradado de color
// liso en su lugar, así que un curso sin foto propia se veía distinto aquí
// que en el resto de la app, y el color sólido tapaba por completo cualquier
// imagen (de ahí "ese color no me deja ver la imagen").
import letrasImg from "@/assets/img/letras.svg";

const FALLBACK_COLOR = "#0C6AC4";

function shade(hex, amount) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function tint(hex, amount) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) + (255 - parseInt(h.slice(0, 2), 16)) * amount);
  const g = Math.round(parseInt(h.slice(2, 4), 16) + (255 - parseInt(h.slice(2, 4), 16)) * amount);
  const b = Math.round(parseInt(h.slice(4, 6), 16) + (255 - parseInt(h.slice(4, 6), 16)) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HubHeader({ curso, loading, esPadre = false, esEstudiante = false }) {
  if (loading) {
    return (
      <div style={{ marginBottom: 24 }}>
        <Sk h={200} r={24} />
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

  const roleLabel = esPadre ? "Seguimiento" : esEstudiante ? "Mi curso" : "Curso";

  const color     = curso.color || FALLBACK_COLOR;
  const colorDark = shade(color, 0.45);
  const cover     = curso.fotoPortada || "";

  return (
    <>
      <style>{HUBHEADER_CSS}</style>
      <div className="hhead-wrap" style={{ "--hhead-color": color, "--hhead-color-dark": colorDark }}>

        <div className="hhead-cover">
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="hhead-cover-img"
              onError={e => { e.target.onerror = null; e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className="hhead-cover-fallback"
              style={{ background: `linear-gradient(135deg, ${tint(color, 0.88)} 0%, ${tint(color, 0.72)} 100%)` }}
            >
              <img src={letrasImg} alt="" className="hhead-cover-fallback-logo" />
            </div>
          )}
          <div className="hhead-cover-overlay" aria-hidden="true" />

          <div className="hhead-cover-content">
            <span className="hhead-eyebrow">{roleLabel}</span>
            <h1 className="hhead-title">{curso.nombre}</h1>
          </div>
        </div>

        <div className="hhead-info">
          <div className="hhead-info-main">
            {curso.docente && (
              <div className="hhead-docente">
                <span className="hhead-docente-dot" />
                <span className="hhead-docente-name">{curso.docente.nombre} {curso.docente.apellido}</span>
                <span className="hhead-docente-role">Docente</span>
              </div>
            )}

            {curso.descripcion && (
              <p className="hhead-desc">{curso.descripcion}</p>
            )}
          </div>

          <div className="hhead-info-stats">
            <span className="hhead-pill">
              <Users style={{ width: 13, height: 13 }} />
              {curso.participantes?.length ?? curso.totalParticipantes ?? 0} participantes
            </span>
            {curso.estado && curso.estado !== "activo" && (
              <span className="hhead-pill hhead-pill--warn">
                <Archive style={{ width: 13, height: 13 }} />
                {curso.estado === "archivado" ? "Archivado" : curso.estado}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const HUBHEADER_CSS = `
.hhead-wrap {
  position: relative;
  width: 100%;
  border-radius: 24px;
  border: 3px solid var(--hhead-color);
  box-shadow: 0 5px 0 var(--hhead-color-dark), 0 10px 26px rgba(0,0,0,0.12);
  overflow: hidden;
  background: var(--color-surface);
  margin-bottom: 24px;
}

/* ── Portada ──
   width:100% explícito es lo que evita el bug de arriba: con aspect-ratio
   + max-height pero SIN esto, un <div> de bloque puede terminar derivando
   su ancho del alto ya recortado en vez de llenar el contenedor. */
.hhead-cover {
  position: relative;
  width: 100%;
  overflow: hidden;
  aspect-ratio: 3 / 1;
  min-height: 140px;
  max-height: 220px;
}

.hhead-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
}

.hhead-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hhead-cover-fallback-logo {
  width: 46%;
  max-width: 220px;
  height: auto;
  opacity: 0.9;
}

.hhead-cover-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 85%);
}

.hhead-cover-content {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 16px;
}

.hhead-eyebrow {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.24);
  padding: 3px 10px;
  border-radius: 999px;
  margin-bottom: 8px;
}

.hhead-title {
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 3.4vw, 1.85rem);
  font-weight: 800;
  color: #fff;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  overflow-wrap: anywhere;
}

/* ── Franja de información ──
   Grid de 2 columnas en desktop: la descripción ocupa todo el ancho de su
   columna (nada de max-width en ch que deje un hueco vacío a la derecha) y
   los datos rápidos quedan agrupados en una columna lateral, separados por
   un borde — en vez de una fila suelta al final que dejaba la tarjeta con
   espacio sin usar. En mobile colapsa a una sola columna. */
.hhead-info {
  width: 100%;
  box-sizing: border-box;
  border-top: 1px solid var(--color-border);
  padding: 18px 22px 20px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 720px) {
  .hhead-info {
    grid-template-columns: 1fr minmax(150px, 190px);
    gap: 24px;
    align-items: start;
  }
}

.hhead-info-main { min-width: 0; }

.hhead-info-stats {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

@media (min-width: 720px) {
  .hhead-info-stats {
    flex-direction: column;
    align-items: stretch;
    padding-left: 24px;
    border-left: 1px solid var(--color-border);
    gap: 10px;
  }
  .hhead-info-stats .hhead-pill { justify-content: center; }
}

.hhead-docente {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.hhead-docente-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--hhead-color);
}

.hhead-docente-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text);
}

.hhead-docente-role {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--hhead-color-dark);
  padding: 2px 9px;
  border-radius: 999px;
}

.hhead-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.65;
}

.hhead-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--hhead-color-dark);
  background: color-mix(in srgb, var(--hhead-color) 12%, white);
  border: 1.5px solid color-mix(in srgb, var(--hhead-color) 30%, transparent);
  padding: 5px 12px;
  border-radius: 999px;
  white-space: nowrap;
}

.hhead-pill--warn {
  color: #92400E;
  background: rgba(217,119,6,0.12);
  border-color: rgba(217,119,6,0.35);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .hhead-wrap { border-radius: 20px; }
  .hhead-cover { aspect-ratio: 16 / 11; max-height: 190px; }
  .hhead-cover-content { left: 16px; right: 16px; bottom: 12px; }
  .hhead-info { padding: 16px 16px 18px; }
}

@media (max-width: 400px) {
  .hhead-cover { aspect-ratio: 4 / 3; }
}
`;
