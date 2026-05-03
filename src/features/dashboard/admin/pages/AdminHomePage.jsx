// src/features/dashboard/admin/pages/AdminHomePage.jsx
// Renderiza vistas completamente distintas según el rol: superadmin vs administrador
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, BookOpen, Building2, Plus, ChevronRight,
  UserCheck, Bell, Calendar, GraduationCap, Shield,
  ArrowUpRight, Clock,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  usersGetAll, cursosGetAll, institucionesGetAll,
  institucionesGetMine, eventosGetHoy,
  notificacionesGetConteoNoLeidas,
} from "@/lib/apiClient";
import { normalizeCurso } from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";

/* ── Shared micro-components ─────────────────────────────────── */
function Skeleton({ h = 20, w = "100%", r = 8 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

function StatCard({ label, value, icon: Icon, color, bg, loading, sub }) {
  return (
    <div
      style={{
        background: "var(--color-surface)", borderRadius: 16,
        padding: "20px 22px", border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)", display: "flex", alignItems: "flex-start",
        gap: 16, transition: "box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <>
            <Skeleton h={28} w={60} r={6} />
            <div style={{ marginTop: 6 }}><Skeleton h={13} w={100} r={4} /></div>
          </>
        ) : (
          <>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>{value}</span>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>{label}</p>
            {sub && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2, opacity: 0.7 }}>{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, desc, color, bg, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderRadius: 12, border: "1px solid var(--color-border)",
        background: hov ? "var(--color-bg)" : "var(--color-surface)",
        cursor: "pointer", textAlign: "left", transition: "all 150ms",
        boxShadow: hov ? "var(--shadow-sm)" : "none",
        transform: hov ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 17, height: 17, color }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1, margin: 0 }}>{desc}</p>
      </div>
    </button>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#0C6AC4", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          {action.label} <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      )}
    </div>
  );
}

function WelcomeBanner({ subtitle }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  return (
    <div style={{
      borderRadius: 18,
      background: "linear-gradient(135deg, #0C6AC4 0%, #1E3A6E 60%, #0F172A 100%)",
      padding: "24px 32px", display: "flex", alignItems: "center", gap: 20,
      marginBottom: 28, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ position: "absolute", right: 60, bottom: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
      <div style={{ color: "white", position: "relative" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 6 }}>
          {subtitle}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
          {saludo}
        </h1>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VISTA SUPERADMIN — Gestión global del sistema
   APIs: GET /instituciones  ·  GET /users
   ══════════════════════════════════════════════════════════════ */
function SuperadminDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ instituciones: 0, usuarios: 0, admins: 0, docentes: 0 });
  const [insts,   setInsts]   = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [instRes, usersRes, adminsRes, docentesRes] = await Promise.all([
          institucionesGetAll(),
          usersGetAll({ limit: 1 }),
          usersGetAll({ rol: "administrador", limit: 1 }),
          usersGetAll({ rol: "docente", limit: 1 }),
        ]);
        setInsts(instRes.instituciones?.slice(0, 6) ?? []);
        setStats({
          instituciones: instRes.instituciones?.length ?? 0,
          usuarios:  usersRes.pagination?.totalUsers  ?? 0,
          admins:    adminsRes.pagination?.totalUsers ?? 0,
          docentes:  docentesRes.pagination?.totalUsers ?? 0,
        });
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <WelcomeBanner subtitle="Superadministrador — Vista global" />

      {/* Stats */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Resumen del sistema" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          <StatCard label="Instituciones activas" value={stats.instituciones} icon={Building2} color="#0C6AC4" bg="rgba(12,106,196,0.10)" loading={loading} />
          <StatCard label="Usuarios totales"       value={stats.usuarios}     icon={Users}     color="#6366F1" bg="rgba(99,102,241,0.10)"  loading={loading} />
          <StatCard label="Administradores"        value={stats.admins}       icon={Shield}    color="#D97706" bg="rgba(217,119,6,0.10)"   loading={loading} />
          <StatCard label="Docentes registrados"   value={stats.docentes}     icon={GraduationCap} color="#16A34A" bg="rgba(22,163,74,0.10)" loading={loading} />
        </div>
      </section>

      {/* Quick actions */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Acciones rápidas" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          <ActionBtn icon={Plus}      label="Nueva institución" desc="Crear institución + admin" color="#0C6AC4" bg="rgba(12,106,196,0.10)" onClick={() => navigate("/instituciones")} />
          <ActionBtn icon={Building2} label="Ver instituciones" desc="Listado y edición"          color="#6366F1" bg="rgba(99,102,241,0.10)" onClick={() => navigate("/instituciones")} />
          <ActionBtn icon={Users}     label="Gestionar usuarios" desc="Tabla global de usuarios"  color="#D97706" bg="rgba(217,119,6,0.10)"  onClick={() => navigate("/usuarios")} />
          <ActionBtn icon={Bell}      label="Notificaciones"    desc="Bandeja del sistema"         color="#16A34A" bg="rgba(22,163,74,0.10)"  onClick={() => navigate("/notificaciones")} />
        </div>
      </section>

      {/* Institutions list */}
      <section>
        <SectionHeader title="Instituciones recientes" action={{ label: "Ver todas", onClick: () => navigate("/instituciones") }} />
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 16 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                  <Skeleton h={38} w={38} r={10} />
                  <div style={{ flex: 1 }}><Skeleton h={14} w="65%" r={5} /><div style={{ marginTop: 6 }}><Skeleton h={11} w="40%" r={4} /></div></div>
                </div>
              ))}
            </div>
          ) : insts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <Building2 style={{ width: 28, height: 28, color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>No hay instituciones registradas</p>
            </div>
          ) : (
            insts.map((inst, i) => {
              const COLORS = ["#0C6AC4","#6366F1","#16A34A","#D97706","#DC2626","#8B5CF6"];
              const cc = COLORS[i % COLORS.length];
              return (
                <div
                  key={inst._id}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: "1px solid var(--color-border)", transition: "background 150ms", cursor: "default" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${cc}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 style={{ width: 17, height: 17, color: cc }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {inst.nombre}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2 }}>
                      {inst.nit ? `NIT ${inst.nit}` : inst.codigo ?? "—"}
                      {inst.direccion ? ` · ${inst.direccion}` : ""}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                    background: "rgba(22,163,74,0.1)", color: "#16A34A",
                  }}>
                    Activa
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VISTA ADMINISTRADOR — Gestión de la institución propia
   APIs: GET /instituciones/mi-institucion · GET /cursos
         GET /eventos/hoy · GET /notificaciones/conteo-no-leidas
   ══════════════════════════════════════════════════════════════ */
function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [loading,     setLoading]     = useState(true);
  const [inst,        setInst]        = useState(null);
  const [stats,       setStats]       = useState({ cursos: 0, docentes: 0, eventosHoy: 0, notifs: 0 });
  const [cursos,      setCursos]      = useState([]);
  const [eventos,     setEventos]     = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [instRes, cursosRes, docentesRes, eventosRes, notifsRes] = await Promise.all([
          institucionesGetMine(),
          cursosGetAll({ limit: 6 }),
          usersGetAll({ rol: "docente", limit: 1 }),
          eventosGetHoy(),
          notificacionesGetConteoNoLeidas(),
        ]);
        setInst(instRes.institucion ?? instRes);
        setCursos((cursosRes.cursos?.slice(0, 5) ?? []).map(normalizeCurso));
        setEventos((eventosRes.eventos ?? []).slice(0, 4));
        setStats({
          cursos:     cursosRes.pagination?.total ?? cursosRes.cursos?.length ?? 0,
          docentes:   docentesRes.pagination?.totalUsers ?? 0,
          eventosHoy: eventosRes.total ?? eventosRes.eventos?.length ?? 0,
          notifs:     notifsRes.noLeidas ?? 0,
        });
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, []);

  const COURSE_COLORS = ["#0C6AC4","#6366F1","#16A34A","#D97706","#DC2626","#8B5CF6"];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <WelcomeBanner
        subtitle={`Administrador${inst?.nombre ? ` · ${inst.nombre}` : ""}`}
      />

      {/* Stats */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Resumen de la institución" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          <StatCard label="Cursos activos"       value={stats.cursos}     icon={BookOpen}      color="#0C6AC4" bg="rgba(12,106,196,0.10)" loading={loading} />
          <StatCard label="Docentes asignados"   value={stats.docentes}   icon={GraduationCap} color="#16A34A" bg="rgba(22,163,74,0.10)"  loading={loading} />
          <StatCard label="Eventos hoy"          value={stats.eventosHoy} icon={Calendar}      color="#6366F1" bg="rgba(99,102,241,0.10)" loading={loading} />
          <StatCard
            label="Notificaciones nuevas" value={stats.notifs}
            icon={Bell} color="#D97706" bg="rgba(217,119,6,0.10)" loading={loading}
            sub={stats.notifs > 0 ? "Sin leer" : "Todo al día"}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Acciones rápidas" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          <ActionBtn icon={Plus}         label="Nuevo curso"       desc="Crear y asignar docente"  color="#0C6AC4" bg="rgba(12,106,196,0.10)" onClick={() => navigate("/cursos")} />
          <ActionBtn icon={UserCheck}    label="Gestionar docentes" desc="Registrar o importar CSV" color="#16A34A" bg="rgba(22,163,74,0.10)"  onClick={() => navigate("/docentes")} />
          <ActionBtn icon={Users}        label="Usuarios"          desc="Ver todos los usuarios"    color="#6366F1" bg="rgba(99,102,241,0.10)" onClick={() => navigate("/usuarios")} />
          <ActionBtn icon={Building2}    label="Mi institución"    desc="Datos y configuración"     color="#D97706" bg="rgba(217,119,6,0.10)"  onClick={() => navigate("/institucion")} />
        </div>
      </section>

      {/* Two-column: courses + events */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 20 }}>

        {/* Recent courses */}
        <section>
          <SectionHeader title="Cursos recientes" action={{ label: "Ver todos", onClick: () => navigate("/cursos") }} />
          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 16 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                    <Skeleton h={38} w={38} r={10} />
                    <div style={{ flex: 1 }}><Skeleton h={14} w="70%" r={5} /><div style={{ marginTop: 6 }}><Skeleton h={11} w="40%" r={4} /></div></div>
                  </div>
                ))}
              </div>
            ) : cursos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <BookOpen style={{ width: 26, height: 26, color: "var(--color-text-muted)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Sin cursos todavía</p>
              </div>
            ) : (
              cursos.map((c, i) => {
                const cc = COURSE_COLORS[i % COURSE_COLORS.length];
                return (
                  <div
                    key={c._id}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: "1px solid var(--color-border)", transition: "background 150ms", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => navigate("/cursos")}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${cc}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen style={{ width: 17, height: 17, color: cc }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.nombre}
                      </p>
                      <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {c.docente ? `${c.docente.nombre} ${c.docente.apellido}` : "Sin docente"}
                        {" · "}{c.participantes?.length ?? 0} participantes
                      </p>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Today's events */}
        <section>
          <SectionHeader title="Eventos de hoy" action={{ label: "Ver calendario", onClick: () => navigate("/notificaciones") }} />
          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 16 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
                    <Skeleton h={34} w={34} r={9} />
                    <div style={{ flex: 1 }}><Skeleton h={13} w="75%" r={4} /><div style={{ marginTop: 5 }}><Skeleton h={10} w="50%" r={3} /></div></div>
                  </div>
                ))}
              </div>
            ) : eventos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <Calendar style={{ width: 26, height: 26, color: "var(--color-text-muted)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Sin eventos hoy</p>
              </div>
            ) : (
              eventos.map((ev) => {
                const CAT_COLORS = { institucional: "#0C6AC4", escuela_padres: "#6366F1", academico: "#16A34A" };
                const cc = CAT_COLORS[ev.categoria] ?? "#8B5CF6";
                return (
                  <div
                    key={ev._id}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${cc}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar style={{ width: 14, height: 14, color: cc }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.titulo}
                      </p>
                      <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock style={{ width: 10, height: 10 }} />
                        {ev.hora ?? "Todo el día"}
                        {ev.categoria && ` · ${ev.categoria}`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Entry point — decide qué vista mostrar según el rol
   ══════════════════════════════════════════════════════════════ */
export default function AdminHomePage() {
  const { user } = useAuth();

  if (user?.rol === "superadmin") {
    return <SuperadminDashboard user={user} />;
  }

  return <AdminDashboard user={user} />;
}
