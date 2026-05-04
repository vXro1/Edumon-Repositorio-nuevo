// src/security/permissions.js
export const PERMISSIONS = {

  // ─── Permisos base (existentes — compatibilidad mantenida) ────────────────
  MANAGE_USERS:   "MANAGE_USERS",
  VIEW_COURSES:   "VIEW_COURSES",
  CREATE_COURSES: "CREATE_COURSES",
  GRADE_TASKS:    "GRADE_TASKS",
  VIEW_REPORTS:   "VIEW_REPORTS",

  // ─── Secciones internas de curso ──────────────────────────────────────────
  VIEW_COURSE_PARTICIPANTS:   "VIEW_COURSE_PARTICIPANTS",
  MANAGE_COURSE_PARTICIPANTS: "MANAGE_COURSE_PARTICIPANTS",

  VIEW_MODULES:   "VIEW_MODULES",
  MANAGE_MODULES: "MANAGE_MODULES",

  VIEW_TASKS:   "VIEW_TASKS",
  MANAGE_TASKS: "MANAGE_TASKS",

  VIEW_ENTREGAS:  "VIEW_ENTREGAS",
  SUBMIT_ENTREGA: "SUBMIT_ENTREGA",
  GRADE_ENTREGAS: "GRADE_ENTREGAS",

  VIEW_FOROS:         "VIEW_FOROS",
  CREATE_FORO:        "CREATE_FORO",
  MANAGE_FORO:        "MANAGE_FORO",
  POST_MENSAJE_FORO:  "POST_MENSAJE_FORO",
  REPLY_MENSAJE_FORO: "REPLY_MENSAJE_FORO",

  // ─── Eventos ──────────────────────────────────────────────────────────────
  VIEW_EVENTS:   "VIEW_EVENTS",
  CREATE_EVENTS: "CREATE_EVENTS",

  // ─── Instituciones ────────────────────────────────────────────────────────
  MANAGE_INSTITUTIONS: "MANAGE_INSTITUTIONS",

  // ─── Notificaciones ───────────────────────────────────────────────────────
  VIEW_NOTIFICATIONS: "VIEW_NOTIFICATIONS",

  // ─── Perfiles familiares ──────────────────────────────────────────────────
  MANAGE_FAMILY_PROFILES: "MANAGE_FAMILY_PROFILES",
};