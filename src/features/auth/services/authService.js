// src/features/auth/services/authService.js
import {
  authLogin, authGetProfile, authLogout,
  authForgotPassword, authResetPassword,
} from "../../../lib/apiClient";

const TOKEN_KEY = "token";

export const authService = {
  login: async ({ telefono, contrasena }) => {
    const data = await authLogin({ telefono, contrasena });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  },

  getProfile: async () => {
    const data = await authGetProfile();
    // La API puede devolver { user } o el objeto directamente
    return data.user ?? data;
  },

  logout: async () => {
    try {
      await authLogout();
    } catch {
      // Ignorar errores del backend al cerrar sesión
    } finally {
      authService.clearAllCache();
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  /*
   * clearAllCache — limpia token + cualquier dato cacheado en storage.
   * Llamar siempre al hacer logout o al recibir 401.
   */
  clearAllCache: () => {
    localStorage.removeItem(TOKEN_KEY);
    // Limpia cualquier otra clave de la app (añadir aquí si se agregan más)
    sessionStorage.clear();
  },

  forgotPassword: async ({ correo }) => authForgotPassword({ correo }),

  resetPassword: async ({ correo, codigo, contrasenaNueva }) =>
    authResetPassword({ correo, codigo, contrasenaNueva }),
};
