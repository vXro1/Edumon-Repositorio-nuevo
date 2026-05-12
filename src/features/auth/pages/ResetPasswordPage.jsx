// src/features/auth/pages/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import { humanizeError } from "@/utils/humanizeError";
import { ResetPasswordForm } from "@/components";

export const ResetPasswordPage = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
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

  return (
    <ResetPasswordForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
      defaultEmail={defaultEmail}
      onBack={() => navigate("/login")}
      onGoLogin={() => navigate("/login", { replace: true })}
    />
  );
};