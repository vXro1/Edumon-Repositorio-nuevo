// src/features/cursos/components/participantes/ParticipantesTab.jsx
import { useState, useEffect, useCallback, useContext } from "react";
import CursoContext from "../../context/CursoContext";
import {
  Users, UserMinus, Upload, UserPlus, Mail, Phone, Hash,
  Shield, Calendar, Clock, Eye, Edit2,
} from "lucide-react";
import {
  cursosGetParticipantes,
  cursosAddParticipante,
  cursosRemoveParticipante,
  cursosAddParticipantesCsv,
} from "@/features/cursos/services/cursosService";
import { usersGetById } from "@/services/usersService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeUser } from "@/lib/normalizers";
import { Badge, Button, Input, AppModal, UserAvatar, Toast, CsvUploadModal, PhoneInput } from "@/components";
import { Sk, EmptyState, Field, iconBtn } from "../shared/ui";
import { makeNotify } from "../shared/helpers";
import { descargarPlantillaPadresCSV, CSV_COLUMNAS_PADRES } from "@/components/ui/PadresCsvTemplate";
import { normalizePhone, isValidPhone, PHONE_ERROR } from "@/utils/normalizePhone";
import {
  contrasenaInicial, TEXTO_CONTRASENA_INICIAL,
  isValidCedula, CEDULA_ERROR, toCedula,
} from "@/utils/credenciales";

const EMPTY_FORM = { nombre: "", apellido: "", cedula: "", telefono: "" };

const ROL_META = {
  superadmin: { label: "Super Admin", color: "#F87171" },
  administrador: { label: "Administrador", color: "#60A5FA" },
  docente: { label: "Docente", color: "#34D399" },
  padre: { label: "Padre/Tutor", color: "#FBBF24" },
  "padre/tutor": { label: "Padre/Tutor", color: "#FBBF24" },
};

// Sin fecha real, devuelve null (no "—"): InfoRow ya oculta filas con
// valor falsy — un placeholder aquí rompía ese comportamiento y dejaba
// filas vacías tipo "Registro —" para roles (docente) a los que el backend
// nunca les manda fechaRegistro/ultimoAcceso (ver GET /api/users/:id,
// restringido a administrador/superadmin en userRoutes.js).
function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Fila de información dentro del modal de detalle ─────────────── */
function InfoRow({ icon: Icon, label, value, color = "var(--color-primary)" }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 0", borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: "rgba(12,106,196,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <div>
        <p style={{
          fontSize: 10.5, fontWeight: 700, color: "var(--color-text-muted)",
          textTransform: "uppercase", letterSpacing: "0.06em", margin: 0,
        }}>
          {label}
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--color-text)", margin: "2px 0 0" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ParticipantesTab({ cursoId: cursoIdProp, canManage: canManageProp }) {
  const ctx = useContext(CursoContext);
  const cursoId = ctx?.cursoId ?? cursoIdProp;
  const canManage = ctx?.canManageParticipants ?? canManageProp;
  const { user } = useAuth();
  // GET /api/users/:id (usado para traer el detalle completo) está
  // restringido a administrador/superadmin en el backend (userRoutes.js) —
  // para cualquier otro rol es un 403 garantizado, así que ni se intenta:
  // se muestra directo el dato ya disponible de la lista de participantes.
  const puedeVerDetalleCompleto = user?.rol === "administrador" || user?.rol === "superadmin";
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  // Confirmación de eliminación (reemplaza al confirm() nativo del navegador)
  const [removeTarget, setRemoveTarget] = useState(null); // { id, nombre } | null
  const [removing, setRemoving] = useState(false);

  // ── Detalle de usuario (modal de perfil completo) ───────────────────────
  const [viewTarget, setViewTarget] = useState(null); // usuario básico de la lista, para mostrar algo mientras carga
  const [viewDetail, setViewDetail] = useState(null); // usuario enriquecido desde el backend
  const [viewLoading, setViewLoading] = useState(false);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cursosGetParticipantes(cursoId, { limit: 100 });
      setParts(
        (res.participantes ?? res.data ?? []).map((p) => ({
          ...p,
          usuario: normalizeUser(p.usuario ?? p),
        }))
      );
    } catch { setParts([]); }
    finally { setLoading(false); }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const closeAddModal = () => {
    setAddOpen(false);
    setForm(EMPTY_FORM);
  };

  // ── Agregar individual ────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    const cedula = form.cedula.trim();
    const telefono = form.telefono.trim();

    if (!nombre || !apellido || !cedula || !telefono) {
      notify("Todos los campos son requeridos", "error"); return;
    }
    if (!isValidCedula(cedula)) { notify(CEDULA_ERROR, "error"); return; }
    if (!isValidPhone(telefono)) { notify(PHONE_ERROR, "error"); return; }

    setSaving(true);
    try {
      // No se envía "contraseña": el backend aplica la regla única del sistema
      // (contraseña inicial = cédula). El teléfono siempre viaja como +57XXXXXXXXXX.
      await cursosAddParticipante(cursoId, {
        nombre, apellido, cedula,
        telefono: normalizePhone(telefono),
      });
      notify(`Participante agregado. Contraseña inicial: ${contrasenaInicial(cedula)}`);
      closeAddModal();
      load();
    } catch { notify("Error al agregar participante", "error"); }
    finally { setSaving(false); }
  };

  // ── Carga masiva CSV ──────────────────────────────────────────────────────
  // El backend (registrarUsuariosMasivo → procesarUsuariosCSV) responde con
  // los conteos anidados bajo "resumen" y el detalle bajo "detalles"
  // ({ resumen: {total, exitosos, errores, duplicados}, detalles: {...} }) —
  // devolver esa respuesta tal cual (como hacía antes) dejaba a SuccessPanel
  // (en CsvUploadModal) leyendo campos de nivel superior que nunca existían,
  // por eso el resumen se veía como "Total —, Creados 0" sin importar el
  // resultado real. Se adapta aquí a la misma forma plana que ya usa
  // ModulosTab.jsx: { total, exitosos, fallidos, detalle[] }.
  const handleCsvUpload = async (file) => {
    const formData = new FormData();
    formData.append("archivoCSV", file);
    const res = await cursosAddParticipantesCsv(cursoId, formData);
    load(); // refresca lista aunque haya errores parciales

    const resumen  = res?.resumen ?? {};
    const detalles = res?.detalles ?? {};
    const detalle = [
      ...(detalles.errores ?? []).map((e) => ({
        fila: e.datos?.nombre ? `${e.datos.nombre} ${e.datos.apellido ?? ""}`.trim() : (e.datos?.cedula ?? "—"),
        error: e.error ?? "Error al crear el usuario.",
      })),
      ...(detalles.duplicados ?? []).map((d) => ({
        fila: d.nombre ?? d.cedula ?? "—",
        error: d.motivo ?? "Duplicado.",
      })),
    ];

    return {
      total:    resumen.total ?? 0,
      exitosos: resumen.exitosos ?? 0,
      fallidos: (resumen.errores ?? 0) + (resumen.duplicados ?? 0),
      detalle,
    };
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const askRemove = (userId, nombre) => setRemoveTarget({ id: userId, nombre });

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await cursosRemoveParticipante(cursoId, removeTarget.id);
      notify("Participante eliminado");
      setRemoveTarget(null);
      load();
    } catch { notify("Error al eliminar", "error"); }
    finally { setRemoving(false); }
  };

  // ── Ver detalle completo del usuario ────────────────────────────────────
  const openView = async (u) => {
    setViewTarget(u);
    setViewDetail(null);

    if (!puedeVerDetalleCompleto) {
      // Docente: no tiene permiso para GET /api/users/:id — usar directo
      // los datos que ya trae la lista, sin disparar una petición que
      // sabemos que va a fallar con 403.
      setViewDetail(normalizeUser(u));
      return;
    }

    setViewLoading(true);
    try {
      const res = await usersGetById(u._id ?? u.id);
      setViewDetail(normalizeUser(res.user ?? res));
    } catch {
      // Si falla el fetch, muestra al menos lo que ya teníamos en la lista
      setViewDetail(normalizeUser(u));
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => { setViewTarget(null); setViewDetail(null); };

  const d = viewDetail ?? viewTarget; // lo que se muestra en el modal (fallback mientras carga)

  return (
    <div>
      <Toast {...toast} />

      {/* ── Encabezado con los dos botones de acción ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10, marginBottom: 16,
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>
          Participantes ({parts.length})
        </h3>

        {canManage && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Botón: carga masiva */}
            <button
              onClick={() => setCsvOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-primary, var(--color-text-info, #2563eb))",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <Upload style={{ width: 14, height: 14 }} />
              Carga masiva Excel
            </button>

            {/* Botón: agregar individual */}
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus style={{ width: 14, height: 14, marginRight: 6 }} />
              Agregar participante
            </Button>
          </div>
        )}
      </div>

      {/* ── Lista / skeleton / estado vacío ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => <Sk key={i} h={56} r={12} />)}
        </div>
      ) : parts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin participantes"
          desc="Agrega el primer participante al curso."
          action={canManage ? { label: "Agregar", onClick: () => setAddOpen(true) } : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {parts.map((p) => {
            const u = p.usuario ?? p;
            const esDocente = p.etiqueta === "docente";
            const nombreCompleto = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim();
            return (
              <div
                key={u._id ?? p._id}
                onClick={() => openView(u)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openView(u); } }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 12,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                  transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface)"; }}
              >
                <UserAvatar user={u} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                    {nombreCompleto}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                    {p.etiqueta ?? u.rol}
                  </p>
                </div>
                {esDocente && (
                  <Badge variant="info" styleType="soft" size="sm">Docente</Badge>
                )}
                <Eye style={{ width: 14, height: 14, color: "var(--color-text-subtle)", flexShrink: 0 }} />
                {canManage && !esDocente && (
                  <button
                    onClick={(e) => { e.stopPropagation(); askRemove(u._id ?? p._id, nombreCompleto); }}
                    style={{ ...iconBtn("var(--color-error)"), padding: "7px 10px", gap: 6, fontSize: 12, fontWeight: 700 }}
                  >
                    <UserMinus style={{ width: 14, height: 14, flexShrink: 0 }} />
                    Eliminar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal 1 — Agregar participante individual
      ══════════════════════════════════════════════ */}
      <AppModal isOpen={addOpen} onClose={closeAddModal} size="md">
        <AppModal.Header title="Agregar participante" onClose={closeAddModal} />
        <AppModal.Body>
          <form id="participante-form" onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nombre *">
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Apellido *">
                <Input
                  value={form.apellido}
                  onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Cédula *">
                <Input
                  value={form.cedula}
                  inputMode="numeric"
                  placeholder="1020304050"
                  onChange={(e) => setForm((f) => ({ ...f, cedula: toCedula(e.target.value) }))}
                  required
                />
              </Field>
              <Field label="Teléfono *">
                <PhoneInput
                  label={null}
                  hint={null}
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Si el padre no existe, se creará automáticamente. {TEXTO_CONTRASENA_INICIAL}
            </p>
          </form>
        </AppModal.Body>
        <AppModal.Footer>
          <Button variant="ghost" type="button" onClick={closeAddModal}>Cancelar</Button>
          <Button type="submit" form="participante-form" disabled={saving}>
            {saving ? "Agregando..." : "Agregar"}
          </Button>
        </AppModal.Footer>
      </AppModal>

      {/* ══════════════════════════════════════════════
          Modal 2 — Carga masiva CSV
      ══════════════════════════════════════════════ */}
      <CsvUploadModal
        isOpen={csvOpen}
        onClose={() => setCsvOpen(false)}
        onUpload={handleCsvUpload}
        onDownloadTemplate={descargarPlantillaPadresCSV}
        title="Carga masiva de padres de familia"
        description="Sube un Excel (.xlsx/.xlsm) con los datos de los padres. Si el usuario ya existe por cédula, se agrega directamente sin crear cuenta nueva."
        templateLabel="Descargar plantilla"
        acceptedColumns={CSV_COLUMNAS_PADRES}
        acceptExtensions={[".xlsx", ".xlsm"]}
        fileTypeLabel="Excel (.xlsx, .xlsm)"
        maxFileSizeMB={5}
      />

      {/* ══════════════════════════════════════════════
          Modal 3 — Confirmar eliminación (reemplaza confirm() nativo)
      ══════════════════════════════════════════════ */}
      <AppModal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} size="sm">
        <AppModal.Header title="Eliminar participante" onClose={() => setRemoveTarget(null)} />
        <AppModal.Body>
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>
            ¿Eliminar a{" "}
            <strong style={{ color: "var(--color-text)" }}>{removeTarget?.nombre}</strong>{" "}
            de este curso?
          </p>
        </AppModal.Body>
        <AppModal.Footer>
          <Button variant="ghost" type="button" onClick={() => setRemoveTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmRemove} disabled={removing}>
            {removing ? "Eliminando..." : "Eliminar"}
          </Button>
        </AppModal.Footer>
      </AppModal>

      {/* ══════════════════════════════════════════════
          Modal 4 — Detalle completo del usuario
      ══════════════════════════════════════════════ */}
      <AppModal isOpen={!!viewTarget} onClose={closeView} size="md">
        <AppModal.Header title="Detalle del participante" onClose={closeView} />
        <AppModal.Body>
          {viewLoading && !d ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[0, 1, 2, 3, 4].map((i) => <Sk key={i} h={44} r={8} />)}
            </div>
          ) : d ? (
            <>
              {/* Avatar + nombre */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "4px 0 16px", borderBottom: "1px solid var(--color-border)", marginBottom: 4,
              }}>
                <UserAvatar user={d} size={64} />
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                    {d.nombre} {d.apellido}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <Badge variant="info" styleType="soft" size="sm">
                      {ROL_META[d.rol]?.label ?? d.rol}
                    </Badge>
                    {viewLoading && (
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Actualizando...</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Filas de información */}
              <InfoRow icon={Mail} label="Correo" value={d.correo} />
              <InfoRow icon={Phone} label="Teléfono" value={d.telefono} />
              <InfoRow icon={Hash} label="Cédula" value={d.cedula} />
              <InfoRow icon={Shield} label="Rol" value={ROL_META[d.rol]?.label ?? d.rol} />
              <InfoRow icon={Calendar} label="Registro" value={formatDate(d.fechaRegistro ?? d.createdAt)} />
              <InfoRow icon={Clock} label="Último acceso" value={formatDate(d.ultimoAcceso)} />
            </>
          ) : null}
        </AppModal.Body>
        <AppModal.Footer>
          <Button variant="ghost" type="button" onClick={closeView}>Cerrar</Button>
        </AppModal.Footer>
      </AppModal>
    </div>
  );
}