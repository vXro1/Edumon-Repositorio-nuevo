// src/utils/normalizePhone.js
// Fuente única de verdad para teléfonos en toda la app.
//
// Regla del sistema (idéntica en backend — src/utils/normalizarTelefono.js):
//   · El usuario SIEMPRE escribe/pega lo que quiera: 3001234567, +57 300 123 4567,
//     57-300-123-4567, 0300 123 4567…
//   · La UI SIEMPRE muestra los 10 dígitos locales (el +57 va como prefijo fijo).
//   · Al backend SIEMPRE se envía el formato E.164 "+57XXXXXXXXXX".
//
// Todo formulario que capture un teléfono debe usar:
//   onChange → toLocalPhone(value)     (lo que se guarda en el estado del form)
//   validate → isValidPhone(value)     (mismo mensaje de error en todos lados)
//   submit   → normalizePhone(value)   (lo que viaja al backend)

/** Prefijo de país fijo del sistema. */
export const PHONE_PREFIX = "+57";

/** Placeholder único para todos los inputs de teléfono. */
export const PHONE_PLACEHOLDER = "3001234567";

/** Texto de ayuda único para todos los inputs de teléfono. */
export const PHONE_HINT = "10 dígitos. El +57 se agrega automáticamente.";

/** Mensaje de error único para todos los inputs de teléfono. */
export const PHONE_ERROR = "Ingresa los 10 dígitos del teléfono (ej: 3001234567)";

/**
 * Deja el número en su forma local de 10 dígitos, lista para mostrarse en un
 * input que ya pinta "+57" como prefijo. Tolera que el usuario escriba o pegue
 * el indicativo, espacios, guiones, paréntesis o un 0 inicial.
 *
 *   "+57 300 123 4567" → "3001234567"
 *   "573001234567"     → "3001234567"
 *   "0300-123-4567"    → "3001234567"
 *   "3001234567"       → "3001234567"
 *
 * Nota: un número local no puede empezar por "57" (los celulares colombianos
 * empiezan por 3), así que ese prefijo siempre se interpreta como indicativo.
 */
export function toLocalPhone(value) {
  if (value === null || value === undefined) return "";

  let digits = String(value).replace(/\D/g, "");

  if (digits.startsWith("57")) digits = digits.slice(2);   // indicativo escrito por el usuario
  digits = digits.replace(/^0+/, "");                      // 0 inicial redundante

  return digits.slice(0, 10);
}

/**
 * Convierte cualquier entrada al formato que exige el backend: "+57XXXXXXXXXX".
 * Devuelve null si el número no llega a 10 dígitos locales — así quien llama
 * decide si muestra error o si omite el campo (nunca se envía algo a medias).
 */
export function normalizePhone(value) {
  const local = toLocalPhone(value);
  return /^\d{10}$/.test(local) ? `${PHONE_PREFIX}${local}` : null;
}

/** true si el valor puede convertirse a "+57XXXXXXXXXX". */
export function isValidPhone(value) {
  return normalizePhone(value) !== null;
}

/**
 * Elimina el prefijo +57 para mostrar el número en un input de teléfono
 * que muestra el código de país como etiqueta separada.
 * Alias histórico de toLocalPhone — se conserva por compatibilidad.
 */
export function stripCountryCode(value) {
  return toLocalPhone(value);
}

/** Formato de solo lectura: "+57 300 123 4567". Si no es válido, devuelve "—". */
export function formatPhone(value) {
  const local = toLocalPhone(value);
  if (!/^\d{10}$/.test(local)) return value ? String(value) : "—";
  return `${PHONE_PREFIX} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
