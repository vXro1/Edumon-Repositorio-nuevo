// src/features/docentes/pages/DocentesPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, GraduationCap, X, Loader2, RefreshCw,
  Upload, CheckCircle2, AlertCircle, Download, Trash2, FileSpreadsheet,
} from "lucide-react";

import { usersGetAll } from "@/services/usersService";
import { institucionesCreateDocente, institucionesCreateDocentesCsv } from "@/services/institucionesService";
import { Modal, UserAvatar, Toast, Button, Badge, Avatar } from "@/components";
import { Sk, EmptyState, Field } from "@/features/cursos/components/shared/ui";
import { normalizeUser } from "@/lib/normalizers";
import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";
import { normalizePhone } from "@/utils/normalizePhone";
import { descargarPlantillaDocentesCSV, CSV_COLUMNAS_DOCENTES } from "@/components/ui/DocentesCsvTemplate";

/* ── Fila esqueleto ─────────────────────────────────────────────────── */
function SkRow() {
  return (
    <tr>
      {[200, 160, 140, 110, 80].map((w, i) => (
        <td key={i} style={{ padding: "13px 16px" }}>
          <Sk h={14} w={w} />
        </td>
      ))}
    </tr>
  );
}

/* ── Fila de docente ────────────────────────────────────────────────── */
function DocenteRow({ docente: d }) {
  return (
    <tr
      style={{ transition: "background var(--transition-fast)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-2)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UserAvatar user={d} size={32} />
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--color-text)" }}>
              {d.nombre} {d.apellido}
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--color-text-muted)" }}>
              {d.cedula ?? "—"}
            </p>
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
        {d.correo}
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
        {d.telefono ?? "—"}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <Badge variant={d.estado === "activo" ? "success" : "neutral"}>
          {d.estado ?? "activo"}
        </Badge>
      </td>
    </tr>
  );
}

/* ── Campo de formulario ────────────────────────────────────────────── */
function FormInput({ value, onChange, placeholder, type = "text", required = false }) {
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
        width: "100%",
        padding: "9px 12px",
        fontSize: 13.5,
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${focused ? "var(--color-primary)" : "var(--color-border)"}`,
        outline: "none",
        background: "var(--color-surface)",
        color: "var(--color-text)",
        boxShadow: focused ? "var(--shadow-focus)" : "none",
        transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        boxSizing: "border-box",
      }}
    />
  );
}

/* ── Tabla de referencia del formato CSV ───────────────────────────── */
function CsvFormatoTable() {
  return (
    <div style={{
      border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
      overflow: "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: "var(--color-surface-2)" }}>
            {CSV_COLUMNAS_DOCENTES.map((col, i) => (
              <th key={col} style={{
                padding: "8px 12px", textAlign: "left",
                fontWeight: 700, color: "var(--color-text)",
                borderBottom: "1px solid var(--color-border)",
                borderRight: i < CSV_COLUMNAS_DOCENTES.length - 1 ? "1px solid var(--color-border)" : "none",
              }}>
                {i + 1}. {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["María", "González", "3001234567", "1020304050"],
            ["Carlos", "Ramírez", "3009876543", "1098765432"],
          ].map((fila, r) => (
            <tr key={r}>
              {fila.map((val, i) => (
                <td key={i} style={{
                  padding: "7px 12px", color: "var(--color-text-muted)",
                  borderRight: i < fila.length - 1 ? "1px solid var(--color-border)" : "none",
                  borderTop: "1px solid var(--color-border)",
                }}>
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Constantes ─────────────────────────────────────────────────────── */
const INIT = { nombre: "", apellido: "", cedula: "", telefono: "", correo: "" };
const LIMIT = 15;

/* ══════════════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════════════ */
export default function DocentesPage() {
  const setUsers = useUserStore(s => s.setUsers);

  const [docentes,   setDocentes]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [debSearch,  setDebSearch]  = useState("");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [toast,    setToast]    = useState({ msg: "", type: "success" });
  const [saving,   setSaving]   = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showCsv,    setShowCsv]   = useState(false);
  const [form,       setForm]      = useState(INIT);

  const fileRef   = useRef(null);
  const [csvFile,    setCsvFile]   = useState(null);
  const [csvLoading, setCsvLoading]= useState(false);
  const [csvResult,  setCsvResult] = useState(null);

  /* ── Auxiliares ── */
  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // Retraso en la búsqueda para no llamar a la API en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Al buscar, traer todos los docentes para que el filtro cliente sea completo
      const params = debSearch
        ? { rol: "docente", page: 1, limit: 1000 }
        : { rol: "docente", page, limit: LIMIT };
      const res = await usersGetAll(params);
      const normalized = (res.users ?? []).map(normalizeUser);
      setDocentes(normalized);
      setTotal(res.pagination?.totalUsers ?? normalized.length);
      setUsers(normalized);
    } catch {
      notify("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  }, [page, debSearch, setUsers]);

  useEffect(() => { load(); }, [load]);

  /* ── Filtro ── */
  const filtered = docentes.filter(d => {
    const q = search.toLowerCase();
    return !q
      || d.nombre?.toLowerCase().includes(q)
      || d.apellido?.toLowerCase().includes(q)
      || d.correo?.toLowerCase().includes(q)
      || d.cedula?.includes(q);
  });

  /* ── Crear ── */
  const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await institucionesCreateDocente({ ...form, telefono: normalizePhone(form.telefono) });
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

  /* ── Importación CSV ── */
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

  const totalPages = debSearch ? 0 : Math.ceil(total / LIMIT);

  /* ══════════════════════════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ── */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Docentes</h1>
          <p className="page-subtitle">{total} docentes registrados</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="ghost" size="sm" onClick={load} title="Recargar">
            <RefreshCw size={15} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowCsv(true); resetCsv(); }}>
            <Upload size={15} /> Importar CSV
          </Button>
          <Button size="sm" onClick={() => { setForm(INIT); setShowCreate(true); }}>
            <Plus size={15} /> Registrar docente
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", maxWidth: 360, marginBottom: "var(--space-5)" }}>
        <Search
          size={15}
          style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--color-text-subtle)",
            pointerEvents: "none",
          }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o cédula…"
          style={{
            width: "100%", height: 38, paddingLeft: 36, paddingRight: search ? 36 : 12,
            borderRadius: "var(--radius-md)", border: "1.5px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text)",
            fontSize: 13, outline: "none", boxSizing: "border-box",
            transition: "border-color var(--transition-fast)",
          }}
          onFocus={e  => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={e   => (e.target.style.borderColor = "var(--color-border)")}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-muted)", display: "flex", padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}>
        {!loading && filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No hay docentes"
            desc={search ? "Ningún docente coincide con la búsqueda." : "Registra el primer docente de la institución."}
            action={!search ? { label: "Registrar docente", onClick: () => { setForm(INIT); setShowCreate(true); } } : undefined}
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
                {["Docente", "Correo", "Teléfono", "Estado"].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.06em", color: "var(--color-text-muted)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3, 4].map(i => <SkRow key={i} />)
                : filtered.map(d => <DocenteRow key={d._id} docente={d} />)
              }
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-2)", marginTop: "var(--space-5)" }}>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Anterior
          </Button>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)", alignSelf: "center" }}>
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}

      {/* ══ MODAL: Crear docente ══ */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Registrar docente"
        description="El docente recibirá sus credenciales por correo."
        size="md"
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <Field label="Nombre">
              <FormInput value={form.nombre}   onChange={f("nombre")}   placeholder="Ej. María" required />
            </Field>
            <Field label="Apellido">
              <FormInput value={form.apellido} onChange={f("apellido")} placeholder="Ej. García" required />
            </Field>
            <Field label="Cédula">
              <FormInput value={form.cedula}   onChange={f("cedula")}   placeholder="Número de cédula" />
            </Field>
            <Field label="Teléfono">
              <FormInput value={form.telefono} onChange={f("telefono")} placeholder="+57 300 000 0000" type="tel" />
            </Field>
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Field label="Correo electrónico">
              <FormInput value={form.correo} onChange={f("correo")} placeholder="correo@institución.edu" type="email" required />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-6)" }}>
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Registrando…</> : "Registrar docente"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══ MODAL: Importar CSV ══ */}
      <Modal
        isOpen={showCsv}
        onClose={() => { setShowCsv(false); resetCsv(); }}
        title="Importar docentes por CSV"
        description="El correo de acceso se genera automáticamente a partir de la cédula; no se incluye en el archivo."
        size="md"
      >
        {!csvResult ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

            {/* Formato esperado + descarga de plantilla */}
            <div style={{
              background: "var(--color-surface-2)", borderRadius: "var(--radius-lg)",
              padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <FileSpreadsheet size={16} style={{ color: "var(--color-primary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                    Formato requerido
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={descargarPlantillaDocentesCSV}>
                  <Download size={14} /> Descargar plantilla
                </Button>
              </div>

              <CsvFormatoTable />

              <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                La primera fila debe ser el encabezado exacto (<code>nombre,apellido,telefono,cedula</code>),
                en ese orden. No incluyas una columna de correo: el sistema la genera automáticamente
                con la cédula. La contraseña inicial de cada docente será su número de cédula.
              </p>
            </div>

            {/* Zona de soltar archivos */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${csvFile ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-8)",
                textAlign: "center",
                cursor: "pointer",
                background: csvFile ? "var(--color-primary-subtle)" : "var(--color-surface-2)",
                transition: "all var(--transition-fast)",
              }}
            >
              <Upload size={24} style={{ margin: "0 auto var(--space-2)", color: "var(--color-text-muted)" }} />
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                {csvFile ? csvFile.name : "Haz clic para seleccionar un archivo CSV"}
              </p>
              {!csvFile && (
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "var(--space-1) 0 0" }}>
                  Solo archivos .csv
                </p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={e => setCsvFile(e.target.files[0] ?? null)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="outline" onClick={() => { setShowCsv(false); resetCsv(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCsvUpload} disabled={!csvFile || csvLoading}>
                {csvLoading ? <><Loader2 size={14} className="animate-spin" /> Importando…</> : "Importar"}
              </Button>
            </div>
          </div>
        ) : (
          /* Resultado */
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <div style={{
                flex: 1, padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
                background: "var(--color-success-light)", textAlign: "center",
              }}>
                <CheckCircle2 size={20} style={{ color: "var(--color-success)", margin: "0 auto var(--space-1)" }} />
                <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-success)", margin: 0 }}>
                  {csvResult.exitosos}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Exitosos</p>
              </div>
              {csvResult.fallidos > 0 && (
                <div style={{
                  flex: 1, padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
                  background: "var(--color-error-light)", textAlign: "center",
                }}>
                  <AlertCircle size={20} style={{ color: "var(--color-error)", margin: "0 auto var(--space-1)" }} />
                  <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-error)", margin: 0 }}>
                    {csvResult.fallidos}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Fallidos</p>
                </div>
              )}
            </div>

            {csvResult.errores?.length > 0 && (
              <div style={{
                background: "var(--color-surface-2)", borderRadius: "var(--radius-md)",
                padding: "var(--space-3)", maxHeight: 180, overflowY: "auto",
                fontSize: 12, color: "var(--color-text-muted)",
              }}>
                {csvResult.errores.map((e, i) => (
                  <p key={i} style={{ margin: "0 0 var(--space-1)" }}>• {e}</p>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="outline" onClick={resetCsv}>
                Importar otro archivo
              </Button>
              <Button onClick={() => { setShowCsv(false); resetCsv(); }}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}