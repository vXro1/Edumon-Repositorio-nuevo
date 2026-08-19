// src/features/auth/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { humanizeError } from "../../../utils/humanizeError";
import { LoginForm } from "@/components";
import { useToast } from "../../../context/ToastContext";
import { stashLoginPassword } from "../utils/firstLoginPassword";

const ROLE_REDIRECTS = {
  superadmin: "/admin",
  administrador: "/admin",
  docente: "/docente",
  padre: "/padre",
  "padre/tutor": "/padre",
};

export const LoginPage = () => {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sessionExpired = searchParams.get("expired") === "1";
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const data = await login(credentials);
      if (data?.primerInicioSesion) {
        stashLoginPassword(credentials.contrasena);
        navigate("/primer-inicio", { replace: true });
        return;
      }

      const rol = data.user?.rol;
      const nombre = data.user?.nombre ?? "Usuario";
      const redirect = ROLE_REDIRECTS[rol] || from;

      notify(`¡Bienvenido, ${nombre}!`, "success");

      navigate(redirect, {
        replace: true,
        state: { loginSuccess: true, nombre, rol },
      });
    } catch (err) {
      setError(humanizeError(err, "Credenciales incorrectas. Verifica e intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      loading={loading}
      error={error}
      sessionExpired={sessionExpired}
    />
  );
};