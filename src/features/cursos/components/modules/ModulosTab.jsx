// src/features/cursos/components/modules/ModulosTab.jsx
import { useState, useEffect, useCallback, useContext } from "react";
import CursoContext from "../../context/CursoContext";
import { BookOpen, Eye, Pencil, Trash2, Upload } from "lucide-react";
import { modulosGetByCurso, modulosCreate, modulosUpdate, modulosDelete } from "@/features/cursos/services/cursosService";
import { Button, Input, AppModal, Badge, Toast, CsvUploadModal } from "@/components";
import { Sk, EmptyState, Field, StTextarea, InfoBlock, IconBtn } from "../shared/ui";
import { makeNotify } from "../shared/helpers";
import {
  descargarPlantillaModulosCSV,
  parsearCsvModulos,
  CSV_COLUMNAS_MODULOS,
} from "@/components/ui/ModulosCsvTemplate";

export default function ModulosTab({ cursoId: cursoIdProp, canManage: canManageProp }) {
  const ctx       = useContext(CursoContext);
  const cursoId   = ctx?.cursoId   ?? cursoIdProp;
  const canManage = ctx?.canManageModules ?? canManageProp;
  const [modulos, setModulos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [csvOpen, setCsvOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [form, setForm]           = useState({ titulo: "", descripcion: "" });
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await modulosGetByCurso(cursoId);
      setModulos(res.modulos ?? res.data ?? res ?? []);
    } catch { setModulos([]); }
    finally { setLoading(false); }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  // ── CRUD individual ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm({ titulo: "", descripcion: "" });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditTarget(m);
    setForm({ titulo: m.titulo ?? "", descripcion: m.descripcion ?? "" });
    setModalOpen(true);
  };

  const openDetail = (m) => { setViewTarget(m); setDetailOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { notify("El título es requerido", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await modulosUpdate(editTarget._id, form);
        notify("Módulo actualizado");
      } else {
        await modulosCreate({ ...form, cursoId });
        notify("Módulo creado");
      }
      setModalOpen(false);
      load();
    } catch { notify("Error al guardar", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este módulo?")) return;
    try { await modulosDelete(id); notify("Módulo eliminado"); load(); }
    catch { notify("Error al eliminar", "error"); }
  };

  // ── Carga masiva CSV ──────────────────────────────────────────────────────
  // CsvUploadModal entrega un File. Aquí:
  //   1. Parseamos el CSV en el cliente con parsearCsvModulos()
  //   2. Creamos cada módulo individualmente (no hay endpoint masivo para módulos)
  //   3. Devolvemos el resumen { total, exitosos, fallidos, detalle[] }
  //      con el mismo shape que espera SuccessPanel en CsvUploadModal
  const handleCsvUpload = async (file) => {
    // Paso 1 — parsear. Lanza Error si el archivo es inválido.
    const rows = await parsearCsvModulos(file);

    if (rows.length === 0) {
      throw new Error("El archivo no contiene filas de datos.");
    }

    // Paso 2 — crear en loop
    let exitosos = 0;
    const detalle = [];

    for (const row of rows) {
      if (!row.titulo.trim()) {
        detalle.push({ fila: row._fila, error: "El campo 'titulo' está vacío." });
        continue;
      }
      try {
        await modulosCreate({ cursoId, titulo: row.titulo, descripcion: row.descripcion });
        exitosos++;
      } catch (err) {
        detalle.push({
          fila: row._fila,
          error: err?.message ?? "Error al crear el módulo.",
        });
      }
    }

    // Paso 3 — refrescar lista
    await load();

    // Paso 4 — devolver resumen para el panel de SuccessPanel del modal
    return {
      total:    rows.length,
      exitosos,
      fallidos: detalle.length,
      detalle,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <Toast {...toast} />

      {/* ── Encabezado ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0, overflowWrap: "anywhere" }}>
          Módulos del curso
        </h3>
        {canManage && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" size="sm" onClick={() => setCsvOpen(true)}>
              <Upload style={{ width: 13, height: 13 }} /> Carga CSV
            </Button>
            <Button size="sm" onClick={openCreate}>+ Nuevo módulo</Button>
          </div>
        )}
      </div>

      {/* ── Lista / skeleton / vacío ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map((i) => <Sk key={i} h={72} r={12} />)}
        </div>
      ) : modulos.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin módulos aún"
          desc={canManage
            ? "Crea el primer módulo o carga uno desde CSV."
            : "El docente aún no ha publicado contenido."}
          action={canManage ? { label: "Crear módulo", onClick: openCreate } : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {modulos.map((m, idx) => (
            <div key={m._id} style={{
              background: "var(--color-surface)", borderRadius: 12,
              border: "1px solid var(--color-border)", padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: "var(--color-primary-light)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "var(--color-primary)",
              }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  {m.titulo}
                </p>
                {m.descripcion && (
                  <p style={{
                    fontSize: 12.5, color: "var(--color-text-muted)", margin: "3px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {m.descripcion}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <IconBtn title="Ver" color="var(--color-primary)" onClick={() => openDetail(m)}>
                  <Eye style={{ width: 14, height: 14 }} />
                </IconBtn>
                {canManage && (
                  <>
                    <IconBtn title="Editar" color="#6366F1" onClick={() => openEdit(m)}>
                      <Pencil style={{ width: 13, height: 13 }} />
                    </IconBtn>
                    <IconBtn title="Eliminar" color="var(--color-error)" onClick={() => handleDelete(m._id)}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </IconBtn>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal — Crear / Editar módulo
      ══════════════════════════════════════════════ */}
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <AppModal.Header
          title={editTarget ? "Editar módulo" : "Nuevo módulo"}
          onClose={() => setModalOpen(false)}
        />
        <AppModal.Body>
          <form id="modulos-form" onSubmit={handleSave}>
            <Field label="Título *">
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Introducción"
                required
              />
            </Field>
            <Field label="Descripción">
              <StTextarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción opcional"
                rows={4}
              />
            </Field>
          </form>
        </AppModal.Body>
        <AppModal.Footer>
          <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button type="submit" form="modulos-form" disabled={saving}>
            {saving ? "Guardando..." : editTarget ? "Guardar cambios" : "Crear módulo"}
          </Button>
        </AppModal.Footer>
      </AppModal>

      {/* ══════════════════════════════════════════════
          Modal — Detalle módulo
      ══════════════════════════════════════════════ */}
      <AppModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} size="sm">
        <AppModal.Header
          title={viewTarget?.titulo ?? "Módulo"}
          onClose={() => setDetailOpen(false)}
        />
        <AppModal.Body>
          {viewTarget && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: "var(--color-primary-light)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <BookOpen style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--color-text)" }}>
                    {viewTarget.titulo}
                  </p>
                  <Badge variant="info" styleType="soft" size="sm">
                    {viewTarget.estado ?? "activo"}
                  </Badge>
                </div>
              </div>
              <InfoBlock label="Descripción">
                <p style={{ fontSize: 13.5, color: "var(--color-text)", margin: 0, lineHeight: 1.6 }}>
                  {viewTarget.descripcion?.trim()
                    ? viewTarget.descripcion
                    : <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>Sin descripción</span>}
                </p>
              </InfoBlock>
            </div>
          )}
        </AppModal.Body>
        <AppModal.Footer>
          {viewTarget && canManage ? (
            <>
              <Button variant="ghost" size="sm"
                onClick={() => { setDetailOpen(false); openEdit(viewTarget); }}>
                <Pencil style={{ width: 13, height: 13 }} /> Editar
              </Button>
              <Button variant="ghost" size="sm"
                style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
                onClick={() => { setDetailOpen(false); handleDelete(viewTarget._id); }}>
                <Trash2 style={{ width: 13, height: 13 }} /> Eliminar
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>Cerrar</Button>
          )}
        </AppModal.Footer>
      </AppModal>

      {/* ══════════════════════════════════════════════
          Modal — Carga masiva CSV (reutilizable)
      ══════════════════════════════════════════════ */}
      <CsvUploadModal
        isOpen={csvOpen}
        onClose={() => setCsvOpen(false)}
        onUpload={handleCsvUpload}
        onDownloadTemplate={descargarPlantillaModulosCSV}
        title="Carga masiva de módulos"
        description="Sube un CSV con los módulos a crear. La columna 'titulo' es requerida; 'descripcion' es opcional."
        templateLabel="Descargar plantilla"
        acceptedColumns={CSV_COLUMNAS_MODULOS}
        maxFileSizeMB={5}
      />
    </div>
  );
}