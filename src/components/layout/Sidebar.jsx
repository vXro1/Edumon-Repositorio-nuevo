// src/components/layout/Sidebar.jsx
import { memo, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserAvatar } from "@/components";
import { ICONS, NAV_GROUPS, ROLE_LABELS } from "@/config/navigation/navGroups";

const NavItem = memo(function NavItem({ item, onClose }) {
  const { pathname } = useLocation();
  const Icon = ICONS[item.icon] ?? ICONS.home;
  const isActive = item.exact
    ? pathname === item.path
    : pathname.startsWith(item.path);

  return (
    <Link
      to={item.path}
      onClick={onClose}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      data-tooltip={item.label}
      className={`sidebar-item${isActive ? " active" : ""}`}
    >
      <span className="ico" aria-hidden="true"><Icon size={17} /></span>
      <span className="lbl">{item.label}</span>
    </Link>
  );
});

export const Sidebar = memo(function Sidebar({ user, logout, collapsed, onToggleCollapse, drawerOpen, onCloseDrawer }) {
  const navigate  = useNavigate();
  const groups    = useMemo(() => NAV_GROUPS[user?.rol] ?? [], [user?.rol]);
  const roleLabel = useMemo(() => ROLE_LABELS[user?.rol] ?? user?.rol ?? "Usuario", [user?.rol]);

  return (
    <aside className={`sidebar${drawerOpen ? " drawer-open" : ""}`}>

      <div className="sidebar-brand">
        <div className="sidebar-logo-icon" aria-hidden="true">E</div>
        <span>Edu</span>
        <span className="mon">mon</span>
        <button
          id="sidebar-collapse-btn"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expandir menu" : "Contraer menu"}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      <nav aria-label="Navegacion principal">
        {groups.map((g) => (
          <div key={g.group} className="sidebar-group">
            <p className="sidebar-section">{g.group}</p>
            {g.items.map((item) => (
              <NavItem key={item.path} item={item} onClose={onCloseDrawer} />
            ))}
          </div>
        ))}
      </nav>

      <button
        className="sidebar-card"
        onClick={() => { navigate("/perfil"); onCloseDrawer(); }}
        title="Ver mi perfil"
      >
        <UserAvatar user={user} size={32} />
        <div className="who">
          <p className="name">{user?.nombre ?? "Usuario"}</p>
          <p className="role">{roleLabel}</p>
        </div>
      </button>

      <button
        className="sidebar-item sidebar-item--danger"
        onClick={logout}
        title="Cerrar sesion"
      >
        <span className="ico"><LogOut size={17} /></span>
        <span className="lbl">Cerrar sesion</span>
      </button>

    </aside>
  );
});

export default Sidebar;
