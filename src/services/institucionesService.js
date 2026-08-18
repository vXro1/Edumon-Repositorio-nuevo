import { apiFetch, apiFetchFormData } from './core/apiClient';

export const institucionesCreate = (body) =>
  apiFetch('/instituciones', { method: 'POST', body: JSON.stringify(body) });

export const institucionesGetAll = () => apiFetch('/instituciones');

export const institucionesUpdate = (id, body) =>
  apiFetch(`/instituciones/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const institucionesGetMine = () => apiFetch('/instituciones/mi-institucion');

export const institucionesCreateDocente = (body) =>
  apiFetch('/instituciones/docentes', { method: 'POST', body: JSON.stringify(body) });

export const institucionesCreateDocentesCsv = (formData) =>
  apiFetchFormData('/instituciones/docentes/csv', { method: 'POST', body: formData });
