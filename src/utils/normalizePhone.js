// src/utils/normalizePhone.js
// Normalizes Colombian phone numbers to E.164 format (+57XXXXXXXXXX).

/**
 * Accepts any of these formats and returns "+57XXXXXXXXXX":
 *   3001234567       → +573001234567
 *   +573001234567    → +573001234567
 *   57 300 123 4567  → +573001234567
 *   300-123-4567     → +573001234567
 * Returns null if the number is not recognizable as a valid 10-digit Colombian mobile.
 */
export function normalizePhone(value) {
  if (!value) return null;

  // Strip everything except digits and leading +
  const digits = String(value).replace(/\D/g, "");

  // Already has country code: 57XXXXXXXXXX (12 digits)
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+${digits}`;
  }

  // 10-digit local number
  if (digits.length === 10) {
    return `+57${digits}`;
  }

  // 11-digit with redundant leading 0 (some users type 0300...)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+57${digits.slice(1)}`;
  }

  // Unrecognized — return as-is with +57 prefix if at least 7 digits
  if (digits.length >= 7) {
    return `+57${digits.slice(-10)}`;
  }

  return null;
}

/**
 * Strips the +57 prefix for display inside a tel input that shows
 * the country code as a separate label.
 */
export function stripCountryCode(value) {
  if (!value) return "";
  const str = String(value).trim();
  if (str.startsWith("+57")) return str.slice(3);
  if (str.startsWith("57") && str.length > 10) return str.slice(2);
  return str;
}
