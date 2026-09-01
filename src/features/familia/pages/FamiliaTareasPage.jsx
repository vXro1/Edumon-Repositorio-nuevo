import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Search, ChevronRight, AlertCircle,
  Clock, BookOpen, CheckCircle2, XCircle,
} from "lucide-react";
import { tareasGetAll } from "@/features/cursos/services/tareasService";
import { normalizeTarea } from "@/lib/normalizers";

import { Button, Input , Badge } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

// normalizeTarea() produce "activa" / "cerrada" / "vencida", nunca "abierta"
const ESTADO_META = {
  activa:  { label: "Abierta", variant: "success"  },
  cerrada: { label: "Cerrada", variant: "neutral"  },
  vencida: { label: "Vencida", variant: "error"    },
};

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

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
  const estado = tarea.estado ?? "activa";
  const iconBg = estado === "activa" ? "rgba(12,106,196,0.10)"
    : estado === "vencida" ? "rgba(220,38,38,0.10)"
    : "rgba(107,114,128,0.10)";
  const iconColor = estado === "activa" ? "var(--color-primary)"
    : estado === "vencida" ? "var(--color-error-hover)"
    : "#6B7280";
  const Icon = estado === "activa" ? ClipboardList
    : estado === "vencida" ? XCircle
    : CheckCircle2;

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
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 16, height: 16, color: iconColor }} />
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

        <IconBtn label="Ver" color="var(--color-text-muted)" onClick={onClick}>
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

    // "Cerradas" agrupa cerrada + vencida — para un padre ambas significan lo mismo
    const matchEstado =
      filtroEstado === "todos" ? true :
      filtroEstado === "cerrada" ? (t.estado === "cerrada" || t.estado === "vencida") :
      t.estado === filtroEstado;

    return matchSearch && matchEstado;
  });

  const abiertas = tareas.filter(t => t.estado === "activa").length;
  const cerradas = tareas.filter(t => t.estado !== "activa").length;

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

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        <Input
          name="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar reto…"
          leftIcon={<Search size={14} />}
        />

        <div
          role="tablist"
          aria-label="Filtrar retos por estado"
          style={{
            display: "inline-flex", gap: 4, padding: 4, width: "fit-content",
            background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
            borderRadius: 12,
          }}
        >
          {["todos", "activa", "cerrada"].map(e => {
            const active = filtroEstado === e;
            return (
              <button
                key={e}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFiltroEstado(e)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "white" : "var(--color-text-muted)",
                  boxShadow: active ? "var(--clay-shadow-sm)" : "none",
                  transition: "background 150ms, color 150ms",
                }}
                onMouseEnter={e2 => { if (!active) e2.currentTarget.style.color = "var(--color-text)"; }}
                onMouseLeave={e2 => { if (!active) e2.currentTarget.style.color = "var(--color-text-muted)"; }}
              >
                {e === "todos" ? "Todas" : e === "activa" ? "Abiertas" : "Cerradas"}
              </button>
            );
          })}
        </div>
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
                onClick={() => navigate(`/familia/entregas/${t._id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}