// src/features/foros/hooks/useForumData.js
// Hooks de TanStack Query para la obtención de datos y mutaciones del foro.
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
} from '@/features/foros/services/forosService';
import { normalizeForo, normalizeMensajes } from '@/lib/normalizers/foro';
import { queryKeys } from '@/services/queryKeys';

// ─── Consultas ────────────────────────────────────────────────────────────────

export const useForumDetail = (foroId) =>
  useQuery({
    queryKey:  queryKeys.foros.detail(foroId),
    queryFn:   async () => {
      const res = await forosGetById(foroId);
      return normalizeForo(res?.foro ?? res);
    },
    enabled:   !!foroId,
    staleTime: 60_000,
  });

export const useForumMessages = (foroId, currentUserId = null) =>
  useQuery({
    // currentUserId entra en la queryKey: si cambia de usuario (otra cuenta
    // logeada en la misma sesión de navegador) React Query no debe servir
    // mensajes cacheados con el yaLeDioLike del usuario anterior.
    queryKey:        [...queryKeys.foros.messages(foroId), currentUserId],
    queryFn:         async () => {
      const res = await mensajesForoGetByForo(foroId);
      const raw = res?.mensajes ?? (Array.isArray(res) ? res : []);
      return normalizeMensajes(raw, currentUserId);
    },
    enabled:         !!foroId,
    staleTime:       30_000,
    refetchInterval: 60_000,
  });

export const useForumsByCourse = (cursoId) =>
  useQuery({
    queryKey:  queryKeys.foros.byCurso(cursoId),
    queryFn:   async () => {
      const res = await forosGetByCurso(cursoId);
      const raw = res?.foros ?? (Array.isArray(res) ? res : []);
      return raw.map(normalizeForo).filter(Boolean);
    },
    enabled:   !!cursoId,
    staleTime: 60_000,
  });

// Dashboard: degradación elegante si el endpoint del backend aún no existe.
export const useForumDashboard = (foroId) =>
  useQuery({
    queryKey:  queryKeys.foros.dashboard(foroId),
    queryFn:   async () => {
      try { return await forosDashboard(foroId); }
      catch { return null; }
    },
    enabled:   !!foroId,
    staleTime: 60_000,
    retry:     false,
  });

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export const usePostMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fd) => mensajesForoCreate(fd),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.foros.messages(foroId) }),
  });
};

// Recorre mensajes + respuestas y voltea el like del que coincida con msgId,
// sin tocar el resto — usado para la actualización optimista de abajo.
function toggleLikeEnLista(mensajes, msgId) {
  return mensajes.map((m) => {
    if (m._id === msgId) {
      const liked = !m.yaLeDioLike;
      return { ...m, yaLeDioLike: liked, totalLikes: m.totalLikes + (liked ? 1 : -1) };
    }
    if (m.respuestas?.length) {
      return { ...m, respuestas: toggleLikeEnLista(m.respuestas, msgId) };
    }
    return m;
  });
}

// Actualización optimista: el corazón cambia de estado al instante, sin
// esperar la respuesta del servidor ni el refetch de la lista completa. Antes,
// como onSuccess solo invalidaba y GET /mensajes-foro/foro/:foroId nunca trae
// yaLeDioLike (ver normalizeMensaje), el corazón se veía "apagarse" solo tras
// cada like hasta el fix del normalizador — esto además lo vuelve instantáneo.
export const useLikeMessage = (foroId, currentUserId = null) => {
  const qc = useQueryClient();
  const queryKey = [...queryKeys.foros.messages(foroId), currentUserId];

  return useMutation({
    mutationFn: (msgId) => mensajesForoToggleLike(msgId),
    onMutate: async (msgId) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      if (previous) qc.setQueryData(queryKey, toggleLikeEnLista(previous, msgId));
      return { previous };
    },
    onError: (_err, _msgId, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.foros.messages(foroId) }),
  });
};

export const useDeleteMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msgId) => mensajesForoDelete(msgId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.foros.messages(foroId) }),
  });
};

export const useEditMessage = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contenido }) => mensajesForoUpdate(id, { contenido }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.foros.messages(foroId) }),
  });
};

export const useToggleEstado = (foroId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ estado }) => forosCambiarEstado(foroId, { estado }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: queryKeys.foros.detail(foroId) });
      qc.invalidateQueries({ queryKey: queryKeys.foros.dashboard(foroId) });
    },
  });
};
