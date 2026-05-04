// src/features/cursos/components/CursoParticipantesTab.jsx
// Este componente nunca se renderiza si el rol no tiene VIEW_COURSE_PARTICIPANTS.
// La protección doble vive en CursoHubPage — aquí el componente asume
// que quien lo ve ya tiene el permiso. No repite la verificación.
import React from "react";
import { UserAvatar, Badge } from "@/components";
import { useAuthContext } from "../../../features/auth/context/AuthContext";
import { tienePermiso } from "../../../security/roleMatrix";
import { PERMISSIONS } from "../../../security/permissions";
export default function CursoParticipantesTab({ data = [], onAdd }) {
  const { user } = useAuthContext();
  const rol = user?.role ?? user?.rol ?? "";

  // El botón "Agregar" solo aparece para quien puede gestionar participantes.
  // MANAGE_COURSE_PARTICIPANTS → admin y docente (ver roleMatrix.js)
  const puedeAgregar = tienePermiso(rol, PERMISSIONS.MANAGE_COURSE_PARTICIPANTS);

  return (
    <div
      role="tabpanel"
      id="tabpanel-participants"
      aria-label="Participantes del curso"
    >
      {puedeAgregar && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={onAdd}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--color-text-info)",
              color: "white",
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Agregar participante
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <ParticipantesList data={data} />
      )}
    </div>
  );
}

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

function ParticipantesList({ data }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {data.map((p) => {
        // Defensa contra objetos no populados: si p.usuario es un string ID,
        // mostramos fallback en lugar de crashear con .nombre
        const usuario = typeof p.usuario === "object" ? p.usuario : null;
        const nombre = usuario
          ? `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim()
          : `ID: ${String(p.usuario).slice(-6)}`;

        return (
          <li
            key={p.usuario?._id ?? p.usuario}
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

// Badge visual para la etiqueta del participante ("padre" o "docente")
// Fuente: campo etiqueta del endpoint GET /cursos/:id/participantes
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