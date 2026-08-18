import { apiFetch, apiFetchFormData } from './core/apiClient';

export const usersCreate = (body) =>
  apiFetch('/users', { method: 'POST', body: JSON.stringify(body) });

export const usersGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/users${qs ? `?${qs}` : ''}`);
};

export const usersGetMyProfile = () => apiFetch('/users/me/profile');

export const usersUpdateMyPhoto = (formData) =>
  apiFetchFormData('/users/me/foto-perfil', { method: 'PUT', body: formData });

export const usersGetDefaultPhotos = () => apiFetch('/users/fotos-predeterminadas');

export const usersPatchFotoDefault = (fotoPredeterminadaUrl) =>
  apiFetch('/users/foto-perfil', { method: 'PATCH', body: JSON.stringify({ fotoPredeterminadaUrl }) });

export const usersPatchFotoFile = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetchFormData('/users/foto-perfil', { method: 'PATCH', body: fd });
};

export const usersGetById = (id) => apiFetch(`/users/${id}`);

export const usersGetPadreInfo = (padreId) => apiFetch(`/users/padre/${padreId}/info`);

export const usersUpdate = (id, body) =>
  apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const usersDelete = (id) =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });

export const usersUpdateFcmToken = (body) =>
  apiFetch('/users/me/fcm-token', { method: 'PUT', body: JSON.stringify(body) });
