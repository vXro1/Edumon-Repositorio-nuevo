import { apiFetch, apiFetchFormData } from '@/services/core/apiClient';

export const eventosCreate = (formData) =>
  apiFetchFormData('/eventos', { method: 'POST', body: formData });

// Variante JSON para crear eventos sin adjuntos (ej. desde CalendarioPage)
export const eventosCreateSimple = (body) =>
  apiFetch('/eventos', { method: 'POST', body: JSON.stringify(body) });

export const eventosGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/eventos${qs ? `?${qs}` : ''}`);
};

export const eventosGetHoy = () => apiFetch('/eventos/hoy');

export const eventosGetById = (id) => apiFetch(`/eventos/${id}`);

export const eventosUpdate = (id, formData) =>
  apiFetchFormData(`/eventos/${id}`, { method: 'PUT', body: formData });

// Variante JSON para actualizar eventos sin adjuntos (ej. desde CalendarioPage)
export const eventosUpdateSimple = (id, body) =>
  apiFetch(`/eventos/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const eventosDelete = (id) =>
  apiFetch(`/eventos/${id}`, { method: 'DELETE' });
