// src/security/roleMatrix.js
// USA ES module syntax (export/import) — requerido por Vite.
// El archivo anterior usaba module.exports (CommonJS), incompatible con el bundler.
import { PERMISSIONS } from "./permissions.js";

// ─── Constantes de rol ────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:      "admin",
  DOCENTE:    "docente",
  PADRE:      "padre",
  ESTUDIANTE: "estudiante",
  SUPERADMIN: "superadmin",
};

// ─── Matriz de permisos ───────────────────────────────────────────────────────
const ALL = Object.values(PERMISSIONS);

const rolePermissions = {

  [ROLES.SUPERADMIN]: ALL,

  [ROLES.ADMIN]: ALL,

  [ROLES.DOCENTE]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSES,
    PERMISSIONS.GRADE_TASKS,             // legacy — mantenido por compatibilidad

    PERMISSIONS.VIEW_COURSE_PARTICIPANTS,
    PERMISSIONS.MANAGE_COURSE_PARTICIPANTS,

    PERMISSIONS.VIEW_MODULES,
    PERMISSIONS.MANAGE_MODULES,

    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,

    PERMISSIONS.VIEW_ENTREGAS,
    PERMISSIONS.GRADE_ENTREGAS,

    PERMISSIONS.VIEW_FOROS,
    PERMISSIONS.CREATE_FORO,
    PERMISSIONS.MANAGE_FORO,
    PERMISSIONS.POST_MENSAJE_FORO,
    PERMISSIONS.REPLY_MENSAJE_FORO,

    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.CREATE_EVENTS,

    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  // FIX: VIEW_COURSE_PARTICIPANTS eliminado — padres no ven la sección participantes
  [ROLES.PADRE]: [
    PERMISSIONS.VIEW_COURSES,

    PERMISSIONS.VIEW_MODULES,
    PERMISSIONS.VIEW_TASKS,

    PERMISSIONS.VIEW_ENTREGAS,
    PERMISSIONS.SUBMIT_ENTREGA,

    PERMISSIONS.VIEW_FOROS,
    PERMISSIONS.REPLY_MENSAJE_FORO,

    PERMISSIONS.VIEW_EVENTS,

    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_FAMILY_PROFILES,
  ],

  [ROLES.ESTUDIANTE]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_MODULES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ENTREGAS,
    PERMISSIONS.VIEW_FOROS,
    PERMISSIONS.REPLY_MENSAJE_FORO,
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
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
  if (r.includes("estudiante"))                        return ROLES.ESTUDIANTE;

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