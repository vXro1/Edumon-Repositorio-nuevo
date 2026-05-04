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
import { Toast } from "@/components";

import { Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

// Colores de avatar predefinidos
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

          <IconBtn
            color="var(--color-text-muted)"
            onClick={onClose}
          >
            <X style={{ width: 18, height: 18 }} />
          </IconBtn>
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
        }}>
          {label}
        </label>
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

// ── Avatar picker (se mantiene nativo por contenido no compatible con IconBtn/Button) ──
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
            key={i}
            type="button"
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
  const name = perfil.nombre ?? "Perfil";
  const initial = name?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: `2px solid ${isSelected ? "#0C6AC4" : "var(--color-border)"}`,
        borderRadius: 18,
        padding: "22px 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, textAlign: "center",
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

      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg,#0C6AC4,#1E3A6E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 800, color: "white",
        }}>
          {initial}
        </div>
      </div>

      <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{name}</p>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {!isTitular && !isSelected && (
          <Button
            variant="primary"
            size="sm"
            onClick={onSelect}
          >
            Seleccionar
          </Button>
        )}

        {!isTitular && (
          <>
            <IconBtn color="#6366F1" onClick={onEdit}>
              <Edit2 style={{ width: 13, height: 13 }} />
            </IconBtn>

            <IconBtn color="#DC2626" onClick={onDelete}>
              <Trash2 style={{ width: 13, height: 13 }} />
            </IconBtn>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaPerfilesPage() {
  const [titular, setTitular] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target, setTarget] = useState(null);

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
    setSaving(true);
    try {
      await perfilesCreate(form);
      notify("Perfil creado");
      setCreateOpen(false);
      load();
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await perfilesDelete(target._id);
      setDeleteOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (perfil) => {
    const res = await perfilesSeleccionar({ perfilId: perfil._id });
    if (res.token) {
      localStorage.setItem("token", res.token);
      setSelected(perfil._id);
    }
  };

  const canCreate = perfiles.length < 5;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Users />
          <div>
            <h1>Perfiles familiares</h1>
            <p>Gestiona los perfiles de tu familia</p>
          </div>
        </div>

        {canCreate && (
          <Button
            onClick={() => { setForm({ nombre: "", avatarUrl: "" }); setCreateOpen(true); }}
            variant="primary"
          >
            <Plus style={{ width: 15, height: 15 }} />
            Nuevo perfil
          </Button>
        )}
      </div>

      {/* Error */}
      {apiError && (
        <div>
          <AlertCircle />
          <Button variant="primary" onClick={load}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Grid */}
      {!apiError && (
        <div style={{ display: "grid", gap: 16 }}>
          {titular && <ProfileCard perfil={titular} isTitular />}
          {perfiles.map(p => (
            <ProfileCard
              key={p._id}
              perfil={p}
              isSelected={selected === p._id}
              onSelect={() => handleSelect(p)}
              onEdit={() => { setTarget(p); setEditOpen(true); }}
              onDelete={() => { setTarget(p); setDeleteOpen(true); }}
            />
          ))}

          {canCreate && (
            <Button
              variant="custom"
              onClick={() => { setForm({ nombre: "", avatarUrl: "" }); setCreateOpen(true); }}
            >
              <Plus />
              Agregar perfil
            </Button>
          )}
        </div>
      )}

      {/* Modales */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo perfil">
        <form onSubmit={handleCreate}>
          <StInput label="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving && <Loader2 />}
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar">
        <form onSubmit={handleEdit}>
          <StInput label="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving && <Loader2 />}
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar">
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving && <Loader2 />}
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}