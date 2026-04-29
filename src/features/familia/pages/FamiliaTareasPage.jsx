// src/features/familia/pages/FamiliaTareasPage.jsx
// ROL: Padre / Tutor — Ver tareas asignadas (solo lectura)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Search, ChevronRight, AlertCircle,
  Calendar, Clock, BookOpen, CheckCircle2, XCircle,
} from "lucide-react";
import { tareasGetAll, cursosGetMine } from "@/lib/apiClient";

const ESTADO_META = {
  abierta:  { label: "Abierta",   color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  cerrada:  { label: "Cerrada",   color: "#6B7280", bg: "rgba(107,114,128,0.10)" },
  vencida:  { label: "Vencida",   color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] ?? { label: estado, color: "#6B7280", bg: "rgba(107,114,128,0.10)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
      background: m.bg, color: m.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {m.label}
    </span>
  );
}

function formatFecha(fechaStr) {
  if (!fechaStr) return "Sin fecha";
  const d = new Date(fechaStr);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function isVencida(fechaStr) {
  if (!fechaStr) return false;
  return new Date(fechaStr) < new Date();
}

function TareaRow({ tarea, onClick }) {
  const [hov, setHov] = useState(false);
  const estado = tarea.estado ?? (isVencida(tarea.fechaEntrega) && tarea.estado === "abierta" ? "vencida" : tarea.estado ?? "abierta");

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", borderBottom: "1px solid var(--color-border)",
        cursor: "pointer", transition: "background 150ms",
        background: hov ? "var(--color-bg)" : "transparent",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: estado === "abierta" ? "rgba(12,106,196,0.10)" : "rgba(107,114,128,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {estado === "abierta"
          ? <ClipboardList style={{ width: 16, height: 16, color: "#0C6AC4" }} />
          : <CheckCircle2 style={{ width: 16, height: 16, color: "#6B7280" }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, color: "var(--color-text)",
          margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {tarea.titulo}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          {tarea.curso && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
              <BookOpen style={{ width: 11, height: 11 }} />
              {tarea.curso.nombre}
            </span>
          )}
          {tarea.fechaEntrega && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: isVencida(tarea.fechaEntrega) ? "#DC2626" : "var(--color-text-muted)" }}>
              <Clock style={{ width: 11, height: 11 }} />
              {formatFecha(tarea.fechaEntrega)}
            </span>
          )}
        </div>
      </div>

      {/* Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <EstadoBadge estado={estado} />
        <ChevronRight style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaTareasPage() {
  const navigate  = useNavigate();
  const [tareas,   setTareas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search,   setSearch]   = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const load = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await tareasGetAll({ limit: 100 });
      setTareas(res?.tareas ?? res?.data ?? []);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tareas.filter(t => {
    const matchSearch = !search ||
      t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      t.curso?.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === "todos" || t.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const abiertas = tareas.filter(t => t.estado === "abierta").length;
  const cerradas = tareas.filter(t => t.estado !== "abierta").length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Tareas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            {abiertas} abiertas · {cerradas} cerradas
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 18, flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200,
          background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
          borderRadius: 10, padding: "8px 12px",
        }}>
          <Search style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarea…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--color-text)", flex: 1 }}
          />
        </div>

        {/* Estado filter */}
        {["todos", "abierta", "cerrada"].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: filtroEstado === e ? "none" : "1.5px solid var(--color-border)",
              background: filtroEstado === e ? "#0C6AC4" : "var(--color-surface)",
              color: filtroEstado === e ? "white" : "var(--color-text-muted)",
              transition: "all 150ms",
            }}
          >
            {e === "todos" ? "Todas" : e === "abierta" ? "Abiertas" : "Cerradas"}
          </button>
        ))}
      </div>

      {/* Error state */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "#DC2626" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>No se pudieron cargar las tareas</p>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Reintentar</button>
        </div>
      )}

      {/* List */}
      {!apiError && (
      <div style={{
        background: "var(--color-surface)", borderRadius: 16,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}>
        {loading ? (
          [0,1,2,3,4].map(i => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", borderBottom: "1px solid var(--color-border)" }}>
              <Sk h={38} w={38} r={10} />
              <div style={{ flex: 1 }}>
                <Sk h={14} w="60%" />
                <div style={{ marginTop: 6 }}><Sk h={11} w="35%" /></div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <AlertCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
              {search ? "No se encontraron tareas" : "No hay tareas disponibles"}
            </p>
          </div>
        ) : (
          filtered.map(t => (
            <TareaRow
              key={t._id}
              tarea={t}
              onClick={() => navigate(`/familia/entregas?tareaId=${t._id}`)}
            />
          ))
        )}
      </div>
      )}
    </div>
  );
}