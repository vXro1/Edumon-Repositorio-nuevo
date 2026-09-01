import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";

import {
  notificacionesGetAll,
  notificacionesGetConteoNoLeidas,
  notificacionesMarcarLeida,
  notificacionesMarcarTodasLeidas,
  notificacionesDelete,
  notificacionesLimpiarAntiguas,
} from "@/features/notificaciones/services/notificacionesService";
import { getSocket } from "@/lib/socket";

import { Toast, Button, Badge } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

/* ───────────────────────── CONFIG ───────────────────────── */

const LIMIT = 15;
const DIAS_LIMPIEZA = 30;

// Coincide con el enum real definido en createNotificacionValidator (tipo)
const TIPO_META = {
  tarea:        { variant: "info",    label: "Reto" },
  entrega:      { variant: "success", label: "Entrega" },
  calificacion: { variant: "purple",  label: "Calificación" },
  foro:         { variant: "warning", label: "Foro" },
  evento:       { variant: "info",    label: "Evento" },
  sistema:      { variant: "error",   label: "Sistema" },
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "No leídas" },
  { key: "read", label: "Leídas" },
];

/* ───────────────────────── HELPERS ───────────────────────── */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;

  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

/* Esqueleto de carga */
const Sk = ({ h = 16, w = "100%", r = 7 }) => (
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

/* ───────────────────────── COMPONENTE ───────────────────────── */

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [noLeidas, setNoLeidas] = useState(0);

  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [markingAll, setMarkingAll] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  /* reset page cuando cambia filtro */
  useEffect(() => {
    setPage(1);
  }, [filter]);

  /* conteo rápido de no leídas al montar, sin esperar la lista completa */
  useEffect(() => {
    notificacionesGetConteoNoLeidas()
      .then((res) => setNoLeidas(res.noLeidas ?? 0))
      .catch(() => {});
  }, []);

  /* cargar datos */
  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = { page, limit: LIMIT };

      if (filter === "unread") params.leido = false;
      if (filter === "read") params.leido = true;

      const res = await notificacionesGetAll(params);

      setNotifs(res.notificaciones ?? []);
      setTotal(res.pagination?.total ?? 0);
      setNoLeidas(res.noLeidas ?? 0);
    } catch (err) {
      console.error(err);
      notify("Error al cargar notificaciones", "error");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  /* En vivo: el backend emite "notificaciones:nueva" + "notificaciones:conteo"
     a la sala privada del usuario (io.to(`user:${userId}`), ver
     socketHandlers.js) cada vez que se crea una notificación — no importa
     qué la disparó (foro, entrega calificada, buzón, etc.). El socket ya
     está conectado a nivel de app (AuthContext) apenas hay sesión; acá solo
     nos suscribimos mientras la pantalla está montada. Recargar la página
     entera de un tirón (en vez de mergear a mano el item nuevo) es a
     propósito: es la misma función `load()` que ya usan los filtros y la
     paginación, así que respeta el filtro/página activos sin duplicar lógica. */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNueva = () => load();
    const onConteo = ({ noLeidas: n }) => setNoLeidas(n ?? 0);

    socket.on("notificaciones:nueva", onNueva);
    socket.on("notificaciones:conteo", onConteo);

    return () => {
      socket.off("notificaciones:nueva", onNueva);
      socket.off("notificaciones:conteo", onConteo);
    };
  }, [load]);

  /* ───────── acciones ───────── */

  const handleMarkRead = async (id) => {
    try {
      await notificacionesMarcarLeida(id);

      setNotifs((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leido: true } : n))
      );

      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      notify("Error al marcar como leída", "error");
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);

    try {
      await notificacionesMarcarTodasLeidas();

      setNotifs((prev) => prev.map((n) => ({ ...n, leido: true })));
      setNoLeidas(0);

      notify("Todas marcadas como leídas");
    } catch {
      notify("Error al actualizar", "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificacionesDelete(id);

      setNotifs((prev) => prev.filter((n) => n._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));

      notify("Notificación eliminada");
    } catch {
      notify("Error al eliminar", "error");
    }
  };

  const handleLimpiarAntiguas = async () => {
    const confirmado = window.confirm(
      `Esto elimina las notificaciones ya leídas con más de ${DIAS_LIMPIEZA} días. ¿Continuar?`
    );
    if (!confirmado) return;

    setCleaning(true);

    try {
      const res = await notificacionesLimpiarAntiguas({ dias: DIAS_LIMPIEZA });

      notify(res.message ?? "Notificaciones antiguas eliminadas");
      await load();
    } catch {
      notify("Error al limpiar notificaciones antiguas", "error");
    } finally {
      setCleaning(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* ───────────────────────── UI ───────────────────────── */

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Toast {...toast} />

      {/* ENCABEZADO */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 22,
      }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(12,106,196,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            <Bell style={{ width: 18, height: 18, color: "var(--color-primary)" }} />

            {noLeidas > 0 && (
              <Badge
                variant="error"
                dot
                size="sm"
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  fontSize: 9,
                  fontWeight: 800,
                  minWidth: 16,
                  height: 16,
                  borderRadius: "50%",
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {noLeidas > 9 ? "9+" : noLeidas}
              </Badge>
            )}
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              Notificaciones
            </h1>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748B" }}>
              {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo al día"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            variant="outline"
            disabled={cleaning}
            onClick={handleLimpiarAntiguas}
            title={`Elimina notificaciones leídas con más de ${DIAS_LIMPIEZA} días`}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            {cleaning ? "Limpiando..." : "Limpiar antiguas"}
          </Button>

          {noLeidas > 0 && (
            <Button
              variant="outline"
              disabled={markingAll}
              onClick={handleMarkAll}
            >
              <CheckCheck style={{ width: 14, height: 14 }} />
              {markingAll ? "Procesando..." : "Marcar todas"}
            </Button>
          )}
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            style={{ borderRadius: 99 }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* LISTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                display: "flex",
                gap: 12,
              }}
            >
              <Sk h={40} w={40} r={10} />
              <div style={{ flex: 1 }}>
                <Sk w="60%" />
                <Sk w="85%" h={12} />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: 50,
            border: "1px solid #E2E8F0",
            borderRadius: 16,
          }}>
            <BellOff style={{ width: 40, height: 40, marginBottom: 10 }} />
            <p style={{ margin: 0 }}>Sin notificaciones</p>
          </div>
        ) : (
          notifs.map((n) => {
            const tipoConfig = TIPO_META[n.tipo] ?? { variant: "info", label: n.tipo ?? "Notificación" };

            return (
              <div
                key={n._id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  border: `1px solid ${
                    n.leido ? "#E2E8F0" : "rgba(12,106,196,0.25)"
                  }`,
                  background: "white",
                  opacity: n.leido ? 0.65 : 1,
                }}
              >
                <Badge
                  variant={tipoConfig.variant}
                  size="sm"
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  icon={<Bell style={{ width: 16, height: 16 }} />}
                />

                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {tipoConfig.label}
                    {n.prioridad === "critica" && (
                      <Badge variant="error" size="sm" style={{ marginLeft: 6, fontSize: 9 }}>
                        Urgente
                      </Badge>
                    )}
                  </p>

                  {n.mensaje && (
                    <p style={{ margin: "4px 0 0", color: "#64748B" }}>
                      {n.mensaje}
                    </p>
                  )}

                  <p style={{ fontSize: 11, color: "#94A3B8" }}>
                    {formatDate(n.fecha)}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {!n.leido && (
                    <IconBtn
                      label="Marcar como leída"
                      color="var(--edu-green-600)"
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <Check size={14} />
                    </IconBtn>
                  )}

                  <IconBtn
                    label="Eliminar"
                    color="var(--color-error-hover)"
                    onClick={() => handleDelete(n._id)}
                  >
                    <Trash2 size={14} />
                  </IconBtn>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 20,
        }}>
          <span style={{ fontSize: 12.5, color: "#64748B" }}>
            Página {page} de {totalPages}
          </span>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} /> Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente <ChevronRight style={{ width: 14, height: 14 }} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}