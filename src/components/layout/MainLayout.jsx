// src/components/layout/MainLayout.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, Bell, Calendar, Building2, Layers,
  GraduationCap, ClipboardList, MessageCircle, Users,
  FileText, LogOut, Search, PanelLeftClose, PanelLeftOpen,
  Settings, UserCircle, Inbox, Menu, X,
} from "lucide-react";
import { normalizeRole } from "@/security/roleMatrix";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";
import { UserAvatar } from "@/components";
import { NotifBadge } from "@/components";
import useUserPresence from "@/hooks/useUserPresence";
import { notificacionesGetConteoNoLeidas } from "@/lib/apiClient";

/* ── Icon registry ─────────────────────────────────────────────────── */
const ICON_MAP = {
  home:                 Home,
  book:                 BookOpen,
  "book-open":          BookOpen,
  bell:                 Bell,
  calendar:             Calendar,
  "calendar-event":     Calendar,
  school:               Building2,
  building:             Building2,
  layers:               Layers,
  "chalkboard-teacher": GraduationCap,
  clipboard:            ClipboardList,
  "message-circle":     MessageCircle,
  users:                Users,
  "file-text":          FileText,
  settings:             Settings,
  "user-circle":        UserCircle,
  inbox:                Inbox,
};

/* ── Nav config ────────────────────────────────────────────────────── */
const NAV_GROUPS = {
  superadmin: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/admin", icon: "home", exact: true }],
    },
    {
      group: "Gestión global",
      items: [
        { label: "Instituciones", path: "/instituciones", icon: "building" },
        { label: "Usuarios",      path: "/usuarios",      icon: "users" },
      ],
    },
    {
      group: "Sistema",
      items: [
        { label: "Buzón",          path: "/buzon",          icon: "inbox" },
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil",      path: "/perfil",         icon: "user-circle" },
      ],
    },
  ],
  docente: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/docente", icon: "home", exact: true }],
    },
    {
      group: "Mi trabajo",
      items: [
        { label: "Mis cursos",  path: "/cursos",     icon: "book-open" },
        { label: "Tareas",      path: "/tareas",     icon: "clipboard" },
        { label: "Foros",       path: "/foros",      icon: "message-circle" },
        { label: "Calendario",  path: "/calendario", icon: "calendar-event" },
      ],
    },
    {
      group: "Comunicación",
      items: [
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil",      path: "/perfil",         icon: "user-circle" },
      ],
    },
  ],
  padre: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/padre", icon: "home", exact: true }],
    },
    {
      group: "Mi familia",
      items: [
        { label: "Perfiles",   path: "/familia/perfiles",   icon: "users" },
        { label: "Cursos",     path: "/familia/cursos",     icon: "book-open" },
        { label: "Tareas",     path: "/familia/tareas",     icon: "clipboard" },
        { label: "Entregas",   path: "/familia/entregas",   icon: "file-text" },
        { label: "Foros",      path: "/familia/foros",      icon: "message-circle" },
        { label: "Calendario", path: "/familia/calendario", icon: "calendar-event" },
      ],
    },
    {
      group: "Comunicación",
      items: [
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil",      path: "/perfil",         icon: "user-circle" },
      ],
    },
  ],
  admin: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/admin", icon: "home", exact: true }],
    },
    {
      group: "Mi institución",
      items: [
        { label: "Institución", path: "/institucion", icon: "school" },
        { label: "Docentes",    path: "/docentes",    icon: "chalkboard-teacher" },
        { label: "Cursos",      path: "/cursos",      icon: "layers" },
        { label: "Calendario",  path: "/calendario",  icon: "calendar-event" },
      ],
    },
    {
      group: "Comunicación",
      items: [
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil",      path: "/perfil",         icon: "user-circle" },
      ],
    },
  ],
};

const ROLE_META = {
  superadmin: { label: "Super Admin" },
  admin:      { label: "Administrador" },
  docente:    { label: "Docente" },
  padre:      { label: "Padre / Tutor" },
};

/* ── Section scope ─────────────────────────────────────────────────── */
function getSectionClass(pathname) {
  if (pathname.startsWith("/cursos"))        return "section-cursos";
  if (pathname.startsWith("/tareas"))        return "section-tareas";
  if (pathname.startsWith("/notificaciones")) return "section-foros";
  if (pathname.startsWith("/calendario"))   return "section-calendario";
  if (pathname.startsWith("/familia/calendario")) return "section-calendario";
  return "section-inicio";
}

/* ── NavItem ───────────────────────────────────────────────────────── */
function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  const Icon = ICON_MAP[item.icon] ?? Home;
  const isActive = item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={item.label}
      aria-current={isActive ? "page" : undefined}
      className={`sidebar-item${isActive ? " active" : ""}`}
      style={{ justifyContent: collapsed ? "center" : "flex-start" }}
    >
      <span className="ico" aria-hidden="true">
        <Icon size={16} />
      </span>
      {!collapsed && <span className="lbl">{item.label}</span>}
    </Link>
  );
}

/* ── MainLayout ────────────────────────────────────────────────────── */
export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useUserPresence(user?._id);

  const { query, results, isOpen, setIsOpen, handleSearch, clearSearch } = useSearch();

  const [collapsed,    setCollapsed]   = useState(false);
  const [drawerOpen,   setDrawerOpen]  = useState(false);
  const [notifCount,   setNotifCount]  = useState(0);
  const [navScrolled,  setNavScrolled] = useState(false);
  const intervalRef   = useRef(null);
  const pageRef       = useRef(null);

  /* Notification polling */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificacionesGetConteoNoLeidas();
        setNotifCount(res?.noLeidas ?? 0);
      } catch { /* silencioso */ }
    };
    fetch();
    intervalRef.current = setInterval(fetch, 60_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  /* Close drawer on route change */
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  /* Navbar scroll shadow — escucha scroll en .page (no en window) */
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const onScroll = () => setNavScrolled(el.scrollTop > 4);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock body scroll when drawer open on mobile */
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer   = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer  = useCallback(() => setDrawerOpen(o => !o), []);
  const toggleCollapse = useCallback(() => setCollapsed(c => !c), []);

  const groups   = NAV_GROUPS[normalizeRole(user?.rol)] ?? [];
  const roleMeta = ROLE_META[normalizeRole(user?.rol)] ?? { label: user?.rol };
  const section  = getSectionClass(location.pathname);
  const role     = normalizeRole(user?.rol);

  /* On tablet the sidebar auto-collapses */
  const isCollapsed = collapsed;

  return (
    <div
      className={`app-shell ${section}${isCollapsed ? " collapsed" : ""}`}
    >
      {/* ── MOBILE BACKDROP ── */}
      <div
        className={`sidebar-backdrop${drawerOpen ? " open" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── SIDEBAR ── */}
      <aside
        className={`sidebar${drawerOpen ? " drawer-open" : ""}`}
        aria-label="Navegación principal"
      >
        {/* Brand + collapse toggle row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "var(--space-1)" }}>
          <Link
            to={role === "padre" ? "/padre" : role === "docente" ? "/docente" : "/admin"}
            className="sidebar-brand"
            style={{ padding: "6px 10px", paddingBottom: 0, flex: 1, minWidth: 0 }}
          >
            {!isCollapsed && (
              <>
                <span>Edu</span>
                <span className="mon">mon</span>
              </>
            )}
            {isCollapsed && (
              <span className="mon" style={{ fontSize: 20 }}>E</span>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="nav-icon-btn"
            title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
            aria-label={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
            style={{ flexShrink: 0 }}
            id="sidebar-collapse-btn"
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={closeDrawer}
            className="nav-icon-btn"
            title="Cerrar menú"
            aria-label="Cerrar menú"
            id="sidebar-close-btn"
            style={{ flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, minHeight: 0 }}>
          {groups.map(({ group, items }) => (
            <div key={group}>
              {!isCollapsed && <p className="sidebar-section">{group}</p>}
              {items.map(item => (
                <NavItem
                  key={item.path}
                  item={item}
                  collapsed={isCollapsed}
                  onClick={closeDrawer}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="sidebar-card" style={{ cursor: "default" }}>
          <button
            className="nav-icon-btn"
            onClick={() => navigate("/perfil")}
            title="Mi perfil"
            aria-label="Ver mi perfil"
            style={{ padding: 0, background: "none", border: "none", flexShrink: 0 }}
          >
            <UserAvatar user={user} size={34} />
          </button>

          {!isCollapsed && (
            <button
              onClick={() => navigate("/perfil")}
              style={{
                flex: 1, minWidth: 0, background: "none", border: "none",
                padding: 0, cursor: "pointer", textAlign: "left",
              }}
              title="Ver mi perfil"
            >
              <div className="who">
                <span className="name">{user?.nombre} {user?.apellido}</span>
                <span className="role">{roleMeta.label}</span>
              </div>
            </button>
          )}

          <button
            className="nav-icon-btn"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            style={{ marginLeft: isCollapsed ? 0 : "auto", flexShrink: 0 }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">

        {/* Navbar */}
        <header className={`navbar${navScrolled ? " scrolled" : ""}`} role="banner">

          {/* Hamburger — mobile + tablet */}
          <button
            className="nav-hamburger"
            onClick={toggleDrawer}
            aria-label="Abrir menú de navegación"
            aria-expanded={drawerOpen}
            aria-controls="sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="nav-search" role="search">
            <Search className="search-icon" size={16} aria-hidden="true" />
            <input
              type="search"
              name="search"
              placeholder="Buscar cursos, tareas…"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              aria-label="Buscar cursos y tareas"
              autoComplete="off"
            />

            {/* Search results dropdown */}
            {isOpen && (results.cursos?.length > 0 || results.tareas?.length > 0) && (
              <div className="nav-search-results" role="listbox" aria-label="Resultados de búsqueda">
                {results.cursos?.map(c => (
                  <button
                    key={c._id}
                    className="sidebar-item"
                    role="option"
                    style={{ width: "100%", borderRadius: 0, padding: "10px 16px" }}
                    onMouseDown={() => { navigate(`/cursos/${c._id}`); clearSearch(); }}
                  >
                    <span className="ico"><BookOpen size={14} /></span>
                    <span className="lbl">{c.nombre}</span>
                  </button>
                ))}
                {results.tareas?.map(t => (
                  <button
                    key={t._id}
                    className="sidebar-item"
                    role="option"
                    style={{ width: "100%", borderRadius: 0, padding: "10px 16px" }}
                    onMouseDown={() => { navigate(`/tareas/${t._id}`); clearSearch(); }}
                  >
                    <span className="ico"><ClipboardList size={14} /></span>
                    <span className="lbl">{t.titulo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="nav-actions" role="toolbar" aria-label="Acciones de usuario">
            {role === "superadmin" && (
              <button
                className="nav-icon-btn"
                onClick={() => navigate("/buzon")}
                title="Buzón de contacto"
                aria-label="Buzón de contacto"
              >
                <Inbox size={18} />
              </button>
            )}

            <button
              className="nav-icon-btn"
              onClick={() => navigate("/notificaciones")}
              title={`Notificaciones${notifCount > 0 ? ` (${notifCount} sin leer)` : ""}`}
              aria-label={`Notificaciones${notifCount > 0 ? `, ${notifCount} sin leer` : ""}`}
            >
              <Bell size={18} />
              {notifCount > 0 && <NotifBadge count={notifCount} />}
            </button>

            <button
              className="nav-icon-btn"
              onClick={() => navigate("/perfil")}
              title="Mi perfil"
              aria-label="Mi perfil"
            >
              <UserAvatar user={user} size={28} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page" ref={pageRef} id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* CSS for desktop collapse toggle visibility */}
      <style>{`
        @media (min-width: 1024px) {
          #sidebar-collapse-btn { display: inline-flex !important; }
          #sidebar-close-btn    { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
