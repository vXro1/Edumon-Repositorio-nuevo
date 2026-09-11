// vista previa del dashboard sin sesión: mismas clases CSS que MainLayout/Sidebar/Navbar,
// datos estáticos, sin llamadas a la API ni navegación real a rutas protegidas
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, Search, Bell,
  ChevronDown, User, BookOpen, ClipboardList, Users, Calendar, Clock,
  CheckCircle2, Sparkles, Plus, ChevronRight, Compass,
} from "lucide-react";
import { UserAvatar, Button } from "@/components";
import { useToast } from "@/context/ToastContext";
import { NAV_GROUPS, ROLE_LABELS, ICONS } from "@/config/navigation/navGroups";
import CursoCard from "@/features/cursos/components/CursoCard";
import logoSvg from "@/assets/icons/logo.svg";

const BANNER_H = 46;

const ROLES = [
  { key: "docente",       label: "Docente" },
  { key: "padre",         label: "Padre / Tutor" },
  { key: "administrador", label: "Administrador" },
];

const DEMO_USERS = {
  docente:       { nombre: "Camila", apellido: "Restrepo", rol: "docente" },
  padre:         { nombre: "Jorge",  apellido: "Salazar",  rol: "padre" },
  administrador: { nombre: "Laura",  apellido: "Gómez",    rol: "administrador" },
};

const STATS_BY_ROLE = {
  docente: [
    { value: 3,   label: "Mis cursos",             icon: BookOpen,       colorClass: "stat-icon-purple" },
    { value: 68,  label: "Estudiantes en total",    icon: Users,          colorClass: "stat-icon-green" },
    { value: 4,   label: "Retos activos",           icon: ClipboardList, colorClass: "stat-icon-cyan" },
    { value: 2,   label: "Eventos hoy",             icon: Calendar,       colorClass: "stat-icon-yellow" },
  ],
  padre: [
    { value: 2,   label: "Hijos vinculados",        icon: Users,          colorClass: "stat-icon-purple" },
    { value: 5,   label: "Cursos en curso",          icon: BookOpen,       colorClass: "stat-icon-green" },
    { value: 3,   label: "Entregas pendientes",      icon: ClipboardList, colorClass: "stat-icon-cyan" },
    { value: 1,   label: "Eventos hoy",              icon: Calendar,       colorClass: "stat-icon-yellow" },
  ],
  administrador: [
    { value: 12,  label: "Docentes activos",         icon: Users,          colorClass: "stat-icon-purple" },
    { value: 24,  label: "Cursos abiertos",           icon: BookOpen,       colorClass: "stat-icon-green" },
    { value: 340, label: "Estudiantes matriculados",  icon: ClipboardList, colorClass: "stat-icon-cyan" },
    { value: 3,   label: "Eventos hoy",               icon: Calendar,       colorClass: "stat-icon-yellow" },
  ],
};

const DEMO_CURSOS = [
  { _id: "d1", nombre: "Matemáticas 5°",     descripcion: "Fracciones, geometría y pensamiento lógico", color: "#0C6AC4", participantes: Array(24).fill(0) },
  { _id: "d2", nombre: "Ciencias Naturales", descripcion: "El cuerpo humano y los ecosistemas",         color: "#41D958", participantes: Array(19).fill(0) },
  { _id: "d3", nombre: "Lengua Castellana",  descripcion: "Comprensión lectora y ortografía",           color: "#F23D7F", participantes: Array(22).fill(0) },
];

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const DEMO_TAREAS = [
  { _id: "t1", titulo: "Taller de fracciones",      fechaVencimiento: inDays(2) },
  { _id: "t2", titulo: "Maqueta del sistema solar", fechaVencimiento: inDays(4) },
  { _id: "t3", titulo: "Ensayo: cuidado del agua",  fechaVencimiento: inDays(6) },
];

const DEMO_EVENTOS = [
  { _id: "e1", titulo: "Reunión de padres de familia", hora: "3:00 p.m." },
  { _id: "e2", titulo: "Entrega de boletines",          hora: "Todo el día" },
];

/* ── Piezas visuales — mismas clases que el dashboard real ── */
function StatCard({ value, label, icon: Icon, colorClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${colorClass}`}><Icon size={20} aria-hidden="true" /></div>
      <div className="stat-card-body">
        <p className="stat-card-value">{value}</p>
        <p className="stat-card-label">{label}</p>
      </div>
    </div>
  );
}

function TaskItem({ tarea }) {
  return (
    <div className="list-card-item">
      <div className="list-card-item-icon" style={{ background: "var(--edu-cyan-50)", color: "var(--edu-cyan-600)" }}>
        <CheckCircle2 size={16} aria-hidden="true" />
      </div>
      <div className="list-card-item-body">
        <p className="list-card-item-title">{tarea.titulo}</p>
        <p className="list-card-item-meta">
          <Clock size={10} aria-hidden="true" />
          Vence: {new Date(tarea.fechaVencimiento).toLocaleDateString("es", { day: "numeric", month: "short" })}
        </p>
      </div>
      <span className="list-card-item-badge" style={{ background: "var(--edu-cyan-50)", color: "var(--edu-cyan-700)" }}>Activa</span>
    </div>
  );
}

function EventItem({ evento }) {
  return (
    <div className="list-card-item">
      <div className="list-card-item-icon" style={{ background: "var(--edu-green-50)", color: "var(--edu-green-600)" }}>
        <Calendar size={16} aria-hidden="true" />
      </div>
      <div className="list-card-item-body">
        <p className="list-card-item-title">{evento.titulo}</p>
        <p className="list-card-item-meta"><Clock size={10} aria-hidden="true" />{evento.hora}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {onAction && (
        <button className="section-action" onClick={onAction}>
          {actionLabel} <ChevronRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ── Aviso al entrar a una sección fuera del alcance de la demo ── */
function SectionPreview({ label, onExit }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "var(--space-9) var(--space-5)", gap: "var(--space-3)",
      background: "var(--color-surface)", borderRadius: "var(--radius-xl)", boxShadow: "var(--clay-card)",
      minHeight: 360,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-primary-light)", color: "var(--color-primary)",
      }}>
        <Compass size={26} aria-hidden="true" />
      </div>
      <h2 style={{ margin: 0, fontSize: "var(--text-lg)", color: "var(--color-text)" }}>{label}</h2>
      <p style={{ margin: 0, maxWidth: 380, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        Esta sección hace parte de tu cuenta real, con tus cursos, estudiantes y datos actualizados.
        Crea una cuenta para explorarla por completo.
      </p>
      <Button variant="primary" size="sm" onClick={onExit} style={{ marginTop: "var(--space-2)" }}>
        Volver al inicio de la demo
      </Button>
    </div>
  );
}

function demoBannerBtnStyle(filled) {
  return {
    border:       filled ? "none" : "1.5px solid rgba(255,255,255,0.55)",
    background:   filled ? "#fff" : "transparent",
    color:        filled ? "var(--color-primary)" : "#fff",
    fontSize:     12.5,
    fontWeight:   700,
    borderRadius: 9999,
    padding:      "5px 14px",
    cursor:       "pointer",
  };
}

export default function DemoPage() {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [role, setRole]               = useState("docente");
  const [section, setSection]         = useState("home"); // "home" | etiqueta de la sección
  const [collapsed, setCollapsed]     = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // tokens de marca escopeados a .app-shell — reflejarla en <body> para que banner/toasts
  // (fuera del árbol o en portal) también hereden el azul, no el morado de login
  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const user      = DEMO_USERS[role];
  const groups    = NAV_GROUPS[role] ?? [];
  const roleLabel = ROLE_LABELS[role] ?? role;
  const stats     = STATS_BY_ROLE[role];

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const totalEstudiantes = DEMO_CURSOS.reduce((a, c) => a + c.participantes.length, 0);

  const goHome = () => { setSection("home"); setDrawerOpen(false); };

  const openPreview = (label) => {
    setSection(label);
    setDrawerOpen(false);
    notify(`"${label}" está disponible en tu cuenta real`, "info");
  };

  const handleRoleChange = (r) => {
    setRole(r);
    setSection("home");
    notify(`Ahora ves la demo como ${ROLE_LABELS[r]}`, "info");
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg-muted, #FAFAFA)" }}>

      {/* Franja de modo demo — sticky, por encima del sidebar fijo */}
      <div style={{
        position: "sticky", top: 0, zIndex: 210, height: BANNER_H,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)",
        padding: "0 var(--space-4)", background: "var(--gradient-brand-full, var(--color-primary))",
        color: "#fff", fontSize: 13, fontWeight: 600, flexWrap: "wrap",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} aria-hidden="true" />
          Estás viendo una demo con datos de ejemplo
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/login")} style={demoBannerBtnStyle(false)}>Iniciar sesión</button>
          <button onClick={() => navigate("/#contacto")} style={demoBannerBtnStyle(true)}>Crear cuenta</button>
        </span>
      </div>

      <div className={`app-shell${collapsed ? " collapsed" : ""}`} style={{ minHeight: `calc(100dvh - ${BANNER_H}px)` }}>

        {drawerOpen && (
          <div className="sidebar-backdrop open" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        )}

        {/* ── Sidebar (misma estructura que Sidebar.jsx, sin <Link> reales) ── */}
        <aside
          className={`sidebar${drawerOpen ? " drawer-open" : ""}`}
          style={{ top: BANNER_H, height: `calc(100dvh - ${BANNER_H}px)` }}
        >
          <div className="sidebar-brand">
            <img src={logoSvg} alt="Edumon" className="sidebar-logo" />
            <button
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? "Expandir menu" : "Contraer menu"}
              aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
            >
              {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>

          <nav aria-label="Navegación principal (demo)">
            {groups.map(g => (
              <div key={g.group} className="sidebar-group">
                <p className="sidebar-section">{g.group}</p>
                {g.items.map(item => {
                  const Icon = ICONS[item.icon] ?? ICONS.home;
                  const isActive = item.exact ? section === "home" : section === item.label;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      className={`sidebar-item${isActive ? " active" : ""}`}
                      onClick={() => (item.exact ? goHome() : openPreview(item.label))}
                      title={item.label}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
                    >
                      <span className="ico" aria-hidden="true"><Icon size={17} /></span>
                      <span className="lbl">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <button className="sidebar-card" onClick={() => openPreview("Mi perfil")} title="Ver mi perfil">
            <UserAvatar user={user} size={32} />
            <div className="who">
              <p className="name">{user.nombre} {user.apellido}</p>
              <p className="role">{roleLabel}</p>
            </div>
          </button>

          <button className="sidebar-item sidebar-item--danger" onClick={() => navigate("/")} title="Salir de la demo">
            <span className="ico"><LogOut size={17} /></span>
            <span className="lbl">Salir de la demo</span>
          </button>
        </aside>

        {/* ── Columna principal ── */}
        <div className="main">
          <header className="navbar">
            <button
              className="nav-hamburger"
              onClick={() => setDrawerOpen(d => !d)}
              aria-label={drawerOpen ? "Cerrar menu" : "Abrir menu"}
            >
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="nav-search">
              <span className="search-icon"><Search size={14} /></span>
              <input
                placeholder="Buscar cursos, retos..."
                readOnly
                onFocus={(e) => { e.target.blur(); notify("La búsqueda está disponible en tu cuenta", "info"); }}
                aria-label="Buscador global (demo)"
              />
            </div>

            <div className="nav-actions">
              <button className="nav-icon-btn" onClick={() => openPreview("Notificaciones")} title="Notificaciones" aria-label="Notificaciones">
                <Bell size={18} />
              </button>

              <div className="nav-divider" />

              <div className="nav-profile" ref={profileRef}>
                <button
                  className="nav-avatar-trigger"
                  onClick={() => setProfileOpen(p => !p)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label="Menu de perfil"
                >
                  <UserAvatar user={user} size={32} />
                  <div className="nav-avatar-info">
                    <p className="nav-avatar-name">{user.nombre} {user.apellido}</p>
                    <p className="nav-avatar-role">{roleLabel}</p>
                  </div>
                  <ChevronDown size={14} className={`nav-avatar-chevron${profileOpen ? " open" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="nav-dropdown" role="menu">
                    <div className="nav-dropdown-header">
                      <UserAvatar user={user} size={36} />
                      <div className="nav-dropdown-header-text">
                        <p className="nav-dropdown-name">{user.nombre} {user.apellido}</p>
                        <p className="nav-dropdown-email">Cuenta de demostración</p>
                      </div>
                    </div>
                    <button role="menuitem" className="nav-dropdown-item" onClick={() => { setProfileOpen(false); openPreview("Mi perfil"); }}>
                      <span className="nav-dropdown-icon"><User size={15} /></span>
                      Mi perfil
                    </button>
                    <div className="nav-dropdown-sep" />
                    <button role="menuitem" className="nav-dropdown-item nav-dropdown-item--danger" onClick={() => navigate("/")}>
                      <span className="nav-dropdown-icon"><LogOut size={15} /></span>
                      Salir de la demo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="page">
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

              {/* Selector de rol — muestra el mismo dashboard con datos de ejemplo por rol */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
                <span style={{ fontSize: 12.5, color: "var(--color-text-muted)", fontWeight: 600 }}>Ver la demo como:</span>
                {ROLES.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleChange(r.key)}
                    style={{
                      padding: "5px 12px", borderRadius: 9999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      border: `1.5px solid ${role === r.key ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: role === r.key ? "var(--color-primary-light)" : "var(--color-surface)",
                      color: role === r.key ? "var(--color-primary)" : "var(--color-text-muted)",
                      boxShadow: "var(--clay-pill)",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {section !== "home" ? (
                <SectionPreview label={section} onExit={goHome} />
              ) : (
                <>
                  {/* Banner de bienvenida */}
                  <div className="welcome-banner edu-fade-in" role="banner">
                    <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                      <span className="welcome-badge">
                        <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />
                        {roleLabel}
                      </span>
                      <h1 className="welcome-title">{saludo}, {user.nombre}</h1>
                      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
                        <span className="welcome-chip">{DEMO_CURSOS.length} cursos activos</span>
                        <span className="welcome-chip">{DEMO_TAREAS.length} retos activos</span>
                        <span className="welcome-chip">{DEMO_EVENTOS.length} eventos hoy</span>
                        <span className="welcome-chip">{totalEstudiantes} estudiantes</span>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <section aria-label="Estadísticas de actividad" style={{ marginBottom: "var(--space-6)" }}>
                    <SectionHeader title="Actividad" />
                    <div className="grid-stats">
                      {stats.map(s => <StatCard key={s.label} {...s} />)}
                    </div>
                  </section>

                  {/* Acciones rápidas */}
                  <section aria-label="Acciones rápidas" style={{ marginBottom: "var(--space-6)" }}>
                    <SectionHeader title="Acciones rápidas" />
                    <div className="quick-actions">
                      <Button variant="primary" onClick={() => openPreview("Cursos")}>
                        <Plus size={15} aria-hidden="true" /> Crear curso
                      </Button>
                      <Button variant="outline-neutral" onClick={() => openPreview("Retos")}>
                        <ClipboardList size={15} aria-hidden="true" /> Nuevo reto
                      </Button>
                      <Button variant="ghost" onClick={() => openPreview("Calendario")}>
                        <Calendar size={15} aria-hidden="true" /> Ver calendario
                      </Button>
                    </div>
                  </section>

                  {/* Cursos + retos */}
                  <div className="layout-split" style={{ marginBottom: "var(--space-6)" }}>
                    <section aria-label="Cursos">
                      <SectionHeader title="Cursos" actionLabel="Ver todos" onAction={() => openPreview("Cursos")} />
                      <div className="grid-auto-sm">
                        {DEMO_CURSOS.map((c, i) => (
                          <CursoCard key={c._id} curso={c} role={role} idx={i} compact onClick={() => openPreview(c.nombre)} />
                        ))}
                      </div>
                    </section>

                    <section aria-label="Retos activos">
                      <SectionHeader title="Retos activos" actionLabel="Ver todos" onAction={() => openPreview("Retos")} />
                      <div className="list-card">
                        {DEMO_TAREAS.map(t => <TaskItem key={t._id} tarea={t} />)}
                      </div>
                    </section>
                  </div>

                  {/* Eventos de hoy */}
                  <section aria-label="Eventos de hoy" style={{ marginBottom: "var(--space-6)" }}>
                    <SectionHeader title="Eventos de hoy" actionLabel="Ver calendario" onAction={() => openPreview("Calendario")} />
                    <div className="list-card">
                      {DEMO_EVENTOS.map(ev => <EventItem key={ev._id} evento={ev} />)}
                    </div>
                  </section>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
