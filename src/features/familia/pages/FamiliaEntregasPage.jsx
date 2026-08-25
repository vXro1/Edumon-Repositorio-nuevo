// src/features/familia/pages/FamiliaEntregasPage.jsx
// ROL: Padre / Tutor — índice de "Mis entregas". Cada fila es solo un link:
// el formulario de envío vive en su propia URL (FamiliaEntregaDetallePage,
// /familia/entregas/:tareaId) en vez de expandirse acá mismo — así hay una
// única vista por entrega, con su propia URL, en vez de un acordeón.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, AlertCircle, Clock, BookOpen, ChevronRight } from "lucide-react";
import { tareasGetAll } from "@/features/cursos/services/tareasService";
import { normalizeTarea } from "@/lib/normalizers";

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function formatFecha(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// Fila simple — clic navega a la vista única de esa entrega.
function TareaCard({ tarea }) {
  const navigate = useNavigate();

  const goToEntrega = () => navigate(`/familia/entregas/${tarea._id}`);

  return (
    <div
      onClick={goToEntrega}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") goToEntrega(); }}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 14, padding: "14px 18px",
        marginBottom: 12,
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer", boxShadow: "var(--clay-card)",
        transition: "border-color 150ms",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-primary)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: "rgba(99,102,241,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FileText style={{ width: 15, height: 15, color: "#6366F1" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
          {tarea.titulo}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
          {tarea.curso && (
            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <BookOpen style={{ width: 10, height: 10 }} />
              {tarea.curso.nombre}
            </span>
          )}
          {tarea.fechaEntrega && (
            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock style={{ width: 10, height: 10 }} />
              {formatFecha(tarea.fechaEntrega)}
            </span>
          )}
        </div>
      </div>

      <ChevronRight style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaEntregasPage() {
  const [tareas,   setTareas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search,   setSearch]   = useState("");

  const loadTareas = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await tareasGetAll({ limit: 100 });
      setTareas((res?.tareas ?? res?.data ?? []).map(normalizeTarea));
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTareas(); }, []);

  const filtered = search
    ? tareas.filter(t =>
        t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        t.curso?.nombre?.toLowerCase().includes(search.toLowerCase())
      )
    : tareas;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText style={{ width: 18, height: 18, color: "#6366F1" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Mis entregas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            Gestiona las entregas de tus retos
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
        background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
        borderRadius: 10, padding: "8px 12px", maxWidth: 320,
      }}>
        <FileText style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar reto…"
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--color-text)", flex: 1 }}
        />
      </div>

      {/* Estado de error */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "var(--color-error-hover)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>No se pudieron cargar los retos</p>
          <button onClick={loadTareas} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Reintentar</button>
        </div>
      )}

      {/* Lista de tareas */}
      {!apiError && (loading ? (
        [0,1,2,3].map(i => (
          <div key={i} style={{
            background: "var(--color-surface)", borderRadius: 14,
            border: "1px solid var(--color-border)", padding: "14px 18px",
            marginBottom: 12, display: "flex", gap: 14,
          }}>
            <Sk h={36} w={36} r={9} />
            <div style={{ flex: 1 }}>
              <Sk h={14} w="55%" />
              <div style={{ marginTop: 8 }}><Sk h={11} w="35%" /></div>
            </div>
          </div>
        ))
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
          padding: "60px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <AlertCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
            No hay retos disponibles
          </p>
        </div>
      ) : (
        filtered.map(t => (
          <TareaCard key={t._id} tarea={t} />
        ))
      ))}
    </div>
  );
}