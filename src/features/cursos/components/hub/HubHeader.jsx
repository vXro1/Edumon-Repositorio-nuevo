// src/features/cursos/components/hub/HubHeader.jsx
import { Users } from "lucide-react";
import { Sk } from "../shared/ui";
import { ROLES } from "@/security/roleMatrix";

export default function HubHeader({ curso, loading, role }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <Sk h={28} w={240} r={8} />
        <Sk h={14} w={160} r={6} />
      </div>
    );
  }

  if (!curso) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", marginBottom: 20 }}>
        Curso no encontrado
      </div>
    );
  }

  const roleLabel =
    role === ROLES.PADRE
      ? "Seguimiento"
      : role === ROLES.ESTUDIANTE
      ? "Mi curso"
      : "Curso";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--color-primary) 0%, #1E3A6E 100%)",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        overflow: "hidden",
        position: "relative",
        marginBottom: 20,
      }}
    >
      {curso.fotoPortada && (
        <img
          src={curso.fotoPortada}
          alt={curso.nombre}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.15,
          }}
        />
      )}
      <div style={{ position: "relative", flex: 1 }}>
        <p style={{
          fontSize: 11, fontWeight: 700,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.08em", textTransform: "uppercase",
          margin: "0 0 4px",
        }}>
          {roleLabel}
        </p>
        <h1 style={{
          fontSize: 22, fontWeight: 800,
          color: "white", margin: 0,
          letterSpacing: "-0.02em",
        }}>
          {curso.nombre}
        </h1>
        {curso.descripcion && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "6px 0 0" }}>
            {curso.descripcion}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          <span style={{
            fontSize: 12, color: "rgba(255,255,255,0.65)",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Users style={{ width: 12, height: 12 }} />
            {curso.participantes?.length ?? 0} participantes
          </span>
          {curso.docente && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              Docente: {curso.docente.nombre} {curso.docente.apellido}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}