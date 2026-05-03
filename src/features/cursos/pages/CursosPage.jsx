// src/features/cursos/pages/CursosPage.jsx
// ROL: Administrador / Docente — gestión de cursos
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers, Plus, Search, Edit2, Archive, Users, ChevronLeft,
  ChevronRight, AlertCircle, UserPlus, UserMinus, Upload,
} from "lucide-react";
import letrasImg from "@/assets/img/letras.png";
import Modal from "@/components/ui/Modal";
import {
  cursosGetAll, cursosGetMine, cursosCreate, cursosUpdate, cursosDelete,
  cursosGetParticipantes, cursosAddParticipante, cursosRemoveParticipante,
  usersGetAll,
} from "@/lib/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";
import { normalizeCurso, normalizeUser } from "@/lib/normalizers";
import UserAvatar from "@/components/ui/UserAvatar";
import { humanizeError } from "@/utils/humanizeError";

const LIMIT = 12;

const CARD_COLORS = [
  "#0C6AC4","#6366F1","#16A34A","#D97706",
  "#DC2626","#8B5CF6","#0891B2","#EC4899",
];

const ESTADO_META = {
  activo:    { label: "Activo",    color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  archivado: { label: "Archivado", color: "#D97706", bg: "rgba(217,119,6,0.1)" },
};

/* ── Micro-components ─────────────────────────────────────────── */
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

function Sk({ h = 16, w = "100%", r = 7 }) {
  return (
    <div className="animate-pulse" style={{
      height: h, width: w, borderRadius: r, background: "var(--color-border)",
    }} />
  );
}

function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] ?? { label: estado, color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: m.bg, color: m.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700,
        color: "var(--color-text-muted)", textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StInput({ style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1.5px solid var(--color-border)", background: "var(--color-bg)",
        color: "var(--color-text)", fontSize: 13.5, outline: "none",
        transition: "border-color 0.15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = "#0C6AC4")}
      onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
    />
  );
}

function StTextarea({ ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1.5px solid var(--color-border)", background: "var(--color-bg)",
        color: "var(--color-text)", fontSize: 13.5, outline: "none",
        resize: "vertical", fontFamily: "inherit", transition: "border-color 0.15s",
      }}
      onFocus={e => (e.target.style.borderColor = "#0C6AC4")}
      onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
    />
  );
}

function StSelect({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1.5px solid var(--color-border)", background: "var(--color-bg)",
        color: "var(--color-text)", fontSize: 13.5, outline: "none", cursor: "pointer",
      }}
      onFocus={e => (e.target.style.borderColor = "#0C6AC4")}
      onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
    >
      {children}
    </select>
  );
}

function BtnPrimary({ children, onClick, type = "button", disabled }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{
        background: disabled ? "var(--color-border)" : "#0C6AC4",
        color: "white", border: "none", padding: "9px 20px", borderRadius: 8,
        fontSize: 13.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick, danger }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        background: "transparent",
        color: danger ? "#DC2626" : "var(--color-text-muted)",
        border: `1.5px solid ${danger ? "rgba(220,38,38,0.3)" : "var(--color-border)"}`,
        padding: "9px 20px", borderRadius: 8,
        fontSize: 13.5, fontWeight: 600, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function CursosPage() {
  const { user } = useAuth();
  const { registerSearchHandler } = useSearch();
  const isDocente = user?.rol === "docente";

  const [cursos,  setCursos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState("");
  const [debSearch, setDebSearch] = useState("");
  const [toast,   setToast]   = useState({ msg: "", type: "success" });
  const [saving,  setSaving]  = useState(false);

  // Modals
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [participOpen, setParticipOpen] = useState(false);
  const [addPartOpen,  setAddPartOpen]  = useState(false);
  const [selected,     setSelected]     = useState(null);

  // Docentes for selector
  const [docentes, setDocentes] = useState([]);

  // Participants
  const [parts,        setParts]        = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  // Forms
  const [createForm,     setCreateForm]     = useState({ nombre: "", descripcion: "", docenteId: "" });
  const [createCoverFile, setCreateCoverFile] = useState(null);
  const createCoverRef = useRef(null);
  const [editForm,       setEditForm]       = useState({ nombre: "", descripcion: "" });
  const [editCoverFile,   setEditCoverFile]   = useState(null);
  const editCoverRef = useRef(null);
  const [addForm,        setAddForm]        = useState({ nombre: "", apellido: "", cedula: "", telefono: "" });

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debSearch]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = isDocente
        ? await cursosGetMine({ page, limit: LIMIT })
        : await cursosGetAll({ page, limit: LIMIT });
      setCursos((res.cursos ?? res.data ?? []).map(normalizeCurso));
      setTotal(res.pagination?.total ?? res.cursos?.length ?? 0);
    } catch { notify("Error al cargar cursos", "error"); }
    finally { setLoading(false); }
  }, [page, isDocente, user]);

  useEffect(() => { load(); }, [load]);

  // Registrar búsqueda global
  useEffect(() => {
    const unregister = registerSearchHandler("cursos", (q) => {
      const query = q.toLowerCase();
      const filtered = cursos.filter(c =>
        c.nombre?.toLowerCase().includes(query) ||
        c.descripcion?.toLowerCase().includes(query)
      );
      return { cursos: filtered.slice(0, 5) }; // Limitar a 5 resultados
    });
    return unregister;
  }, [cursos, registerSearchHandler]);

  useEffect(() => {
    if (!user || isDocente) return;
    usersGetAll({ rol: "docente", limit: 100 })
      .then(r => setDocentes((r.users ?? []).map(normalizeUser)))
      .catch(() => {});
  }, [user, isDocente]);

  const loadParts = useCallback(async (id) => {
    setPartsLoading(true);
    try {
      const res = await cursosGetParticipantes(id, { limit: 100 });
      setParts((res.participantes ?? res.data ?? []).map(p => ({ ...p, usuario: normalizeUser(p.usuario ?? p) })));
    } catch { notify("Error al cargar participantes", "error"); }
    finally { setPartsLoading(false); }
  }, []);

  const filtered = debSearch
    ? cursos.filter(c =>
        c.nombre?.toLowerCase().includes(debSearch.toLowerCase()) ||
        c.docente?.nombre?.toLowerCase().includes(debSearch.toLowerCase())
      )
    : cursos;

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* ── CRUD handlers ──────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.nombre.trim()) {
      notify("El nombre del curso es requerido", "error"); return;
    }
    if (!isDocente && !createForm.docenteId) {
      notify("Selecciona un docente", "error"); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("nombre", createForm.nombre.trim());
      if (createForm.descripcion.trim()) fd.append("descripcion", createForm.descripcion.trim());
      fd.append("docenteId", isDocente ? (user._id ?? user.id) : createForm.docenteId);
      if (createCoverFile) fd.append("fotoPortada", createCoverFile);
      await cursosCreate(fd);
      notify("Curso creado exitosamente");
      setCreateOpen(false);
      setCreateForm({ nombre: "", descripcion: "", docenteId: "" });
      setCreateCoverFile(null);
      load();
    } catch (err) { notify(humanizeError(err, "Error al crear curso"), "error"); }
    finally { setSaving(false); }
  };

  const openEdit = (c) => {
    setSelected(c);
    setEditForm({ nombre: c.nombre ?? "", descripcion: c.descripcion ?? "" });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.nombre.trim()) { notify("El nombre es requerido", "error"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("nombre", editForm.nombre.trim());
      fd.append("descripcion", editForm.descripcion.trim());
      if (editCoverFile) fd.append("fotoPortada", editCoverFile);
      await cursosUpdate(selected._id, fd);
      notify("Curso actualizado");
      setEditOpen(false);
      setEditCoverFile(null);
      load();
    } catch (err) { notify(humanizeError(err, "Error al actualizar"), "error"); }
    finally { setSaving(false); }
  };

  const openArchive = (c) => { setSelected(c); setArchiveOpen(true); };
  const handleArchive = async () => {
    setSaving(true);
    try {
      await cursosDelete(selected._id);
      notify("Curso archivado");
      setArchiveOpen(false);
      load();
    } catch (err) { notify(humanizeError(err, "Error al archivar"), "error"); }
    finally { setSaving(false); }
  };

  const openParts = (c) => {
    setSelected(c);
    setParticipOpen(true);
    loadParts(c._id);
  };

  const handleRemovePart = async (userId) => {
    try {
      await cursosRemoveParticipante(selected._id, userId);
      notify("Participante eliminado");
      loadParts(selected._id);
    } catch (err) { notify(humanizeError(err, "Error al eliminar"), "error"); }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    const { nombre, apellido, cedula, telefono } = addForm;
    if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !telefono.trim()) {
      notify("Todos los campos son requeridos", "error"); return;
    }
    setSaving(true);
    try {
      await cursosAddParticipante(selected._id, { ...addForm, contrasena: cedula });
      notify("Participante agregado");
      setAddPartOpen(false);
      setAddForm({ nombre: "", apellido: "", cedula: "", telefono: "" });
      loadParts(selected._id);
    } catch (err) { notify(humanizeError(err, "Error al agregar participante"), "error"); }
    finally { setSaving(false); }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast {...toast} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers style={{ width: 19, height: 19, color: "#0C6AC4" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Cursos</h1>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>{total} cursos en total</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#0C6AC4", color: "white", border: "none",
            padding: "9px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Plus style={{ width: 15, height: 15 }} /> Nuevo curso
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 18, maxWidth: 340 }}>
        <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-text-muted)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar curso o docente..."
          style={{
            width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
            borderRadius: 9, border: "1.5px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                {["Curso", "Docente", "Participantes", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4,5].map(i => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {[0,1,2,3,4].map(j => (
                      <td key={j} style={{ padding: "13px 16px" }}><Sk h={14} w={j === 4 ? 80 : "80%"} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <AlertCircle style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
                    <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>No hay cursos</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr
                    key={c._id}
                    style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={c.fotoPortada || letrasImg}
                          alt={c.nombre ?? "Curso"}
                          onError={e => { e.target.onerror = null; e.target.src = letrasImg; }}
                          style={{
                            width: 32, height: 32, borderRadius: 7, objectFit: "cover",
                            border: "1px solid var(--color-border)", flexShrink: 0,
                            background: "var(--color-bg)",
                          }}
                        />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)" }}>{c.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
                      {c.docente ? `${c.docente.nombre} ${c.docente.apellido}`.trim() || "—" : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
                      {c.participantes?.length ?? c.totalParticipantes ?? "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <EstadoBadge estado={c.estado ?? "activo"} />
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          title="Participantes" onClick={() => openParts(c)}
                          style={{ background: "rgba(12,106,196,0.1)", border: "none", borderRadius: 7, padding: 7, cursor: "pointer", display: "flex" }}
                        >
                          <Users style={{ width: 14, height: 14, color: "#0C6AC4" }} />
                        </button>
                        <button
                          title="Editar" onClick={() => openEdit(c)}
                          style={{ background: "rgba(99,102,241,0.1)", border: "none", borderRadius: 7, padding: 7, cursor: "pointer", display: "flex" }}
                        >
                          <Edit2 style={{ width: 14, height: 14, color: "#6366F1" }} />
                        </button>
                        <button
                          title="Archivar" onClick={() => openArchive(c)}
                          style={{ background: "rgba(217,119,6,0.1)", border: "none", borderRadius: 7, padding: 7, cursor: "pointer", display: "flex" }}
                        >
                          <Archive style={{ width: 14, height: 14, color: "#D97706" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
              Página {page} de {totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: "none", border: "1.5px solid var(--color-border)", borderRadius: 7, padding: "5px 10px", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex" }}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: "none", border: "1.5px solid var(--color-border)", borderRadius: 7, padding: "5px 10px", cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex" }}
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo curso" size="md">
        <form onSubmit={handleCreate}>
          <Field label="Nombre del curso *">
            <StInput
              value={createForm.nombre}
              onChange={e => setCreateForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Matemáticas 5°"
              required
            />
          </Field>
          <Field label="Descripción">
            <StTextarea
              value={createForm.descripcion}
              onChange={e => setCreateForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción del curso (opcional)"
              rows={3}
            />
          </Field>
          {!isDocente && (
            <Field label="Docente *">
              <StSelect
                value={createForm.docenteId}
                onChange={e => setCreateForm(f => ({ ...f, docenteId: e.target.value }))}
                required
              >
                <option value="">Seleccionar docente...</option>
                {docentes.map(d => (
                  <option key={d._id} value={d._id}>{d.nombre} {d.apellido}</option>
                ))}
              </StSelect>
            </Field>
          )}
          <Field label="Imagen de portada">
            <input ref={createCoverRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => setCreateCoverFile(e.target.files[0] ?? null)} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => createCoverRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: "1.5px dashed var(--color-border)",
                  background: "transparent", cursor: "pointer", fontSize: 12.5, color: "var(--color-text-muted)",
                }}>
                <Upload style={{ width: 13, height: 13 }} />
                {createCoverFile ? createCoverFile.name : "Subir imagen"}
              </button>
              {createCoverFile && (
                <img src={URL.createObjectURL(createCoverFile)} alt="preview"
                  style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover", border: "1px solid var(--color-border)" }} />
              )}
            </div>
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <BtnOutline onClick={() => setCreateOpen(false)}>Cancelar</BtnOutline>
            <BtnPrimary type="submit" disabled={saving}>{saving ? "Creando..." : "Crear curso"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar curso" size="md">
        <form onSubmit={handleEdit}>
          <Field label="Nombre del curso *">
            <StInput
              value={editForm.nombre}
              onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
              required
            />
          </Field>
          <Field label="Descripción">
            <StTextarea
              value={editForm.descripcion}
              onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
            />
          </Field>
          <Field label="Imagen de portada">
            <input ref={editCoverRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => setEditCoverFile(e.target.files[0] ?? null)} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => editCoverRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: "1.5px dashed var(--color-border)",
                  background: "transparent", cursor: "pointer", fontSize: 12.5, color: "var(--color-text-muted)",
                }}>
                <Upload style={{ width: 13, height: 13 }} />
                {editCoverFile ? editCoverFile.name : selected?.fotoPortada ? "Cambiar imagen" : "Subir imagen"}
              </button>
              {(editCoverFile || selected?.fotoPortada) && (
                <img
                  src={editCoverFile ? URL.createObjectURL(editCoverFile) : (selected?.fotoPortada || letrasImg)}
                  alt="preview"
                  style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover", border: "1px solid var(--color-border)" }}
                />
              )}
            </div>
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <BtnOutline onClick={() => setEditOpen(false)}>Cancelar</BtnOutline>
            <BtnPrimary type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── ARCHIVE CONFIRM ── */}
      <Modal isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} title="Archivar curso" size="sm">
        <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 20 }}>
          ¿Archivar el curso <strong style={{ color: "var(--color-text)" }}>{selected?.nombre}</strong>?
          El curso quedará inactivo pero sus datos se conservarán.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <BtnOutline onClick={() => setArchiveOpen(false)}>Cancelar</BtnOutline>
          <button
            onClick={handleArchive} disabled={saving}
            style={{
              background: saving ? "var(--color-border)" : "#D97706",
              color: "white", border: "none", padding: "9px 20px", borderRadius: 8,
              fontSize: 13.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Archivando..." : "Archivar"}
          </button>
        </div>
      </Modal>

      {/* ── PARTICIPANTS PANEL ── */}
      <Modal
        isOpen={participOpen}
        onClose={() => setParticipOpen(false)}
        title={`Participantes — ${selected?.nombre ?? ""}`}
        size="lg"
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            onClick={() => setAddPartOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#0C6AC4", color: "white", border: "none",
              padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            }}
          >
            <UserPlus style={{ width: 14, height: 14 }} /> Agregar participante
          </button>
        </div>

        {partsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0,1,2,3].map(i => <Sk key={i} h={52} r={10} />)}
          </div>
        ) : parts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Users style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>Sin participantes</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
            {parts.map((p) => {
              const u = p.usuario ?? p;
              const esDocente = p.etiqueta === "docente";
              return (
                <div
                  key={u._id ?? p._id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 10,
                    border: "1px solid var(--color-border)", background: "var(--color-bg)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <UserAvatar user={u} size={36} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                        {u.nombre} {u.apellido}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                        {p.etiqueta ?? u.rol}
                      </p>
                    </div>
                  </div>
                  {!esDocente && (
                    <button
                      onClick={() => handleRemovePart(u._id ?? p._id)}
                      title="Eliminar participante"
                      style={{ background: "rgba(220,38,38,0.1)", border: "none", borderRadius: 7, padding: 6, cursor: "pointer", display: "flex" }}
                    >
                      <UserMinus style={{ width: 14, height: 14, color: "#DC2626" }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* ── ADD PARTICIPANT MODAL ── */}
      <Modal isOpen={addPartOpen} onClose={() => setAddPartOpen(false)} title="Agregar participante" size="md">
        <form onSubmit={handleAddPart}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nombre *">
              <StInput value={addForm.nombre} onChange={e => setAddForm(f => ({ ...f, nombre: e.target.value }))} required />
            </Field>
            <Field label="Apellido *">
              <StInput value={addForm.apellido} onChange={e => setAddForm(f => ({ ...f, apellido: e.target.value }))} required />
            </Field>
            <Field label="Cédula *">
              <StInput value={addForm.cedula} onChange={e => setAddForm(f => ({ ...f, cedula: e.target.value }))} required />
            </Field>
            <Field label="Teléfono *">
              <StInput value={addForm.telefono} onChange={e => setAddForm(f => ({ ...f, telefono: e.target.value }))} required />
            </Field>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 16px" }}>
            Si el padre no existe, se creará con contraseña igual a su cédula.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline onClick={() => setAddPartOpen(false)}>Cancelar</BtnOutline>
            <BtnPrimary type="submit" disabled={saving}>{saving ? "Agregando..." : "Agregar"}</BtnPrimary>
          </div>
        </form>
      </Modal>
    </div>
  );
}
