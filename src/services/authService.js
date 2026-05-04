// src/services/authService.js
// FIX: jwt_decode → jwtDecode (nombre correcto del import)
import { apiFetch, setTokenProvider } from './core/apiClient';
import { jwtDecode } from "jwt-decode";   // ← nombre correcto

const TOKEN_KEY = 'token';

export const authService = {
  login: async ({ telefono, contrasena }) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ telefono, contraseña: contrasena })
    });
    if (data?.token) {
      try { localStorage.setItem(TOKEN_KEY, data.token); } catch {}
    }
    return data;
  },

  register: async (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  getProfile: async () => {
    const data = await apiFetch('/auth/profile');
    return data.user ?? data;
  },

  changePassword: async (body) => apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {}
    finally {
      authService.clearAllCache();
    }
  },

  getToken: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },

  clearToken: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  },

  clearAllCache: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    try { sessionStorage.clear(); } catch {}
  },

  forgotPassword: async (body) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),

  resetPassword: async (body) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // ─── JWT helpers ──────────────────────────────────────────────────────────

  getTokenPayload: (token) => {
    const t = token ?? authService.getToken();
    if (!t) return null;
    try {
      return jwtDecode(t);   // ← FIX: era jwt_decode (ReferenceError silencioso)
    } catch {
      return null;
    }
  },

  isTokenExpired: (token) => {
    const payload = authService.getTokenPayload(token);
    if (!payload) return true;
    if (typeof payload.exp !== 'number') return true;
    const now = Math.floor(Date.now() / 1000);
    // Margen de gracia de 30 segundos para evitar falsos positivos por latencia de red
    return payload.exp <= now + 30;
  }
};

try { setTokenProvider(() => authService.getToken()); } catch {}