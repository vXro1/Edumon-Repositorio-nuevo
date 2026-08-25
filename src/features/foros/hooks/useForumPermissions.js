import { tienePermiso } from "@/security/roleMatrix";
import { PERMISSIONS } from "@/security/permissions";

export const useForumPermissions = (user) => {
  const rol    = user?.rol ?? "";
  const userId = user?._id ?? user?.userId ?? "";

  return {
    canCreateForum:  tienePermiso(rol, PERMISSIONS.CREATE_FORO),
    canManageForum:  tienePermiso(rol, PERMISSIONS.MANAGE_FORO),
    canToggleEstado: tienePermiso(rol, PERMISSIONS.MANAGE_FORO),
    canPostMessage:  tienePermiso(rol, PERMISSIONS.POST_MENSAJE_FORO),
    canReply:        tienePermiso(rol, PERMISSIONS.REPLY_MENSAJE_FORO),
    canLike:         !!userId,

    // Regla del backend (mensajeForoController.crearMensaje): un padre
    // puede responder solo a mensajes cuyo autor sea docente o
    // administrador, nunca a mensajes de otro padre — de lo contrario el
    // envío falla con 403 "Los padres solo pueden responder a mensajes de
    // docentes". Para cualquier otro rol no hay restricción.
    canReplyToMessage: (authorRol) =>
      rol !== "padre" && rol !== "padre/tutor"
        ? true
        : ["docente", "administrador"].includes(authorRol),

    canEditMessage: (authorId) =>
      !!authorId && String(authorId) === String(userId),

    canDeleteMessage: (authorId) =>
      tienePermiso(rol, PERMISSIONS.MANAGE_FORO) ||
      (!!authorId && String(authorId) === String(userId)),

    userId,
    rol,
  };
};
