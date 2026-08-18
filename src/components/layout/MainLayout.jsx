import { useState, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/features/auth/hooks/useAuth";
import useUserPresence from "@/hooks/useUserPresence";
import { Sidebar } from "./Sidebar";
import { Navbar }  from "./Navbar";

export const MainLayout = () => {
  const { user, logout } = useUser();
  const location = useLocation();
  const [collapsed,  setCollapsed]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useUserPresence(user?._id);

  // Los tokens de marca del dashboard (azul) están scopeados a la clase
  // .app-shell (ver tokens.css) — pero Toast/ToastContext usan createPortal
  // directo a document.body, FUERA del árbol de .app-shell, así que la
  // cascada de CSS custom properties nunca los alcanzaba y los toasts
  // seguían viéndose morados aunque se dispararan desde el dashboard.
  // Reflejar la misma clase en <body> mientras el dashboard está montado
  // resuelve esto: el portal es descendiente de <body>, así que ahora sí
  // hereda el bloque .app-shell de tokens.css. Al salir del dashboard
  // (logout, navegar a /login) el efecto limpia la clase y el portal
  // vuelve a heredar el morado original de :root.
  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  const handleToggleCollapse = useCallback(() => setCollapsed((c) => !c), []);
  const handleCloseDrawer    = useCallback(() => setDrawerOpen(false), []);
  const handleToggleDrawer   = useCallback(() => setDrawerOpen((d) => !d), []);

  return (
    <div className={`app-shell${collapsed ? " collapsed" : ""}`}>

      {drawerOpen && (
        <div
          className="sidebar-backdrop open"
          onClick={handleCloseDrawer}
          aria-hidden="true"
        />
      )}

      <Sidebar
        user={user}
        logout={logout}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        drawerOpen={drawerOpen}
        onCloseDrawer={handleCloseDrawer}
      />

      <div className="main">
        <Navbar
          user={user}
          logout={logout}
          drawerOpen={drawerOpen}
          onToggleDrawer={handleToggleDrawer}
        />
        <main key={location.key} className="page">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default MainLayout;