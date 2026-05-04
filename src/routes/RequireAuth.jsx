import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../features/auth/context/AuthContext";
import { LoadingScreen } from "@/components";
export const RequireAuth = () => {
  const { isAuthenticated, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return <LoadingScreen message="Verificando sesión..." />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;
