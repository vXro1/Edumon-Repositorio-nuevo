import { apiFetch, apiFetchFormData } from '@/services/core/apiClient';

// ── Foros ─────────────────────────────────────────────────────────────────────

export const forosCreate = (formData) =>
  apiFetchFormData('/foros', { method: 'POST', body: formData });

export const forosGetByCurso = (cursoId) =>
  apiFetch(`/foros/curso/${cursoId}`);

export const forosGetById = (id) => apiFetch(`/foros/${id}`);

export const forosDashboard = (id) => apiFetch(`/foros/${id}/dashboard`);

export const forosUpdate = (id, body) =>
  apiFetch(`/foros/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const forosCambiarEstado = (id, body) =>
  apiFetch(`/foros/${id}/estado`, { method: 'PATCH', body: JSON.stringify(body) });

export const forosDelete = (id) =>
  apiFetch(`/foros/${id}`, { method: 'DELETE' });

// ── Mensajes de foro ──────────────────────────────────────────────────────────

export const mensajesForoCreate = (formData) =>
  apiFetchFormData('/mensajes-foro', { method: 'POST', body: formData });

export const mensajesForoGetByForo = (foroId) =>
  apiFetch(`/mensajes-foro/foro/${foroId}`);

export const mensajesForoToggleLike = (id) =>
  apiFetch(`/mensajes-foro/${id}/like`, { method: 'POST' });

export const mensajesForoUpdate = (id, body) =>
  apiFetch(`/mensajes-foro/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const mensajesForoDelete = (id) =>
  apiFetch(`/mensajes-foro/${id}`, { method: 'DELETE' });
