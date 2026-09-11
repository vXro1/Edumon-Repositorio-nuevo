import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, BookOpen, Building2, Plus, ChevronRight,
  UserCheck, Bell, Calendar, GraduationCap, Shield,
  Mail, MailOpen, Sparkles,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersGetAll } from "@/services/usersService";
import { cursosGetAll } from "@/features/cursos/services/cursosService";
import { institucionesGetAll, institucionesGetMine } from "@/services/institucionesService";
import { eventosGetHoy } from "@/features/eventos/services/eventosService";
import { notificacionesGetConteoNoLeidas } from "@/features/notificaciones/services/notificacionesService";
import { buzonGetAll, buzonMarcarLeido } from "@/features/buzon/services/buzonService";
import { normalizeCurso } from "@/lib/normalizers";
import CursoCard from "@/features/cursos/components/CursoCard";
import { Button } from "@/components";
import { normalizeRole, ROLES } from "@/security/roleMatrix";

/* ── Esqueleto de carga ────────────────────────────────────────── */
function Sk({ h = 14, w = "100%", r = "var(--radius-sm)" }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r, display: "block" }} />;
}

/* ── Compartido: Tarjeta de estadística ────────────────────────── */
function StatCard({ label, value, icon: Icon, colorClass, loading, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${colorClass}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="stat-card-body">
        {loading ? (
          <>
            <Sk h={28} w={60} r="var(--radius-sm)" />
            <div style={{ marginTop: 6 }}><Sk h={12} w={100} /></div>
          </>
        ) : (
          <>
            <p className="stat-card-value">{value}</p>
            <p className="stat-card-label">{label}</p>
            {sub && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-subtle)", marginTop: 2 }}>{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Compartido: Tarjeta de acción rápida ──────────────────────── */
function ActionCard({ icon: Icon, label, desc, colorClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card card-interactive"
      style={{
        display: "flex", alignItems: "center", gap: "var(--space-3)",
        padding: "var(--space-4)", textAlign: "left", width: "100%",
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
      }}
    >
      <div className={`stat-card-icon ${colorClass}`} style={{ flexShrink: 0 }}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text)", margin: 0, lineHeight: 1.3 }}>
          {label}
        </p>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0, marginTop: 2 }}>
          {desc}
        </p>
      </div>
      <ChevronRight size={14} style={{ color: "var(--color-text-subtle)", flexShrink: 0 }} aria-hidden="true" />
    </button>
  );
}

/* ── Compartido: Encabezado de sección ─────────────────────────── */
function SectionHeader({ title, onAction, actionLabel }) {
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

/* ── Compartido: Banner de bienvenida ──────────────────────────── */
function WelcomeBanner({ roleLabel, gradient, chips }) {
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  return (
    <div
      className="welcome-banner edu-fade-in"
      style={{ background: gradient ?? "var(--gradient-brand)" }}
      role="banner"
    >
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <span className="welcome-badge">
          <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />
          {roleLabel}
        </span>
        <h1 className="welcome-title">{saludo}</h1>
        {chips && chips.length > 0 && (
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
            {chips.map((chip, i) => (
              <span key={i} className="welcome-chip">{chip}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Compartido: Fila de lista (institución) ───────────────────── */
const PALETTE = ["var(--edu-blue-500)","var(--edu-cyan-600)","var(--edu-green-600)","var(--edu-yellow-700)","var(--color-error)","var(--edu-pink-500)"];
const PALETTE_BG = ["var(--edu-blue-50)","var(--edu-cyan-50)","var(--edu-green-50)","var(--edu-yellow-50)","var(--color-error-light)","var(--edu-pink-50)"];

function ListRow({ index, icon: Icon, title, meta, badge, badgeBg, badgeColor, onClick }) {
  const fg = PALETTE[index % PALETTE.length];
  const bg = PALETTE_BG[index % PALETTE_BG.length];
  return (
    <div
      className="list-card-item"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === "Enter" && onClick() : undefined}
    >
      <div className="list-card-item-icon" style={{ background: bg, color: fg }}>
        <Icon size={17} aria-hidden="true" />
      </div>
      <div className="list-card-item-body">
        <p className="list-card-item-title">{title}</p>
        {meta && <p className="list-card-item-meta">{meta}</p>}
      </div>
      {badge && (
        <span
          className="list-card-item-badge"
          style={{ background: badgeBg ?? "var(--edu-green-50)", color: badgeColor ?? "var(--edu-green-700)" }}
        >
          {badge}
        </span>
      )}
      {onClick && <ChevronRight size={14} style={{ color: "var(--color-text-subtle)", flexShrink: 0 }} aria-hidden="true" />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PANEL DE SUPERADMINISTRADOR
   ══════════════════════════════════════════════════════════════════ */
function SuperadminDashboard() {
  const navigate = useNavigate();
  const [loading,          setLoading]          = useState(true);
  const [stats,            setStats]            = useState({ instituciones: 0, usuarios: 0, admins: 0, docentes: 0 });
  const [insts,            setInsts]            = useState([]);
  const [mensajes,         setMensajes]         = useState([]);
  const [mensajesLoading,  setMensajesLoading]  = useState(true);
  const [markingId,        setMarkingId]        = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [instRes, usersRes, adminsRes, docentesRes] = await Promise.all([
          institucionesGetAll(),
          usersGetAll({ limit: 1 }),
          usersGetAll({ rol: ROLES.ADMIN,    limit: 1 }),
          usersGetAll({ rol: ROLES.DOCENTE,  limit: 1 }),
        ]);
        setInsts(instRes.instituciones?.slice(0, 6) ?? []);
        setStats({
          instituciones: instRes.instituciones?.length ?? 0,
          usuarios:  usersRes.pagination?.totalUsers   ?? 0,
          admins:    adminsRes.pagination?.totalUsers  ?? 0,
          docentes:  docentesRes.pagination?.totalUsers ?? 0,
        });
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await buzonGetAll({ limit: 20 });
        const sorted = (res.mensajes ?? res.data ?? []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setMensajes(sorted);
      } catch { /* silencioso */ }
      finally { setMensajesLoading(false); }
    })();
  }, []);

  const handleMarcarLeido = async (id) => {
    setMarkingId(id);
    try {
      await buzonMarcarLeido(id);
      setMensajes(prev => prev.map(m => m._id === id ? { ...m, leido: true } : m));
    } catch { /* silencioso */ }
    finally { setMarkingId(null); }
  };

  const unreadCount = mensajes.filter(m => !m.leido).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <WelcomeBanner
        roleLabel="Superadministrador"
        gradient="var(--gradient-brand-full)"
        chips={loading ? [] : [
          stats.instituciones > 0 ? `${stats.instituciones} instituciones` : null,
          stats.usuarios > 0      ? `${stats.usuarios} usuarios`           : null,
          stats.docentes > 0      ? `${stats.docentes} docentes`           : null,
        ].filter(Boolean)}
      />

      {/* Estadísticas */}
      <section aria-label="Resumen del sistema" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Resumen del sistema" />
        <div className="grid-stats">
          <StatCard label="Instituciones activas" value={stats.instituciones} icon={Building2}    colorClass="stat-icon-purple" loading={loading} />
          <StatCard label="Usuarios totales"       value={stats.usuarios}     icon={Users}         colorClass="stat-icon-cyan"   loading={loading} />
          <StatCard label="Administradores"        value={stats.admins}       icon={Shield}        colorClass="stat-icon-yellow" loading={loading} />
          <StatCard label="Docentes registrados"   value={stats.docentes}     icon={GraduationCap} colorClass="stat-icon-green"  loading={loading} />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section aria-label="Acciones rápidas" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Acciones rápidas" />
        <div className="grid-auto-sm">
          <ActionCard icon={Plus}      label="Nueva institución"  desc="Crear institución + admin" colorClass="stat-icon-purple" onClick={() => navigate("/instituciones")} />
          <ActionCard icon={Building2} label="Ver instituciones"  desc="Listado y edición"          colorClass="stat-icon-cyan"   onClick={() => navigate("/instituciones")} />
          <ActionCard icon={Users}     label="Gestionar usuarios" desc="Tabla global de usuarios"   colorClass="stat-icon-yellow" onClick={() => navigate("/usuarios")} />
          <ActionCard icon={Bell}      label="Notificaciones"     desc="Bandeja del sistema"         colorClass="stat-icon-green"  onClick={() => navigate("/notificaciones")} />
        </div>
      </section>

      {/* Buzón de contacto */}
      <section aria-label="Buzón de contacto" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader
          title={`Buzón de contacto${unreadCount > 0 ? ` · ${unreadCount} sin leer` : ""}`}
          onAction={() => navigate("/buzon")}
          actionLabel="Ver buzón"
        />
        <div className="list-card">
          {mensajesLoading ? (
            <div style={{ padding: "var(--space-4)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="skeleton-list-item">
                  <Sk h={38} w={38} r="var(--radius-md)" />
                  <div style={{ flex: 1 }}>
                    <Sk h={13} w="55%" />
                    <div style={{ marginTop: 6 }}><Sk h={10} w="80%" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : mensajes.length === 0 ? (
            <div className="empty-state" style={{ border: "none", borderRadius: 0 }}>
              <div className="empty-state-icon"><Mail size={22} aria-hidden="true" /></div>
              <p className="empty-state-title">No hay mensajes recibidos</p>
            </div>
          ) : (
            mensajes.map(msg => (
              <div
                key={msg._id}
                className="list-card-item"
                style={{
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                  background: msg.leido ? "transparent" : "var(--edu-blue-50)",
                  borderLeft: msg.leido ? "none" : "3px solid var(--color-primary)",
                  paddingLeft: msg.leido ? "var(--space-4)" : "calc(var(--space-4) - 3px)",
                }}
              >
                <div
                  className="list-card-item-icon"
                  style={{
                    background: msg.leido ? "var(--edu-neutral-100)" : "var(--edu-blue-100)",
                    color:      msg.leido ? "var(--color-text-muted)" : "var(--color-primary)",
                    flexShrink: 0,
                  }}
                >
                  {msg.leido ? <MailOpen size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <p style={{
                      fontSize: "var(--text-sm)", fontWeight: msg.leido ? "var(--font-medium)" : "var(--font-bold)",
                      color: "var(--color-text)", margin: 0,
                    }}>
                      {msg.nombre}
                    </p>
                    {msg.institucion && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        · {msg.institucion}
                      </span>
                    )}
                    {!msg.leido && (
                      <span className="list-card-item-badge" style={{ background: "var(--edu-blue-100)", color: "var(--color-primary)" }}>
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.correo}{msg.telefono ? ` · ${msg.telefono}` : ""}
                  </p>
                  <p style={{
                    fontSize: "var(--text-sm)", color: "var(--color-text)", margin: "var(--space-1) 0 0",
                    lineHeight: "var(--leading-relaxed)",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {msg.mensaje}
                  </p>
                </div>
                {!msg.leido && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleMarcarLeido(msg._id)}
                    disabled={markingId === msg._id}
                    style={{ flexShrink: 0 }}
                  >
                    {markingId === msg._id ? "..." : "Leído"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Instituciones recientes */}
      <section aria-label="Instituciones recientes">
        <SectionHeader
          title="Instituciones recientes"
          onAction={() => navigate("/instituciones")}
          actionLabel="Ver todas"
        />
        <div className="list-card">
          {loading ? (
            <div style={{ padding: "var(--space-4)" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="skeleton-list-item">
                  <Sk h={38} w={38} r="var(--radius-md)" />
                  <div style={{ flex: 1 }}>
                    <Sk h={13} w="65%" />
                    <div style={{ marginTop: 6 }}><Sk h={10} w="40%" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : insts.length === 0 ? (
            <div className="empty-state" style={{ border: "none", borderRadius: 0 }}>
              <div className="empty-state-icon"><Building2 size={22} aria-hidden="true" /></div>
              <p className="empty-state-title">No hay instituciones registradas</p>
            </div>
          ) : (
            insts.map((inst, i) => (
              <ListRow
                key={inst._id}
                index={i}
                icon={Building2}
                title={inst.nombre}
                meta={[inst.nit ? `NIT ${inst.nit}` : inst.codigo, inst.direccion].filter(Boolean).join(" · ")}
                badge="Activa"
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PANEL DE ADMINISTRADOR
   ══════════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inst,    setInst]    = useState(null);
  const [stats,   setStats]   = useState({ cursos: 0, docentes: 0, eventosHoy: 0, notifs: 0 });
  const [cursos,  setCursos]  = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [instRes, cursosRes, docentesRes, eventosRes, notifsRes] = await Promise.all([
          institucionesGetMine(),
          cursosGetAll({ limit: 6 }),
          usersGetAll({ rol: ROLES.DOCENTE, limit: 1 }),
          eventosGetHoy(),
          notificacionesGetConteoNoLeidas(),
        ]);
        setInst(instRes.institucion ?? instRes);
        setCursos((cursosRes.cursos?.slice(0, 5) ?? []).map(normalizeCurso));
        setEventos((eventosRes.eventos ?? []).slice(0, 4));
        setStats({
          cursos:     cursosRes.pagination?.total  ?? cursosRes.cursos?.length ?? 0,
          docentes:   docentesRes.pagination?.totalUsers ?? 0,
          eventosHoy: eventosRes.total ?? eventosRes.eventos?.length ?? 0,
          notifs:     notifsRes.noLeidas ?? 0,
        });
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <WelcomeBanner
        roleLabel={`Administrador${inst?.nombre ? ` · ${inst.nombre}` : ""}`}
        gradient="var(--gradient-cool)"
        chips={loading ? [] : [
          stats.cursos > 0     ? `${stats.cursos} cursos activos`     : null,
          stats.docentes > 0   ? `${stats.docentes} docentes`         : null,
          stats.eventosHoy > 0 ? `${stats.eventosHoy} eventos hoy`    : null,
          stats.notifs > 0     ? `${stats.notifs} notificaciones`     : null,
        ].filter(Boolean)}
      />

      {/* Estadísticas */}
      <section aria-label="Resumen de la institución" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Resumen de la institución" />
        <div className="grid-stats">
          <StatCard label="Cursos activos"        value={stats.cursos}     icon={BookOpen}      colorClass="stat-icon-cyan"   loading={loading} />
          <StatCard label="Docentes asignados"    value={stats.docentes}   icon={GraduationCap} colorClass="stat-icon-green"  loading={loading} />
          <StatCard label="Eventos hoy"           value={stats.eventosHoy} icon={Calendar}      colorClass="stat-icon-purple" loading={loading} />
          <StatCard label="Notificaciones nuevas" value={stats.notifs}     icon={Bell}          colorClass="stat-icon-yellow" loading={loading}
            sub={stats.notifs > 0 ? "Sin leer" : "Todo al día"}
          />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section aria-label="Acciones rápidas" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Acciones rápidas" />
        <div className="grid-auto-sm">
          <ActionCard icon={Plus}      label="Gestionar cursos"   desc="Ver todos mis cursos"  colorClass="stat-icon-cyan"   onClick={() => navigate("/cursos")} />
          <ActionCard icon={UserCheck} label="Gestionar docentes" desc="Registrar o importar CSV" colorClass="stat-icon-green"  onClick={() => navigate("/docentes")} />
          <ActionCard icon={Users}     label="Usuarios"           desc="Ver todos los usuarios"   colorClass="stat-icon-purple" onClick={() => navigate("/usuarios")} />
          <ActionCard icon={Building2} label="Mi institución"     desc="Datos y configuración"    colorClass="stat-icon-yellow" onClick={() => navigate("/institucion")} />
        </div>
      </section>

      {/* Cursos + Eventos */}
      <div className="layout-split">
        {/* Cursos — ahora con CursoCard, igual que el panel de docente */}
        <section aria-label="Cursos recientes">
          <SectionHeader
            title="Cursos recientes"
            onAction={() => navigate("/cursos")}
            actionLabel="Ver todos"
          />
          {loading ? (
            <div className="grid-auto-sm">
              {[0, 1, 2].map(i => (
                <div key={i} className="skeleton-course-card">
                  <div className="sk-cover skeleton" />
                  <div className="sk-body">
                    <Sk h={40} w={40} r="var(--radius-md)" />
                    <Sk h={13} w="80%" />
                    <Sk h={10} w="55%" />
                  </div>
                </div>
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <div className="empty-state" style={{ border: "none", borderRadius: 0 }}>
              <div className="empty-state-icon"><BookOpen size={22} aria-hidden="true" /></div>
              <p className="empty-state-title">Sin cursos todavía</p>
            </div>
          ) : (
            <div className="grid-auto-sm">
              {cursos.map((c, i) => (
                <CursoCard
                  key={c._id}
                  curso={c}
                  role="admin"
                  idx={i}
                  compact={true}
                  onClick={() => navigate(`/cursos/${c._id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section aria-label="Eventos de hoy">
          <SectionHeader
            title="Eventos de hoy"
            onAction={() => navigate("/calendario")}
            actionLabel="Ver calendario"
          />
          <div className="list-card">
            {loading ? (
              <div style={{ padding: "var(--space-4)" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="skeleton-list-item">
                    <Sk h={34} w={34} r="var(--radius-md)" />
                    <div style={{ flex: 1 }}>
                      <Sk h={12} w="75%" />
                      <div style={{ marginTop: 5 }}><Sk h={10} w="50%" /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : eventos.length === 0 ? (
              <div className="empty-state" style={{ border: "none", borderRadius: 0 }}>
                <div className="empty-state-icon"><Calendar size={22} aria-hidden="true" /></div>
                <p className="empty-state-title">Sin eventos hoy</p>
              </div>
            ) : (
              eventos.map((ev, i) => (
                <ListRow
                  key={ev._id}
                  index={i}
                  icon={Calendar}
                  title={ev.titulo}
                  meta={[ev.hora ?? "Todo el día", ev.categoria].filter(Boolean).join(" · ")}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Punto de entrada ──────────────────────────────────────────── */
export default function AdminHomePage() {
  const { user } = useAuth();
  const rol = normalizeRole(user?.rol);

  if (rol === ROLES.SUPERADMIN) return <SuperadminDashboard />;
  return <AdminDashboard />;
}