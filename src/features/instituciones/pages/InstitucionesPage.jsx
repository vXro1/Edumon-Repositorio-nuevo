// src/features/instituciones/pages/InstitucionesPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Building2, Edit2, X, Loader2,
  Phone, Mail, MapPin, Hash, User, RefreshCw,
  CheckCircle2, AlertCircle, Eye, ExternalLink,
  Globe, Calendar, Shield,
} from "lucide-react";
import {
  institucionesGetAll, institucionesCreate, institucionesUpdate,
  usersGetById,
} from "@/lib/apiClient";
import Modal from "@/components/ui/Modal";

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)",  color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)",  color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 600,
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 12, padding: "12px 18px",
      fontSize: 13, fontWeight: 600, maxWidth: 340,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 8,
      animation: "edu-slide-down 0.25s ease",
    }}>
      {type === "success"
        ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
        : <AlertCircle  style={{ width: 16, height: 16, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

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
            <button onClick={onClear} style={{ marginTop: 8, fontSize: 13, color: "#0C6AC4", background: "none", border: "none", cursor: "pointer" }}>
              Limpiar búsqueda
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Form helpers ──────────────────────────────────────────────
function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "9px 12px", fontSize: 13.5,
        borderRadius: 10, border: `1.5px solid ${focused ? "#0C6AC4" : "var(--color-border)"}`,
        outline: "none", background: "var(--color-surface)",
        color: "var(--color-text)",
        boxShadow: focused ? "0 0 0 3px rgba(12,106,196,0.12)" : "none",
        transition: "border-color 150ms, box-shadow 150ms",
        boxSizing: "border-box",
      }}
    />
  );
}

// ── Detail info row ───────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, isLink = false }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(12,106,196,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon style={{ width: 13, height: 13, color: "#0C6AC4" }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: 2 }}>{label}</p>
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

// ── Section divider ───────────────────────────────────────────
function SectionLabel({ icon: Icon, label, color = "#0C6AC4" }) {
  return (
    <p style={{ fontSize: 11.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
      <Icon style={{ width: 13, height: 13 }} /> {label}
    </p>
  );
}

// ── Admin avatar in detail modal ──────────────────────────────
function AdminAvatar({ admin }) {
  const name = [admin?.nombre, admin?.apellido].filter(Boolean).join(" ") || "Admin";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  if (admin?.fotoPerfilUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <img
          src={admin.fotoPerfilUrl}
          alt={name}
          style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-border)" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
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

// ────────────────────────────────────────────────────────────────
const INIT_FORM = {
  nombre: "", nit: "", direccion: "", telefono: "", correo: "",
  adminNombre: "", adminApellido: "", adminCedula: "", adminCorreo: "", adminTelefono: "",
};
const INIT_EDIT = { nombre: "", direccion: "", telefono: "", correo: "" };

// Ensures phone is in +57XXXXXXXXXX format so DB lookup matches the login form
const normalizarTelefono = (t) => {
  if (!t) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+57${digits}`;
  return t;
};

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}

export default function InstitucionesPage() {
  const [instituciones, setInstituciones] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [toast,    setToast]    = useState({ msg: "", type: "success" });

  // Modals
  const [showCreate,  setShowCreate]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [detailInst,  setDetailInst]  = useState(null);  // institution being viewed
  const [detailAdmin, setDetailAdmin] = useState(null);  // fetched admin user
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [form,     setForm]     = useState(INIT_FORM);
  const [editForm, setEditForm] = useState(INIT_EDIT);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await institucionesGetAll();
      setInstituciones(res.instituciones ?? []);
    } catch {
      notify("Error al cargar instituciones", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ──────────────────────────────────────────
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

  // ── View detail ─────────────────────────────────────────────
  const openDetail = async (inst) => {
    setDetailInst(inst);
    setDetailAdmin(null);
    if (inst.adminId) {
      setLoadingAdmin(true);
      try {
        const res = await usersGetById(typeof inst.adminId === "object" ? inst.adminId._id : inst.adminId);
        setDetailAdmin(res.user ?? res);
      } catch {
        // admin info optional — silently fail
      } finally {
        setLoadingAdmin(false);
      }
    }
  };

  const closeDetail = () => { setDetailInst(null); setDetailAdmin(null); };

  // ── Create ─────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Normalize phones so DB stores +57XXXXXXXXXX — matching what the login form sends
      const payload = {
        ...form,
        telefono:      normalizarTelefono(form.telefono),
        adminTelefono: normalizarTelefono(form.adminTelefono),
      };
      await institucionesCreate(payload);
      notify("Institución creada correctamente");
      setShowCreate(false);
      setForm(INIT_FORM);
      load();
    } catch (err) {
      notify(err.message || "Error al crear institución", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────
  const openEdit = (inst) => {
    setEditTarget(inst);
    setEditForm({
      nombre:    inst.nombre    ?? "",
      direccion: inst.direccion ?? "",
      telefono:  inst.telefono  ?? "",
      correo:    inst.correo    ?? "",
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
    } catch (err) {
      notify(err.message || "Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  const f  = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const ef = (key) => (e) => setEditForm((p) => ({ ...p, [key]: e.target.value }));

  // Admin from populated field or detailAdmin fetch
  const adminData = detailAdmin ||
    (detailInst?.adminId && typeof detailInst.adminId === "object" ? detailInst.adminId : null);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Page header ─────────────────────────────────── */}
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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={load}
            title="Actualizar"
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}
          >
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
          <button
            onClick={() => { setForm(INIT_FORM); setShowCreate(true); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer", transition: "background 150ms" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0A58A8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0C6AC4"; }}
          >
            <Plus style={{ width: 16, height: 16 }} /> Nueva institución
          </button>
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────── */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 14,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Search style={{ width: 17, height: 17, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input
          type="search"
          placeholder="Buscar por nombre, NIT, código, correo o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: "var(--color-text)", background: "transparent" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────── */}
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

      {/* ════════════ DETAIL MODAL ═══════════════════════ */}
      <Modal
        isOpen={Boolean(detailInst)}
        onClose={closeDetail}
        title={detailInst?.nombre ?? "Detalle de institución"}
        size="md"
      >
        {detailInst && (
          <div>
            {/* Institution icon header */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 style={{ width: 28, height: 28, color: "#0C6AC4" }} />
              </div>
            </div>

            {/* Institution data */}
            <SectionLabel icon={Building2} label="Datos de la institución" />
            <div style={{ marginBottom: 16 }}>
              <InfoRow icon={Hash}    label="NIT"      value={detailInst.nit} />
              <InfoRow icon={Hash}    label="Código"   value={detailInst.codigo} />
              <InfoRow icon={MapPin}  label="Dirección" value={detailInst.direccion} />
              <InfoRow icon={Phone}   label="Teléfono" value={detailInst.telefono} />
              <InfoRow icon={Mail}    label="Correo"   value={detailInst.correo} />
              <InfoRow icon={Globe}   label="Ciudad"   value={detailInst.ciudad} />
              {detailInst.createdAt && (
                <InfoRow icon={Calendar} label="Fecha de registro" value={fmtDate(detailInst.createdAt)} />
              )}
            </div>

            {/* Admin section */}
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
                  <div style={{ display: "grid", gap: 0 }}>
                    <InfoRow icon={User}  label="Nombre completo" value={[adminData.nombre, adminData.apellido].filter(Boolean).join(" ")} />
                    <InfoRow icon={Hash}  label="Cédula"          value={adminData.cedula} />
                    <InfoRow icon={Mail}  label="Correo"          value={adminData.correo} />
                    <InfoRow icon={Phone} label="Teléfono"        value={adminData.telefono} />
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>
                  Sin información del administrador
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={closeDetail}
                style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
              >
                Cerrar
              </button>
              <button
                onClick={() => { closeDetail(); openEdit(detailInst); }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
              >
                <Edit2 style={{ width: 14, height: 14 }} /> Editar institución
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ════════════ CREATE MODAL ════════════════════════ */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva institución" description="Complete todos los campos requeridos." size="lg">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 16 }}>
            <SectionLabel icon={Building2} label="Datos de la institución" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldGroup label="Nombre *">
                <StyledInput value={form.nombre} onChange={f("nombre")} placeholder="Institución Educativa..." required />
              </FieldGroup>
              <FieldGroup label="NIT *">
                <StyledInput value={form.nit} onChange={f("nit")} placeholder="900.000.000-0" required />
              </FieldGroup>
              <FieldGroup label="Dirección">
                <StyledInput value={form.direccion} onChange={f("direccion")} placeholder="Calle 123 #45-67" />
              </FieldGroup>
              <FieldGroup label="Teléfono">
                <StyledInput value={form.telefono} onChange={f("telefono")} placeholder="+57 300 000 0000" />
              </FieldGroup>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldGroup label="Correo institucional">
                  <StyledInput value={form.correo} onChange={f("correo")} type="email" placeholder="contacto@institucion.edu.co" />
                </FieldGroup>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
            <SectionLabel icon={User} label="Administrador inicial" color="#16A34A" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldGroup label="Nombre *">
                <StyledInput value={form.adminNombre} onChange={f("adminNombre")} placeholder="Juan" required />
              </FieldGroup>
              <FieldGroup label="Apellido *">
                <StyledInput value={form.adminApellido} onChange={f("adminApellido")} placeholder="Pérez" required />
              </FieldGroup>
              <FieldGroup label="Cédula *">
                <StyledInput value={form.adminCedula} onChange={f("adminCedula")} placeholder="12345678" required />
              </FieldGroup>
              <FieldGroup label="Teléfono">
                <StyledInput value={form.adminTelefono} onChange={f("adminTelefono")} placeholder="+57 300 000 0000" />
              </FieldGroup>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldGroup label="Correo del admin *">
                  <StyledInput value={form.adminCorreo} onChange={f("adminCorreo")} type="email" placeholder="admin@institucion.edu.co" required />
                </FieldGroup>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <Hash style={{ width: 11, height: 11 }} />
              La contraseña inicial del administrador será su número de cédula.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {saving ? "Creando..." : "Crear institución"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ════════════ EDIT MODAL ══════════════════════════ */}
      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title={`Editar: ${editTarget?.nombre ?? ""}`} size="md">
        <form onSubmit={handleEdit}>
          <div style={{ display: "grid", gap: 12 }}>
            <FieldGroup label="Nombre *">
              <StyledInput value={editForm.nombre} onChange={ef("nombre")} placeholder="Nombre de la institución" required />
            </FieldGroup>
            <FieldGroup label="Dirección">
              <StyledInput value={editForm.direccion} onChange={ef("direccion")} placeholder="Dirección" />
            </FieldGroup>
            <FieldGroup label="Teléfono">
              <StyledInput value={editForm.telefono} onChange={ef("telefono")} placeholder="Teléfono" />
            </FieldGroup>
            <FieldGroup label="Correo">
              <StyledInput value={editForm.correo} onChange={ef("correo")} type="email" placeholder="Correo" />
            </FieldGroup>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setEditTarget(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────
function InstitRow({ inst, onView, onEdit }) {
  const [hov, setHov] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: hov ? "var(--color-bg)" : "var(--color-surface)",
        transition: "background 150ms",
      }}
    >
      {/* Name + code */}
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

      {/* NIT / Code */}
      <td style={{ padding: "13px 16px" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{inst.nit ?? "—"}</p>
        {inst.codigo && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>{inst.codigo}</p>}
      </td>

      {/* Contact */}
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

      {/* Address */}
      <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--color-text-secondary)", maxWidth: 180 }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {inst.direccion || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
        </span>
        {inst.ciudad && <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>{inst.ciudad}</span>}
      </td>

      {/* Actions */}
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onView(inst)}
            title="Ver detalle"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 150ms" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0C6AC4"; e.currentTarget.style.color = "#0C6AC4"; e.currentTarget.style.background = "rgba(12,106,196,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "var(--color-surface)"; }}
          >
            <Eye style={{ width: 13, height: 13 }} /> Ver
          </button>
          <button
            onClick={() => onEdit(inst)}
            title="Editar"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 150ms" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0C6AC4"; e.currentTarget.style.color = "#0C6AC4"; e.currentTarget.style.background = "rgba(12,106,196,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "var(--color-surface)"; }}
          >
            <Edit2 style={{ width: 13, height: 13 }} /> Editar
          </button>
        </div>
      </td>
    </tr>
  );
}
