// src/security/roleMatrix.js
// USA ES module syntax (export/import) — requerido por Vite.
import { PERMISSIONS } from "./permissions.js";

// ─── Constantes de rol ────────────────────────────────────────────────────────
// NOTA: no existe rol "estudiante" en el backend. Los perfiles familiares
// (perfilFamiliarController.js) generan el token a partir del propio titular
// (rol: 'padre') y solo varían perfilId/esTitular — el rol nunca cambia.
// Si en el futuro un perfil de estudiante necesita permisos distintos a los
// del padre titular, eso requiere bifurcar por `esTitular` en
// getPermissionsForRole(), no agregar un rol nuevo aquí.
export const ROLES = {
  ADMIN:      "administrador",
  DOCENTE:    "docente",
  PADRE:      "padre",
  SUPERADMIN: "superadmin",
};

// ─── Matriz de permisos ───────────────────────────────────────────────────────
const ALL = Object.values(PERMISSIONS);

const rolePermissions = {

  // confirmado: usuarioPerteneceACurso() → true siempre para superadmin
  [ROLES.SUPERADMIN]: ALL,

  // confirmado ALL por ausencia de restricción de tipo de permiso en todos los
  // controladores revisados (calendario, cursos, eventos, foros, módulos).
  // El aislamiento real de admin es por institucionId (capa de scope separada
  // de la matriz de permisos), no por tipo de acción.
 [ROLES.ADMIN]: ALL.filter(
    (p) =>
      ![
        PERMISSIONS.MANAGE_TASKS,   // no puede crear/editar tareas
        PERMISSIONS.MANAGE_MODULES, // no puede crear/editar módulos
        PERMISSIONS.CREATE_FORO,    // no puede crear foros
        PERMISSIONS.MANAGE_FORO, // no puede editar/eliminar/cambiar estado de foros
        PERMISSIONS.CREATE_EVENTS,   // no puede crear eventos
        PERMISSIONS.MANAGE_FAMILY_PROFILES, // no puede crear/editar perfiles familiares
      ].includes(p)
  ),

  [ROLES.DOCENTE]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSES,         
    PERMISSIONS.GRADE_TASKS,             // legado — mantenido por compatibilidad

    PERMISSIONS.VIEW_COURSE_PARTICIPANTS,     // confirmado: getParticipantesCurso
    PERMISSIONS.MANAGE_COURSE_PARTICIPANTS,   // confirmado: agregarParticipante/removerParticipante

    PERMISSIONS.VIEW_MODULES,
    PERMISSIONS.MANAGE_MODULES,          // confirmado: verificarPermisoModulo → usuarioPerteneceACurso

    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,

    PERMISSIONS.VIEW_ENTREGAS,
    PERMISSIONS.GRADE_ENTREGAS,

    PERMISSIONS.VIEW_FOROS,              // confirmado: obtenerForosPorCurso
    PERMISSIONS.CREATE_FORO,             // confirmado: crearForo (ownership check)
    PERMISSIONS.MANAGE_FORO,             // confirmado: actualizarForo/eliminarForo/cambiarEstadoForo
    PERMISSIONS.POST_MENSAJE_FORO,
    PERMISSIONS.REPLY_MENSAJE_FORO,

    PERMISSIONS.VIEW_EVENTS,             // confirmado: getEventos filtra por docenteId
    PERMISSIONS.CREATE_EVENTS,           // confirmado: createEvento restringe a cursos propios

    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  // FIX: sin VIEW_COURSE_PARTICIPANTS — ningún controlador expone esa vista a
  // padre (getParticipantesCurso solo chequea docente/admin).
  [ROLES.PADRE]: [
    PERMISSIONS.VIEW_COURSES,            // confirmado: getMisCursos, obtenerCalendarioUsuario

    PERMISSIONS.VIEW_MODULES,            // confirmado: usuarioPerteneceACurso incluye padre participante
    PERMISSIONS.VIEW_TASKS,

    PERMISSIONS.VIEW_ENTREGAS,
    PERMISSIONS.SUBMIT_ENTREGA,

    PERMISSIONS.VIEW_FOROS,              // confirmado: foro.tieneAcceso() incluye participante
    PERMISSIONS.REPLY_MENSAJE_FORO,

    PERMISSIONS.VIEW_EVENTS,             // confirmado: getEventos filtra por cursos del padre

    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_FAMILY_PROFILES,  // confirmado: perfilFamiliarController — CRUD sobre titularId
  ],
};

// ─── Normalización de rol ─────────────────────────────────────────────────────
export function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase().trim();

  if (r === "superadmin" || r.includes("superadmin")) return ROLES.SUPERADMIN;
  if (r.includes("admin"))                             return ROLES.ADMIN;
  if (r.includes("docente"))                           return ROLES.DOCENTE;
  if (r.includes("padre") || r.includes("tutor"))      return ROLES.PADRE;

  return r;
}

// ─── Getters ──────────────────────────────────────────────────────────────────
export function getPermissionsForRole(role) {
  const normalized = normalizeRole(role);
  return rolePermissions[normalized] ?? [];
}

export function tienePermiso(role, permission) {
  return getPermissionsForRole(role).includes(permission);
}

export function tieneTodosLosPermisos(role, permissions = []) {
  const perms = getPermissionsForRole(role);
  return permissions.every((p) => perms.includes(p));
}

export function tieneAlgunPermiso(role, permissions = []) {
  const perms = getPermissionsForRole(role);
  return permissions.some((p) => perms.includes(p));
}