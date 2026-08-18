// src/features/auth/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { humanizeError } from "../../../utils/humanizeError";
import { ForgotPasswordForm } from "@/components";

export const ForgotPasswordPage = () => {
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [sent,      setSent]      = useState(false);
  const [emailSent, setEmailSent] = useState("");
  const [phoneSent, setPhoneSent] = useState("");
  const [usedMethod, setUsedMethod] = useState("email");
  const navigate = useNavigate();

  const handleSubmit = async ({ correo, telefono, method }) => {
    setLoading(true);
    setError("");
    try {
      if (method === "phone") {
        await authService.forgotPasswordPhone({ telefono });
        setPhoneSent(telefono);
        setUsedMethod("phone");
      } else {
        await authService.forgotPassword({ correo });
        setEmailSent(correo);
        setUsedMethod("email");
      }
      setSent(true);
    } catch (err) {
      setError(humanizeError(err, "Ocurrió un error. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (usedMethod === "phone") {
      navigate("/reset-password", { state: { telefono: phoneSent, method: "phone" } });
    } else {
      navigate("/reset-password", { state: { correo: emailSent, method: "email" } });
    }
  };

  return (
    <ForgotPasswordForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      sent={sent}
      emailSent={emailSent}
      phoneSent={phoneSent}
      onContinue={handleContinue}
      onBack={() => navigate("/login")}
    />
  );
};
