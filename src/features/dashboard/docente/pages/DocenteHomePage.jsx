import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ClipboardList, Users, ChevronRight,
  Plus, Calendar, Clock, CheckCircle2, Sparkles, MessageCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { tareasGetAll } from "@/features/cursos/services/tareasService";
import { eventosGetHoy } from "@/features/eventos/services/eventosService";
import { normalizeCurso, normalizeTarea } from "@/lib/normalizers";
import CursoCard from "@/features/cursos/components/CursoCard";
import { Button } from "@/components";

/* ── Esqueleto de carga ────────────────────────────────────────── */
function Sk({ h = 14, w = "100%", r = "var(--radius-sm)" }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r, display: "block" }} />;
}

/* ── Tarjeta de estadística ────────────────────────────────────── */
function StatCard({ value, label, icon: Icon, colorClass, loading }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${colorClass}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="stat-card-body">
        {loading ? (
          <>
            <Sk h={28} w={50} r="var(--radius-sm)" />
            <div style={{ marginTop: 6 }}><Sk h={11} w={90} /></div>
          </>
        ) : (
          <>
            <p className="stat-card-value">{value}</p>
            <p className="stat-card-label">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Ítem de lista de tareas ───────────────────────────────────── */
function TaskItem({ tarea }) {
  return (
    <div className="list-card-item">
      <div
        className="list-card-item-icon"
        style={{ background: "var(--edu-cyan-50)", color: "var(--edu-cyan-600)" }}
      >
        <CheckCircle2 size={16} aria-hidden="true" />
      </div>
      <div className="list-card-item-body">
        <p className="list-card-item-title">{tarea.titulo}</p>
        {tarea.fechaVencimiento && (
          <p className="list-card-item-meta">
            <Clock size={10} aria-hidden="true" />
            Vence: {new Date(tarea.fechaVencimiento).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>
      <span
        className="list-card-item-badge"
        style={{ background: "var(--edu-cyan-50)", color: "var(--edu-cyan-700)" }}
      >
        Activa
      </span>
    </div>
  );
}

/* ── Ítem de lista de eventos ──────────────────────────────────── */
function EventItem({ evento }) {
  return (
    <div className="list-card-item">
      <div
        className="list-card-item-icon"
        style={{ background: "var(--edu-green-50)", color: "var(--edu-green-600)" }}
      >
        <Calendar size={16} aria-hidden="true" />
      </div>
      <div className="list-card-item-body">
        <p className="list-card-item-title">{evento.titulo}</p>
        <p className="list-card-item-meta">
          <Clock size={10} aria-hidden="true" />
          {evento.hora ?? "Todo el día"}
        </p>
      </div>
    </div>
  );
}

/* ── Tarjeta de acción rápida — mismo patrón que admin/padre ──── */
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

/* ── Encabezado de sección ─────────────────────────────────────── */
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

/* ── Estado vacío ──────────────────────────────────────────────── */
function EmptyState({ icon: Icon, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} aria-hidden="true" />
      </div>
      <p className="empty-state-title">{text}</p>
      {onAction && (
        <Button variant="primary" size="sm" onClick={onAction} style={{ marginTop: "var(--space-2)" }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/* ── Esqueletos de cuadrícula de cursos ────────────────────────── */
function CourseSkeletons() {
  return (
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
  );
}

/* ══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════════════════════════ */
export default function DocenteHomePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [cursos,   setCursos]   = useState([]);
  const [tareas,   setTareas]   = useState([]);
  const [eventos,  setEventos]  = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cursosRes, tareasRes, eventosRes] = await Promise.all([
          cursosGetMine({ limit: 6 }),
          tareasGetAll({ limit: 5 }),
          eventosGetHoy(),
        ]);
        setCursos((cursosRes.cursos   ?? []).map(normalizeCurso));
        setTareas((tareasRes.tareas   ?? []).map(normalizeTarea));
        setEventos(eventosRes.eventos ?? []);
      } catch { /* silencioso */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const totalEstudiantes = cursos.reduce((a, c) => a + (c.participantes?.length ?? 0), 0);
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Banner de bienvenida ── */}
      <div className="welcome-banner edu-fade-in" role="banner">
        <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <span className="welcome-badge">
            <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />
            Docente
          </span>
          <h1 className="welcome-title">
            {saludo}{user?.nombre ? `, ${user.nombre}` : ""}
          </h1>
          {!loading && (
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
              {cursos.length > 0 && (
                <span className="welcome-chip">
                  {cursos.length} {cursos.length === 1 ? "curso activo" : "cursos activos"}
                </span>
              )}
              {tareas.length > 0 && (
                <span className="welcome-chip">
                  {tareas.length} {tareas.length === 1 ? "reto activo" : "retos activos"}
                </span>
              )}
              {eventos.length > 0 && (
                <span className="welcome-chip">
                  {eventos.length} {eventos.length === 1 ? "evento hoy" : "eventos hoy"}
                </span>
              )}
              {totalEstudiantes > 0 && (
                <span className="welcome-chip">
                  {totalEstudiantes} {totalEstudiantes === 1 ? "estudiante" : "estudiantes"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Estadísticas ── */}
      <section aria-label="Estadísticas de actividad" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Tu actividad" />
        <div className="grid-stats">
          <StatCard value={cursos.length}        label="Mis cursos"           icon={BookOpen}      colorClass="stat-icon-purple" loading={loading} />
          <StatCard value={totalEstudiantes}      label="Estudiantes en total" icon={Users}         colorClass="stat-icon-green"  loading={loading} />
          <StatCard value={tareas.length}         label="Retos activos"        icon={ClipboardList} colorClass="stat-icon-cyan"   loading={loading} />
          <StatCard value={eventos.length}        label="Eventos hoy"          icon={Calendar}      colorClass="stat-icon-yellow" loading={loading} />
        </div>
      </section>

      {/* mismo patrón de tarjeta (ActionCard) que admin/padre; Foros es lo específico de docente */}
      <section aria-label="Acciones rápidas" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Acciones rápidas" />
        <div className="grid-auto-sm">
          <ActionCard icon={Plus}           label="Crear curso"  desc="Nuevo curso para tus estudiantes" colorClass="stat-icon-purple" onClick={() => navigate("/cursos")} />
          <ActionCard icon={ClipboardList}  label="Nuevo reto"   desc="Asigna un reto o actividad"       colorClass="stat-icon-cyan"   onClick={() => navigate("/tareas")} />
          <ActionCard icon={MessageCircle}  label="Foros"        desc="Discusiones de tus cursos"        colorClass="stat-icon-green"  onClick={() => navigate("/foros")} />
          <ActionCard icon={Calendar}       label="Calendario"   desc="Eventos y actividades"             colorClass="stat-icon-yellow" onClick={() => navigate("/calendario")} />
        </div>
      </section>

      {/* ── Cursos + Retos ── */}
      <div className="layout-split" style={{ marginBottom: "var(--space-6)" }}>

        {/* Cursos */}
        <section aria-label="Mis cursos">
          <SectionHeader
            title="Mis cursos"
            actionLabel="Ver todos"
            onAction={() => navigate("/cursos")}
          />
          {loading ? (
            <CourseSkeletons />
          ) : cursos.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              text="No tienes cursos asignados aún"
              actionLabel="Crear primer curso"
              onAction={() => navigate("/cursos")}
            />
          ) : (
            <div className="grid-auto-sm">
              {cursos.map((c, i) => (
                <CursoCard
                  key={c._id}
                  curso={c}
                  role="docente"
                  idx={i}
                  compact={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* Retos */}
        <section aria-label="Retos activos">
          <SectionHeader
            title="Retos activos"
            actionLabel="Ver todos"
            onAction={() => navigate("/tareas")}
          />
          <div className="list-card">
            {loading ? (
              <div style={{ padding: "var(--space-4)" }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="skeleton-list-item">
                    <Sk h={36} w={36} r="var(--radius-md)" />
                    <div style={{ flex: 1 }}>
                      <Sk h={13} w="75%" />
                      <div style={{ marginTop: 6 }}><Sk h={10} w="45%" /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tareas.length === 0 ? (
              <div style={{ padding: "var(--space-8) var(--space-5)", textAlign: "center" }}>
                <ClipboardList
                  size={24}
                  aria-hidden="true"
                  style={{ color: "var(--color-text-subtle)", margin: "0 auto var(--space-2)" }}
                />
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
                  Sin retos activos
                </p>
              </div>
            ) : (
              tareas.map(t => <TaskItem key={t._id} tarea={t} />)
            )}
          </div>
        </section>
      </div>

      {/* sección permanente (con esqueleto/estado vacío), no desaparece sin eventos hoy */}
      <section aria-label="Eventos de hoy" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader
          title="Eventos de hoy"
          actionLabel="Ver calendario"
          onAction={() => navigate("/calendario")}
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
            eventos.map(ev => <EventItem key={ev._id} evento={ev} />)
          )}
        </div>
      </section>
    </div>
  );
}