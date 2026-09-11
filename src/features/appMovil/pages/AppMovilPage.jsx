// src/features/appMovil/pages/AppMovilPage.jsx
// Panel de Super Admin para publicar el APK de la app móvil de Edumon.
// La app es SOLO para Android — no hay flujo iOS en ningún lado.
//
// Contrato real: colección `Apk` bajo /api/apk (ver
// BACKEND EDUMON NUEVO/src/{controllers,routes}/apk*.js). Cada apk trae
// { id, version, versionCode, notas, url, urlDescarga, tamano,
//   nombreArchivo, obligatoria, activa, fecha }. Solo una versión puede
// estar activa a la vez — el backend desactiva las demás automáticamente.

import { useState, useEffect, useCallback } from "react";
import {
  Smartphone, UploadCloud, Download, Trash2, CheckCircle2,
  Loader2, RefreshCw, Info, X, Pencil, ShieldAlert,
} from "lucide-react";
import {
  appMovilGetActual, appMovilGetAll, appMovilUpload,
  appMovilUpdate, appMovilActivar, appMovilEliminar,
} from "@/services/appMovilService";
import { Modal, Toast, Button, Input } from "@/components";
import { humanizeError } from "@/utils/humanizeError";
import { formatBytes } from "@/utils/formatBytes";
import logo from "@/assets/icons/logo.svg";
import "./AppMovilPage.css";

const VERSION_RE = /^\d+\.\d+\.\d+$/;
const APK_ACCEPT = ".apk,application/vnd.android.package-archive";
const MAX_APK_BYTES = 200 * 1024 * 1024; // límite real del backend (multer)

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}

// ── Icono estilo "launcher" de Android (NO un archivo) ────────────
function AppIcon({ size = 88 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, flexShrink: 0,
        borderRadius: "24%",
        background: "var(--gradient-cool, linear-gradient(135deg,#0A5AA8,#25CEF5))",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 12px 28px rgba(10,90,168,0.28)",
      }}
    >
      <img src={logo} alt="" style={{ width: "56%", height: "56%", filter: "brightness(0) invert(1)" }} />
    </div>
  );
}

function ObligatoriaBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700,
      color: "var(--color-warning-hover, #b45309)", background: "color-mix(in srgb, var(--color-warning) 14%, transparent)",
      padding: "3px 9px", borderRadius: 999,
    }}>
      <ShieldAlert style={{ width: 12, height: 12 }} /> Obligatoria
    </span>
  );
}

const INIT_UPLOAD = { version: "", versionCode: "", notas: "", obligatoria: false };
const INIT_EDIT = { version: "", versionCode: "", notas: "", obligatoria: false };

export default function AppMovilPage() {
  const [build, setBuild] = useState(null);       // versión activa (GET /apk/actual)
  const [history, setHistory] = useState([]);      // todas las versiones (GET /apk)
  const [historyError, setHistoryError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState(INIT_UPLOAD);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editTarget, setEditTarget] = useState(null); // apk siendo editado (metadatos)
  const [editForm, setEditForm] = useState(INIT_EDIT);

  const [busyId, setBusyId] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appMovilGetActual();
      setBuild(res?.apk ?? null);
    } catch {
      // 404 = todavía no hay ninguna versión activa
      setBuild(null);
    }
    try {
      const res = await appMovilGetAll();
      setHistory(Array.isArray(res?.apks) ? res.apks : []);
      setHistoryError(false);
    } catch {
      setHistory([]);
      setHistoryError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uf = (key) => (e) => setUploadForm((p) => ({ ...p, [key]: e.target.value }));
  const ef = (key) => (e) => setEditForm((p) => ({ ...p, [key]: e.target.value }));

  const openUpload = () => { setUploadForm(INIT_UPLOAD); setFile(null); setShowUpload(true); };

  const openEdit = (apk) => {
    setEditTarget(apk);
    setEditForm({
      version: apk.version ?? "",
      versionCode: apk.versionCode != null ? String(apk.versionCode) : "",
      notas: apk.notas ?? "",
      obligatoria: !!apk.obligatoria,
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const version = uploadForm.version.trim();

    if (!file) { notify("Selecciona el archivo .apk", "error"); return; }
    if (!file.name.toLowerCase().endsWith(".apk")) {
      notify("El archivo debe ser un .apk de Android", "error"); return;
    }
    if (file.size > MAX_APK_BYTES) {
      notify(`El archivo pesa ${formatBytes(file.size)}; el máximo permitido es 200 MB`, "error"); return;
    }
    if (!VERSION_RE.test(version)) {
      notify("La versión debe tener el formato X.Y.Z (ej. 1.2.0)", "error"); return;
    }
    if (uploadForm.versionCode && !/^\d+$/.test(uploadForm.versionCode.trim())) {
      notify("El código de versión debe ser un número entero", "error"); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("apk", file);
      fd.append("version", version);
      if (uploadForm.versionCode.trim()) fd.append("versionCode", uploadForm.versionCode.trim());
      if (uploadForm.notas.trim()) fd.append("notas", uploadForm.notas.trim());
      fd.append("obligatoria", uploadForm.obligatoria ? "true" : "false");

      await appMovilUpload(fd);
      notify(`Versión ${version} publicada y activada`);
      setShowUpload(false);
      load();
    } catch (err) {
      notify(humanizeError(err, "No se pudo publicar el APK"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    const version = editForm.version.trim();
    if (!VERSION_RE.test(version)) {
      notify("La versión debe tener el formato X.Y.Z (ej. 1.2.0)", "error"); return;
    }
    if (editForm.versionCode && !/^\d+$/.test(editForm.versionCode.trim())) {
      notify("El código de versión debe ser un número entero", "error"); return;
    }
    setSaving(true);
    try {
      await appMovilUpdate(editTarget.id, {
        version,
        versionCode: editForm.versionCode.trim() || undefined,
        notas: editForm.notas.trim() || undefined,
        obligatoria: editForm.obligatoria,
      });
      notify("Versión actualizada");
      setEditTarget(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "No se pudo actualizar la versión"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleActivar = async (id) => {
    setBusyId(id);
    try {
      await appMovilActivar(id);
      notify("Versión activada");
      load();
    } catch (err) {
      notify(humanizeError(err, "No se pudo activar la versión"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta versión del APK? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    try {
      await appMovilEliminar(id);
      notify("Versión eliminada");
      load();
    } catch (err) {
      notify(humanizeError(err, "No se pudo eliminar la versión"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const download = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Encabezado */}
      <div className="appmovil-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Smartphone style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>App móvil</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Publicá el APK de Edumon. Disponible únicamente para Android.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button variant="outline-neutral" size="sm" onClick={load} title="Actualizar" leftIcon={<RefreshCw style={{ width: 15, height: 15 }} />}>
            Actualizar
          </Button>
          <Button onClick={openUpload} leftIcon={<UploadCloud style={{ width: 16, height: 16 }} />}>
            Publicar APK
          </Button>
        </div>
      </div>

      {/* Card: versión actual */}
      <div className="appmovil-hero-card" style={{ position: "relative", overflow: "hidden", background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)", padding: 24, marginBottom: 20 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-muted)", fontSize: 14 }}>
            <Loader2 style={{ width: 16, height: 16, animation: "edu-spin 0.6s linear infinite" }} />
            Cargando versión publicada…
          </div>
        ) : build ? (
          <div className="appmovil-current-card" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <AppIcon />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text)" }}>
                  Edumon v{build.version}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--edu-green-700, #15803d)", background: "color-mix(in srgb, var(--color-success) 12%, transparent)", padding: "3px 9px", borderRadius: 999 }}>
                  <CheckCircle2 style={{ width: 12, height: 12 }} /> Activa
                </span>
                {build.obligatoria && <ObligatoriaBadge />}
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
                {build.versionCode ? `Código ${build.versionCode} · ` : ""}
                {formatBytes(build.tamano)} · Publicada el {fmtDate(build.fecha)}
              </p>
              {build.notas && (
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
                  {build.notas}
                </p>
              )}
              <div className="appmovil-current-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button size="sm" onClick={() => download(build.urlDescarga)} disabled={!build.urlDescarga} leftIcon={<Download style={{ width: 14, height: 14 }} />}>
                  Descargar APK
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(build)} leftIcon={<Pencil style={{ width: 14, height: 14 }} />}>
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={openUpload} leftIcon={<UploadCloud style={{ width: 14, height: 14 }} />}>
                  Reemplazar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "28px 16px" }}>
            <AppIcon size={72} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "14px 0 4px" }}>
              Todavía no hay ninguna versión publicada
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
              Subí el primer APK para que aparezca el botón de descarga en la landing.
            </p>
            <Button onClick={openUpload} leftIcon={<UploadCloud style={{ width: 15, height: 15 }} />}>
              Publicar APK
            </Button>
          </div>
        )}
      </div>

      {/* Aviso Android */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(12,106,196,0.06)", border: "1px solid var(--color-border)", marginBottom: 20 }}>
        <Info style={{ width: 15, height: 15, color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12.5, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          La app de Edumon se distribuye como archivo <strong>.apk</strong> y funciona solo en dispositivos
          <strong> Android</strong> (hasta 200 MB por archivo). Marcar una versión como <strong>obligatoria</strong> hace
          que la app bloquee su uso hasta que el usuario actualice.
        </p>
      </div>

      {/* Historial de versiones */}
      <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)", overflow: "hidden" }}>
        <div className="appmovil-history-head" style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid var(--color-border)" }}>
          <Smartphone style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>Historial de versiones</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="appmovil-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                {["Versión", "Tamaño", "Publicada", "Estado", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "28px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>Cargando…</td></tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
                      {historyError ? "El historial no está disponible por ahora" : "Sin versiones anteriores"}
                    </p>
                  </td>
                </tr>
              ) : (
                history.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td data-label="Versión" style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>
                      v{b.version}
                      {b.versionCode ? <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--color-text-muted)" }}> · {b.versionCode}</span> : null}
                    </td>
                    <td data-label="Tamaño" style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{formatBytes(b.tamano)}</td>
                    <td data-label="Publicada" style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{fmtDate(b.fecha)}</td>
                    <td data-label="Estado" style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {b.activa ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--edu-green-700,#15803d)" }}>
                            <CheckCircle2 style={{ width: 12, height: 12 }} /> Activa
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Archivada</span>
                        )}
                        {b.obligatoria && <ObligatoriaBadge />}
                      </div>
                    </td>
                    <td data-label="Acciones" style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Button variant="outline" size="sm" onClick={() => download(b.urlDescarga)} disabled={!b.urlDescarga} title="Descargar">
                          <Download style={{ width: 13, height: 13 }} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(b)} title="Editar metadatos">
                          <Pencil style={{ width: 13, height: 13 }} />
                        </Button>
                        {!b.activa && (
                          <Button variant="outline" size="sm" onClick={() => handleActivar(b.id)} disabled={busyId === b.id} title="Activar esta versión">
                            {busyId === b.id ? <Loader2 style={{ width: 13, height: 13, animation: "edu-spin 0.6s linear infinite" }} /> : "Activar"}
                          </Button>
                        )}
                        <Button variant="ghost-danger" size="sm" onClick={() => handleEliminar(b.id)} disabled={busyId === b.id} title="Eliminar">
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: publicar APK */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Publicar APK" description="El archivo se convierte en la versión activa que descargan los usuarios." size="md">
        <form onSubmit={handleUpload}>
          <div style={{ display: "grid", gap: 14 }}>
            {/* Selector de archivo */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", display: "block", marginBottom: 6 }}>
                Archivo .apk
              </label>
              {file ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                  <Smartphone style={{ width: 16, height: 16, color: "var(--color-primary)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                    <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>{formatBytes(file.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)} title="Quitar">
                    <X style={{ width: 14, height: 14 }} />
                  </Button>
                </div>
              ) : (
                <label
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "24px 16px", borderRadius: 12,
                    border: "1.5px dashed var(--color-border-strong, var(--color-border))",
                    background: "var(--color-bg)", cursor: "pointer", textAlign: "center",
                  }}
                >
                  <UploadCloud style={{ width: 22, height: 22, color: "var(--color-primary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Seleccionar archivo .apk</span>
                  <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>Solo Android · hasta 200 MB</span>
                  <input
                    type="file"
                    accept={APK_ACCEPT}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            <div className="appmovil-form-grid">
              <Input
                label="Versión"
                placeholder="1.2.0"
                value={uploadForm.version}
                onChange={uf("version")}
                required
              />
              <Input
                label="Código de versión (opcional)"
                placeholder="120"
                inputMode="numeric"
                value={uploadForm.versionCode}
                onChange={uf("versionCode")}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="apk-notas" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                Novedades (opcional)
              </label>
              <textarea
                id="apk-notas"
                rows={3}
                placeholder="Qué cambió en esta versión…"
                value={uploadForm.notas}
                onChange={uf("notas")}
                style={{
                  width: "100%", border: "1.5px solid var(--color-border)", borderRadius: 12,
                  padding: "10px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical",
                  background: "var(--color-bg)", color: "var(--color-text)",
                }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={uploadForm.obligatoria}
                onChange={(e) => setUploadForm((p) => ({ ...p, obligatoria: e.target.checked }))}
              />
              Actualización obligatoria (bloquea la app hasta actualizar)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="ghost" type="button" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} leftIcon={saving ? <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} /> : <UploadCloud style={{ width: 15, height: 15 }} />}>
              {saving ? "Publicando…" : "Publicar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: editar metadatos (sin re-subir el archivo) */}
      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title={`Editar v${editTarget?.version ?? ""}`} description="Cambia la versión, el changelog o si es obligatoria — no vuelve a subir el archivo." size="md">
        <form onSubmit={handleEdit}>
          <div style={{ display: "grid", gap: 14 }}>
            <div className="appmovil-form-grid">
              <Input label="Versión" placeholder="1.2.0" value={editForm.version} onChange={ef("version")} required />
              <Input label="Código de versión (opcional)" placeholder="120" inputMode="numeric" value={editForm.versionCode} onChange={ef("versionCode")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="apk-edit-notas" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                Novedades (opcional)
              </label>
              <textarea
                id="apk-edit-notas"
                rows={3}
                value={editForm.notas}
                onChange={ef("notas")}
                style={{
                  width: "100%", border: "1.5px solid var(--color-border)", borderRadius: 12,
                  padding: "10px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical",
                  background: "var(--color-bg)", color: "var(--color-text)",
                }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editForm.obligatoria}
                onChange={(e) => setEditForm((p) => ({ ...p, obligatoria: e.target.checked }))}
              />
              Actualización obligatoria (bloquea la app hasta actualizar)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="ghost" type="button" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
