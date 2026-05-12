// src/features/cursos/components/CursoHeader.jsx
import { UserAvatar } from "@/components";
import { useNavigate } from "react-router-dom";

export default function CursoHeader({ curso, onEdit }) {
  const navigate = useNavigate();
  const cover    = curso?.imagen || curso?.fotoPortada || "";

  return (
    <div
      style={{
        borderRadius:  "var(--radius-2xl)",
        overflow:      "hidden",
        position:      "relative",
        marginBottom:  "var(--space-5)",
        boxShadow:     "var(--shadow-md)",
      }}
    >
      {/* Cover */}
      <div
        style={{
          height:   "clamp(160px, 28vw, 260px)",
          position: "relative",
          overflow: "hidden",
          background: "var(--edu-neutral-100)",
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.onerror = null; e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--gradient-card)" }} />
        )}

        {/* Gradient overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            padding: "var(--space-4) var(--space-5)",
          }}
        >
          <h1
            style={{
              color:        "#fff",
              fontSize:     "clamp(1.1rem, 3vw, 1.5rem)",
              fontFamily:   "var(--font-display)",
              fontWeight:   "var(--font-extrabold)",
              letterSpacing:"var(--tracking-tight)",
              lineHeight:   "var(--leading-tight)",
              margin:       0,
              textShadow:   "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            {curso.nombre}
          </h1>

          {curso.docente && (
            <button
              onClick={() => navigate("/perfil")}
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         "var(--space-2)",
                marginTop:   "var(--space-2)",
                background:  "none",
                border:      "none",
                cursor:      "pointer",
                padding:     0,
              }}
            >
              <UserAvatar user={curso.docente} size={36} />
              <div style={{ textAlign: "left" }}>
                <p style={{
                  color:      "#fff",
                  fontSize:   "var(--text-sm)",
                  fontWeight: "var(--font-bold)",
                  margin:     0,
                  textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}>
                  {curso.docente.nombre} {curso.docente.apellido}
                </p>
                <p style={{
                  color:    "rgba(255,255,255,0.75)",
                  fontSize: "var(--text-xs)",
                  margin:   0,
                }}>
                  Docente
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
