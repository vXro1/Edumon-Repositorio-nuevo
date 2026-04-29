import { baseNav } from "./baseNav";
import { superadminNav } from "./superadminNav";
import { adminNav } from "./adminNav";
import { teacherNav } from "./teacherNav";
import { parentNav } from "./parentNav";

export const navigationByRole = {
  base: baseNav,
  superadmin: superadminNav,
  admin: adminNav,
  teacher: teacherNav,
  parent: parentNav
};