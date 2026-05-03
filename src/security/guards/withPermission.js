// src/security/guards/withPermission.js (working copy)
import React from "react";
import { useAuthContext } from "../features/auth/context/AuthContext"; // relative to src root
import { getPermissionsForRole } from "../roleMatrix"; // working copy path

export const withPermission = (permission) => (Component) => {
  return function Guarded(props) {
    const { user, loading } = useAuthContext();
    if (loading) return null;
    if (!user) return null;
    const permissions = getPermissionsForRole(user.role ?? user.rol);
    if (!permissions.includes(permission)) return null;
    return <Component {...props} />;
  };
};

export default withPermission;

// NOTE: For final cleanup, move this file to src/security/guards/withPermission.js and update imports.
