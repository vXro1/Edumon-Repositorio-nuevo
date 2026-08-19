import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../features/auth/context/AuthContext";
import { LoadingScreen } from "@/components";
export const ROLE_HOME = {
  superadmin:    "/admin",
  administrador: "/admin",
  docente:       "/docente",
  padre:         "/padre",
  "padre/tutor": "/padre",  // alias de compatibilidad
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuthContext();
  const location = useLocation();

  // Muestra LoadingScreen mientras se verifica la sesión inicial
  if (loading) return <LoadingScreen message="Verificando sesión..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sesión restaurada (refresh, reapertura de pestaña) con la contraseña
  // temporal aún activa: el redirect de LoginPage solo dispara justo al
  // enviar el formulario, así que cualquier otra ruta protegida debe
  // reforzarlo también o el usuario puede saltarse el wizard por completo.
  if (user?.primerInicioSesion && location.pathname !== "/primer-inicio") {
    return <Navigate to="/primer-inicio" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to={ROLE_HOME[user?.rol] ?? "/login"} replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthContext();

  if (loading) return <LoadingScreen message="Verificando sesión..." />;

  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME[user?.rol] ?? "/dashboard"} replace />;
  }

  return children;
};

export const RoleRedirect = () => {
  const { user, loading } = useAuthContext();

  if (loading) return <LoadingScreen message="Verificando sesión..." />;

  return <Navigate to={ROLE_HOME[user?.rol] ?? "/login"} replace />;
};
