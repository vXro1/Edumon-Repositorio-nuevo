import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { humanizeError } from "../../../utils/humanizeError";
import { ForgotPasswordForm } from "@/components";

export const ForgotPasswordPage = () => {
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [sent,      setSent]      = useState(false);
  const [emailSent, setEmailSent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async ({ correo }) => {
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword({ correo });
      setEmailSent(correo);
      setSent(true);
    } catch (err) {
      setError(humanizeError(err, "Ocurrió un error. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/reset-password", { state: { correo: emailSent, method: "email" } });
  };

  return (
    <ForgotPasswordForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      sent={sent}
      emailSent={emailSent}
      onContinue={handleContinue}
      onBack={() => navigate("/login")}
    />
  );
};
