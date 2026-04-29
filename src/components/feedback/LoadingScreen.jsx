// src/components/feedback/LoadingScreen.jsx
// Pantalla de carga de página completa — usada durante la verificación inicial de sesión

export default function LoadingScreen({ message = "Cargando..." }) {
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
        gap: 20,
        background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)",
      }}
    >
      {/* Decoración de fondo */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(12,106,196,0.07)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(99,102,241,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 99, background: "white", boxShadow: "0 2px 12px rgba(12,106,196,0.12), 0 1px 3px rgba(0,0,0,0.06)", position: "relative" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg style={{ width: 17, height: 17, color: "white" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
          Edu<span style={{ color: "#0C6AC4" }}>mon</span>
        </span>
      </div>

      {/* Spinner */}
      <div style={{ position: "relative", width: 44, height: 44 }}>
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "3px solid rgba(12,106,196,0.15)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "#0C6AC4",
          animation: "ls-spin 0.75s linear infinite",
        }} />
      </div>

      {/* Mensaje */}
      <p style={{ fontSize: 13.5, fontWeight: 600, color: "#64748B", letterSpacing: "0.01em", position: "relative" }}>
        {message}
      </p>

      <style>{`
        @keyframes ls-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
