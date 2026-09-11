import { apiFetch } from '@/services/core/apiClient';

export const perfilesGetAll = () => apiFetch('/perfiles');

export const perfilesCreate = (body) =>
  apiFetch('/perfiles', { method: 'POST', body: JSON.stringify(body) });

export const perfilesSeleccionar = (body) =>
  apiFetch('/perfiles/seleccionar', { method: 'POST', body: JSON.stringify(body) });

export const perfilesUpdate = (id, body) =>
  apiFetch(`/perfiles/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const perfilesDelete = (id) =>
  apiFetch(`/perfiles/${id}`, { method: 'DELETE' });

export const perfilesUpdateFcmToken = (body) =>
  apiFetch('/perfiles/fcm-token', { method: 'POST', body: JSON.stringify(body) });
