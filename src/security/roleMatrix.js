// src/security/roleMatrix.js

const { PERMISSIONS } = require('./permissions');

const ROLES = {
  ADMIN: "admin",
  DOCENTE: "docente",
  PADRE: "padre",
  ESTUDIANTE: "estudiante",
};

const rolePermissions = {
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

function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase();

  if (r.includes("admin")) return ROLES.ADMIN;
  if (r.includes("docente")) return ROLES.DOCENTE;
  if (r.includes("padre")) return ROLES.PADRE;
  if (r.includes("estudiante")) return ROLES.ESTUDIANTE;

  return r;
}

function getPermissionsForRole(role) {
  const r = normalizeRole(role);
  return rolePermissions[r] || [];
}

module.exports = {
  ROLES,
  rolePermissions,
  normalizeRole,
  getPermissionsForRole
};