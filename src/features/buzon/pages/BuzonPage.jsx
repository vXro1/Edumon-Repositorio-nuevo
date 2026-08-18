// src/features/buzon/pages/BuzonPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Mail, MailOpen, Inbox, RefreshCw, Building2,
  Phone, AtSign, MessageSquare, Clock, CheckCheck,
} from "lucide-react";
import { AppModal, Button } from "@/components";
import { buzonGetAll, buzonMarcarLeido } from "@/features/buzon/services/buzonService";
import { normalizePhone } from "@/utils/normalizePhone";

/* ── Funciones auxiliares ────────────────────────────────────── */
function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  return d.toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Skeleton({ h = 16, w = "100%", r = 6 }) {
  return (
    <div className="animate-pulse" style={{
      height: h, width: w, borderRadius: r,
      background: "var(--color-border)",
    }} />
  );
}

/* ── Modal de detalle ────────────────────────────────────────── */
function MensajeModal({ msg, onClose, onMarcarLeido, marking }) {
  return (
    <AppModal isOpen={!!msg} onClose={onClose} size="sm">
      <AppModal.Header
        title={msg?.nombre ?? ""}
        description={msg ? formatDate(msg.createdAt) : ""}
        onClose={onClose}
      />
      <AppModal.Body>
        {msg && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Datos de contacto */}
            <div style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 12, padding: "1rem",
              display: "flex", flexDirection: "column", gap: "0.65rem",
            }}>
              <Row icon={<AtSign size={14} />}      label="Correo"      value={msg.correo} />
              <Row icon={<Phone size={14} />}        label="Teléfono"    value={normalizePhone(msg.telefono) ?? msg.telefono ?? "—"} />
              {msg.institucion && (
                <Row icon={<Building2 size={14} />} label="Institución" value={msg.institucion} />
              )}
            </div>

            {/* Mensaje */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.5rem" }}>
                <MessageSquare size={14} style={{ color: "var(--color-text-muted)" }} />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Mensaje
                </span>
              </div>
              <p style={{
                margin: 0, fontSize: "0.9rem", lineHeight: 1.7,
                color: "var(--color-text)",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 12, padding: "0.875rem",
                whiteSpace: "pre-wrap",
              }}>
                {msg.mensaje}
              </p>
            </div>
          </div>
        )}
      </AppModal.Body>
      <AppModal.Footer>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        {msg && !msg.leido && (
          <Button
            disabled={marking}
            onClick={() => onMarcarLeido(msg._id)}
            leftIcon={<CheckCheck size={15} />}
          >
            {marking ? "Marcando…" : "Marcar leído"}
          </Button>
        )}
      </AppModal.Footer>
    </AppModal>
  );
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.85rem" }}>
      <span style={{ color: "var(--color-text-muted)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: 700, color: "var(--color-text-muted)", minWidth: 80, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "var(--color-text)", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

/* ── Fila de mensaje ─────────────────────────────────────────── */
function MensajeRow({ msg, onClick }) {
  return (
    <button
      onClick={() => onClick(msg)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "14px 18px",
        background: msg.leido ? "transparent" : "rgba(12,106,196,0.04)",
        width: "100%", border: "none", borderBottom: "1px solid var(--color-border)",
        textAlign: "left", cursor: "pointer",
        transition: "background 150ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = msg.leido ? "transparent" : "rgba(12,106,196,0.04)"; }}
    >
      {/* Icono */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: msg.leido ? "rgba(100,116,139,0.08)" : "rgba(12,106,196,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 2,
      }}>
        {msg.leido
          ? <MailOpen size={17} style={{ color: "var(--color-text-muted)" }} />
          : <Mail size={17} style={{ color: "var(--color-primary)" }} />
        }
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontSize: 13.5, fontWeight: msg.leido ? 500 : 700, color: "var(--color-text)" }}>
            {msg.nombre}
          </span>
          {msg.institucion && (
            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>· {msg.institucion}</span>
          )}
          {!msg.leido && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "1px 8px", borderRadius: 99,
              background: "rgba(12,106,196,0.12)", color: "var(--color-primary)",
            }}>
              Nuevo
            </span>
          )}
        </div>
        <p style={{
          fontSize: 12.5, color: "var(--color-text-muted)", margin: 0,
          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {msg.correo}{msg.telefono ? ` · ${msg.telefono}` : ""}
        </p>
        <p style={{
          fontSize: 12.5, color: "var(--color-text)", margin: "4px 0 0",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          lineHeight: 1.5,
        }}>
          {msg.mensaje}
        </p>
      </div>

      {/* Fecha */}
      <div style={{ flexShrink: 0, fontSize: 11, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
        <Clock size={10} />
        {formatDate(msg.createdAt)}
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function BuzonPage() {
  const [mensajes,  setMensajes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [selected,  setSelected]  = useState(null);
  const [marking,   setMarking]   = useState(false);
  const [filtro,    setFiltro]    = useState("todos"); // todos | nuevos | leidos

  const fetchMensajes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await buzonGetAll({ limit: 100 });
      // Ordenar por más reciente
      const sorted = (res.mensajes ?? res.data ?? []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMensajes(sorted);
    } catch {
      setError("No se pudieron cargar los mensajes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMensajes(); }, [fetchMensajes]);

  const handleMarcarLeido = async (id) => {
    setMarking(true);
    try {
      await buzonMarcarLeido(id);
      setMensajes((prev) => prev.map((m) => m._id === id ? { ...m, leido: true } : m));
      setSelected((prev) => prev?._id === id ? { ...prev, leido: true } : prev);
    } catch { /* silencioso */ }
    finally { setMarking(false); }
  };

  const noLeidos = mensajes.filter((m) => !m.leido).length;

  const filtered = filtro === "nuevos"
    ? mensajes.filter((m) => !m.leido)
    : filtro === "leidos"
      ? mensajes.filter((m) => m.leido)
      : mensajes;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* ── Encabezado ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(12,106,196,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Inbox size={22} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)" }}>
              Buzón de contacto
            </h1>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {noLeidos > 0 ? `${noLeidos} mensaje${noLeidos > 1 ? "s" : ""} sin leer` : "Todo leído"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchMensajes}
          title="Actualizar"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0.5rem 1rem", borderRadius: 10,
            border: "1.5px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text-muted)",
            fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "todos",  label: `Todos (${mensajes.length})` },
          { key: "nuevos", label: `Sin leer (${noLeidos})` },
          { key: "leidos", label: `Leídos (${mensajes.length - noLeidos})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              padding: "0.4rem 1rem", borderRadius: 99, fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", border: "1.5px solid",
              borderColor: filtro === key ? "var(--color-primary)" : "var(--color-border)",
              background: filtro === key ? "rgba(12,106,196,0.1)" : "var(--color-surface)",
              color: filtro === key ? "var(--color-primary)" : "var(--color-text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16, boxShadow: "var(--shadow-card)", overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Skeleton h={40} w={40} r={10} />
                <div style={{ flex: 1 }}>
                  <Skeleton h={14} w="45%" r={5} />
                  <div style={{ marginTop: 8 }}><Skeleton h={11} w="70%" r={4} /></div>
                  <div style={{ marginTop: 6 }}><Skeleton h={11} w="55%" r={4} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Mail size={28} style={{ color: "var(--color-text-muted)", margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Inbox size={28} style={{ color: "var(--color-text-muted)", margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>
              {filtro === "nuevos" ? "No hay mensajes sin leer" : filtro === "leidos" ? "No hay mensajes leídos" : "No hay mensajes"}
            </p>
          </div>
        ) : (
          filtered.map((msg) => (
            <MensajeRow key={msg._id} msg={msg} onClick={setSelected} />
          ))
        )}
      </div>

      {/* ── Modal de detalle ── */}
      <MensajeModal
        msg={selected}
        onClose={() => setSelected(null)}
        onMarcarLeido={handleMarcarLeido}
        marking={marking}
      />
    </div>
  );
}
