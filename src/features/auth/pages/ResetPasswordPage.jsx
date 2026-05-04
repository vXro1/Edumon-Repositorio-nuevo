import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { authService } from "../services/authService";
import { humanizeError } from "@/utils/humanizeError";

import { ResetPasswordForm, AuthLayout, Card, Button } from "@/components";

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
      setError(humanizeError(err, "Ocurrió un error. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <Card>
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="flex items-center justify-center">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Contraseña restablecida
              </h2>
              <p className="mt-2 text-sm">
                Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.
              </p>
            </div>

            <Button
              onClick={() => navigate("/login", { replace: true })}
              variant="primary"
              size="md"
              className="w-full"
            >
              Ir al inicio de sesión
            </Button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <div className="mb-7">
          <h1 className="text-2xl font-bold">
            Restablecer contraseña
          </h1>
          <p className="mt-1 text-sm">
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
            className="flex items-center justify-center gap-1 text-sm"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
};