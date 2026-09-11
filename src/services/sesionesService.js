import { apiFetch } from './core/apiClient';

export const sesionesService = {
  getUltimas: async ({ page = 1, limit = 10 } = {}) => {
    const data = await apiFetch(`/users/sesiones/ultimas?page=${page}&limit=${limit}`);
    return data;
  },
};
