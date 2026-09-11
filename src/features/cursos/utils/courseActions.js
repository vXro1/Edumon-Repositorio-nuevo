// Fuente única de verdad: qué puede hacer cada rol dentro de un curso.
// Las acciones son objetos navegables — NO texto decorativo.

import { normalizeRole, ROLES } from "@/security/roleMatrix";

/**
 * Devuelve las acciones de una CourseCard según el rol.
 * Cada acción tiene:
 *   label    — texto del botón
 *   icon     — nombre del icono (cadena, el componente decide cuál importar)
 *   path     — ruta a la que navegar
 *   variant  — "primary" | "outline" | "ghost"
 *   order    — posición visual
 */
export function getCourseActionsByRole(role, courseId) {
  const r = normalizeRole(role);

  switch (r) {

    case ROLES.DOCENTE:
      return [
        {
          key:     "hub",
          label:   "Abrir curso",
          icon:    "BookOpen",
          path:    `/cursos/${courseId}`,
          variant: "primary",
          order:   0,
        },
        {
          key:     "tareas",
          label:   "Retos",
          icon:    "ClipboardList",
          path:    `/cursos/${courseId}?tab=tareas`,
          variant: "outline",
          order:   1,
        },
        {
          key:     "entregas",
          label:   "Entregas",
          icon:    "CheckSquare",
          path:    `/cursos/${courseId}?tab=entregas`,
          variant: "outline",
          order:   2,
        },
      ];

    case ROLES.PADRE:
      return [
        {
          key:     "hub",
          label:   "Ver curso",
          icon:    "BookOpen",
          path:    `/cursos/${courseId}`,
          variant: "primary",
          order:   0,
        },
        {
          key:     "tareas",
          label:   "Retos",
          icon:    "ClipboardList",
          path:    `/cursos/${courseId}?tab=tareas`,
          variant: "outline",
          order:   1,
        },
        {
          key:     "entregas",
          label:   "Progreso",
          icon:    "TrendingUp",
          path:    `/cursos/${courseId}?tab=entregas`,
          variant: "ghost",
          order:   2,
        },
      ];

    case ROLES.ESTUDIANTE:
      return [
        {
          key:     "hub",
          label:   "Entrar",
          icon:    "BookOpen",
          path:    `/cursos/${courseId}`,
          variant: "primary",
          order:   0,
        },
        {
          key:     "tareas",
          label:   "Mis retos",
          icon:    "ClipboardList",
          path:    `/cursos/${courseId}?tab=tareas`,
          variant: "outline",
          order:   1,
        },
      ];

    case ROLES.ADMIN:
    case ROLES.SUPERADMIN:
      return [
        {
          key:     "hub",
          label:   "Ver curso",
          icon:    "BookOpen",
          path:    `/cursos/${courseId}`,
          variant: "primary",
          order:   0,
        },
        {
          key:     "participantes",
          label:   "Participantes",
          icon:    "Users",
          path:    `/cursos/${courseId}?tab=participantes`,
          variant: "outline",
          order:   1,
        },
      ];

    default:
      return [
        {
          key:     "hub",
          label:   "Ver curso",
          icon:    "BookOpen",
          path:    `/cursos/${courseId}`,
          variant: "primary",
          order:   0,
        },
      ];
  }
}

export function getCourseMainPath(courseId) {
  return `/cursos/${courseId}`;
}