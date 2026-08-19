// src/features/cursos/components/CursoEntregasTab.jsx
import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../../features/auth/context/AuthContext";
import { tienePermiso } from "../../../security/roleMatrix";
import { PERMISSIONS } from "../../../security/permissions";
import entregasService from "../../entregas/services/entregasService";
import { UserAvatar } from "@/components";

// ─── Constantes de estado ─────────────────────────────────────────────────────
const ESTADO_STYLES = {
  borrador:   { background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  enviada:    { background: "var(--color-background-info)",      color: "var(--color-text-info)"      },
  tarde:      { background: "var(--color-background-warning)",   color: "var(--color-text-warning)"   },
  calificada: { background: "var(--color-background-success)",   color: "var(--color-text-success)"   },
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ mensaje }) {
  return (
    <div style={{
      padding: "32px 24px",
      textAlign: "center",
      color: "var(--color-text-secondary)",
      fontSize: 13,
    }}>
      {mensaje}
    </div>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────
export default function CursoEntregasTab({ tareas = [], onGrade }) {
  const { user } = useAuthContext();
  const rol = user?.role ?? user?.rol ?? "";
  const esPadre = tienePermiso(rol, PERMISSIONS.SUBMIT_ENTREGA) &&
                  !tienePermiso(rol, PERMISSIONS.GRADE_ENTREGAS);

  return (
    <div role="tabpanel" id="tabpanel-entregas" aria-label="Entregas">
      {tareas.length === 0 ? (
        <EmptyState mensaje="No hay tareas en este curso todavía." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {tareas.map((tarea) => (
            <TareaEntregasBlock
              key={tarea._id}
              tarea={tarea}
              userId={user?._id ?? user?.id}
              esPadre={esPadre}
              onGrade={onGrade}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bloque de entregas por tarea ─────────────────────────────────────────────
function TareaEntregasBlock({ tarea, userId, esPadre, onGrade }) {
  const [entregas, setEntregas] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetch = esPadre
      ? entregasService.getMisEntregas(tarea._id)
      : entregasService.getByTarea(tarea._id);

    fetch
      .then(({ data }) => {
        if (cancelled) return;
        if (esPadre) {
          setEntregas(data ?? []);
        } else {
          setEntregas(data?.entregas ?? []);
          setStats(data?.estadisticas ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar las entregas.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tarea._id, esPadre]);

  return (
    <section>
      {/* Header de la tarea */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 10,
        padding: "10px 14px",
        background: "var(--color-background-secondary)",
        borderRadius: 10,
        border: "0.5px solid var(--color-border-tertiary)",
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 14, overflowWrap: "anywhere" }}>{tarea.titulo}</p>
          {tarea.fechaEntrega && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
              Entrega: {new Date(tarea.fechaEntrega).toLocaleDateString("es-CO", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </p>
          )}
        </div>
        {stats && <EstadisticasBar stats={stats} />}
      </div>

      {/* Estado de carga */}
      {loading && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "8px 0" }}>
          Cargando entregas...
        </p>
      )}
      {error && (
        <p style={{ fontSize: 13, color: "var(--color-text-danger)", padding: "8px 0" }}>
          {error}
        </p>
      )}
      {!loading && !error && entregas.length === 0 && (
        <EmptyState mensaje={esPadre
          ? "Todavía no has hecho ninguna entrega para esta tarea."
          : "Ningún alumno ha entregado todavía."
        } />
      )}
      {!loading && !error && entregas.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {entregas.map((entrega) => (
            <EntregaRow
              key={entrega._id}
              entrega={entrega}
              esPadre={esPadre}
              onGrade={onGrade}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Fila de entrega ──────────────────────────────────────────────────────────
function EntregaRow({ entrega, esPadre, onGrade }) {
  const autor = typeof entrega.padre === "object" ? entrega.padre : null;
  const nombreAutor = autor
    ? `${autor.nombre ?? ""} ${autor.apellido ?? ""}`.trim()
    : esPadre
      ? "Mi entrega"
      : `ID: ${String(entrega.padre ?? entrega.padreId ?? "").slice(-6)}`;

  const calificacion = entrega.calificacion;

  return (
    <li style={{
      padding: "12px 14px",
      borderRadius: 10,
      border: "0.5px solid var(--color-border-tertiary)",
      marginBottom: 8,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {!esPadre && <UserAvatar user={autor} size={32} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontWeight: 500, fontSize: 14,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {nombreAutor}
          </p>
          {entrega.textoRespuesta && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              {entrega.textoRespuesta}
            </p>
          )}
        </div>
        <EstadoBadge estado={entrega.estado} />
      </div>

      {esPadre && calificacion && (
        <div style={{
          padding: "8px 12px",
          background: "var(--color-background-success)",
          borderRadius: 8,
          fontSize: 13,
        }}>
          <span style={{ fontWeight: 500, color: "var(--color-text-success)" }}>
            Nota: {calificacion.nota}
          </span>
          {calificacion.comentario && (
            <span style={{ color: "var(--color-text-secondary)", marginLeft: 8 }}>
              — {calificacion.comentario}
            </span>
          )}
        </div>
      )}

      {entrega.archivosAdjuntos?.length > 0 && (
        <ListaAdjuntos adjuntos={entrega.archivosAdjuntos} />
      )}

      {!esPadre && entrega.estado !== "borrador" && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => onGrade?.(entrega)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: calificacion
                ? "var(--color-background-secondary)"
                : "var(--color-text-info)",
              color: calificacion ? "var(--color-text-primary)" : "white",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {calificacion ? "Editar calificación" : "Calificar"}
          </button>
        </div>
      )}
    </li>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  if (!estado) return null;
  const style = ESTADO_STYLES[estado] ?? ESTADO_STYLES.borrador;
  return (
    <span style={{ ...style, fontSize: 11, padding: "3px 8px", borderRadius: 10, fontWeight: 500, flexShrink: 0 }}>
      {estado}
    </span>
  );
}

function EstadisticasBar({ stats }) {
  return (
    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
      <span>Total: <strong>{stats.total}</strong></span>
      <span>Enviadas: <strong>{stats.enviadas}</strong></span>
      <span>Tarde: <strong>{stats.tarde}</strong></span>
      <span>Calificadas: <strong>{stats.calificadas}</strong></span>
    </div>
  );
}

function ListaAdjuntos({ adjuntos }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {adjuntos.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          download={a.tipo === "archivo"}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 8,
            border: "0.5px solid var(--color-border-tertiary)",
            color: "var(--color-text-info)",
            textDecoration: "none",
          }}
        >
          {a.nombre || (a.tipo === "enlace" ? "Enlace" : `Archivo ${i + 1}`)}
        </a>
      ))}
    </div>
  );
}