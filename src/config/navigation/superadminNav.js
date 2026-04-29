import { baseNav } from "./baseNav";

export const superadminNav = [
  ...baseNav,
  {
    label: "Instituciones",
    path: "/institutions",
    icon: "building"
  },
  {
    label: "Usuarios globales",
    path: "/users",
    icon: "users"
  }
];