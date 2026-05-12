import { queueRequest, makeKey, abortAll } from './requestQueue';
import { requestInterceptors, responseInterceptors } from './interceptors';

// Core utilities ONLY (NO endpoints here)

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

if (import.meta.env.DEV) {
}

// Logout callback (provided by AuthProvider)
let _logoutCallback = null;
let _handling401 = false;

// Token provider must be registered by authService to avoid reading localStorage here
let _tokenProvider = null;
export const setTokenProvider = (fn) => { _tokenProvider = fn; };

export const registerLogoutCallback = (cb) => {
  _logoutCallback = cb;
};

function applyReqInterceptors(url, opts) {
  let ctx = { url, opts };
  for (const fn of requestInterceptors) {
    const out = fn(ctx);
    if (out) ctx = out;
  }
  return ctx;
}

function applyResInterceptors(res) {
  let out = res;
  for (const fn of responseInterceptors) {
    const maybe = fn(out);
    if (maybe !== undefined) out = maybe;
  }
  return out;
}

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  // token must be provided via registered token provider (authService)
  const token = _tokenProvider ? _tokenProvider() : undefined;

  const opts = { method: "GET", ...options };
  opts.headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opts.headers,
  };

  const { url: finalUrl, opts: finalOpts } = applyReqInterceptors(url, opts);
  const key = makeKey(finalUrl, finalOpts);

  return queueRequest(key, async (signal) => {
    finalOpts.signal = signal;
    const res = await fetch(finalUrl, finalOpts);

    applyResInterceptors(res);

    let data = {};
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try { data = await res.json(); } catch {}
    }

    if (res.status === 401) {
      // Login fallido por credenciales incorrectas — NO disparar el logout global
      if (endpoint === "/auth/login") {
        throw new Error(data.message || "Teléfono o contraseña incorrectos. Verifica tus credenciales.");
      }
      // Cualquier otro 401 = sesión expirada → logout automático (una sola vez)
      if (!_handling401) {
        _handling401 = true;
        try {
          if (_logoutCallback) await _logoutCallback();
        } finally { _handling401 = false; }
      }
      throw new Error(data.message || "Sesión expirada. Por favor inicia sesión de nuevo.");
    }

    if (!res.ok) {
      const errorMsg = data.message || data.error || `Error ${res.status}`;
      if (res.status === 400 && Array.isArray(data.errors)) {
        const details = data.errors.map(e => (e.field ? `${e.field}: ${e.message}` : e.message)).join(", ");
        throw new Error(`${errorMsg} - ${details}`);
      }
      throw new Error(errorMsg);
    }

    return data;
  });
};

export const apiFetchFormData = async (endpoint, options = {}) => {
  // Avoid forcing Content-Type for FormData
  const opts = { ...options };
  if (opts.headers && opts.headers["Content-Type"]) delete opts.headers["Content-Type"];
  return apiFetch(endpoint, opts);
};

export function cancelAllRequests() { abortAll(); }
