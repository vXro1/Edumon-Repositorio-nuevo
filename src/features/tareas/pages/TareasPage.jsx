// src/features/tareas/pages/TareasPage.jsx

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Plus, Search, X, RefreshCw, Loader2,
  Calendar, BookOpen, Lock, Trash2, ChevronRight, Paperclip, Link2, Pencil,
} from "lucide-react";

// API
import { cursosGetMine, cursosGetParticipantes, modulosGetByCurso } from "@/features/cursos/services/cursosService";
// NOTA: se agrega `tareasUpdate` — sigue el mismo patrón de las demás funciones
// del service (tareasCreate, tareasCerrar, tareasDelete). Debe hacer
// PUT /api/tareas/:id enviando el FormData tal cual (sin fijar
// Content-Type a mano, para que el browser agregue el boundary correcto).
import { tareasGetAll, tareasCreate, tareasUpdate, tareasCerrar, tareasDelete } from "@/features/cursos/services/tareasService";

// Hooks & Context
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";

// Utils
import { normalizeCurso } from "@/lib/normalizers/curso";
import { normalizeTarea } from "@/lib/normalizers/tarea";
import { humanizeError } from "@/utils/humanizeError";

// Shared UI — componentes del sistema
import { Toast, AppModal, Modal, Button, Input, Select } from "@/components";
import { Sk, EmptyState, Field } from "../../cursos/components/shared/ui";
import { makeNotify } from "@/features/cursos/components/shared/helpers";

/* ── Preview de archivo adjunto (nuevo, aún no subido) ──────────────── */
function FileChip({ file, onRemove }) {
  const isImage = file.type.startsWith("image/");
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: isImage ? "4px 10px 4px 4px" : "7px 10px",
      border: "1px solid var(--color-border)",
      borderRadius: 8, background: "var(--color-bg)",
    }}>
      {isImage ? (
        <img
          src={url}
          alt={file.name}
          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 6, flexShrink: 0,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Paperclip size={15} style={{ color: "#6366F1" }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 600, color: "var(--color-text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {file.name}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-muted)", padding: 2, display: "flex",
          borderRadius: 4, flexShrink: 0,
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

/* ── Fila de un adjunto YA existente en el servidor (tipo "archivo") ──
   Se puede marcar para borrar; el borrado real ocurre en el backend
   (archivosAEliminar) recién cuando se envía el formulario.          */
function ExistingFileRow({ archivo, marcado, onToggle }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "7px 10px",
      border: `1px solid ${marcado ? "rgba(220,38,38,0.35)" : "var(--color-border)"}`,
      borderRadius: 8,
      background: marcado ? "rgba(220,38,38,0.06)" : "var(--color-bg)",
      opacity: marcado ? 0.65 : 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 6, flexShrink: 0,
        background: "rgba(99,102,241,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Paperclip size={15} style={{ color: "#6366F1" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 600, color: "var(--color-text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textDecoration: marcado ? "line-through" : "none",
        }}>
          {archivo.nombre}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>
          {marcado ? "Se eliminará al guardar" : "Adjunto actual"}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        title={marcado ? "Deshacer" : "Marcar para eliminar"}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: marcado ? "var(--color-error-hover)" : "var(--color-text-muted)", padding: 2, display: "flex",
          borderRadius: 4, flexShrink: 0,
        }}
      >
        <Trash2 style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_CFG = {
  activa:  { bg: "rgba(22,163,74,0.10)",   color: "var(--edu-green-600)", label: "Activa"  },
  cerrada: { bg: "rgba(148,163,184,0.15)", color: "#64748B", label: "Cerrada" },
  vencida: { bg: "rgba(220,38,38,0.10)",   color: "var(--color-error-hover)", label: "Vencida" },
};

const ASIG_CFG = {
  todos:         { label: "Todos",         color: "var(--color-primary)" },
  seleccionados: { label: "Seleccionados", color: "#6366F1" },
};

const TIPO_ENTREGA_OPTS = [
  { value: "archivo",     label: "Archivo / Documento"  },
  { value: "texto",       label: "Texto en línea"        },
  { value: "enlace",      label: "Enlace (URL)"           },
  { value: "multimedia",  label: "Multimedia"             },
  { value: "presencial",  label: "Presencial"             },
  { value: "grupal",      label: "Grupal"                 },
];

const INIT_FORM = {
  titulo: "", descripcion: "", criterios: "", cursoId: "", moduloId: "",
  fechaEntrega: "", asignacionTipo: "todos", tipoEntrega: "archivo",
};

// Fila vacía por defecto para el editor de enlaces de referencia
const EMPTY_ENLACE = { url: "", nombre: "" };

// Convierte un ISO de servidor a formato aceptado por <input type="datetime-local">
function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TareasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerSearchHandler } = useSearch();

  const [tareas,        setTareas]        = useState([]);
  const [cursos,        setCursos]        = useState([]);
  const [modulos,       setModulos]       = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterCurso,   setFilterCurso]   = useState("");
  const [filterEstado,  setFilterEstado]  = useState("");
  const [toast,         setToast]         = useState({ msg: "", type: "success" });
  const [saving,        setSaving]        = useState(false);

  // ── Crear ──
  const [showCreate,                   setShowCreate]                   = useState(false);
  const [form,                         setForm]                         = useState(INIT_FORM);
  const [participantesSeleccionados,   setParticipantesSeleccionados]   = useState([]);
  const [archivos,                     setArchivos]                     = useState([]);
  const [enlaces,                      setEnlaces]                      = useState([]); // enlaces de referencia
  const fileRef = useRef(null);

  // ── Editar ──
  const [showEdit,               setShowEdit]               = useState(false);
  const [editingId,              setEditingId]              = useState(null);
  const [editForm,                setEditForm]              = useState(INIT_FORM);
  const [editModulos,             setEditModulos]           = useState([]);
  const [editParticipantesList,   setEditParticipantesList] = useState([]);
  const [editParticipantesSeleccionados, setEditParticipantesSeleccionados] = useState([]);
  const [editArchivosExistentes,  setEditArchivosExistentes] = useState([]); // tipo "archivo" ya en el servidor
  const [editArchivosAEliminar,   setEditArchivosAEliminar]  = useState([]); // publicIds marcados
  const [editEnlacesExistentes,   setEditEnlacesExistentes]  = useState([]); // tipo "enlace" ya en el servidor (solo lectura)
  const [editArchivosNuevos,      setEditArchivosNuevos]     = useState([]); // File[] nuevos
  const [editEnlacesNuevos,       setEditEnlacesNuevos]      = useState([]); // enlaces nuevos a agregar
  const editFileRef = useRef(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const notify = makeNotify(setToast);

  // Mínimo permitido para el input datetime-local: ahora mismo. El backend
  // rechaza fechaEntrega que no sea estrictamente futura (createTareaValidator).
  const minFechaEntrega = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    []
  );

  // ── Cursos del usuario ────────────────────────────────────────────────────
  useEffect(() => {
    cursosGetMine({ limit: 50 })
      .then(d => setCursos((d.cursos ?? []).map(normalizeCurso)))
      .catch(() => {});
  }, []);

  // ── Módulos y participantes al cambiar curso en el form de CREAR ──────────
  useEffect(() => {
    if (!form.cursoId) {
      setModulos([]); setParticipantes([]); setParticipantesSeleccionados([]);
      return;
    }
    modulosGetByCurso(form.cursoId)
      .then(d => setModulos(d.modulos ?? d ?? []))
      .catch(() => setModulos([]));
    cursosGetParticipantes(form.cursoId)
      .then(d => setParticipantes(d.participantes ?? []))
      .catch(() => setParticipantes([]));
  }, [form.cursoId]);

  // ── Módulos y participantes al cambiar curso en el form de EDITAR ─────────
  useEffect(() => {
    if (!editForm.cursoId) {
      setEditModulos([]); setEditParticipantesList([]);
      return;
    }
    modulosGetByCurso(editForm.cursoId)
      .then(d => setEditModulos(d.modulos ?? d ?? []))
      .catch(() => setEditModulos([]));
    cursosGetParticipantes(editForm.cursoId)
      .then(d => setEditParticipantesList(d.participantes ?? []))
      .catch(() => setEditParticipantesList([]));
  }, [editForm.cursoId]);

  // ── Carga de tareas ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tareasGetAll({ limit: 200 });
      setTareas((data.tareas ?? []).map(normalizeTarea));
    } catch {
      notify("Error al cargar retos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Búsqueda global ───────────────────────────────────────────────────────
  useEffect(() => {
    const unregister = registerSearchHandler("tareas", (q) => {
      const query = q.toLowerCase();
      return {
        tareas: tareas
          .filter(t =>
            t.titulo?.toLowerCase().includes(query) ||
            t.descripcion?.toLowerCase().includes(query)
          )
          .slice(0, 5),
      };
    });
    return unregister;
  }, [tareas, registerSearchHandler]);

  // ── Filtro local ──────────────────────────────────────────────────────────
  const filtered = tareas.filter(t => {
    const q = search.toLowerCase();
    const matchSearch  = !q || t.titulo?.toLowerCase().includes(q) || t.descripcion?.toLowerCase().includes(q);
    const matchEstado  = !filterEstado || t.estado === filterEstado;
    const matchCurso   = !filterCurso  || (t.curso?._id ?? t.curso?.id ?? t.cursoId) === filterCurso;
    return matchSearch && matchEstado && matchCurso;
  });

  // ── Helpers de campo ──────────────────────────────────────────────────────
  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const ef = (key) => (e) => setEditForm(p => ({ ...p, [key]: e.target.value }));

  // ── Helpers de enlaces de referencia (crear) ──────────────────────────────
  const addEnlace = () => setEnlaces(prev => [...prev, { ...EMPTY_ENLACE }]);
  const removeEnlace = (i) => setEnlaces(prev => prev.filter((_, j) => j !== i));
  const updateEnlace = (i, key, value) =>
    setEnlaces(prev => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: value };
      return arr;
    });

  // ── Helpers de enlaces nuevos (editar) ────────────────────────────────────
  const addEditEnlace = () => setEditEnlacesNuevos(prev => [...prev, { ...EMPTY_ENLACE }]);
  const removeEditEnlace = (i) => setEditEnlacesNuevos(prev => prev.filter((_, j) => j !== i));
  const updateEditEnlace = (i, key, value) =>
    setEditEnlacesNuevos(prev => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: value };
      return arr;
    });

  const toggleArchivoAEliminar = (publicId) =>
    setEditArchivosAEliminar(prev =>
      prev.includes(publicId) ? prev.filter(id => id !== publicId) : [...prev, publicId]
    );

  // ── Crear tarea ───────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();

    // Validaciones alineadas con createTareaValidator.js: titulo, cursoId,
    // moduloId y fechaEntrega (futura) son obligatorios; participantesSeleccionados
    // es obligatorio solo cuando asignacionTipo === "seleccionados".
    if (!form.titulo.trim()) { notify("El título es requerido", "error"); return; }
    if (!form.cursoId)       { notify("Selecciona un curso", "error"); return; }
    if (!form.moduloId)      { notify("Selecciona un módulo", "error"); return; }
    if (!form.fechaEntrega)  { notify("La fecha de entrega es requerida", "error"); return; }
    if (new Date(form.fechaEntrega) < new Date()) {
      notify("La fecha de entrega debe ser futura", "error");
      return;
    }
    if (form.asignacionTipo === "seleccionados" && participantesSeleccionados.length === 0) {
      notify("Selecciona al menos un participante", "error");
      return;
    }

    // Enlaces con URL vacía se descartan silenciosamente (el usuario pudo
    // haber agregado una fila y arrepentirse sin borrarla).
    const enlacesValidos = enlaces
      .filter(en => en.url?.trim())
      .map(en => ({
        url: en.url.trim(),
        nombre: en.nombre?.trim() || "Enlace",
      }));

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titulo",        form.titulo);
      fd.append("descripcion",   form.descripcion);
      fd.append("criterios",     form.criterios);
      fd.append("cursoId",       form.cursoId);
      fd.append("moduloId",      form.moduloId);
      fd.append("fechaEntrega",  form.fechaEntrega);
      fd.append("asignacionTipo", form.asignacionTipo);
      fd.append("tipoEntrega",    form.tipoEntrega || "archivo");
      // NOTA: no se envía docenteId — el backend siempre lo fuerza a
      // req.user.userId (createTarea.js) e ignora cualquier valor del body.

      // FIX: createTareaValidator.js tiene `.isArray()` sobre este campo, y
      // ese validator corre en la cadena de middlewares ANTES que el
      // controller. JSON.stringify(array) llega a Multer como un string
      // plano, así que isArray() lo rechaza con 400 ("Los participantes
      // seleccionados deben ser un array") — el request nunca alcanza el
      // parseJSONArray() del controller, que solo existe para campos SIN
      // isArray() en el validator (enlaces, nuevosEnlaces, archivosAEliminar).
      // La notación de corchetes `campo[]` hace que Multer (vía append-field)
      // arme un array real en req.body incluso con un solo valor — a
      // diferencia de repetir el key sin corchetes, que con un solo elemento
      // queda como string suelto y también falla el validator.
      if (form.asignacionTipo === "seleccionados") {
        participantesSeleccionados.forEach(id => fd.append("participantesSeleccionados[]", id));
      }

      archivos.forEach(file => fd.append("archivos", file));

      // Enlaces de referencia: "enlaces" NO tiene isArray() en el validator,
      // así que JSON.stringify() sí funciona — el controller lo parsea con
      // parseJSONArray(). La notación de corchetes NO sirve aquí porque son
      // objetos anidados ({url, nombre}), no strings sueltos, y Multer/busboy
      // no reconstruye "enlaces[0][url]" en multipart/form-data.
      if (enlacesValidos.length > 0) {
        fd.append("enlaces", JSON.stringify(enlacesValidos));
      }

      await tareasCreate(fd);
      notify("Reto creado correctamente");
      setShowCreate(false);
      setForm(INIT_FORM);
      setParticipantesSeleccionados([]);
      setArchivos([]);
      setEnlaces([]);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al crear reto"), "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Abrir modal de edición, precargando datos de la tarea ────────────────
  const openEdit = (t) => {
    const cursoId = t.curso?._id ?? t.curso?.id ?? (typeof t.cursoId === "object" ? t.cursoId?._id : t.cursoId) ?? "";
    const moduloId = t.modulo?._id ?? t.modulo?.id ?? (typeof t.moduloId === "object" ? t.moduloId?._id : t.moduloId) ?? "";

    setEditingId(t._id);
    setEditForm({
      titulo:          t.titulo ?? "",
      descripcion:     t.descripcion ?? "",
      criterios:       t.criterios ?? "",
      cursoId,
      moduloId,
      fechaEntrega:    toDatetimeLocalValue(t.fechaEntrega),
      asignacionTipo:  t.asignacionTipo ?? "todos",
      tipoEntrega:     t.tipoEntrega ?? "archivo",
      estado:          t.estado ?? "activa",
    });

    const seleccionadosIds = (t.participantesSeleccionados ?? [])
      .map(p => (typeof p === "object" ? p._id : p));
    setEditParticipantesSeleccionados(seleccionadosIds);

    // t.adjuntos y t.archivosAdjuntos apuntan al mismo array ya normalizado
    // (normalizeTarea.js expone ambos alias sobre los mismos datos) — mezcla
    // archivos y enlaces, distinguidos por "tipo".
    const adjuntos = t.adjuntos ?? t.archivosAdjuntos ?? [];
    setEditArchivosExistentes(adjuntos.filter(a => a.tipo === "archivo"));
    setEditEnlacesExistentes(adjuntos.filter(a => a.tipo === "enlace"));
    setEditArchivosAEliminar([]);
    setEditArchivosNuevos([]);
    setEditEnlacesNuevos([]);

    setShowEdit(true);
  };

  // ── Guardar edición ───────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.titulo.trim()) { notify("El título es requerido", "error"); return; }
    if (!editForm.fechaEntrega)  { notify("La fecha de entrega es requerida", "error"); return; }
    if (editForm.asignacionTipo === "seleccionados" && editParticipantesSeleccionados.length === 0) {
      notify("Selecciona al menos un participante", "error");
      return;
    }

    const enlacesNuevosValidos = editEnlacesNuevos
      .filter(en => en.url?.trim())
      .map(en => ({
        url: en.url.trim(),
        nombre: en.nombre?.trim() || "Enlace",
      }));

    setSavingEdit(true);
    try {
      const fd = new FormData();
      fd.append("titulo",         editForm.titulo);
      fd.append("descripcion",    editForm.descripcion);
      fd.append("criterios",      editForm.criterios);
      fd.append("cursoId",        editForm.cursoId);
      fd.append("moduloId",       editForm.moduloId);
      fd.append("fechaEntrega",   editForm.fechaEntrega);
      fd.append("asignacionTipo", editForm.asignacionTipo);
      fd.append("tipoEntrega",    editForm.tipoEntrega || "archivo");
      fd.append("estado",         editForm.estado || "activa");

      // FIX: mismo problema que en handleCreate — ver el comentario extenso
      // ahí. El validator de updateTareaValidator.js también tiene
      // isArray() sobre participantesSeleccionados y corre antes que el
      // controller, así que JSON.stringify() aquí también producía 400.
      if (editForm.asignacionTipo === "seleccionados") {
        editParticipantesSeleccionados.forEach(id => fd.append("participantesSeleccionados[]", id));
      }

      if (editArchivosAEliminar.length > 0) {
        fd.append("archivosAEliminar", JSON.stringify(editArchivosAEliminar));
      }

      if (enlacesNuevosValidos.length > 0) {
        // El controlador de updateTarea lee primero "nuevosEnlaces" y, si no
        // viene, cae a "enlaces" — se usa "nuevosEnlaces" explícitamente para
        // que quede claro que son enlaces A AGREGAR, no el listado completo.
        // "nuevosEnlaces" tampoco tiene isArray() en el validator, así que
        // JSON.stringify() aquí sí es correcto (a diferencia de participantes).
        fd.append("nuevosEnlaces", JSON.stringify(enlacesNuevosValidos));
      }

      editArchivosNuevos.forEach(file => fd.append("archivos", file));

      await tareasUpdate(editingId, fd);
      notify("Reto actualizado correctamente");
      setShowEdit(false);
      setEditingId(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar reto"), "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Cerrar tarea ──────────────────────────────────────────────────────────
  const handleCerrar = async (id) => {
    if (!window.confirm("¿Cerrar este reto? No se aceptarán más entregas.")) return;
    try {
      await tareasCerrar(id);
      notify("Reto cerrado");
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al cerrar reto"), "error");
    }
  };

  // ── Eliminar tarea ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tareasDelete(deletingId);
      notify("Reto eliminado");
      setShowDelete(false);
      setDeletingId(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar"), "error");
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(99,102,241,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              Retos
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            {filtered.length} reto{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            title="Actualizar"
          >
            <RefreshCw style={{ width: 15, height: 15 }} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setForm(INIT_FORM);
              setArchivos([]);
              setEnlaces([]);
              setParticipantesSeleccionados([]);
              setShowCreate(true);
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Nuevo reto
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 14,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        {/* Búsqueda */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          <Search style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Buscar retos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 13.5, color: "var(--color-text)", background: "transparent",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Filtro curso */}
        <select
          value={filterCurso}
          onChange={e => setFilterCurso(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text)",
            fontSize: 13, cursor: "pointer", outline: "none",
          }}
        >
          <option value="">Todos los cursos</option>
          {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>

        {/* Filtro estado */}
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text)",
            fontSize: 13, cursor: "pointer", outline: "none",
          }}
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="cerrada">Cerrada</option>
          <option value="vencida">Vencida</option>
        </select>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3].map(i => <Sk key={i} h={100} r={16} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={search ? "Sin resultados" : "No hay retos"}
          desc={!search ? "Crea el primer reto usando el botón de arriba" : undefined}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(t => (
            <TareaCard
              key={t._id}
              tarea={t}
              onVerEntregas={() => navigate(`/tareas/${t._id}/entregas`)}
              onEditar={() => openEdit(t)}
              onCerrar={() => handleCerrar(t._id)}
              onDelete={() => { setDeletingId(t._id); setShowDelete(true); }}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal — Crear tarea
      ══════════════════════════════════════════════ */}
      <AppModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setParticipantesSeleccionados([]); }}
        size="lg"
      >
        <AppModal.Header
          title="Nuevo reto"
          description="El reto será visible para los participantes del curso seleccionado."
          onClose={() => { setShowCreate(false); setParticipantesSeleccionados([]); }}
        />
        <AppModal.Body>
          <form id="tareas-page-form" onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* Título */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Título *">
                  <Input
                    value={form.titulo}
                    onChange={f("titulo")}
                    placeholder="Ej: Reto de fracciones"
                    required
                  />
                </Field>
              </div>

              {/* Descripción */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Descripción">
                  <Input
                    as="textarea"
                    value={form.descripcion}
                    onChange={f("descripcion")}
                    placeholder="Instrucciones para los padres..."
                    rows={3}
                  />
                </Field>
              </div>

              {/* Criterios de evaluación */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Criterios de evaluación">
                  <Input
                    as="textarea"
                    value={form.criterios}
                    onChange={f("criterios")}
                    placeholder="Cómo se evaluará este reto..."
                    rows={3}
                  />
                </Field>
              </div>

              {/* Curso */}
              <Field label="Curso *">
                <Select value={form.cursoId} onChange={f("cursoId")} required>
                  <option value="">Seleccionar curso</option>
                  {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </Select>
              </Field>

              {/* Módulo — obligatorio al crear (createTareaValidator.js) */}
              <Field label="Módulo *">
                <Select value={form.moduloId} onChange={f("moduloId")} required disabled={!form.cursoId}>
                  <option value="">
                    {form.cursoId ? "Seleccionar módulo" : "Selecciona un curso primero"}
                  </option>
                  {modulos.map(m => <option key={m._id} value={m._id}>{m.titulo}</option>)}
                </Select>
              </Field>

              {/* Fecha de entrega — obligatoria y debe ser futura (createTareaValidator.js) */}
              <Field label="Fecha de entrega *">
                <Input
                  type="datetime-local"
                  min={minFechaEntrega}
                  value={form.fechaEntrega}
                  onChange={f("fechaEntrega")}
                  required
                />
              </Field>

              {/* Tipo de entrega */}
              <Field label="Tipo de entrega">
                <Select value={form.tipoEntrega} onChange={f("tipoEntrega")}>
                  {TIPO_ENTREGA_OPTS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </Field>

              {/* Asignación */}
              <Field label="Asignación" hint="'Todos' asigna a todos los participantes del curso.">
                <Select value={form.asignacionTipo} onChange={f("asignacionTipo")}>
                  <option value="todos">Todos los participantes</option>
                  <option value="seleccionados">Participantes seleccionados</option>
                </Select>
              </Field>

              {/* Selector de participantes */}
              {form.asignacionTipo === "seleccionados" && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field
                    label="Selecciona participantes *"
                    hint={`${participantesSeleccionados.length} de ${participantes.length} seleccionados`}
                  >
                    <div style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10, maxHeight: 200, overflowY: "auto", padding: 8,
                    }}>
                      {participantes.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: 8, margin: 0 }}>
                          Selecciona un curso primero
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {participantes.map(p => (
                            <label
                              key={p._id}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 12px", cursor: "pointer", borderRadius: 8,
                                transition: "background 150ms",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(12,106,196,0.05)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <input
                                type="checkbox"
                                checked={participantesSeleccionados.includes(p._id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setParticipantesSeleccionados(prev => [...prev, p._id]);
                                  } else {
                                    setParticipantesSeleccionados(prev => prev.filter(id => id !== p._id));
                                  }
                                }}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                              />
                              <span style={{ fontSize: 13, color: "var(--color-text)" }}>
                                {p.nombre} {p.apellido ?? ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              )}

              {/* Archivos adjuntos */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Archivos adjuntos">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                    style={{
                      border: "2px dashed var(--color-border)", borderRadius: 12,
                      padding: "16px 20px", textAlign: "center", cursor: "pointer",
                      background: "var(--color-bg)", transition: "border-color 150ms",
                    }}
                  >
                    <Paperclip style={{ width: 18, height: 18, color: "var(--color-text-muted)", margin: "0 auto 4px", display: "block" }} />
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                      Clic para adjuntar · Imágenes, PDF, Word, Excel…
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      style={{ display: "none" }}
                      onChange={e => { const files = Array.from(e.target.files); e.target.value = ""; setArchivos(prev => [...prev, ...files]); }}
                    />
                  </div>

                  {archivos.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {archivos.map((file, i) => (
                        <FileChip
                          key={i}
                          file={file}
                          onRemove={() => setArchivos(prev => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              {/* Enlaces de referencia */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Enlaces de referencia">
                  {enlaces.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                      {enlaces.map((en, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            border: "1px solid var(--color-border)",
                            borderRadius: 8, padding: "8px 10px",
                            background: "var(--color-bg)",
                          }}
                        >
                          <Link2 style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
                          <Input
                            value={en.url}
                            onChange={e => updateEnlace(i, "url", e.target.value)}
                            placeholder="https://..."
                          />
                          <Input
                            value={en.nombre}
                            onChange={e => updateEnlace(i, "nombre", e.target.value)}
                            placeholder="Nombre (opcional)"
                          />
                          <button
                            type="button"
                            onClick={() => removeEnlace(i)}
                            title="Quitar enlace"
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--color-text-muted)", padding: 4, display: "flex",
                              borderRadius: 4, flexShrink: 0,
                            }}
                          >
                            <X style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="secondary" size="sm" onClick={addEnlace}>
                    <Plus style={{ width: 14, height: 14 }} />
                    Agregar enlace
                  </Button>
                </Field>
              </div>
            </div>
          </form>
        </AppModal.Body>
        <AppModal.Footer>
          <Button variant="ghost" type="button" onClick={() => { setShowCreate(false); setParticipantesSeleccionados([]); }}>
            Cancelar
          </Button>
          <Button type="submit" form="tareas-page-form" disabled={saving}>
            {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
            Crear reto
          </Button>
        </AppModal.Footer>
      </AppModal>

      {/* ══════════════════════════════════════════════
          Modal — Editar tarea
      ══════════════════════════════════════════════ */}
      <AppModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        size="lg"
      >
        <AppModal.Header
          title="Editar reto"
          description="Los cambios se aplican de inmediato al guardar."
          onClose={() => setShowEdit(false)}
        />
        <AppModal.Body>
          <form id="tareas-edit-form" onSubmit={handleEditSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* Título */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Título *">
                  <Input value={editForm.titulo} onChange={ef("titulo")} required />
                </Field>
              </div>

              {/* Descripción */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Descripción">
                  <Input as="textarea" value={editForm.descripcion} onChange={ef("descripcion")} rows={3} />
                </Field>
              </div>

              {/* Criterios */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Criterios de evaluación">
                  <Input as="textarea" value={editForm.criterios} onChange={ef("criterios")} rows={3} />
                </Field>
              </div>

              {/* Curso */}
              <Field label="Curso *">
                <Select value={editForm.cursoId} onChange={ef("cursoId")} required>
                  <option value="">Seleccionar curso</option>
                  {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </Select>
              </Field>

              {/* Módulo */}
              <Field label="Módulo *">
                <Select value={editForm.moduloId} onChange={ef("moduloId")} required disabled={!editForm.cursoId}>
                  <option value="">
                    {editForm.cursoId ? "Seleccionar módulo" : "Selecciona un curso primero"}
                  </option>
                  {editModulos.map(m => <option key={m._id} value={m._id}>{m.titulo}</option>)}
                </Select>
              </Field>

              {/* Fecha de entrega */}
              <Field label="Fecha de entrega *">
                <Input
                  type="datetime-local"
                  value={editForm.fechaEntrega}
                  onChange={ef("fechaEntrega")}
                  required
                />
              </Field>

              {/* Tipo de entrega */}
              <Field label="Tipo de entrega">
                <Select value={editForm.tipoEntrega} onChange={ef("tipoEntrega")}>
                  {TIPO_ENTREGA_OPTS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </Field>

              {/* Estado */}
              <Field label="Estado">
                <Select value={editForm.estado} onChange={ef("estado")}>
                  <option value="activa">Activa</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="vencida">Vencida</option>
                </Select>
              </Field>

              {/* Asignación */}
              <Field label="Asignación" hint="'Todos' asigna a todos los participantes del curso.">
                <Select value={editForm.asignacionTipo} onChange={ef("asignacionTipo")}>
                  <option value="todos">Todos los participantes</option>
                  <option value="seleccionados">Participantes seleccionados</option>
                </Select>
              </Field>

              {/* Selector de participantes */}
              {editForm.asignacionTipo === "seleccionados" && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field
                    label="Selecciona participantes *"
                    hint={`${editParticipantesSeleccionados.length} de ${editParticipantesList.length} seleccionados`}
                  >
                    <div style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10, maxHeight: 200, overflowY: "auto", padding: 8,
                    }}>
                      {editParticipantesList.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: 8, margin: 0 }}>
                          Sin participantes para este curso
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {editParticipantesList.map(p => (
                            <label
                              key={p._id}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 12px", cursor: "pointer", borderRadius: 8,
                                transition: "background 150ms",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(12,106,196,0.05)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <input
                                type="checkbox"
                                checked={editParticipantesSeleccionados.includes(p._id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setEditParticipantesSeleccionados(prev => [...prev, p._id]);
                                  } else {
                                    setEditParticipantesSeleccionados(prev => prev.filter(id => id !== p._id));
                                  }
                                }}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                              />
                              <span style={{ fontSize: 13, color: "var(--color-text)" }}>
                                {p.nombre} {p.apellido ?? ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              )}

              {/* Adjuntos ya existentes */}
              {editArchivosExistentes.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Archivos adjuntos actuales">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {editArchivosExistentes.map(a => (
                        <ExistingFileRow
                          key={a.publicId}
                          archivo={a}
                          marcado={editArchivosAEliminar.includes(a.publicId)}
                          onToggle={() => toggleArchivoAEliminar(a.publicId)}
                        />
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* Agregar nuevos archivos */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Agregar archivos nuevos">
                  <div
                    onClick={() => editFileRef.current?.click()}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                    style={{
                      border: "2px dashed var(--color-border)", borderRadius: 12,
                      padding: "16px 20px", textAlign: "center", cursor: "pointer",
                      background: "var(--color-bg)", transition: "border-color 150ms",
                    }}
                  >
                    <Paperclip style={{ width: 18, height: 18, color: "var(--color-text-muted)", margin: "0 auto 4px", display: "block" }} />
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                      Clic para adjuntar · Imágenes, PDF, Word, Excel…
                    </p>
                    <input
                      ref={editFileRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      style={{ display: "none" }}
                      onChange={e => { const files = Array.from(e.target.files); e.target.value = ""; setEditArchivosNuevos(prev => [...prev, ...files]); }}
                    />
                  </div>

                  {editArchivosNuevos.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {editArchivosNuevos.map((file, i) => (
                        <FileChip
                          key={i}
                          file={file}
                          onRemove={() => setEditArchivosNuevos(prev => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              {/* Enlaces ya existentes (solo lectura — el backend no soporta borrarlos) */}
              {editEnlacesExistentes.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Enlaces actuales">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {editEnlacesExistentes.map((en, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            border: "1px solid var(--color-border)",
                            borderRadius: 8, padding: "8px 10px",
                            background: "var(--color-bg)",
                          }}
                        >
                          <Link2 style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
                          <a href={en.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--color-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {en.nombre || en.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* Agregar enlaces nuevos */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Agregar enlaces nuevos">
                  {editEnlacesNuevos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                      {editEnlacesNuevos.map((en, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            border: "1px solid var(--color-border)",
                            borderRadius: 8, padding: "8px 10px",
                            background: "var(--color-bg)",
                          }}
                        >
                          <Link2 style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
                          <Input
                            value={en.url}
                            onChange={e => updateEditEnlace(i, "url", e.target.value)}
                            placeholder="https://..."
                          />
                          <Input
                            value={en.nombre}
                            onChange={e => updateEditEnlace(i, "nombre", e.target.value)}
                            placeholder="Nombre (opcional)"
                          />
                          <button
                            type="button"
                            onClick={() => removeEditEnlace(i)}
                            title="Quitar enlace"
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--color-text-muted)", padding: 4, display: "flex",
                              borderRadius: 4, flexShrink: 0,
                            }}
                          >
                            <X style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="secondary" size="sm" onClick={addEditEnlace}>
                    <Plus style={{ width: 14, height: 14 }} />
                    Agregar enlace
                  </Button>
                </Field>
              </div>
            </div>
          </form>
        </AppModal.Body>
        <AppModal.Footer>
          <Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="tareas-edit-form" disabled={savingEdit}>
            {savingEdit && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
            Guardar cambios
          </Button>
        </AppModal.Footer>
      </AppModal>

      {/* ══════════════════════════════════════════════
          Modal — Confirmar eliminación
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Eliminar reto"
        size="sm"
      >
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Esta acción eliminará el reto y todos sus archivos adjuntos. ¿Deseas continuar?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={() => setShowDelete(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── TareaCard ────────────────────────────────────────────────────────────────

function TareaCard({ tarea: t, onVerEntregas, onEditar, onCerrar, onDelete }) {
  const [hov, setHov] = useState(false);

  const estadoCfg = ESTADO_CFG[t.estado]         ?? ESTADO_CFG.activa;
  const asigCfg   = ASIG_CFG[t.asignacionTipo]   ?? ASIG_CFG.todos;

  const cursoNombre =
    t.curso?.nombre ??
    (typeof t.cursoId === "object" ? t.cursoId?.nombre : t.cursoId) ??
    "—";

  const modNombre  = t.modulo?.titulo ?? null;
  const fechaVenc  = t.fechaEntrega ? new Date(t.fechaEntrega) : null;
  const fechaStr   = fechaVenc
    ? fechaVenc.toLocaleDateString("es", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  // FIX: t.adjuntos mezcla archivos Y enlaces — el backend no tiene un campo
  // "enlaces" separado en el modelo Tarea, ambos viven juntos en
  // archivosAdjuntos distinguidos por "tipo" (ver normalizeTarea.js). Antes
  // se contaba t.adjuntos.length entero y se etiquetaba como "archivo(s)",
  // así que un enlace guardado correctamente nunca se veía reflejado en la
  // tarjeta de la lista — solo era visible entrando a "Editar".
  const todosAdjuntos = t.adjuntos ?? [];
  const totalArchivos = todosAdjuntos.filter(a => a.tipo !== "enlace").length;
  const totalEnlaces  = todosAdjuntos.filter(a => a.tipo === "enlace").length;

  // Estilos de botones de acción inline (pequeños, sin variante dedicada)
  const actionBtn = (color = "var(--color-text-muted)") => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color, cursor: "pointer",
    transition: "background 150ms, border-color 150ms",
  });

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--color-surface)",
        borderRadius: 16,
        border: `1px solid ${hov ? "rgba(12,106,196,0.20)" : "var(--color-border)"}`,
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "all 180ms",
      }}
    >
      {/* Ícono */}
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: "rgba(99,102,241,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 14, color: "var(--color-text)" }}>
            {t.titulo}
          </p>
          <span style={{
            padding: "2px 9px", borderRadius: 99,
            background: estadoCfg.bg, color: estadoCfg.color,
            fontSize: 10.5, fontWeight: 700,
          }}>
            {estadoCfg.label}
          </span>
          <span style={{
            padding: "2px 9px", borderRadius: 99,
            background: "rgba(99,102,241,0.08)", color: asigCfg.color,
            fontSize: 10.5, fontWeight: 700,
          }}>
            {asigCfg.label}
          </span>
        </div>

        <div style={{
          display: "flex", gap: 14, marginTop: 5,
          flexWrap: "wrap", alignItems: "center",
          fontSize: 12, color: "var(--color-text-muted)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <BookOpen size={11} /> {cursoNombre}
          </span>
          {modNombre && <span>· {modNombre}</span>}
          {fechaStr && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} /> Vence: {fechaStr}
            </span>
          )}
          {totalArchivos > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Paperclip size={11} /> {totalArchivos} archivo(s)
            </span>
          )}
          {totalEnlaces > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link2 size={11} /> {totalEnlaces} enlace(s)
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onVerEntregas} style={actionBtn("var(--color-primary)")}>
          Entregas <ChevronRight size={13} />
        </button>

        <button onClick={onEditar} style={actionBtn("#6366F1")} title="Editar reto">
          <Pencil size={13} /> Editar
        </button>

        {t.estado === "activa" && (
          <button onClick={onCerrar} style={actionBtn("#64748B")}>
            <Lock size={13} /> Cerrar
          </button>
        )}

        <button
          onClick={onDelete}
          style={actionBtn("var(--color-error)")}
          title="Eliminar reto"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}