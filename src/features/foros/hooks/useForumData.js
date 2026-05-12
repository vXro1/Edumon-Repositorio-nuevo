// src/features/foros/hooks/useForumData.js
// TanStack Query hooks for forum data fetching and mutations.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  forosGetById,
  forosGetByCurso,
  forosCambiarEstado,
  forosDashboard,
  mensajesForoGetByForo,
  mensajesForoCreate,
  mensajesForoToggleLike,
  mensajesForoDelete,
  mensajesForoUpdate,
} from '@/lib/apiClient';
import { normalizeForo, normalizeMensaje } from '@/lib/normalizers/foro';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useForumDetail = (foroId) =>
  useQuery({
    queryKey:  ['forum', foroId],
    queryFn:   async () => {
      const res = await forosGetById(foroId);
      return normalizeForo(res?.foro ?? res);
    },
    enabled:   !!foroId,
    staleTime: 60_000,
  });

export const useForumMessages = (foroId) =>
  useQuery({
    queryKey:        ['forum-messages', foroId],
    queryFn:         async () => {
      const res = await mensajesForoGetByForo(foroId);
      const raw = res?.mensajes ?? (Array.isArray(res) ? res : []);
      return raw.map(normalizeMensaje).filter(Boolean);
    },
    enabled:         !!foroId,
    staleTime:       30_000,
    refetchInterval: 60_000,
  });

export const useForumsByCourse = (cursoId) =>
  useQuery({
    queryKey:  ['forums-by-course', cursoId],
    queryFn:   async () => {
      const res = await forosGetByCurso(cursoId);
      const raw = res?.foros ?? (Array.isArray(res) ? res : []);
      return raw.map(normalizeForo).filter(Boolean);
    },
    enabled:   !!cursoId,
    staleTime: 60_000,
  });

// Dashboard: graceful degradation if backend endpoint doesn't exist yet.
export const useForumDashboard = (foroId) =>
  useQuery({
    queryKey:  ['forum-dashboard', foroId],
    queryFn:   async () => {
      try { return await forosDashboard(foroId); }
      catch { return null; }
    },
    enabled:   !!foroId,
    staleTime: 60_000,
    retry:     false,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const usePostMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fd) => mensajesForoCreate(fd),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['forum-messages', foroId] }),
  });
};

export const useLikeMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msgId) => mensajesForoToggleLike(msgId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['forum-messages', foroId] }),
  });
};

export const useDeleteMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msgId) => mensajesForoDelete(msgId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['forum-messages', foroId] }),
  });
};

export const useEditMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contenido }) => mensajesForoUpdate(id, { contenido }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['forum-messages', foroId] }),
  });
};

export const useToggleEstado = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ estado }) => forosCambiarEstado(foroId, { estado }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['forum',            foroId] });
      qc.invalidateQueries({ queryKey: ['forum-dashboard',  foroId] });
    },
  });
};
