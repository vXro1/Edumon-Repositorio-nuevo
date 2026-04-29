// src/features/auth/hooks/useAuth.js
// ============================================================
// Hook personalizado para consumir el contexto de autenticación
// ============================================================

import { useAuthContext } from "../context/AuthContext";

/**
 * Hook principal de autenticación.
 *
 * @returns {{
 *   user: object|null,
 *   token: string|null,
 *   isAuthenticated: boolean,
 *   loading: boolean,
 *   login: (credentials: { telefono: string, contrasena: string }) => Promise<{ token, user, primerInicioSesion }>,
 *   logout: () => Promise<void>,
 * }}
 */
export const useAuth = () => {
  return useAuthContext();
};