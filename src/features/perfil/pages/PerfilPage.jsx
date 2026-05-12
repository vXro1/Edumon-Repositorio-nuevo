import { useState, useEffect } from "react";

import {
  User, Camera, Mail, Phone, CreditCard, Building2, Shield,
  Edit3, Save, X, Calendar, Users,
  BookOpen, GraduationCap, Key, Info, Clock, Hash, Loader2,
} from "lucide-react";

import {
  usersGetMyProfile,
  usersUpdateMyPhoto,
  usersGetDefaultPhotos,
  authChangePassword,
  usersUpdate,
  cursosGetAll,
  cursosGetMine,
  perfilesGetAll,
} from "@/lib/apiClient";

import { Modal, Toast, UserAvatar, Button, Input } from "@/components";
import getRoleStyle from "@/utils/getRoleStyle";
import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";

// ─── Local avatar imports ──────────────────────────────────────────────────
import av1  from "@/assets/img/avatars/avatar1.svg";
import av2  from "@/assets/img/avatars/avatar2.svg";
import av3  from "@/assets/img/avatars/avatar3.svg";
import av4  from "@/assets/img/avatars/avatar4.svg";
import av5  from "@/assets/img/avatars/avatar5.svg";
import av6  from "@/assets/img/avatars/avatar6.svg";
import av7  from "@/assets/img/avatars/avatar7.svg";
import av8  from "@/assets/img/avatars/avatar8.svg";
import av9  from "@/assets/img/avatars/avatar9.svg";
import av10 from "@/assets/img/avatars/avatar10.svg";
import av11 from "@/assets/img/avatars/avatar11.svg";

const LOCAL_AVATARS = [av1, av2, av3, av4, av5, av6, av7, av8, av9, av10, av11];

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Sk({ h = 14, r = 6 }) {
  return (
    <div className="animate-pulse" style={{ height: h, borderRadius: r, background: "var(--color-border)" }} />
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────
function SectionCard({ icon, iconBg = "rgba(12,106,196,0.10)", title, action, children }) {
  return (
    <div style={{
      background: "var(--color-surface)", borderRadius: 18,
      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px 14px", borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-text)" }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: "20px 24px 24px" }}>{children}</div>
    </div>
  );
}

// ─── Read-only field ───────────────────────────────────────────────────────
function ReadField({ label, value, icon }) {
  if (!value) return null;
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", background: "var(--color-bg)",
        borderRadius: 10, border: "1px solid var(--color-border)",
        fontSize: 13.5, color: "var(--color-text)",
      }}>
        {icon && <span style={{ color: "var(--color-text-muted)", flexShrink: 0, display: "flex" }}>{icon}</span>}
        {value}
      </div>
    </div>
  );
}

// ─── Role badge ────────────────────────────────────────────────────────────
function InfoBadge({ label, color, bg }) {
  return (
    <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: bg, color }}>
      {label}
    </span>
  );
}

// ─── Grid helper ──────────────────────────────────────────────────────────
function Grid2({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      {children}
    </div>
  );
}

// ─── Role-specific sections ────────────────────────────────────────────────
function HijosSection({ perfiles, loading }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ height: 60, borderRadius: 12, background: "var(--color-border)" }} />
        ))}
      </div>
    );
  }
  if (!perfiles?.length)
    return <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No hay perfiles de hijos registrados.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {perfiles.map((p, i) => (
        <div key={p._id ?? i} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
          background: "var(--color-bg)", borderRadius: 12, border: "1px solid var(--color-border)",
        }}>
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt={p.nombre} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GraduationCap size={18} color="#16A34A" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)" }}>{p.nombre}</div>
            {p.esTitular && (
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>Perfil titular</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CursosSection({ cursos, loading }) {
  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ height: 70, borderRadius: 12, background: "var(--color-border)" }} />
        ))}
      </div>
    );
  }
  if (!cursos?.length)
    return <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No hay cursos asignados.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
      {cursos.map((c, i) => (
        <div key={c._id ?? i} style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <BookOpen size={14} color="#8C38F0" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{c.nombre}</span>
          </div>
          {c.descripcion && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{c.descripcion}</p>}
          {c.grado?.nombre && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <GraduationCap size={11} /> {c.grado.nombre}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function EstudianteSection({ codigoEstudiante, grado, curso }) {
  return (
    <Grid2>
      {codigoEstudiante && <ReadField label="Código de estudiante" value={codigoEstudiante} icon={<Hash size={14} />} />}
      {(grado?.nombre ?? grado) && <ReadField label="Grado" value={grado?.nombre ?? grado} icon={<GraduationCap size={14} />} />}
      {(curso?.nombre ?? curso) && <ReadField label="Curso" value={curso?.nombre ?? curso} icon={<BookOpen size={14} />} />}
    </Grid2>
  );
}

function PermisosSection({ permisos }) {
  if (!permisos?.length)
    return <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Sin permisos especiales asignados.</p>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {permisos.map((p, i) => (
        <span key={i} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "rgba(124,58,237,0.10)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.20)" }}>
          {p}
        </span>
      ))}
    </div>
  );
}

function RoleSection({ profile, cursos, loadingCursos, perfiles, loadingPerf }) {
  const { rol } = profile ?? {};
  if (!rol) return null;

  if (rol === "padre" || rol === "familia" || rol === "padre/tutor") {
    return (
      <>
        <SectionCard icon={<Users size={15} color="#D97706" />} title="Perfiles de mis hijos" iconBg="rgba(217,119,6,0.10)">
          <HijosSection perfiles={perfiles} loading={loadingPerf} />
        </SectionCard>
        <SectionCard icon={<BookOpen size={15} color="#8C38F0" />} title="Cursos de mis hijos" iconBg="rgba(140,56,240,0.10)">
          <CursosSection cursos={cursos} loading={loadingCursos} />
        </SectionCard>
      </>
    );
  }
  if (rol === "docente") {
    return (
      <SectionCard icon={<BookOpen size={15} color="#8C38F0" />} title="Mis cursos" iconBg="rgba(140,56,240,0.10)">
        <CursosSection cursos={cursos} loading={loadingCursos} />
      </SectionCard>
    );
  }
  if (rol === "estudiante") {
    return (
      <SectionCard icon={<GraduationCap size={15} color="#16A34A" />} title="Información académica" iconBg="rgba(22,163,74,0.10)">
        <EstudianteSection codigoEstudiante={profile.codigoEstudiante} grado={profile.grado} curso={profile.curso} />
      </SectionCard>
    );
  }
  if (rol === "admin" || rol === "administrador" || rol === "superadmin") {
    return (
      <SectionCard icon={<Shield size={15} color="#7C3AED" />} title="Permisos y acceso" iconBg="rgba(124,58,237,0.10)">
        <PermisosSection permisos={profile.permisos} />
      </SectionCard>
    );
  }
  return null;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const EMPTY_EDIT = { nombre: "", apellido: "", telefono: "", correo: "" };
const EMPTY_PASS = { actual: "", nueva: "", confirmar: "" };

const fmtDate = (iso) => {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
};

// ─── Main component ────────────────────────────────────────────────────────
export default function PerfilPage() {
  const setUser = useUserStore((s) => s.setUser);

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState({ msg: "", type: "success" });

  const [editing,       setEditing]       = useState(false);
  const [editForm,      setEditForm]      = useState(EMPTY_EDIT);
  const [savingProfile, setSavingProfile] = useState(false);

  const [cursos,        setCursos]        = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [perfiles,      setPerfiles]      = useState([]);
  const [loadingPerf,   setLoadingPerf]   = useState(false);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [defaultPhotos,   setDefaultPhotos]   = useState([]);
  const [loadingPhotos,   setLoadingPhotos]   = useState(false);
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false);

  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm,      setPassForm]      = useState(EMPTY_PASS);
  const [savingPass,    setSavingPass]    = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // ── Load profile + cursos ──────────────────────────────────────────────
  useEffect(() => {
    usersGetMyProfile()
      .then(d => {
        const u = d.usuario ?? d.user ?? d;
        setProfile(u);
        setUser(u);
        loadRoleData(u.rol);
      })
      .catch(() => notify("Error al cargar perfil", "error"))
      .finally(() => setLoading(false));
  }, [setUser]);

  const loadRoleData = async (rol) => {
    const esPadre = rol === "padre" || rol === "familia" || rol === "padre/tutor";
    const esDocente = rol === "docente";

    if (!esPadre && !esDocente) return;

    // Cursos
    setLoadingCursos(true);
    try {
      const data  = esDocente ? await cursosGetAll() : await cursosGetMine();
      const lista = data.cursos ?? data.data ?? (Array.isArray(data) ? data : []);
      setCursos(lista);
    } catch { /* silencioso */ }
    finally { setLoadingCursos(false); }

    // Perfiles (hijos) — solo para padre
    if (esPadre) {
      setLoadingPerf(true);
      try {
        const data = await perfilesGetAll();
        setPerfiles(data.perfiles ?? []);
      } catch { /* silencioso */ }
      finally { setLoadingPerf(false); }
    }
  };

  // ── Edit personal data ─────────────────────────────────────────────────
  const startEdit = () => {
    setEditForm({
      nombre:   profile?.nombre   ?? "",
      apellido: profile?.apellido ?? "",
      telefono: profile?.telefono ?? "",
      correo:   profile?.correo ?? profile?.email ?? "",
    });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.nombre?.trim()) { notify("El nombre es requerido", "error"); return; }
    if (editForm.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.correo)) {
      notify("El correo no es válido", "error"); return;
    }
    setSavingProfile(true);
    try {
      const userId = profile?._id ?? profile?.id;
      const body = Object.fromEntries(
        Object.entries(editForm).filter(([, v]) => v !== "")
      );
      const data   = await usersUpdate(userId, body);
      const updated = data.user ?? data.usuario ?? data;
      setProfile(p => ({ ...p, ...updated }));
      setUser({ ...profile, ...updated });
      notify("Perfil actualizado correctamente");
      setEditing(false);
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar perfil"), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const setField = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));

  // ── Avatar modal ───────────────────────────────────────────────────────
  const openAvatarModal = async () => {
    setShowAvatarModal(true);
    if (defaultPhotos.length === 0) {
      setLoadingPhotos(true);
      try {
        const data = await usersGetDefaultPhotos();
        setDefaultPhotos(data.fotos ?? []);
      } catch { /* silencioso */ }
      finally { setLoadingPhotos(false); }
    }
  };

  const handleSelectAvatar = async (url) => {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("fotoPredeterminadaUrl", url);
      const data   = await usersUpdateMyPhoto(fd);
      const newUrl = data.fotoPerfilUrl ?? url;
      setProfile(p => ({ ...p, fotoPerfilUrl: newUrl }));
      setUser({ ...profile, fotoPerfilUrl: newUrl });
      notify("Avatar actualizado");
      setShowAvatarModal(false);
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar avatar"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Password modal ─────────────────────────────────────────────────────
  const openPassModal = () => { setPassForm(EMPTY_PASS); setShowPassModal(true); };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.nueva !== passForm.confirmar) { notify("Las contraseñas nuevas no coinciden", "error"); return; }
    if (passForm.nueva.length < 6)             { notify("La contraseña debe tener al menos 6 caracteres", "error"); return; }
    setSavingPass(true);
    try {
      await authChangePassword({ contrasenaActual: passForm.actual, contrasenaNueva: passForm.nueva });
      notify("Contraseña actualizada correctamente");
      setShowPassModal(false);
      setPassForm(EMPTY_PASS);
    } catch (err) {
      notify(humanizeError(err, "Error al cambiar contraseña"), "error");
    } finally {
      setSavingPass(false);
    }
  };

  const rolCfg = profile ? getRoleStyle(profile.rol) : null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={18} color="#0C6AC4" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Mi perfil</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Sk h={160} r={18} /><Sk h={260} r={18} /><Sk h={120} r={18} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── HEADER ── */}
          <div style={{ background: "var(--color-surface)", borderRadius: 18, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>

              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <UserAvatar user={profile} size={96} style={{ border: "3px solid var(--color-border)" }} />
                <button
                  onClick={openAvatarModal}
                  title="Cambiar avatar"
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 30, height: 30, borderRadius: "50%",
                    background: "#0C6AC4", border: "2.5px solid var(--color-surface)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Camera size={13} color="white" />
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                    {profile?.nombre} {profile?.apellido}
                  </h2>
                  {rolCfg && <InfoBadge label={rolCfg.label} color={rolCfg.color} bg={rolCfg.bg} />}
                  <InfoBadge
                    label={profile?.estado === "activo" ? "Cuenta activa" : "Cuenta suspendida"}
                    color={profile?.estado === "activo" ? "#16A34A" : "#DC2626"}
                    bg={profile?.estado === "activo" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)"}
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 14 }}>
                  {(profile?.correo || profile?.email) && (
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <Mail size={13} color="var(--color-text-muted)" />
                      {profile.correo ?? profile.email}
                    </span>
                  )}
                  {profile?.telefono && (
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <Phone size={13} color="var(--color-text-muted)" />
                      {profile.telefono}
                    </span>
                  )}
                  {profile?.institucion?.nombre && (
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
                      <Building2 size={13} color="var(--color-text-muted)" />
                      {profile.institucion.nombre}
                    </span>
                  )}
                </div>

                {profile?.fechaRegistro && (
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "12px 0 0" }}>
                    Miembro desde {new Date(profile.fechaRegistro).toLocaleDateString("es", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── DATOS PERSONALES ── */}
          <SectionCard
            icon={<Edit3 size={15} color="#0C6AC4" />}
            title="Datos personales"
            action={
              editing ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variant="outline-neutral" size="sm" onClick={() => setEditing(false)} disabled={savingProfile} leftIcon={<X size={13} />}>
                    Cancelar
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveProfile} loading={savingProfile} leftIcon={<Save size={13} />}>
                    Guardar
                  </Button>
                </div>
              ) : (
                <Button variant="outline-neutral" size="sm" onClick={startEdit} leftIcon={<Edit3 size={13} />}>
                  Editar
                </Button>
              )
            }
          >
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Grid2>
                  <Input label="Nombre *" value={editForm.nombre} onChange={setField("nombre")} placeholder="Tu nombre" required />
                  <Input label="Apellido" value={editForm.apellido} onChange={setField("apellido")} placeholder="Tu apellido" />
                </Grid2>
                <Grid2>
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={editForm.correo}
                    onChange={setField("correo")}
                    placeholder="correo@ejemplo.com"
                    leftIcon={<Mail size={14} />}
                  />
                  <Input
                    label="Teléfono"
                    value={editForm.telefono}
                    onChange={setField("telefono")}
                    type="tel"
                    placeholder="+57XXXXXXXXXX"
                    hint="Debe iniciar con +57 seguido de 10 dígitos"
                    leftIcon={<Phone size={14} />}
                  />
                </Grid2>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Grid2>
                  <ReadField label="Nombre" value={profile?.nombre} />
                  <ReadField label="Apellido" value={profile?.apellido} />
                </Grid2>
                <Grid2>
                  <ReadField label="Correo electrónico" value={profile?.correo ?? profile?.email} icon={<Mail size={14} />} />
                  <ReadField label="Teléfono" value={profile?.telefono} icon={<Phone size={14} />} />
                </Grid2>
              </div>
            )}
          </SectionCard>

          {/* ── INFORMACIÓN DE LA CUENTA (solo lectura) ── */}
          <SectionCard
            icon={<Info size={15} color="#6366F1" />}
            title="Información de la cuenta"
            iconBg="rgba(99,102,241,0.10)"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Grid2>
                <ReadField label="Cédula / Identificación" value={profile?.cedula} icon={<CreditCard size={14} />} />
                <ReadField label="Institución" value={profile?.institucion?.nombre ?? profile?.institucionId?.nombre} icon={<Building2 size={14} />} />
              </Grid2>
              <Grid2>
                <div className="field">
                  <span className="field-label">Rol</span>
                  <div style={{ padding: "8px 12px", background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                    {rolCfg
                      ? <InfoBadge label={rolCfg.label} color={rolCfg.color} bg={rolCfg.bg} />
                      : <span style={{ fontSize: 13.5, color: "var(--color-text)" }}>{profile?.rol ?? "—"}</span>
                    }
                  </div>
                </div>
                <ReadField label="Estado" value={profile?.estado === "activo" ? "Activo" : "Suspendido"} />
              </Grid2>
              <Grid2>
                <ReadField label="Miembro desde" value={fmtDate(profile?.fechaRegistro ?? profile?.createdAt)} icon={<Calendar size={14} />} />
                <ReadField label="Último acceso" value={fmtDate(profile?.ultimoAcceso)} icon={<Clock size={14} />} />
              </Grid2>
            </div>
          </SectionCard>

          {/* ── INFO POR ROL ── */}
          <RoleSection profile={profile} cursos={cursos} loadingCursos={loadingCursos} perfiles={perfiles} loadingPerf={loadingPerf} />

          {/* ── SEGURIDAD ── */}
          <SectionCard
            icon={<Shield size={15} color="#6366F1" />}
            title="Seguridad"
            iconBg="rgba(99,102,241,0.10)"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>Contraseña</p>
                <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: "3px 0 0" }}>
                  Cambia tu contraseña periódicamente para mantener tu cuenta segura.
                </p>
              </div>
              <Button variant="soft" onClick={openPassModal} leftIcon={<Key size={15} />}>
                Cambiar contraseña
              </Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══ AVATAR MODAL ══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => !uploadingPhoto && setShowAvatarModal(false)}
        title="Cambiar avatar"
        description="Elige un avatar del catálogo."
        size="lg"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Avatares locales */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, margin: "0 0 12px" }}>
              Avatares del sistema
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 12 }}>
              {LOCAL_AVATARS.map((src, i) => {
                const isSelected = profile?.fotoPerfilUrl === src;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectAvatar(src)}
                    disabled={uploadingPhoto}
                    title={`Avatar ${i + 1}`}
                    style={{
                      padding: 3,
                      border: isSelected ? "3px solid #0C6AC4" : "3px solid transparent",
                      borderRadius: "50%", cursor: uploadingPhoto ? "not-allowed" : "pointer",
                      background: "none", transition: "border-color 150ms, transform 150ms",
                    }}
                    onMouseEnter={e => !uploadingPhoto && (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <img src={src} alt={`Avatar ${i + 1}`} style={{ width: "100%", aspectRatio: 1, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatares de la API (Cloudinary) */}
          {(loadingPhotos || defaultPhotos.length > 0) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
                Avatares adicionales
              </p>
              {loadingPhotos ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 12 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ aspectRatio: 1, borderRadius: "50%", background: "var(--color-border)" }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 12 }}>
                  {defaultPhotos.map((foto, i) => {
                    const isSelected = profile?.fotoPerfilUrl === foto.url;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAvatar(foto.url)}
                        disabled={uploadingPhoto}
                        title={foto.nombre ?? `Avatar ${i + 1}`}
                        style={{
                          padding: 3,
                          border: isSelected ? "3px solid #0C6AC4" : "3px solid transparent",
                          borderRadius: "50%", cursor: uploadingPhoto ? "not-allowed" : "pointer",
                          background: "none", transition: "border-color 150ms, transform 150ms",
                        }}
                        onMouseEnter={e => !uploadingPhoto && (e.currentTarget.style.transform = "scale(1.1)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <img src={foto.url} alt={foto.nombre ?? `Avatar ${i + 1}`} style={{ width: "100%", aspectRatio: 1, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {uploadingPhoto && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", color: "var(--color-text-muted)", fontSize: 13.5 }}>
              <Loader2 size={16} style={{ animation: "edu-spin 0.6s linear infinite" }} />
              Aplicando avatar…
            </div>
          )}
        </div>
      </Modal>

      {/* ══ PASSWORD MODAL ════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showPassModal}
        onClose={() => !savingPass && setShowPassModal(false)}
        title="Cambiar contraseña"
        description="Ingresa tu contraseña actual para confirmar el cambio."
        size="sm"
      >
        <form onSubmit={handleChangePassword}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Contraseña actual *"
              type="password"
              value={passForm.actual}
              onChange={e => setPassForm(p => ({ ...p, actual: e.target.value }))}
              placeholder="Tu contraseña actual"
              required
            />
            <Input
              label="Nueva contraseña *"
              type="password"
              value={passForm.nueva}
              onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <Input
              label="Confirmar nueva contraseña *"
              type="password"
              value={passForm.confirmar}
              onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="Repite la nueva contraseña"
              required
            />
          </div>

          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(99,102,241,0.06)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.15)" }}>
            <p style={{ fontSize: 12, color: "#6366F1", margin: 0 }}>La nueva contraseña debe tener al menos 6 caracteres.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Button variant="outline-neutral" type="button" onClick={() => setShowPassModal(false)} disabled={savingPass}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={savingPass} leftIcon={<Shield size={15} />}>
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
