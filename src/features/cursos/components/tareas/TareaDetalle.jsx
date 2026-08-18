// src/features/cursos/components/tareas/TareaDetalle.jsx

import {
  Calendar,
  CheckSquare,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Link as LinkIcon,
  Pencil,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { Badge, Button } from "@/components";
import { InfoBlock } from "../shared/ui";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

export const fmt = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
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

function resolverEstadoBadge(t, vencida) {
  if (t.estado === "cerrada") return { label: "Cerrada", variant: "neutral" };
  if (vencida) return { label: "Vencida", variant: "error" };
  return { label: "Activa", variant: "info" };
}

// Texto legible por tipo de entrega — el backend guarda el value crudo
// ("archivo", "multimedia"...), esto lo traduce a lo que ve el usuario.
const TIPO_ENTREGA_LABELS = {
  archivo: "Archivo / Documento",
  texto: "Texto en línea",
  enlace: "Enlace (URL)",
  multimedia: "Multimedia",
  presencial: "Presencial",
  grupal: "Grupal",
};

// Insignia de color por extensión — mismo criterio que se usa en TareaForm,
// así el usuario reconoce visualmente qué tipo de archivo va a abrir.
const FILE_BADGES = {
  pdf: { label: "PDF", bg: "#FEE2E2", fg: "var(--color-error-hover)" },
  doc: { label: "DOC", bg: "#DBEAFE", fg: "#2563EB" },
  docx: { label: "DOCX", bg: "#DBEAFE", fg: "#2563EB" },
  xls: { label: "XLS", bg: "#DCFCE7", fg: "var(--edu-green-600)" },
  xlsx: { label: "XLSX", bg: "#DCFCE7", fg: "var(--edu-green-600)" },
  ppt: { label: "PPT", bg: "#FFEDD5", fg: "#EA580C" },
  pptx: { label: "PPTX", bg: "#FFEDD5", fg: "#EA580C" },
  zip: { label: "ZIP", bg: "#F3E8FF", fg: "#9333EA" },
  jpg: { label: "IMG", bg: "#F1F5F9", fg: "#475569" },
  jpeg: { label: "IMG", bg: "#F1F5F9", fg: "#475569" },
  png: { label: "IMG", bg: "#F1F5F9", fg: "#475569" },
};
function getFileBadge(name = "") {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return (
    FILE_BADGES[ext] || {
      label: ext ? ext.slice(0, 4).toUpperCase() : "FILE",
      bg: "#F1F5F9",
      fg: "#64748B",
    }
  );
}

function getDomain(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function nombreCompleto(p) {
  return `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim();
}

// El backend a veces manda estos campos como null, undefined, o incluso un
// objeto (por ejemplo un error de populate). String(...) los normaliza a
// texto sin explotar, a diferencia de asumir que siempre es un string.
function safeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

/* ─────────────────────────────────────────────
   SUBCOMPONENTES DE PRESENTACIÓN
───────────────────────────────────────────── */

// Fila de metadato en el panel lateral: ícono + etiqueta + valor.
// Se salta el render si no hay valor, así el panel nunca deja huecos.
function MetaRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(99,102,241,0.08)",
          color: "#6366F1",
        }}
      >
        <Icon size={14} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {label}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#222", marginTop: 2, lineHeight: 1.4 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AdjuntoLink({ href, iconNode, titulo, subtitulo, trailing }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 8,
        border: "1px solid #ececec",
        textDecoration: "none",
        color: "inherit",
        transition: "background 120ms, border-color 120ms",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#d4d4d8"; e.currentTarget.style.background = "#fafafa"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ececec"; e.currentTarget.style.background = "transparent"; }}
    >
      {iconNode}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 13.5,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {titulo}
        </span>
        {subtitulo && <span style={{ fontSize: 11.5, color: "#888" }}>{subtitulo}</span>}
      </span>
      {trailing}
    </a>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */

export default function TareaDetalle({
  tarea: t,
  canManage,
  canGrade,
  esPadre,
  onEdit,
  onDelete,
  onViewEntregas,
}) {
  const todosAdjuntos = t.adjuntos ?? t.archivosAdjuntos ?? [];
  const archivos = todosAdjuntos.filter((a) => a.tipo !== "enlace");
  const enlaces = todosAdjuntos.filter((a) => a.tipo === "enlace");

  const docente = t.docente
    ? nombreCompleto(t.docente)
    : typeof t.docenteId === "object"
      ? nombreCompleto(t.docenteId)
      : "";
  const docenteCorreo = typeof t.docenteId === "object" ? t.docenteId.correo : t.docente?.correo;

  const curso = t.curso?.nombre ?? (typeof t.cursoId === "object" ? t.cursoId.nombre : "");
  const cursoNivel = typeof t.cursoId === "object" ? t.cursoId.nivel : "";

  const moduloTitulo = t.modulo?.titulo ?? (typeof t.moduloId === "object" ? t.moduloId.titulo : "");
  const moduloDescripcion = t.modulo?.descripcion ?? (typeof t.moduloId === "object" ? t.moduloId.descripcion : "");

  const fechaEntrega = t.fechaEntrega ?? t.fechaVencimiento;
  const vencida = esPasada(fechaEntrega);
  const estadoBadge = resolverEstadoBadge(t, vencida);

  const fechaCreacion = t.createdAt ?? t.fechaCreacion;
  const fechaActualizacion = t.updatedAt ?? t.fechaActualizacion;

  const titulo = t.titulo || "Sin título";
  const descripcion = safeText(t.descripcion);
  const criterios = safeText(t.criterios);
  const observaciones = safeText(t.observaciones);

  const etiquetas = t.etiquetas ?? [];
  const tipoEntregaLabel = TIPO_ENTREGA_LABELS[t.tipoEntrega] ?? t.tipoEntrega;

  // Participantes: solo tiene sentido listarlos cuando la asignación es
  // "seleccionados" — con "todos" ya lo dice el badge, listar cada uno del
  // curso sería ruido, no información útil.
  const participantesSeleccionados = t.participantesSeleccionados ?? [];
  const mostrarListaParticipantes =
    t.asignacionTipo === "seleccionados" && participantesSeleccionados.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Encabezado: título + badges ─────────────────────────── */}
      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "#222", lineHeight: 1.3 }}>
          {titulo}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Badge variant={estadoBadge.variant} styleType="soft" size="sm">
            {estadoBadge.label}
          </Badge>
          <Badge variant={t.asignacionTipo === "todos" ? "success" : "warning"} styleType="soft" size="sm">
            {t.asignacionTipo === "todos" ? "Para todos" : "Participantes seleccionados"}
          </Badge>
          {tipoEntregaLabel && (
            <Badge variant="neutral" styleType="soft" size="sm">
              {tipoEntregaLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Cuerpo: contenido principal + panel lateral ─────────── */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Columna principal */}
        <div style={{ flex: "2 1 380px", minWidth: 280, display: "flex", flexDirection: "column", gap: 18 }}>
          <InfoBlock label="Descripción">
            <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>
              {descripcion || <span style={{ opacity: 0.6, fontStyle: "italic" }}>Sin descripción</span>}
            </p>
          </InfoBlock>

          {criterios && (
            <InfoBlock label="Criterios de evaluación">
              <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>{criterios}</p>
            </InfoBlock>
          )}

          {observaciones && (
            <InfoBlock label="Observaciones">
              <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>{observaciones}</p>
            </InfoBlock>
          )}

          {archivos.length > 0 && (
            <InfoBlock label={`Archivos adjuntos (${archivos.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {archivos.map((a, i) => {
                  const badge = getFileBadge(a.nombre);
                  return (
                    <AdjuntoLink
                      key={a.publicId ?? i}
                      href={a.url}
                      titulo={a.nombre || "Archivo"}
                      iconNode={
                        <span
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                            background: badge.bg, color: badge.fg, fontSize: 10, fontWeight: 800,
                          }}
                        >
                          {badge.label}
                        </span>
                      }
                      trailing={<Download size={15} style={{ flexShrink: 0, opacity: 0.5 }} />}
                    />
                  );
                })}
              </div>
            </InfoBlock>
          )}

          {enlaces.length > 0 && (
            <InfoBlock label={`Enlaces (${enlaces.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {enlaces.map((e, i) => {
                  const domain = getDomain(e.url);
                  return (
                    <AdjuntoLink
                      key={e.publicId ?? i}
                      href={e.url}
                      titulo={e.nombre || domain || e.url}
                      subtitulo={domain}
                      iconNode={
                        <span
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                            background: "#EFF6FF", color: "#2563EB",
                          }}
                        >
                          <LinkIcon size={14} />
                        </span>
                      }
                    />
                  );
                })}
              </div>
            </InfoBlock>
          )}

          {archivos.length === 0 && enlaces.length === 0 && (
            <InfoBlock label="Material adjunto">
              <p style={{ margin: 0, fontSize: 13.5, opacity: 0.6, fontStyle: "italic" }}>
                Esta tarea no tiene archivos ni enlaces adjuntos
              </p>
            </InfoBlock>
          )}
        </div>

        {/* Panel lateral: datos de contexto de la tarea */}
        <div
          style={{
            flex: "1 1 240px",
            minWidth: 240,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 16,
            borderRadius: 12,
            background: "#fafafa",
            border: "1px solid #ececec",
          }}
        >
          {fechaEntrega && (
            <MetaRow icon={Clock} label="Fecha de entrega">
              {fmt(fechaEntrega)} · {fmtHour(fechaEntrega)}
            </MetaRow>
          )}

          {curso && (
            <MetaRow icon={Users} label="Curso">
              {curso}
              {cursoNivel && <span style={{ display: "block", fontWeight: 400, color: "#777", fontSize: 12 }}>Nivel: {cursoNivel}</span>}
            </MetaRow>
          )}

          {moduloTitulo && (
            <MetaRow icon={FolderOpen} label="Módulo">
              {moduloTitulo}
              {moduloDescripcion && (
                <span style={{ display: "block", fontWeight: 400, color: "#777", fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
                  {moduloDescripcion}
                </span>
              )}
            </MetaRow>
          )}

          {docente && (
            <MetaRow icon={User} label="Docente">
              {docente}
              {docenteCorreo && (
                <span style={{ display: "block", fontWeight: 400, color: "#777", fontSize: 12 }}>{docenteCorreo}</span>
              )}
            </MetaRow>
          )}

          {mostrarListaParticipantes && (
            <MetaRow icon={Users} label={`Participantes (${participantesSeleccionados.length})`}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
                {participantesSeleccionados.map((p, i) => (
                  <span
                    key={p._id ?? i}
                    style={{
                      fontSize: 12, fontWeight: 500, padding: "3px 8px",
                      borderRadius: 999, background: "#fff",
                      border: "1px solid #e5e5e5", color: "#444",
                    }}
                  >
                    {nombreCompleto(p) || "Participante"}
                  </span>
                ))}
              </div>
            </MetaRow>
          )}

          {etiquetas.length > 0 && (
            <MetaRow icon={Tag} label="Etiquetas">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
                {etiquetas.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: "3px 9px",
                      borderRadius: 999, background: "rgba(99,102,241,0.10)",
                      color: "#6366F1",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </MetaRow>
          )}

          {/* Trazabilidad — solo relevante para quien gestiona la tarea */}
          {canManage && (fechaCreacion || fechaActualizacion) && (
            <div style={{ paddingTop: 12, borderTop: "1px solid #ececec", display: "flex", flexDirection: "column", gap: 10 }}>
              {fechaCreacion && (
                <MetaRow icon={Calendar} label="Creada">
                  {fmt(fechaCreacion)} · {fmtHour(fechaCreacion)}
                </MetaRow>
              )}
              {fechaActualizacion && (
                <MetaRow icon={Calendar} label="Última actualización">
                  {fmt(fechaActualizacion)} · {fmtHour(fechaActualizacion)}
                </MetaRow>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          gap: 10,
          borderTop: "1px solid #ececec",
          paddingTop: 18,
        }}
      >
        {canGrade && !esPadre && (
          <Button onClick={onViewEntregas}>
            <CheckSquare size={15} />
            Ver entregas
          </Button>
        )}

        {esPadre && (
          <Button onClick={onViewEntregas}>
            <CheckSquare size={15} />
            Ver mi entrega
          </Button>
        )}

        {canManage && (
          <>
            <Button variant="ghost" onClick={() => onEdit(t)}>
              <Pencil size={15} />
              Editar
            </Button>

            <Button variant="ghost" onClick={() => onDelete(t._id)} style={{ color: "var(--color-error-hover)" }}>
              <Trash2 size={15} />
              Eliminar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}