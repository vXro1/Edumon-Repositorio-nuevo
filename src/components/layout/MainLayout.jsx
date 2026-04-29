// src/components/layout/MainLayout.jsx
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, Bell, Calendar,
  Building2, Layers, GraduationCap, ClipboardList,
  MessageCircle, Users, FileText, LogOut, Menu, X,
  Search, PanelLeftClose, PanelLeftOpen, Settings,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useSearch } from "../../context/SearchContext";

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
  docente: [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/docente", icon: "home", exact: true }],
    },
    {
      group: "Enseñanza",
      items: [
        { label: "Mis cursos", path: "/cursos", icon: "book-open" },
        { label: "Tareas", path: "/tareas", icon: "clipboard" },
        { label: "Foros", path: "/foros", icon: "message-circle" },
      ],
    },
    {
      group: "Agenda",
      items: [{ label: "Eventos", path: "/eventos", icon: "calendar-event" }],
    },
    {
      group: "Cuenta",
      items: [
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil", path: "/perfil", icon: "settings" },
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
        { label: "Mis hijos", path: "/familia/perfiles", icon: "users" },
        { label: "Mis cursos", path: "/familia/cursos", icon: "book-open" },
        { label: "Tareas", path: "/familia/tareas", icon: "clipboard" },
        { label: "Entregas", path: "/familia/entregas", icon: "file-text" },
        { label: "Foros", path: "/familia/foros", icon: "message-circle" },
        { label: "Calendario", path: "/familia/calendario", icon: "calendar" },
      ],
    },
    {
      group: "Cuenta",
      items: [
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil", path: "/perfil", icon: "settings" },
      ],
    },
  ],
  "padre/tutor": [
    {
      group: "Principal",
      items: [{ label: "Inicio", path: "/padre", icon: "home", exact: true }],
    },
    {
      group: "Mi familia",
      items: [
        { label: "Mis hijos", path: "/familia/perfiles", icon: "users" },
        { label: "Mis cursos", path: "/familia/cursos", icon: "book-open" },
        { label: "Tareas", path: "/familia/tareas", icon: "clipboard" },
        { label: "Entregas", path: "/familia/entregas", icon: "file-text" },
        { label: "Foros", path: "/familia/foros", icon: "message-circle" },
        { label: "Calendario", path: "/familia/calendario", icon: "calendar" },
      ],
    },
    {
      group: "Cuenta",
      items: [
        { label: "Notificaciones", path: "/notificaciones", icon: "bell" },
        { label: "Mi perfil", path: "/perfil", icon: "settings" },
      ],
    },
  ],
};

// ── Role metadata ─────────────────────────────────────────────
const ROLE_META = {
  superadmin: { label: "Super Admin", color: "#F87171", bg: "rgba(248,113,113,0.14)" },
  administrador: { label: "Administrador", color: "#60A5FA", bg: "rgba(96,165,250,0.14)" },
  docente: { label: "Docente", color: "#34D399", bg: "rgba(52,211,153,0.14)" },
  padre: { label: "Padre / Tutor", color: "#FBBF24", bg: "rgba(251,191,36,0.14)" },
  "padre/tutor": { label: "Padre / Tutor", color: "#FBBF24", bg: "rgba(251,191,36,0.14)" },
};

// ── Course color palette ──────────────────────────────────────
const SIDEBAR_BG = "#1E293B";
const SIDEBAR_BDR = "rgba(255,255,255,0.06)";
const ACTIVE_BG = "rgba(12,106,196,0.22)";
const ACTIVE_COLOR = "#F1F5F9";
const INACTIVE_COLOR = "#94A3B8";
const HOVER_BG = "rgba(255,255,255,0.07)";
const HOVER_COLOR = "#CBD5E1";
const ACTIVE_BAR = "#0C6AC4";

// ── NavItem ───────────────────────────────────────────────────
function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  const Icon = ICON_MAP[item.icon] ?? Home;
  const isActive = item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  const [hovered, setHovered] = useState(false);

  const bg = isActive ? ACTIVE_BG : hovered ? HOVER_BG : "transparent";
  const color = isActive ? ACTIVE_COLOR : hovered ? HOVER_COLOR : INACTIVE_COLOR;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        color,
        background: bg,
        borderLeft: isActive ? `3px solid ${ACTIVE_BAR}` : "3px solid transparent",
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
      {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
    </Link>
  );
}

// ── Main Layout ───────────────────────────────────────────────
export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { query, results, isOpen, setIsOpen, handleSearch, clearSearch } = useSearch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const groups = NAV_GROUPS[user?.rol] ?? [];
  const roleMeta = ROLE_META[user?.rol] ?? { label: user?.rol, color: "#94A3B8", bg: "rgba(148,163,184,0.14)" };
  const initial = user?.nombre?.[0]?.toUpperCase() ?? "U";
  const sidebarW = collapsed ? 72 : 260;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg, #F1F5F9)" }}>

      {/* ── Mobile overlay ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ════════════════════════════════════════════════
          SIDEBAR — Canvas LMS dark navy
          ════════════════════════════════════════════════ */}
      <aside
        style={{
          width: sidebarW,
          flexShrink: 0,
          background: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BDR}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 250ms cubic-bezier(0.4,0,0.2,1), transform 300ms ease",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 40,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        className="lg:!translate-x-0"
      >
        {/* Brand ───────────────────────────────────────── */}
        <div style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0 16px" : "0 18px",
          borderBottom: `1px solid ${SIDEBAR_BDR}`,
          flexShrink: 0,
        }}>
          {collapsed ? (
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen style={{ width: 17, height: 17, color: "white" }} />
            </div>
          ) : (
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BookOpen style={{ width: 17, height: 17, color: "white" }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 17, color: "#F1F5F9", letterSpacing: "-0.02em" }}>
                Edu<span style={{ color: "#60A5FA" }}>mon</span>
              </span>
            </Link>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              color: "#475569", background: "none", border: "none",
              cursor: "pointer", padding: 6, borderRadius: 8,
              display: "flex", alignItems: "center",
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}
            title={collapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            {collapsed
              ? <PanelLeftOpen style={{ width: 16, height: 16 }} />
              : <PanelLeftClose style={{ width: 16, height: 16 }} />
            }
          </button>

          {/* Close — mobile only */}
          <button
            className="lg:hidden"
            onClick={() => setDrawerOpen(false)}
            style={{
              color: "#64748B", background: "none", border: "none",
              cursor: "pointer", padding: 6, borderRadius: 8,
              display: "flex", alignItems: "center",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Role badge ──────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: "10px 16px 6px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "3px 10px", borderRadius: 99,
              fontSize: 10.5, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              background: roleMeta.bg, color: roleMeta.color,
            }}>
              {roleMeta.label}
            </span>
          </div>
        )}

        {/* Navigation ──────────────────────────────────── */}
        <nav style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: collapsed ? "8px 8px" : "8px 12px",
          scrollbarWidth: "none",
        }}>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 6 }}>
              {!collapsed && (
                <p style={{
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "#334155", padding: "8px 8px 4px",
                  whiteSpace: "nowrap",
                }}>
                  {group.group}
                </p>
              )}
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User card ───────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${SIDEBAR_BDR}`,
          padding: collapsed ? "12px 8px" : "12px",
          flexShrink: 0,
        }}>
          {collapsed ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                title={`${user?.nombre} ${user?.apellido}`}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "white", cursor: "default",
                }}
              >
                {initial}
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "white",
              }}>
                {initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: "#F1F5F9",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user?.nombre} {user?.apellido}
                </p>
                <p style={{
                  fontSize: 11, color: "#64748B",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user?.correo}
                </p>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                style={{
                  color: "#475569", background: "none", border: "none",
                  cursor: "pointer", padding: 6, borderRadius: 8,
                  display: "flex", alignItems: "center", flexShrink: 0,
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}
              >
                <LogOut style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar spacer for desktop flex layout */}
      <div
        className="hidden lg:block"
        style={{
          width: sidebarW, flexShrink: 0,
          transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* ════════════════════════════════════════════════
          MAIN — topbar + content
          ════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden",
      }}>

        {/* Topbar ──────────────────────────────────────── */}
        <header style={{
          height: 64, flexShrink: 0,
          display: "flex", alignItems: "center", gap: 12, padding: "0 20px",
          background: "var(--color-surface, #fff)",
          borderBottom: "1px solid var(--color-border, rgba(0,0,0,0.08))",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
            style={{
              color: "var(--color-text-muted)", background: "none", border: "none",
              cursor: "pointer", padding: 7, borderRadius: 9,
              display: "flex", alignItems: "center",
            }}
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>

          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 340, flex: 1 }}>
            <Search style={{
              position: "absolute", left: 11, top: "50%",
              transform: "translateY(-50%)",
              width: 15, height: 15, color: "var(--color-text-muted)",
              pointerEvents: "none",
            }} />
            <input
              type="search"
              placeholder="Buscar cursos, tareas..."
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                handleSearch(val);
                if (val.length > 0) setIsOpen(true);
              }}
              onFocus={(e) => {
                if (query.length > 0) setIsOpen(true);
                e.currentTarget.style.borderColor = "#0C6AC4";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(12,106,196,0.12)";
              }}

              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border, rgba(0,0,0,0.08))";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            {/* Search Results Modal */}
            {isOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                background: "var(--color-surface)", borderRadius: 12,
                border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)",
                maxHeight: 400, overflowY: "auto", zIndex: 1000,
              }}>
                {query.length < 2 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                    Escribe al menos 2 caracteres para buscar
                  </div>
                ) : Object.values(results).every(arr => arr.length === 0) ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                    No se encontraron resultados
                  </div>
                ) : (
                  <div>
                    {/* Cursos */}
                    {results.cursos?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border)" }}>
                          Cursos ({results.cursos.length})
                        </div>
                        {results.cursos.map(c => (
                          <button
                            key={c._id}
                            onClick={() => { navigate(`/cursos/${c._id}`); clearSearch(); }}
                            style={{ width: "100%", padding: "10px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderBottom: "1px solid var(--color-border)", transition: "background 150ms" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{c.nombre}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Curso</p>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Tareas */}
                    {results.tareas?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border)" }}>
                          Tareas ({results.tareas.length})
                        </div>
                        {results.tareas.map(t => (
                          <button
                            key={t._id}
                            onClick={() => { navigate(`/tareas/${t._id}`); clearSearch(); }}
                            style={{ width: "100%", padding: "10px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderBottom: "1px solid var(--color-border)", transition: "background 150ms" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{t.titulo}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Tarea</p>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Eventos */}
                    {results.eventos?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border)" }}>
                          Eventos ({results.eventos.length})
                        </div>
                        {results.eventos.map(ev => (
                          <button
                            key={ev._id}
                            onClick={() => { navigate("/eventos"); clearSearch(); }}
                            style={{ width: "100%", padding: "10px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderBottom: "1px solid var(--color-border)", transition: "background 150ms" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{ev.titulo}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Evento</p>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Foros */}
                    {results.foros?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border)" }}>
                          Foros ({results.foros.length})
                        </div>
                        {results.foros.map(f => (
                          <button
                            key={f._id}
                            onClick={() => { navigate(`/foros/${f._id}`); clearSearch(); }}
                            style={{ width: "100%", padding: "10px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderBottom: "1px solid var(--color-border)", transition: "background 150ms" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{f.titulo}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Foro</p>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Notifications */}
          <button
            style={{
              position: "relative", background: "none", border: "none",
              cursor: "pointer", padding: 8, borderRadius: 10,
              color: "var(--color-text-muted)", display: "flex", alignItems: "center",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg, #F1F5F9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            title="Notificaciones"
          >
            <Bell style={{ width: 18, height: 18 }} />
            <span style={{
              position: "absolute", top: 7, right: 7,
              width: 7, height: 7, borderRadius: "50%",
              background: "#EF4444",
              border: "2px solid var(--color-surface, #fff)",
            }} />
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "var(--color-border)" }} />

          {/* User pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "4px 10px 4px 4px", borderRadius: 99,
            cursor: "default",
            border: "1px solid var(--color-border, rgba(0,0,0,0.08))",
            background: "var(--color-surface)",
            transition: "background 150ms",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg, #F1F5F9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface)"; }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
            }}>
              {initial}
            </div>
            <div className="hidden sm:block" style={{ lineHeight: 1.2 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                {user?.nombre}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                {roleMeta.label}
              </p>
            </div>
          </div>
        </header>

        {/* Page content ────────────────────────────────── */}
        <main style={{
          flex: 1, overflowY: "auto",
          padding: "24px 28px",
          background: "var(--color-bg, #F1F5F9)",
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
