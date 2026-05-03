// src/features/auth/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "../../../components/forms/LoginForm";
import { AuthLayout } from "../../../components/layout/AuthLayout";
import { Card } from "../../../components/ui/index";
import { humanizeError } from "../../../utils/humanizeError";

const ROLE_REDIRECTS = {
  superadmin:    "/admin",
  administrador: "/admin",
  docente:       "/docente",
  padre:         "/padre",
  "padre/tutor": "/padre",  // alias de compatibilidad
};

export const LoginPage = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Si viene de un 401 automático, mostrar aviso de sesión expirada
  const sessionExpired = searchParams.get("expired") === "1";

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const data     = await login(credentials);
      const rol      = data.user?.rol;
      const redirect = ROLE_REDIRECTS[rol] || from;
      navigate(redirect, {
        replace: true,
        state: { loginSuccess: true, nombre: data.user?.nombre, rol },
      });
    } catch (err) {
      setError(humanizeError(err, "Credenciales incorrectas. Verifica e intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay de carga durante el submit */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <div style={{ position: "relative", width: 44, height: 44 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(12,106,196,0.15)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#0C6AC4", animation: "ls-spin 0.75s linear infinite" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0C6AC4" }}>Iniciando sesión...</p>
          <style>{`@keyframes ls-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <AuthLayout>
        <Card>
          {/* Aviso de sesión expirada */}
          {sessionExpired && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: 10, marginBottom: 20,
              background: "rgba(217,119,6,0.08)",
              border: "1px solid rgba(217,119,6,0.25)",
            }}>
              <svg style={{ width: 18, height: 18, color: "#D97706", flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: 0 }}>Sesión expirada</p>
                <p style={{ fontSize: 12.5, color: "#B45309", margin: "2px 0 0" }}>Tu sesión ha vencido. Inicia sesión de nuevo para continuar.</p>
              </div>
            </div>
          )}

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-800">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-400">
              Accede con tu teléfono y contraseña
            </p>
          </div>

          <LoginForm onSubmit={handleLogin} loading={loading} error={error} />

          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{ color: "#0C6AC4" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </Card>
      </AuthLayout>
    </>
  );
};
