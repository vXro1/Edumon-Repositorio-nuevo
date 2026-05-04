import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Clock, Eye, Pencil, Trash2 } from "lucide-react";

import {
  tareasGetAll,
  tareasCreate,
  tareasUpdate,
  tareasDelete,
  cursosGetParticipantes,
} from "@/lib/apiClient";

import { Badge, Modal, Toast,IconActionButton } from "@/components";
import {
  Sk,
  EmptyState,
  SectionHeader,
  iconBtn,
} from "../shared/ui";

import { fmt, fmtHour, esPasada, makeNotify } from "../shared/helpers";

import TareaDetalle from "./TareaDetalle";
import TareaForm from "./TareaForm";
import EntregasTab from "../entregas/EntregasTab";
import CalificarEntrega from "../entregas/CalificarEntrega";
import RealizarEntrega from "../entregas/RealizarEntrega";


const emptyForm = () => ({
  titulo: "",
  descripcion: "",
  fechaEntrega: "",
  asignacionTipo: "todos",
  participantes: [],
  archivosNuevos: [],
  archivosEliminar: [],
  enlacesNuevos: [],
});

export default function TareasTab({ cursoId, canManage, canGrade, esPadre }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewMode, setViewMode] = useState("detail");

  const [gradeTarget, setGradeTarget] = useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm());
  const [participantesCurso, setParticipantesCurso] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  // ── LOAD TAREAS ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tareasGetAll({ cursoId });
      setTareas(res.tareas ?? res.data ?? res ?? []);
    } catch {
      setTareas([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── PARTICIPANTES ───────────────────────────────────────────
  const loadParticipantes = useCallback(async () => {
    setLoadingParts(true);
    try {
      const res = await cursosGetParticipantes(cursoId, { limit: 200 });
      const lista = res.participantes ?? res.data ?? [];

      setParticipantesCurso(
        lista
          .map((p) => {
            const u = p.usuario ?? p.usuarioId ?? p;
            return {
              _id: String(u._id ?? p._id ?? ""),
              nombre: u.nombre ?? "",
              apellido: u.apellido ?? "",
              rol: u.rol ?? p.etiqueta ?? "",
            };
          })
          .filter((p) => p._id)
      );
    } catch {
      setParticipantesCurso([]);
    } finally {
      setLoadingParts(false);
    }
  }, [cursoId]);

  // ── MODALES ────────────────────────────────────────────────
  const openCreate = async () => {
    setEditTarget(null);
    setForm(emptyForm());
    setViewMode("detail");
    await loadParticipantes();
    setModalOpen(true);
  };

  const openEdit = async (t) => {
    setEditTarget(t);

    const selIds = (t.participantesSeleccionados ?? [])
      .map((p) => String(typeof p === "object" ? p._id ?? "" : p))
      .filter(Boolean);

    setForm({
      titulo: t.titulo ?? "",
      descripcion: t.descripcion ?? "",
      fechaEntrega: t.fechaEntrega
        ? t.fechaEntrega.substring(0, 16)
        : "",
      asignacionTipo: t.asignacionTipo ?? "todos",
      participantes: selIds,
      archivosNuevos: [],
      archivosEliminar: [],
      enlacesNuevos: [],
    });

    setViewMode("detail");
    await loadParticipantes();
    setModalOpen(true);
  };

  const openDetail = (t) => {
    setViewTarget(t);
    setViewMode("detail");
    setModalOpen(true);
  };

  const openEntregas = (t) => {
    setViewTarget(t);
    setViewMode("entregas");
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setViewMode("detail");
    setViewTarget(null);
    setEditTarget(null);
    setGradeTarget(null);
  };

  // ── SAVE ───────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      notify("El título es requerido", "error");
      return;
    }

    if (
      form.asignacionTipo === "seleccionados" &&
      form.participantes.length === 0
    ) {
      notify("Selecciona al menos un participante", "error");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("titulo", form.titulo.trim());
      fd.append("descripcion", form.descripcion.trim());
      fd.append("cursoId", cursoId);
      fd.append("asignacionTipo", form.asignacionTipo);

      if (form.fechaEntrega) {
        fd.append("fechaEntrega", form.fechaEntrega);
      }

      if (form.asignacionTipo === "seleccionados") {
        form.participantes.forEach((id) =>
          fd.append("participantesSeleccionados", id)
        );
      }

      form.archivosNuevos.forEach((f) =>
        fd.append("archivos", f)
      );

      if (editTarget && form.archivosEliminar.length > 0) {
        form.archivosEliminar.forEach((pid) =>
          fd.append("archivosAEliminar", pid)
        );
      }

      if (form.enlacesNuevos.length > 0) {
        fd.append("enlaces", JSON.stringify(form.enlacesNuevos));
      }

      if (editTarget) {
        await tareasUpdate(editTarget._id, fd);
        notify("Tarea actualizada");
      } else {
        await tareasCreate(fd);
        notify("Tarea creada");
      }

      handleClose();
      load();
    } catch (err) {
      notify(err.message ?? "Error al guardar tarea", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta tarea?")) return;

    try {
      await tareasDelete(id);
      notify("Tarea eliminada");
      load();
    } catch {
      notify("Error al eliminar la tarea", "error");
    }
  };

  const modalTitle = editTarget
    ? "Editar tarea"
    : viewMode === "entregas"
    ? "Entregas"
    : viewTarget?.titulo ?? "Tarea";

  return (
    <div>
      <Toast {...toast} />

      <SectionHeader
        title="Tareas"
        action={
          canManage
            ? { label: "Nueva tarea", onClick: openCreate }
            : null
        }
      />

      {/* LISTA */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Sk key={i} h={72} r={12} />
          ))}
        </div>
      ) : tareas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin tareas"
          desc={
            canManage
              ? "Crea la primera tarea del curso."
              : "No hay tareas asignadas aún."
          }
          action={
            canManage
              ? { label: "Crear tarea", onClick: openCreate }
              : null
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tareas.map((t) => {
            const vencida = esPasada(
              t.fechaEntrega ?? t.fechaVencimiento
            );

            const fecha = t.fechaEntrega ?? t.fechaVencimiento;
            const adjCount = t.archivosAdjuntos?.length ?? 0;

            return (
              <div
                key={t._id}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: 12,
                  border: `1px solid ${
                    vencida
                      ? "var(--color-error)"
                      : "var(--color-border)"
                  }`,
                  padding: "14px 18px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: vencida
                      ? "var(--color-error-light)"
                      : "rgba(99,102,241,0.1)",
                  }}
                >
                  <ClipboardList
                    style={{
                      width: 16,
                      height: 16,
                      color: vencida ? "red" : "#6366F1",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>
                    {t.titulo}
                  </p>

                  {fecha && (
                    <p style={{ fontSize: 12, opacity: 0.7 }}>
                      <Clock style={{ width: 11, height: 11 }} />{" "}
                      {fmt(fecha)} {fmtHour(fecha)}
                    </p>
                  )}
                </div>

                {/* ACTIONS MIGRADAS */}
                <div style={{ display: "flex", gap: 6 }}>
                  <IconActionButton
                    icon={Eye}
                    color="var(--color-primary)"
                    title="Ver"
                    onClick={() => openDetail(t)}
                  />

                  {canManage && (
                    <>
                      <IconActionButton
                        icon={Pencil}
                        color="#6366F1"
                        title="Editar"
                        onClick={() => openEdit(t)}
                      />

                      <IconActionButton
                        icon={Trash2}
                        color="var(--color-error)"
                        title="Eliminar"
                        onClick={() =>
                          handleDelete(t._id)
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={modalTitle}
        size={viewMode === "entregas" ? "lg" : "md"}
      >
        {viewMode === "detail" && !editTarget && viewTarget && (
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

        {viewMode === "detail" && editTarget && (
          <TareaForm
            form={form}
            setForm={setForm}
            editTarget={editTarget}
            participantesCurso={participantesCurso}
            loadingParts={loadingParts}
            saving={saving}
            onSubmit={handleSave}
            onCancel={handleClose}
          />
        )}

        {viewMode === "entregas" && viewTarget && (
          <EntregasTab
            tarea={viewTarget}
            canGrade={canGrade}
            esPadre={esPadre}
            onBack={() => setViewMode("detail")}
          />
        )}

        {viewMode === "calificar" && gradeTarget && (
          <CalificarEntrega
            entrega={gradeTarget}
            onCancel={() => setViewMode("entregas")}
          />
        )}

        {viewMode === "realizar" && viewTarget && (
          <RealizarEntrega
            tarea={viewTarget}
            onCancel={() => setViewMode("entregas")}
          />
        )}
      </Modal>
    </div>
  );
}