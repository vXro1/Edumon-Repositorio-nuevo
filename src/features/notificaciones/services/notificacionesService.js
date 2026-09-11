import { apiFetch } from '@/services/core/apiClient';

export const notificacionesCreate = (body) =>
  apiFetch('/notificaciones', { method: 'POST', body: JSON.stringify(body) });

export const notificacionesGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/notificaciones${qs ? `?${qs}` : ''}`);
};

export const notificacionesGetConteoNoLeidas = () =>
  apiFetch('/notificaciones/conteo-no-leidas');

export const notificacionesGetById = (id) =>
  apiFetch(`/notificaciones/${id}`);

export const notificacionesMarcarLeida = (id) =>
  apiFetch(`/notificaciones/${id}/leer`, { method: 'PATCH' });

export const notificacionesMarcarMultiplesLeidas = (body) =>
  apiFetch('/notificaciones/leer-multiples', { method: 'PATCH', body: JSON.stringify(body) });

export const notificacionesMarcarTodasLeidas = () =>
  apiFetch('/notificaciones/leer-todas', { method: 'PATCH' });

export const notificacionesDelete = (id) =>
  apiFetch(`/notificaciones/${id}`, { method: 'DELETE' });

export const notificacionesLimpiarAntiguas = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/notificaciones/limpiar/antiguas${qs ? `?${qs}` : ''}`, { method: 'DELETE' });
};
