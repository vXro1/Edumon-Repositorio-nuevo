// src/features/cursos/components/CursoParticipantesTab.jsx
//
// Cambios respecto a la versión anterior:
//   ✦ Botón "Carga masiva CSV" junto a "Agregar participante" (solo MANAGE_COURSE_PARTICIPANTS)
//   ✦ Abre CsvUploadModal con plantilla de padres integrada
//   ✦ Llama a cursosAddParticipantesCsv (FormData con campo archivoCSV)
//   ✦ Recibe cursoId como prop para construir el endpoint correcto
//   ✦ onAdd sigue funcionando igual (agregar individual)
//   ✦ FIX: getParticipantesCurso devuelve el usuario APLANADO (nombre/apellido/correo
//     directo sobre el participante), no anidado en "usuario". ParticipantesList ahora
//     soporta ambos shapes para no depender de que el padre lo normalice antes.
//
// Props:
//   data      {Array}   — lista de participantes (poblada, aplanada, o con ID)
//   cursoId   {string}  — ID del curso (requerido para carga masiva)
//   onAdd     {fn}      — abre el modal de agregar individual
//   onRefresh {fn}      — callback para recargar la lista tras carga masiva

import React, { useState } from "react";
import { UserAvatar, CsvUploadModal } from "@/components";
import { useAuthContext } from "../../../features/auth/context/AuthContext";
import { tienePermiso } from "../../../security/roleMatrix";
import { PERMISSIONS } from "../../../security/permissions";
import { cursosAddParticipantesCsv } from "@/features/cursos/services/cursosService";
import { descargarPlantillaPadresCSV, CSV_COLUMNAS_PADRES } from "../../../components/ui/PadresCsvTemplate";

export default function CursoParticipantesTab({ data = [], cursoId, onAdd, onRefresh }) {
  const { user } = useAuthContext();
  const rol = user?.role ?? user?.rol ?? "";

  const puedeAgregar = tienePermiso(rol, PERMISSIONS.MANAGE_COURSE_PARTICIPANTS);

  const [csvModalAbierto, setCsvModalAbierto] = useState(false);

  // ── Handler de carga CSV ──────────────────────────────────────────────────
  // Construye el FormData y llama al endpoint.
  // El resultado del backend se pasa tal cual al modal para mostrar el resumen.
  const handleCsvUpload = async (file) => {
    const formData = new FormData();
    formData.append("archivoCSV", file);
    const res = await cursosAddParticipantesCsv(cursoId, formData);
    // Recargar lista tras carga exitosa (aunque haya errores parciales)
    if (typeof onRefresh === "function") onRefresh();
    return res; // { total, exitosos, fallidos, detalle[] } según el backend
  };

  return (
    <div
      role="tabpanel"
      id="tabpanel-participants"
      aria-label="Participantes del curso"
    >
      {/* ── Barra de acciones (solo para quien puede gestionar) ── */}
      {puedeAgregar && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {/* Carga masiva CSV */}
          <button
            onClick={() => setCsvModalAbierto(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border-tertiary)",
              background: "var(--color-background-primary)",
              color: "var(--color-text-info)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <CsvIcon />
            Carga masiva CSV
          </button>

          {/* Agregar individual */}
          <button
            onClick={onAdd}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--color-text-info)",
              color: "white",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Agregar participante
          </button>
        </div>
      )}

      {/* ── Lista o estado vacío ── */}
      {data.length === 0 ? <EmptyState /> : <ParticipantesList data={data} />}

      {/* ── Modal de carga CSV ── */}
      <CsvUploadModal
        isOpen={csvModalAbierto}
        onClose={() => setCsvModalAbierto(false)}
        onUpload={handleCsvUpload}
        onDownloadTemplate={descargarPlantillaPadresCSV}
        title="Carga masiva de padres de familia"
        description="Sube un archivo CSV con los datos de los padres. Si el usuario ya existe (por cédula), se agrega directamente al curso."
        templateLabel="Descargar plantilla"
        acceptedColumns={CSV_COLUMNAS_PADRES}
        maxFileSizeMB={5}
      />
    </div>
  );
}

// ─── Ícono CSV inline (sin dependencia extra) ─────────────────────────────────
function CsvIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      style={{
        padding: 24,
        background: "var(--color-background-secondary)",
        borderRadius: 12,
        border: "0.5px solid var(--color-border-tertiary)",
        fontSize: 14,
        color: "var(--color-text-secondary)",
        textAlign: "center",
      }}
    >
      No hay participantes en este curso.
    </div>
  );
}

// ─── Resolución del usuario a partir del participante ─────────────────────────
// Soporta 3 shapes posibles:
//   1) Aplanado (lo que devuelve getParticipantesCurso): { _id, nombre, apellido, correo, ... }
//   2) Anidado y populado: { usuario: { _id, nombre, apellido, correo, ... }, etiqueta }
//   3) Anidado sin popular: { usuario: "id-string", etiqueta }
function resolverUsuario(p) {
  if (p.usuario && typeof p.usuario === "object") return p.usuario;
  if (p.nombre || p.apellido || p.correo) return p; // shape aplanado
  return null; // solo tenemos un ID, sin datos poblados
}

function resolverIdParaKey(p) {
  return p._id ?? (typeof p.usuario === "object" ? p.usuario._id : p.usuario) ?? p.correo;
}

// ─── Lista de participantes ───────────────────────────────────────────────────
function ParticipantesList({ data }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {data.map((p) => {
        const usuario = resolverUsuario(p);
        const nombre = usuario
          ? `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim()
          : `ID: ${String(typeof p.usuario === "object" ? p.usuario?._id : p.usuario ?? "").slice(-6)}`;

        return (
          <li
            key={resolverIdParaKey(p)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "0.5px solid var(--color-border-tertiary)",
              marginBottom: 8,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <UserAvatar user={usuario} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nombre || "Sin nombre"}
              </div>
              {usuario?.correo && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {usuario.correo}
                </div>
              )}
            </div>
            <EtiquetaBadge etiqueta={p.etiqueta} />
          </li>
        );
      })}
    </ul>
  );
}

// ─── Badge de etiqueta ────────────────────────────────────────────────────────
const BADGE_STYLES = {
  docente: {
    background: "var(--color-background-info)",
    color: "var(--color-text-info)",
  },
  padre: {
    background: "var(--color-background-secondary)",
    color: "var(--color-text-secondary)",
  },
};

function EtiquetaBadge({ etiqueta }) {
  if (!etiqueta) return null;
  const style = BADGE_STYLES[etiqueta] ?? BADGE_STYLES.padre;
  return (
    <span
      style={{
        ...style,
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 10,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {etiqueta}
    </span>
  );
}