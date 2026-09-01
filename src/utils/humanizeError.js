// traduce errores técnicos de API/red en mensajes legibles en español

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
  [/token.*expir|expir.*token/i,       "Tu sesión terminó. Inicia sesión nuevamente"],
  [/no autorizado|unauthorized/i,      "No tienes permiso para realizar esta acción"],
  [/forbidden/i,                       "No tienes permiso para realizar esta acción"],
  [/not found/i,                       "No pudimos encontrar lo que buscabas"],
  [/duplicate key|ya existe/i,         "Ya existe un registro con esos datos"],
  [/cast error|invalid.*id/i,          "Uno de los campos tiene un formato inválido"],
  [/network error|failed to fetch|networkerror|request failed/i, "Sin conexión. Revisa tu internet e intenta de nuevo"],
  [/timeout/i,                         "La solicitud tardó demasiado. Intenta de nuevo"],
  [/file type|tipo de archivo|mimetype|formato.*archivo|formato.*permitido/i,
    "Este tipo de archivo no es compatible. Prueba con una imagen, PDF o documento permitido"],
  [/internal server error|server error|^error$/i, "Ocurrió un error de nuestro lado. Intenta más tarde"],
  [/bad request|invalid input/i,       "Revisa la información ingresada"],
  [/validation/i,                      "Revisa los datos ingresados"],
];

export function humanizeError(err, fallback = "Ocurrió un error. Intenta de nuevo") {
  if (!err) return fallback;

  const status = err?.response?.status ?? err?.status;

  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";

  const lower = raw.toLowerCase();

  for (const [regex, human] of PATTERN_MESSAGES) {
    if (regex.test(lower)) return human;
  }

  // un mensaje concreto del backend es más útil que el genérico por status
  if (
    raw &&
    raw.length < 100 &&
    !/err_|syntaxerror|typeerror|referenceerror|at\s+\w+\s*\(/i.test(raw)
  ) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  return fallback;
}
