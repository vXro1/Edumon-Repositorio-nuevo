// src/features/familia/pages/FamiliaTareasPage.jsx
// ROL: Padre / Tutor — Ver tareas asignadas (solo lectura)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Search, ChevronRight, AlertCircle,
  Calendar, Clock, BookOpen, CheckCircle2, XCircle,
} from "lucide-react";
import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { tareasGetAll } from "@/features/cursos/services/tareasService";
import { normalizeTarea } from "@/lib/normalizers";

import { Button, Input , Badge } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

// ── ESTADO_META: se mantiene para mapear estado → variant de Badge ─────────
const ESTADO_META = {
  abierta: { label: "Abierta", variant: "success"  },
  cerrada: { label: "Cerrada", variant: "neutral"  },
  vencida: { label: "Vencida", variant: "error"    },
};

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

// ── EstadoBadge migrado — usa Badge del design system ─────────────────────
function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] ?? { label: estado, variant: "neutral" };
  return (
    <Badge variant={m.variant} size="sm" dot>
      {m.label}
    </Badge>
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
  const estado =
    tarea.estado ??
    (isVencida(tarea.fechaEntrega) && tarea.estado === "abierta"
      ? "vencida"
      : tarea.estado ?? "abierta");

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", borderBottom: "1px solid var(--color-border)",
        cursor: "pointer", transition: "background 150ms",
      }}
    >
      {/* Ícono */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: estado === "abierta"
          ? "rgba(12,106,196,0.10)"
          : "rgba(107,114,128,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {estado === "abierta"
          ? <ClipboardList style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
          : <CheckCircle2  style={{ width: 16, height: 16, color: "#6B7280" }} />
        }
      </div>

      {/* Información */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, margin: 0,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {tarea.titulo}
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          {tarea.curso && (
            <span style={{ display: "flex", gap: 4, fontSize: 12 }}>
              <BookOpen style={{ width: 11, height: 11 }} />
              {tarea.curso.nombre}
            </span>
          )}

          {tarea.fechaEntrega && (
            <span style={{
              display: "flex", gap: 4, fontSize: 12,
              color: isVencida(tarea.fechaEntrega) ? "var(--color-error-hover)" : "var(--color-text-muted)",
            }}>
              <Clock style={{ width: 11, height: 11 }} />
              {formatFecha(tarea.fechaEntrega)}
            </span>
          )}
        </div>
      </div>

      {/* Badge + acción */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <EstadoBadge estado={estado} />

        <IconBtn color="var(--color-text-muted)" onClick={onClick}>
          <ChevronRight style={{ width: 14, height: 14 }} />
        </IconBtn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaTareasPage() {
  const navigate = useNavigate();

  const [tareas,       setTareas]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const load = async () => {
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

  useEffect(() => { load(); }, []);

  const filtered = tareas.filter(t => {
    const matchSearch =
      !search ||
      t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      t.curso?.nombre?.toLowerCase().includes(search.toLowerCase());

    const matchEstado =
      filtroEstado === "todos" || t.estado === filtroEstado;

    return matchSearch && matchEstado;
  });

  const abiertas = tareas.filter(t => t.estado === "abierta").length;
  const cerradas = tareas.filter(t => t.estado !== "abierta").length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
        </div>

        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Retos</h1>
          <p style={{ fontSize: 13 }}>
            {abiertas} abiertas · {cerradas} cerradas
          </p>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>

        {/* Search — <input> nativo reemplazado; el <div> wrapper desaparece */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input
            name="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar reto…"
            leftIcon={<Search size={14} />}
          />
        </div>

        {/* Filtros — toggle buttons, se mantienen nativos */}
        {["todos", "abierta", "cerrada"].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              fontWeight: 600,
              border: filtroEstado === e ? "none" : "1.5px solid var(--color-border)",
              background: filtroEstado === e ? "var(--color-primary)" : "var(--color-surface)",
              color: filtroEstado === e ? "white" : "var(--color-text-muted)",
            }}
          >
            {e === "todos" ? "Todas" : e === "abierta" ? "Abiertas" : "Cerradas"}
          </button>
        ))}
      </div>

      {/* Error de carga */}
      {apiError && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <AlertCircle />
          <Button variant="primary" onClick={load}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Lista */}
      {!apiError && (
        <div style={{
          background: "var(--color-surface)",
          borderRadius: 16,
          border: "1px solid var(--color-border)",
        }}>
          {loading ? (
            [0,1,2,3].map(i => (
              <div key={i} style={{ padding: 14 }}>
                <Sk h={14} w="60%" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <AlertCircle />
              <p>No hay retos</p>
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