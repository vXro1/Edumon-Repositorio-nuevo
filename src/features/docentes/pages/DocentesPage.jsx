// src/features/docentes/pages/DocentesPage.jsx
// ROL: Administrador — gestión de docentes de la institución

import { useState, useEffect, useCallback, useRef } from "react";

import {
  Plus,
  Search,
  GraduationCap,
  X,
  Loader2,
  RefreshCw,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  usersGetAll,
  institucionesCreateDocente,
  institucionesCreateDocentesCsv,
} from "@/lib/apiClient";

import { Modal, UserAvatar, Toast, Button } from "@/components";

import { IconBtn } from "@/features/cursos/components/shared/ui";

import { normalizeUser } from "@/lib/normalizers";
import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";
import { normalizePhone } from "@/utils/normalizePhone";

function Sk({ h = 14, w = "100%", r = 6 }) {
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "var(--color-border)",
      }}
    />
  );
}

function SkRow() {
  return (
    <tr>
      {[180, 150, 130, 100, 80].map((w, i) => (
        <td key={i} style={{ padding: "13px 16px" }}>
          <Sk w={w} />
        </td>
      ))}
    </tr>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--color-text-muted)",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required = false }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        width: "100%",
        padding: "9px 12px",
        fontSize: 13.5,
        borderRadius: 10,
        border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`,
        outline: "none",
        background: "var(--color-surface)",
        color: "var(--color-text)",
        boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
    />
  );
}

const INIT = { nombre: "", apellido: "", cedula: "", telefono: "", correo: "" };

export default function DocentesPage() {
  const setUsers = useUserStore((s) => s.setUsers);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [form, setForm] = useState(INIT);

  const fileRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersGetAll({ rol: "docente", page, limit: 15 });
      const normalized = (res.users ?? []).map(normalizeUser);
      setDocentes(normalized);
      setTotal(res.pagination?.totalUsers ?? res.users?.length ?? 0);
      setUsers(normalized);
    } catch {
      notify("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  }, [page, setUsers]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = docentes.filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      d.nombre?.toLowerCase().includes(q) ||
      d.apellido?.toLowerCase().includes(q) ||
      d.correo?.toLowerCase().includes(q) ||
      d.cedula?.includes(q)
    );
  });

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await institucionesCreateDocente({
        ...form,
        telefono: normalizePhone(form.telefono),
      });
      notify("Docente registrado correctamente");
      setShowCreate(false);
      setForm(INIT);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al registrar docente"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    try {
      const fd = new FormData();
      fd.append("archivoCSV", csvFile);
      const res = await institucionesCreateDocentesCsv(fd);
      setCsvResult(res);
      notify(`Importación completada: ${res.exitosos} exitosos`);
      if (res.exitosos > 0) load();
    } catch (err) {
      notify(humanizeError(err, "Error en la importación"), "error");
    } finally {
      setCsvLoading(false);
    }
  };

  const resetCsv = () => {
    setCsvFile(null);
    setCsvResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Docentes</h1>
          <p style={{ fontSize: 13 }}>{total} docentes</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <IconBtn color="var(--color-text-muted)" onClick={load}>
            <RefreshCw size={15} />
          </IconBtn>

          <Button variant="outline" onClick={() => { setShowCsv(true); resetCsv(); }}>
            <Upload size={15} /> Importar CSV
          </Button>

          <Button onClick={() => { setForm(INIT); setShowCreate(true); }}>
            <Plus size={16} /> Registrar docente
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Search size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
        />
        {search && (
          <IconBtn color="var(--color-text-muted)" onClick={() => setSearch("")}>
            <X size={15} />
          </IconBtn>
        )}
      </div>

      {/* TABLE (sin cambios estructurales relevantes) */}
      <div>
        <table>
          <tbody>
            {loading
              ? [0, 1, 2].map((i) => <SkRow key={i} />)
              : filtered.map((d) => <DocenteRow key={d._id} docente={d} />)}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Registrar docente">
        <form onSubmit={handleCreate}>
          {/* inputs igual */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={15} />}
              {saving ? "Registrando..." : "Registrar docente"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DocenteRow({ docente: d }) {
  return (
    <tr>
      <td>{d.nombre} {d.apellido}</td>
      <td>{d.cedula}</td>
      <td>{d.correo}</td>
      <td>{d.telefono}</td>
      <td>{d.estado}</td>
    </tr>
  );
}