// src/features/familia/pages/FamiliaCursosPage.jsx
// ROL: Padre / Tutor — Vista de cursos inscritos (solo lectura)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Search, ArrowUpRight, GraduationCap,
  Users, AlertCircle,
} from "lucide-react";
import { cursosGetMine } from "@/lib/apiClient";
import letrasImg from "@/assets/img/letras.png";

const CARD_COLORS = [
  { strip: "#0C6AC4", icon: "#1D4ED8", bg: "#EFF6FF" },
  { strip: "#16A34A", icon: "#166534", bg: "#F0FDF4" },
  { strip: "#7C3AED", icon: "#5B21B6", bg: "#FAF5FF" },
  { strip: "#EA580C", icon: "#9A3412", bg: "#FFF7ED" },
  { strip: "#0284C7", icon: "#075985", bg: "#F0F9FF" },
  { strip: "#D97706", icon: "#92400E", bg: "#FFFBEB" },
];
const cc = (i) => CARD_COLORS[i % CARD_COLORS.length];

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function CourseCard({ curso, idx, onClick }) {
  const [hov, setHov] = useState(false);
  const c = cc(idx);
  const hasCover = !!curso.fotoPortada;

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--color-surface)", borderRadius: 16,
        border: `1px solid ${hov ? "#BFDBFE" : "var(--color-border)"}`,
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)",
        cursor: "pointer", transition: "all 200ms ease",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        overflow: "hidden",
      }}
    >
      {/* Cover image or accent strip */}
      <div style={{ height: 120, overflow: "hidden", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={hasCover ? curso.fotoPortada : letrasImg}
          alt={curso.nombre ?? "Curso"}
          onError={e => { e.target.onerror = null; e.target.src = letrasImg; e.target.style.height = "60px"; e.target.style.objectFit = "contain"; e.target.style.opacity = "0.55"; }}
          style={{
            width: hasCover ? "100%" : "auto",
            height: hasCover ? "100%" : 60,
            objectFit: hasCover ? "cover" : "contain",
            opacity: hasCover ? 1 : 0.55,
          }}
        />
      </div>

      <div style={{ padding: "14px 16px" }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: "var(--color-text)",
          lineHeight: 1.35, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {curso.nombre}
        </h3>

        {curso.docente && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
            <GraduationCap style={{ width: 12, height: 12, color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {curso.docente.nombre} {curso.docente.apellido}
            </span>
          </div>
        )}

        {curso.descripcion && (
          <p style={{
            fontSize: 12, color: "var(--color-text-muted)", marginTop: 6,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {curso.descripcion}
          </p>
        )}

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 12, paddingTop: 10,
          borderTop: "1px solid var(--color-border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Users style={{ width: 11, height: 11, color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
              {curso.totalParticipantes ?? curso.participantes?.length ?? 0} participantes
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 11.5, color: c.strip, fontWeight: 600 }}>Ver detalle</span>
            <ArrowUpRight style={{ width: 13, height: 13, color: c.strip }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function SkCard() {
  return (
    <div style={{ background: "var(--color-surface)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)" }}>
      <Sk h={120} r={0} />
      <div style={{ padding: 16 }}>
        <Sk h={14} w="80%" />
        <div style={{ marginTop: 8 }}><Sk h={11} w="50%" /></div>
        <div style={{ marginTop: 6 }}><Sk h={11} w="70%" /></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaCursosPage() {
  const navigate = useNavigate();
  const [cursos,   setCursos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search,   setSearch]   = useState("");

  const load = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await cursosGetMine({ limit: 50 });
      setCursos(res?.cursos ?? []);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = search
    ? cursos.filter(c =>
        c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        c.docente?.nombre?.toLowerCase().includes(search.toLowerCase())
      )
    : cursos;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: "rgba(12,106,196,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen style={{ width: 18, height: 18, color: "#0C6AC4" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Mis cursos</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
              {!loading && `${cursos.length} curso${cursos.length !== 1 ? "s" : ""} inscrito${cursos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
          borderRadius: 10, padding: "8px 12px", width: 240,
        }}>
          <Search style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar curso…"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 13.5, color: "var(--color-text)", flex: 1,
            }}
          />
        </div>
      </div>

      {/* Error state */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "#DC2626" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>No se pudieron cargar los cursos</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Intenta de nuevo más tarde.</p>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Reintentar</button>
        </div>
      )}

      {/* Grid */}
      {!apiError && (loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {[0, 1, 2, 3].map(i => <SkCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
          padding: "60px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <AlertCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
            {search ? "No se encontraron cursos" : "Aún no estás inscrito en ningún curso"}
          </p>
          {!search && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
              Contacta al docente para que te agregue a un curso.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map((c, i) => (
            <CourseCard
              key={c._id} curso={c} idx={i}
              onClick={() => navigate(`/cursos/${c._id}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}