// src/features/auth/pages/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import { humanizeError } from "@/utils/humanizeError";
import { ResetPasswordForm } from "@/components";

export const ResetPasswordPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  // Solo por correo: el backend retiró la recuperación por teléfono.
  const defaultEmail = location.state?.correo ?? "";

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async ({ correo, codigo, contrasenaNueva }) => {
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({ correo, codigo, contrasenaNueva });
      setSuccess(true);
    } catch (err) {
      setError(humanizeError(err, "Ocurrió un error. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código: reutiliza el endpoint de envío inicial (no hay una ruta
  // separada de "solo reenviar", volver a pedirlo es exactamente eso).
  const handleResend = async () => {
    if (!defaultEmail) return;
    await authService.forgotPassword({ correo: defaultEmail });
  };

  return (
    <ResetPasswordForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
      defaultEmail={defaultEmail}
      onBack={() => navigate("/login")}
      onGoLogin={() => navigate("/login", { replace: true })}
      onResend={handleResend}
    />
  );
};
