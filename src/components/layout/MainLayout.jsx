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

  // los toasts usan createPortal a document.body, fuera del árbol .app-shell —
  // reflejar la clase en <body> para que hereden el azul del dashboard, no el morado de :root
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