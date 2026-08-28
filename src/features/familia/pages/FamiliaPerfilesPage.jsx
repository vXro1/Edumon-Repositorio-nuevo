// src/features/familia/pages/FamiliaPerfilesPage.jsx
// ROL: Padre / Tutor — Selector y gestión de perfiles familiares
import { useState, useEffect } from "react";
import {
  Users, Plus, Edit2, Trash2, Check,
  Star, AlertCircle, UserCircle,
} from "lucide-react";
import {
  perfilesGetAll, perfilesCreate, perfilesUpdate,
  perfilesDelete, perfilesSeleccionar, perfilesUpdateFcmToken,
} from "@/features/familia/services/perfilesService";
import { humanizeError } from "@/utils/humanizeError";
import { Toast, Button, Input, Badge, Modal } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";

// ─── Importaciones de avatares locales ────────────────────────────────────
// FIX (dockerización, 2026-08-28): importaba Avatar1..Avatar8.svg con
// mayúscula inicial — en disco solo existen avatar1..avatar8.svg, en
// minúscula (ver src/assets/img/avatars/). En Windows esto "funcionaba"
// porque el filesystem no distingue mayúsculas de minúsculas, pero
// `vite build` corriendo en Linux (el contenedor Docker) sí, y tronaba con
// ENOENT en el primer avatar. Esta página era literalmente imposible de
// compilar fuera de Windows tal como estaba.
import av1 from "@/assets/img/avatars/avatar1.svg";
import av2 from "@/assets/img/avatars/avatar2.svg";
import av3 from "@/assets/img/avatars/avatar3.svg";
import av4 from "@/assets/img/avatars/avatar4.svg";
import av5 from "@/assets/img/avatars/avatar5.svg";
import av6 from "@/assets/img/avatars/avatar6.svg";
import av7 from "@/assets/img/avatars/avatar7.svg";
import av8 from "@/assets/img/avatars/avatar8.svg";

const LOCAL_AVATARS = [av1, av2, av3, av4, av5, av6, av7, av8];

// ─── Selector de avatar ────────────────────────────────────────────────────
// Solo los 8 avatares locales — el backend (usersGetDefaultPhotos) devolvía
// una segunda lista "Avatares adicionales" con las MISMAS 8 imágenes bajo
// otro nombre, duplicando el selector sin ningún avatar realmente nuevo.
function AvatarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Preview + quitar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          border: "2px solid var(--color-border)", background: "var(--color-surface-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {value
            ? <img src={value} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <UserCircle size={28} color="var(--color-text-muted)" />
          }
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {value ? "Avatar seleccionado" : "Sin avatar"}
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
            Selecciona uno abajo o déjalo en blanco.
          </p>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              style={{ fontSize: 12, color: "var(--color-error-hover)", background: "none", border: "none", cursor: "pointer", padding: "3px 0 0", fontWeight: 600 }}
            >
              Quitar avatar
            </button>
          )}
        </div>
      </div>

      {/* Avatares locales */}
      <div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
          Avatares del sistema
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: 8 }}>
          {LOCAL_AVATARS.map((src, i) => {
            const sel = value === src;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(src)}
                title={`Avatar ${i + 1}`}
                style={{
                  padding: 2,
                  border: sel ? "3px solid var(--color-primary)" : "3px solid transparent",
                  borderRadius: "50%", background: "none", cursor: "pointer",
                  transition: "border-color 120ms, transform 120ms",
                  outline: "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <img src={src} alt={`Avatar ${i + 1}`} style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", objectFit: "cover", display: "block" }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de perfil ─────────────────────────────────────────────────────
function ProfileCard({ perfil, isTitular, isSelected, onSelect, onEdit, onDelete, switching }) {
  const name    = perfil.nombre ?? "Perfil";
  const initial = name?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={{
      background: "var(--color-surface)",
      border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
      borderRadius: 18, padding: "22px 20px",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 12, textAlign: "center", position: "relative",
      transition: "border-color 200ms, box-shadow 200ms",
      boxShadow: isSelected ? "0 0 0 3px rgba(12,106,196,0.15)" : "var(--clay-card)",
    }}>
      {/* Marca de seleccionado */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 22, height: 22, borderRadius: "50%",
          background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={12} color="white" />
        </div>
      )}

      {/* Insignia de titular */}
      {isTitular && (
        <Badge
          variant="warning"
          size="sm"
          icon={<Star size={10} />}
          style={{ position: "absolute", top: 12, left: 12 }}
        >
          Titular
        </Badge>
      )}

      {/* Avatar */}
      <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
        {perfil.avatarUrl ? (
          <img src={perfil.avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg,var(--color-primary),#1E3A6E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "white",
          }}>
            {initial}
          </div>
        )}
      </div>

      <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-text)", overflowWrap: "anywhere", maxWidth: "100%" }}>{name}</p>

      {/* Acciones — el estado (Seleccionar/Activo/Perfil actual) y las
          acciones de Editar/Eliminar van en FILAS separadas, cada una
          centrada y con flexWrap. Antes iban los 3 elementos en una sola
          fila sin wrap: en una card de ~180px de ancho ("Perfil actual" +
          2 botones con texto) no cabía y se desbordaba/apilaba mal. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
        {!isSelected && (
          <Button variant="primary" size="sm" onClick={onSelect} loading={switching}>
            {isTitular ? "Volver al titular" : "Seleccionar"}
          </Button>
        )}
        {isSelected && !isTitular && (
          <span style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>Activo</span>
        )}
        {isSelected && isTitular && (
          <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>Perfil actual</span>
        )}
        {!isTitular && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            <IconBtn label="Editar" color="#6366F1" onClick={onEdit}>
              <Edit2 size={13} />
            </IconBtn>
            <IconBtn label="Eliminar" color="var(--color-error-hover)" onClick={onDelete}>
              <Trash2 size={13} />
            </IconBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function FamiliaPerfilesPage() {
  const { user, switchProfile } = useAuth();

  const [titular,   setTitular]  = useState(null);
  const [perfiles,  setPerfiles] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [apiError,  setApiError] = useState(false);

  const [activeId, setActiveId] = useState(
    user?.perfilActivo ?? (user?.esTitular === false ? user?.perfilActivo : null)
  );

  const [toast,   setToast]   = useState({ msg: "", type: "success" });
  const [saving,  setSaving]  = useState(false);
  const [switching, setSwitching] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target,     setTarget]     = useState(null);
  const [form,       setForm]       = useState({ nombre: "", avatarUrl: "" });
  const [formErrors, setFormErrors] = useState({});

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await perfilesGetAll();
      setTitular(res?.titular ?? null);
      setPerfiles(res?.perfiles ?? []);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ nombre: "", avatarUrl: "" });
    setFormErrors({});
    setCreateOpen(true);
  };

  const openEdit = (p) => {
    setTarget(p);
    setForm({ nombre: p.nombre, avatarUrl: p.avatarUrl ?? "" });
    setFormErrors({});
    setEditOpen(true);
  };

  // ── Seleccionar perfil ────────────────────────────────────────────────────
  // FIX: esperaba un `res.token` en el body y se lo pasaba a switchProfile()
  // junto con datos armados a mano — pero seleccionarPerfil() en el backend
  // nunca devuelve un token (solo reemplaza la cookie httpOnly), así que
  // esa rama disparaba SIEMPRE y la función ni siquiera llegaba a existir
  // en el contexto de auth. Ahora: se llama al endpoint (que deja la cookie
  // lista) y luego se le pide a switchProfile() que vuelva a preguntar
  // "¿quién soy?" — así `user` queda con el perfil real que aceptó el server.
  const handleSelect = async (perfil, esTitular = false) => {
    const perfilId = esTitular ? null : perfil._id;
    setSwitching(esTitular ? "titular" : perfil._id);
    try {
      await perfilesSeleccionar({ perfilId });

      const ok = await switchProfile();
      if (!ok) {
        notify("Perfil activado, pero no se pudo refrescar la sesión. Recarga la página.", "error");
        return;
      }

      setActiveId(esTitular ? null : perfil._id);

      const fcmToken = localStorage.getItem("fcmToken");
      if (fcmToken) {
        try {
          await perfilesUpdateFcmToken({ perfilId: esTitular ? null : perfil._id, fcmToken });
        } catch { /* silencioso */ }
      }

      notify(esTitular ? "Volviste al perfil titular" : `Perfil "${perfil.nombre}" activado`);
    } catch (err) {
      notify(humanizeError(err, "Error al seleccionar perfil"), "error");
    } finally {
      setSwitching(null);
    }
  };

  // ── CRUD (crear, leer, actualizar, eliminar) ──────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await perfilesCreate(form);
      notify("Perfil creado");
      setCreateOpen(false);
      load();
    } catch (err) {
      setFormErrors({ submit: humanizeError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await perfilesUpdate(target._id, form);
      notify("Perfil actualizado");
      setEditOpen(false);
      load();
    } catch (err) {
      setFormErrors({ submit: humanizeError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await perfilesDelete(target._id);
      if (activeId === target._id) await handleSelect(titular, true);
      setDeleteOpen(false);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar perfil"), "error");
    } finally {
      setSaving(false);
    }
  };

  const canCreate = perfiles.length < 5;

  // ── Renderizado ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(217,119,6,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} color="#D97706" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Perfiles familiares</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "3px 0 0" }}>
              Selecciona o gestiona los perfiles de tu familia
            </p>
          </div>
        </div>

        {canCreate && (
          <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={15} />}>
            Nuevo perfil
          </Button>
        )}
      </div>

      {/* Perfil activo banner */}
      {activeId && (
        <div style={{
          marginBottom: 20, padding: "10px 16px", borderRadius: 12,
          background: "rgba(12,106,196,0.08)", border: "1px solid rgba(12,106,196,0.20)",
          display: "flex", alignItems: "center", gap: 10, fontSize: 13.5,
          color: "var(--color-primary)", fontWeight: 600,
        }}>
          <UserCircle size={16} />
          Estás navegando con el perfil: <strong>{perfiles.find(p => p._id === activeId)?.nombre ?? "Secundario"}</strong>
        </div>
      )}

      {/* Error de carga */}
      {apiError && (
        <div style={{ marginBottom: 20 }}>
          <Badge variant="error" icon={<AlertCircle size={16} />}>
            Error al cargar los perfiles
          </Badge>
          <Button variant="primary" onClick={load} style={{ marginTop: 12 }}>Reintentar</Button>
        </div>
      )}

      {/* Esqueletos de carga */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: 180, borderRadius: 18, background: "var(--color-border)" }} />
          ))}
        </div>
      )}

      {/* Grid de perfiles */}
      {!apiError && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {/* Titular */}
          {titular && (
            <ProfileCard
              perfil={titular}
              isTitular
              isSelected={!activeId}
              onSelect={() => handleSelect(titular, true)}
              switching={switching === "titular"}
            />
          )}

          {/* Perfiles secundarios */}
          {perfiles.map(p => (
            <ProfileCard
              key={p._id}
              perfil={p}
              isSelected={activeId === p._id}
              onSelect={() => handleSelect(p, false)}
              switching={switching === p._id}
              onEdit={() => openEdit(p)}
              onDelete={() => { setTarget(p); setDeleteOpen(true); }}
            />
          ))}

          {/* Crear nuevo */}
          {canCreate && (
            <button
              onClick={openCreate}
              style={{
                border: "2px dashed var(--color-border)", borderRadius: 18,
                padding: "22px 20px", background: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 8, color: "var(--color-text-muted)",
                transition: "border-color 150ms", minHeight: 180,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            >
              <Plus size={24} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Nuevo perfil</span>
            </button>
          )}
        </div>
      )}

      {/* ── MODAL: Crear ── */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setFormErrors({}); }}
        title="Nuevo perfil familiar"
        description="Elige un nombre y un avatar para el perfil."
        size="md"
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <AvatarPicker
              value={form.avatarUrl}
              onChange={url => setForm(f => ({ ...f, avatarUrl: url }))}
            />

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
              <Input
                label="Nombre del perfil *"
                placeholder="Ej: María, Hijo mayor…"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                error={formErrors.nombre}
                required
              />
            </div>

            {formErrors.submit && (
              <Badge variant="error" icon={<AlertCircle size={14} />}>{formErrors.submit}</Badge>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="outline-neutral" type="button" onClick={() => { setCreateOpen(false); setFormErrors({}); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} disabled={!form.nombre.trim()}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Editar ── */}
      <Modal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setFormErrors({}); }}
        title="Editar perfil"
        description="Modifica el nombre o avatar del perfil."
        size="md"
      >
        <form onSubmit={handleEdit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <AvatarPicker
              value={form.avatarUrl}
              onChange={url => setForm(f => ({ ...f, avatarUrl: url }))}
            />

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
              <Input
                label="Nombre del perfil *"
                placeholder="Nombre del perfil"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                error={formErrors.nombre}
                required
              />
            </div>

            {formErrors.submit && (
              <Badge variant="error" icon={<AlertCircle size={14} />}>{formErrors.submit}</Badge>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="outline-neutral" type="button" onClick={() => { setEditOpen(false); setFormErrors({}); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} disabled={!form.nombre.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Eliminar ── */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar perfil" size="sm">
        <p style={{ color: "var(--color-text-muted)", marginBottom: 20, fontSize: 13.5 }}>
          ¿Seguro que deseas eliminar el perfil <strong>"{target?.nombre}"</strong>?
          {activeId === target?._id && (
            <span style={{ display: "block", marginTop: 8, color: "#D97706", fontWeight: 600 }}>
              Este perfil está activo. Al eliminarlo volverás al perfil titular.
            </span>
          )}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="outline-neutral" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
