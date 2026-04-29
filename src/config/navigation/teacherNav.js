import { baseNav } from "./baseNav";

export const teacherNav = [
  ...baseNav,
  {
    label: "Mis cursos",
    path: "/teacher/courses",
    icon: "book-open"
  },
  {
    label: "Tareas",
    path: "/teacher/tasks",
    icon: "clipboard"
  },
  {
    label: "Foros",
    path: "/teacher/forums",
    icon: "message-circle"
  },
  {
    label: "Eventos",
    path: "/teacher/events",
    icon: "calendar-event"
  }
];