import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Layers, Plus, Search, Edit2, Archive, Users,
  ChevronLeft, ChevronRight, AlertCircle,
  UserPlus, UserMinus, Upload, ExternalLink, Pipette,
} from "lucide-react";

import letrasImg from "@/assets/img/letras.svg"; // fallback para cursos sin portada  

import {
  Modal, Button, UserAvatar, Toast, Badge,
  Input, Textarea, Select, PhoneInput, IconActionButton,
} from "@/components";
import CursoCard from "@/features/cursos/components/CursoCard";

import { normalizePhone, isValidPhone, PHONE_ERROR } from "@/utils/normalizePhone";
import {
  contrasenaInicial, TEXTO_CONTRASENA_INICIAL,
  isValidCedula, CEDULA_ERROR, toCedula,
} from "@/utils/credenciales";

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
} from "@/features/cursos/services/cursosService";
import { usersGetAll } from "@/services/usersService";

import { useAuth }   from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";
import { normalizeCurso, normalizeUser } from "@/lib/normalizers";
import { humanizeError }                 from "@/utils/humanizeError";
import { normalizeRole, ROLES }          from "@/security/roleMatrix";

const LIMIT = 12;

const ESTADO_META = {
  activo:    { label: "Activo",    color: "var(--edu-green-600)", bg: "rgba(22,163,74,0.1)"  },
  archivado: { label: "Archivado", color: "#D97706", bg: "rgba(217,119,6,0.1)"  },
};

// hex literal — el backend rechaza valores tipo var(--color-primary)
const COLOR_PALETTE = [
  "#8B5CF6", "#06B6D4", "#41D958", "#F59E0B", "#EC4899",
  "#EF4444", "#0C6AC4", "#6366F1", "#14B8A6", "#F97316",
];
const DEFAULT_COLOR = COLOR_PALETTE[6]; // #0C6AC4 — azul Edumon

/* ── Esqueleto de carga ────────────────────────────────────────── */
function Sk({ h = 16, w = "100%", r = 7 }) {
  return (
    <div className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

function SkCard() {
  return (
    <div style={{
      aspectRatio: "1 / 1",
      borderRadius: 14,
      border: "2px solid var(--color-border)",
      background: "var(--color-surface)",
      overflow: "hidden",
    }}>
      <Sk h="100%" r={0} />
    </div>
  );
}

/* ── EstadoBadge ──────────────────────────────────────────────── */
const ESTADO_VARIANT = { activo: "success", archivado: "warning" };
function EstadoBadge({ estado }) {
  const label = ESTADO_META[estado]?.label ?? estado;
  return (
    <Badge variant={ESTADO_VARIANT[estado] ?? "neutral"} size="sm" dot>
      {label}
    </Badge>
  );
}

/* ── Field wrapper ────────────────────────────────────────────── */
function Field({ label, children, hint }) {
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
      {hint && (
        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--color-text-muted)" }}>{hint}</p>
      )}
    </div>
  );
}

/* ── Selector de color: paleta + gotero personalizado ──────────── */
function ColorPickerField({ value, onChange }) {
  const isCustom = !COLOR_PALETTE.includes(value);
  return (
    <Field label="Color del curso">
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        {COLOR_PALETTE.map((c) => {
          const active = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Elegir color ${c}`}
              title={c}
              style={{
                // min-width/min-height explícitos: la regla global button{min-height:44px} ovalaba el swatch
                width: 27, height: 27, minWidth: 27, minHeight: 27, borderRadius: "50%", background: c,
                border: active ? "2px solid var(--color-surface)" : "2px solid transparent",
                outline: active ? `2px solid ${c}` : "2px solid transparent",
                outlineOffset: 2,
                cursor: "pointer", padding: 0, flexShrink: 0,
                transition: "transform 0.12s",
                transform: active ? "scale(1.05)" : "scale(1)",
              }}
            />
          );
        })}

        {/* Gotero — color personalizado vía <input type="color"> */}
        <label
          title="Elegir color personalizado"
          style={{
            width: 27, height: 27, borderRadius: "50%", cursor: "pointer",
            position: "relative", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isCustom && value ? value : "var(--color-bg)",
            border: isCustom
              ? `2px solid var(--color-surface)`
              : "2px dashed var(--color-border)",
            outline: isCustom ? `2px solid ${value}` : "none",
            outlineOffset: 2,
          }}
        >
          <Pipette style={{
            width: 13, height: 13,
            color: isCustom ? "#fff" : "var(--color-text-muted)",
          }} />
          <input
            type="color"
            value={/^#([0-9A-Fa-f]{6})$/.test(value) ? value : DEFAULT_COLOR}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              opacity: 0, cursor: "pointer", border: 0, padding: 0,
            }}
          />
        </label>
      </div>
    </Field>
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

  // Modales
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

  // Formularios
  const [createForm,      setCreateForm]      = useState({
    nombre: "", descripcion: "", docenteId: "", color: DEFAULT_COLOR,
  });
  const [createCoverFile, setCreateCoverFile] = useState(null);
  const createCoverRef = useRef(null);

  const [editForm,      setEditForm]      = useState({ nombre: "", descripcion: "", color: DEFAULT_COLOR });
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

  // Reiniciar a página 1 cuando se limpia la búsqueda para que la paginación normal reinicie correctamente
  useEffect(() => { if (!debSearch) setPage(1); }, [debSearch]);

  /* ── Carga de cursos con enriquecimiento de docente ─────────── */
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Al buscar, traer todos los elementos para que el filtro del lado cliente sea completo
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

  // La paginación no aplica mientras hay búsqueda activa (todos los datos cargados en cliente)
  const totalPages = debSearch ? 1 : Math.max(1, Math.ceil(total / LIMIT));

  /* ── CRUD ──────────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    const nombre = createForm.nombre.trim();
    const descripcion = createForm.descripcion.trim();

    if (!nombre) { notify("El nombre del curso es requerido", "error"); return; }
    if (nombre.length < 2 || nombre.length > 100) {
      notify("El nombre debe tener entre 2 y 100 caracteres", "error"); return;
    }
    // El backend ahora exige descripción (10-500 caracteres)
    if (!descripcion) { notify("La descripción es requerida", "error"); return; }
    if (descripcion.length < 10 || descripcion.length > 500) {
      notify("La descripción debe tener entre 10 y 500 caracteres", "error"); return;
    }
    if (!isDocente && !createForm.docenteId) { notify("Selecciona un docente", "error"); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("nombre", nombre);
      fd.append("descripcion", descripcion);
      fd.append("docenteId", isDocente ? (user._id ?? user.id) : createForm.docenteId);
      if (createForm.color) fd.append("color", createForm.color);
      if (createCoverFile) fd.append("fotoPortada", createCoverFile);
      await cursosCreate(fd);
      notify("Curso creado exitosamente");
      setCreateOpen(false);
      setCreateForm({ nombre: "", descripcion: "", docenteId: "", color: DEFAULT_COLOR });
      setCreateCoverFile(null);
      load();
    } catch (err) { notify(humanizeError(err, "Error al crear curso"), "error"); }
    finally { setSaving(false); }
  };

  const openEdit = async (c) => {
    setSelected(c);
    setEditForm({
      nombre: c.nombre ?? "",
      descripcion: c.descripcion ?? "",
      color: c.color ?? DEFAULT_COLOR,
    });
    setEditOpen(true);
    // Enriquecer con datos completos al abrir
    try {
      const full = await cursosGetById(c._id);
      const enriched = normalizeCurso(full.curso ?? full);
      setSelected(enriched);
      setEditForm({
        nombre: enriched.nombre ?? "",
        descripcion: enriched.descripcion ?? "",
        color: enriched.color ?? DEFAULT_COLOR,
      });
    } catch { /* usa lo que tenía */ }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const nombre = editForm.nombre.trim();
    const descripcion = editForm.descripcion.trim();

    if (!nombre) { notify("El nombre es requerido", "error"); return; }
    if (descripcion && (descripcion.length < 10 || descripcion.length > 500)) {
      notify("La descripción debe tener entre 10 y 500 caracteres", "error"); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("nombre", nombre);
      fd.append("descripcion", descripcion);
      if (editForm.color) fd.append("color", editForm.color);
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
    if (!isValidCedula(cedula))  { notify(CEDULA_ERROR, "error"); return; }
    if (!isValidPhone(telefono)) { notify(PHONE_ERROR, "error"); return; }

    setSaving(true);
    try {
      // No se envía contraseña: el backend aplica la regla única (= cédula).
      await cursosAddParticipante(selected._id, {
        nombre:   nombre.trim(),
        apellido: apellido.trim(),
        cedula:   cedula.trim(),
        telefono: normalizePhone(telefono),
      });
      notify(`Participante agregado. Contraseña inicial: ${contrasenaInicial(cedula)}`);
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

      {/* ── Encabezado ── */}
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
            <Layers style={{ width: 19, height: 19, color: "var(--color-primary)" }} />
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

      {/* ── Búsqueda — Input reutilizable ── */}
      <div style={{ marginBottom: 18, maxWidth: 340 }}>
        <Input
          name="buscar"
          placeholder="Buscar curso o docente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>

      {/* ── Grid de cursos — mismo estilo de card que /familia/cursos, en modo compact ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map(i => <SkCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
          padding: "60px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <AlertCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>No hay cursos</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {filtered.map((c) => (
              <div key={c._id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <CursoCard
                  curso={c}
                  role={isDocente ? "docente" : "administrador"}
                  compact
                  onClick={() => goToCurso(c)}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 2px" }}>
                  <EstadoBadge estado={c.estado ?? "activo"} />
                  {!isDocente && (
                    <span style={{
                      fontSize: 11.5, color: "var(--color-text-muted)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {getDocenteNombre(c)}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <IconActionButton icon={Users} title="Participantes" color="#6366F1" onClick={() => openParts(c)} />
                  <IconActionButton icon={Edit2} title="Editar" color="var(--edu-green-600)" onClick={() => openEdit(c)} />
                  <IconActionButton icon={Archive} title="Archivar" color="#D97706" onClick={() => openArchive(c)} />
                </div>
              </div>
            ))}
          </div>

          {/* Paginación — oculta cuando hay búsqueda activa */}
          {!debSearch && totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 20, padding: "12px 16px", borderRadius: 12,
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
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
        </>
      )}

      {/* ══ MODAL CREAR ═══════════════════════════════════════════ */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo curso" size="md">
        <form onSubmit={handleCreate}>
          <Field label="Nombre del curso *">
            <Input name="nombre" placeholder="Ej: Matemáticas 5°" required
              value={createForm.nombre}
              onChange={e => setCreateForm(f => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <Field
            label="Descripción *"
            hint={`${createForm.descripcion.trim().length}/500 (mínimo 10 caracteres)`}
          >
            <Textarea name="descripcion" placeholder="Describe brevemente el curso (mín. 10 caracteres)" rows={3}
              required
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
          <ColorPickerField
            value={createForm.color}
            onChange={(color) => setCreateForm(f => ({ ...f, color }))}
          />
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

      {/* ══ MODAL EDITAR ══════════════════════════════════════════ */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar curso" size="md">
        <form onSubmit={handleEdit}>
          {/* Vista previa del curso actual */}
          {selected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, marginBottom: 16,
              background: "var(--color-bg)", border: "1px solid var(--color-border)",
              borderLeft: `4px solid ${editForm.color || "var(--color-primary)"}`,
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
          <Field
            label="Descripción *"
            hint={`${editForm.descripcion.trim().length}/500 (mínimo 10 caracteres)`}
          >
            <Textarea name="descripcion" rows={3} required
              value={editForm.descripcion}
              onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
          </Field>
          <ColorPickerField
            value={editForm.color}
            onChange={(color) => setEditForm(f => ({ ...f, color }))}
          />
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

      {/* ══ CONFIRMAR ARCHIVO ════════════════════════════════════ */}
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

      {/* ══ PANEL DE PARTICIPANTES ═══════════════════════════════ */}
      <Modal
        isOpen={participOpen}
        onClose={() => setParticipOpen(false)}
        title={`Participantes — ${selected?.nombre ?? ""}`}
        size="lg"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <Button variant="ghost" size="sm"
            onClick={() => { setParticipOpen(false); goToCurso(selected); }}
            style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)" }}>
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
                  flexWrap: "wrap", gap: 8,
                  padding: "10px 14px", borderRadius: 10,
                  border: "1px solid var(--color-border)", background: "var(--color-bg)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <UserAvatar user={u} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                      <UserMinus style={{ width: 14, height: 14, color: "var(--color-error-hover)" }} />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* ══ MODAL AGREGAR PARTICIPANTE ════════════════════════════ */}
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
              <Input name="cedula" required inputMode="numeric" placeholder="1020304050" value={addForm.cedula}
                onChange={e => setAddForm(f => ({ ...f, cedula: toCedula(e.target.value) }))} />
            </Field>
            <Field label="Teléfono *">
              <PhoneInput label={null} hint={null} required value={addForm.telefono}
                onChange={e => setAddForm(f => ({ ...f, telefono: e.target.value }))} />
            </Field>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 16px" }}>
            Si el padre no existe, se creará automáticamente. {TEXTO_CONTRASENA_INICIAL}
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