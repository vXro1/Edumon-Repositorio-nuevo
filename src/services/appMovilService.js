// src/services/appMovilService.js
// Capa de red para la app móvil (APK de Android).
//
// Contrato real confirmado 2026-09-02 (colección `Apk` en el backend, rutas
// bajo /api/apk — ver BACKEND EDUMON NUEVO/src/{controllers,routes}/apk*.js).
// Ya no es provisional.
//
// Forma de "apk" en TODAS las respuestas:
//   { id, version, versionCode, notas, url, urlDescarga, tamano,
//     nombreArchivo, obligatoria, activa, fecha }
// urlDescarga fuerza la descarga (Content-Disposition: attachment del handler
// estático); url abre el binario tal cual — la web siempre debe usar urlDescarga.
//
// Desde el cambio a almacenamiento local, url/urlDescarga llegan como rutas
// relativas (/uploads/pub/apks/…). assetUrl les antepone el origen del API.

import { apiFetch, apiFetchFormData } from './core/apiClient';
import { assetUrl } from '@/utils/assetUrl';

const normalizeApk = (apk) =>
  apk
    ? { ...apk, url: assetUrl(apk.url), urlDescarga: assetUrl(apk.urlDescarga || apk.url) }
    : apk;

// ── Público (consumido por la landing, sin sesión) ──────────────
// GET /apk/actual → 200 { apk } | 404 si no hay ninguna versión activa.
// silentAuth: un 401 aquí no debe disparar el logout global (endpoint
// público, la landing se ve sin sesión).
export const appMovilGetActual = async () => {
  const res = await apiFetch('/apk/actual', { silentAuth: true });
  return { ...res, apk: normalizeApk(res?.apk) };
};

// ── Superadmin ─────────────────────────────────────────────────
// GET /apk → { apks: [...] } (incluye subidaPor)
export const appMovilGetAll = async () => {
  const res = await apiFetch('/apk');
  return { ...res, apks: Array.isArray(res?.apks) ? res.apks.map(normalizeApk) : res?.apks };
};

// POST /apk (multipart) → 201 { message, apk }
// FormData: apk (file, .apk, hasta 200MB), version (string, obligatorio),
// versionCode (number, opcional), notas (string, opcional),
// obligatoria ("true"/"false", opcional).
export const appMovilUpload = async (formData) => {
  const res = await apiFetchFormData('/apk', { method: 'POST', body: formData });
  return { ...res, apk: normalizeApk(res?.apk) };
};

// PUT /apk/:id → { message, apk }
// body: { version?, versionCode?, notas?, obligatoria?, activa? } — activar
// una versión es simplemente mandar { activa: true }, el backend desactiva
// las demás automáticamente (una sola activa a la vez).
export const appMovilUpdate = async (id, body) => {
  const res = await apiFetch(`/apk/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  return { ...res, apk: normalizeApk(res?.apk) };
};

export const appMovilActivar = (id) => appMovilUpdate(id, { activa: true });

// DELETE /apk/:id → { message } — si era la activa, el backend promueve la
// más reciente que quede.
export const appMovilEliminar = (id) =>
  apiFetch(`/apk/${id}`, { method: 'DELETE' });
