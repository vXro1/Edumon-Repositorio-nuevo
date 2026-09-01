// UI siempre muestra 10 dígitos locales (+57 como prefijo fijo); al backend
// siempre se envía E.164 "+57XXXXXXXXXX". Todo formulario de teléfono usa:
// onChange -> toLocalPhone, validate -> isValidPhone, submit -> normalizePhone

export const PHONE_PREFIX = "+57";
export const PHONE_PLACEHOLDER = "3001234567";
export const PHONE_HINT = "10 dígitos. El +57 se agrega automáticamente.";
export const PHONE_ERROR = "Ingresa los 10 dígitos del teléfono (ej: 3001234567)";

// tolera indicativo, espacios, guiones, paréntesis o 0 inicial en la entrada
export function toLocalPhone(value) {
  if (value === null || value === undefined) return "";

  let digits = String(value).replace(/\D/g, "");

  if (digits.startsWith("57")) digits = digits.slice(2);   // indicativo escrito por el usuario
  digits = digits.replace(/^0+/, "");                      // 0 inicial redundante

  return digits.slice(0, 10);
}

// null si no llega a 10 dígitos — quien llama decide si muestra error u omite el campo
export function normalizePhone(value) {
  const local = toLocalPhone(value);
  return /^\d{10}$/.test(local) ? `${PHONE_PREFIX}${local}` : null;
}

export function isValidPhone(value) {
  return normalizePhone(value) !== null;
}

// alias histórico de toLocalPhone, se conserva por compatibilidad
export function stripCountryCode(value) {
  return toLocalPhone(value);
}

export function formatPhone(value) {
  const local = toLocalPhone(value);
  if (!/^\d{10}$/.test(local)) return value ? String(value) : "—";
  return `${PHONE_PREFIX} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
