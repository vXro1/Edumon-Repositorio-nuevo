// src/features/auth/pages/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import { humanizeError } from "@/utils/humanizeError";
import { ResetPasswordForm } from "@/components";

export const ResetPasswordPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const method        = location.state?.method ?? "email";
  const defaultEmail  = location.state?.correo ?? "";
  const defaultPhone  = location.state?.telefono ?? "";

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async ({ correo, telefono, codigo, contrasenaNueva }) => {
    setLoading(true);
    setError("");
    try {
      if (method === "phone") {
        await authService.resetPasswordPhone({ telefono, codigo, contrasenaNueva });
      } else {
        await authService.resetPassword({ correo, codigo, contrasenaNueva });
      }
      setSuccess(true);
    } catch (err) {
      setError(humanizeError(err, "Ocurrió un error. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResetPasswordForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
      defaultEmail={defaultEmail}
      defaultPhone={defaultPhone}
      method={method}
      onBack={() => navigate("/login")}
      onGoLogin={() => navigate("/login", { replace: true })}
    />
  );
};
