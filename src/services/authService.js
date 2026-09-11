// backend usa cookies httpOnly (access_token/refresh_token) — el cliente JS no lee tokens directamente
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

  // el backend espera las claves con ñ; los call sites las mandan sin ñ, se remapea aquí
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

  // Recuperación de contraseña: SOLO por correo. El backend eliminó los
  // endpoints /auth/forgot-password-phone y /auth/reset-password-phone
  // (commit "Servicio de correo" — el registro exige correo a todos y la
  // estrategia de WhatsApp/Twilio se retiró).
  forgotPassword: async (body) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),

  resetPassword: async (body) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
};

export const authChangePassword = (body) => authService.changePassword(body);
export const authCompleteRegistro = (body) =>
  apiFetch('/auth/completar-registro', { method: 'POST', body: JSON.stringify(body) });