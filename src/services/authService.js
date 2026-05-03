// src/services/authService.js
// Central authService (single source of truth for auth logic)
import { apiFetch, setTokenProvider } from './core/apiClient';
import jwt_decode from 'jwt-decode';

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
    } catch (e) {
      // ignore
    } finally {
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

  // JWT helpers
  getTokenPayload: (token) => {
    const t = token ?? authService.getToken();
    if (!t) return null;
    try {
      return jwt_decode(t);
    } catch (e) {
      return null;
    }
  },

  isTokenExpired: (token) => {
    const payload = authService.getTokenPayload(token);
    if (!payload) return true;
    // exp is in seconds since epoch
    if (typeof payload.exp !== 'number') return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }
};

// register token provider so apiClient doesn't need to read localStorage
try { setTokenProvider(() => authService.getToken()); } catch (e) { /* ignore in environments where module init order differs */ }

