// src/features/tareas/pages/EntregasPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ClipboardList, CheckCircle2, AlertCircle,
  Clock, Star, Loader2, RefreshCw, Users, FileText,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { tareasGetById, entregasGetByTarea, entregasCalificar } from "@/lib/apiClient";
import { normalizeTarea, normalizeEntrega } from "@/lib/normalizers";
import Modal from "@/components/ui/Modal";
import { humanizeError } from "@/utils/humanizeError";

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)",  color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "success" ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} /> : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

const ESTADO_CFG = {
  enviada:     { bg: "rgba(12,106,196,0.10)",  color: "#0C6AC4",  label: "Enviada" },
  tarde:       { bg: "rgba(220,38,38,0.10)",   color: "#DC2626",  label: "Tarde" },
  calificada:  { bg: "rgba(22,163,74,0.10)",   color: "#16A34A",  label: "Calificada" },
  borrador:    { bg: "rgba(148,163,184,0.15)", color: "#64748B",  label: "Borrador" },
};

function StatPill({ value, label, color, bg }) {
  return (
    <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "14px 20px", textAlign: "center", minWidth: 110 }}>
      <p style={{ fontSize: 26, fontWeight: 800, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}

export default function EntregasPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tarea,      setTarea]      = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [stats,      setStats]      = useState({ total: 0, enviadas: 0, tarde: 0, calificadas: 0 });
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState({ msg: "", type: "success" });

  // Calificar modal
  const [showCal,    setShowCal]    = useState(false);
  const [calForm,    setCalForm]    = useState({ nota: "", comentario: "" });
  const [calTarget,  setCalTarget]  = useState(null);
  const [saving,     setSaving]     = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tareaData, entregasData] = await Promise.all([
        tareasGetById(id),
        entregasGetByTarea(id, { limit: 100 }),
      ]);
      setTarea(normalizeTarea(tareaData.tarea ?? tareaData));
      setEntregas((entregasData.entregas ?? []).map(normalizeEntrega));
      if (entregasData.estadisticas) setStats(entregasData.estadisticas);
    } catch {
      notify("Error al cargar entregas", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openCalificar = (entrega) => {
    setCalTarget(entrega);
    setCalForm({
      nota: entrega.calificacion?.nota?.toString() ?? "",
      comentario: entrega.calificacion?.comentario ?? "",
    });
    setShowCal(true);
  };

  const handleCalificar = async (e) => {
    e.preventDefault();
    const nota = parseFloat(calForm.nota);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      notify("La nota debe ser un número entre 0 y 10", "error");
      return;
    }
    setSaving(true);
    try {
      await entregasCalificar(calTarget._id, { nota, comentario: calForm.comentario });
      notify(calTarget.calificacion ? "Calificación actualizada" : "Entrega calificada");
      setShowCal(false);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al calificar"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Sk h={36} w={36} r={99} /><div style={{ flex: 1 }}><Sk h={22} w="50%" /><div style={{ marginTop: 8 }}><Sk h={13} w="35%" /></div></div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>{[0,1,2,3].map(i => <Sk key={i} h={72} r={14} w={120} />)}</div>
      {[0,1,2].map(i => <div key={i} style={{ marginBottom: 10 }}><Sk h={88} r={16} /></div>)}
    </div>
  );

  const tareaTitle = tarea?.titulo ?? "Tarea";
  const cursoNombre = tarea?.curso?.nombre ?? "";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate("/tareas")} style={{ padding: 8, borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)", flexShrink: 0, marginTop: 4 }}>
          <ArrowLeft style={{ width: 17, height: 17 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Entregas — {tareaTitle}</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
            {cursoNombre && `Curso: ${cursoNombre}`}
            {tarea?.fechaEntrega && ` · Vence: ${new Date(tarea.fechaEntrega).toLocaleDateString("es", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <button onClick={load} title="Actualizar" style={{ padding: 8, borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
          <RefreshCw style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatPill value={stats.total ?? entregas.length} label="Total" color="var(--color-text)" bg="transparent" />
        <StatPill value={stats.enviadas ?? 0} label="Enviadas" color="#0C6AC4" bg="rgba(12,106,196,0.10)" />
        <StatPill value={stats.tarde ?? 0} label="Tarde" color="#DC2626" bg="rgba(220,38,38,0.10)" />
        <StatPill value={stats.calificadas ?? 0} label="Calificadas" color="#16A34A" bg="rgba(22,163,74,0.10)" />
      </div>

      {/* ── Entregas list ──────────────────────────────────────── */}
      {entregas.length === 0 ? (
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "60px 24px", textAlign: "center" }}>
          <FileText style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin entregas todavía</p>
          <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Las entregas de los padres aparecerán aquí</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entregas.map(e => (
            <EntregaCard key={e._id} entrega={e} onCalificar={() => openCalificar(e)} />
          ))}
        </div>
      )}

      {/* ══ CALIFICAR MODAL ════════════════════════════════════ */}
      <Modal isOpen={showCal} onClose={() => setShowCal(false)} title={calTarget?.calificacion ? "Actualizar calificación" : "Calificar entrega"} size="sm">
        {calTarget && (
          <form onSubmit={handleCalificar}>
            <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                {calTarget.padre.nombre} {calTarget.padre.apellido}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                Enviada: {new Date(calTarget.fechaEnvio ?? calTarget.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {calTarget.calificacion && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(22,163,74,0.08)", borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 12.5, color: "#16A34A", fontWeight: 600 }}>
                <Star style={{ width: 13, height: 13 }} />
                Nota actual: {calTarget.calificacion.nota} / 10
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nota (0 – 10) *</label>
                <input
                  type="number" min="0" max="10" step="0.5"
                  value={calForm.nota}
                  onChange={e => setCalForm(p => ({ ...p, nota: e.target.value }))}
                  required
                  placeholder="Ej: 8.5"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 15, fontWeight: 700, borderRadius: 10, border: "1.5px solid var(--color-border)", outline: "none", background: "var(--color-surface)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Comentario</label>
                <textarea
                  value={calForm.comentario}
                  onChange={e => setCalForm(p => ({ ...p, comentario: e.target.value }))}
                  placeholder="Retroalimentación para el padre/tutor..."
                  rows={3}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: "1.5px solid var(--color-border)", outline: "none", background: "var(--color-surface)", color: "var(--color-text)", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowCal(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
                {calTarget.calificacion ? "Actualizar" : "Calificar"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function EntregaCard({ entrega: e, onCalificar }) {
  const [expanded, setExpanded] = useState(false);
  const estadoCfg = ESTADO_CFG[e.estado] ?? ESTADO_CFG.enviada;
  const padreNombre = `${e.padre.nombre} ${e.padre.apellido}`.trim() || "Sin nombre";
  const fecha = e.fechaEnvio ?? e.createdAt;
  const adjuntos = e.archivos ?? e.adjuntos ?? [];

  return (
    <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0C6AC4", flexShrink: 0 }}>
          {(e.padre?.nombre?.[0] ?? "P").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{padreNombre}</p>
            <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: estadoCfg.bg, color: estadoCfg.color }}>{estadoCfg.label}</span>
            {e.calificacion && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: "rgba(22,163,74,0.10)", color: "#16A34A" }}>
                <Star style={{ width: 10, height: 10 }} /> {e.calificacion.nota}/10
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>
            {fecha ? new Date(fecha).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
            {adjuntos.length > 0 && ` · ${adjuntos.length} adjunto${adjuntos.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={ev => { ev.stopPropagation(); onCalificar(); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, border: "none", background: e.calificacion ? "rgba(22,163,74,0.12)" : "rgba(12,106,196,0.10)", color: e.calificacion ? "#16A34A" : "#0C6AC4", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
            <Star style={{ width: 13, height: 13 }} /> {e.calificacion ? "Actualizar nota" : "Calificar"}
          </button>
          {expanded ? <ChevronUp style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 18px", background: "var(--color-bg)" }}>
          {e.textoRespuesta && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Respuesta</p>
              <p style={{ fontSize: 13.5, color: "var(--color-text)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{e.textoRespuesta}</p>
            </div>
          )}

          {adjuntos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Archivos adjuntos</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {adjuntos.map((a, i) => (
                  <a key={i} href={a.url ?? a} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 12.5, color: "#0C6AC4", fontWeight: 600, textDecoration: "none" }}>
                    <FileText style={{ width: 13, height: 13 }} />
                    {a.nombre ?? a.originalname ?? `Archivo ${i + 1}`}
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {e.calificacion && (
            <div style={{ background: "rgba(22,163,74,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(22,163,74,0.15)" }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Calificación</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", margin: 0 }}>{e.calificacion.nota} / 10</p>
              {e.calificacion.comentario && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>{e.calificacion.comentario}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
