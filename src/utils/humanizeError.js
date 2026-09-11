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
  [/token.*expir|expir.*token/i,       "Tu sesión terminó. Inicia sesión nuevamente"],
  [/no autorizado|unauthorized/i,      "No tienes permiso para realizar esta acción"],
  [/forbidden/i,                       "No tienes permiso para realizar esta acción"],
  [/not found/i,                       "No pudimos encontrar lo que buscabas"],
  [/duplicate key|ya existe/i,         "Ya existe un registro con esos datos"],
  [/cast error|invalid.*id/i,          "Uno de los campos tiene un formato inválido"],
  [/network error|failed to fetch|networkerror|request failed/i, "Sin conexión. Revisa tu internet e intenta de nuevo"],
  [/timeout/i,                         "La solicitud tardó demasiado. Intenta de nuevo"],
  // Tipo de archivo no permitido (multer fileFilter / validaciones de adjuntos).
  // FIX: el backend a veces manda "Formato de archivo no permitido" (sin la
  // palabra "tipo" ni "mimetype" — ver cloudinaryMiddleware.js), que no
  // calzaba con ningún patrón de aquí y se mostraba tal cual, crudo y sin
  // decir qué formatos sí se aceptan.
  [/file type|tipo de archivo|mimetype|formato.*archivo|formato.*permitido/i,
    "Este tipo de archivo no es compatible. Prueba con una imagen, PDF o documento permitido"],
  // Mensajes técnicos genéricos que no traen su propio texto específico —
  // si el backend ya manda un mensaje concreto (ej. "El título debe tener
  // entre 3 y 200 caracteres"), esos NUNCA caen aquí: no calzan con ningún
  // patrón y se muestran tal cual más abajo.
  [/internal server error|server error|^error$/i, "Ocurrió un error de nuestro lado. Intenta más tarde"],
  [/bad request|invalid input/i,       "Revisa la información ingresada"],
  [/validation/i,                      "Revisa los datos ingresados"],
];

/**
 * Convierte un error de API en un mensaje amigable en español.
 * @param {unknown} err  — el error capturado (axios/fetch/Error)
 * @param {string}  fallback — valor por defecto cuando nada coincide
 */
export function humanizeError(err, fallback = "Ocurrió un error. Intenta de nuevo") {
  if (!err) return fallback;

  const status = err?.response?.status ?? err?.status;

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

  // FIX: el código de estado HTTP tenía prioridad sobre el mensaje real del
  // backend. Cuando el backend manda un motivo concreto y legible (ej. "La
  // tarea está cerrada y no acepta entregas"), eso es siempre más útil que
  // el genérico por status ("Revisa los datos ingresados") — mostrarlo tal
  // cual. El genérico por status queda como respaldo solo cuando el backend
  // no mandó nada legible.
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

/**
 * DELETE /users/:id (suspender) bloquea con 400 cuando el usuario es un
 * docente con cursos en estado activo, mandando
 * { message, cursosActivos: [{ _id, nombre, codigoCurso }, ...] } — sin este
 * helper, humanizeError() solo mostraba el message genérico y se perdía la
 * lista de cursos que hay que archivar/reasignar antes de poder suspender.
 * @param {unknown} err
 * @returns {string|null} mensaje listo para mostrar, o null si no aplica
 */
export function humanizeCursosActivosError(err) {
  const cursos = err?.data?.cursosActivos;
  if (!Array.isArray(cursos) || cursos.length === 0) return null;

  const nombres = cursos.map((c) => c.nombre ?? c.codigoCurso ?? "curso").join(", ");
  const sustantivo = cursos.length === 1 ? "un curso activo" : "cursos activos";
  return `No se puede suspender: tiene ${sustantivo} (${nombres}). Archívalos o reasígnalos antes de suspender.`;
}
