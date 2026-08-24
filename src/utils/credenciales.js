// src/utils/credenciales.js
// Fuente única de verdad para las credenciales iniciales de CUALQUIER usuario
// creado desde el panel (admin de institución, docente, padre/participante,
// usuario creado desde la página Usuarios, individual o por CSV).
//
// REGLA ÚNICA DEL SISTEMA: la contraseña inicial ES la cédula, sin prefijos.
// El backend la asigna así en todos sus flujos (institucionController,
// cursoController, userController) y la notificación de bienvenida dice
// literalmente "Usa tu cédula como contraseña". El frontend NUNCA inventa
// una contraseña propia: no manda el campo y deja que el backend aplique
// la regla, para que no pueda volver a divergir.

/** Contraseña inicial de un usuario recién creado: su cédula, tal cual. */
export function contrasenaInicial(cedula) {
  return String(cedula ?? "").trim();
}

/** Texto único para explicar la credencial inicial en cualquier formulario. */
export const TEXTO_CONTRASENA_INICIAL =
  "La contraseña inicial es la cédula del usuario. Se le pedirá cambiarla en su primer ingreso.";

/** Variante corta para notas al pie dentro de modales de creación. */
export const TEXTO_CONTRASENA_INICIAL_CORTO =
  "Contraseña inicial: la cédula del usuario.";

/** Regla de cédula del backend (userValidator / authValidator). */
export const CEDULA_REGEX = /^\d{6,10}$/;

/** Mensaje único de cédula inválida. */
export const CEDULA_ERROR = "La cédula debe tener entre 6 y 10 dígitos numéricos";

/** Deja solo dígitos y recorta a 10 — para el onChange de los inputs de cédula. */
export function toCedula(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

/** true si la cédula cumple la regla del backend. */
export function isValidCedula(value) {
  return CEDULA_REGEX.test(String(value ?? "").trim());
}

// ─── Contraseña NUEVA (primer ingreso, cambio de contraseña, recuperación) ───
// Mismas reglas que el backend (authValidator/userValidator):
//   6-128 caracteres + al menos una minúscula, una mayúscula y un número.

export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;

/** Requisitos individuales — sirven para el medidor de fuerza y para validar. */
export const PASSWORD_RULES = [
  { label: `${PASSWORD_MIN}+ caracteres`, test: (p) => p.length >= PASSWORD_MIN },
  { label: "Mayúscula",                   test: (p) => /[A-Z]/.test(p) },
  { label: "Minúscula",                   test: (p) => /[a-z]/.test(p) },
  { label: "Número",                      test: (p) => /\d/.test(p) },
];

/** Texto único de requisitos para mostrar bajo cualquier campo de contraseña nueva. */
export const TEXTO_REQUISITOS_CONTRASENA =
  "Mínimo 6 caracteres, con al menos una mayúscula, una minúscula y un número.";

/**
 * Valida una contraseña nueva con las mismas reglas del backend.
 * @returns {string|null} mensaje de error, o null si es válida.
 */
export function validarContrasenaNueva(value) {
  const pw = String(value ?? "");
  if (!pw)                    return "La contraseña es requerida";
  if (pw.length < PASSWORD_MIN) return `Mínimo ${PASSWORD_MIN} caracteres`;
  if (pw.length > PASSWORD_MAX) return `Máximo ${PASSWORD_MAX} caracteres`;
  if (!/[A-Z]/.test(pw))      return "Debe contener al menos una mayúscula";
  if (!/[a-z]/.test(pw))      return "Debe contener al menos una minúscula";
  if (!/\d/.test(pw))         return "Debe contener al menos un número";
  return null;
}
