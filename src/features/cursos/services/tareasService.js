import { apiFetch, apiFetchFormData } from '@/services/core/apiClient';

export const tareasCreate = (formData) =>
  apiFetchFormData('/tareas', { method: 'POST', body: formData });

export const tareasGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/tareas${qs ? `?${qs}` : ''}`);
};

export const tareasGetById = (id) => apiFetch(`/tareas/${id}`);

export const tareasUpdate = (id, formData) =>
  apiFetchFormData(`/tareas/${id}`, { method: 'PUT', body: formData });

// La ruta del backend es /:id/close (inglés) — tareaRoutes.js del backend
// nunca definió un alias /cerrar, así que este endpoint devolvía 404.
export const tareasCerrar = (id) =>
  apiFetch(`/tareas/${id}/close`, { method: 'PATCH' });

export const tareasDelete = (id) =>
  apiFetch(`/tareas/${id}`, { method: 'DELETE' });
