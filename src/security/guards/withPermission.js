import React from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getPermissionsForRole } from "@/security/roleMatrix";

export const withPermission = (permission) => (Component) => {
  return function Guarded(props) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return null;
    const permissions = getPermissionsForRole(user.rol ?? user.role);
    if (!permissions.includes(permission)) return null;
    return <Component {...props} />;
  };
};

export default withPermission;
