// src/features/auth/pages/ResetPasswordPage.jsx

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import { ResetPasswordForm } from "../../../components/forms/ResetPasswordForm";
import { AuthLayout } from "../../../components/layout/AuthLayout";
import { Card } from "../../../components/ui/index";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultEmail = location.state?.correo ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async ({ correo, codigo, contrasenaNueva }) => {
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({ correo, codigo, contrasenaNueva });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <Card>
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Contraseña restablecida</h2>
              <p className="mt-2 text-sm text-slate-500">
                Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.
              </p>
            </div>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Ir al inicio de sesión
            </button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-800">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ingresa el código recibido y tu nueva contraseña
          </p>
        </div>

        <ResetPasswordForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          defaultEmail={defaultEmail}
        />

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
