// src/features/auth/pages/FirstLoginScreen.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usersGetDefaultPhotos, usersPatchFotoDefault, usersPatchFotoFile, usersUpdate } from "@/services/usersService";
import { authChangePassword } from "@/services/authService";
import { humanizeError } from "@/utils/humanizeError";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";

const ROLE_REDIRECTS = {
  superadmin:    "/admin",
  administrador: "/admin",
  docente:       "/docente",
  padre:         "/padre",
  "padre/tutor": "/padre",
};

/* ── Validación ─────────────────────────────────────────────── */
function validateDataForm(form) {
  const e = {};
  if (!form.nombre.trim())   e.nombre   = "Este campo es requerido";
  if (!form.apellido.trim()) e.apellido = "Este campo es requerido";
  if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim()))
    e.correo = "Ingresa un correo válido";
  if (!form.contraseñaNueva) {
    e.contraseñaNueva = "Este campo es requerido";
  } else if (form.contraseñaNueva.length < 6) {
    e.contraseñaNueva = "Mínimo 6 caracteres";
  } else if (!/[A-Z]/.test(form.contraseñaNueva)) {
    e.contraseñaNueva = "Debe contener al menos una mayúscula";
  } else if (!/[a-z]/.test(form.contraseñaNueva)) {
    e.contraseñaNueva = "Debe contener al menos una minúscula";
  } else if (!/[0-9]/.test(form.contraseñaNueva)) {
    e.contraseñaNueva = "Debe contener al menos un número";
  }
  if (!form.confirmar) {
    e.confirmar = "Confirma tu contraseña";
  } else if (form.confirmar !== form.contraseñaNueva) {
    e.confirmar = "Las contraseñas no coinciden";
  }
  return e;
}

/* ── Micro-componentes ──────────────────────────────────────── */
function Stepper({ step }) {
  const steps = ["Foto", "Datos", "Listo"];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 32 }}>
      {steps.map((label, i) => {
        const num  = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div style={{
                width: 52,
                height: 2,
                marginTop: -16,
                background: step > i ? "#6366F1" : "var(--color-border)",
                transition: "background 300ms",
              }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: done
                  ? "var(--edu-green-600)"
                  : active
                  ? "linear-gradient(135deg, #6366F1, var(--edu-blue-500))"
                  : "var(--color-border)",
                color: (done || active) ? "white" : "var(--color-text-muted)",
                fontSize: 13,
                fontWeight: 700,
                transition: "background 300ms",
                boxShadow: active ? "0 0 0 4px rgba(99,102,241,0.15)" : "none",
              }}>
                {done
                  ? <CheckCircle2 style={{ width: 16, height: 16 }} />
                  : num
                }
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: active ? "#6366F1" : done ? "var(--edu-green-600)" : "var(--color-text-muted)",
                transition: "color 300ms",
              }}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--color-text-muted)",
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: "var(--color-error-hover)", marginTop: 4, display: "flex", alignItems: "center", gap: 4, margin: "4px 0 0" }}>
          <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} /> {error}
        </p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", disabled = false, hasError = false }) {
  const [focused, setFocused] = useState(false);
  const border = hasError ? "var(--color-error-hover)" : focused ? "#6366F1" : "var(--color-border)";
  const shadow = hasError
    ? "0 0 0 3px rgba(220,38,38,0.12)"
    : focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none";
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "10px 13px",
        fontSize: 14,
        borderRadius: 10,
        border: `1.5px solid ${border}`,
        outline: "none",
        background: disabled ? "var(--color-bg)" : "var(--color-surface)",
        color: disabled ? "var(--color-text-muted)" : "var(--color-text)",
        boxShadow: shadow,
        transition: "border-color 150ms, box-shadow 150ms",
        cursor: disabled ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
    />
  );
}

function PasswordInput({ value, onChange, placeholder, hasError = false }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const border = hasError ? "var(--color-error-hover)" : focused ? "#6366F1" : "var(--color-border)";
  const shadow = hasError
    ? "0 0 0 3px rgba(220,38,38,0.12)"
    : focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none";
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 42px 10px 13px",
          fontSize: 14,
          borderRadius: 10,
          border: `1.5px solid ${border}`,
          outline: "none",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          boxShadow: shadow,
          transition: "border-color 150ms, box-shadow 150ms",
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
      >
        {show
          ? <EyeOff style={{ width: 16, height: 16 }} />
          : <Eye    style={{ width: 16, height: 16 }} />
        }
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: "6+ caracteres", ok: password.length >= 6 },
    { label: "Mayúscula",     ok: /[A-Z]/.test(password) },
    { label: "Minúscula",     ok: /[a-z]/.test(password) },
    { label: "Número",        ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor = ["var(--color-error-hover)", "var(--color-error-hover)", "#F59E0B", "var(--edu-green-600)", "var(--edu-green-600)"][score];
  const strengthLabel = ["", "Débil", "Regular", "Buena", "Fuerte"][score];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {checks.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < score ? barColor : "var(--color-border)",
              transition: "background 250ms",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: 11, color: c.ok ? "var(--edu-green-600)" : "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <span>{c.ok ? "✓" : "○"}</span> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{strengthLabel}</span>
        )}
      </div>
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }}
    />
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderRadius: 10,
      background: "rgba(220,38,38,0.06)",
      border: "1px solid rgba(220,38,38,0.2)",
      marginBottom: 16,
    }}>
      <AlertCircle style={{ width: 15, height: 15, color: "var(--color-error-hover)", flexShrink: 0 }} />
      <p style={{ fontSize: 13, color: "var(--color-error-hover)", margin: 0 }}>{message}</p>
    </div>
  );
}

function PrimaryButton({ onClick, disabled, loading, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%",
        padding: "13px",
        borderRadius: 12,
        border: "none",
        background: (disabled || loading)
          ? "var(--color-border)"
          : "linear-gradient(135deg, #6366F1 0%, var(--edu-blue-500) 100%)",
        color: "white",
        fontSize: 15,
        fontWeight: 700,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "opacity 150ms, background 150ms",
        boxShadow: (disabled || loading) ? "none" : "0 4px 14px rgba(99,102,241,0.28)",
      }}
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   Paso 1 — Selección de avatar
   ══════════════════════════════════════════════════════════════ */
function StepAvatar({ currentPhotoUrl, onComplete }) {
  const [defaultPhotos, setDefaultPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photosError,   setPhotosError]   = useState(false);
  const [selected,      setSelected]      = useState(null); // cadena URL
  const [uploadedFile,  setUploadedFile]  = useState(null); // File (archivo)
  const [previewUrl,    setPreviewUrl]    = useState(currentPhotoUrl ?? null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const fileInputRef = useRef(null);
  const objUrlRef    = useRef(null);

  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    setPhotosError(false);
    try {
      const data = await usersGetDefaultPhotos();
      const fotos = data.fotos ?? [];
      setDefaultPhotos(fotos);
      if (currentPhotoUrl) {
        const match = fotos.find(f => f.url === currentPhotoUrl);
        if (match) setSelected(match.url);
      }
    } catch {
      setPhotosError(true);
    } finally {
      setLoadingPhotos(false);
    }
  }, [currentPhotoUrl]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Revocar la URL de objeto anterior al desmontar
  useEffect(() => () => {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
  }, []);

  const handleSelectDefault = (url) => {
    if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
    setUploadedFile(null);
    setSelected(prev => prev === url ? null : url);
    setPreviewUrl(prev => prev === url ? (currentPhotoUrl ?? null) : url);
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    const url = URL.createObjectURL(file);
    objUrlRef.current = url;
    setUploadedFile(file);
    setSelected(null);
    setPreviewUrl(url);
    setError("");
    // Resetear el input para que el mismo archivo pueda volver a seleccionarse
    e.target.value = "";
  };

  const hasSelection = selected !== null || uploadedFile !== null;

  const handleContinue = async () => {
    if (!hasSelection) {
      setError("Debes seleccionar o subir una foto para continuar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let updatedUser = null;
      if (uploadedFile) {
        const data = await usersPatchFotoFile(uploadedFile);
        updatedUser = data?.user ?? null;
      } else {
        const data = await usersPatchFotoDefault(selected);
        updatedUser = data?.user ?? null;
      }
      onComplete(updatedUser, previewUrl);
    } catch (err) {
      setError(humanizeError(err, "Error al guardar la foto. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Vista previa del avatar actual */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${hasSelection ? "#6366F1" : "var(--color-border)"}`,
          background: "var(--color-bg)",
          boxShadow: hasSelection ? "0 0 0 5px rgba(99,102,241,0.14)" : "none",
          transition: "border-color 250ms, box-shadow 250ms",
          flexShrink: 0,
        }}>
          {previewUrl
            ? <img src={previewUrl} alt="Vista previa" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera style={{ width: 28, height: 28, color: "var(--color-text-muted)" }} />
              </div>
          }
        </div>
        <p style={{
          fontSize: 12,
          fontWeight: hasSelection ? 700 : 400,
          color: hasSelection ? "#6366F1" : "var(--color-text-muted)",
          marginTop: 10,
          transition: "color 200ms",
        }}>
          {uploadedFile ? `📷 ${uploadedFile.name}` : hasSelection ? "Avatar seleccionado ✓" : "Sin foto seleccionada"}
        </p>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", marginBottom: 18 }}>
        Elige un avatar o sube tu propia foto
      </p>

      {/* Grid de avatares predeterminados */}
      {loadingPhotos ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 20 }}>
          {Array.from({ length: 8 }).map((_, i) => <AvatarSkeleton key={i} />)}
        </div>
      ) : photosError ? (
        <div style={{ textAlign: "center", padding: "10px 0", marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 8 }}>
            No se pudieron cargar los avatares
          </p>
          <button
            type="button"
            onClick={fetchPhotos}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#6366F1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} /> Reintentar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 20 }}>
          {defaultPhotos.map((foto) => {
            const active = selected === foto.url;
            return (
              <button
                key={foto.publicId}
                type="button"
                onClick={() => handleSelectDefault(foto.url)}
                style={{
                  position: "relative",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  padding: 0,
                  border: `${active ? "2.5px" : "1.5px"} solid ${active ? "#6366F1" : "var(--color-border)"}`,
                  background: active ? "rgba(99,102,241,0.07)" : "transparent",
                  cursor: "pointer",
                  transition: "transform 200ms ease, border-color 200ms, background 200ms",
                  transform: active ? "scale(1.12)" : "scale(1)",
                  flexShrink: 0,
                  overflow: "visible",
                }}
              >
                <img
                  src={foto.url}
                  alt={foto.nombre}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
                />
                {active && (
                  <span style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--edu-green-600)",
                    border: "2px solid var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <CheckCircle2 style={{ width: 10, height: 10, color: "white" }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Separador */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        <span style={{ fontSize: 12, color: "var(--color-text-muted)", flexShrink: 0 }}>o</span>
        <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
      </div>

      {/* Subir foto propia */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          border: `1.5px dashed ${uploadedFile ? "#6366F1" : "var(--color-border)"}`,
          background: uploadedFile ? "rgba(99,102,241,0.05)" : "transparent",
          color: uploadedFile ? "#6366F1" : "var(--color-text-muted)",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "border-color 200ms, color 200ms, background 200ms",
          marginBottom: 20,
        }}
      >
        <Upload style={{ width: 15, height: 15 }} />
        {uploadedFile ? "Cambiar imagen subida" : "Subir mi propia foto"}
      </button>

      <ErrorBanner message={error} />

      <PrimaryButton
        onClick={handleContinue}
        disabled={!hasSelection}
        loading={saving}
      >
        Continuar →
      </PrimaryButton>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Paso 2 — Actualización de datos (correo + contraseña)
   ══════════════════════════════════════════════════════════════ */
function StepData({ user, loginPassword, onComplete }) {
  const [form, setForm] = useState({
    nombre:          user?.nombre    ?? "",
    apellido:        user?.apellido  ?? "",
    correo:          user?.correo    ?? "",
    contraseñaNueva: "",
    confirmar:       "",
  });
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [submitError, setSubmitError] = useState("");

  const f = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const errs = validateDataForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!loginPassword) {
      setSubmitError("No se encontró la contraseña de acceso. Por favor cierra sesión e inicia de nuevo.");
      return;
    }

    setSaving(true);
    try {
      // 1. Actualizar correo (y nombre/apellido si fueron editados)
      const updateBody = {
        correo:   form.correo.trim(),
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
      };
      const userData = await usersUpdate(user.id, updateBody);

      // 2. Cambiar contraseña
      await authChangePassword({
        contrasenaActual: loginPassword,
        contrasenaNueva:  form.contraseñaNueva,
      });

      onComplete(userData?.user ?? null);
    } catch (err) {
      setSubmitError(humanizeError(err, "Error al guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Nombre y Apellido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Nombre *" error={errors.nombre}>
            <TextInput
              value={form.nombre}
              onChange={f("nombre")}
              placeholder="Juan"
              hasError={!!errors.nombre}
            />
          </Field>
          <Field label="Apellido *" error={errors.apellido}>
            <TextInput
              value={form.apellido}
              onChange={f("apellido")}
              placeholder="Pérez"
              hasError={!!errors.apellido}
            />
          </Field>
        </div>

        {/* Correo */}
        <Field label="Correo electrónico *" error={errors.correo}>
          <TextInput
            value={form.correo}
            onChange={f("correo")}
            type="email"
            placeholder="usuario@correo.com"
            hasError={!!errors.correo}
          />
        </Field>

        {/* Separador contraseña */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 14 }}>
            Crea tu contraseña
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nueva contraseña *" error={errors.contraseñaNueva}>
              <PasswordInput
                value={form.contraseñaNueva}
                onChange={f("contraseñaNueva")}
                placeholder="Mínimo 6 caracteres"
                hasError={!!errors.contraseñaNueva}
              />
            </Field>
            <PasswordStrength password={form.contraseñaNueva} />
            <Field label="Confirmar contraseña *" error={errors.confirmar}>
              <PasswordInput
                value={form.confirmar}
                onChange={f("confirmar")}
                placeholder="Repite la contraseña"
                hasError={!!errors.confirmar}
              />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <ErrorBanner message={submitError} />
        <PrimaryButton onClick={handleSubmit} loading={saving}>
          Guardar y finalizar →
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Paso 3 — Confirmación y redirección
   ══════════════════════════════════════════════════════════════ */
function StepDone({ userRol }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      navigate(ROLE_REDIRECTS[userRol] ?? "/", { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, userRol, navigate]);

  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "rgba(22,163,74,0.1)",
        border: "2px solid var(--edu-green-600)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <CheckCircle2 style={{ width: 36, height: 36, color: "var(--edu-green-600)" }} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", margin: "0 0 10px" }}>
        ¡Todo listo!
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
        Tu perfil está configurado. Bienvenido a Edumon.
      </p>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
        Redirigiendo en <strong style={{ color: "var(--color-text)" }}>{countdown}</strong>...
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pantalla principal
   ══════════════════════════════════════════════════════════════ */
const STEP_TITLES = [
  { title: "Elige tu foto de perfil", subtitle: "Esta imagen te representará en la plataforma." },
  { title: "Actualiza tus datos",     subtitle: "Completa tu correo y crea tu contraseña de acceso." },
  { title: "¡Perfil completado!",     subtitle: "" },
];

export default function FirstLoginScreen() {
  const { user, updateUser } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const loginPassword = location.state?.loginPassword ?? null;

  const [step, setStep] = useState(1);

  // Prevenir la navegación hacia atrás del navegador durante el flujo
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const handlePop = () => {
      window.history.pushState(null, document.title, window.location.href);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const handlePhotoComplete = (updatedUser, _photoUrl) => {
    if (updatedUser) updateUser(updatedUser);
    setStep(2);
  };

  const handleDataComplete = (updatedUser) => {
    if (updatedUser) updateUser(updatedUser);
    setStep(3);
  };

  const { title, subtitle } = STEP_TITLES[step - 1];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-bg)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "40px 16px 60px",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* ── Logo / Cabecera ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #6366F1 0%, var(--edu-blue-500) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(99,102,241,0.25)",
          }}>
            <CheckCircle2 style={{ width: 26, height: 26, color: "white" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", margin: "0 0 6px" }}>
            {step === 1 ? "¡Bienvenido a Edumon!" : "Configura tu cuenta"}
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>
            Completa estos pasos antes de continuar
          </p>
        </div>

        {/* ── Tarjeta ── */}
        <div style={{
          background: "var(--color-surface)",
          borderRadius: 18,
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)",
          padding: "28px",
        }}>
          {/* Indicador de pasos */}
          <Stepper step={step} />

          {/* Título del paso */}
          {step < 3 && (
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Contenido del paso */}
          {step === 1 && (
            <StepAvatar
              currentPhotoUrl={user?.fotoPerfilUrl ?? null}
              onComplete={handlePhotoComplete}
            />
          )}
          {step === 2 && (
            <StepData
              user={user}
              loginPassword={loginPassword}
              onComplete={handleDataComplete}
            />
          )}
          {step === 3 && (
            <StepDone userRol={user?.rol} />
          )}
        </div>

      </div>
    </div>
  );
}
