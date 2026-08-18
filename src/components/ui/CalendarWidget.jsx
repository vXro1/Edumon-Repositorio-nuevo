// src/components/ui/CalendarWidget.jsx
// Componente de calendario reutilizable — misma visual para todos los roles.
// Gestiona navegación de mes, selección de día y modal de detalle internamente.
// Recibe items ya cargados; la lógica de fetch y CRUD queda en el padre.
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin,
  BookOpen, AlertCircle, ClipboardList, Users, School,
  Plus, RefreshCw, Pencil, Trash2, CheckCircle2,
} from "lucide-react";
import { Modal, Button, Badge } from "@/components";
import { fmt, fmtHour, esPasada } from "@/features/cursos/components/shared/helpers";

// ─── Constantes ────────────────────────────────────────────────────────────
const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const CATEGORIA_LABEL = {
  escuela_padres: "Escuela de padres",
  tarea:          "Tarea",
  institucional:  "Institucional",
};
const CATEGORIA_COLOR = {
  escuela_padres: "#2196F3",
  tarea:          "#9C27B0",
  institucional:  "#00BCD4",
};

// ─── Utilidades ────────────────────────────────────────────────────────────
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

function buildGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function urgency(fecha) {
  if (!fecha) return { variant: "info", color: "#6366f1", label: "Próxima" };
  const diff = (new Date(fecha) - new Date()) / 864e5;
  if (diff < 0)  return { variant: "error",   color: "var(--color-error)", label: "Vencida"    };
  if (diff <= 1) return { variant: "warning",  color: "#f97316", label: "Urgente"    };
  if (diff <= 3) return { variant: "warning",  color: "#eab308", label: "Esta semana"};
  return           { variant: "success",  color: "#22c55e", label: "Próxima"    };
}

export function itemColor(item) {
  if (item.tipo === "tarea") return urgency(item.fecha).color;
  return CATEGORIA_COLOR[item.categoria] ?? "#607D8B";
}

function itemBadgeVariant(item) {
  if (item.tipo === "tarea") return urgency(item.fecha).variant;
  return "info";
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function Sk({ h = 16, w = "100%", r = 6 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

// ─── Ícono por tipo / categoría ────────────────────────────────────────────
function TipoIcon({ item, size = 14 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  if (item.tipo === "tarea") return <ClipboardList style={s} />;
  if (item.categoria === "escuela_padres") return <Users style={s} />;
  if (item.categoria === "institucional")  return <School style={s} />;
  return <CalendarDays style={s} />;
}

// ─── Fila de item en panel lateral ─────────────────────────────────────────
function ItemRow({ item, idx, onClick }) {
  const color   = itemColor(item);
  const vencida = item.tipo === "tarea" && esPasada(item.fecha);

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", border: "none", background: "transparent",
        cursor: "pointer", padding: "12px 16px", textAlign: "left",
        borderTop: idx > 0 ? "1px solid var(--color-border)" : "none",
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: "background 120ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        width: 4, borderRadius: 2, background: color,
        alignSelf: "stretch", flexShrink: 0,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TipoIcon item={item} size={13} />
          <p style={{
            margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--color-text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.titulo}
          </p>
        </div>

        {item.tipo === "tarea" && (
          <p style={{
            margin: "4px 0 0", fontSize: 11.5, color, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {vencida ? <AlertCircle size={11} /> : <Clock size={11} />}
            {vencida ? "Vencida" : `Vence a las ${fmtHour(item.fecha)}`}
          </p>
        )}

        {item.tipo === "evento" && item.hora && (
          <p style={{
            margin: "4px 0 0", fontSize: 11.5, color: "var(--color-text-muted)",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Clock size={11} /> {item.hora}
            {item.ubicacion && <> · <MapPin size={11} /> {item.ubicacion}</>}
          </p>
        )}

        {item.tipo === "evento" && item.cursoNombre && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
            {item.cursoNombre}
          </p>
        )}
      </div>

      <Badge variant={itemBadgeVariant(item)} size="sm" style={{ flexShrink: 0, marginTop: 2 }}>
        {item.tipo === "tarea" ? "Tarea" : "Evento"}
      </Badge>
    </button>
  );
}

// ─── Modal de detalle ──────────────────────────────────────────────────────
function DetalleModal({ item, onClose, canManage, onEdit, onDelete, deleting }) {
  if (!item) return null;
  const esTarea = item.tipo === "tarea";
  const color   = itemColor(item);
  const urg     = esTarea ? urgency(item.fecha) : { variant: "info", label: "" };
  const vencida = esTarea && esPasada(item.fecha);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title={item.titulo}
      description={
        esTarea
          ? `Tarea · ${item.modulo ?? item.cursoNombre ?? "Sin módulo"}`
          : `Evento · ${CATEGORIA_LABEL[item.categoria] ?? item.categoria ?? "Evento"}`
      }
    >
      {/* Franja de color */}
      <div style={{ height: 4, background: color, borderRadius: 4, marginBottom: 20, marginTop: -4 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge variant={urg.variant} size="sm">
            {esTarea
              ? (vencida ? "Vencida" : urg.label)
              : (CATEGORIA_LABEL[item.categoria] ?? "Evento")}
          </Badge>
          {item.estado && (
            <Badge variant="neutral" size="sm">{item.estado}</Badge>
          )}
        </div>

        {/* Descripción */}
        {item.descripcion && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--color-text)", lineHeight: 1.6 }}>
            {item.descripcion}
          </p>
        )}

        {/* Detalles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <InfoRow icon={<CalendarDays size={14} />} label="Fecha">
            {esTarea
              ? fmt(item.fecha)
              : `${fmt(item.fechaInicio ?? item.fecha)}${
                  item.fechaFin && item.fechaFin !== item.fechaInicio
                    ? ` → ${fmt(item.fechaFin)}`
                    : ""
                }`}
          </InfoRow>

          {(item.hora || (esTarea && item.fecha)) && (
            <InfoRow icon={<Clock size={14} />} label="Hora">
              {item.hora ?? fmtHour(item.fecha)}
            </InfoRow>
          )}

          {item.ubicacion && (
            <InfoRow icon={<MapPin size={14} />} label="Ubicación">
              {item.ubicacion}
            </InfoRow>
          )}

          {esTarea && item.modulo && (
            <InfoRow icon={<BookOpen size={14} />} label="Módulo">
              {item.modulo}
            </InfoRow>
          )}

          {esTarea && item.tipoEntrega && (
            <InfoRow icon={<ClipboardList size={14} />} label="Tipo de entrega">
              {item.tipoEntrega}
            </InfoRow>
          )}

          {item.cursoNombre && (
            <InfoRow icon={<BookOpen size={14} />} label="Curso">
              {item.cursoNombre}
            </InfoRow>
          )}

          {!esTarea && item.cursosNombres?.length > 0 && (
            <InfoRow icon={<BookOpen size={14} />} label="Cursos">
              {item.cursosNombres.join(", ")}
            </InfoRow>
          )}
        </div>

        {/* Acciones — solo para eventos y solo si canManage */}
        {canManage && !esTarea && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Pencil size={13} /> Editar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(item._id ?? item.id)}
              disabled={deleting}
            >
              <Trash2 size={13} />
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5 }}>
      <span style={{ color: "var(--color-text-muted)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: 700, color: "var(--color-text-muted)", minWidth: 100, flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{ color: "var(--color-text)", wordBreak: "break-word" }}>{children}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CALENDAR WIDGET — componente principal exportado
//
// Props:
//   items[]      — [{id,tipo,titulo,fecha,fechaInicio,fechaFin,hora,ubicacion,
//                    categoria,estado,modulo,tipoEntrega,color,cursoNombre,
//                    cursosNombres[]}]
//   loading      — boolean
//   stats        — { totalTareas, totalEventos, tareasVencidas, eventosProximos }
//   canManage    — boolean: muestra botón "Nuevo evento" y acciones en modal
//   onRefresh    — () => void  (opcional)
//   onCreateEvent — () => void (opcional, requerido si canManage)
//   onEditEvent  — (item) => void
//   onDeleteEvent — (id) => Promise<void>
//   title        — string (por defecto "Calendario")
// ══════════════════════════════════════════════════════════════════════════
export default function CalendarWidget({
  items       = [],
  loading     = false,
  stats       = null,
  canManage   = false,
  onRefresh,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  title       = "Calendario",
}) {
  const now = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  const prevMonth = () => {
    setSelected(null);
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelected(null);
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Filtramos items del mes actual para la lista lateral
  const itemsDelMes = items.filter(item => {
    const d = new Date(item.fecha);
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // Índice día → items
  const byDay = {};
  itemsDelMes.forEach(item => {
    const d   = new Date(item.fecha);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (byDay[key] ??= []).push(item);
  });

  const selKey      = selected
    ? `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`
    : null;
  const itemsDelDia = selKey ? (byDay[selKey] ?? []) : [];

  const grid  = buildGrid(year, month);
  const today = new Date();

  const handleDelete = async (id) => {
    if (!onDeleteEvent) return;
    setDeleting(true);
    try {
      await onDeleteEvent(id);
      setDetail(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (item) => {
    setDetail(null);
    onEditEvent?.(item);
  };

  return (
    <div>
      {/* ── Barra superior ──────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, gap: 12, flexWrap: "wrap",
      }}>
        {/* Stats chips */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {stats && [
            { label: "Tareas",   val: stats.totalTareas,     color: "#6366f1" },
            { label: "Eventos",  val: stats.totalEventos,    color: "var(--color-primary)" },
            { label: "Vencidas", val: stats.tareasVencidas,  color: "var(--color-error)" },
            { label: "Próximos", val: stats.eventosProximos, color: "#22c55e" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              padding: "5px 12px", borderRadius: 10,
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>{val}</span>
              <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 8 }}>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw size={13} /> Actualizar
            </Button>
          )}
          {canManage && onCreateEvent && (
            <Button size="sm" onClick={onCreateEvent}>
              <Plus size={14} /> Nuevo evento
            </Button>
          )}
        </div>
      </div>

      {/* ── Layout de dos columnas ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* ── CALENDARIO ────────────────────────────────────────────── */}
        <div style={{
          flex: "0 0 340px", minWidth: 280,
          background: "var(--color-surface)",
          borderRadius: 16, border: "1px solid var(--color-border)",
          overflow: "hidden", boxShadow: "var(--shadow-card)",
        }}>
          {/* Navegación de mes */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
          }}>
            <button
              onClick={prevMonth}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 6, borderRadius: 8, color: "var(--color-text-muted)",
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--color-text)" }}>
              {MESES[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 6, borderRadius: 8, color: "var(--color-text-muted)",
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Cabecera de días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 10px 2px" }}>
            {DIAS.map(d => (
              <div key={d} style={{
                textAlign: "center", fontSize: 10, fontWeight: 800,
                color: "var(--color-text-muted)", paddingBottom: 4, letterSpacing: "0.06em",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          {loading ? (
            <div style={{ padding: "12px 10px" }}><Sk h={200} r={8} /></div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7,1fr)",
              gap: 2, padding: "0 10px 12px",
            }}>
              {grid.map((day, i) => {
                if (!day) return <div key={i} />;
                const key      = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayItems = byDay[key] ?? [];
                const isToday  = isSameDay(day, today);
                const isSel    = selected && isSameDay(day, selected);

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(isSel ? null : day)}
                    style={{
                      position: "relative",
                      background: isSel
                        ? "var(--color-primary)"
                        : isToday
                          ? "rgba(12,106,196,0.10)"
                          : "transparent",
                      border: `1.5px solid ${
                        isSel    ? "var(--color-primary)"
                        : isToday ? "var(--color-primary)"
                        : "transparent"
                      }`,
                      borderRadius: 9, padding: "6px 0",
                      cursor: "pointer", textAlign: "center",
                      transition: "all 120ms",
                    }}
                  >
                    <span style={{
                      fontSize: 13,
                      fontWeight: isToday || isSel ? 800 : 400,
                      color: isSel ? "#fff" : isToday ? "var(--color-primary)" : "var(--color-text)",
                    }}>
                      {day.getDate()}
                    </span>

                    {dayItems.length > 0 && (
                      <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 2 }}>
                        {dayItems.slice(0, 3).map((item, ti) => (
                          <div key={ti} style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: isSel ? "rgba(255,255,255,0.85)" : itemColor(item),
                          }} />
                        ))}
                        {dayItems.length > 3 && (
                          <span style={{
                            fontSize: 7,
                            color: isSel ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)",
                          }}>
                            +
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div style={{
            padding: "10px 14px 14px", borderTop: "1px solid var(--color-border)",
            display: "flex", gap: 10, flexWrap: "wrap",
          }}>
            {[
              { color: "var(--color-error)", label: "Vencida"  },
              { color: "#f97316", label: "Urgente"  },
              { color: "#22c55e", label: "Próxima"  },
              { color: "#2196F3", label: "Evento"   },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL DERECHO ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Detalle del día seleccionado */}
          {selected && (
            <div style={{
              background: "var(--color-surface)", borderRadius: 14,
              border: "1px solid var(--color-border)", overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarDays size={15} style={{ color: "var(--color-primary)" }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
                    {selected.toLocaleDateString("es-CO", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </span>
                </div>
                <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", fontWeight: 600 }}>
                  {itemsDelDia.length} item{itemsDelDia.length !== 1 ? "s" : ""}
                </span>
              </div>

              {itemsDelDia.length === 0 ? (
                <p style={{ padding: "20px 16px", fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                  Sin actividades en este día.
                </p>
              ) : (
                <div>
                  {itemsDelDia.map((item, i) => (
                    <ItemRow
                      key={item._id ?? item.id ?? i}
                      item={item}
                      idx={i}
                      onClick={() => setDetail(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista del mes completo */}
          <div style={{
            background: "var(--color-surface)", borderRadius: 14,
            border: "1px solid var(--color-border)", overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
              background: "var(--color-bg)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <CheckCircle2 size={15} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
                {title} — {MESES[month]} {year}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>
                {itemsDelMes.length} actividad{itemsDelMes.length !== 1 ? "es" : ""}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {[0, 1, 2].map(i => <Sk key={i} h={52} r={8} />)}
              </div>
            ) : itemsDelMes.length === 0 ? (
              <p style={{ padding: "28px 16px", fontSize: 13, color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>
                Sin actividades programadas este mes.
              </p>
            ) : (
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {itemsDelMes.map((item, i) => {
                  const d     = new Date(item.fecha);
                  const isSel = selected && isSameDay(d, selected);

                  return (
                    <div
                      key={item._id ?? item.id ?? i}
                      onClick={() => { setSelected(isSel ? null : d); setDetail(item); }}
                      style={{
                        padding: "11px 16px", cursor: "pointer",
                        borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                        background: isSel ? "rgba(12,106,196,0.05)" : "transparent",
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "background 120ms",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSel ? "rgba(12,106,196,0.05)" : "transparent"; }}
                    >
                      {/* Mini fecha */}
                      <div style={{ flexShrink: 0, textAlign: "center", width: 36 }}>
                        <p style={{
                          margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1,
                          color: isSel ? "var(--color-primary)" : "var(--color-text)",
                        }}>
                          {d.getDate()}
                        </p>
                        <p style={{
                          margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                          color: "var(--color-text-muted)",
                        }}>
                          {DIAS[d.getDay()]}
                        </p>
                      </div>

                      {/* Acento lateral */}
                      <div style={{ width: 3, height: 40, borderRadius: 2, background: itemColor(item), flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <TipoIcon item={item} size={12} />
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {item.titulo}
                          </p>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
                          {item.tipo === "tarea"
                            ? (item.modulo ?? item.cursoNombre ?? "Sin módulo")
                            : (CATEGORIA_LABEL[item.categoria] ?? "Evento")}
                          {item.hora && <> · {item.hora}</>}
                        </p>
                      </div>

                      <Badge variant={itemBadgeVariant(item)} size="sm" style={{ flexShrink: 0 }}>
                        {item.tipo === "tarea" ? "Tarea" : "Evento"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de detalle ──────────────────────────────────────────── */}
      {detail && (
        <DetalleModal
          item={detail}
          onClose={() => setDetail(null)}
          canManage={canManage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
