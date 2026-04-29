// src/features/docentes/pages/DocentesPage.jsx
// ROL: Administrador — gestión de docentes de la institución
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, GraduationCap, X, Loader2,
  RefreshCw, Upload, FileText, CheckCircle2,
  AlertCircle, Download, Trash2,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersGetAll, institucionesCreateDocente, institucionesCreateDocentesCsv } from "@/lib/apiClient";
import Modal from "@/components/ui/Modal";

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = { success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" }, error: { bg: "rgba(220,38,38,0.12)", color: "#DC2626", border: "rgba(220,38,38,0.25)" } };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8, animation: "edu-slide-down 0.25s ease" }}>
      {type === "success" ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} /> : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function SkRow() {
  return (
    <tr>
      {[180, 150, 130, 100, 80].map((w, i) => (
        <td key={i} style={{ padding: "13px 16px" }}><Sk w={w} /></td>
      ))}
    </tr>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required = false }) {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms" }} />
  );
}

const normalizarTelefono = (t) => {
  if (!t) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+57${digits}`;
  return t;
};

const INIT = { nombre: "", apellido: "", cedula: "", telefono: "", correo: "" };

export default function DocentesPage() {
  const [docentes, setDocentes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [toast,    setToast]    = useState({ msg: "", type: "success" });
  const [saving,   setSaving]   = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showCsv,    setShowCsv]    = useState(false);
  const [form,       setForm]       = useState(INIT);

  // CSV
  const fileRef = useRef(null);
  const [csvFile,    setCsvFile]    = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult,  setCsvResult]  = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersGetAll({ rol: "docente", page, limit: 15 });
      setDocentes(res.users ?? []);
      setTotal(res.pagination?.totalUsers ?? res.users?.length ?? 0);
    } catch {
      notify("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = docentes.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.nombre?.toLowerCase().includes(q) || d.apellido?.toLowerCase().includes(q) || d.correo?.toLowerCase().includes(q) || d.cedula?.includes(q);
  });

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await institucionesCreateDocente({
        ...form,
        telefono: normalizarTelefono(form.telefono),
      });
      notify("Docente registrado correctamente");
      setShowCreate(false);
      setForm(INIT);
      load();
    } catch (err) {
      notify(err.message || "Error al registrar docente", "error");
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
      notify(err.message || "Error en la importación", "error");
    } finally {
      setCsvLoading(false);
    }
  };

  const resetCsv = () => { setCsvFile(null); setCsvResult(null); if (fileRef.current) fileRef.current.value = ""; };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(22,163,74,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap style={{ width: 18, height: 18, color: "#16A34A" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Docentes</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{total} docentes en tu institución</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} title="Actualizar" style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
          <button onClick={() => { setShowCsv(true); resetCsv(); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1.5px solid #0C6AC4", background: "transparent", color: "#0C6AC4", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 150ms" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(12,106,196,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Upload style={{ width: 15, height: 15 }} /> Importar CSV
          </button>
          <button onClick={() => { setForm(INIT); setShowCreate(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0A58A8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0C6AC4"; }}>
            <Plus style={{ width: 16, height: 16 }} /> Registrar docente
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Search style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input type="search" placeholder="Buscar por nombre, correo o cédula..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: "var(--color-text)", background: "transparent" }} />
        {search && <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><X style={{ width: 15, height: 15 }} /></button>}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                {["Docente", "Cédula", "Correo", "Teléfono", "Estado"].map(h => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4].map(i => <SkRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}><div style={{ padding: "56px 24px", textAlign: "center" }}>
                  <GraduationCap style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>{search ? "Sin resultados" : "No hay docentes registrados"}</p>
                  {!search && <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Registra el primer docente usando el botón "Registrar docente"</p>}
                </div></td></tr>
              ) : (
                filtered.map(d => <DocenteRow key={d._id} docente={d} />)
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{filtered.length} de {total} docentes</span>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Registrar docente" description="El docente recibirá sus credenciales. La contraseña inicial es su cédula." size="md">
        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Nombre *"><StyledInput value={form.nombre} onChange={f("nombre")} placeholder="Juan" required /></FieldGroup>
            <FieldGroup label="Apellido *"><StyledInput value={form.apellido} onChange={f("apellido")} placeholder="Pérez" required /></FieldGroup>
            <FieldGroup label="Cédula *"><StyledInput value={form.cedula} onChange={f("cedula")} placeholder="12345678" required /></FieldGroup>
            <FieldGroup label="Teléfono"><StyledInput value={form.telefono} onChange={f("telefono")} placeholder="+57 300 000 0000" /></FieldGroup>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Correo"><StyledInput value={form.correo} onChange={f("correo")} type="email" placeholder="docente@correo.com" /></FieldGroup>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 12 }}>Si no se proporciona correo, se generará uno temporal basado en la cédula.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {saving ? "Registrando..." : "Registrar docente"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── CSV MODAL ── */}
      <Modal isOpen={showCsv} onClose={() => { setShowCsv(false); resetCsv(); }} title="Importar docentes por CSV" description="El archivo debe contener las columnas: nombre, apellido, cedula, telefono (correo opcional)." size="md">
        {!csvResult ? (
          <div>
            {/* Download template hint */}
            <div style={{ background: "rgba(12,106,196,0.06)", border: "1px solid rgba(12,106,196,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText style={{ width: 16, height: 16, color: "#0C6AC4", flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: "var(--color-text)", margin: 0 }}>
                Columnas requeridas: <strong>nombre, apellido, cedula, telefono</strong>. Columna opcional: <strong>correo</strong>
              </p>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${csvFile ? "#16A34A" : "var(--color-border)"}`,
                borderRadius: 14, padding: "32px 24px",
                textAlign: "center", cursor: "pointer",
                background: csvFile ? "rgba(22,163,74,0.04)" : "var(--color-bg)",
                transition: "all 150ms", marginBottom: 16,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f && f.name.endsWith(".csv")) setCsvFile(f);
              }}
            >
              <Upload style={{ width: 28, height: 28, color: csvFile ? "#16A34A" : "var(--color-text-muted)", margin: "0 auto 8px" }} />
              {csvFile ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#16A34A", margin: 0 }}>{csvFile.name}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{(csvFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>Arrastra un archivo CSV aquí</p>
                  <p style={{ fontSize: 12.5, color: "var(--color-text-subtle)", marginTop: 4 }}>o haz clic para seleccionar</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => setCsvFile(e.target.files[0])} />
            </div>
            {csvFile && (
              <button onClick={resetCsv} style={{ background: "none", border: "none", fontSize: 12.5, color: "var(--color-text-muted)", cursor: "pointer", marginBottom: 10 }}>
                ✕ Quitar archivo
              </button>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => { setShowCsv(false); resetCsv(); }} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleCsvUpload} disabled={!csvFile || csvLoading} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: (!csvFile || csvLoading) ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: (!csvFile || csvLoading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {csvLoading && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
                {csvLoading ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        ) : (
          /* Results */
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Exitosos",    val: csvResult.exitosos,   color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
                { label: "Duplicados",  val: csvResult.duplicados, color: "#D97706", bg: "rgba(217,119,6,0.10)" },
                { label: "Errores",     val: csvResult.errores,    color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
                { label: "Total",       val: csvResult.total,      color: "#0C6AC4", bg: "rgba(12,106,196,0.10)" },
              ].map(({ label, val, color, bg }) => (
                <div key={label} style={{ borderRadius: 12, background: bg, padding: "14px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{val}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowCsv(false); resetCsv(); }} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DocenteRow({ docente: d }) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ borderBottom: "1px solid var(--color-border)", background: hov ? "var(--color-bg)" : "var(--color-surface)", transition: "background 150ms" }}>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#16A34A", flexShrink: 0 }}>
            {d.nombre?.[0]?.toUpperCase() ?? "D"}
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{d.nombre} {d.apellido}</p>
        </div>
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{d.cedula ?? "—"}</td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{d.correo ?? "—"}</td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{d.telefono ?? "—"}</td>
      <td style={{ padding: "12px 16px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: d.estado === "activo" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)", color: d.estado === "activo" ? "#16A34A" : "#DC2626" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
          {d.estado === "activo" ? "Activo" : "Suspendido"}
        </span>
      </td>
    </tr>
  );
}
