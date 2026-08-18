// src/utils/normalizePhone.js
// Normaliza números de teléfono colombianos al formato E.164 (+57XXXXXXXXXX).

/**
 * Acepta cualquiera de estos formatos y retorna "+57XXXXXXXXXX":
 *   3001234567       → +573001234567
 *   +573001234567    → +573001234567
 *   57 300 123 4567  → +573001234567
 *   300-123-4567     → +573001234567
 * Retorna null si el número no puede reconocerse como un móvil colombiano válido de 10 dígitos.
 */
export function normalizePhone(value) {
  if (!value) return null;

  // Eliminar todo excepto dígitos y el + inicial
  const digits = String(value).replace(/\D/g, "");

  // Ya tiene código de país: 57XXXXXXXXXX (12 dígitos)
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+${digits}`;
  }

  // Número local de 10 dígitos
  if (digits.length === 10) {
    return `+57${digits}`;
  }

  // 11 dígitos con 0 inicial redundante (algunos usuarios escriben 0300...)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+57${digits.slice(1)}`;
  }

  // No reconocido — retornar con prefijo +57 si tiene al menos 7 dígitos
  if (digits.length >= 7) {
    return `+57${digits.slice(-10)}`;
  }

  return null;
}

/**
 * Elimina el prefijo +57 para mostrar el número en un input de teléfono
 * que muestra el código de país como etiqueta separada.
 */
export function stripCountryCode(value) {
  if (!value) return "";
  const str = String(value).trim();
  if (str.startsWith("+57")) return str.slice(3);
  if (str.startsWith("57") && str.length > 10) return str.slice(2);
  return str;
}
