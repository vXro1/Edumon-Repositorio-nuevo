// src/features/cursos/pages/CursosPage.jsx
// ROL: Administrador / Docente — gestión de cursos

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Layers, Plus, Search, Edit2, Archive, Users,
  ChevronLeft, ChevronRight, AlertCircle,
  UserPlus, UserMinus, Upload, ExternalLink,
} from "lucide-react";

import letrasImg from "@/assets/img/letras.png";

// ✅ Todos los componentes desde el index reutilizable
import {
  Modal, Button, UserAvatar, Toast,
  Input, Textarea, Select,
} from "@/components";

import {
  cursosGetAll,
  cursosGetMine,
  cursosGetById,
  cursosCreate,
  cursosUpdate,
  cursosDelete,
  cursosGetParticipantes,
  cursosAddParticipante,
  cursosRemoveParticipante,
  usersGetAll,
} from "@/lib/apiClient";

import { useAuth }   from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";
import { normalizeCurso, normalizeUser } from "@/lib/normalizers";
import { humanizeError }                 from "@/utils/humanizeError";
import { normalizeRole, ROLES }          from "@/security/roleMatrix";

const LIMIT = 12;

const ESTADO_META = {
  activo:    { label: "Activo",    color: "#16A34A", bg: "rgba(22,163,74,0.1)"  },
  archivado: { label: "Archivado", color: "#D97706", bg: "rgba(217,119,6,0.1)"  },
};

/* ── Skeleton ─────────────────────────────────────────────────── */
function Sk({ h = 16, w = "100%", r = 7 }) {
  return (
    <div className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

/* ── EstadoBadge ──────────────────────────────────────────────── */
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

/* ── Field wrapper ────────────────────────────────────────────── */
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

/* ── Helper: nombre del docente (cubre todos los shapes del backend) ── */
function getDocenteNombre(curso) {
  if (curso?.docente && typeof curso.docente === "object") {
    const full = [curso.docente.nombre, curso.docente.apellido].filter(Boolean).join(" ").trim();
    if (full) return full;
  }
  if (curso?.docenteNombre) return curso.docenteNombre;
  return "Sin docente";
}

/* ══════════════════════════════════════════════════════════════ */
export default function CursosPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { registerSearchHandler } = useSearch();

  const rol       = normalizeRole(user?.rol);
  const isDocente = rol === ROLES.DOCENTE;

  /* ── State ─────────────────────────────────────────────────── */
  const [cursos,    setCursos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState("");
  const [debSearch, setDebSearch] = useState("");
  const [toast,     setToast]     = useState({ msg: "", type: "success" });
  const [saving,    setSaving]    = useState(false);

  // Modals
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [participOpen, setParticipOpen] = useState(false);
  const [addPartOpen,  setAddPartOpen]  = useState(false);
  const [selected,     setSelected]     = useState(null);

  // Docentes para selector
  const [docentes, setDocentes] = useState([]);

  // Participantes
  const [parts,        setParts]        = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  // Forms
  const [createForm,      setCreateForm]      = useState({ nombre: "", descripcion: "", docenteId: "" });
  const [createCoverFile, setCreateCoverFile] = useState(null);
  const createCoverRef = useRef(null);

  const [editForm,      setEditForm]      = useState({ nombre: "", descripcion: "" });
  const [editCoverFile, setEditCoverFile] = useState(null);
  const editCoverRef = useRef(null);

  const [addForm, setAddForm] = useState({ nombre: "", apellido: "", cedula: "", telefono: "" });

  /* ── Helpers ───────────────────────────────────────────────── */
  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const goToCurso = (c) => navigate(`/cursos/${c._id}`);

  /* ── Debounce ──────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when search clears so normal pagination restarts correctly
  useEffect(() => { if (!debSearch) setPage(1); }, [debSearch]);

  /* ── Carga de cursos con enriquecimiento de docente ─────────── */
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // When searching, fetch all items so the client-side filter is complete
      const params = debSearch ? { page: 1, limit: 1000 } : { page, limit: LIMIT };
      const res = isDocente
        ? await cursosGetMine(params)
        : await cursosGetAll(params);

      const raw = (res.cursos ?? res.data ?? []).map(normalizeCurso);

      // Si el docente viene sin nombre (solo ID o ausente), enriquecer con cursosGetById
      const enriched = await Promise.all(
        raw.map(async (c) => {
          const needsEnrich =
            !c.docente ||
            typeof c.docente === "string" ||
            !c.docente?.nombre;
          if (needsEnrich) {
            try {
              const full = await cursosGetById(c._id);
              return normalizeCurso(full.curso ?? full);
            } catch {
              return c;
            }
          }
          return c;
        })
      );

      setCursos(enriched);
      setTotal(res.pagination?.total ?? raw.length);
    } catch {
      notify("Error al cargar cursos", "error");
    } finally {
      setLoading(false);
    }
  }, [page, debSearch, isDocente, user]);

  useEffect(() => { load(); }, [load]);

  /* ── Búsqueda global ───────────────────────────────────────── */
  useEffect(() => {
    const unregister = registerSearchHandler("cursos", (q) => {
      const query = q.toLowerCase();
      return {
        cursos: cursos
          .filter(c =>
            c.nombre?.toLowerCase().includes(query) ||
            c.descripcion?.toLowerCase().includes(query)
          )
          .slice(0, 5),
      };
    });
    return unregister;
  }, [cursos, registerSearchHandler]);

  /* ── Cargar docentes para selector ────────────────────────── */
  useEffect(() => {
    if (!user || isDocente) return;
    usersGetAll({ rol: "docente", limit: 100 })
      .then(r => setDocentes((r.users ?? []).map(normalizeUser)))
      .catch(() => {});
  }, [user, isDocente]);

  /* ── Participantes ─────────────────────────────────────────── */
  const loadParts = useCallback(async (id) => {
    setPartsLoading(true);
    try {
      const res = await cursosGetParticipantes(id, { limit: 100 });
      setParts(
        (res.participantes ?? res.data ?? []).map(p => ({
          ...p,
          usuario: normalizeUser(p.usuario ?? p),
        }))
      );
    } catch {
      notify("Error al cargar participantes", "error");
    } finally {
      setPartsLoading(false);
    }
  }, []);

  /* ── Filtro local ──────────────────────────────────────────── */
  const filtered = debSearch
    ? cursos.filter(c =>
        c.nombre?.toLowerCase().includes(debSearch.toLowerCase()) ||
        getDocenteNombre(c).toLowerCase().includes(debSearch.toLowerCase())
      )
    : cursos;

  // Pagination is meaningless while a search is active (all data loaded client-side)
  const totalPages = debSearch ? 1 : Math.max(1, Math.ceil(total / LIMIT));

  /* ── CRUD ──────────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.nombre.trim()) { notify("El nombre del curso es requerido", "error"); return; }
    if (!isDocente && !createForm.docenteId) { notify("Selecciona un docente", "error"); return; }
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

  const openEdit = async (c) => {
    setSelected(c);
    setEditForm({ nombre: c.nombre ?? "", descripcion: c.descripcion ?? "" });
    setEditOpen(true);
    // Enriquecer con datos completos al abrir
    try {
      const full = await cursosGetById(c._id);
      const enriched = normalizeCurso(full.curso ?? full);
      setSelected(enriched);
      setEditForm({ nombre: enriched.nombre ?? "", descripcion: enriched.descripcion ?? "" });
    } catch { /* usa lo que tenía */ }
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

  const openArchive  = (c) => { setSelected(c); setArchiveOpen(true); };
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

  const openParts = (c) => { setSelected(c); setParticipOpen(true); loadParts(c._id); };

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

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast {...toast} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(12,106,196,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Layers style={{ width: 19, height: 19, color: "#0C6AC4" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Cursos</h1>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>{total} cursos en total</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Plus style={{ width: 15, height: 15 }} /> Nuevo curso
        </Button>
      </div>

      {/* ── Search — Input reutilizable ── */}
      <div style={{ marginBottom: 18, maxWidth: 340 }}>
        <Input
          name="buscar"
          placeholder="Buscar curso o docente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>

      {/* ── Tabla ── */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 16,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                {["Curso", "Docente", "Participantes", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700,
                    color: "var(--color-text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", whiteSpace: "nowrap",
                  }}>
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
                      <td key={j} style={{ padding: "13px 16px" }}>
                        <Sk h={14} w={j === 4 ? 80 : "80%"} />
                      </td>
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
                filtered.map((c) => (
                  <tr key={c._id}
                    style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Nombre — clickeable → hub */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                        onClick={() => goToCurso(c)} title="Abrir curso">
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
                        <span style={{
                          fontSize: 13.5, fontWeight: 600, color: "#0C6AC4",
                          textDecoration: "underline", textDecorationColor: "rgba(12,106,196,0.3)",
                          textUnderlineOffset: 3,
                        }}>
                          {c.nombre}
                        </span>
                      </div>
                    </td>

                    {/* Docente — siempre resuelto */}
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
                      {getDocenteNombre(c)}
                    </td>

                    <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
                      {c.participantes?.length ?? c.totalParticipantes ?? "—"}
                    </td>

                    <td style={{ padding: "13px 16px" }}>
                      <EstadoBadge estado={c.estado ?? "activo"} />
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Button variant="ghost" size="sm" title="Abrir curso"
                          onClick={() => goToCurso(c)}>
                          <ExternalLink style={{ width: 14, height: 14, color: "#0C6AC4" }} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Participantes"
                          onClick={() => openParts(c)}>
                          <Users style={{ width: 14, height: 14, color: "#6366F1" }} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar"
                          onClick={() => openEdit(c)}>
                          <Edit2 style={{ width: 14, height: 14, color: "#16A34A" }} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Archivar"
                          onClick={() => openArchive(c)}>
                          <Archive style={{ width: 14, height: 14, color: "#D97706" }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación — oculta cuando hay búsqueda activa */}
        {!debSearch && totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderTop: "1px solid var(--color-border)",
          }}>
            <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
              Página {page} de {totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" aria-label="Anterior"
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </Button>
              <Button variant="ghost" size="sm" aria-label="Siguiente"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ══ CREATE MODAL ══════════════════════════════════════════ */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo curso" size="md">
        <form onSubmit={handleCreate}>
          <Field label="Nombre del curso *">
            <Input name="nombre" placeholder="Ej: Matemáticas 5°" required
              value={createForm.nombre}
              onChange={e => setCreateForm(f => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <Field label="Descripción">
            <Textarea name="descripcion" placeholder="Descripción del curso (opcional)" rows={3}
              value={createForm.descripcion}
              onChange={e => setCreateForm(f => ({ ...f, descripcion: e.target.value }))} />
          </Field>
          {!isDocente && (
            <Field label="Docente *">
              <Select name="docenteId" required
                value={createForm.docenteId}
                onChange={e => setCreateForm(f => ({ ...f, docenteId: e.target.value }))}>
                <option value="">Seleccionar docente...</option>
                {docentes.map(d => (
                  <option key={d._id} value={d._id}>{d.nombre} {d.apellido}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Imagen de portada">
            <input ref={createCoverRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => setCreateCoverFile(e.target.files[0] ?? null)} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button variant="ghost" size="sm" type="button"
                onClick={() => createCoverRef.current?.click()}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Upload style={{ width: 13, height: 13 }} />
                {createCoverFile ? createCoverFile.name : "Subir imagen"}
              </Button>
              {createCoverFile && (
                <img src={URL.createObjectURL(createCoverFile)} alt="preview"
                  style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover", border: "1px solid var(--color-border)" }} />
              )}
            </div>
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Creando..." : "Crear curso"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══ EDIT MODAL ════════════════════════════════════════════ */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar curso" size="md">
        <form onSubmit={handleEdit}>
          {/* Preview del curso actual */}
          {selected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, marginBottom: 16,
              background: "var(--color-bg)", border: "1px solid var(--color-border)",
            }}>
              <img
                src={selected.fotoPortada || letrasImg} alt={selected.nombre}
                onError={e => { e.target.onerror = null; e.target.src = letrasImg; }}
                style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
              />
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
                  {selected.nombre}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                  Docente: {getDocenteNombre(selected)}
                </p>
              </div>
            </div>
          )}
          <Field label="Nombre del curso *">
            <Input name="nombre" required
              value={editForm.nombre}
              onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <Field label="Descripción">
            <Textarea name="descripcion" rows={3}
              value={editForm.descripcion}
              onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
          </Field>
          <Field label="Imagen de portada">
            <input ref={editCoverRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => setEditCoverFile(e.target.files[0] ?? null)} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button variant="ghost" size="sm" type="button"
                onClick={() => editCoverRef.current?.click()}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Upload style={{ width: 13, height: 13 }} />
                {editCoverFile ? editCoverFile.name : selected?.fotoPortada ? "Cambiar imagen" : "Subir imagen"}
              </Button>
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
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══ ARCHIVE CONFIRM ═══════════════════════════════════════ */}
      <Modal isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} title="Archivar curso" size="sm">
        <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 20 }}>
          ¿Archivar el curso{" "}
          <strong style={{ color: "var(--color-text)" }}>{selected?.nombre}</strong>?
          El curso quedará inactivo pero sus datos se conservarán.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={() => setArchiveOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleArchive} disabled={saving}>
            {saving ? "Archivando..." : "Archivar"}
          </Button>
        </div>
      </Modal>

      {/* ══ PARTICIPANTS PANEL ════════════════════════════════════ */}
      <Modal
        isOpen={participOpen}
        onClose={() => setParticipOpen(false)}
        title={`Participantes — ${selected?.nombre ?? ""}`}
        size="lg"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Button variant="ghost" size="sm"
            onClick={() => { setParticipOpen(false); goToCurso(selected); }}
            style={{ display: "flex", alignItems: "center", gap: 6, color: "#0C6AC4" }}>
            <ExternalLink style={{ width: 13, height: 13 }} /> Ver curso completo
          </Button>
          <Button variant="primary"
            onClick={() => setAddPartOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <UserPlus style={{ width: 14, height: 14 }} /> Agregar participante
          </Button>
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
              const u     = p.usuario ?? p;
              const esDoc = p.etiqueta === "docente";
              return (
                <div key={u._id ?? p._id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 10,
                  border: "1px solid var(--color-border)", background: "var(--color-bg)",
                }}>
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
                  {!esDoc && (
                    <Button variant="ghost" size="sm" title="Eliminar participante"
                      onClick={() => handleRemovePart(u._id ?? p._id)}>
                      <UserMinus style={{ width: 14, height: 14, color: "#DC2626" }} />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* ══ ADD PARTICIPANT MODAL ═════════════════════════════════ */}
      <Modal isOpen={addPartOpen} onClose={() => setAddPartOpen(false)} title="Agregar participante" size="md">
        <form onSubmit={handleAddPart}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nombre *">
              <Input name="nombre" required value={addForm.nombre}
                onChange={e => setAddForm(f => ({ ...f, nombre: e.target.value }))} />
            </Field>
            <Field label="Apellido *">
              <Input name="apellido" required value={addForm.apellido}
                onChange={e => setAddForm(f => ({ ...f, apellido: e.target.value }))} />
            </Field>
            <Field label="Cédula *">
              <Input name="cedula" required value={addForm.cedula}
                onChange={e => setAddForm(f => ({ ...f, cedula: e.target.value }))} />
            </Field>
            <Field label="Teléfono *">
              <Input name="telefono" required value={addForm.telefono}
                onChange={e => setAddForm(f => ({ ...f, telefono: e.target.value }))} />
            </Field>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 16px" }}>
            Si el padre no existe, se creará con contraseña igual a su cédula.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setAddPartOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}