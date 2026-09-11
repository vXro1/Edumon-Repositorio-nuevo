import { apiFetch } from '@/services/core/apiClient';

export const buzonEnviar = (body) =>
  apiFetch('/buzon', { method: 'POST', body: JSON.stringify(body) });

export const buzonGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/buzon${qs ? `?${qs}` : ''}`);
};

export const buzonMarcarLeido = (id) =>
  apiFetch(`/buzon/${id}/leido`, { method: 'PATCH' });
