import { useState, useEffect } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  FileText, AlertCircle, BookOpen,
} from "lucide-react";

import { cursosGetMine, calendarioGetByCurso, eventosGetHoy } from "@/lib/apiClient";

import { Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

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
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "var(--color-border)",
      }}
    />
  );
}

/* ================= CALENDARIO ================= */

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay();

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) days.push(d);
  return days;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function EventDot({ color }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function CalGrid({ year, month, events, selected, onSelect }) {
  const days = buildCalendarDays(year, month);
  const today = new Date();

  const eventsOnDay = (d) => {
    if (!d) return [];
    const date = new Date(year, month, d);

    return events.filter((ev) => {
      const evDate = new Date(
        ev.fecha ?? ev.fechaEntrega ?? ev.fechaInicio ?? ev.creadoEn
      );
      return isSameDay(evDate, date);
    });
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 4,
        }}
      >
        {DIAS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--color-text-muted)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {days.map((d, i) => {
          const evs = eventsOnDay(d);
          const isToday =
            d && isSameDay(new Date(year, month, d), today);

          const isSel =
            d && selected && isSameDay(new Date(year, month, d), selected);

          return (
            <div
              key={i}
              onClick={() => d && onSelect(new Date(year, month, d))}
              style={{
                minHeight: 52,
                borderRadius: 8,
                padding: "4px 5px",
                cursor: d ? "pointer" : "default",
                background: isSel
                  ? "#0C6AC4"
                  : isToday
                  ? "rgba(12,106,196,0.08)"
                  : "transparent",
                border:
                  isToday && !isSel
                    ? "1.5px solid rgba(12,106,196,0.25)"
                    : "1.5px solid transparent",
              }}
            >
              {d && (
                <>
                  <p style={{ textAlign: "center", fontWeight: 600 }}>{d}</p>

                  <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    {evs.slice(0, 3).map((ev, j) => (
                      <EventDot
                        key={j}
                        color={
                          isSel
                            ? "rgba(255,255,255,0.8)"
                            : TIPO_META[ev.tipo]?.color ?? "#6B7280"
                        }
                      />
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

/* ================= PAGE ================= */

export default function FamiliaCalendarioPage() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const load = async () => {
    setLoading(true);
    setApiError(false);

    try {
      const cursosRes = await cursosGetMine({ limit: 50 });
      const cursos = cursosRes?.cursos ?? [];

      const allEvents = [];

      await Promise.all(
        cursos.map(async (c) => {
          try {
            const calRes = await calendarioGetByCurso(c._id, { limit: 100 });
            const entries =
              calRes?.eventos ?? calRes?.items ?? calRes?.data ?? [];

            entries.forEach((ev) => {
              if (ev) allEvents.push({ ...ev, cursNombre: c.nombre ?? "N/A" });
            });
          } catch {}
        })
      );

      setEvents(allEvents);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  if (apiError)
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Button onClick={load} variant="primary">
          Reintentar
        </Button>
      </div>
    );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div>
          <Calendar style={{ width: 18, height: 18, color: "#16A34A" }} />
        </div>

        <div>
          <h1>Calendario familiar</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* CALENDAR */}
        <div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <IconBtn color="var(--color-text-muted)" onClick={prevMonth}>
                <ChevronLeft size={15} />
              </IconBtn>

              <h2>{MESES[month]} {year}</h2>

              <IconBtn color="var(--color-text-muted)" onClick={nextMonth}>
                <ChevronRight size={15} />
              </IconBtn>
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <CalGrid
                year={year}
                month={month}
                events={events}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}