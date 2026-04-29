// src/features/notificaciones/pages/NotificacionesPage.jsx
// ROL: Autenticado (todos los roles)
import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, Filter,
} from "lucide-react";
import {
  notificacionesGetAll,
  notificacionesMarcarLeida,
  notificacionesMarcarTodasLeidas,
  notificacionesDelete,
} from "@/lib/apiClient";

const LIMIT = 15;

const TIPO_META = {
  info:      { color: "#0C6AC4", bg: "rgba(12,106,196,0.10)" },
  exito:     { color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  warning:   { color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  error:     { color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  bienvenida:{ color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
};

function Sk({ h = 16, w = "100%", r = 7 }) {
  return (
    <div className="animate-pulse" style={{
      height: h, width: w, borderRadius: r, background: "var(--color-border)",
    }} />
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === "error" ? "#DC2626" : type === "info" ? "#0C6AC4" : "#16A34A";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      background: bg, color: "white", padding: "12px 20px",
      borderRadius: 10, fontSize: 13.5, fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
    }}>
      {msg}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function NotificacionesPage() {
  const [notifs,    setNotifs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [noLeidas,  setNoLeidas]  = useState(0);
  const [filter,    setFilter]    = useState("all"); // "all" | "unread" | "read"
  const [toast,     setToast]     = useState({ msg: "", type: "success" });
  const [markingAll, setMarkingAll] = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => { setPage(1); }, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filter === "unread") params.leido = false;
      if (filter === "read")   params.leido = true;
      const res = await notificacionesGetAll(params);
      setNotifs(res.notificaciones ?? []);
      setTotal(res.pagination?.total ?? res.notificaciones?.length ?? 0);
      setNoLeidas(res.noLeidas ?? 0);
    } catch { notify("Error al cargar notificaciones", "error"); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await notificacionesMarcarLeida(id);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, leido: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch { notify("Error al marcar como leída", "error"); }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificacionesMarcarTodasLeidas();
      setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
      setNoLeidas(0);
      notify("Todas marcadas como leídas");
    } catch { notify("Error al actualizar", "error"); }
    finally { setMarkingAll(false); }
  };

  const handleDelete = async (id) => {
    try {
      await notificacionesDelete(id);
      setNotifs(prev => prev.filter(n => n._id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      notify("Notificación eliminada");
    } catch { notify("Error al eliminar", "error"); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const FILTERS = [
    { key: "all",    label: "Todas" },
    { key: "unread", label: "No leídas" },
    { key: "read",   label: "Leídas" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Toast {...toast} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell style={{ width: 19, height: 19, color: "#0C6AC4" }} />
            {noLeidas > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 16, height: 16, borderRadius: "50%",
                background: "#DC2626", color: "white",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Notificaciones</h1>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>
              {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo al día"}
            </p>
          </div>
        </div>

        {noLeidas > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "transparent", color: "#0C6AC4",
              border: "1.5px solid rgba(12,106,196,0.3)",
              padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              cursor: markingAll ? "not-allowed" : "pointer",
            }}
          >
            <CheckCheck style={{ width: 14, height: 14 }} />
            {markingAll ? "Marcando..." : "Marcar todas como leídas"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "6px 16px", borderRadius: 99, fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", border: "none", transition: "all 0.15s",
              background: filter === f.key ? "#0C6AC4" : "var(--color-surface)",
              color: filter === f.key ? "white" : "var(--color-text-muted)",
              boxShadow: filter === f.key ? "none" : "0 0 0 1.5px var(--color-border)",
            }}
          >
            {f.label}
            {f.key === "unread" && noLeidas > 0 && (
              <span style={{
                marginLeft: 6, background: filter === f.key ? "rgba(255,255,255,0.25)" : "rgba(12,106,196,0.12)",
                color: filter === f.key ? "white" : "#0C6AC4",
                padding: "1px 7px", borderRadius: 99, fontSize: 10.5, fontWeight: 800,
              }}>
                {noLeidas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          [0,1,2,3,4,5].map(i => (
            <div key={i} style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <Sk h={40} w={40} r={10} />
              <div style={{ flex: 1 }}>
                <Sk h={14} w="60%" r={5} />
                <div style={{ marginTop: 7 }}><Sk h={12} w="80%" r={4} /></div>
                <div style={{ marginTop: 5 }}><Sk h={10} w={80} r={4} /></div>
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div style={{
            background: "var(--color-surface)", borderRadius: 16,
            border: "1px solid var(--color-border)", padding: "56px 24px",
            textAlign: "center",
          }}>
            <BellOff style={{ width: 40, height: 40, color: "var(--color-text-muted)", margin: "0 auto 14px" }} />
            <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--color-text)", margin: "0 0 6px" }}>
              No hay notificaciones
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
              {filter === "unread" ? "Estás al día con todas tus notificaciones." : "No tienes notificaciones en esta categoría."}
            </p>
          </div>
        ) : (
          notifs.map((n) => {
            const tipo = TIPO_META[n.tipo] ?? TIPO_META.info;
            return (
              <div
                key={n._id}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: 14,
                  border: `1px solid ${n.leido ? "var(--color-border)" : "rgba(12,106,196,0.25)"}`,
                  padding: "14px 18px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  transition: "all 0.15s",
                  opacity: n.leido ? 0.75 : 1,
                  boxShadow: n.leido ? "none" : "0 2px 12px rgba(12,106,196,0.08)",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: tipo.bg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bell style={{ width: 16, height: 16, color: tipo.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <p style={{
                      fontSize: 13.5, fontWeight: n.leido ? 500 : 700,
                      color: "var(--color-text)", margin: 0, lineHeight: 1.4,
                    }}>
                      {n.titulo}
                    </p>
                    {!n.leido && (
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#0C6AC4", flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                  {n.mensaje && (
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
                      {n.mensaje}
                    </p>
                  )}
                  <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
                    {formatDate(n.fechaCreacion ?? n.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {!n.leido && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      title="Marcar como leída"
                      style={{
                        background: "rgba(22,163,74,0.1)", border: "none",
                        borderRadius: 7, padding: 7, cursor: "pointer", display: "flex",
                      }}
                    >
                      <Check style={{ width: 13, height: 13, color: "#16A34A" }} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    title="Eliminar"
                    style={{
                      background: "rgba(220,38,38,0.1)", border: "none",
                      borderRadius: 7, padding: 7, cursor: "pointer", display: "flex",
                    }}
                  >
                    <Trash2 style={{ width: 13, height: 13, color: "#DC2626" }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 20, padding: "12px 0",
        }}>
          <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
            Página {page} de {totalPages} · {total} notificaciones
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
                borderRadius: 8, padding: "6px 12px", cursor: page === 1 ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)",
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} /> Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
                borderRadius: 8, padding: "6px 12px", cursor: page === totalPages ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)",
              }}
            >
              Siguiente <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
