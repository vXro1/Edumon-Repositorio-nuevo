import { baseNav } from "./baseNav";

export const teacherNav = [
  ...baseNav,
  {
    label: "Mis cursos",
    path: "/cursos",
    icon: "book-open"
  },
  {
    label: "Tareas",
    path: "/tareas",
    icon: "clipboard"
  },
  {
    label: "Foros",
    path: "/foros",
    icon: "message-circle"
  },
  {
    label: "Eventos",
    path: "/eventos",
    icon: "calendar-event"
  }
];