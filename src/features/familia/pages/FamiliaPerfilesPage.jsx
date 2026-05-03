// src/features/familia/pages/FamiliaPerfilesPage.jsx
// ROL: Padre / Tutor — Selector y gestión de perfiles familiares
import { useState, useEffect } from "react";
import {
  Users, Plus, Edit2, Trash2, Check, X,
  Star, UserCircle, AlertCircle, Loader2,
} from "lucide-react";
import {
  perfilesGetAll, perfilesCreate, perfilesUpdate,
  perfilesDelete, perfilesSeleccionar,
} from "@/lib/apiClient";
import { humanizeError } from "@/utils/humanizeError";

// Colores de avatar predefinidos (se guardan como avatarUrl = color hex)
const AVATAR_COLORS = [
  "linear-gradient(135deg,#0C6AC4,#1E3A6E)",
  "linear-gradient(135deg,#16A34A,#064E3B)",
  "linear-gradient(135deg,#7C3AED,#4C1D95)",
  "linear-gradient(135deg,#EA580C,#7C2D12)",
  "linear-gradient(135deg,#0284C7,#0C4A6E)",
  "linear-gradient(135deg,#D97706,#78350F)",
  "linear-gradient(135deg,#DB2777,#831843)",
  "linear-gradient(135deg,#059669,#064E3B)",
  "linear-gradient(135deg,#DC2626,#7F1D1D)",
];

const AVATAR_SOLID = ["#0C6AC4","#16A34A","#7C3AED","#EA580C","#0284C7","#D97706","#DB2777","#059669","#DC2626"];

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)",  color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 600,
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600,
      maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "success"
        ? <Check style={{ width: 15, height: 15, flexShrink: 0 }} />
        : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--color-surface)", borderRadius: 18,
          padding: "24px 26px", width: "100%", maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StInput({ label, ...props }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 11.5, fontWeight: 700,
          color: "var(--color-text-muted)", textTransform: "uppercase",
          letterSpacing: "0.05em", marginBottom: 5,
        }}>{label}</label>
      )}
      <input
        {...props}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10,
          border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`,
          outline: "none", background: "var(--color-surface)",
          color: "var(--color-text)", boxSizing: "border-box",
          boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      />
    </div>
  );
}

// ── Avatar picker ─────────────────────────────────────────────
function AvatarPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{
        fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
      }}>
        Seleccionar avatar
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {AVATARS.map((av, i) => (
          <button
            key={i} type="button"
            onClick={() => onChange(av)}
            style={{
              width: 52, height: 52, borderRadius: "50%", padding: 0,
              border: `3px solid ${value === av ? "#0C6AC4" : "transparent"}`,
              cursor: "pointer", background: "none", overflow: "hidden",
              boxShadow: value === av ? "0 0 0 2px rgba(12,106,196,0.25)" : "none",
              transition: "all 150ms",
            }}
          >
            <img src={av} alt={`avatar-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Profile card ──────────────────────────────────────────────
function ProfileCard({ perfil, isTitular, isSelected, onSelect, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const name = perfil.nombre ?? `${perfil.nombre ?? "Perfil"}`;
  const initial = name?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--color-surface)",
        border: `2px solid ${isSelected ? "#0C6AC4" : hov ? "#BFDBFE" : "var(--color-border)"}`,
        borderRadius: 18,
        padding: "22px 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, textAlign: "center",
        boxShadow: isSelected ? "0 0 0 3px rgba(12,106,196,0.15), var(--shadow-md)" : hov ? "var(--shadow-md)" : "var(--shadow-card)",
        transition: "all 200ms ease",
        position: "relative",
      }}
    >
      {isSelected && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 22, height: 22, borderRadius: "50%",
          background: "#0C6AC4", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check style={{ width: 12, height: 12, color: "white" }} />
        </div>
      )}
      {isTitular && (
        <div style={{
          position: "absolute", top: 12, left: 12,
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 10.5, fontWeight: 700, color: "#D97706",
          background: "rgba(217,119,6,0.1)", borderRadius: 99, padding: "3px 8px",
        }}>
          <Star style={{ width: 10, height: 10 }} /> Titular
        </div>
      )}

      {/* Avatar — onError cae al placeholder con iniciales */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        {perfil.avatarUrl ? (
          <img
            src={perfil.avatarUrl}
            alt={name || "Perfil"}
            onError={e => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-border)" }}
          />
        ) : null}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #0C6AC4, #1E3A6E)",
          display: perfil.avatarUrl ? "none" : "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 800, color: "white",
          position: perfil.avatarUrl ? "absolute" : "static", top: 0, left: 0,
        }}>
          {initial || "?"}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{name}</p>
        {isTitular && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>Cuenta principal</p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {!isTitular && !isSelected && (
          <button
            onClick={onSelect}
            style={{
              background: "#0C6AC4", color: "white",
              border: "none", borderRadius: 8, padding: "7px 14px",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            }}
          >
            Seleccionar
          </button>
        )}
        {!isTitular && (
          <>
            <button
              onClick={onEdit}
              style={{
                background: "rgba(99,102,241,0.1)", border: "none",
                borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <Edit2 style={{ width: 13, height: 13, color: "#6366F1" }} />
            </button>
            <button
              onClick={onDelete}
              style={{
                background: "rgba(220,38,38,0.1)", border: "none",
                borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <Trash2 style={{ width: 13, height: 13, color: "#DC2626" }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaPerfilesPage() {
  const [titular,    setTitular]   = useState(null);
  const [perfiles,   setPerfiles]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [apiError,   setApiError]  = useState(false);
  const [selected,   setSelected]  = useState(null);
  const [toast,      setToast]     = useState({ msg: "", type: "success" });
  const [saving,     setSaving]    = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target,     setTarget]     = useState(null);

  // Forms
  const [form, setForm] = useState({ nombre: "", avatarUrl: "" });

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { notify("El nombre es requerido", "error"); return; }
    setSaving(true);
    try {
      await perfilesCreate({ nombre: form.nombre.trim(), avatarUrl: form.avatarUrl || undefined });
      notify("Perfil creado");
      setCreateOpen(false);
      setForm({ nombre: "", avatarUrl: "" });
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al crear perfil"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { notify("El nombre es requerido", "error"); return; }
    setSaving(true);
    try {
      await perfilesUpdate(target._id, { nombre: form.nombre.trim(), avatarUrl: form.avatarUrl || undefined });
      notify("Perfil actualizado");
      setEditOpen(false);
      setTarget(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar perfil"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await perfilesDelete(target._id);
      if (selected === target._id) setSelected(null);
      notify("Perfil eliminado");
      setDeleteOpen(false);
      setTarget(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar perfil"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (perfil) => {
    try {
      const res = await perfilesSeleccionar({ perfilId: perfil._id });
      if (res.token) {
        localStorage.setItem("token", res.token);
        setSelected(perfil._id);
        notify(`Perfil "${perfil.nombre}" seleccionado`);
      }
    } catch (err) {
      notify(humanizeError(err, "Error al seleccionar perfil"), "error");
    }
  };

  const openEdit = (perfil) => {
    setTarget(perfil);
    setForm({ nombre: perfil.nombre ?? "", avatarUrl: perfil.avatarUrl ?? "" });
    setEditOpen(true);
  };

  const openDelete = (perfil) => {
    setTarget(perfil);
    setDeleteOpen(true);
  };

  const canCreate = perfiles.length < 5;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: "rgba(12,106,196,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users style={{ width: 18, height: 18, color: "#0C6AC4" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              Perfiles familiares
            </h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
              Gestiona los perfiles de tu familia
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => { setForm({ nombre: "", avatarUrl: "" }); setCreateOpen(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#0C6AC4", color: "white",
              border: "none", borderRadius: 10, padding: "9px 18px",
              fontSize: 13.5, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(12,106,196,0.25)",
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            Nuevo perfil
          </button>
        )}
      </div>

      {/* Error state cuando la API falla */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "24px", marginBottom: 24,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "#DC2626" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            No se pudieron cargar los perfiles
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            El servicio no está disponible en este momento. Intenta de nuevo más tarde.
          </p>
          <button
            onClick={load}
            style={{
              marginTop: 4, padding: "8px 18px", borderRadius: 8, border: "none",
              background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Info banner */}
      {!apiError && (
        <div style={{
          background: "rgba(12,106,196,0.06)", border: "1px solid rgba(12,106,196,0.15)",
          borderRadius: 12, padding: "10px 16px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, color: "var(--color-text-muted)",
        }}>
          <UserCircle style={{ width: 16, height: 16, color: "#0C6AC4", flexShrink: 0 }} />
          Puedes crear hasta <strong style={{ color: "var(--color-text)" }}>5 perfiles</strong> por cuenta.
          Tienes {perfiles.length} de 5 perfil{perfiles.length !== 1 ? "es" : ""}.
          {selected && " · Perfil activo seleccionado."}
        </div>
      )}

      {/* Grid — oculto si hay error de API */}
      {!apiError && (loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              background: "var(--color-surface)", borderRadius: 18,
              padding: 22, border: "1px solid var(--color-border)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}>
              <Sk h={72} w={72} r="50%" />
              <Sk h={14} w="60%" />
              <Sk h={10} w="40%" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}>
          {titular && (
            <ProfileCard
              perfil={titular}
              isTitular
              isSelected={!selected}
            />
          )}
          {perfiles.map(p => (
            <ProfileCard
              key={p._id}
              perfil={p}
              isTitular={false}
              isSelected={selected === p._id}
              onSelect={() => handleSelect(p)}
              onEdit={() => openEdit(p)}
              onDelete={() => openDelete(p)}
            />
          ))}
          {canCreate && (
            <button
              onClick={() => { setForm({ nombre: "", avatarUrl: "" }); setCreateOpen(true); }}
              style={{
                background: "var(--color-surface)",
                border: "2px dashed var(--color-border)",
                borderRadius: 18, padding: "22px 20px",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 10,
                cursor: "pointer", minHeight: 200,
                color: "var(--color-text-muted)",
                transition: "all 150ms",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#0C6AC4";
                e.currentTarget.style.color = "#0C6AC4";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              <Plus style={{ width: 28, height: 28 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Agregar perfil</span>
            </button>
          )}
        </div>
      ))}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo perfil familiar">
        <form onSubmit={handleCreate}>
          <StInput
            label="Nombre del perfil"
            placeholder="Ej: María, Juan…"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            required
          />
          <AvatarPicker
            value={form.avatarUrl}
            onChange={av => setForm(f => ({ ...f, avatarUrl: av }))}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              type="button" onClick={() => setCreateOpen(false)}
              style={{
                background: "transparent", border: "1.5px solid var(--color-border)",
                borderRadius: 8, padding: "9px 18px", fontSize: 13.5,
                fontWeight: 600, cursor: "pointer", color: "var(--color-text-muted)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              style={{
                background: saving ? "var(--color-border)" : "#0C6AC4",
                color: "white", border: "none", borderRadius: 8,
                padding: "9px 18px", fontSize: 13.5, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {saving && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              Crear perfil
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil">
        <form onSubmit={handleEdit}>
          <StInput
            label="Nombre"
            placeholder="Nombre del perfil"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            required
          />
          <AvatarPicker
            value={form.avatarUrl}
            onChange={av => setForm(f => ({ ...f, avatarUrl: av }))}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              type="button" onClick={() => setEditOpen(false)}
              style={{
                background: "transparent", border: "1.5px solid var(--color-border)",
                borderRadius: 8, padding: "9px 18px", fontSize: 13.5,
                fontWeight: 600, cursor: "pointer", color: "var(--color-text-muted)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              style={{
                background: saving ? "var(--color-border)" : "#0C6AC4",
                color: "white", border: "none", borderRadius: 8,
                padding: "9px 18px", fontSize: 13.5, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {saving && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar perfil">
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 20 }}>
          ¿Eliminar el perfil <strong style={{ color: "var(--color-text)" }}>{target?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={() => setDeleteOpen(false)}
            style={{
              background: "transparent", border: "1.5px solid var(--color-border)",
              borderRadius: 8, padding: "9px 18px", fontSize: 13.5,
              fontWeight: 600, cursor: "pointer", color: "var(--color-text-muted)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete} disabled={saving}
            style={{
              background: saving ? "var(--color-border)" : "#DC2626",
              color: "white", border: "none", borderRadius: 8,
              padding: "9px 18px", fontSize: 13.5, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {saving && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}