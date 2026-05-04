// src/components/layout/MainLayout.jsx
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, Bell, Calendar,
  Building2, Layers, GraduationCap, ClipboardList,
  MessageCircle, Users, FileText, LogOut, Menu, X,
  Search, PanelLeftClose, PanelLeftOpen, Settings,
} from "lucide-react";

import { Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { useSearch } from "../../context/SearchContext";
import { UserAvatar } from "@/components";
import useUserPresence from "../../hooks/useUserPresence";

// ── Icon registry ────────────────────────────────────────────
const ICON_MAP = {
  home: Home,
  book: BookOpen,
  "book-open": BookOpen,
  bell: Bell,
  calendar: Calendar,
  "calendar-event": Calendar,
  school: Building2,
  building: Building2,
  layers: Layers,
  "chalkboard-teacher": GraduationCap,
  clipboard: ClipboardList,
  "message-circle": MessageCircle,
  users: Users,
  "file-text": FileText,
  settings: Settings,
};

// ── Navigation by role (grouped) ─────────────────────────────
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
        { label: "Usuarios", path: "/usuarios", icon: "users" },
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
      group: "Mi institución",
      items: [
        { label: "Institución", path: "/institucion", icon: "school" },
        { label: "Docentes", path: "/docentes", icon: "chalkboard-teacher" },
        { label: "Cursos", path: "/cursos", icon: "layers" },
      ],
    },
    {
      group: "Comunicación",
      items: [{ label: "Notificaciones", path: "/notificaciones", icon: "bell" }],
    },
  ],
};

// ── Role metadata ─────────────────────────────────────────────
const ROLE_META = {
  superadmin:    { label: "Super Admin", color: "#F23D7F", bg: "rgba(242,61,127,0.14)" },
  administrador: { label: "Administrador", color: "#05C7F2", bg: "rgba(5,199,242,0.14)" },
  docente:       { label: "Docente", color: "#41D958", bg: "rgba(65,217,88,0.14)" },
};

// ── NavItem ───────────────────────────────────────────────────
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
      title={collapsed ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "10px 12px" : "9px 10px",
        borderRadius: 10,
        marginBottom: 2,
        textDecoration: "none",
        fontWeight: isActive ? 600 : 500,
        fontSize: 13.5,
        color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
        background: isActive ? "rgba(140, 56, 240, 0.22)" : "transparent",
        borderLeft: isActive ? "3px solid var(--color-sidebar-active)" : "3px solid transparent",
      }}
    >
      <Icon style={{ width: 17, height: 17 }} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

// ── Main Layout ───────────────────────────────────────────────
export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useUserPresence(user?._id);
  const { query, results, isOpen, setIsOpen, handleSearch, clearSearch } = useSearch();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const groups = NAV_GROUPS[user?.rol] ?? [];
  const roleMeta = ROLE_META[user?.rol] ?? { label: user?.rol };

  const sidebarW = collapsed ? 72 : 260;

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarW, position: "fixed", height: "100vh" }}>

        {/* Collapse button (replaced) */}
        <IconBtn
          color="rgba(255,255,255,0.35)"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir sidebar" : "Contraer sidebar"}
          className="hidden lg:flex"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </IconBtn>

        {/* Close mobile (replaced) */}
        <IconBtn
          color="#64748B"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden"
        >
          <X />
        </IconBtn>

        {/* Logout (replaced) */}
        <IconBtn
          color="rgba(255,255,255,0.4)"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut />
        </IconBtn>

        {/* User profile (button → Button) */}
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 justify-start"
          onClick={() => navigate("/perfil")}
        >
          <UserAvatar user={user} size={36} />
          {!collapsed && (
            <div>
              <p style={{ margin: 0 }}>{user?.nombre}</p>
              <p style={{ margin: 0, fontSize: 11 }}>{user?.correo}</p>
            </div>
          )}
        </Button>

      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: sidebarW }}>

        {/* Topbar notification (replaced) */}
        <IconBtn
          color="var(--color-text-muted)"
          onClick={() => navigate("/notificaciones")}
        >
          <Bell />
        </IconBtn>

        {/* Search results buttons → Button */}
        {isOpen && results.cursos?.map(c => (
          <Button
            key={c._id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              navigate(`/cursos/${c._id}`);
              clearSearch();
            }}
          >
            <div>
              <p style={{ margin: 0 }}>{c.nombre}</p>
              <p style={{ margin: 0, fontSize: 12 }}>Curso</p>
            </div>
          </Button>
        ))}

        {isOpen && results.tareas?.map(t => (
          <Button
            key={t._id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              navigate(`/tareas/${t._id}`);
              clearSearch();
            }}
          >
            <div>
              <p style={{ margin: 0 }}>{t.titulo}</p>
              <p style={{ margin: 0, fontSize: 12 }}>Tarea</p>
            </div>
          </Button>
        ))}

        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;