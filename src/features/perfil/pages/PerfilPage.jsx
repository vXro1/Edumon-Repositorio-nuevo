// src/features/perfil/pages/PerfilPage.jsx
import { useState, useEffect, useRef } from "react";
import {
  User, Camera, Lock, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, Mail, Phone, CreditCard,
  Building2, Shield,
} from "lucide-react";
import {
  usersGetMyProfile, usersUpdateMyPhoto,
  usersGetDefaultPhotos, authChangePassword,
} from "@/lib/apiClient";
import Modal from "@/components/ui/Modal";

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)", color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "success" ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} /> : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

function PassInput({ value, onChange, placeholder, required, label }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState(false);
  return (
    <FieldGroup label={label}>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setF(true)}
          onBlur={() => setF(false)}
          style={{ width: "100%", padding: "9px 40px 9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms", boxSizing: "border-box" }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          tabIndex={-1}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 2 }}
        >
          {show ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
        </button>
      </div>
    </FieldGroup>
  );
}

const ROL_LABELS = {
  superadmin:    "Super Administrador",
  administrador: "Administrador",
  docente:       "Docente",
  padre:         "Padre / Tutor",
};

const ROL_COLORS = {
  superadmin:    { color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  administrador: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  docente:       { color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  padre:         { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
};

export default function PerfilPage() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ msg: "", type: "success" });

  // Photo
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [defaultPhotos,  setDefaultPhotos]  = useState([]);
  const [loadingPhotos,  setLoadingPhotos]  = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef(null);

  // Password
  const [passForm,   setPassForm]   = useState({ actual: "", nueva: "", confirmar: "" });
  const [savingPass, setSavingPass] = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    usersGetMyProfile()
      .then(d => setProfile(d.usuario ?? d.user ?? d))
      .catch(() => notify("Error al cargar perfil", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleUploadPhoto = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const data = await usersUpdateMyPhoto(fd);
      setProfile(p => ({ ...p, fotoPerfilUrl: data.fotoPerfilUrl ?? data.usuario?.fotoPerfilUrl ?? p.fotoPerfilUrl }));
      notify("Foto actualizada correctamente");
      setShowPhotoModal(false);
    } catch (err) {
      notify(err.message || "Error al subir foto", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectDefault = async (url) => {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("fotoPredeterminadaUrl", url);
      const data = await usersUpdateMyPhoto(fd);
      setProfile(p => ({ ...p, fotoPerfilUrl: data.fotoPerfilUrl ?? url }));
      notify("Avatar actualizado");
      setShowPhotoModal(false);
    } catch (err) {
      notify(err.message || "Error al actualizar avatar", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openPhotoModal = async () => {
    setShowPhotoModal(true);
    if (defaultPhotos.length === 0) {
      setLoadingPhotos(true);
      try {
        const data = await usersGetDefaultPhotos();
        setDefaultPhotos(data.fotos ?? []);
      } catch { /* silencioso */ }
      finally { setLoadingPhotos(false); }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.nueva !== passForm.confirmar) {
      notify("Las contraseñas nuevas no coinciden", "error");
      return;
    }
    if (passForm.nueva.length < 6) {
      notify("La nueva contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    setSavingPass(true);
    try {
      await authChangePassword({ contrasenaActual: passForm.actual, contrasenaNueva: passForm.nueva });
      notify("Contraseña actualizada correctamente");
      setPassForm({ actual: "", nueva: "", confirmar: "" });
    } catch (err) {
      notify(err.message || "Error al cambiar contraseña", "error");
    } finally {
      setSavingPass(false);
    }
  };

  const rolCfg = profile ? (ROL_COLORS[profile.rol] ?? { color: "#94A3B8", bg: "rgba(148,163,184,0.12)" }) : null;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Page title ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User style={{ width: 18, height: 18, color: "#0C6AC4" }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Mi perfil</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Sk h={140} r={18} /><Sk h={200} r={18} /><Sk h={220} r={18} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Avatar + datos personales ──────────────────────── */}
          <div style={{ background: "var(--color-surface)", borderRadius: 18, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap" }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {profile?.fotoPerfilUrl ? (
                  <img
                    src={profile.fotoPerfilUrl}
                    alt="Avatar"
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-border)" }}
                  />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white" }}>
                    {profile?.nombre?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <button
                  onClick={openPhotoModal}
                  title="Cambiar foto"
                  style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "#0C6AC4", border: "2px solid var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Camera style={{ width: 12, height: 12, color: "white" }} />
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                    {profile?.nombre} {profile?.apellido}
                  </h2>
                  {rolCfg && (
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: rolCfg.bg, color: rolCfg.color }}>
                      {ROL_LABELS[profile.rol] ?? profile.rol}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
                  {profile?.correo && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <Mail style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
                      {profile.correo}
                    </div>
                  )}
                  {profile?.telefono && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <Phone style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
                      {profile.telefono}
                    </div>
                  )}
                  {profile?.cedula && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <CreditCard style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
                      {profile.cedula}
                    </div>
                  )}
                  {profile?.institucion?.nombre && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <Building2 style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
                      {profile.institucion.nombre}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: profile?.estado === "activo" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)", color: profile?.estado === "activo" ? "#16A34A" : "#DC2626" }}>
                    {profile?.estado === "activo" ? "Cuenta activa" : "Cuenta suspendida"}
                  </span>
                  {profile?.fechaRegistro && (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
                      Miembro desde {new Date(profile.fechaRegistro).toLocaleDateString("es", { month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Cambiar contraseña ─────────────────────────────── */}
          <div style={{ background: "var(--color-surface)", borderRadius: 18, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(99,102,241,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lock style={{ width: 15, height: 15, color: "#6366F1" }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Cambiar contraseña</h3>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PassInput
                  label="Contraseña actual *"
                  value={passForm.actual}
                  onChange={e => setPassForm(p => ({ ...p, actual: e.target.value }))}
                  placeholder="Tu contraseña actual"
                  required
                />
                <PassInput
                  label="Nueva contraseña *"
                  value={passForm.nueva}
                  onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <PassInput
                  label="Confirmar nueva contraseña *"
                  value={passForm.confirmar}
                  onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  type="submit"
                  disabled={savingPass}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 10, border: "none", background: savingPass ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: savingPass ? "not-allowed" : "pointer" }}
                >
                  {savingPass
                    ? <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />
                    : <Shield style={{ width: 15, height: 15 }} />
                  }
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ PHOTO MODAL ═════════════════════════════════════════ */}
      <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Cambiar foto de perfil" size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Upload */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Subir foto propia</p>
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={uploadingPhoto}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "2px dashed var(--color-border)", background: "var(--color-bg)", cursor: uploadingPhoto ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--color-text-muted)" }}
            >
              {uploadingPhoto
                ? <><Loader2 style={{ width: 16, height: 16, animation: "edu-spin 0.6s linear infinite" }} /> Subiendo...</>
                : <><Camera style={{ width: 16, height: 16 }} /> Seleccionar imagen</>
              }
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) handleUploadPhoto(e.target.files[0]); }}
            />
          </div>

          {/* Default photos */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Avatares predeterminados</p>
            {loadingPhotos ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[0,1,2,3,4].map(i => <div key={i} className="animate-pulse" style={{ aspectRatio: 1, borderRadius: "50%", background: "var(--color-border)" }} />)}
              </div>
            ) : defaultPhotos.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center" }}>No hay avatares disponibles</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {defaultPhotos.map((foto, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectDefault(foto.url)}
                    disabled={uploadingPhoto}
                    title={foto.nombre ?? `Avatar ${i + 1}`}
                    style={{ padding: 0, border: profile?.fotoPerfilUrl === foto.url ? "3px solid #0C6AC4" : "3px solid transparent", borderRadius: "50%", cursor: "pointer", background: "none", transition: "border-color 150ms" }}
                  >
                    <img
                      src={foto.url}
                      alt={foto.nombre ?? `Avatar ${i + 1}`}
                      style={{ width: "100%", aspectRatio: 1, borderRadius: "50%", objectFit: "cover", display: "block" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
