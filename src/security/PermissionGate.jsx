import { usePermission, useAnyPermission } from "@/hooks/usePermission";

export function PermissionGate({ permission, anyOf, fallback = null, children }) {
  const singleOk = usePermission(permission ?? "");
  const anyOk    = useAnyPermission(...(anyOf ?? []));

  const allowed = anyOf ? anyOk : singleOk;
  return allowed ? children : fallback;
}

export default PermissionGate;
