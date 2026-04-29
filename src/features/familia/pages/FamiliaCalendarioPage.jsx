// src/features/familia/pages/FamiliaCalendarioPage.jsx
// ROL: Padre / Tutor — Calendario familiar (solo lectura)
import { useState, useEffect } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  FileText, AlertCircle, BookOpen,
} from "lucide-react";
import { cursosGetMine, calendarioGetByCurso, eventosGetHoy } from "@/lib/apiClient";

const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const TIPO_META = {
  tarea:  { color: "#6366F1", bg: "rgba(99,102,241,0.12)", label: "Tarea" },
  evento: { color: "#0C6AC4", bg: "rgba(12,106,196,0.12)", label: "Evento" },
};

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function buildCalendarDays(year, month) {
  const first   = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay(); // 0=domingo
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) days.push(d);
  return days;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth()    === d2.getMonth() &&
    d1.getDate()     === d2.getDate()
  );
}

function EventDot({ color }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: "50%",
      background: color, flexShrink: 0, display: "inline-block",
    }} />
  );
}

// ── Calendar grid ─────────────────────────────────────────────
function CalGrid({ year, month, events, selected, onSelect }) {
  const days = buildCalendarDays(year, month);
  const today = new Date();

  const eventsOnDay = (d) => {
    if (!d) return [];
    const date = new Date(year, month, d);
    return events.filter(ev => {
      const evDate = new Date(ev.fecha ?? ev.fechaEntrega ?? ev.fechaInicio ?? ev.creadoEn);
      return isSameDay(evDate, date);
    });
  };

  return (
    <div>
      {/* Weekday headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4,
      }}>
        {DIAS.map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: 11.5, fontWeight: 700,
            color: "var(--color-text-muted)", padding: "4px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {days.map((d, i) => {
          const evs = eventsOnDay(d);
          const isToday = d && isSameDay(new Date(year, month, d), today);
          const isSel = d && selected && isSameDay(new Date(year, month, d), selected);

          return (
            <div
              key={i}
              onClick={() => d && onSelect(new Date(year, month, d))}
              style={{
                minHeight: 52, borderRadius: 8, padding: "4px 5px",
                cursor: d ? "pointer" : "default",
                background: isSel
                  ? "#0C6AC4"
                  : isToday
                  ? "rgba(12,106,196,0.08)"
                  : "transparent",
                border: isToday && !isSel ? "1.5px solid rgba(12,106,196,0.25)" : "1.5px solid transparent",
                transition: "background 150ms",
              }}
              onMouseEnter={e => {
                if (!isSel && d) e.currentTarget.style.background = "var(--color-bg)";
              }}
              onMouseLeave={e => {
                if (!isSel && d) e.currentTarget.style.background = isToday ? "rgba(12,106,196,0.08)" : "transparent";
              }}
            >
              {d && (
                <>
                  <p style={{
                    fontSize: 13, fontWeight: isToday || isSel ? 800 : 500,
                    color: isSel ? "white" : isToday ? "#0C6AC4" : "var(--color-text)",
                    margin: 0, textAlign: "center",
                  }}>
                    {d}
                  </p>
                  {/* Event dots */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4, flexWrap: "wrap" }}>
                    {evs.slice(0, 3).map((ev, j) => (
                      <EventDot key={j} color={isSel ? "rgba(255,255,255,0.8)" : (TIPO_META[ev.tipo]?.color ?? "#6B7280")} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaCalendarioPage() {
  const today = new Date();
  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [selected, setSelected] = useState(today);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(false);

  const load = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const cursosRes = await cursosGetMine({ limit: 50 });
      const cursos = cursosRes?.cursos ?? [];

      const allEvents = [];
      await Promise.all(cursos.map(async (c) => {
        try {
          const calRes = await calendarioGetByCurso(c._id, { limit: 100 });
          const entries = calRes?.eventos ?? calRes?.items ?? calRes?.data ?? [];
          entries.forEach(ev => {
            if (ev) allEvents.push({ ...ev, cursNombre: c.nombre ?? "N/A" });
          });
        } catch { /* foro sin calendario, silencioso */ }
      }));

      setEvents(allEvents);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Events on selected day
  const selectedEvents = events.filter(ev => {
    const d = new Date(ev.fecha ?? ev.fechaEntrega ?? ev.fechaInicio ?? ev.creadoEn);
    return isSameDay(d, selected);
  });

  // Upcoming events (next 7 days, after selected)
  const upcoming = events
    .filter(ev => {
      const d = new Date(ev.fecha ?? ev.fechaEntrega ?? ev.fechaInicio);
      return d >= today;
    })
    .sort((a, b) => {
      const da = new Date(a.fecha ?? a.fechaEntrega ?? a.fechaInicio);
      const db = new Date(b.fecha ?? b.fechaEntrega ?? b.fechaInicio);
      return da - db;
    })
    .slice(0, 10);

  if (apiError) return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{
        background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
        borderRadius: 14, padding: "60px 24px", marginTop: 24,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
      }}>
        <AlertCircle style={{ width: 36, height: 36, color: "#DC2626" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
          No se pudo cargar el calendario
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Intenta de nuevo más tarde.</p>
        <button onClick={load} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Reintentar</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(22,163,74,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Calendar style={{ width: 18, height: 18, color: "#16A34A" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Calendario familiar</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            Tareas y eventos de tus cursos
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* Calendar */}
        <div>
          <div style={{
            background: "var(--color-surface)", borderRadius: 18,
            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
            padding: 20,
          }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button
                onClick={prevMonth}
                style={{ background: "none", border: "1.5px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex" }}
              >
                <ChevronLeft style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
              </button>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                {MESES[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                style={{ background: "none", border: "1.5px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex" }}
              >
                <ChevronRight style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array(35).fill(0).map((_, i) => <Sk key={i} h={52} r={8} />)}
              </div>
            ) : (
              <CalGrid
                year={year} month={month} events={events}
                selected={selected} onSelect={setSelected}
              />
            )}
          </div>

          {/* Events on selected day */}
          <div style={{
            background: "var(--color-surface)", borderRadius: 16,
            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
            marginTop: 16, overflow: "hidden",
          }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                {selected.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            {selectedEvents.length === 0 ? (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                Sin eventos este día
              </div>
            ) : (
              selectedEvents.map((ev, i) => {
                const meta = TIPO_META[ev.tipo] ?? TIPO_META.evento;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 18px", borderBottom: "1px solid var(--color-border)",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: meta.color, flexShrink: 0,
                    }} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                        {ev.titulo ?? ev.nombre}
                      </p>
                      {ev.cursNombre && (
                        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                          {ev.cursNombre}
                        </p>
                      )}
                    </div>
                    <span style={{
                      marginLeft: "auto",
                      fontSize: 11, fontWeight: 700, color: meta.color,
                      background: meta.bg, borderRadius: 99, padding: "2px 8px",
                    }}>
                      {meta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div style={{
          background: "var(--color-surface)", borderRadius: 18,
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
          overflow: "hidden", position: "sticky", top: 24,
        }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
              Próximos vencimientos
            </p>
          </div>
          {loading ? (
            <div style={{ padding: 16 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <Sk h={13} w="70%" />
                  <div style={{ marginTop: 6 }}><Sk h={10} w="40%" /></div>
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
              No hay próximos eventos
            </div>
          ) : (
            upcoming.map((ev, i) => {
              const meta = TIPO_META[ev.tipo] ?? TIPO_META.evento;
              const fecha = new Date(ev.fecha ?? ev.fechaEntrega ?? ev.fechaInicio);
              return (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "12px 18px",
                  borderBottom: "1px solid var(--color-border)",
                  cursor: "pointer",
                }}
                onClick={() => { setYear(fecha.getFullYear()); setMonth(fecha.getMonth()); setSelected(fecha); }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: meta.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {ev.tipo === "tarea"
                      ? <FileText style={{ width: 15, height: 15, color: meta.color }} />
                      : <Calendar style={{ width: 15, height: 15, color: meta.color }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: "var(--color-text)",
                      margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.titulo ?? ev.nombre}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <Clock style={{ width: 10, height: 10, color: "var(--color-text-muted)" }} />
                      <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
                        {fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}