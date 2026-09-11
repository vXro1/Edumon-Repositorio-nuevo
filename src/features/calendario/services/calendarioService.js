import { apiFetch } from '@/services/core/apiClient';

export const calendarioGetByCurso = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/calendario/${cursoId}${qs ? `?${qs}` : ''}`);
};

export const calendarioGetDia = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/calendario/${cursoId}/dia${qs ? `?${qs}` : ''}`);
};

export const calendarioGetProximos = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/calendario/${cursoId}/proximos${qs ? `?${qs}` : ''}`);
};
