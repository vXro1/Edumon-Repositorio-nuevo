// src/components/layout/Navbar.jsx
import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, BookOpen, ChevronDown, ClipboardList, LogOut, Menu, Search, User, X,
} from "lucide-react";
import { UserAvatar } from "@/components";
import { useSearch } from "@/context/SearchContext";
import { ROLE_LABELS } from "@/config/navigation/navGroups";
import { notificacionesGetConteoNoLeidas } from "@/features/notificaciones/services/notificacionesService";
import { getSocket } from "@/lib/socket";

export const Navbar = memo(function Navbar({ user, logout, drawerOpen, onToggleDrawer }) {
  const navigate  = useNavigate();
  const { query, results, isOpen, setIsOpen, handleSearch, clearSearch } = useSearch();

  const [scrolled,    setScrolled]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [noLeidas,    setNoLeidas]    = useState(0);
  const profileRef = useRef(null);

  /* Conteo inicial al montar + actualización en vivo por Socket.IO — el
     backend manda "notificaciones:conteo" apenas se conecta el socket
     (ver socketHandlers.js) y de nuevo cada vez que se crea/lee una
     notificación, así que este badge no necesita su propio polling. */
  useEffect(() => {
    notificacionesGetConteoNoLeidas()
      .then((res) => setNoLeidas(res.noLeidas ?? 0))
      .catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    const onConteo = ({ noLeidas: n }) => setNoLeidas(n ?? 0);
    socket.on("notificaciones:conteo", onConteo);
    return () => socket.off("notificaciones:conteo", onConteo);
  }, []);

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
    <header className={`navbar${scrolled ? " scrolled" : ""}`}>

      <button
        className="nav-hamburger"
        onClick={onToggleDrawer}
        aria-label={drawerOpen ? "Cerrar menu" : "Abrir menu"}
      >
        {drawerOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="nav-search">
        <span className="search-icon"><Search size={14} /></span>
        <input
          placeholder="Buscar cursos, retos..."
          value={query}
          onChange={(e) => { handleSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 180)}
          aria-label="Buscador global"
        />
        {isOpen && hasResults && (
          <div className="nav-search-results">
            {results.cursos?.map((c) => (
              <button
                key={c._id}
                className="sidebar-item"
                style={{ borderRadius: "var(--radius-md)", width: "100%" }}
                onMouseDown={() => { navigate(`/cursos/${c._id}`); clearSearch(); }}
              >
                <span className="ico"><BookOpen size={14} /></span>
                <span className="lbl">{c.nombre}</span>
              </button>
            ))}
            {results.tareas?.map((t) => (
              <button
                key={t._id}
                className="sidebar-item"
                style={{ borderRadius: "var(--radius-md)", width: "100%" }}
                onMouseDown={() => { navigate("/tareas"); clearSearch(); }}
              >
                <span className="ico"><ClipboardList size={14} /></span>
                <span className="lbl">{t.titulo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="nav-actions">
        <button
          className="nav-icon-btn"
          onClick={() => navigate("/notificaciones")}
          title="Notificaciones"
          aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
          style={{ position: "relative" }}
        >
          <Bell size={18} />
          {noLeidas > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 15,
                height: 15,
                borderRadius: "50%",
                background: "var(--color-error)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 800,
                lineHeight: "15px",
                textAlign: "center",
                padding: "0 3px",
                border: "1.5px solid var(--color-surface)",
              }}
            >
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </button>

        <div className="nav-divider" />

        <div className="nav-profile" ref={profileRef}>
          <button
            className="nav-avatar-trigger"
            onClick={() => setProfileOpen((p) => !p)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="Menu de perfil"
          >
            <UserAvatar user={user} size={32} />
            <div className="nav-avatar-info">
              <p className="nav-avatar-name">{user?.nombre ?? "Usuario"}</p>
              <p className="nav-avatar-role">{ROLE_LABELS[user?.rol] ?? user?.rol}</p>
            </div>
            <ChevronDown
              size={14}
              className={`nav-avatar-chevron${profileOpen ? " open" : ""}`}
            />
          </button>

          {profileOpen && (
            <div className="nav-dropdown" role="menu">
              <div className="nav-dropdown-header">
                <UserAvatar user={user} size={36} />
                <div className="nav-dropdown-header-text">
                  <p className="nav-dropdown-name">{user?.nombre}</p>
                  <p className="nav-dropdown-email">{user?.correo ?? user?.telefono ?? ""}</p>
                </div>
              </div>
              <button
                role="menuitem"
                className="nav-dropdown-item"
                onClick={() => { navigate("/perfil"); setProfileOpen(false); }}
              >
                <span className="nav-dropdown-icon"><User size={15} /></span>
                Mi perfil
              </button>
              <div className="nav-dropdown-sep" />
              <button
                role="menuitem"
                className="nav-dropdown-item nav-dropdown-item--danger"
                onClick={logout}
              >
                <span className="nav-dropdown-icon"><LogOut size={15} /></span>
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
});

export default Navbar;
