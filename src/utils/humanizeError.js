// src/utils/humanizeError.js
// Traduce errores técnicos de API/red en mensajes legibles en español.

const STATUS_MESSAGES = {
  400: "Revisa los datos ingresados",
  401: "Sesión expirada. Vuelve a iniciar sesión",
  403: "No tienes permiso para esta acción",
  404: "El recurso no fue encontrado",
  409: "Ya existe un registro con esos datos",
  422: "Los datos ingresados son inválidos",
  429: "Demasiados intentos. Espera un momento e intenta de nuevo",
  500: "Error del servidor. Intenta más tarde",
  502: "Servicio no disponible. Intenta más tarde",
  503: "Servicio no disponible. Intenta más tarde",
};

const PATTERN_MESSAGES = [
  [/credencial|contrase|passw/i,       "Usuario o contraseña incorrectos"],
  [/token.*expir|expir.*token/i,       "Tu sesión ha expirado. Vuelve a iniciar sesión"],
  [/no autorizado|unauthorized/i,      "No tienes permiso para realizar esta acción"],
  [/forbidden/i,                       "Acceso no permitido"],
  [/not found/i,                       "El recurso solicitado no existe"],
  [/duplicate key|ya existe/i,         "Ya existe un registro con esos datos"],
  [/cast error|invalid.*id/i,          "Uno de los campos tiene un formato inválido"],
  [/network error|failed to fetch|networkerror/i, "Sin conexión. Revisa tu internet e intenta de nuevo"],
  [/timeout/i,                         "La solicitud tardó demasiado. Intenta de nuevo"],
  [/validation/i,                      "Revisa los datos ingresados"],
];

/**
 * Convierte un error de API en un mensaje amigable en español.
 * @param {unknown} err  — el error capturado (axios/fetch/Error)
 * @param {string}  fallback — valor por defecto cuando nada coincide
 */
export function humanizeError(err, fallback = "Ocurrió un error. Intenta de nuevo") {
  if (!err) return fallback;

  // El código de estado HTTP tiene la mayor prioridad
  const status = err?.response?.status ?? err?.status;
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  // Extraer el mensaje crudo de múltiples ubicaciones posibles
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";

  const lower = raw.toLowerCase();

  for (const [regex, human] of PATTERN_MESSAGES) {
    if (regex.test(lower)) return human;
  }

  // Retornar el mensaje original solo si parece legible (corto, sin stack trace)
  if (
    raw &&
    raw.length < 100 &&
    !/err_|syntaxerror|typeerror|referenceerror|at\s+\w+\s*\(/i.test(raw)
  ) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return fallback;
}
