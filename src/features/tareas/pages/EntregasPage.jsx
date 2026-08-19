import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft, CheckCircle2, Clock, Star, Loader2, RefreshCw,
  FileText, ExternalLink, ChevronDown, ChevronUp, Search, X,
  ClipboardList,
} from "lucide-react";

import { entregasGetByTarea, entregasCalificar } from "@/features/entregas/services/entregasService";
import { tareasGetById } from "@/features/cursos/services/tareasService";

import { normalizeEntregas, normalizeEntrega } from "@/lib/normalizers/entrega";
import { normalizeTarea } from "@/lib/normalizers/tarea";
import { Modal, Toast, Button, Input, Badge } from "@/components";
import { Sk, EmptyState, Field, StarRating, StarRatingInput } from "../../cursos/components/shared/ui";
import { humanizeError } from "@/utils/humanizeError";

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESTADO_CFG = {
  enviada:    { label: "Enviada"    },
  tarde:      { label: "Tarde"      },
  calificada: { label: "Calificada" },
  borrador:   { label: "Borrador"   },
};

const ESTADO_BADGE = { enviada: "info", tarde: "error", calificada: "success", borrador: "neutral" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EntregasPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tarea,      setTarea]      = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [stats,      setStats]      = useState({ total: 0, enviadas: 0, tarde: 0, calificadas: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [filterEst,  setFilterEst]  = useState("");
  const [toast,      setToast]      = useState({ msg: "", type: "success" });

  const [showCal,   setShowCal]   = useState(false);
  const [calForm,   setCalForm]   = useState({ valoracion: 0, comentario: "" });
  const [calTarget, setCalTarget] = useState(null);
  const [saving,    setSaving]    = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // entregasGetByTarea ya devuelve padreId y calificacion.docenteId poblados
  // (ver entregaController.js: getEntregasByTarea popula ambos), así que no
  // hace falta volver a pedirlos por separado. Antes se intentaba "enriquecer"
  // llamando a usersGetById(padreId) — pero padreId YA era el objeto poblado
  // en este punto, no un id crudo, así que esas llamadas pedían
  // /users/[object Object] y nunca devolvían nada útil.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entregasData, tareaData] = await Promise.all([
        entregasGetByTarea(id, { limit: 100 }),
        tareasGetById(id).catch(() => null),
      ]);

      if (tareaData) setTarea(normalizeTarea(tareaData.tarea ?? tareaData));

      setEntregas(normalizeEntregas(entregasData.entregas));
      if (entregasData.estadisticas) setStats(entregasData.estadisticas);
    } catch (err) {
      setError(humanizeError(err, "Error al cargar entregas"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Filtro local ─────────────────────────────────────────────────────────
  const filtered = entregas.filter(e => {
    const q = search.toLowerCase();
    const nombre = `${e.padre?.nombre ?? ""} ${e.padre?.apellido ?? ""}`.toLowerCase();
    const matchSearch = !q || nombre.includes(q);
    const matchEst    = !filterEst || e.estado === filterEst;
    return matchSearch && matchEst;
  });

  const openCalificar = (entrega) => {
    setCalTarget(entrega);
    setCalForm({
      valoracion: entrega.calificacion?.valoracion ?? 0,
      comentario: entrega.calificacion?.comentario ?? "",
    });
    setShowCal(true);
  };

  // El backend (calificarEntregaValidator.js) espera { valoracion (1-5),
  // comentario } — nunca "nota" ni "docenteId" en el body. docenteId se
  // extrae del token de sesión en el controlador (calificarEntrega.js) y
  // el validator RECHAZA la petición si docenteId viene en el body.
  const handleCalificar = async (e) => {
    e.preventDefault();
    if (!calForm.valoracion) {
      notify("Selecciona una valoración", "error");
      return;
    }
    setSaving(true);
    try {
      const response = await entregasCalificar(calTarget._id, {
        valoracion: calForm.valoracion,
        comentario: calForm.comentario,
      });
      const actualizada = normalizeEntrega(response.entrega);
      setEntregas(prev => prev.map(ent => ent._id === calTarget._id ? actualizada : ent));
      notify(calTarget.calificacion ? "Calificación actualizada" : "Entrega calificada");
      setShowCal(false);
    } catch (err) {
      notify(humanizeError(err, "Error al calificar"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Sk h={36} w={36} r={99} />
        <div style={{ flex: 1 }}>
          <Sk h={22} w="50%" />
          <div style={{ marginTop: 8 }}><Sk h={13} w="35%" /></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => <Sk key={i} h={72} r={14} w={120} />)}
      </div>
      {[0, 1, 2].map(i => <div key={i} style={{ marginBottom: 10 }}><Sk h={88} r={16} /></div>)}
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/tareas")} style={{ marginTop: 3 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </Button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(99,102,241,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                  Entregas
                </h1>
                {tarea?.titulo && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                    {tarea.titulo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={load} title="Actualizar">
          <RefreshCw style={{ width: 15, height: 15 }} />
        </Button>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: "rgba(220,38,38,0.10)", borderRadius: 12, border: "1px solid rgba(220,38,38,0.20)", padding: "12px 16px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "var(--color-error-hover)", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { value: stats.total ?? entregas.length, label: "Total",       color: "var(--color-text)" },
          { value: stats.enviadas   ?? 0,           label: "Enviadas",   color: "var(--color-primary)"           },
          { value: stats.tarde      ?? 0,           label: "Tarde",      color: "var(--color-error-hover)"           },
          { value: stats.calificadas ?? 0,          label: "Calificadas",color: "var(--edu-green-600)"           },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)", padding: "14px 20px", textAlign: "center", minWidth: 110 }}>
            <p style={{ fontSize: 26, fontWeight: 800, color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ────────────────────────────────────────────── */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 14,
        border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          <Search style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: "var(--color-text)", background: "transparent" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        <select
          value={filterEst}
          onChange={e => setFilterEst(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, cursor: "pointer", outline: "none" }}
        >
          <option value="">Todos los estados</option>
          <option value="enviada">Enviada</option>
          <option value="tarde">Tarde</option>
          <option value="calificada">Calificada</option>
          <option value="borrador">Borrador</option>
        </select>
      </div>

      {/* ── Lista de entregas ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || filterEst ? "Sin resultados" : "Sin entregas todavía"}
          desc={!search && !filterEst ? "Las entregas de los padres aparecerán aquí" : undefined}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(e => (
            <EntregaCard key={e._id} entrega={e} onCalificar={() => openCalificar(e)} />
          ))}
        </div>
      )}

      {/* ══ Modal — Calificar ════════════════════════════════════ */}
      <Modal
        isOpen={showCal}
        onClose={() => setShowCal(false)}
        title={calTarget?.calificacion ? "Actualizar calificación" : "Calificar entrega"}
        size="sm"
      >
        {calTarget && (
          <form onSubmit={handleCalificar}>
            {/* Info del padre */}
            <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                {calTarget.padre?.nombre ?? ""} {calTarget.padre?.apellido ?? ""}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                Enviada:{" "}
                {calTarget.fechaEnvio
                  ? new Date(calTarget.fechaEnvio).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </p>
            </div>

            {/* Valoración actual */}
            {calTarget.calificacion && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(22,163,74,0.08)", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
                <StarRating value={calTarget.calificacion.valoracion} size={14} showLabel />
              </div>
            )}

            {/* Respuesta de texto */}
            {calTarget.textoRespuesta && (
              <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", margin: "0 0 4px", textTransform: "uppercase" }}>Respuesta:</p>
                <p style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0 }}>{calTarget.textoRespuesta}</p>
              </div>
            )}

            {/* Archivos adjuntos */}
            {calTarget.archivos?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", margin: "0 0 8px", textTransform: "uppercase" }}>Archivos:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {calTarget.archivos.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 11.5, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
                      <FileText style={{ width: 12, height: 12 }} />
                      {a.nombre || `Archivo ${i + 1}`}
                      <ExternalLink style={{ width: 10, height: 10 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Valoración (1-5 estrellas) *">
                <StarRatingInput
                  value={calForm.valoracion}
                  onChange={v => setCalForm(p => ({ ...p, valoracion: v }))}
                />
              </Field>
              <Field label="Comentario">
                <Input
                  as="textarea"
                  value={calForm.comentario}
                  onChange={e => setCalForm(p => ({ ...p, comentario: e.target.value }))}
                  placeholder="Retroalimentación para el padre/tutor..."
                  rows={3}
                />
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button variant="ghost" type="button" onClick={() => setShowCal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
                {calTarget.calificacion ? "Actualizar" : "Calificar"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ─── EntregaCard ──────────────────────────────────────────────────────────────

function EntregaCard({ entrega: e, onCalificar }) {
  const [expanded, setExpanded] = useState(false);
  const estadoCfg = ESTADO_CFG[e.estado] ?? ESTADO_CFG.enviada;

  const padreNombre = e.padre
    ? `${e.padre.nombre ?? ""} ${e.padre.apellido ?? ""}`.trim() || "Sin nombre"
    : "Sin nombre";

  const fecha    = e.fechaEnvio ?? e.createdAt;
  const archivos = e.archivos ?? e.archivosAdjuntos ?? [];

  return (
    <div style={{
      background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
      overflow: "hidden",
    }}>
      <div
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(12,106,196,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "var(--color-primary)", flexShrink: 0,
        }}>
          {(e.padre?.nombre?.[0] ?? "P").toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{padreNombre}</p>
            <Badge variant={ESTADO_BADGE[e.estado] ?? "info"} size="sm">
              {estadoCfg.label}
            </Badge>
            {e.calificacion && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 9px", borderRadius: 999, background: "var(--color-success-light)", boxShadow: "var(--clay-pill)" }}>
                <StarRating value={e.calificacion.valoracion} size={11} />
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>
            {fecha
              ? new Date(fecha).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
              : "—"}
            {archivos.length > 0 && ` · ${archivos.length} adjunto${archivos.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={ev => { ev.stopPropagation(); onCalificar(); }}
            style={{ color: e.calificacion ? "var(--edu-green-600)" : "var(--color-primary)" }}
          >
            <Star style={{ width: 12, height: 12 }} />
            {e.calificacion ? "Actualizar" : "Calificar"}
          </Button>
          {expanded
            ? <ChevronUp style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
            : <ChevronDown style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />}
        </div>
      </div>

      {/* Contenido expandido */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 18px", background: "var(--color-bg)" }}>
          {e.textoRespuesta && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Respuesta</p>
              <p style={{ fontSize: 13.5, color: "var(--color-text)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{e.textoRespuesta}</p>
            </div>
          )}

          {archivos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Archivos adjuntos</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {archivos.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 12.5, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                    <FileText style={{ width: 13, height: 13 }} />
                    {a.nombre ?? a.nombreOriginal ?? `Archivo ${i + 1}`}
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {e.calificacion && (
            <div style={{ background: "rgba(22,163,74,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(22,163,74,0.15)" }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--edu-green-600)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Calificación</p>
              <StarRating value={e.calificacion.valoracion} size={16} showLabel />
              {e.calificacion.comentario && (
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 6 }}>{e.calificacion.comentario}</p>
              )}
            </div>
          )}

          {!e.textoRespuesta && archivos.length === 0 && !e.calificacion && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>Sin contenido adicional</p>
          )}
        </div>
      )}
    </div>
  );
}
