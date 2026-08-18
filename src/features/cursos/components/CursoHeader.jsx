// src/features/cursos/components/CursoHeader.jsx
import { UserAvatar } from "@/components";
import { useNavigate } from "react-router-dom";

const FALLBACK_COLOR = "var(--color-primary)";

function hexToRgba(hex, alpha) {
  if (!hex) return null;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex, amount) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// Aclara un hex mezclándolo con blanco (para el borde/sombra "sticker")
function tint(hex, amount) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) + (255 - parseInt(h.slice(0, 2), 16)) * amount);
  const g = Math.round(parseInt(h.slice(2, 4), 16) + (255 - parseInt(h.slice(2, 4), 16)) * amount);
  const b = Math.round(parseInt(h.slice(4, 6), 16) + (255 - parseInt(h.slice(4, 6), 16)) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function CursoHeader({ curso, onEdit }) {
  const navigate = useNavigate();
  const cover = curso?.imagen || curso?.fotoPortada || "";
  const color = curso?.color || FALLBACK_COLOR;
  const colorDark = shade(color, 0.45);
  const colorSoft = tint(color, 0.85);

  return (
    <>
      <style>{CHEADER_CSS}</style>
      <div
        className="cheader-wrap"
        style={{ "--curso-color": color, "--curso-color-dark": colorDark, "--curso-color-soft": colorSoft }}
      >
        <div className="cheader-cover">
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="cheader-cover-img"
              onError={e => { e.target.onerror = null; e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className="cheader-cover-fallback"
              style={{ background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)` }}
            />
          )}

          <div
            aria-hidden="true"
            className="cheader-cover-overlay"
            style={{ background: `linear-gradient(to bottom, ${hexToRgba(color, 0.10) ?? "transparent"} 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.62) 100%)` }}
          />

          <div className="cheader-title-row">
            <span className="cheader-dot" style={{ background: color }} />
            <h1 className="cheader-title">{curso.nombre}</h1>
          </div>
        </div>

        {curso.docente && (
          <button className="cheader-docente-pill" onClick={() => navigate("/perfil")}>
            <UserAvatar user={curso.docente} size={40} />
            <div className="cheader-docente-text">
              <p className="cheader-docente-name">{curso.docente.nombre} {curso.docente.apellido}</p>
              <p className="cheader-docente-role">Docente</p>
            </div>
          </button>
        )}
      </div>
    </>
  );
}

const CHEADER_CSS = `
.cheader-wrap {
  position: relative;
  margin-bottom: var(--space-8, 32px);
}

/* ── Portada ── */
.cheader-cover {
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  aspect-ratio: 2.6 / 1;
  min-height: 150px;
  max-height: 240px;
  border: 3px solid var(--curso-color);
  box-shadow: 0 5px 0 var(--curso-color-dark), 0 10px 24px rgba(0,0,0,0.16);
}

.cheader-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
}

.cheader-cover-fallback {
  width: 100%;
  height: 100%;
}

.cheader-cover-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cheader-title-row {
  position: absolute;
  left: var(--space-5, 20px);
  bottom: var(--space-4, 16px);
  right: var(--space-5, 20px);
  display: flex;
  align-items: center;
  gap: 10px;
}

.cheader-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.55);
}

.cheader-title {
  color: #fff;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 3.4vw, 1.65rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
  text-shadow: 0 2px 6px rgba(0,0,0,0.45);
  overflow-wrap: anywhere;
}

/* ── Credencial del docente — sobresale de la portada, estilo "sticker" ── */
.cheader-docente-pill {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -22px 0 0 20px;
  padding: 8px 16px 8px 8px;
  background: #fff;
  border: 2.5px solid var(--curso-color);
  border-radius: 18px;
  box-shadow: 0 3px 0 var(--curso-color), 0 6px 16px rgba(0,0,0,0.10);
  cursor: pointer;
  max-width: calc(100% - 40px);
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.cheader-docente-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 var(--curso-color), 0 10px 20px rgba(0,0,0,0.14);
}

.cheader-docente-pill:active {
  transform: translateY(1px);
  box-shadow: 0 2px 0 var(--curso-color), 0 4px 10px rgba(0,0,0,0.10);
}

.cheader-docente-text {
  text-align: left;
  min-width: 0;
}

.cheader-docente-name {
  margin: 0;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cheader-docente-role {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--curso-color-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .cheader-cover {
    aspect-ratio: 16 / 11;
    max-height: 200px;
    border-radius: 22px;
  }
  .cheader-docente-pill {
    margin-left: 14px;
    max-width: calc(100% - 28px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cheader-docente-pill { transition: none; }
}
`;