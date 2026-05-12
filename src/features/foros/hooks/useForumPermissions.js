// src/features/foros/hooks/useForumPermissions.js
// Role-based permission hook for the unified ForumPage.
// All roles see the same UI; only available actions differ.

const CAN_CREATE  = ['docente', 'administrador', 'superadmin'];
const CAN_MANAGE  = ['docente', 'administrador', 'superadmin'];
const CAN_POST    = ['docente', 'administrador', 'superadmin', 'estudiante', 'padre', 'padre/tutor'];

export const useForumPermissions = (user) => {
  const rol    = user?.rol    ?? '';
  const userId = user?._id    ?? user?.userId ?? '';

  return {
    canCreateForum:  CAN_CREATE.includes(rol),
    canManageForum:  CAN_MANAGE.includes(rol),
    canToggleEstado: CAN_MANAGE.includes(rol),
    canPostMessage:  CAN_POST.includes(rol),
    canReply:        CAN_POST.includes(rol),
    canLike:         !!userId,

    canEditMessage: (authorId) =>
      !!authorId && String(authorId) === String(userId),

    canDeleteMessage: (authorId) =>
      CAN_MANAGE.includes(rol) ||
      (!!authorId && String(authorId) === String(userId)),

    userId,
    rol,
  };
};
