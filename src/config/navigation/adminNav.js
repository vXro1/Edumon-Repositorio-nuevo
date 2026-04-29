import { baseNav } from "./baseNav";

export const adminNav = [
  ...baseNav,
  {
    label: "Mi institución",
    path: "/institution",
    icon: "school"
  },
  {
    label: "Docentes",
    path: "/institution/teachers",
    icon: "chalkboard-teacher"
  },
  {
    label: "Gestión de cursos",
    path: "/institution/courses",
    icon: "layers"
  }
];