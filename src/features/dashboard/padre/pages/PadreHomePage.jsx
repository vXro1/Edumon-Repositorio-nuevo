import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, FileText, ClipboardList, Calendar, Bell,
  ChevronRight, Users, Clock, Heart,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { eventosGetHoy } from "@/features/eventos/services/eventosService";
import { normalizeCurso } from "@/lib/normalizers";
import CursoCard from "@/features/cursos/components/CursoCard";

/* ── Esqueleto de carga ────────────────────────────────────────── */
function Sk({ h = 14, w = "100%", r = "var(--radius-sm)" }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r, display: "block" }} />;
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
            <Sk h={26} w={50} r="var(--radius-sm)" />
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

/* ── Ítem de evento ────────────────────────────────────────────── */
function EventItem({ evento }) {
  return (
    <div className="list-card-item">
      <div
        className="list-card-item-icon"
        style={{ background: "var(--edu-blue-50)", color: "var(--edu-blue-500)" }}
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

/* ── Tarjeta de acción rápida ──────────────────────────────────── */
function QuickActionCard({ icon: Icon, label, desc, colorClass, onClick }) {
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
export default function PadreHomePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [cursos,   setCursos]   = useState([]);
  const [eventos,  setEventos]  = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cursosRes, eventosRes] = await Promise.all([
          cursosGetMine({ limit: 6 }),
          eventosGetHoy(),
        ]);
        setCursos((cursosRes.cursos   ?? []).map(normalizeCurso));
        setEventos(eventosRes.eventos ?? []);
      } catch { /* silencioso */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Banner de bienvenida ── */}
      <div
        className="welcome-banner edu-fade-in"
        style={{ background: "var(--gradient-berry)" }}
        role="banner"
      >
        <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <span className="welcome-badge">
            <Heart size={10} style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />
            Padre / Tutor
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
              {eventos.length > 0 && (
                <span className="welcome-chip">
                  {eventos.length} {eventos.length === 1 ? "evento hoy" : "eventos hoy"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Estadísticas ── */}
      <section aria-label="Resumen familiar" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Resumen" />
        <div className="grid-stats">
          <StatCard value={cursos.length}  label="Cursos activos"      icon={BookOpen} colorClass="stat-icon-purple" loading={loading} />
          <StatCard value={eventos.length} label="Eventos hoy"         icon={Calendar} colorClass="stat-icon-green"  loading={loading} />
          <StatCard value="—"              label="Notificaciones"      icon={Bell}     colorClass="stat-icon-yellow" loading={false} />
          <StatCard value="—"              label="Entregas pendientes" icon={FileText} colorClass="stat-icon-cyan"   loading={false} />
        </div>
      </section>

      {/* ── Acciones rápidas ── */}
      <section aria-label="Acciones rápidas" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader title="Acciones rápidas" />
        <div className="grid-2-auto">
          <QuickActionCard
            icon={Users}    label="Perfiles familiares" desc="Ver perfiles de tus hijos"
            colorClass="stat-icon-purple" onClick={() => navigate("/familia/perfiles")}
          />
          <QuickActionCard
            icon={BookOpen} label="Ver cursos"          desc="Cursos de tus hijos"
            colorClass="stat-icon-cyan"   onClick={() => navigate("/familia/cursos")}
          />
          {/* Antes "Ver entregas" apuntaba a una lista separada
              (/familia/entregas) que duplicaba esta misma lista de retos —
              cada reto ya lleva directo a su entrega individual. */}
          <QuickActionCard
            icon={ClipboardList} label="Retos"        desc="Retos de tus hijos y sus entregas"
            colorClass="stat-icon-green"  onClick={() => navigate("/familia/tareas")}
          />
          <QuickActionCard
            icon={Calendar} label="Calendario"          desc="Eventos y actividades"
            colorClass="stat-icon-yellow" onClick={() => navigate("/familia/calendario")}
          />
        </div>
      </section>

      {/* ── Cursos ── */}
      <section aria-label="Cursos de mis hijos" style={{ marginBottom: "var(--space-6)" }}>
        <SectionHeader
          title="Cursos de mis hijos"
          actionLabel="Ver perfiles"
          onAction={() => navigate("/familia/perfiles")}
        />
        {loading ? (
          <CourseSkeletons />
        ) : cursos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <BookOpen size={24} aria-hidden="true" />
            </div>
            <p className="empty-state-title">Aún no hay cursos asignados</p>
            <p className="empty-state-sub">
              Contacta al docente o administrador para que te agreguen a un curso.
            </p>
          </div>
        ) : (
          <div className="grid-auto-sm">
            {cursos.map((c, i) => (
              <CursoCard
                key={c._id}
                curso={c}
                role="padre"
                idx={i}
                compact={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* sección permanente (con esqueleto/estado vacío), no desaparece sin eventos hoy */}
      <section aria-label="Eventos de hoy">
        <SectionHeader
          title="Eventos de hoy"
          actionLabel="Ver calendario"
          onAction={() => navigate("/familia/calendario")}
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
