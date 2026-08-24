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

// El access_token (cookie httpOnly) expira a los 15 min (ver ACCESS_TOKEN_TTL
// en authController.js del backend). Sin este refresh, cualquier formulario
// largo (ej. crear tarea: título, descripción, módulo, participantes,
// archivos) que tardara más de 15 min en enviarse, o simplemente llegar tras
// haber navegado un rato, disparaba un 401 "TOKEN_EXPIRED" que forzaba logout
// global — el usuario veía esto como "me pide el token" estando logeado.
// _refreshPromise deduplica refrescos simultáneos si varias requests
// expiran a la vez.
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

  // silentAuth: bandera interna, NO se manda al backend. Marca peticiones que
  // preguntan "¿tengo sesión?" de forma rutinaria (ej. al arrancar la app).
  // Un 401 ahí es normal ("no, no tienes sesión") y NO debe disparar el
  // logout global — evita el bucle de reload infinito.
  const { silentAuth, ...restOptions } = options;

  const opts = { method: "GET", ...restOptions };
  const isFormData = opts.body instanceof FormData;
  opts.headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opts.headers,
  };
  // Necesario para que la cookie httpOnly (access_token/refresh_token) viaje
  // en cada petición, incluidas las cross-origin en producción (Render, etc.)
  opts.credentials = "include";

  const { url: finalUrl, opts: finalOpts } = applyReqInterceptors(url, opts);
  const key = makeKey(finalUrl, finalOpts);

  return queueRequest(key, async (signal) => {
    finalOpts.signal = signal;
    return runRequest(endpoint, finalUrl, finalOpts, { silentAuth });
  });
};

// Extraído de apiFetch para poder reintentar UNA vez tras un refresh de
// token exitoso sin volver a pasar por queueRequest (que deduplicaría la
// segunda llamada contra sí misma si la key fuera idéntica — ver
// requestQueue.js). La primera llamada siempre entra vía queueRequest;
// el reintento post-refresh llama directo aquí.
async function runRequest(endpoint, finalUrl, finalOpts, { silentAuth, isRetry = false } = {}) {
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
    // Chequeo silencioso de sesión (getProfile al arrancar) — 401 esperado,
    // no dispara logout global.
    if (silentAuth) {
      throw new Error(data.message || "No hay sesión activa.");
    }

    // Access token expirado (15 min) a mitad de sesión: intentar refrescarlo
    // UNA vez vía /auth/refresh (usa el refresh_token, cookie httpOnly de 7
    // días) antes de forzar el logout global. Si el refresh funciona, se
    // reintenta la petición original con la cookie ya renovada.
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
      // express-validator (todos los validators del backend) devuelve
      // { msg, path, ... } por cada error — NUNCA { message, field }. Leer
      // esos nombres producía un mensaje literal "undefined, undefined" en
      // el toast, sin decirle al usuario qué campo falló. Además, adjuntar
      // el array crudo al Error (validationErrors/errors) es lo que permite
      // pintar el mensaje justo debajo del input correspondiente — ver
      // parseValidationErrors.js (usado en Eventos/Calendario) y los catch
      // de creación de usuario/docente en Usuarios/DocentesPage.
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