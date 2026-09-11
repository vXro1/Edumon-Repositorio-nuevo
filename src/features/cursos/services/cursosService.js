import { apiFetch, apiFetchFormData } from '@/services/core/apiClient';

// ── Cursos ────────────────────────────────────────────────────────────────────

export const cursosCreate = (formData) =>
  apiFetchFormData('/cursos', { method: 'POST', body: formData });

export const cursosGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos${qs ? `?${qs}` : ''}`);
};

export const cursosGetMine = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos/mis-cursos${qs ? `?${qs}` : ''}`);
};

export const cursosGetById = (id) => apiFetch(`/cursos/${id}`);

export const cursosGetParticipantes = (id, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos/${id}/participantes${qs ? `?${qs}` : ''}`);
};

export const cursosUpdate = (id, formData) =>
  apiFetchFormData(`/cursos/${id}`, { method: 'PUT', body: formData });

export const cursosDelete = (id) =>
  apiFetch(`/cursos/${id}`, { method: 'DELETE' });

export const cursosAddParticipante = (id, body) =>
  apiFetch(`/cursos/${id}/participantes`, { method: 'POST', body: JSON.stringify(body) });

export const cursosRemoveParticipante = (cursoId, usuarioId) =>
  apiFetch(`/cursos/${cursoId}/participantes/${usuarioId}`, { method: 'DELETE' });

export const cursosAddParticipantesCsv = (id, formData) =>
  apiFetchFormData(`/cursos/${id}/usuarios-masivo`, { method: 'POST', body: formData });

// ── Módulos ───────────────────────────────────────────────────────────────────

export const modulosCreate = (body) =>
  apiFetch('/modulos', { method: 'POST', body: JSON.stringify(body) });

export const modulosGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/modulos${qs ? `?${qs}` : ''}`);
};

export const modulosGetByCurso = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/modulos/curso/${cursoId}${qs ? `?${qs}` : ''}`);
};

export const modulosGetById = (id) => apiFetch(`/modulos/${id}`);

export const modulosUpdate = (id, body) =>
  apiFetch(`/modulos/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const modulosDelete = (id) =>
  apiFetch(`/modulos/${id}`, { method: 'DELETE' });

export const modulosRestore = (id) =>
  apiFetch(`/modulos/${id}/restore`, { method: 'PATCH' });
