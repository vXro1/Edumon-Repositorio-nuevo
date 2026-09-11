import { apiFetch, apiFetchFormData } from './core/apiClient';
import { assetUrl } from '@/utils/assetUrl';

export const usersCreate = (body) =>
  apiFetch('/users', { method: 'POST', body: JSON.stringify(body) });

export const usersGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/users${qs ? `?${qs}` : ''}`);
};

export const usersGetMyProfile = () => apiFetch('/users/me/profile');

// Para editar el PROPIO perfil (cualquier rol) — PUT /users/:id está
// restringido a administrador/superadmin en el backend, así que un docente o
// padre editando sus propios datos debe pasar por /users/me/profile o recibe
// 403 aunque esté editando su propia cuenta.
export const usersUpdateMyProfile = (body) =>
  apiFetch('/users/me/profile', { method: 'PUT', body: JSON.stringify(body) });

export const usersUpdateMyPhoto = (formData) =>
  apiFetchFormData('/users/me/foto-perfil', { method: 'PUT', body: formData });

// Avatares predeterminados: el backend los sirve local (/static/avatares/…);
// se devuelven con URL absoluta lista para <img> y para reenviar al guardar.
export const usersGetDefaultPhotos = async () => {
  const res = await apiFetch('/users/fotos-predeterminadas');
  const fotos = Array.isArray(res?.fotos)
    ? res.fotos.map((f) => ({ ...f, url: assetUrl(f.url) }))
    : res?.fotos;
  return { ...res, fotos };
};

export const usersGetById = (id) => apiFetch(`/users/${id}`);

export const usersGetPadreInfo = (padreId) => apiFetch(`/users/padre/${padreId}/info`);

export const usersUpdate = (id, body) =>
  apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const usersDelete = (id) =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });

export const usersUpdateFcmToken = (body) =>
  apiFetch('/users/me/fcm-token', { method: 'PUT', body: JSON.stringify(body) });
