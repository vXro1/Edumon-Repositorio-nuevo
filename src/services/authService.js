// src/services/authService.js
// Backend usa cookies httpOnly (access_token / refresh_token).
// El cliente JS no maneja ni lee tokens directamente.
import { apiFetch } from './core/apiClient';

export const authService = {
  login: async ({ telefono, contrasena }) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ telefono, contraseña: contrasena }),
    });
  },

  register: async (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // silentAuth: true → un 401 aquí no dispara el logout global (ver apiClient.js)
  getProfile: async () => {
    const data = await apiFetch('/auth/profile', { silentAuth: true });
    return data.user ?? data;
  },

  // El backend espera contraseñaActual/contraseñaNueva (con ñ) — se remapea
  // aquí porque ambos call sites (FirstLoginScreen, PerfilPage) usan las
  // claves sin ñ, y el mismatch hacía que change-password devolviera 400
  // ("La contraseña actual y la nueva son obligatorias") en cada intento.
  changePassword: async ({ contrasenaActual, contrasenaNueva }) =>
    apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ contraseñaActual: contrasenaActual, contraseñaNueva: contrasenaNueva }),
    }),

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {}
    finally {
      authService.clearAllCache();
    }
  },

  clearAllCache: () => {
    try { sessionStorage.clear(); } catch {}
  },

  forgotPassword: async (body) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),

  resetPassword: async (body) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  forgotPasswordPhone: async (body) => apiFetch('/auth/forgot-password-phone', { method: 'POST', body: JSON.stringify(body) }),

  resetPasswordPhone: async ({ telefono, codigo, contrasenaNueva }) =>
    apiFetch('/auth/reset-password-phone', {
      method: 'POST',
      body: JSON.stringify({ telefono, codigo, contraseñaNueva: contrasenaNueva }),
    }),
};

export const authChangePassword = (body) => authService.changePassword(body);
export const authCompleteRegistro = (body) =>
  apiFetch('/auth/completar-registro', { method: 'POST', body: JSON.stringify(body) });