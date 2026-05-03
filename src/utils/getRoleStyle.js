// src/utils/getRoleStyle.js
// Single source of truth for role → visual style mapping.
// Used in lists, profiles, foros, cursos — never duplicated per-file.

const ROLE_STYLES = {
  docente:       { color: "#0C6AC4", bg: "rgba(12,106,196,0.10)",   label: "Docente" },
  estudiante:    { color: "#16A34A", bg: "rgba(22,163,74,0.10)",    label: "Estudiante" },
  familia:       { color: "#D97706", bg: "rgba(217,119,6,0.10)",    label: "Familia" },
  padre:         { color: "#D97706", bg: "rgba(217,119,6,0.10)",    label: "Padre / Tutor" },
  "padre/tutor": { color: "#D97706", bg: "rgba(217,119,6,0.10)",    label: "Padre / Tutor" },
  admin:         { color: "#7C3AED", bg: "rgba(124,58,237,0.10)",   label: "Admin" },
  administrador: { color: "#7C3AED", bg: "rgba(124,58,237,0.10)",   label: "Administrador" },
  superadmin:    { color: "#F87171", bg: "rgba(248,113,113,0.12)",  label: "Super Admin" },
};

const DEFAULT_STYLE = { color: "#94A3B8", bg: "rgba(148,163,184,0.12)", label: "Usuario" };

/**
 * Returns { color, bg, label } for the given role string.
 * Falls back to a neutral gray style for unknown roles.
 *
 * @param {string} rol
 * @returns {{ color: string, bg: string, label: string }}
 */
export default function getRoleStyle(rol) {
  return ROLE_STYLES[rol] ?? DEFAULT_STYLE;
}
