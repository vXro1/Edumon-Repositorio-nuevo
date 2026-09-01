import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import CursoContext from "../../context/CursoContext";
import { ClipboardList, Clock, Eye, Pencil, Lock, Layers } from "lucide-react";

import { tareasGetAll, tareasGetById, tareasCreate, tareasUpdate, tareasDelete } from "@/features/cursos/services/tareasService";
import { cursosGetParticipantes, modulosGetByCurso } from "@/features/cursos/services/cursosService";

import { AppModal, Button, Toast, IconActionButton } from "@/components";
import {
  Sk,
  EmptyState,
  SectionHeader,
} from "../shared/ui";
import { normalizeTarea } from "@/lib/normalizers/tarea";
import { humanizeError } from "@/utils/humanizeError";
import { parseValidationErrors, summarizeValidationErrors } from "@/utils/parseValidationErrors";

import { fmt, fmtHour, esPasada, makeNotify } from "../shared/helpers";

import TareaDetalle from "./TareaDetalle";
import TareaForm from "./TareaForm";


const emptyForm = () => ({
  titulo: "",
  descripcion: "",
  criterios: "",
  etiquetas: [],
  fechaEntrega: "",
  moduloId: "",
  asignacionTipo: "todos",
  tipoEntrega: "archivo",
  participantes: [],
  archivosNuevos: [],
  archivosEliminar: [],
  enlacesNuevos: [],
  enlacesExistentes: [],
  // no existe "enlacesEliminar" — el backend no soporta borrar un enlace existente
});

export default function TareasTab({ cursoId: cursoIdProp, canManage: canManageProp, canGrade: canGradeProp, esPadre: esPadreProp }) {
  const ctx = useContext(CursoContext);
  const cursoId = ctx?.cursoId ?? cursoIdProp;
  const canManage = ctx?.canManageTasks ?? canManageProp;
  const canGrade = ctx?.canGradeEntregas ?? canGradeProp;
  const esPadre = esPadreProp ?? false;
  const navigate = useNavigate();

  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const [participantesCurso, setParticipantesCurso] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

  const [modulos, setModulos] = useState([]);
  const [loadingModulos, setLoadingModulos] = useState(false);

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  // ── CARGAR TAREAS ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tareasGetAll({ cursoId });
      setTareas((res.tareas ?? res.data ?? []).map(normalizeTarea));
    } catch {
      setTareas([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  // ── PARTICIPANTES ──────────────────────────────────────────────────
  const loadParticipantes = useCallback(async () => {
    setLoadingParts(true);
    try {
      const res = await cursosGetParticipantes(cursoId, { limit: 200 });
      const lista = res.participantes ?? res.data ?? [];
      setParticipantesCurso(
        lista
          .map(p => {
            const u = p.usuario ?? p.usuarioId ?? p;
            return {
              _id: String(u._id ?? p._id ?? ""),
              nombre: u.nombre ?? "",
              apellido: u.apellido ?? "",
              rol: u.rol ?? p.etiqueta ?? "",
            };
          })
          .filter(p => p._id)
      );
    } catch {
      setParticipantesCurso([]);
    } finally {
      setLoadingParts(false);
    }
  }, [cursoId]);

  // ── MÓDULOS ────────────────────────────────────────────────────────
  const loadModulos = useCallback(async () => {
    setLoadingModulos(true);
    try {
      const res = await modulosGetByCurso(cursoId);
      setModulos(res.modulos ?? res ?? []);
    } catch {
      setModulos([]);
    } finally {
      setLoadingModulos(false);
    }
  }, [cursoId]);

  // ── MODALES ────────────────────────────────────────────────────────
  const openCreate = async () => {
    setCreating(true);
    setEditTarget(null);
    setViewTarget(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
    await Promise.all([loadParticipantes(), loadModulos()]);
  };

  // reutilizada: primero con el dato de la lista, luego con el fetch fresco
  const buildEditForm = (t) => {
    const selIds = (t.participantesSeleccionados ?? [])
      .map(p => String(typeof p === "object" ? p._id ?? "" : p))
      .filter(Boolean);

    const enlacesExistentes = (t.adjuntos ?? t.archivosAdjuntos ?? [])
      .filter(a => a.tipo === "enlace");

    return {
      titulo: t.titulo ?? "",
      descripcion: t.descripcion ?? "",
      criterios: typeof t.criterios === "string" ? t.criterios : "",
      etiquetas: Array.isArray(t.etiquetas) ? t.etiquetas : [],
      fechaEntrega: t.fechaEntrega ? t.fechaEntrega.substring(0, 16) : "",
      moduloId: t.moduloId ?? (typeof t.modulo === "object" ? t.modulo?._id ?? "" : t.modulo ?? ""),
      asignacionTipo: t.asignacionTipo ?? "todos",
      tipoEntrega: t.tipoEntrega ?? "archivo",
      participantes: selIds,
      archivosNuevos: [],
      archivosEliminar: [],
      enlacesNuevos: [],
      enlacesExistentes,
    };
  };

  const openEdit = async (t) => {
    setCreating(false);
    setEditTarget(t);
    setViewTarget(null);
    setForm(buildEditForm(t));
    setErrors({});
    setModalOpen(true);

    // la fila de la lista puede estar desactualizada; se repite el fetch por ID
    const fetchFresh = tareasGetById(t._id ?? t.id)
      .then(fresh => {
        const normalized = normalizeTarea(fresh);
        setEditTarget(normalized);
        setForm(buildEditForm(normalized));
      })
      .catch(() => {
        // si falla, se sigue con los datos de la lista
      });

    await Promise.all([loadParticipantes(), loadModulos(), fetchFresh]);
  };
  const openDetail = (t) => {
    setCreating(false);
    setEditTarget(null);
    setViewTarget(t);
    setModalOpen(true);
  };

  // ver/hacer una entrega vive en su propia URL, no en un modal anidado
  const openEntregas = (t) => {
    navigate(esPadre ? `/familia/entregas/${t._id}` : `/tareas/${t._id}/entregas`);
  };

  const handleClose = () => {
    setModalOpen(false);
    setViewTarget(null);
    setEditTarget(null);
    setCreating(false);
    setErrors({});
  };

  // ── GUARDAR ────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (saving) return;

    const nextErrors = {};

    // mismo mínimo que el validador del backend
    if (!form.titulo.trim()) {
      nextErrors.titulo = "El título es requerido";
    } else if (form.titulo.trim().length < 3) {
      nextErrors.titulo = "El título debe tener al menos 3 caracteres";
    }
    if (!form.fechaEntrega) {
      nextErrors.fechaEntrega = "La fecha de entrega es requerida";
    } else if (new Date(form.fechaEntrega) < new Date()) {
      nextErrors.fechaEntrega = "La fecha de entrega debe ser futura";
    }
    if (creating && !form.moduloId) {
      nextErrors.moduloId = "Selecciona un módulo";
    }
    if (form.asignacionTipo === "seleccionados" && form.participantes.length === 0) {
      nextErrors.participantes = "Selecciona al menos un participante";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notify("Revisa los campos marcados", "error");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titulo", form.titulo.trim());
      fd.append("descripcion", form.descripcion.trim());
      fd.append("criterios", form.criterios?.trim() ?? "");
      fd.append("cursoId", cursoId);
      fd.append("asignacionTipo", form.asignacionTipo);
      fd.append("tipoEntrega", form.tipoEntrega || "archivo");
      // docenteId no se envía — el backend siempre lo fuerza a req.user.userId

      if (form.moduloId) fd.append("moduloId", form.moduloId);
      if (form.fechaEntrega) fd.append("fechaEntrega", form.fechaEntrega);

      // etiquetas[] / participantesSeleccionados[] — el validator tiene isArray(),
      // los corchetes hacen que Multer arme el array incluso con un solo valor
      (form.etiquetas ?? []).forEach(tag => fd.append("etiquetas[]", tag));

      if (form.asignacionTipo === "seleccionados") {
        form.participantes.forEach(id => fd.append("participantesSeleccionados[]", id));
      }

      form.archivosNuevos.forEach(f => fd.append("archivos", f));

      // estos campos no tienen isArray() en el validator, así que JSON.stringify() funciona
      if (editTarget && form.archivosEliminar.length > 0) {
        fd.append("archivosAEliminar", JSON.stringify(form.archivosEliminar));
      }

      const enlacesValidos = form.enlacesNuevos.filter(en => en.url?.trim());
      if (enlacesValidos.length > 0) {
        const enlacesKey = editTarget ? "nuevosEnlaces" : "enlaces";
        fd.append(enlacesKey, JSON.stringify(enlacesValidos));
        // payload confirmado correcto por captura de red; el backend responde 200
        // pero igual deja enlaces vacíos — es un bug de backend, no tocar esto sin evidencia nueva
      }

      if (editTarget) {
        await tareasUpdate(editTarget._id, fd);
        notify("Reto actualizado");
        // el backend ignora cambios de "etiquetas" al editar (solo se guardan al crear) — no corregible en frontend
      } else {
        await tareasCreate(fd);
        notify("Reto creado");
      }

      handleClose();
      load();
    } catch (err) {
      const fieldErrors = parseValidationErrors(err);
      if (fieldErrors) {
        // el backend usa "participantesSeleccionados"; TareaForm pinta ese error bajo "participantes"
        if (fieldErrors.participantesSeleccionados && !fieldErrors.participantes) {
          fieldErrors.participantes = fieldErrors.participantesSeleccionados;
        }
        setErrors(fieldErrors);
        notify(summarizeValidationErrors(fieldErrors), "error");
      } else {
        notify(humanizeError(err, "Error al guardar reto"), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // tareasDelete no borra el reto, solo lo cierra y limpia sus adjuntos
  const handleDelete = async (id) => {
    if (!confirm("¿Cerrar este reto? No se podrá reabrir y se eliminarán sus archivos adjuntos.")) return;
    try {
      await tareasDelete(id);
      notify("Reto cerrado");
      load();
    } catch {
      notify("Error al cerrar el reto", "error");
    }
  };

  // ── Título del modal ───────────────────────────────────────────────
  const modalTitle = creating
    ? "Nuevo reto"
    : editTarget
      ? "Editar reto"
      : viewTarget?.titulo ?? "Detalle del reto";

  const isForm = editTarget || creating;

  return (
    <div>
      <Toast {...toast} />

      <SectionHeader
        title="Retos"
        action={canManage ? { label: "Nuevo reto", onClick: openCreate } : null}
      />

      {/* LISTA */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map(i => <Sk key={i} h={72} r={12} />)}
        </div>
      ) : tareas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin retos"
          desc={canManage ? "Crea el primer reto del curso." : "No hay retos asignados aún."}
          action={canManage ? { label: "Crear reto", onClick: openCreate } : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tareas.map(t => {
            const vencida = esPasada(t.fechaEntrega ?? t.fechaVencimiento);
            const fecha = t.fechaEntrega ?? t.fechaVencimiento;
            const moduloNombre = t.modulo?.titulo ?? null;

            return (
              <div
                key={t._id}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: 12,
                  border: `1px solid ${vencida ? "var(--color-error)" : "var(--color-border)"}`,
                  padding: "14px 18px",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: vencida ? "var(--color-error-light)" : "rgba(99,102,241,0.1)",
                  flexShrink: 0,
                }}>
                  <ClipboardList style={{ width: 16, height: 16, color: vencida ? "red" : "#6366F1" }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{t.titulo}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {fecha && (
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock style={{ width: 11, height: 11 }} />
                        {fmt(fecha)} {fmtHour(fecha)}
                      </span>
                    )}
                    {moduloNombre && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                        background: "var(--color-primary-light)", color: "var(--color-primary)",
                        display: "inline-flex", alignItems: "center", gap: 4,
                        boxShadow: "var(--clay-pill)",
                      }}>
                        <Layers style={{ width: 10, height: 10 }} />
                        {moduloNombre}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  <IconActionButton icon={Eye} color="var(--color-primary)" title="Ver" onClick={() => openDetail(t)} />
                  {canManage && (
                    <>
                      <IconActionButton icon={Pencil} color="#6366F1" title="Editar" onClick={() => openEdit(t)} />
                      <IconActionButton icon={Lock} color="#64748B" title="Cerrar reto" onClick={() => handleDelete(t._id)} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <AppModal
        isOpen={modalOpen}
        onClose={handleClose}
        size="md"
      >
        <AppModal.Header title={modalTitle} onClose={handleClose} />

        <AppModal.Body>
          {/* Detalle de tarea */}
          {!editTarget && !creating && viewTarget && (
            <TareaDetalle
              tarea={viewTarget}
              canManage={canManage}
              canGrade={canGrade}
              esPadre={esPadre}
              onEdit={openEdit}
              onDelete={handleDelete}
              onViewEntregas={() => openEntregas(viewTarget)}
            />
          )}

          {/* Formulario de creación / edición */}
          {isForm && (
            <TareaForm
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
              editTarget={editTarget}
              participantesCurso={participantesCurso}
              loadingParts={loadingParts}
              modulos={modulos}
              loadingModulos={loadingModulos}
              onSubmit={handleSave}
            />
          )}
        </AppModal.Body>

        {/* Footer sticky solo en modo formulario */}
        {isForm && (
          <AppModal.Footer>
            <Button variant="ghost" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" form="tarea-form" disabled={saving}>
              {saving ? "Guardando…" : editTarget ? "Guardar cambios" : "Crear reto"}
            </Button>
          </AppModal.Footer>
        )}
      </AppModal>
    </div>
  );
}