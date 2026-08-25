// src/features/familia/pages/FamiliaCursosPage.jsx
// ROL: Padre / Tutor — Mis cursos
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, AlertCircle } from "lucide-react";

import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { normalizeCurso } from "@/lib/normalizers";
import CursoCard from "@/features/cursos/components/CursoCard";
import { Button } from "@/components";

function Sk({ h = 14, w = "100%", r = 6 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

// FIX: no tenía nada de estilo propio — solo un cuadrado gris. Mismo look
// que la card real (aspect-ratio 1/1, borde redondeado) para que el
// esqueleto no "salte" cuando llegan los datos.
function SkCard() {
  return (
    <div style={{
      aspectRatio: "1 / 1",
      borderRadius: 14,
      border: "2px solid var(--color-border)",
      background: "var(--color-surface)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <Sk h="100%" r={0} />
    </div>
  );
}

// FIX: toda la página estaba prácticamente sin estilos (encabezado sin
// layout, buscador sin bordes/padding, estados de error/vacío sin
// formato) — se veía rota, sobre todo con muchos cursos donde nada
// contenía el espacio. Reescrita con el mismo lenguaje visual que el
// resto de la sección "familia" (FamiliaEntregasPage/FamiliaTareasPage):
// bloque de encabezado con ícono, buscador con borde, grid de CursoCard
// (la card que sí funcionaba bien) con estados de carga/error/vacío
// consistentes.
export default function FamiliaCursosPage() {
  const navigate = useNavigate();

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await cursosGetMine({ limit: 50 });
      setCursos((res?.cursos ?? []).map(normalizeCurso));
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = search
    ? cursos.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
          c.docente?.nombre?.toLowerCase().includes(search.toLowerCase())
      )
    : cursos;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(12,106,196,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen style={{ width: 19, height: 19, color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              Mis cursos
            </h1>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>
              {loading ? "Cargando…" : `${cursos.length} curso${cursos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
        background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
        borderRadius: 10, padding: "8px 12px", maxWidth: 320,
      }}>
        <Search style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar curso…"
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: 13.5, color: "var(--color-text)", flex: 1, minWidth: 0,
          }}
        />
      </div>

      {/* Error */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "var(--color-error-hover)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            No se pudieron cargar los cursos
          </p>
          <Button variant="primary" onClick={load} style={{ marginTop: 4 }}>Reintentar</Button>
        </div>
      )}

      {/* Grid */}
      {!apiError && (loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[0, 1, 2, 3].map((i) => <SkCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
          padding: "60px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <BookOpen style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
            {search ? "Sin resultados para tu búsqueda" : "No tienes cursos todavía"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map((c, i) => (
            <CursoCard
              key={c._id}
              curso={c}
              role="padre"
              idx={i}
              onClick={() => navigate(`/cursos/${c._id}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
