// src/components/layout/MainLayout.jsx
import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, Bell, Calendar, Building2, Layers,
  GraduationCap, ClipboardList, MessageCircle, Users,
  FileText, LogOut, Menu, X, Search,
  PanelLeftClose, PanelLeftOpen, User, ChevronDown,
} from "lucide-react";

import { useAuth }     from "../../features/auth/hooks/useAuth";
import { useSearch }   from "../../context/SearchContext";
import { UserAvatar }  from "@/components";
import useUserPresence from "../../hooks/useUserPresence";

// ── Icon registry ────────────────────────────────────────────────
const ICONS = {
  home:                 Home,
  book:                 BookOpen,
  "book-open":          BookOpen,
  bell:                 Bell,
  calendar:             Calendar,
  school:               Building2,
  building:             Building2,
  layers:               Layers,
  "chalkboard-teacher": GraduationCap,
  clipboard:            ClipboardList,
  "message-circle":     MessageCircle,
  users:                Users,
  "file-text":          FileText,
};

// ── Navigation config per role ───────────────────────────────────
const NAV_GROUPS = {
  superadmin: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/admin", icon: "home", exact: true }],
    },
    {
      group: "Gestion global",
      items: [
        { label: "Instituciones", path: "/instituciones", icon: "building" },
        { label: "Usuarios",      path: "/usuarios",      icon: "users" },
      ],
    },
    {
      group: "Sistema",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],

  administrador: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/admin", icon: "home", exact: true }],
    },
    {
      group: "Mi institucion",
      items: [
        { label: "Institucion", path: "/institucion", icon: "school" },
        { label: "Docentes",    path: "/docentes",    icon: "chalkboard-teacher" },
        { label: "Cursos",      path: "/cursos",      icon: "layers" },
      ],
    },
    {
      group: "Comunicacion",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],

  docente: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/docente", icon: "home", exact: true }],
    },
    {
      group: "Ensenanza",
      items: [
        { label: "Cursos",  path: "/cursos",  icon: "layers" },
        { label: "Tareas",  path: "/tareas",  icon: "clipboard" },
        { label: "Foros",   path: "/foros",   icon: "message-circle" },
        { label: "Eventos", path: "/eventos", icon: "calendar" },
      ],
    },
    {
      group: "Comunicacion",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],

  padre: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/padre", icon: "home", exact: true }],
    },
    {
      group: "Mis hijos",
      items: [
        { label: "Perfiles",   path: "/familia/perfiles",   icon: "users" },
        { label: "Cursos",     path: "/familia/cursos",     icon: "layers" },
        { label: "Tareas",     path: "/familia/tareas",     icon: "clipboard" },
        { label: "Entregas",   path: "/familia/entregas",   icon: "file-text" },
        { label: "Foros",      path: "/familia/foros",      icon: "message-circle" },
        { label: "Calendario", path: "/familia/calendario", icon: "calendar" },
      ],
    },
    {
      group: "Comunicacion",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],
};
NAV_GROUPS["padre/tutor"] = NAV_GROUPS.padre;

const ROLE_LABELS = {
  superadmin:    "Super Admin",
  administrador: "Administrador",
  docente:       "Docente",
  padre:         "Padre / Tutor",
  "padre/tutor": "Padre / Tutor",
};

// ── NavItem ──────────────────────────────────────────────────────
function NavItem({ item, onClose }) {
  const { pathname } = useLocation();
  const Icon = ICONS[item.icon] ?? Home;
  const isActive = item.exact
    ? pathname === item.path
    : pathname.startsWith(item.path);

  return (
    <Link
      to={item.path}
      onClick={onClose}
      data-tooltip={item.label}
      className={`sidebar-item${isActive ? " sidebar-item--active" : ""}`}
    >
      <span className="sidebar-item-icon"><Icon size={17} /></span>
      <span className="sidebar-item-label">{item.label}</span>
    </Link>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ user, logout, collapsed, onToggleCollapse, drawerOpen, onCloseDrawer }) {
  const navigate  = useNavigate();
  const groups    = NAV_GROUPS[user?.rol] ?? [];
  const roleLabel = ROLE_LABELS[user?.rol] ?? user?.rol ?? "Usuario";

  const cls = [
    "sidebar",
    collapsed  ? "sidebar--collapsed" : "",
    drawerOpen ? "sidebar--open"      : "",
  ].filter(Boolean).join(" ");

  return (
    <aside className={cls}>
      {/* Header: logo + collapse button */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon" aria-hidden="true">E</div>
        <span className="sidebar-logo-text">Edu<span>mon</span></span>
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expandir menu" : "Contraer menu"}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="sidebar-nav" aria-label="Navegacion principal">
        {groups.map((g) => (
          <div key={g.group} className="sidebar-group">
            <p className="sidebar-group-label">{g.group}</p>
            {g.items.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                onClose={onCloseDrawer}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div className="sidebar-footer">
        <button
          className="sidebar-user"
          onClick={() => { navigate("/perfil"); onCloseDrawer(); }}
          title="Ver mi perfil"
        >
          <UserAvatar user={user} size={32} />
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.nombre ?? "Usuario"}</p>
            <p className="sidebar-user-role">{roleLabel}</p>
          </div>
        </button>

        <button
          className="sidebar-item"
          onClick={logout}
          style={{ color: "var(--color-error)", marginTop: 4 }}
          title="Cerrar sesion"
        >
          <span className="sidebar-item-icon"><LogOut size={17} /></span>
          <span className="sidebar-item-label">Cerrar sesion</span>
        </button>
      </div>
    </aside>
  );
}

// ── Navbar ───────────────────────────────────────────────────────
function Navbar({ user, logout, drawerOpen, onToggleDrawer }) {
  const navigate  = useNavigate();
  const { query, results, isOpen, setIsOpen, handleSearch, clearSearch } = useSearch();

  const [scrolled,    setScrolled]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const hasResults = results.cursos?.length > 0 || results.tareas?.length > 0;

  return (
    <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      {/* Mobile hamburger */}
      <button
        className="navbar-toggle"
        onClick={onToggleDrawer}
        aria-label={drawerOpen ? "Cerrar menu" : "Abrir menu"}
      >
        {drawerOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Search */}
      <div className="navbar-search">
        <span className="navbar-search-icon"><Search size={14} /></span>
        <input
          className="navbar-search-input"
          placeholder="Buscar cursos, tareas..."
          value={query}
          onChange={(e) => { handleSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 180)}
          aria-label="Buscador global"
        />
        {!query && (
          <span className="navbar-search-kbd">
            <kbd className="navbar-kbd">Ctrl</kbd>
            <kbd className="navbar-kbd">K</kbd>
          </span>
        )}
        {isOpen && hasResults && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
            background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
            borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-dropdown)",
            padding: "var(--space-2)", zIndex: 300, maxHeight: 300, overflowY: "auto",
          }}>
            {results.cursos?.map((c) => (
              <button
                key={c._id}
                className="sidebar-item"
                style={{ borderRadius: "var(--radius-md)", width: "100%", gap: "var(--space-2)" }}
                onMouseDown={() => { navigate(`/cursos/${c._id}`); clearSearch(); }}
              >
                <BookOpen size={14} />
                <span style={{ fontSize: 13 }}>{c.nombre}</span>
              </button>
            ))}
            {results.tareas?.map((t) => (
              <button
                key={t._id}
                className="sidebar-item"
                style={{ borderRadius: "var(--radius-md)", width: "100%", gap: "var(--space-2)" }}
                onMouseDown={() => { navigate("/tareas"); clearSearch(); }}
              >
                <ClipboardList size={14} />
                <span style={{ fontSize: 13 }}>{t.titulo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-spacer" />

      <div className="navbar-actions">
        <button
          className="navbar-action-btn"
          onClick={() => navigate("/notificaciones")}
          title="Notificaciones"
        >
          <Bell size={18} />
        </button>

        <div className="navbar-divider" />

        {/* Profile dropdown */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <button
            className="navbar-avatar-trigger"
            onClick={() => setProfileOpen((p) => !p)}
            aria-expanded={profileOpen}
          >
            <UserAvatar user={user} size={32} />
            <div className="navbar-avatar-info">
              <p className="navbar-avatar-name">{user?.nombre ?? "Usuario"}</p>
              <p className="navbar-avatar-role">{ROLE_LABELS[user?.rol] ?? user?.rol}</p>
            </div>
            <ChevronDown size={14} className="navbar-avatar-chevron" />
          </button>

          {profileOpen && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{user?.nombre}</p>
                <p className="navbar-dropdown-email">{user?.correo ?? user?.telefono ?? ""}</p>
              </div>
              <button
                className="navbar-dropdown-item"
                onClick={() => { navigate("/perfil"); setProfileOpen(false); }}
              >
                <span className="navbar-dropdown-icon"><User size={15} /></span>
                Mi perfil
              </button>
              <div className="navbar-dropdown-separator" />
              <button
                className="navbar-dropdown-item navbar-dropdown-item--danger"
                onClick={logout}
              >
                <span className="navbar-dropdown-icon"><LogOut size={15} /></span>
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Main Layout ──────────────────────────────────────────────────
export const MainLayout = () => {
  const { user, logout } = useAuth();
  const [collapsed,  setCollapsed]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useUserPresence(user?._id);

  const layoutCls = ["app-layout", collapsed ? "app-layout--collapsed" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutCls}>
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        user={user}
        logout={logout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      <div className="app-content">
        <Navbar
          user={user}
          logout={logout}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((d) => !d)}
        />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
