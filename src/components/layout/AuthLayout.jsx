// src/features/auth/layouts/AuthLayout.jsx

const AuthLayout = ({ children }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)",
      }}
    >
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(12,106,196,0.08)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.07)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "30%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(12,106,196,0.04)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              borderRadius: 99,
              background: "var(--color-background, #fff)",
              boxShadow:
                "0 2px 12px rgba(12,106,196,0.12), 0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                style={{ width: 18, height: 18, color: "white" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--color-text, #0F172A)",
                letterSpacing: "-0.02em",
              }}
            >
              Edu<span style={{ color: "#0C6AC4" }}>mon</span>
            </span>
          </div>

          <p
            style={{
              marginTop: 10,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted, #94A3B8)",
            }}
          >
            Plataforma Educativa
          </p>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;