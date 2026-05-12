import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Building2, Edit2, X, Loader2,
  Phone, Mail, MapPin, Hash, User, RefreshCw,
  Eye, ExternalLink, Globe, Calendar, Shield,
} from "lucide-react";
import {
  institucionesGetAll, institucionesCreate,
  institucionesUpdate, usersGetById,
} from "@/lib/apiClient";
import { Modal, Toast, Button } from "@/components";
import { Input } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";
import { normalizeUser }from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";
import { normalizePhone } from "@/utils/normalizePhone";

// ── Skeleton row ──────────────────────────────────────────────
function SkRow() {
  return (
    <tr>
      {[200, 110, 150, 120, 90].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse" style={{ height: 14, width: w, borderRadius: 6, background: "var(--color-border)" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Empty state ───────────────────────────────────────────────
function Empty({ search, onClear }) {
  return (
    <tr>
      <td colSpan={5}>
        <div style={{ padding: "56px 24px", textAlign: "center" }}>
          <Building2 style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-muted)" }}>
            {search ? "Sin resultados" : "Aún no hay instituciones"}
          </p>
          {search && (
            <Button variant="ghost" size="sm" onClick={onClear} style={{ marginTop: 8 }}>
              Limpiar búsqueda
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Detail helpers ────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, isLink = false }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(12,106,196,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon style={{ width: 13, height: 13, color: "#0C6AC4" }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, color: "#0C6AC4", wordBreak: "break-word", display: "flex", alignItems: "center", gap: 4 }}>
            {value} <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        ) : (
          <p style={{ fontSize: 13.5, color: "var(--color-text)", margin: 0, wordBreak: "break-word" }}>{value}</p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, label, color = "#0C6AC4" }) {
  return (
    <p style={{ fontSize: 11.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
      <Icon style={{ width: 13, height: 13 }} /> {label}
    </p>
  );
}

function AdminAvatar({ admin }) {
  const name = [admin?.nombre, admin?.apellido].filter(Boolean).join(" ") || "Admin";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (admin?.fotoPerfilUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <img src={admin.fotoPerfilUrl} alt={name}
          style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-border)" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{name}</p>
        <a href={admin.fotoPerfilUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0C6AC4", display: "flex", alignItems: "center", gap: 4 }}>
          Ver foto completa <ExternalLink style={{ width: 11, height: 11 }} />
        </a>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#0C6AC4,#1E3A5F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "white" }}>{initials}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{name}</p>
    </div>
  );
}

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}

const INIT_FORM = {
  nombre: "", nit: "", direccion: "", telefono: "", correo: "",
  adminNombre: "", adminApellido: "", adminCedula: "", adminCorreo: "", adminTelefono: "",
};
const INIT_EDIT = { nombre: "", direccion: "", telefono: "", correo: "" };

// ─────────────────────────────────────────────────────────────
export default function InstitucionesPage() {
  const [instituciones, setInstituciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [toast,        setToast]        = useState({ msg: "", type: "success" });
  const [showCreate,   setShowCreate]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [detailInst,   setDetailInst]   = useState(null);
  const [detailAdmin,  setDetailAdmin]  = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [form,         setForm]         = useState(INIT_FORM);
  const [editForm,     setEditForm]     = useState(INIT_EDIT);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await institucionesGetAll();
      setInstituciones(res.instituciones ?? []);
    } catch { notify("Error al cargar instituciones", "error"); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = instituciones.filter((inst) => {
    const q = search.toLowerCase();
    return (
      inst.nombre?.toLowerCase().includes(q) ||
      inst.nit?.toLowerCase().includes(q) ||
      inst.correo?.toLowerCase().includes(q) ||
      inst.ciudad?.toLowerCase().includes(q) ||
      inst.codigo?.toLowerCase().includes(q)
    );
  });

  const openDetail = async (inst) => {
    setDetailInst(inst);
    setDetailAdmin(null);
    if (inst.adminId) {
      setLoadingAdmin(true);
      try {
        const res = await usersGetById(typeof inst.adminId === "object" ? inst.adminId._id : inst.adminId);
        setDetailAdmin(normalizeUser(res.user ?? res));
      } catch { /* opcional */ }
      finally { setLoadingAdmin(false); }
    }
  };

  const closeDetail = () => { setDetailInst(null); setDetailAdmin(null); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await institucionesCreate({
        ...form,
        telefono:      normalizePhone(form.telefono),
        adminTelefono: normalizePhone(form.adminTelefono),
      });
      notify("Institución creada correctamente");
      setShowCreate(false);
      setForm(INIT_FORM);
      load();
    } catch (err) { notify(humanizeError(err, "Error al crear institución"), "error"); }
    finally { setSaving(false); }
  };

  const openEdit = (inst) => {
    setEditTarget(inst);
    setEditForm({
      nombre: inst.nombre ?? "", direccion: inst.direccion ?? "",
      telefono: inst.telefono ?? "", correo: inst.correo ?? "",
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await institucionesUpdate(editTarget._id, editForm);
      notify("Institución actualizada");
      setEditTarget(null);
      load();
    } catch (err) { notify(humanizeError(err, "Error al actualizar institución"), "error"); }
    finally { setSaving(false); }
  };

  const f  = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const ef = (key) => (e) => setEditForm((p) => ({ ...p, [key]: e.target.value }));

  const adminData = detailAdmin ||
    (detailInst?.adminId && typeof detailInst.adminId === "object" ? normalizeUser(detailInst.adminId) : null);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 style={{ width: 18, height: 18, color: "#0C6AC4" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Instituciones</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Gestión global de instituciones educativas · {instituciones.length} registradas
          </p>
        </div>

        {/* Botones de cabecera */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <IconBtn color="var(--color-text-muted)" title="Actualizar" onClick={load}>
            <RefreshCw style={{ width: 15, height: 15 }} />
          </IconBtn>
          <Button onClick={() => { setForm(INIT_FORM); setShowCreate(true); }}>
            <Plus style={{ width: 16, height: 16 }} /> Nueva institución
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <Input
          type="search"
          placeholder="Buscar por nombre, NIT, código, correo o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
          rightIcon={search ? (
            <IconBtn color="var(--color-text-muted)" onClick={() => setSearch("")} style={{ padding: 0 }}>
              <X style={{ width: 15, height: 15 }} />
            </IconBtn>
          ) : undefined}
        />
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                {["Institución", "NIT / Código", "Contacto", "Dirección", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4].map((i) => <SkRow key={i} />)
              ) : filtered.length === 0 ? (
                <Empty search={search} onClear={() => setSearch("")} />
              ) : (
                filtered.map((inst) => (
                  <InstitRow key={inst._id} inst={inst} onView={openDetail} onEdit={openEdit} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
              {filtered.length} de {instituciones.length} instituciones
            </span>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <Modal isOpen={Boolean(detailInst)} onClose={closeDetail} title={detailInst?.nombre ?? "Detalle de institución"} size="md">
        {detailInst && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 style={{ width: 28, height: 28, color: "#0C6AC4" }} />
              </div>
            </div>
            <SectionLabel icon={Building2} label="Datos de la institución" />
            <div style={{ marginBottom: 16 }}>
              <InfoRow icon={Hash}     label="NIT"               value={detailInst.nit} />
              <InfoRow icon={Hash}     label="Código"            value={detailInst.codigo} />
              <InfoRow icon={MapPin}   label="Dirección"         value={detailInst.direccion} />
              <InfoRow icon={Phone}    label="Teléfono"          value={detailInst.telefono} />
              <InfoRow icon={Mail}     label="Correo"            value={detailInst.correo} />
              <InfoRow icon={Globe}    label="Ciudad"            value={detailInst.ciudad} />
              {detailInst.createdAt && (
                <InfoRow icon={Calendar} label="Fecha de registro" value={fmtDate(detailInst.createdAt)} />
              )}
            </div>
            <div style={{ paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
              <SectionLabel icon={Shield} label="Administrador" color="#16A34A" />
              {loadingAdmin ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "var(--color-text-muted)", fontSize: 13 }}>
                  <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />
                  Cargando info del administrador...
                </div>
              ) : adminData ? (
                <div>
                  <AdminAvatar admin={adminData} />
                  <InfoRow icon={User}  label="Nombre completo" value={[adminData.nombre, adminData.apellido].filter(Boolean).join(" ")} />
                  <InfoRow icon={Hash}  label="Cédula"          value={adminData.cedula} />
                  <InfoRow icon={Mail}  label="Correo"          value={adminData.correo} />
                  <InfoRow icon={Phone} label="Teléfono"        value={adminData.telefono} />
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>Sin información del administrador</p>
              )}
            </div>

            {/* Acciones del modal detail */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
              <Button variant="ghost" onClick={closeDetail}>Cerrar</Button>
              <Button onClick={() => { closeDetail(); openEdit(detailInst); }}>
                <Edit2 style={{ width: 14, height: 14 }} /> Editar institución
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva institución" description="Complete todos los campos requeridos." size="lg">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 16 }}>
            <SectionLabel icon={Building2} label="Datos de la institución" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Nombre"
                placeholder="Institución Educativa..."
                value={form.nombre}
                onChange={f("nombre")}
                required
              />
              <Input
                label="NIT"
                placeholder="900.000.000-0"
                value={form.nit}
                onChange={f("nit")}
                required
              />
              <Input
                label="Dirección"
                placeholder="Calle 123 #45-67"
                value={form.direccion}
                onChange={f("direccion")}
                leftIcon={<MapPin size={16} />}
              />
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+57 300 000 0000"
                value={form.telefono}
                onChange={f("telefono")}
                leftIcon={<Phone size={16} />}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Correo institucional"
                  type="email"
                  placeholder="contacto@institucion.edu.co"
                  value={form.correo}
                  onChange={f("correo")}
                  leftIcon={<Mail size={16} />}
                />
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
            <SectionLabel icon={User} label="Administrador inicial" color="#16A34A" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Nombre"
                placeholder="Juan"
                value={form.adminNombre}
                onChange={f("adminNombre")}
                leftIcon={<User size={16} />}
                required
              />
              <Input
                label="Apellido"
                placeholder="Pérez"
                value={form.adminApellido}
                onChange={f("adminApellido")}
                leftIcon={<User size={16} />}
                required
              />
              <Input
                label="Cédula"
                placeholder="12345678"
                value={form.adminCedula}
                onChange={f("adminCedula")}
                leftIcon={<Hash size={16} />}
                required
              />
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+57 300 000 0000"
                value={form.adminTelefono}
                onChange={f("adminTelefono")}
                leftIcon={<Phone size={16} />}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Correo del admin"
                  type="email"
                  placeholder="admin@institucion.edu.co"
                  value={form.adminCorreo}
                  onChange={f("adminCorreo")}
                  leftIcon={<Mail size={16} />}
                  required
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <Hash style={{ width: 11, height: 11 }} />
              La contraseña inicial del administrador será su número de cédula.
            </p>
          </div>

          {/* Acciones del modal create */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {saving ? "Creando..." : "Crear institución"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title={`Editar: ${editTarget?.nombre ?? ""}`} size="md">
        <form onSubmit={handleEdit}>
          <div style={{ display: "grid", gap: 12 }}>
            <Input
              label="Nombre"
              placeholder="Nombre de la institución"
              value={editForm.nombre}
              onChange={ef("nombre")}
              required
            />
            <Input
              label="Dirección"
              placeholder="Dirección"
              value={editForm.direccion}
              onChange={ef("direccion")}
              leftIcon={<MapPin size={16} />}
            />
            <Input
              label="Teléfono"
              type="tel"
              placeholder="Teléfono"
              value={editForm.telefono}
              onChange={ef("telefono")}
              leftIcon={<Phone size={16} />}
            />
            <Input
              label="Correo"
              type="email"
              placeholder="Correo"
              value={editForm.correo}
              onChange={ef("correo")}
              leftIcon={<Mail size={16} />}
            />
          </div>

          {/* Acciones del modal edit */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="ghost" type="button" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────
function InstitRow({ inst, onView, onEdit }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)", transition: "background 150ms" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface)"; }}
    >
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 style={{ width: 16, height: 16, color: "#0C6AC4" }} />
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{inst.nombre}</p>
            {inst.codigo && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>Código: {inst.codigo}</p>}
          </div>
        </div>
      </td>
      <td style={{ padding: "13px 16px" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{inst.nit ?? "—"}</p>
        {inst.codigo && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>{inst.codigo}</p>}
      </td>
      <td style={{ padding: "13px 16px" }}>
        {inst.correo && (
          <p style={{ fontSize: 12.5, color: "var(--color-text-secondary)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <Mail style={{ width: 11, height: 11, flexShrink: 0 }} /> {inst.correo}
          </p>
        )}
        {inst.telefono && (
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <Phone style={{ width: 11, height: 11, flexShrink: 0 }} /> {inst.telefono}
          </p>
        )}
        {!inst.correo && !inst.telefono && <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>—</span>}
      </td>
      <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--color-text-secondary)", maxWidth: 180 }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {inst.direccion || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
        </span>
        {inst.ciudad && <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>{inst.ciudad}</span>}
      </td>

      {/* Acciones de fila */}
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="outline" size="sm" onClick={() => onView(inst)} title="Ver detalle">
            <Eye style={{ width: 13, height: 13 }} /> Ver
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(inst)} title="Editar">
            <Edit2 style={{ width: 13, height: 13 }} /> Editar
          </Button>
        </div>
      </td>
    </tr>
  );
}