// src/features/dashboard/padre/pages/PadreHomePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, FileText, Calendar, Bell,
  ChevronRight, Users, Clock,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cursosGetMine, eventosGetHoy } from "@/lib/apiClient";
import { normalizeCurso } from "@/lib/normalizers";
import CursoCard from "@/features/cursos/components/CursoCard";
import { Button } from "@/components";

function Skeleton({ h = 16, w = "100%", r = 7 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

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
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <div>
        {loading ? (
          <>
            <Skeleton h={26} w={50} r={6} />
            <div style={{ marginTop: 6 }}><Skeleton h={12} w={90} r={4} /></div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", lineHeight: 1, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4 }}>{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

function EventItem({ evento }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Calendar style={{ width: 15, height: 15, color: "#0C6AC4" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {evento.titulo}
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock style={{ width: 10, height: 10 }} />
          {evento.hora ?? "Todo el día"}
        </p>
      </div>
    </div>
  );
}

// ✅ SectionHeader — usa Button variant="ghost"
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{title}</h2>
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} style={{ color: "#0C6AC4", gap: 4 }}>
          {action.label} <ChevronRight style={{ width: 14, height: 14 }} />
        </Button>
      )}
    </div>
  );
}

// ✅ QuickBtn — eliminado useState(hov), usa Button variant="custom"
function QuickBtn({ icon: Icon, label, desc, color, bg, onClick }) {
  return (
    <Button
      variant="custom"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderRadius: 12,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        textAlign: "left", width: "100%", height: "auto",
        justifyContent: "flex-start",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 17, height: 17, color }} />
      </div>
      <div style={{ textAlign: "left" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 1 }}>{desc}</p>
      </div>
    </Button>
  );
}

// ══════════════════════════════════════════════════════════════
export default function PadreHomePage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cursos,  setCursos]  = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cursosRes, eventosRes] = await Promise.all([
          cursosGetMine({ limit: 6 }),
          eventosGetHoy(),
        ]);
        setCursos((cursosRes.cursos    ?? []).map(normalizeCurso));
        setEventos(eventosRes.eventos ?? []);
      } catch { /* silencioso */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* Welcome banner */}
      <div style={{
        borderRadius: 18,
        background: "linear-gradient(135deg, #0C6AC4 0%, #1E3A6E 60%, #0F172A 100%)",
        padding: "24px 32px", display: "flex", alignItems: "center", gap: 20,
        marginBottom: 28, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ color: "white", position: "relative" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 6 }}>
            Padre / Tutor
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            {saludo}{user?.nombre ? `, ${user.nombre}` : ""}
          </h1>
        </div>
      </div>

      {/* Stats */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Resumen" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          <StatCard value={cursos.length}  label="Cursos activos"      icon={BookOpen} color="#0C6AC4" bg="rgba(12,106,196,0.10)" loading={loading} />
          <StatCard value={eventos.length} label="Eventos hoy"         icon={Calendar} color="#16A34A" bg="rgba(22,163,74,0.10)"  loading={loading} />
          <StatCard value="—"              label="Notificaciones"      icon={Bell}     color="#D97706" bg="rgba(217,119,6,0.10)"  loading={false} />
          <StatCard value="—"              label="Entregas pendientes" icon={FileText} color="#6366F1" bg="rgba(99,102,241,0.10)" loading={false} />
        </div>
      </section>

      {/* Quick actions */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="Acciones rápidas" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          <QuickBtn icon={Users}    label="Mis hijos"       desc="Ver perfiles familiares" color="#0C6AC4" bg="rgba(12,106,196,0.10)" onClick={() => navigate("/familia/perfiles")} />
          <QuickBtn icon={FileText} label="Ver entregas"    desc="Revisión de tareas"      color="#16A34A" bg="rgba(22,163,74,0.10)"  onClick={() => navigate("/familia/entregas")} />
          <QuickBtn icon={Bell}     label="Notificaciones"  desc="Avisos y mensajes"       color="#D97706" bg="rgba(217,119,6,0.10)"  onClick={() => navigate("/notificaciones")} />
        </div>
      </section>

      {/* Courses */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader
          title="Cursos de mis hijos"
          action={{ label: "Ver perfiles", onClick: () => navigate("/familia/perfiles") }}
        />
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ background: "var(--color-surface)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <div style={{ height: 4, background: "var(--color-border)" }} />
                <div style={{ padding: 16 }}>
                  <Skeleton h={40} w={40} r={10} />
                  <div style={{ marginTop: 12 }}><Skeleton h={14} w="80%" r={5} /></div>
                  <div style={{ marginTop: 6 }}><Skeleton h={11} w="50%" r={4} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : cursos.length === 0 ? (
          <div style={{
            background: "var(--color-surface)", borderRadius: 16,
            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
            padding: "44px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <BookOpen style={{ width: 28, height: 28, color: "var(--color-text-muted)" }} />
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
              Aún no estás inscrito en ningún curso
            </p>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0, opacity: 0.7 }}>
              Contacta al docente o administrador para que te agreguen.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {cursos.map((c, i) => (
              <CursoCard key={c._id} curso={c} role="padre" idx={i} showCover={true} coverSrc={c.fotoPortada || null} />
            ))}
          </div>
        )}
      </section>

      {/* Events today */}
      {!loading && eventos.length > 0 && (
        <section>
          <SectionHeader
            title="Eventos de hoy"
            action={{ label: "Ver calendario", onClick: () => navigate("/familia/calendario") }}
          />
          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            {eventos.map((ev) => <EventItem key={ev._id} evento={ev} />)}
          </div>
        </section>
      )}
    </div>
  );
}