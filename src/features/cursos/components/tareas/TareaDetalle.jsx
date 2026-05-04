// src/features/cursos/components/tareas/TareaDetalle.jsx
import {
  CheckSquare,
  Clock,
  Download,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge, Button } from "@/components";
import { InfoBlock } from "../shared/ui";

/* ─────────────────────────────────────────────
   HELPERS (si ya los tienes, puedes eliminarlos)
───────────────────────────────────────────── */

export const fmt = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const fmtHour = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const esPasada = (fecha) => {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
};

/* ───────────────────────────────────────────── */

export default function TareaDetalle({
  tarea: t,
  canManage,
  canGrade,
  esPadre,
  onEdit,
  onDelete,
  onViewEntregas,
}) {
  const archivos = (t.archivosAdjuntos ?? []).filter(
    (a) => a.tipo === "archivo"
  );

  const enlaces = (t.archivosAdjuntos ?? []).filter(
    (a) => a.tipo === "enlace"
  );

  const docente =
    typeof t.docenteId === "object"
      ? `${t.docenteId.nombre ?? ""} ${t.docenteId.apellido ?? ""}`.trim()
      : null;

  const modulo =
    typeof t.moduloId === "object" ? t.moduloId.titulo : null;

  const curso =
    typeof t.cursoId === "object" ? t.cursoId.nombre : null;

  const vencida = esPasada(t.fechaEntrega);

  const fecha = t.fechaEntrega ?? t.fechaVencimiento;

  const participantes = t.participantesSeleccionados ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge variant={vencida ? "error" : "info"} styleType="soft" size="sm">
          {vencida ? "Vencida" : "Activa"}
        </Badge>

        <Badge
          variant={t.asignacionTipo === "todos" ? "success" : "warning"}
          styleType="soft"
          size="sm"
        >
          {t.asignacionTipo === "todos" ? "Para todos" : "Seleccionados"}
        </Badge>

        {t.estado && (
          <Badge variant="neutral" styleType="soft" size="sm">
            {t.estado}
          </Badge>
        )}
      </div>

      {/* Descripción */}
      <InfoBlock label="Descripción">
        <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.7 }}>
          {t.descripcion?.trim() ? (
            t.descripcion
          ) : (
            <span style={{ opacity: 0.6, fontStyle: "italic" }}>
              Sin descripción
            </span>
          )}
        </p>
      </InfoBlock>

      {/* Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {fecha && (
          <InfoBlock label="Fecha de entrega">
            <p
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Clock size={12} />
              {fmt(fecha)} {fmtHour(fecha)}
            </p>
          </InfoBlock>
        )}

        {docente && (
          <InfoBlock label="Docente">
            <p style={{ margin: 0 }}>{docente}</p>
          </InfoBlock>
        )}

        {curso && (
          <InfoBlock label="Curso">
            <p style={{ margin: 0 }}>{curso}</p>
          </InfoBlock>
        )}

        {modulo && (
          <InfoBlock label="Módulo">
            <p style={{ margin: 0 }}>{modulo}</p>
          </InfoBlock>
        )}
      </div>

      {/* Participantes */}
      {participantes.length > 0 && (
        <InfoBlock label={`Asignada a (${participantes.length})`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {participantes.map((p) => {
              const nombre =
                typeof p === "object"
                  ? `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim()
                  : p;

              const key = typeof p === "object" ? p._id ?? nombre : p;

              return (
                <span
                  key={key}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#e6f0ff",
                    color: "#0C6AC4",
                    fontWeight: 600,
                  }}
                >
                  {nombre}
                </span>
              );
            })}
          </div>
        </InfoBlock>
      )}

      {/* Archivos */}
      {archivos.length > 0 && (
        <InfoBlock label={`Archivos (${archivos.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {archivos.map((adj, i) => (
              <a
                key={adj._id ?? i}
                href={adj.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <FileText size={14} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {adj.nombre}
                  </p>
                </div>
                <Download size={14} />
              </a>
            ))}
          </div>
        </InfoBlock>
      )}

      {/* Enlaces */}
      {enlaces.length > 0 && (
        <InfoBlock label={`Enlaces (${enlaces.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {enlaces.map((enlace, i) => (
              <a
                key={enlace._id ?? i}
                href={enlace.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0C6AC4", fontWeight: 600 }}
              >
                🔗 {enlace.nombre || enlace.url}
              </a>
            ))}
          </div>
        </InfoBlock>
      )}

      {/* Acciones */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          borderTop: "1px solid #eee",
          paddingTop: 10,
        }}
      >
        {canGrade && !esPadre && (
          <Button onClick={onViewEntregas}>
            <CheckSquare size={14} /> Ver entregas
          </Button>
        )}

        {esPadre && (
          <Button onClick={onViewEntregas}>
            <CheckSquare size={14} /> Ver mi entrega
          </Button>
        )}

        {canManage && (
          <>
            <Button variant="ghost" onClick={() => onEdit(t)}>
              <Pencil size={14} /> Editar
            </Button>

            <Button
              variant="ghost"
              style={{ color: "red" }}
              onClick={() => onDelete(t._id)}
            >
              <Trash2 size={14} /> Eliminar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}