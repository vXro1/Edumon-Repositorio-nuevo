// Pantalla de carga de página completa — usada durante la verificación inicial de sesión
// y en las transiciones de ruta (Suspense fallback de los lazy imports).
import edumonLogo from "@/assets/icons/logo.svg";

// Mismos colores del logo (ver src/assets/icons/logo.svg) — así las burbujas
// se sienten parte de la marca en vez de decoración genérica.
const BUBBLE_COLORS = ["#0DC5E2", "#71C83A", "#F12474", "#FDBA03", "#8421CD", "#FC5891"];

export default function LoadingScreen({ message = "Cargando página, espera un momento" }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)",
        overflow: "hidden",
      }}
    >
      {/* Decoración de fondo */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(12,106,196,0.07)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(99,102,241,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* Logo + burbujas de colores flotando a su alrededor */}
      <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* halo suave detrás del logo */}
        <div style={{
          position: "absolute", width: 92, height: 92, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(12,106,196,0.14) 0%, rgba(12,106,196,0) 70%)",
          animation: "ls-halo 1.8s ease-in-out infinite",
        }} />

        {BUBBLE_COLORS.map((color, i) => {
          const angle  = (i / BUBBLE_COLORS.length) * 360;
          const radius = 58;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          const size = 9 + (i % 3) * 4;
          return (
            <div
              key={color}
              style={{
                position: "absolute",
                left: `calc(50% + ${x}px - ${size / 2}px)`,
                top:  `calc(50% + ${y}px - ${size / 2}px)`,
                width: size, height: size,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 10px ${color}80`,
                animation: `ls-float 2.4s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          );
        })}

        <img
          src={edumonLogo}
          alt="Edumon"
          style={{ width: 62, height: 62, position: "relative", animation: "ls-breathe 1.7s ease-in-out infinite" }}
        />
      </div>

      {/* Marca + mensaje */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
          Edu<span style={{ color: "var(--edu-blue-500)" }}>mon</span>
        </span>

        <p style={{
          margin: 0, fontSize: 13.5, fontWeight: 600, color: "#64748B",
          letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 4,
        }}>
          {message}
          <span style={{ display: "inline-flex", gap: 3, marginLeft: 1 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 4, height: 4, borderRadius: "50%", background: "#64748B",
                animation: `ls-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </span>
        </p>
      </div>

      <style>{`
        @keyframes ls-breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%      { transform: scale(1.1) rotate(-4deg); }
        }
        @keyframes ls-halo {
          0%, 100% { transform: scale(0.9); opacity: 0.8; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @keyframes ls-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-10px) scale(1.2); }
        }
        @keyframes ls-dot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40%           { opacity: 1;    transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
