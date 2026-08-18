import { apiFetch, apiFetchFormData } from '@/services/core/apiClient';

export const entregasCreate = (formData) =>
  apiFetchFormData('/entregas', { method: 'POST', body: formData });

export const entregasGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/entregas${qs ? `?${qs}` : ''}`);
};

export const entregasGetByTarea = (tareaId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/entregas/tarea/${tareaId}${qs ? `?${qs}` : ''}`);
};

export const entregasGetByPadre = (padreId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/entregas/padre/${padreId}${qs ? `?${qs}` : ''}`);
};

export const entregasGetMineByTarea = (tareaId) =>
  apiFetch(`/entregas/mis-entregas/${tareaId}`);

export const entregasGetById = (id) => apiFetch(`/entregas/${id}`);

export const entregasUpdate = (id, formData) =>
  apiFetchFormData(`/entregas/${id}`, { method: 'PUT', body: formData });

export const entregasEnviar = (id) =>
  apiFetch(`/entregas/${id}/enviar`, { method: 'PATCH' });

export const entregasCalificar = (id, body) =>
  apiFetch(`/entregas/${id}/calificar`, { method: 'PATCH', body: JSON.stringify(body) });

export const entregasDelete = (id) =>
  apiFetch(`/entregas/${id}`, { method: 'DELETE' });

export const entregasDeleteArchivo = (entregaId, archivoId) =>
  apiFetch(`/entregas/${entregaId}/archivos/${archivoId}`, { method: 'DELETE' });

// Objeto compatible con el patrón anterior (CursoEntregasTab lo usa)
const entregasServiceCompat = {
  getByTarea: (tareaId, params) => entregasGetByTarea(tareaId, params),
  getMisEntregas: (tareaId) => entregasGetMineByTarea(tareaId),
  crear: (formData) => entregasCreate(formData),
  enviar: (entregaId) => entregasEnviar(entregaId),
  calificar: (entregaId, body) => entregasCalificar(entregaId, body),
};

export default entregasServiceCompat;
