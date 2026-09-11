import { useUser } from "@/features/auth/hooks/useAuth";
import {
  tienePermiso,
  tieneAlgunPermiso,
  tieneTodosLosPermisos,
} from "@/security/roleMatrix";
export { PERMISSIONS } from "@/security/permissions";

/**
 * Returns true if the current user has the given permission.
 * @param {string} permission — one of PERMISSIONS.*
 */
export function usePermission(permission) {
  const { user } = useUser();
  return tienePermiso(user?.rol ?? user?.role ?? "", permission);
}

/**
 * Returns true if the user has at least one of the listed permissions.
 * Accepts a flat list or a single array.
 */
export function useAnyPermission(...perms) {
  const { user } = useUser();
  return tieneAlgunPermiso(user?.rol ?? user?.role ?? "", perms.flat());
}

/**
 * Returns true if the user has ALL of the listed permissions.
 */
export function useAllPermissions(...perms) {
  const { user } = useUser();
  return tieneTodosLosPermisos(user?.rol ?? user?.role ?? "", perms.flat());
}
