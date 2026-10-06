
const RAW_BASE = import.meta.env.VITE_API_URL ?? "/api";

// Origen del backend derivado de VITE_API_URL. Si es relativo ("/api"), el
// backend comparte origen con el front y las rutas /uploads ya resuelven solas.
let API_ORIGIN = "";
try {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const parsed = new URL(RAW_BASE, origin).origin;
  API_ORIGIN = parsed === origin ? "" : parsed;
} catch {
  API_ORIGIN = "";
}

/**
 * Convierte una ruta de archivo del backend en una URL usable por el navegador.
 *
 * - Vacío / no-string            → ""
 * - Ya absoluta (http, data, blob) → se devuelve igual (p. ej. enlaces que
 *   pega el usuario, o assets antiguos de Cloudinary aún referenciados)
 * - Relativa ("/uploads/…")      → se le antepone el origen del backend
 *
 * @param {string} path
 * @returns {string}
 */
export function assetUrl(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (!API_ORIGIN) return trimmed; // mismo origen: sirve tal cual
  return `${API_ORIGIN}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

export default assetUrl;
