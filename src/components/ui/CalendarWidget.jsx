// calendario reutilizable — misma visual para todos los roles. Recibe items ya
// cargados; la lógica de fetch y CRUD queda en el padre.
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin,
  BookOpen, AlertCircle, ClipboardList, Users, School,
  Plus, RefreshCw, Pencil, Trash2, CheckCircle2, MousePointerClick,
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
  tarea:          "Reto",
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
      title="Ver detalles"
      style={{
        width: "100%", border: "none", background: "transparent",
        cursor: "pointer", padding: "14px 16px", textAlign: "left",
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

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 2,
          fontSize: 11, fontWeight: 700, color: "var(--color-primary)",
          whiteSpace: "nowrap",
        }}>
          Ver más
          <ChevronRight size={13} style={{ flexShrink: 0 }} />
        </span>
        <Badge variant={itemBadgeVariant(item)} size="sm">
          {item.tipo === "tarea" ? "Reto" : "Evento"}
        </Badge>
      </div>
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
          ? `Reto · ${item.modulo ?? item.cursoNombre ?? "Sin módulo"}`
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
          <div style={{
            display: "flex", gap: 10, justifyContent: "flex-end",
            paddingTop: 14, marginTop: 4, borderTop: "1px solid var(--color-border)",
          }}>
            <Button variant="outline" onClick={() => onEdit(item)}>
              <Pencil size={14} /> Editar evento
            </Button>
            <Button
              variant="danger"
              onClick={() => onDelete(item._id ?? item.id)}
              disabled={deleting}
            >
              <Trash2 size={14} />
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

  const itemsDelMes = items.filter(item => {
    const d = new Date(item.fecha);
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

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
            { label: "Retos",    val: stats.totalTareas,     color: "#6366f1" },
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
          overflow: "hidden", boxShadow: "var(--clay-card)",
        }}>
          {/* Navegación de mes */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px", borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)", gap: 8,
          }}>
            <button
              onClick={prevMonth}
              title="Mes anterior"
              style={{
                background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer",
                width: 34, height: 34, borderRadius: 10, color: "var(--color-text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                {MESES[month]} {year}
              </span>
              <button
                onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(now); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-primary)", fontSize: 11.5, fontWeight: 700,
                  padding: "1px 6px", borderRadius: 6,
                }}
              >
                Ir a hoy
              </button>
            </div>

            <button
              onClick={nextMonth}
              title="Mes siguiente"
              style={{
                background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer",
                width: 34, height: 34, borderRadius: 10, color: "var(--color-text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", background: "rgba(12,106,196,0.06)",
            borderBottom: "1px solid var(--color-border)",
          }}>
            <MousePointerClick size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: "var(--color-primary)", fontWeight: 600 }}>
              Toca un día para ver sus eventos y retos
            </span>
          </div>

          {/* Cabecera de días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "12px 10px 2px" }}>
            {DIAS.map(d => (
              <div key={d} style={{
                textAlign: "center", fontSize: 11.5, fontWeight: 800,
                color: "var(--color-text-muted)", paddingBottom: 6, letterSpacing: "0.04em",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          {loading ? (
            <div style={{ padding: "12px 10px" }}><Sk h={240} r={8} /></div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7,1fr)",
              gap: 6, padding: "0 10px 14px",
            }}>
              {grid.map((day, i) => {
                if (!day) return <div key={i} />;
                const key      = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayItems = byDay[key] ?? [];
                const isToday  = isSameDay(day, today);
                const isSel    = selected && isSameDay(day, selected);
                const hasItems = dayItems.length > 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(isSel ? null : day)}
                    title={
                      hasItems
                        ? `${day.getDate()} de ${MESES[month]}${isToday ? " · Hoy" : ""} — ${dayItems.length} actividad${dayItems.length !== 1 ? "es" : ""}, toca para ver`
                        : `${day.getDate()} de ${MESES[month]}${isToday ? " · Hoy" : ""}`
                    }
                    aria-label={`${day.getDate()} de ${MESES[month]}${isToday ? ", hoy" : ""}${hasItems ? `, ${dayItems.length} actividades` : ""}`}
                    style={{
                      position: "relative",
                      minHeight: 48,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                      background: isSel ? "var(--color-primary)" : "transparent",
                      border: `1.5px solid ${isSel ? "var(--color-primary)" : "transparent"}`,
                      borderRadius: 12,
                      cursor: "pointer", textAlign: "center",
                      transition: "all 120ms",
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--color-bg)"; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14.5, fontWeight: isToday || isSel ? 800 : 500,
                      // "hoy" siempre círculo sólido; si además seleccionado, se invierte a blanco
                      background: isToday ? (isSel ? "#fff" : "var(--color-primary)") : "transparent",
                      color: isToday ? (isSel ? "var(--color-primary)" : "#fff") : (isSel ? "#fff" : "var(--color-text)"),
                    }}>
                      {day.getDate()}
                    </span>

                    {hasItems ? (
                      <div style={{ display: "flex", gap: 3, justifyContent: "center", alignItems: "center", height: 8 }}>
                        {dayItems.slice(0, 3).map((item, ti) => (
                          <div key={ti} style={{
                            width: 6.5, height: 6.5, borderRadius: "50%",
                            background: isSel ? "rgba(255,255,255,0.9)" : itemColor(item),
                          }} />
                        ))}
                        {dayItems.length > 3 && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, lineHeight: 1,
                            color: isSel ? "rgba(255,255,255,0.85)" : "var(--color-text-muted)",
                          }}>
                            +{dayItems.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: 8 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div style={{
            padding: "12px 16px 16px", borderTop: "1px solid var(--color-border)",
            display: "flex", gap: 12, flexWrap: "wrap",
          }}>
            {[
              { color: "var(--color-error)", label: "Vencida"  },
              { color: "#f97316", label: "Urgente"  },
              { color: "#22c55e", label: "Próxima"  },
              { color: "#2196F3", label: "Evento"   },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL DERECHO ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 14 }}>

          {!selected && !loading && (
            <div style={{
              background: "var(--color-surface)", borderRadius: 14,
              border: "1.5px dashed var(--color-border)",
              padding: "28px 20px", textAlign: "center",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", margin: "0 auto 12px",
                background: "rgba(12,106,196,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CalendarDays size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
                Aquí verás los detalles de cada día
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Toca cualquier día del calendario para ver sus eventos y retos.
                Luego toca uno de ellos para ver más información{canManage ? " o editarlo" : ""}.
              </p>
            </div>
          )}

          {/* Detalle del día seleccionado */}
          {selected && (
            <div style={{
              background: "var(--color-surface)", borderRadius: 14,
              border: "1px solid var(--color-border)", overflow: "hidden",
              boxShadow: "var(--clay-card)",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <CalendarDays size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)", overflowWrap: "anywhere" }}>
                    {selected.toLocaleDateString("es-CO", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </span>
                </div>
                <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", fontWeight: 600, flexShrink: 0 }}>
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
            boxShadow: "var(--clay-card)",
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
                    <button
                      key={item._id ?? item.id ?? i}
                      onClick={() => { setSelected(isSel ? null : d); setDetail(item); }}
                      title="Ver detalles"
                      style={{
                        width: "100%", border: "none", textAlign: "left",
                        padding: "13px 16px", cursor: "pointer",
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

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 2,
                          fontSize: 11, fontWeight: 700, color: "var(--color-primary)",
                          whiteSpace: "nowrap",
                        }}>
                          Ver más
                          <ChevronRight size={13} style={{ flexShrink: 0 }} />
                        </span>
                        <Badge variant={itemBadgeVariant(item)} size="sm">
                          {item.tipo === "tarea" ? "Reto" : "Evento"}
                        </Badge>
                      </div>
                    </button>
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
