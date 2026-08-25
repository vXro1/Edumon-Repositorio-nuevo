// src/config/navigation/navGroups.js
// Configuración de navegación por rol para el Sidebar.
import {
  Home, BookOpen, Bell, Calendar, Building2, Layers,
  GraduationCap, ClipboardList, MessageCircle, Users, FileText,
} from "lucide-react";

export const ICONS = {
  home:                 Home,
  book:                 BookOpen,
  "book-open":          BookOpen,
  bell:                 Bell,
  calendar:             Calendar,
  school:               Building2,
  building:             Building2,
  layers:               Layers,
  "chalkboard-teacher": GraduationCap,
  clipboard:            ClipboardList,
  "message-circle":     MessageCircle,
  users:                Users,
  "file-text":          FileText,
};

export const ROLE_LABELS = {
  superadmin:    "Super Admin",
  administrador: "Administrador",
  docente:       "Docente",
  padre:         "Padre / Tutor",
  "padre/tutor": "Padre / Tutor",
};

export const NAV_GROUPS = {
  superadmin: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/admin", icon: "home", exact: true }],
    },
    {
      group: "Gestion global",
      items: [
        { label: "Instituciones", path: "/instituciones", icon: "building" },
        { label: "Usuarios",      path: "/usuarios",      icon: "users" },
      ],
    },
    {
      group: "Sistema",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],

  administrador: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/admin", icon: "home", exact: true }],
    },
    {
      group: "Mi institucion",
      items: [
        { label: "Institucion", path: "/institucion", icon: "school" },
        { label: "Docentes",    path: "/docentes",    icon: "chalkboard-teacher" },
        { label: "Cursos",      path: "/cursos",      icon: "layers" },
        { label: "Calendario",  path: "/calendario",  icon: "calendar" },
      ],
    },
    {
      group: "Comunicacion",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],

  docente: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/docente", icon: "home", exact: true }],
    },
    {
      group: "Ensenanza",
      items: [
        { label: "Cursos",      path: "/cursos",      icon: "layers" },
        { label: "Retos",       path: "/tareas",      icon: "clipboard" },
        { label: "Foros",       path: "/foros",       icon: "message-circle" },
        { label: "Calendario",  path: "/calendario",  icon: "calendar" },
      ],
    },
    {
      group: "Comunicacion",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],

  padre: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/padre", icon: "home", exact: true }],
    },
    {
      group: "Mis hijos",
      // "Retos" y "Entregas" eran dos entradas separadas para el mismo
      // flujo: cada reto de la lista ya lleva directo a su entrega
      // (/familia/entregas/:tareaId, una sola vista por reto — ver
      // FamiliaTareasPage.jsx). Tener las dos en el menú duplicaba el
      // mismo contenido bajo dos nombres distintos y era confuso.
      items: [
        { label: "Perfiles",   path: "/familia/perfiles",   icon: "users" },
        { label: "Cursos",     path: "/familia/cursos",     icon: "layers" },
        { label: "Retos",      path: "/familia/tareas",     icon: "clipboard" },
        { label: "Foros",      path: "/familia/foros",      icon: "message-circle" },
        { label: "Calendario", path: "/calendario",          icon: "calendar" },
      ],
    },
    {
      group: "Comunicacion",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],
};

NAV_GROUPS["padre/tutor"] = NAV_GROUPS.padre;
