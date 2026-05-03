// src/security/roleMatrix.js (working copy)
import { PERMISSIONS } from './permissions';

export const ROLES = {
  ADMIN: "admin",
  DOCENTE: "docente",
  PADRE: "padre",
  ESTUDIANTE: "estudiante",
};

export const rolePermissions = {
  admin: Object.values(PERMISSIONS),

  docente: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSES,
    PERMISSIONS.GRADE_TASKS,
  ],

  padre: [
    PERMISSIONS.VIEW_COURSES,
  ],

  estudiante: [
    PERMISSIONS.VIEW_COURSES,
  ],
};

export function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase();

  if (r.includes("admin")) return ROLES.ADMIN;
  if (r.includes("docente")) return ROLES.DOCENTE;
  if (r.includes("padre")) return ROLES.PADRE;
  if (r.includes("estudiante")) return ROLES.ESTUDIANTE;

  return r;
}

export function getPermissionsForRole(role) {
  const r = normalizeRole(role);
  return rolePermissions[r] || [];
}

// NOTE: To move to src/security, run locally:
// mkdir -p src/security/guards && git mv src/roleMatrix.js src/security/roleMatrix.js
// and update imports to '../security/roleMatrix'
