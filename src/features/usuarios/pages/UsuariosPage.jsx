import { useState, useEffect, useCallback } from "react";

import {
  Plus, Search, Users, Edit2, Trash2, X,
  Loader2, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Filter, Eye,
  UserCheck, Phone, Mail, Hash, Calendar,
  Clock, Shield, UserX,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeUser }from "@/lib/normalizers";

import { usersGetAll, usersGetById, usersCreate, usersUpdate, usersDelete } from "@/services/usersService";
import { institucionesGetMine, institucionesGetAll } from "@/services/institucionesService";

import { Modal, Toast, UserAvatar, Badge, PhoneInput } from "@/components";

import { humanizeError, humanizeCursosActivosError } from "@/utils/humanizeError";
import { normalizePhone, isValidPhone, PHONE_ERROR } from "@/utils/normalizePhone";
import {
  contrasenaInicial, TEXTO_CONTRASENA_INICIAL,
  isValidCedula, CEDULA_ERROR, toCedula,
} from "@/utils/credenciales";
/* ── Roles config ─────────────────────────────────────────────── */
const ROL_META = {
  superadmin:    { label: "Super Admin",   variant: "error" },
  administrador: { label: "Administrador", variant: "info" },
  docente:       { label: "Docente",       variant: "success" },
  // Backend stores and returns "padre" — alias "padre/tutor" for display
  "padre":       { label: "Padre/Tutor",   variant: "warning" },
  "padre/tutor": { label: "Padre/Tutor",   variant: "warning" },
};

// Options shown en el select — use backend role values
const ROL_LABELS = [
  { value: "administrador", label: "Administrador" },
  { value: "docente",       label: "Docente" },
  { value: "padre",         label: "Padre/Tutor" },
];

/* ── Micro-components ─────────────────────────────────────────── */
function RolBadge({ rol }) {
  const m = ROL_META[rol] ?? { label: rol, variant: "neutral" };
  return <Badge variant={m.variant} size="sm">{m.label}</Badge>;
}

function EstadoBadge({ estado }) {
  const ok = estado === "activo";
  return (
    <Badge variant={ok ? "success" : "error"} size="sm" dot>
      {ok ? "Activo" : "Suspendido"}
    </Badge>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function FieldGroup({ label, children, error }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: error ? "var(--color-error-hover)" : "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 11.5, color: "var(--color-error-hover)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}><AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />{error}</p>}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required = false, disabled = false, hasError = false, inputMode }) {
  const [f, setF] = useState(false);
  const borderColor = hasError ? "var(--color-error-hover)" : f ? "var(--color-primary)" : "var(--color-border)";
  const shadow = hasError ? "0 0 0 3px rgba(220,38,38,0.10)" : f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none";
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} inputMode={inputMode}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${borderColor}`, outline: "none", background: disabled ? "var(--color-bg)" : "var(--color-surface)", color: "var(--color-text)", boxShadow: shadow, transition: "border-color 150ms, box-shadow 150ms", cursor: disabled ? "not-allowed" : "text" }} />
  );
}

function StyledSelect({ value, onChange, children, disabled = false }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "var(--color-primary)" : "var(--color-border)"}`, outline: "none", background: disabled ? "var(--color-bg)" : "var(--color-surface)", color: "var(--color-text)", cursor: disabled ? "not-allowed" : "pointer", transition: "border-color 150ms" }}>
      {children}
    </select>
  );
}


/* Detail info row */
function InfoRow({ icon: Icon, label, value, color = "var(--color-primary)" }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `rgba(12,106,196,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--color-text)", margin: "2px 0 0" }}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Constants ────────────────────────────────────────────────── */
const INIT = { nombre: "", apellido: "", cedula: "", correo: "", telefono: "", rol: "docente", institucionIdSA: "" };
// Maps frontend display role to the value the backend validator accepts
const toApiRol = (rol) => rol === "padre/tutor" ? "padre" : rol;
const LIMIT = 15;


/* ══════════════════════════════════════════════════════════════
   Main page
   ══════════════════════════════════════════════════════════════ */
export default function UsuariosPage() {
  const { user: me } = useAuth();
  const isSuperadmin = me?.rol === "superadmin";

  const [users,        setUsers]      = useState([]);
  const [pagination,   setPag]        = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
  const [loading,      setLoading]    = useState(true);
  const [page,         setPage]       = useState(1);
  const [search,       setSearch]     = useState("");
  const [debSearch,    setDebSearch]  = useState("");
  const [rolFilter,    setRolF]       = useState("");
  const [estadoFilter, setEstadoF]    = useState("");
  const [toast,        setToast]      = useState({ msg: "", type: "success" });
  const [saving,       setSaving]     = useState(false);
  const [form,         setForm]       = useState(INIT);
  const [institucionId, setInstitucionId] = useState(() => me?.institucionId ?? null);
  const [institutions, setInstitutions]  = useState([]);

  // Validation errors for create form
  const [createErrors, setCreateErrors] = useState({});

  // Modal states
  const [showCreate,   setShowCreate]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [delTarget,    setDelTarget]    = useState(null);   // suspend
  const [activTarget,  setActivTarget]  = useState(null);  // activate
  const [viewTarget,   setViewTarget]   = useState(null);  // detail view
  const [viewLoading,  setViewLoading]  = useState(false);
  const [viewDetail,   setViewDetail]   = useState(null);  // full user data

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // Fetch institution ID for the current admin (needed to create users via POST /users)
  useEffect(() => {
    if (me?.institucionId) {
      setInstitucionId(me.institucionId);
      return;
    }
    if (!isSuperadmin) {
      institucionesGetMine()
        .then((res) => {
          const id = res.institucion?._id ?? res._id ?? res.institucion?.id ?? null;
          if (id) setInstitucionId(id);
        })
        .catch(() => {});
    }
  }, [me, isSuperadmin]);

  // Superadmin: fetch all institutions to populate the institution selector
  useEffect(() => {
    if (isSuperadmin) {
      institucionesGetAll()
        .then((res) => {
          const list = res.instituciones ?? res ?? [];
          setInstitutions(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  }, [isSuperadmin]);

  // Debounce search so API is only hit after the user pauses typing
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // When text-searching, fetch all matching users so client-side filter is complete
      const params = debSearch ? { page: 1, limit: 1000 } : { page, limit: LIMIT };
      if (rolFilter)    params.rol    = rolFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const res = await usersGetAll(params);
      const list = Array.isArray(res) ? res : (res.users ?? []);
      setUsers(list.map((u) => normalizeUser(u)));
      setPag(res.pagination ?? { currentPage: 1, totalPages: 1, totalUsers: list.length });
    } catch {
      notify("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  }, [page, debSearch, rolFilter, estadoFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset page when any filter changes (including text search)
  useEffect(() => { setPage(1); }, [rolFilter, estadoFilter, debSearch]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q
      || u.nombre?.toLowerCase().includes(q)
      || u.apellido?.toLowerCase().includes(q)
      || u.correo?.toLowerCase().includes(q)
      || u.cedula?.includes(q)
      || u.telefono?.includes(q);
  });

  const f = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    if (createErrors[key]) setCreateErrors((p) => ({ ...p, [key]: "" }));
  };

  // La cédula es solo dígitos (6-10) en todo el sistema: se limpia al escribir
  const fCedula = (e) => {
    const value = toCedula(e.target.value);
    setForm((p) => ({ ...p, cedula: value }));
    if (createErrors.cedula) setCreateErrors((p) => ({ ...p, cedula: "" }));
  };

  /* ── View detail ── */
  const openView = async (u) => {
    setViewTarget(u);
    setViewDetail(null);
    setViewLoading(true);
    try {
      const res = await usersGetById(u._id);
      setViewDetail(normalizeUser(res.user ?? res));
    } catch {
      setViewDetail(normalizeUser(u)); // fallback to list data
    } finally {
      setViewLoading(false);
    }
  };

  /* ── Create ── */
  const handleCreate = async (e) => {
    e.preventDefault();

    // Client-side validation
    const cedula = form.cedula.trim();
    const clientErrors = {};
    if (!form.nombre.trim())                           clientErrors.nombre   = "El nombre es requerido";
    if (!form.apellido.trim())                         clientErrors.apellido = "El apellido es requerido";
    if (!cedula)                                       clientErrors.cedula   = "La cédula es requerida";
    else if (!isValidCedula(cedula))                   clientErrors.cedula   = CEDULA_ERROR;
    if (!form.correo.trim())                           clientErrors.correo    = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(form.correo.trim())) clientErrors.correo   = "Ingresa un correo válido";
    if (!form.telefono.trim())                         clientErrors.telefono  = "El teléfono es requerido";
    else if (!isValidPhone(form.telefono))             clientErrors.telefono  = PHONE_ERROR;

    if (Object.keys(clientErrors).length) {
      setCreateErrors(clientErrors);
      notify("Corrige los campos marcados en rojo", "error");
      return;
    }

    setSaving(true);
    try {
      const rolApi = toApiRol(form.rol);
      // No se envía "contraseña": el backend aplica la regla única del sistema
      // (contraseña inicial = cédula), igual que al crear docentes, admins de
      // institución o participantes. Así ningún flujo puede volver a divergir.
      const body = {
        nombre:     form.nombre.trim(),
        apellido:   form.apellido.trim(),
        cedula:     cedula,
        correo:     form.correo.trim(),
        rol:        rolApi,
      };
      if (form.telefono) body.telefono = normalizePhone(form.telefono);

      if (rolApi !== "superadmin") {
        const instId = isSuperadmin ? form.institucionIdSA : institucionId;
        if (!instId) {
          notify(
            isSuperadmin
              ? "Debes seleccionar una institución para este usuario"
              : "No se pudo determinar tu institución. Recarga la página e intenta de nuevo.",
            "error"
          );
          setSaving(false);
          return;
        }
        body.institucionId = instId;
      }

      await usersCreate(body);
      notify(`Usuario creado. Contraseña inicial: ${contrasenaInicial(cedula)}`);
      setShowCreate(false);
      setCreateErrors({});
      setForm(INIT);
      load();
    } catch (err) {
      // Map server-side validation errors to individual fields
      if (err.validationErrors?.length) {
        const serverErrors = {};
        for (const e of err.validationErrors) {
          const field = e.path === "contraseña" ? "_password" : e.path;
          serverErrors[field] = e.msg;
        }
        setCreateErrors(serverErrors);
      }
      notify(humanizeError(err, "Error al crear usuario"), "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Edit ── */
  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ nombre: u.nombre ?? "", apellido: u.apellido ?? "", cedula: u.cedula ?? "", correo: u.correo ?? "", telefono: u.telefono ?? "", contrasena: "", rol: u.rol ?? "docente" });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    if (form.cedula.trim() && !isValidCedula(form.cedula)) { notify(CEDULA_ERROR, "error"); return; }
    if (form.telefono.trim() && !isValidPhone(form.telefono)) { notify(PHONE_ERROR, "error"); return; }

    setSaving(true);
    try {
      const body = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), cedula: form.cedula.trim(), correo: form.correo.trim(), rol: toApiRol(form.rol) };
      // Solo se manda el teléfono si quedó en el formato del sistema (+57XXXXXXXXXX)
      const telefono = normalizePhone(form.telefono);
      if (telefono) body.telefono = telefono;
      await usersUpdate(editTarget._id, body);
      notify("Usuario actualizado");
      setEditTarget(null);
      // Update view detail if open
      if (viewTarget?._id === editTarget._id) setViewDetail((d) => d ? { ...d, ...body } : d);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar"), "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Suspend ── */
  const handleSuspend = async () => {
    if (!delTarget) return;
    setSaving(true);
    try {
      await usersDelete(delTarget._id);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === delTarget._id ? { ...u, estado: "suspendido" } : u
        )
      );
      notify("Usuario suspendido");
      setDelTarget(null);
    } catch (err) {
      notify(humanizeCursosActivosError(err) ?? humanizeError(err, "Error al suspender usuario"), "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Activate (revert suspend) ── */
  const handleActivate = async () => {
    if (!activTarget) return;
    setSaving(true);
    try {
      await usersUpdate(activTarget._id, { estado: "activo" });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === activTarget._id ? { ...u, estado: "activo" } : u
        )
      );
      notify("Usuario activado correctamente");
      setActivTarget(null);
    } catch (err) {
      notify(humanizeError(err, "Error al activar usuario"), "error");
    } finally {
      setSaving(false);
    }
  };

  const d = viewDetail ?? viewTarget;

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users style={{ width: 18, height: 18, color: "#6366F1" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Usuarios</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            {pagination.totalUsers} usuarios registrados
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} title="Actualizar" style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
          <button onClick={() => { setForm(INIT); setShowCreate(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0A58A8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-primary)"; }}>
            <Plus style={{ width: 16, height: 16 }} /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)", padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Search style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input type="search" placeholder="Buscar por nombre, correo, cédula o teléfono..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, border: "none", outline: "none", fontSize: 13.5, color: "var(--color-text)", background: "transparent" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Filter style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
          <select value={rolFilter} onChange={e => setRolF(e.target.value)}
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, background: "var(--color-surface)", color: "var(--color-text)", cursor: "pointer", outline: "none" }}>
            <option value="">Todos los roles</option>
            {ROL_LABELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={estadoFilter} onChange={e => setEstadoF(e.target.value)}
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, background: "var(--color-surface)", color: "var(--color-text)", cursor: "pointer", outline: "none" }}>
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
        {(search || rolFilter || estadoFilter) && (
          <button onClick={() => { setSearch(""); setRolF(""); setEstadoF(""); }} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <X style={{ width: 13, height: 13 }} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)", background: "var(--color-bg)" }}>
                {["Usuario", "Contacto", "Cédula", "Rol", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4,5].map(i => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {[0,1,2,3,4,5].map(j => (
                      <td key={j} style={{ padding: "13px 16px" }}><Sk h={14} w={j === 5 ? 90 : "75%"} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                      <Users style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 10px" }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin usuarios</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <UserRow
                    key={u._id}
                    user={u}
                    onView={() => openView(u)}
                    onEdit={() => openEdit(u)}
                    onSuspend={() => setDelTarget(u)}
                    onActivate={() => setActivTarget(u)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!debSearch && !loading && pagination.totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>Página {page} de {pagination.totalPages} · {pagination.totalUsers} usuarios</span>
            <div style={{ display: "flex", gap: 8 }}>
              <PagBtn onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft style={{ width: 15, height: 15 }} /></PagBtn>
              <PagBtn onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}><ChevronRight style={{ width: 15, height: 15 }} /></PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* ══ CREATE MODAL ══ */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setCreateErrors({}); setForm(INIT); }} title="Nuevo usuario" size="md">
        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Nombre *" error={createErrors.nombre}><StyledInput value={form.nombre} onChange={f("nombre")} placeholder="Juan" hasError={!!createErrors.nombre} /></FieldGroup>
            <FieldGroup label="Apellido *" error={createErrors.apellido}><StyledInput value={form.apellido} onChange={f("apellido")} placeholder="Pérez" hasError={!!createErrors.apellido} /></FieldGroup>
            <FieldGroup label="Cédula *" error={createErrors.cedula}><StyledInput value={form.cedula} onChange={fCedula} placeholder="12345678" inputMode="numeric" hasError={!!createErrors.cedula} /></FieldGroup>
            <FieldGroup label="Teléfono *" error={createErrors.telefono}>
              {/* FieldGroup ya pinta el mensaje de error: aquí solo el borde rojo */}
              <PhoneInput
                size="sm" label={null} hint={null}
                value={form.telefono} onChange={f("telefono")}
                className={createErrors.telefono ? "input-error" : ""}
              />
            </FieldGroup>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Correo *" error={createErrors.correo}><StyledInput value={form.correo} onChange={f("correo")} type="email" placeholder="usuario@correo.com" hasError={!!createErrors.correo} /></FieldGroup>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Rol *">
                <StyledSelect value={form.rol} onChange={f("rol")}>
                  {/* Un administrador (institución) solo puede crear/editar padres y
                      docentes — el backend rechaza con 403 "Un administrador solo puede
                      crear usuarios con rol 'padre' o 'docente'" si intenta otra cosa.
                      Se oculta la opción en vez de dejar que falle tras enviar el form. */}
                  {ROL_LABELS.filter(r => isSuperadmin || !["superadmin", "administrador"].includes(r.value)).map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </StyledSelect>
              </FieldGroup>
            </div>
            {/* Superadmin: pick institution for the new user (not needed for superadmin role) */}
            {isSuperadmin && toApiRol(form.rol) !== "superadmin" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldGroup label="Institución *">
                  <StyledSelect value={form.institucionIdSA} onChange={f("institucionIdSA")}>
                    <option value="">Seleccionar institución...</option>
                    {institutions.map(inst => (
                      <option key={inst._id} value={inst._id}>{inst.nombre}</option>
                    ))}
                  </StyledSelect>
                </FieldGroup>
              </div>
            )}
            {/* Regular admin: warn if institution couldn't be resolved */}
            {!isSuperadmin && !institucionId && (
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <AlertCircle style={{ width: 14, height: 14, color: "var(--color-error-hover)", flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: "var(--color-error-hover)", margin: 0 }}>No se pudo cargar tu institución. Recarga la página antes de continuar.</p>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(12,106,196,0.06)", border: "1px solid rgba(12,106,196,0.15)" }}>
            <Hash style={{ width: 13, height: 13, color: "var(--color-primary)", flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: "var(--color-primary)", margin: 0 }}>
              {TEXTO_CONTRASENA_INICIAL} Ej: <strong>{contrasenaInicial(form.cedula) || "12345678"}</strong>
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <BtnCancel onClick={() => setShowCreate(false)} />
            <BtnSave saving={saving}>{saving ? "Creando..." : "Crear usuario"}</BtnSave>
          </div>
        </form>
      </Modal>

      {/* ══ EDIT MODAL ══ */}
      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title={`Editar usuario`} description={`${editTarget?.nombre ?? ""} ${editTarget?.apellido ?? ""}`} size="md">
        <form onSubmit={handleEdit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Nombre *"><StyledInput value={form.nombre} onChange={f("nombre")} placeholder="Juan" required /></FieldGroup>
            <FieldGroup label="Apellido *"><StyledInput value={form.apellido} onChange={f("apellido")} placeholder="Pérez" required /></FieldGroup>
            <FieldGroup label="Cédula">
              <StyledInput value={form.cedula} onChange={fCedula} placeholder="12345678" inputMode="numeric" />
            </FieldGroup>
            <FieldGroup label="Teléfono">
              <PhoneInput size="sm" label={null} hint={null} value={form.telefono} onChange={f("telefono")} />
            </FieldGroup>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Correo *"><StyledInput value={form.correo} onChange={f("correo")} type="email" placeholder="usuario@correo.com" required /></FieldGroup>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Rol *">
                <StyledSelect value={form.rol} onChange={f("rol")}>
                  {/* Un administrador (institución) solo puede crear/editar padres y
                      docentes — el backend rechaza con 403 "Un administrador solo puede
                      crear usuarios con rol 'padre' o 'docente'" si intenta otra cosa.
                      Se oculta la opción en vez de dejar que falle tras enviar el form. */}
                  {ROL_LABELS.filter(r => isSuperadmin || !["superadmin", "administrador"].includes(r.value)).map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </StyledSelect>
              </FieldGroup>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <BtnCancel onClick={() => setEditTarget(null)} />
            <BtnSave saving={saving}>{saving ? "Guardando..." : "Guardar cambios"}</BtnSave>
          </div>
        </form>
      </Modal>

      {/* ══ VIEW DETAIL MODAL ══ */}
      <Modal isOpen={Boolean(viewTarget)} onClose={() => { setViewTarget(null); setViewDetail(null); }} title="Detalle de usuario" size="md">
        {viewLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0,1,2,3,4,5].map(i => <Sk key={i} h={44} r={8} />)}
          </div>
        ) : d ? (
          <>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "4px 0 16px", borderBottom: "1px solid var(--color-border)", marginBottom: 4 }}>
              <UserAvatar user={d} size={64} />
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{d.nombre} {d.apellido}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <RolBadge rol={d.rol} />
                  <EstadoBadge estado={d.estado} />
                </div>
              </div>
            </div>

            {/* Photo preview */}
            {d.fotoPerfilUrl && (
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Foto de perfil</p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={d.fotoPerfilUrl} alt="Foto de perfil" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "2px solid var(--color-border)" }} />
                  <a href={d.fotoPerfilUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    <Eye style={{ width: 13, height: 13 }} /> Ver imagen completa
                  </a>
                </div>
              </div>
            )}

            {/* Info rows */}
            <InfoRow icon={Mail}     label="Correo"           value={d.correo} />
            <InfoRow icon={Phone}    label="Teléfono"         value={d.telefono} />
            <InfoRow icon={Hash}     label="Cédula"           value={d.cedula} />
            <InfoRow icon={Shield}   label="Rol"              value={ROL_META[d.rol]?.label ?? d.rol} />
            <InfoRow icon={Calendar} label="Registro"         value={formatDate(d.fechaRegistro ?? d.createdAt)} />
            <InfoRow icon={Clock}    label="Último acceso"    value={formatDate(d.ultimoAcceso)} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setViewTarget(null); openEdit(d); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                <Edit2 style={{ width: 13, height: 13 }} /> Editar
              </button>
              {d.estado === "activo" ? (
                <button onClick={() => { setViewTarget(null); setDelTarget(d); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", background: "rgba(220,38,38,0.1)", color: "var(--color-error-hover)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <UserX style={{ width: 13, height: 13 }} /> Suspender
                </button>
              ) : (
                <button onClick={() => { setViewTarget(null); setActivTarget(d); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", background: "rgba(22,163,74,0.1)", color: "var(--edu-green-600)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <UserCheck style={{ width: 13, height: 13 }} /> Activar
                </button>
              )}
            </div>
          </>
        ) : null}
      </Modal>

      {/* ══ SUSPEND CONFIRM ══ */}
      <Modal isOpen={Boolean(delTarget)} onClose={() => setDelTarget(null)} title="Suspender usuario" size="sm">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <UserAvatar user={delTarget} size={40} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{delTarget?.nombre} {delTarget?.apellido}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{delTarget?.correo}</p>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 20 }}>
          El usuario <strong style={{ color: "var(--color-text)" }}>no podrá iniciar sesión</strong> mientras esté suspendido. Podrás reactivarlo en cualquier momento.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <BtnCancel onClick={() => setDelTarget(null)} />
          <button onClick={handleSuspend} disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#fca5a5" : "var(--color-error-hover)", color: "white", fontSize: 13.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {saving && <Loader2 style={{ width: 14, height: 14, animation: "edu-spin 0.6s linear infinite" }} />}
            {saving ? "Suspendiendo..." : "Suspender"}
          </button>
        </div>
      </Modal>

      {/* ══ ACTIVATE CONFIRM ══ */}
      <Modal isOpen={Boolean(activTarget)} onClose={() => setActivTarget(null)} title="Activar usuario" size="sm">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)" }}>
          <UserAvatar user={activTarget} size={40} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{activTarget?.nombre} {activTarget?.apellido}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{activTarget?.correo}</p>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginBottom: 20 }}>
          El usuario podrá <strong style={{ color: "var(--color-text)" }}>volver a iniciar sesión</strong> normalmente.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <BtnCancel onClick={() => setActivTarget(null)} />
          <button onClick={handleActivate} disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#86efac" : "var(--edu-green-600)", color: "white", fontSize: 13.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {saving && <Loader2 style={{ width: 14, height: 14, animation: "edu-spin 0.6s linear infinite" }} />}
            {saving ? "Activando..." : "Activar usuario"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */
function UserRow({ user: u, onView, onEdit, onSuspend, onActivate }) {
  const [hov, setHov] = useState(false);
  const suspended = u.estado !== "activo";
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: "1px solid var(--color-border)", background: hov ? "var(--color-bg)" : "var(--color-surface)", transition: "background 150ms" }}>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UserAvatar user={u} size={34} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{u.nombre} {u.apellido}</p>
            {u.ultimoAcceso && <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Últ. acceso: {new Date(u.ultimoAcceso).toLocaleDateString("es-CO")}</p>}
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <p style={{ fontSize: 13, color: "var(--color-text)", margin: 0 }}>{u.correo ?? "—"}</p>
        {u.telefono && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>{u.telefono}</p>}
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>{u.cedula ?? "—"}</td>
      <td style={{ padding: "12px 16px" }}><RolBadge rol={u.rol} /></td>
      <td style={{ padding: "12px 16px" }}><EstadoBadge estado={u.estado} /></td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <ActionIconBtn icon={Eye}       title="Ver"  color="#6366F1" bg="rgba(99,102,241,0.08)"  onClick={onView} />
          <ActionIconBtn icon={Edit2}     title="Editar"        color="var(--color-primary)" bg="rgba(12,106,196,0.08)"  onClick={onEdit} />
          {suspended
            ? <ActionIconBtn icon={UserCheck} title="Activar"   color="var(--edu-green-600)" bg="rgba(22,163,74,0.08)"  onClick={onActivate} />
            : <ActionIconBtn icon={UserX}     title="Suspender" color="var(--color-error-hover)" bg="rgba(220,38,38,0.08)"  onClick={onSuspend} />
          }
        </div>
      </td>
    </tr>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
  );
}

function ActionIconBtn({ icon: Icon, title, color, bg, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 32, padding: "0 10px", borderRadius: 8, border: `1px solid ${hov ? color : "var(--color-border)"}`, background: hov ? bg : "var(--color-surface)", color: hov ? color : "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", transition: "all 150ms" }}>
      <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
      {title}
    </button>
  );
}

function BtnCancel({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
      Cancelar
    </button>
  );
}

function BtnSave({ children, saving, ...props }) {
  return (
    <button type="submit" disabled={saving} {...props} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "var(--color-primary)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
      {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
      {children}
    </button>
  );
}
