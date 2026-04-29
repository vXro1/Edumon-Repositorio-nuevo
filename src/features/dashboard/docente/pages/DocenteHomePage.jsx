// src/features/dashboard/docente/pages/DocenteHomePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ClipboardList, Users, ChevronRight,
  Plus, Calendar, Clock, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cursosGetMine, tareasGetAll, eventosGetHoy } from "@/lib/apiClient";

// ── Color palette for course cards ─────────────────────────
const CARD_COLORS = [
  { bg: "#EFF6FF", border: "#BFDBFE", icon: "#1D4ED8", dot: "#0C6AC4" },
  { bg: "#F0FDF4", border: "#BBF7D0", icon: "#166534", dot: "#16A34A" },
  { bg: "#FAF5FF", border: "#DDD6FE", icon: "#5B21B6", dot: "#7C3AED" },
  { bg: "#FFF7ED", border: "#FED7AA", icon: "#9A3412", dot: "#EA580C" },
  { bg: "#F0F9FF", border: "#BAE6FD", icon: "#075985", dot: "#0284C7" },
  { bg: "#FDF4FF", border: "#F0ABFC", icon: "#7E22CE", dot: "#A21CAF" },
  { bg: "#FFFBEB", border: "#FDE68A", icon: "#92400E", dot: "#D97706" },
  { bg: "#FFF1F2", border: "#FECDD3", icon: "#9F1239", dot: "#E11D48" },
];
const cardColor = (i) => CARD_COLORS[i % CARD_COLORS.length];

// ── Skeleton ────────────────────────────────────────────────
function Skeleton({ h = 16, w = "100%", r = 7 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

// ── Stat card ───────────────────────────────────────────────
function StatCard({ value, label, icon: Icon, color, bg, loading }) {
  return (
    <div
      style={{
        background: "var(--color-surface)", borderRadius: 16,
        padding: "18px 20px", border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)", display: "flex",
        alignItems: "flex-start", gap: 14,
        transition: "box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <div style={{ flex: 1 }}>
        {loading ? (
          <>
            <Skeleton h={26} w={50} r={6} />
            <div style={{ marginTop: 6 }}><Skeleton h={12} w={90} r={4} /></div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", lineHeight: 1, margin: 0 }}>
              {value}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4 }}>{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Course card ─────────────────────────────────────────────
function CourseCard({ curso, idx, onClick }) {
  const [hov, setHov] = useState(false);
  const cc = cardColor(idx);

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--color-surface)",
        borderRadius: 16,
        border: `1px solid ${hov ? cc.border : "var(--color-border)"}`,
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)",
        cursor: "pointer",
        transition: "all 200ms ease",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        overflow: "hidden",
      }}
    >
      {/* Color strip */}
      <div style={{ height: 5, background: cc.dot, width: "100%" }} />

      <div style={{ padding: "16px 18px" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: cc.bg, display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: 12,
        }}>
          <BookOpen style={{ width: 18, height: 18, color: cc.icon }} />
        </div>

        <h3 style={{
          fontSize: 14, fontWeight: 700, color: "var(--color-text)",
          lineHeight: 1.35, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {curso.nombre}
        </h3>

        {curso.descripcion && (
          <p style={{
            fontSize: 12, color: "var(--color-text-muted)", marginTop: 6,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {curso.descripcion}
          </p>
        )}

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 14, paddingTop: 12,
          borderTop: "1px solid var(--color-border)",
        }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11.5, color: "var(--color-text-muted)",
          }}>
            <Users style={{ width: 12, height: 12 }} />
            {curso.participantes?.length ?? 0} alumnos
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 11.5, fontWeight: 600, color: cc.dot,
          }}>
            Ver <ArrowUpRight style={{ width: 12, height: 12 }} />
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Task item ────────────────────────────────────────────────
function TaskItem({ tarea }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0, color: "rgba(12,106,196,0.5)" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "var(--color-text)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0,
        }}>
          {tarea.titulo}
        </p>
        {tarea.fechaVencimiento && (
          <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2 }}>
            Vence: {new Date(tarea.fechaVencimiento).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
        background: "rgba(12,106,196,0.10)", color: "#0C6AC4",
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        Activa
      </span>
    </div>
  );
}

// ── Event item ───────────────────────────────────────────────
function EventItem({ evento }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "rgba(22,163,74,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Calendar style={{ width: 15, height: 15, color: "#16A34A" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "var(--color-text)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0,
        }}>
          {evento.titulo}
        </p>
        <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock style={{ width: 10, height: 10 }} />
          {evento.hora ?? "Todo el día"}
        </p>
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────
function SectionHeader({ title, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 14,
    }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12.5, fontWeight: 600, color: "#0C6AC4",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          {action.label} <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      )}
    </div>
  );
}

function EmptyCard({ icon, text, action }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      background: "var(--color-surface)", borderRadius: 16,
      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
      padding: "44px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      {icon}
      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            marginTop: 4,
            padding: "8px 18px", borderRadius: 10, border: "none",
            background: hov ? "#0A58A8" : "#0C6AC4",
            color: "white", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "background 150ms",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function DocenteHomePage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cursos,  setCursos]  = useState([]);
  const [tareas,  setTareas]  = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cursosRes, tareasRes, eventosRes] = await Promise.all([
          cursosGetMine({ limit: 6 }),
          tareasGetAll({ limit: 5 }),
          eventosGetHoy(),
        ]);
        setCursos(cursosRes.cursos   ?? []);
        setTareas(tareasRes.tareas   ?? []);
        setEventos(eventosRes.eventos ?? []);
      } catch { /* silencioso */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const totalEstudiantes = cursos.reduce((a, c) => a + (c.participantes?.length ?? 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Welcome banner ─────────────────────────────── */}
      <div style={{
        borderRadius: 18,
        background: "linear-gradient(135deg, #0C6AC4 0%, #1E3A6E 60%, #0F172A 100%)",
        padding: "26px 32px",
        display: "flex", alignItems: "center", gap: 20,
        marginBottom: 28,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 160, height: 160, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800, color: "white",
        }}>
          {user?.nombre?.[0]?.toUpperCase() ?? "D"}
        </div>
        <div style={{ color: "white", position: "relative" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>
            Docente
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Bienvenido, {user?.nombre} {user?.apellido}
          </h1>
          <p style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>{user?.correo}</p>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Tu actividad" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
        }}>
          <StatCard
            value={cursos.length} label="Mis cursos"
            icon={BookOpen} color="#0C6AC4" bg="rgba(12,106,196,0.10)"
            loading={loading}
          />
          <StatCard
            value={totalEstudiantes} label="Estudiantes en total"
            icon={Users} color="#16A34A" bg="rgba(22,163,74,0.10)"
            loading={loading}
          />
          <StatCard
            value={tareas.length} label="Tareas activas"
            icon={ClipboardList} color="#6366F1" bg="rgba(99,102,241,0.10)"
            loading={loading}
          />
          <StatCard
            value={eventos.length} label="Eventos hoy"
            icon={Calendar} color="#D97706" bg="rgba(217,119,6,0.10)"
            loading={loading}
          />
        </div>
      </section>

      {/* ── Quick actions ──────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Acciones rápidas" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { icon: Plus,          label: "Crear curso",      variant: "primary", onClick: () => navigate("/cursos") },
            { icon: ClipboardList, label: "Nueva tarea",      variant: "outline", onClick: () => navigate("/tareas") },
            { icon: Calendar,      label: "Ver calendario",   variant: "ghost",   onClick: () => navigate("/eventos") },
          ].map(({ icon: Icon, label, variant, onClick }) => (
            <QuickBtn key={label} icon={Icon} label={label} variant={variant} onClick={onClick} />
          ))}
        </div>
      </section>

      {/* ── Courses + Tasks side by side ───────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)",
        gap: 20,
        marginBottom: 24,
      }}
        className="lg-grid-split"
      >
        {/* Courses */}
        <section>
          <SectionHeader
            title="Mis cursos"
            action={{ label: "Ver todos", onClick: () => navigate("/cursos") }}
          />
          {loading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 14,
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ background: "var(--color-surface)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  <div style={{ height: 5, background: "var(--color-border)" }} />
                  <div style={{ padding: 16 }}>
                    <Skeleton h={40} w={40} r={10} />
                    <div style={{ marginTop: 12 }}><Skeleton h={14} w="80%" r={5} /></div>
                    <div style={{ marginTop: 6 }}><Skeleton h={11} w="50%" r={4} /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <EmptyCard
              icon={<BookOpen style={{ width: 28, height: 28, color: "var(--color-text-muted)" }} />}
              text="No tienes cursos asignados aún"
              action={{ label: "Crear primer curso", onClick: () => navigate("/cursos") }}
            />
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 14,
            }}>
              {cursos.map((c, i) => (
                <CourseCard
                  key={c._id} curso={c} idx={i}
                  onClick={() => navigate(`/cursos/${c._id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Tasks */}
        <section>
          <SectionHeader
            title="Tareas activas"
            action={{ label: "Ver todas", onClick: () => navigate("/tareas") }}
          />
          <div style={{
            background: "var(--color-surface)", borderRadius: 16,
            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}>
            {loading ? (
              <div style={{ padding: 16 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <Skeleton h={13} w="75%" r={5} />
                    <div style={{ marginTop: 6 }}><Skeleton h={10} w="45%" r={4} /></div>
                  </div>
                ))}
              </div>
            ) : tareas.length === 0 ? (
              <div style={{ padding: "36px 24px", textAlign: "center" }}>
                <ClipboardList style={{ width: 24, height: 24, color: "var(--color-text-muted)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Sin tareas activas</p>
              </div>
            ) : (
              tareas.map((t) => <TaskItem key={t._id} tarea={t} />)
            )}
          </div>
        </section>
      </div>

      {/* ── Events today ───────────────────────────────── */}
      {!loading && eventos.length > 0 && (
        <section>
          <SectionHeader
            title="Eventos de hoy"
            action={{ label: "Ver calendario", onClick: () => navigate("/eventos") }}
          />
          <div style={{
            background: "var(--color-surface)", borderRadius: 16,
            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}>
            {eventos.map((ev) => <EventItem key={ev._id} evento={ev} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Quick action button ──────────────────────────────────────
function QuickBtn({ icon: Icon, label, variant, onClick }) {
  const [hov, setHov] = useState(false);

  const styles = {
    primary: {
      background: hov ? "#0A58A8" : "#0C6AC4",
      color: "white",
      border: "none",
      boxShadow: hov ? "var(--shadow-primary)" : "none",
    },
    outline: {
      background: hov ? "rgba(12,106,196,0.06)" : "var(--color-surface)",
      color: "#0C6AC4",
      border: "1.5px solid #0C6AC4",
    },
    ghost: {
      background: hov ? "var(--color-bg)" : "var(--color-surface)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
    },
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "8px 16px", borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        transition: "all 150ms",
        transform: hov ? "translateY(-1px)" : "none",
        ...styles[variant],
      }}
    >
      <Icon style={{ width: 15, height: 15 }} />
      {label}
    </button>
  );
}
