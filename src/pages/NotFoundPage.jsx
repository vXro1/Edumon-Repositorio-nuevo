import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

const HOME_BY_ROLE = {
  superadmin:   "/admin",
  administrador:"/admin",
  docente:      "/docente",
  padre:        "/padre",
  "padre/tutor":"/padre",
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = HOME_BY_ROLE[user?.rol] ?? (user ? "/dashboard" : "/");

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
      background: "var(--color-bg, #f8fafc)",
    }}>
      <div style={{
        fontSize: 88, fontWeight: 800, letterSpacing: "-4px",
        color: "var(--edu-blue-500)", lineHeight: 1,
        marginBottom: 8,
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 22, fontWeight: 700, margin: "0 0 10px",
        color: "var(--color-text, #111)",
      }}>
        Página no encontrada
      </h1>

      <p style={{
        fontSize: 14, color: "var(--color-text-muted, #64748b)",
        maxWidth: 360, margin: "0 0 32px", lineHeight: 1.6,
      }}>
        La dirección que escribiste no existe o fue movida. Puede que el enlace esté
        desactualizado.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: "1.5px solid var(--color-border, #e2e8f0)",
            background: "var(--color-surface, #fff)",
            color: "var(--color-text, #111)", cursor: "pointer",
          }}
        >
          ← Volver
        </button>
        <button
          onClick={() => navigate(home)}
          style={{
            padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: "none", background: "var(--edu-blue-500)",
            color: "#fff", cursor: "pointer",
          }}
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
