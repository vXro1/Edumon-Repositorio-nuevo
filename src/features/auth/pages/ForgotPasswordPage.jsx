// src/features/auth/pages/ForgotPasswordPage.jsx
// ============================================================
// Página de recuperación de contraseña — Paso 1: ingresar correo
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { ForgotPasswordForm } from "../../../components/forms/ForgotPasswordForm";
import { AuthLayout } from "../../../components/layout/AuthLayout";
import { Card } from "../../../components/ui/index";

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
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
      // El backend siempre responde 200 por seguridad,
      // pero si hay error de red u otro, lo mostramos
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <Card>
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Revisa tu correo</h2>
              <p className="mt-2 text-sm text-slate-500">
                Si <span className="font-semibold text-slate-700">{emailSent}</span> está registrado,
                recibirás un código de recuperación en los próximos minutos.
              </p>
            </div>
            <button
              onClick={() => navigate("/reset-password", { state: { correo: emailSent } })}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Tengo mi código → Continuar
            </button>
            <Link to="/login" className="text-sm text-slate-400 hover:text-slate-600">
              Volver al inicio de sesión
            </Link>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-800">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ingresa tu correo registrado
          </p>
        </div>

        <ForgotPasswordForm onSubmit={handleSubmit} loading={loading} error={error} />

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
};