// src/features/cursos/pages/CursoDetallePage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Users, Edit2, Upload, Plus, Trash2,
  RefreshCw, Loader2, CheckCircle2, AlertCircle, X, Eye, EyeOff,
  GraduationCap, FileText, MoreHorizontal,
} from "lucide-react";
import letrasImg from "@/assets/img/letras.png";
import {
  cursosGetById, cursosUpdate,
  modulosGetByCurso, modulosCreate, modulosUpdate, modulosDelete, modulosRestore,
  cursosGetParticipantes, cursosAddParticipante, cursosRemoveParticipante, cursosAddParticipantesCsv,
} from "@/lib/apiClient";
import Modal from "@/components/ui/Modal";
import { normalizeCurso, normalizeUser } from "@/lib/normalizers";
import UserAvatar from "@/components/ui/UserAvatar";
import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";
import { normalizePhone } from "@/utils/normalizePhone";

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

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required, as: As = "input", rows }) {
  const [f, setF] = useState(false);
  const props = { value, onChange, placeholder, required, onFocus: () => setF(true), onBlur: () => setF(false), style: { width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms", resize: As === "textarea" ? "vertical" : undefined } };
  return As === "textarea" ? <textarea {...props} rows={rows ?? 3} /> : <input type={type} {...props} />;
}

const TABS = ["Módulos", "Participantes"];

export default function CursoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setUsers = useUserStore((s) => s.setUsers);

  const [curso,   setCurso]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState(0);
  const [toast,   setToast]   = useState({ msg: "", type: "success" });

  // ── Módulos state ─────────────────────────────────────────────
  const [modulos,       setModulos]       = useState([]);
  const [modulosLoad,   setModulosLoad]   = useState(false);
  const [showInactivos, setShowInactivos] = useState(false);
  const [showModCreate, setShowModCreate] = useState(false);
  const [showModEdit,   setShowModEdit]   = useState(false);
  const [modForm,       setModForm]       = useState({ titulo: "", descripcion: "" });
  const [editingMod,    setEditingMod]    = useState(null);
  const [savingMod,     setSavingMod]     = useState(false);

  // ── Participantes state ───────────────────────────────────────
  const [partic,       setPartic]       = useState([]);
  const [particLoad,   setParticLoad]   = useState(false);
  const [showAddPartic, setShowAddPartic] = useState(false);
  const [particForm,   setParticForm]   = useState({ nombre: "", apellido: "", cedula: "", telefono: "" });
  const [savingPartic, setSavingPartic] = useState(false);
  const [showCsvPartic, setShowCsvPartic] = useState(false);
  const csvRef = useRef(null);
  const [csvFile,    setCsvFile]    = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult,  setCsvResult]  = useState(null);

  // ── Edit curso state ─────────────────────────────────────────
  const [showEditCurso, setShowEditCurso] = useState(false);
  const [cursoForm,     setCursoForm]     = useState({ nombre: "", descripcion: "" });
  const [coverFile,     setCoverFile]     = useState(null);
  const [savingCurso,   setSavingCurso]   = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // Load course
  useEffect(() => {
    (async () => {
      try {
        const data = await cursosGetById(id);
        const c = normalizeCurso(data.curso ?? data);
        setCurso(c);
        setCursoForm({ nombre: c.nombre ?? "", descripcion: c.descripcion ?? "" });
      } catch {
        notify("Error al cargar el curso", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Load modules
  const loadModulos = useCallback(async () => {
    setModulosLoad(true);
    try {
      const data = await modulosGetByCurso(id, showInactivos ? { incluirInactivos: true } : {});
      setModulos(data.modulos ?? data ?? []);
    } catch {
      notify("Error al cargar módulos", "error");
    } finally {
      setModulosLoad(false);
    }
  }, [id, showInactivos]);

  // Load participants
  const loadPartic = useCallback(async () => {
    setParticLoad(true);
    try {
      const data = await cursosGetParticipantes(id, { limit: 50 });
      const normalized = (data.participantes ?? data.users ?? []).map(p => ({
        ...p,
        usuario: normalizeUser(p.usuario ?? p),
      }));
      setPartic(normalized);
      setUsers(normalized.map(p => p.usuario));
    } catch {
      notify("Error al cargar participantes", "error");
    } finally {
      setParticLoad(false);
    }
  }, [id, setUsers]);

  useEffect(() => { if (tab === 0) loadModulos(); }, [tab, loadModulos]);
  useEffect(() => { if (tab === 1) loadPartic();  }, [tab, loadPartic]);

  // ── Módulo handlers ───────────────────────────────────────────
  const handleModCreate = async (e) => {
    e.preventDefault();
    setSavingMod(true);
    try {
      await modulosCreate({ cursoId: id, ...modForm });
      notify("Módulo creado");
      setShowModCreate(false);
      setModForm({ titulo: "", descripcion: "" });
      loadModulos();
    } catch (err) {
      notify(humanizeError(err, "Error al crear módulo"), "error");
    } finally {
      setSavingMod(false);
    }
  };

  const handleModEdit = async (e) => {
    e.preventDefault();
    setSavingMod(true);
    try {
      await modulosUpdate(editingMod._id, modForm);
      notify("Módulo actualizado");
      setShowModEdit(false);
      loadModulos();
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar módulo"), "error");
    } finally {
      setSavingMod(false);
    }
  };

  const openEditMod = (mod) => {
    setEditingMod(mod);
    setModForm({ titulo: mod.titulo, descripcion: mod.descripcion ?? "" });
    setShowModEdit(true);
  };

  const handleModToggle = async (mod) => {
    try {
      if (mod.estado === "inactivo") {
        await modulosRestore(mod._id);
        notify("Módulo restaurado");
      } else {
        await modulosDelete(mod._id);
        notify("Módulo desactivado");
      }
      loadModulos();
    } catch (err) {
      notify(humanizeError(err, "Ocurrió un error"), "error");
    }
  };

  // ── Participante handlers ─────────────────────────────────────
  const handleAddPartic = async (e) => {
    e.preventDefault();
    setSavingPartic(true);
    try {
      await cursosAddParticipante(id, {
        ...particForm,
        telefono: normalizePhone(particForm.telefono),
      });
      notify("Participante agregado");
      setShowAddPartic(false);
      setParticForm({ nombre: "", apellido: "", cedula: "", telefono: "" });
      loadPartic();
    } catch (err) {
      notify(humanizeError(err, "Error al agregar participante"), "error");
    } finally {
      setSavingPartic(false);
    }
  };

  const handleRemovePartic = async (userId) => {
    if (!window.confirm("¿Eliminar este participante del curso?")) return;
    try {
      await cursosRemoveParticipante(id, userId);
      notify("Participante eliminado");
      loadPartic();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar"), "error");
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    try {
      const fd = new FormData();
      fd.append("archivoCSV", csvFile);
      const res = await cursosAddParticipantesCsv(id, fd);
      setCsvResult(res);
      notify(`Importación: ${res.exitosos ?? 0} exitosos`);
      if ((res.exitosos ?? 0) > 0) loadPartic();
    } catch (err) {
      notify(humanizeError(err, "Error en importación"), "error");
    } finally {
      setCsvLoading(false);
    }
  };

  // ── Curso edit handler ────────────────────────────────────────
  const handleEditCurso = async (e) => {
    e.preventDefault();
    setSavingCurso(true);
    try {
      const fd = new FormData();
      fd.append("nombre", cursoForm.nombre);
      fd.append("descripcion", cursoForm.descripcion);
      if (coverFile) fd.append("fotoPortada", coverFile);
      const data = await cursosUpdate(id, fd);
      setCurso(normalizeCurso(data.curso ?? data));
      notify("Curso actualizado");
      setShowEditCurso(false);
      setCoverFile(null);
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar curso"), "error");
    } finally {
      setSavingCurso(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Sk h={36} w={36} r={99} /><div style={{ flex: 1 }}><Sk h={22} w="60%" /><div style={{ marginTop: 8 }}><Sk h={13} w="40%" /></div></div>
      </div>
      {[0,1,2].map(i => <div key={i} style={{ marginBottom: 12 }}><Sk h={64} r={14} /></div>)}
    </div>
  );

  if (!curso) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ color: "var(--color-text-muted)", fontSize: 15 }}>Curso no encontrado.</p>
      <button onClick={() => navigate("/cursos")} style={{ marginTop: 16, padding: "9px 20px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, cursor: "pointer" }}>Volver</button>
    </div>
  );

  const docenteNombre = curso.docente ? `${curso.docente.nombre ?? ""} ${curso.docente.apellido ?? ""}`.trim() : "—";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Cover image banner ─────────────────────────────────── */}
      <div style={{
        height: 160, borderRadius: 16, overflow: "hidden",
        marginBottom: 20, position: "relative",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img
          src={curso.fotoPortada || letrasImg}
          alt={curso.nombre ?? "Curso"}
          onError={e => { e.target.onerror = null; e.target.src = letrasImg; e.target.style.objectFit = "contain"; e.target.style.opacity = "0.4"; e.target.style.padding = "24px"; }}
          style={{
            width: "100%", height: "100%",
            objectFit: curso.fotoPortada ? "cover" : "contain",
            opacity: curso.fotoPortada ? 1 : 0.4,
            padding: curso.fotoPortada ? 0 : 24,
          }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate("/cursos")} style={{ padding: "8px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)", flexShrink: 0, marginTop: 4 }}>
          <ArrowLeft style={{ width: 17, height: 17 }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{curso.nombre}</h1>
            <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: curso.estado === "activo" ? "rgba(22,163,74,0.10)" : "rgba(148,163,184,0.15)", color: curso.estado === "activo" ? "#16A34A" : "#64748B" }}>
              {curso.estado === "activo" ? "Activo" : "Archivado"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
            {docenteNombre && `Docente: ${docenteNombre}`}
            {curso.descripcion && ` · ${curso.descripcion}`}
          </p>
        </div>
        <button onClick={() => setShowEditCurso(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          <Edit2 style={{ width: 14, height: 14 }} /> Editar
        </button>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-border)", marginBottom: 24, gap: 2 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: "10px 20px", fontSize: 13.5, fontWeight: tab === i ? 700 : 500, color: tab === i ? "#0C6AC4" : "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", borderBottom: `2px solid ${tab === i ? "#0C6AC4" : "transparent"}`, marginBottom: -2, transition: "all 150ms" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 0 — MÓDULOS
          ══════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={loadModulos} title="Actualizar" style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
                <RefreshCw style={{ width: 14, height: 14 }} />
              </button>
              <button onClick={() => setShowInactivos(!showInactivos)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--color-border)", background: showInactivos ? "rgba(12,106,196,0.08)" : "var(--color-surface)", color: showInactivos ? "#0C6AC4" : "var(--color-text-muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                {showInactivos ? <Eye style={{ width: 13, height: 13 }} /> : <EyeOff style={{ width: 13, height: 13 }} />}
                {showInactivos ? "Ocultar inactivos" : "Ver inactivos"}
              </button>
            </div>
            <button onClick={() => { setModForm({ titulo: "", descripcion: "" }); setShowModCreate(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
              <Plus style={{ width: 16, height: 16 }} /> Nuevo módulo
            </button>
          </div>

          {modulosLoad ? (
            [0,1,2].map(i => <div key={i} style={{ marginBottom: 10 }}><Sk h={76} r={14} /></div>)
          ) : modulos.length === 0 ? (
            <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "52px 24px", textAlign: "center" }}>
              <BookOpen style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin módulos</p>
              <p style={{ fontSize: 13, color: "var(--color-text-subtle)", marginTop: 4 }}>Crea el primer módulo de este curso</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modulos.map((mod, idx) => (
                <ModuloCard key={mod._id} mod={mod} idx={idx} onEdit={() => openEditMod(mod)} onToggle={() => handleModToggle(mod)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 1 — PARTICIPANTES
          ══════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{partic.length} participante{partic.length !== 1 ? "s" : ""} inscritos</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setCsvFile(null); setCsvResult(null); setShowCsvPartic(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1.5px solid #0C6AC4", background: "transparent", color: "#0C6AC4", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Upload style={{ width: 14, height: 14 }} /> Importar CSV
              </button>
              <button onClick={() => { setParticForm({ nombre: "", apellido: "", cedula: "", telefono: "" }); setShowAddPartic(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
                <Plus style={{ width: 16, height: 16 }} /> Agregar padre
              </button>
            </div>
          </div>

          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            {particLoad ? (
              <div style={{ padding: 20 }}>{[0,1,2,3].map(i => <div key={i} style={{ marginBottom: 12 }}><Sk h={48} r={10} /></div>)}</div>
            ) : partic.length === 0 ? (
              <div style={{ padding: "52px 24px", textAlign: "center" }}>
                <Users style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin participantes</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    {["Nombre", "Cédula", "Teléfono", "Estado", ""].map((h, i) => (
                      <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partic.map((p) => {
                    const u = p.usuario ?? p;
                    const etiq = p.etiqueta ?? "";
                    if (etiq === "docente") return null;
                    return (
                      <tr key={u._id ?? p._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <UserAvatar user={u} size={30} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{u.nombre} {u.apellido}</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{u.cedula ?? "—"}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{u.telefono ?? "—"}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: u.estado === "activo" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)", color: u.estado === "activo" ? "#16A34A" : "#DC2626" }}>{u.estado === "activo" ? "Activo" : "Suspendido"}</span>
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "right" }}>
                          <button onClick={() => handleRemovePartic(u._id)} title="Eliminar del curso" style={{ padding: "5px 8px", borderRadius: 8, border: "none", background: "rgba(220,38,38,0.08)", color: "#DC2626", cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════════════ */}

      {/* Edit curso */}
      <Modal isOpen={showEditCurso} onClose={() => setShowEditCurso(false)} title="Editar curso" size="md">
        <form onSubmit={handleEditCurso}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldGroup label="Nombre *">
              <StyledInput value={cursoForm.nombre} onChange={e => setCursoForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Matemáticas 5°" required />
            </FieldGroup>
            <FieldGroup label="Descripción">
              <StyledInput as="textarea" value={cursoForm.descripcion} onChange={e => setCursoForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del curso..." rows={3} />
            </FieldGroup>
            <FieldGroup label="Foto de portada">
              <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} style={{ fontSize: 13, color: "var(--color-text-muted)" }} />
              {coverFile && <p style={{ fontSize: 12, color: "#16A34A", marginTop: 4 }}>Seleccionado: {coverFile.name}</p>}
            </FieldGroup>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setShowEditCurso(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={savingCurso} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: savingCurso ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: savingCurso ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {savingCurso && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Create módulo */}
      <Modal isOpen={showModCreate} onClose={() => setShowModCreate(false)} title="Nuevo módulo" size="sm">
        <form onSubmit={handleModCreate}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldGroup label="Título *"><StyledInput value={modForm.titulo} onChange={e => setModForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Unidad 1: Introducción" required /></FieldGroup>
            <FieldGroup label="Descripción"><StyledInput as="textarea" value={modForm.descripcion} onChange={e => setModForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del módulo..." rows={3} /></FieldGroup>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setShowModCreate(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={savingMod} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: savingMod ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: savingMod ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {savingMod && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Crear módulo
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit módulo */}
      <Modal isOpen={showModEdit} onClose={() => setShowModEdit(false)} title="Editar módulo" size="sm">
        <form onSubmit={handleModEdit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldGroup label="Título *"><StyledInput value={modForm.titulo} onChange={e => setModForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Unidad 1: Introducción" required /></FieldGroup>
            <FieldGroup label="Descripción"><StyledInput as="textarea" value={modForm.descripcion} onChange={e => setModForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del módulo..." rows={3} /></FieldGroup>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setShowModEdit(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={savingMod} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: savingMod ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: savingMod ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {savingMod && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Add participante */}
      <Modal isOpen={showAddPartic} onClose={() => setShowAddPartic(false)} title="Agregar padre/tutor" description="Si el padre ya tiene cuenta se agrega directamente por cédula." size="sm">
        <form onSubmit={handleAddPartic}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Nombre *"><StyledInput value={particForm.nombre} onChange={e => setParticForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Juan" required /></FieldGroup>
            <FieldGroup label="Apellido *"><StyledInput value={particForm.apellido} onChange={e => setParticForm(p => ({ ...p, apellido: e.target.value }))} placeholder="Pérez" required /></FieldGroup>
            <FieldGroup label="Cédula *"><StyledInput value={particForm.cedula} onChange={e => setParticForm(p => ({ ...p, cedula: e.target.value }))} placeholder="12345678" required /></FieldGroup>
            <FieldGroup label="Teléfono"><StyledInput value={particForm.telefono} onChange={e => setParticForm(p => ({ ...p, telefono: e.target.value }))} placeholder="3001234567" /></FieldGroup>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10 }}>Contraseña inicial: cédula + "Aa"</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setShowAddPartic(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={savingPartic} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: savingPartic ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: savingPartic ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {savingPartic && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Agregar
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV import participantes */}
      <Modal isOpen={showCsvPartic} onClose={() => { setShowCsvPartic(false); setCsvFile(null); setCsvResult(null); }} title="Importar padres por CSV" description="Columnas: nombre, apellido, cedula, telefono" size="md">
        {!csvResult ? (
          <div>
            <div onClick={() => csvRef.current?.click()} style={{ border: `2px dashed ${csvFile ? "#16A34A" : "var(--color-border)"}`, borderRadius: 14, padding: "28px 24px", textAlign: "center", cursor: "pointer", background: csvFile ? "rgba(22,163,74,0.04)" : "var(--color-bg)" }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".csv")) setCsvFile(f); }}>
              <Upload style={{ width: 26, height: 26, color: csvFile ? "#16A34A" : "var(--color-text-muted)", margin: "0 auto 8px" }} />
              {csvFile ? <p style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", margin: 0 }}>{csvFile.name}</p> : <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>Arrastra un CSV o haz clic</p>}
              <input ref={csvRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => setCsvFile(e.target.files[0])} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowCsvPartic(false); setCsvFile(null); }} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleCsvUpload} disabled={!csvFile || csvLoading} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: (!csvFile || csvLoading) ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: (!csvFile || csvLoading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {csvLoading && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
                Importar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[{ label: "Exitosos", val: csvResult.exitosos, color: "#16A34A", bg: "rgba(22,163,74,0.10)" }, { label: "Duplicados", val: csvResult.duplicados, color: "#D97706", bg: "rgba(217,119,6,0.10)" }, { label: "Errores", val: csvResult.errores, color: "#DC2626", bg: "rgba(220,38,38,0.10)" }, { label: "Total", val: csvResult.total, color: "#0C6AC4", bg: "rgba(12,106,196,0.10)" }].map(({ label, val, color, bg }) => (
                <div key={label} style={{ borderRadius: 12, background: bg, padding: "12px 14px", textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0 }}>{val}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowCsvPartic(false); setCsvFile(null); setCsvResult(null); }} style={{ width: "100%", padding: 10, borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cerrar</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ModuloCard({ mod, idx, onEdit, onToggle }) {
  const [hov, setHov] = useState(false);
  const inactive = mod.estado === "inactivo";
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: "var(--color-surface)", borderRadius: 14, border: `1px solid ${hov ? "rgba(12,106,196,0.25)" : "var(--color-border)"}`, boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, opacity: inactive ? 0.6 : 1, transition: "all 180ms" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: inactive ? "rgba(148,163,184,0.15)" : "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <BookOpen style={{ width: 16, height: 16, color: inactive ? "#94A3B8" : "#0C6AC4" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{mod.titulo}</p>
        {mod.descripcion && <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mod.descripcion}</p>}
      </div>
      {inactive && <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: "rgba(148,163,184,0.15)", color: "#64748B" }}>Inactivo</span>}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onEdit} title="Editar" style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>
          <Edit2 style={{ width: 12, height: 12 }} /> Editar
        </button>
        <button onClick={onToggle} title={inactive ? "Restaurar" : "Desactivar"} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: inactive ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.08)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: inactive ? "#16A34A" : "#DC2626" }}>
          {inactive ? <Eye style={{ width: 12, height: 12 }} /> : <EyeOff style={{ width: 12, height: 12 }} />}
          {inactive ? "Restaurar" : "Desactivar"}
        </button>
      </div>
    </div>
  );
}

