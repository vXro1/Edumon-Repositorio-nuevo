// src/features/cursos/components/calendario/CalendarioTab.jsx
// ─────────────────────────────────────────────────────────────────────────────
// NUEVO MÓDULO — Vista de calendario LMS con tareas/eventos del curso
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { tareasGetAll } from "@/lib/apiClient";
import { Sk } from "../shared/ui";
import { fmt, fmtHour, esPasada } from "../shared/helpers";

// ─── Utilidades de calendario ──────────────────────────────────────────────
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function startOfMonth(y, m) { return new Date(y, m, 1); }
function daysInMonth(y, m)   { return new Date(y, m + 1, 0).getDate(); }
function isSameDay(a, b)     { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function buildGrid(year, month) {
  const first   = startOfMonth(year, month).getDay(); // day of week of 1st
  const days    = daysInMonth(year, month);
  const cells   = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Helpers de colores por urgencia ──────────────────────────────────────
function urgencyColor(fecha) {
  if (!fecha) return "#6366f1";
  const diff = (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0)  return "#ef4444"; // vencida
  if (diff <= 1) return "#f97316"; // urgente (<24h)
  if (diff <= 3) return "#eab308"; // próxima
  return "#22c55e";                // holgada
}

function urgencyLabel(fecha) {
  if (!fecha) return "";
  const diff = (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0)  return "Vencida";
  if (diff <= 1) return "Hoy / mañana";
  if (diff <= 3) return "Esta semana";
  return "Próximamente";
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function CalendarioTab({ cursoId }) {
  const now = new Date();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [tareas, setTareas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // Date | null

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tareasGetAll({ cursoId });
      const lista = (res.tareas ?? res.data ?? res ?? [])
        .filter((t) => t.fechaEntrega || t.fechaVencimiento);
      setTareas(lista);
    } catch { setTareas([]); }
    finally { setLoading(false); }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); setSelected(null); };
  const nextMonth = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); setSelected(null); };

  // Índice: fecha ISO → tareas
  const byDay = {};
  tareas.forEach((t) => {
    const f = t.fechaEntrega ?? t.fechaVencimiento;
    if (!f) return;
    const d = new Date(f);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(t);
  });

  const grid = buildGrid(year, month);

  const tareasDelDia = selected
    ? (byDay[`${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`] ?? [])
    : [];

  // Próximas entregas (todo el mes actual o seleccionado)
  const proximasGeneral = tareas
    .filter((t) => {
      const f = new Date(t.fechaEntrega ?? t.fechaVencimiento);
      return f.getFullYear() === year && f.getMonth() === month;
    })
    .sort((a, b) => new Date(a.fechaEntrega ?? a.fechaVencimiento) - new Date(b.fechaEntrega ?? b.fechaVencimiento));

  const today = new Date();

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* ── Panel izquierdo: calendario ──────────────────────────────────── */}
      <div style={{ flex: "0 0 340px", background: "var(--color-surface)", borderRadius: 16,
        border: "1px solid var(--color-border)", overflow: "hidden" }}>

        {/* Nav de mes */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderBottom: "1px solid var(--color-border)" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer",
            padding: 6, borderRadius: 8, color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)" }}>
            {MESES[month]} {year}
          </span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer",
            padding: 6, borderRadius: 8, color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Cabecera días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 8px 0" }}>
          {DIAS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700,
              color: "var(--color-text-muted)", paddingBottom: 4, letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>

        {/* Grid de días */}
        {loading ? (
          <div style={{ padding: 16 }}><Sk h={200} r={8} /></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, padding: "0 8px 12px" }}>
            {grid.map((day, i) => {
              if (!day) return <div key={i} />;
              const key   = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const items = byDay[key] ?? [];
              const isToday  = isSameDay(day, today);
              const isSel    = selected && isSameDay(day, selected);
              const hasItems = items.length > 0;

              return (
                <button key={i} onClick={() => setSelected(isSel ? null : day)}
                  style={{
                    position: "relative", background: isSel ? "var(--color-primary)" : isToday ? "var(--color-primary-light)" : "transparent",
                    border: isToday ? "1.5px solid var(--color-primary)" : "1.5px solid transparent",
                    borderRadius: 9, padding: "6px 0", cursor: "pointer", textAlign: "center",
                    transition: "all 120ms",
                  }}>
                  <span style={{ fontSize: 13, fontWeight: isToday || isSel ? 800 : 500,
                    color: isSel ? "white" : isToday ? "var(--color-primary)" : "var(--color-text)" }}>
                    {day.getDate()}
                  </span>

                  {/* Dots de eventos */}
                  {hasItems && (
                    <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 2 }}>
                      {items.slice(0, 3).map((t, ti) => (
                        <div key={ti} style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: isSel ? "rgba(255,255,255,0.8)" : urgencyColor(t.fechaEntrega ?? t.fechaVencimiento),
                        }} />
                      ))}
                      {items.length > 3 && (
                        <span style={{ fontSize: 7, color: isSel ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)" }}>+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Leyenda */}
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--color-border)",
          display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { color: "#ef4444", label: "Vencida" },
            { color: "#f97316", label: "Urgente" },
            { color: "#eab308", label: "Esta semana" },
            { color: "#22c55e", label: "Próxima" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 10.5, color: "var(--color-text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho: detalle ─────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Detalle del día seleccionado */}
        {selected && (
          <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 8 }}>
              <Clock style={{ width: 15, height: 15, color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
                {selected.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            {tareasDelDia.length === 0 ? (
              <p style={{ padding: "20px 16px", fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                ✅ Sin entregas en este día.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {tareasDelDia.map((t, i) => {
                  const fecha   = t.fechaEntrega ?? t.fechaVencimiento;
                  const vencida = esPasada(fecha);
                  const color   = urgencyColor(fecha);
                  return (
                    <div key={t._id} style={{
                      padding: "12px 16px", borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                      display: "flex", alignItems: "flex-start", gap: 12,
                    }}>
                      <div style={{ width: 4, borderRadius: 2, background: color, alignSelf: "stretch", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{t.titulo}</p>
                        {t.descripcion && (
                          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-text-muted)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.descripcion}
                          </p>
                        )}
                        <p style={{ margin: "5px 0 0", fontSize: 11.5, color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          {vencida
                            ? <AlertCircle style={{ width: 11, height: 11 }} />
                            : <Clock style={{ width: 11, height: 11 }} />}
                          {vencida ? "Vencida" : `Vence a las ${fmtHour(fecha)}`}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99,
                        background: `${color}20`, color, fontWeight: 600, flexShrink: 0 }}>
                        {urgencyLabel(fecha)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lista del mes completo */}
        <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 style={{ width: 15, height: 15, color: "var(--color-primary)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
              Entregas de {MESES[month]}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>
              {proximasGeneral.length} tarea{proximasGeneral.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 16 }}><Sk h={80} r={8} /></div>
          ) : proximasGeneral.length === 0 ? (
            <p style={{ padding: "20px 16px", fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
              Sin entregas programadas este mes.
            </p>
          ) : (
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {proximasGeneral.map((t, i) => {
                const fecha   = t.fechaEntrega ?? t.fechaVencimiento;
                const vencida = esPasada(fecha);
                const color   = urgencyColor(fecha);
                const d       = new Date(fecha);
                const isSelDay = selected && isSameDay(d, selected);

                return (
                  <div key={t._id}
                    onClick={() => setSelected(isSelDay ? null : d)}
                    style={{
                      padding: "11px 16px", cursor: "pointer",
                      borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                      background: isSelDay ? "var(--color-primary-light)" : "transparent",
                      display: "flex", alignItems: "center", gap: 12, transition: "background 120ms",
                    }}>
                    {/* Fecha badge */}
                    <div style={{ flexShrink: 0, textAlign: "center", width: 36 }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1,
                        color: isSelDay ? "var(--color-primary)" : "var(--color-text)" }}>{d.getDate()}</p>
                      <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        {DIAS[d.getDay()]}
                      </p>
                    </div>

                    <div style={{ width: 3, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.titulo}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                        {vencida ? <AlertCircle style={{ width: 10, height: 10 }} /> : <Clock style={{ width: 10, height: 10 }} />}
                        {vencida ? "Vencida" : fmtHour(fecha)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}