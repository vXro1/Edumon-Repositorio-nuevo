import { baseNav } from "./baseNav";

export const parentNav = [
  ...baseNav,
  {
    label: "Mis hijos / perfiles",
    path: "/family/profiles",
    icon: "users"
  },
  
  {
    label: "Entregas",
    path: "/family/submissions",
    icon: "file-text"
  }
];