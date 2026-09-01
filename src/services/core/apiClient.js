import { queueRequest, makeKey, abortAll } from './requestQueue';
import { requestInterceptors, responseInterceptors } from './interceptors';

// Solo utilidades base (SIN endpoints aquí)

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

if (import.meta.env.DEV) {
  // gancho de depuración reservado solo para desarrollo
}

// Callback de cierre de sesión (provisto por AuthProvider)
let _logoutCallback = null;
let _handling401 = false;

// El proveedor de token debe ser registrado por authService para evitar leer localStorage aquí
let _tokenProvider = null;
export const setTokenProvider = (fn) => { _tokenProvider = fn; };

export const registerLogoutCallback = (cb) => {
  _logoutCallback = cb;
};

// access_token expira a los 15 min; sin refresh, un formulario largo dispara
// logout con TOKEN_EXPIRED a mitad de sesión. _refreshPromise deduplica
// refrescos simultáneos cuando varias requests expiran a la vez.
let _refreshPromise = null;

async function tryRefreshToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

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
  const token = _tokenProvider ? _tokenProvider() : undefined;

  // silentAuth: bandera interna (no va al backend) para chequeos rutinarios de sesión — un 401 ahí no dispara logout global
  const { silentAuth, ...restOptions } = options;

  const opts = { method: "GET", ...restOptions };
  const isFormData = opts.body instanceof FormData;
  opts.headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opts.headers,
  };
  opts.credentials = "include"; // para que la cookie httpOnly viaje incluso cross-origin en producción

  const { url: finalUrl, opts: finalOpts } = applyReqInterceptors(url, opts);
  const key = makeKey(finalUrl, finalOpts);

  return queueRequest(key, async (signal) => {
    finalOpts.signal = signal;
    return runRequest(endpoint, finalUrl, finalOpts, { silentAuth });
  });
};

// separado de apiFetch para poder reintentar tras un refresh sin volver a pasar por queueRequest
// (que deduplicaría la segunda llamada contra sí misma)
async function runRequest(endpoint, finalUrl, finalOpts, { silentAuth, isRetry = false } = {}) {
  const res = await fetch(finalUrl, finalOpts);

  applyResInterceptors(res);

  let data = {};
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try { data = await res.json(); } catch {}
  }

  if (res.status === 401) {
    // credenciales incorrectas — no dispara logout global
    if (endpoint === "/auth/login") {
      throw new Error(data.message || "Teléfono o contraseña incorrectos. Verifica tus credenciales.");
    }
    // chequeo silencioso de sesión (getProfile al arrancar) — 401 esperado
    if (silentAuth) {
      throw new Error(data.message || "No hay sesión activa.");
    }

    // token expirado: un intento de refresh vía /auth/refresh antes de forzar logout
    if (!isRetry && endpoint !== "/auth/refresh" && data.code === "TOKEN_EXPIRED") {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return runRequest(endpoint, finalUrl, finalOpts, { silentAuth, isRetry: true });
      }
    }

    // Cualquier otro 401 = sesión expirada de verdad → logout automático (una sola vez)
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
      // express-validator devuelve { msg, path }, no { message, field } — adjuntar
      // el array crudo permite pintar el error debajo del input correspondiente
      const details = data.errors
        .map((e) => (e.path ? `${e.path}: ${e.msg}` : e.msg))
        .filter(Boolean)
        .join(" · ");
      const error = new Error(details ? `${errorMsg}: ${details}` : errorMsg);
      error.validationErrors = data.errors; // [{ path, msg, ... }]
      error.errors = data.errors;           // alias esperado por parseValidationErrors.js
      throw error;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const apiFetchFormData = async (endpoint, options = {}) => {
  const opts = { ...options };
  if (opts.headers && opts.headers["Content-Type"]) delete opts.headers["Content-Type"];
  return apiFetch(endpoint, opts);
};

export function cancelAllRequests() { abortAll(); }