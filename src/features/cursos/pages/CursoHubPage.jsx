// src/features/cursos/pages/CursoHubPage.jsx
// Central LMS hub for a single course — 6-tab dashboard

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  Users,
  ClipboardList,
  MessageCircle,
  FileText,
  Layers,
  Edit2,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Clock,
  Star,
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  BarChart2,
  Calendar,
  GraduationCap,
  Send,
  RefreshCw,
  Paperclip,
  ExternalLink,
} from "lucide-react";

import letrasImg from "@/assets/img/letras.png";

import {
  cursosGetById,
  cursosUpdate,
  modulosGetByCurso,
  modulosCreate,
  modulosUpdate,
  modulosDelete,
  tareasGetAll,
  forosGetByCurso,
  forosCreate,
  forosCambiarEstado,
  forosDelete,
  cursosGetParticipantes,
  cursosAddParticipante,
  cursosRemoveParticipante,
  entregasGetByTarea,
  entregasCalificar,
} from "@/lib/apiClient";

import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  normalizeCurso,
  normalizeTarea,
  normalizeUser,
  normalizeEntrega,
} from "@/lib/normalizers";

import { UserAvatar, Modal, Toast } from "@/components";

import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";
import { normalizePhone } from "@/utils/normalizePhone";
import getRoleStyle from "@/utils/getRoleStyle";
// ── Constants ────────────────────────────────────────────────────
const DEFAULT_IMAGE = letrasImg;

const CARD_COLORS = [
  "#0C6AC4","#6366F1","#16A34A","#D97706","#DC2626","#8B5CF6","#0284C7","#EA580C",
];
const cc = (i) => CARD_COLORS[i % CARD_COLORS.length];

const TABS = [
  { key: "general",       label: "General",       Icon: BookOpen },
  { key: "modulos",       label: "Módulos",        Icon: Layers },
  { key: "tareas",        label: "Tareas",         Icon: ClipboardList },
  { key: "foros",         label: "Foros",          Icon: MessageCircle },
  { key: "participantes", label: "Participantes",  Icon: Users },
  { key: "entregas",      label: "Entregas",       Icon: FileText,
    roles: ["docente", "administrador", "superadmin"] },
];

// ── Micro-components ─────────────────────────────────────────────
function Sk({ h = 16, w = "100%", r = 8, mb = 0 }) {
  return (
    <div className="animate-pulse" style={{
      height: h, width: w, borderRadius: r,
      background: "var(--color-border)", flexShrink: 0, marginBottom: mb,
    }} />
  );
}

function StatusBadge({ estado }) {
  const active = estado === "activo";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: active ? "rgba(22,163,74,0.18)" : "rgba(100,116,139,0.15)",
      color: active ? "#16A34A" : "#64748B",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#94A3B8" }} />
      {active ? "Activo" : "Archivado"}
    </span>
  );
}

function RoleBadge({ rol }) {
  const { color, bg, label } = getRoleStyle(rol);
  return (
    <span style={{
      display: "inline-flex", padding: "2px 8px", borderRadius: 99,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em",
      background: bg, color,
    }}>
      {label}
    </span>
  );
}

function TareaStatusBadge({ estado }) {
  const MAP = {
    activa:  { bg: "rgba(12,106,196,0.1)",  color: "#0C6AC4",  label: "Activa" },
    cerrada: { bg: "rgba(100,116,139,0.1)", color: "#64748B",  label: "Cerrada" },
    vencida: { bg: "rgba(220,38,38,0.1)",   color: "#DC2626",  label: "Vencida" },
  };
  const s = MAP[estado] ?? MAP.activa;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function EntregaStatusBadge({ estado }) {
  const MAP = {
    borrador:    { bg: "rgba(100,116,139,0.1)", color: "#64748B",  label: "Borrador" },
    enviada:     { bg: "rgba(99,102,241,0.1)",  color: "#6366F1",  label: "Enviada" },
    calificada:  { bg: "rgba(22,163,74,0.1)",   color: "#16A34A",  label: "Calificada" },
    tarde:       { bg: "rgba(220,38,38,0.1)",   color: "#DC2626",  label: "Tarde" },
  };
  const s = MAP[estado] ?? MAP.borrador;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function SectionEmpty({ icon: Icon, text, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 10, padding: "52px 24px", textAlign: "center",
      background: "var(--color-surface)", borderRadius: 16,
      border: "1px solid var(--color-border)",
    }}>
      <Icon style={{ width: 32, height: 32, color: "var(--color-text-muted)", opacity: 0.5 }} />
      <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0 }}>{text}</p>
      {action && (
        <button onClick={action.onClick} style={{
          marginTop: 4, padding: "8px 18px", borderRadius: 10, border: "none",
          background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 600,
          cursor: "pointer",
        }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

function TabLoading() {
  return (
    <div style={{ padding: "32px 0" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ marginBottom: 14 }}>
          <Sk h={18} w="60%" r={6} mb={8} />
          <Sk h={13} w="40%" r={5} />
        </div>
      ))}
    </div>
  );
}

// ── StyledInput ──────────────────────────────────────────────────
function FInput({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--color-text)", marginBottom: 5 }}>{label}</label>}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%", padding: "9px 12px", fontSize: 13.5,
          borderRadius: 10, outline: "none",
          border: `1.5px solid ${focused ? "#0C6AC4" : "var(--color-border)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(12,106,196,0.12)" : "none",
          background: "var(--color-surface)", color: "var(--color-text)",
          transition: "border-color 150ms, box-shadow 150ms",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
    </div>
  );
}

function FTextarea({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--color-text)", marginBottom: 5 }}>{label}</label>}
      <textarea
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%", padding: "9px 12px", fontSize: 13.5,
          borderRadius: 10, outline: "none", resize: "vertical", minHeight: 80,
          border: `1.5px solid ${focused ? "#0C6AC4" : "var(--color-border)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(12,106,196,0.12)" : "none",
          background: "var(--color-surface)", color: "var(--color-text)",
          transition: "border-color 150ms, box-shadow 150ms",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT (thin orchestrator)
// ════════════════════════════════════════════════════════════════

// Replace heavy page with orchestrator-only implementation below. Full logic lives in hooks and components (pages/*.refactor -> will be moved).

export default function CursoHubPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const setUsers  = useUserStore(s => s.setUsers);

  const canManage = ["docente", "administrador", "superadmin"].includes(user?.rol);
  const isAdmin   = ["administrador", "superadmin"].includes(user?.rol);

  const visibleTabs = TABS.filter(t => !t.roles || t.roles.includes(user?.rol));

  // ── Toast ──────────────────────────────────────────────────────
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  }, []);

  // ── Core state ─────────────────────────────────────────────────
  const [curso,   setCurso]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("general");

  // ── Tab data ───────────────────────────────────────────────────
  const [modulos,      setModulos]      = useState([]);
  const [tareas,       setTareas]       = useState([]);
  const [foros,        setForos]        = useState([]);
  const [participantes,setParticipantes]= useState([]);
  const [entregas,     setEntregas]     = useState([]);
  const [entregasStats,setEntregasStats]= useState({});

  // Loading per tab
  const [tabLoading,  setTabLoading]   = useState(false);

  // Lazy load tracking
  const loaded = useRef(new Set());

  // ── Expanded modules set ───────────────────────────────────────
  const [expandedMods, setExpandedMods] = useState(new Set());
  const toggleMod = (modId) => setExpandedMods(prev => {
    const next = new Set(prev);
    next.has(modId) ? next.delete(modId) : next.add(modId);
    return next;
  });

  // ── Selected tarea for entregas tab ───────────────────────────
  const [selectedTarea, setSelectedTarea] = useState(null);
  const [entregasLoading, setEntregasLoading] = useState(false);

  // ── Modal states ───────────────────────────────────────────────
  // Edit curso
  const [showEditCurso, setShowEditCurso] = useState(false);
  const [cursoForm, setCursoForm] = useState({ nombre: "", descripcion: "" });
  const [coverFile, setCoverFile] = useState(null);
  const [savingCurso, setSavingCurso] = useState(false);

  // Módulo
  const [showModModal, setShowModModal] = useState(false);
  const [editingMod, setEditingMod] = useState(null);
  const [modForm, setModForm] = useState({ titulo: "", descripcion: "" });
  const [savingMod, setSavingMod] = useState(false);

  // Foro
  const [showForoModal, setShowForoModal] = useState(false);
  const [foroForm, setForoForm] = useState({ titulo: "", descripcion: "", publico: true });
  const [savingForo, setSavingForo] = useState(false);

  // Participante
  const [showParticModal, setShowParticModal] = useState(false);
  const [particForm, setParticForm] = useState({ nombre: "", apellido: "", cedula: "", telefono: "" });
  const [savingPartic, setSavingPartic] = useState(false);

  // Calificar entrega
  const [calificando, setCalificando] = useState(null);
  const [gradeForm, setGradeForm] = useState({ nota: "", comentario: "" });
  const [savingGrade, setSavingGrade] = useState(false);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await cursosGetById(id);
        const c = normalizeCurso(data.curso ?? data);
        setCurso(c);
        setCursoForm({ nombre: c.nombre ?? "", descripcion: c.descripcion ?? "" });
        if (c.docente) useUserStore.getState().setUser(c.docente);
      } catch (err) {
        notify(humanizeError(err, "No se pudo cargar el curso"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Tab lazy loader ────────────────────────────────────────────
  const loadTabData = useCallback(async (tabKey) => {
    const dataKey = (tabKey === "tareas") ? "modulos" : tabKey;
    if (loaded.current.has(dataKey)) return;
    loaded.current.add(dataKey);
    setTabLoading(true);
    try {
      if (dataKey === "modulos") {
        const [modsData, tareasData] = await Promise.all([
          modulosGetByCurso(id),
          tareasGetAll({ cursoId: id, limit: 100 }),
        ]);
        setModulos(modsData.modulos ?? modsData ?? []);
        setTareas((tareasData.tareas ?? []).map(normalizeTarea));
      } else if (dataKey === "foros") {
        const data = await forosGetByCurso(id);
        setForos(data.foros ?? data ?? []);
      } else if (dataKey === "participantes") {
        const data = await cursosGetParticipantes(id, { limit: 100 });
        const norm = (data.participantes ?? data.users ?? []).map(p => ({
          ...p,
          usuario: normalizeUser(p.usuario ?? p),
        }));
        setParticipantes(norm);
        setUsers(norm.map(p => p.usuario));
      }
    } catch (err) {
      notify(humanizeError(err, "Error al cargar datos"), "error");
      loaded.current.delete(dataKey);
    } finally {
      setTabLoading(false);
    }
  }, [id, setUsers, notify]);

  useEffect(() => {
    if (!curso) return;
    loadTabData(tab);
  }, [tab, curso, loadTabData]);

  // ── Load entregas for a specific tarea ────────────────────────
  const loadEntregas = useCallback(async (tarea) => {
    setSelectedTarea(tarea);
    setEntregasLoading(true);
    setEntregas([]);
    try {
      const data = await entregasGetByTarea(tarea._id);
      setEntregas((data.entregas ?? []).map(normalizeEntrega));
      setEntregasStats(data.estadisticas ?? {});
    } catch (err) {
      notify(humanizeError(err, "Error al cargar entregas"), "error");
    } finally {
      setEntregasLoading(false);
    }
  }, [notify]);

  // ── Reload helpers ─────────────────────────────────────────────
  const reloadModulos = useCallback(() => {
    loaded.current.delete("modulos");
    loadTabData("modulos");
  }, [loadTabData]);

  const reloadForos = useCallback(() => {
    loaded.current.delete("foros");
    loadTabData("foros");
  }, [loadTabData]);

  const reloadParticipantes = useCallback(() => {
    loaded.current.delete("participantes");
    loadTabData("participantes");
  }, [loadTabData]);

  // ── CRUD: Curso ────────────────────────────────────────────────
  const handleSaveCurso = async (e) => {
    e.preventDefault();
    setSavingCurso(true);
    try {
      const fd = new FormData();
      fd.append("nombre", cursoForm.nombre.trim());
      fd.append("descripcion", cursoForm.descripcion.trim());
      if (coverFile) fd.append("fotoPortada", coverFile);
      const data = await cursosUpdate(id, fd);
      const c = normalizeCurso(data.curso ?? data);
      setCurso(c);
      setCoverFile(null);
      setShowEditCurso(false);
      notify("Curso actualizado");
    } catch (err) {
      notify(humanizeError(err, "Error al actualizar curso"), "error");
    } finally {
      setSavingCurso(false);
    }
  };

  // ── CRUD: Módulos ──────────────────────────────────────────────
  const openCreateMod = () => {
    setEditingMod(null);
    setModForm({ titulo: "", descripcion: "" });
    setShowModModal(true);
  };

  const openEditMod = (mod) => {
    setEditingMod(mod);
    setModForm({ titulo: mod.titulo ?? "", descripcion: mod.descripcion ?? "" });
    setShowModModal(true);
  };

  const handleSaveMod = async (e) => {
    e.preventDefault();
    if (!modForm.titulo.trim()) return;
    setSavingMod(true);
    try {
      if (editingMod) {
        await modulosUpdate(editingMod._id, { titulo: modForm.titulo.trim(), descripcion: modForm.descripcion.trim() });
        notify("Módulo actualizado");
      } else {
        await modulosCreate({ cursoId: id, titulo: modForm.titulo.trim(), descripcion: modForm.descripcion.trim() });
        notify("Módulo creado");
      }
      setShowModModal(false);
      reloadModulos();
    } catch (err) {
      notify(humanizeError(err, "Error al guardar módulo"), "error");
    } finally {
      setSavingMod(false);
    }
  };

  const handleDeleteMod = async (mod) => {
    if (!window.confirm(`¿Eliminar el módulo "${mod.titulo}"?`)) return;
    try {
      await modulosDelete(mod._id);
      notify("Módulo eliminado");
      reloadModulos();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar módulo"), "error");
    }
  };

  // ── CRUD: Foros ────────────────────────────────────────────────
  const handleCreateForo = async (e) => {
    e.preventDefault();
    if (!foroForm.titulo.trim()) return;
    setSavingForo(true);
    try {
      const fd = new FormData();
      fd.append("titulo", foroForm.titulo.trim());
      fd.append("descripcion", foroForm.descripcion.trim());
      fd.append("cursoId", id);
      fd.append("publico", foroForm.publico ? "true" : "false");
      await forosCreate(fd);
      notify("Foro creado");
      setShowForoModal(false);
      setForoForm({ titulo: "", descripcion: "", publico: true });
      reloadForos();
    } catch (err) {
      notify(humanizeError(err, "Error al crear foro"), "error");
    } finally {
      setSavingForo(false);
    }
  };

  const handleToggleForoEstado = async (foro) => {
    const nuevoEstado = foro.estado === "abierto" ? "cerrado" : "abierto";
    try {
      await forosCambiarEstado(foro._id, { estado: nuevoEstado });
      notify(`Foro ${nuevoEstado}`);
      reloadForos();
    } catch (err) {
      notify(humanizeError(err, "Error al cambiar estado del foro"), "error");
    }
  };

  const handleDeleteForo = async (foro) => {
    if (!window.confirm(`¿Eliminar el foro "${foro.titulo}"?`)) return;
    try {
      await forosDelete(foro._id);
      notify("Foro eliminado");
      reloadForos();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar foro"), "error");
    }
  };

  // ── CRUD: Participantes ────────────────────────────────────────
  const handleAddPartic = async (e) => {
    e.preventDefault();
    if (!particForm.nombre.trim() || !particForm.cedula.trim()) return;
    setSavingPartic(true);
    try {
      await cursosAddParticipante(id, {
        ...particForm,
        telefono: normalizePhone(particForm.telefono) || particForm.telefono,
      });
      notify("Participante agregado");
      setShowParticModal(false);
      setParticForm({ nombre: "", apellido: "", cedula: "", telefono: "" });
      reloadParticipantes();
    } catch (err) {
      notify(humanizeError(err, "Error al agregar participante"), "error");
    } finally {
      setSavingPartic(false);
    }
  };

  const handleRemovePartic = async (usuarioId, nombre) => {
    if (!window.confirm(`¿Remover a ${nombre} del curso?`)) return;
    try {
      await cursosRemoveParticipante(id, usuarioId);
      notify("Participante removido");
      reloadParticipantes();
    } catch (err) {
      notify(humanizeError(err, "Error al remover participante"), "error");
    }
  };

  // ── CRUD: Calificar entrega ────────────────────────────────────
  const handleCalificar = async (e) => {
    e.preventDefault();
    if (!calificando) return;
    const nota = parseFloat(gradeForm.nota);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      notify("La nota debe ser un número entre 0 y 10", "error");
      return;
    }
    setSavingGrade(true);
    try {
      await entregasCalificar(calificando._id, {
        nota,
        comentario: gradeForm.comentario.trim(),
        docenteId: user?._id,
      });
      notify("Entrega calificada");
      setCalificando(null);
      if (selectedTarea) loadEntregas(selectedTarea);
    } catch (err) {
      notify(humanizeError(err, "Error al calificar"), "error");
    } finally {
      setSavingGrade(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ height: 240, borderRadius: 18, background: "var(--color-border)", marginBottom: 0 }} className="animate-pulse" />
        <div style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "0 24px", display: "flex", gap: 4, height: 52 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ width: 90, height: 28, borderRadius: 8, background: "var(--color-border)", margin: "auto 0" }} className="animate-pulse" />)}
        </div>
        <div style={{ padding: "28px 0" }}>
          <Sk h={22} w="40%" r={8} mb={14} />
          <Sk h={14} w="70%" r={6} mb={10} />
          <Sk h={14} w="55%" r={6} />
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 0", textAlign: "center" }}>
        <AlertCircle style={{ width: 40, height: 40, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--color-text-muted)", fontSize: 15 }}>Curso no encontrado</p>
        <button onClick={() => navigate("/cursos")} style={{ marginTop: 16, padding: "9px 20px", borderRadius: 10, background: "#0C6AC4", color: "white", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Volver a Cursos
        </button>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────
  const coverSrc   = curso.imagen || curso.fotoPortada || DEFAULT_IMAGE;
  const docente    = curso.docente;
  const totalParts = curso.totalParticipantes ?? curso.participantes?.length ?? 0;

  // Tasks grouped by module
  const tareasPorMod = {};
  tareas.forEach(t => {
    const mid = t.moduloId ?? t.modulo?._id ?? t.modulo ?? "none";
    if (!tareasPorMod[mid]) tareasPorMod[mid] = [];
    tareasPorMod[mid].push(t);
  });

  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── COURSE HEADER ─────────────────────────────────────── */}
      <div style={{
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        marginBottom: 0,
        boxShadow: "var(--shadow-md)",
      }}>
        {/* Cover image */}
        <div style={{ height: 240, position: "relative", overflow: "hidden" }}>
          <img
            src={coverSrc}
            alt={curso.nombre}
            onError={e => {
              e.target.onerror = null;
              e.target.src = DEFAULT_IMAGE;
              e.target.style.objectFit = "contain";
              e.target.style.opacity = "0.4";
              e.target.style.padding = "32px";
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(15,23,42,0.25) 0%, rgba(15,23,42,0.82) 100%)",
          }} />

          {/* Top controls */}
          <div style={{
            position: "absolute", top: 16, left: 16, right: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)", color: "white",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} /> Volver
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusBadge estado={curso.estado} />
              {canManage && (
                <button
                  onClick={() => setShowEditCurso(true)}
                  title="Editar curso"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.25)", color: "white",
                    fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <Edit2 style={{ width: 13, height: 13 }} /> Editar
                </button>
              )}
            </div>
          </div>

          {/* Course info overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "20px 24px",
          }}>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: "white",
              margin: "0 0 10px", letterSpacing: "-0.02em",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              lineHeight: 1.25,
            }}>
              {curso.nombre}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Docente */}
              {docente && (
                <div
                  onClick={() => navigate("/perfil")}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer", opacity: 0.9,
                  }}
                >
                  <UserAvatar user={docente} size={32} showStatus />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0 }}>
                      {docente.nombre} {docente.apellido}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0 }}>Docente</p>
                  </div>
                </div>
              )}

              {/* Divider */}
              {docente && <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.25)" }} />}

              {/* Participants count */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.85)" }}>
                <Users style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{totalParts} participantes</span>
              </div>

              {/* Modules count (when loaded) */}
              {modulos.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.85)" }}>
                  <Layers style={{ width: 15, height: 15 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{modulos.length} módulos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 18,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center",
        overflowX: "auto", scrollbarWidth: "none",
        gap: 2, padding: "0 16px",
      }}>
        {visibleTabs.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "14px 14px", borderRadius: 0, border: "none",
                background: "none", cursor: "pointer",
                fontSize: 13.5, fontWeight: active ? 700 : 500,
                color: active ? "#0C6AC4" : "var(--color-text-muted)",
                borderBottom: active ? "2.5px solid #0C6AC4" : "2.5px solid transparent",
                whiteSpace: "nowrap", transition: "color 150ms",
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────── */}
      <div style={{ padding: "28px 0" }}>

        {/* ═══════════════════════════════════════════════════════
            TAB: GENERAL
            ═══════════════════════════════════════════════════════ */}
        {tab === "general" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 20 }}
            className="lg-grid-split">

            {/* Left: Description + info */}
            <div>
              {/* Description */}
              <div style={{
                background: "var(--color-surface)", borderRadius: 16,
                border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                padding: "22px 24px", marginBottom: 16,
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 12px" }}>
                  Sobre el curso
                </h2>
                {curso.descripcion ? (
                  <p style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.65, margin: 0 }}>
                    {curso.descripcion}
                  </p>
                ) : (
                  <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0, fontStyle: "italic" }}>
                    Sin descripción
                  </p>
                )}
              </div>

              {/* Stats bar */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
              }}>
                {[
                  { icon: Users,        label: "Participantes", value: totalParts,       color: "#0C6AC4", bg: "rgba(12,106,196,0.10)" },
                  { icon: Layers,       label: "Módulos",       value: modulos.length,   color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
                  { icon: ClipboardList,label: "Tareas",        value: tareas.length,    color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
                  { icon: MessageCircle,label: "Foros",         value: foros.length,     color: "#D97706", bg: "rgba(217,119,6,0.10)" },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} style={{
                    background: "var(--color-surface)", borderRadius: 14,
                    border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                    padding: "16px 18px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 17, height: 17, color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", lineHeight: 1, margin: 0 }}>{value}</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Teacher card */}
            <div>
              {docente ? (
                <div style={{
                  background: "var(--color-surface)", borderRadius: 16,
                  border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                  padding: "24px", display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 12, textAlign: "center",
                }}>
                  <UserAvatar
                    user={docente}
                    size={64}
                    showStatus
                    onClick={() => navigate("/perfil")}
                  />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
                      {docente.nombre} {docente.apellido}
                    </p>
                    <RoleBadge rol={docente.rol} />
                  </div>
                  {docente.correo && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--color-text-muted)" }}>
                      <span>{docente.correo}</span>
                    </div>
                  )}
                  <div style={{ width: "100%", paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", margin: 0 }}>
                      Docente del curso
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "var(--color-surface)", borderRadius: 16,
                  border: "1px solid var(--color-border)", padding: "32px 24px",
                  textAlign: "center",
                }}>
                  <GraduationCap style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 8px", opacity: 0.5 }} />
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Sin docente asignado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: MÓDULOS
            ═══════════════════════════════════════════════════════ */}
        {tab === "modulos" && (
          <div>
            {canManage && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  onClick={openCreateMod}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 10, border: "none",
                    background: "#0C6AC4", color: "white",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: 15, height: 15 }} /> Nuevo módulo
                </button>
              </div>
            )}

            {tabLoading ? (
              <TabLoading />
            ) : modulos.length === 0 ? (
              <SectionEmpty
                icon={Layers}
                text="No hay módulos en este curso aún"
                action={canManage ? { label: "Crear primer módulo", onClick: openCreateMod } : undefined}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {modulos.map((mod, idx) => {
                  const modTareas = tareasPorMod[mod._id] ?? [];
                  const expanded  = expandedMods.has(mod._id);
                  const border    = cc(idx);
                  return (
                    <div key={mod._id} style={{
                      background: "var(--color-surface)", borderRadius: 14,
                      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                      overflow: "hidden",
                    }}>
                      {/* Module header */}
                      <div
                        onClick={() => toggleMod(mod._id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "15px 18px", cursor: "pointer",
                          borderLeft: `4px solid ${border}`,
                          transition: "background 150ms",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `${border}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Layers style={{ width: 15, height: 15, color: border }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                            {mod.titulo}
                          </p>
                          {mod.descripcion && (
                            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {mod.descripcion}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", whiteSpace: "nowrap", marginRight: 8 }}>
                          {modTareas.length} tarea{modTareas.length !== 1 ? "s" : ""}
                        </span>
                        {canManage && (
                          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openEditMod(mod)}
                              title="Editar módulo"
                              style={{ padding: 6, borderRadius: 7, border: "none", background: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#0C6AC4")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                            >
                              <Edit2 style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => handleDeleteMod(mod)}
                              title="Eliminar módulo"
                              style={{ padding: 6, borderRadius: 7, border: "none", background: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        )}
                        {expanded
                          ? <ChevronDown style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
                          : <ChevronRight style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
                        }
                      </div>

                      {/* Expanded: tasks inside module */}
                      {expanded && (
                        <div style={{ borderTop: "1px solid var(--color-border)" }}>
                          {modTareas.length === 0 ? (
                            <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                              No hay tareas en este módulo
                            </div>
                          ) : (
                            modTareas.map(t => (
                              <div key={t._id} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "11px 20px",
                                borderBottom: "1px solid var(--color-border)",
                              }}>
                                <ClipboardList style={{ width: 14, height: 14, flexShrink: 0, color: border, opacity: 0.7 }} />
                                <p style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {t.titulo}
                                </p>
                                {t.fechaEntrega && (
                                  <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                                    <Clock style={{ width: 11, height: 11 }} />
                                    {fmtDateShort(t.fechaEntrega)}
                                  </span>
                                )}
                                <TareaStatusBadge estado={t.estado} />
                              </div>
                            ))
                          )}
                          <div style={{ padding: "10px 20px" }}>
                            <button
                              onClick={() => setTab("tareas")}
                              style={{ fontSize: 12.5, color: "#0C6AC4", background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                            >
                              Ver todas las tareas <ChevronRight style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: TAREAS
            ═══════════════════════════════════════════════════════ */}
        {tab === "tareas" && (
          <div>
            {canManage && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  onClick={() => navigate("/tareas")}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 10, border: "none",
                    background: "#0C6AC4", color: "white",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: 15, height: 15 }} /> Nueva tarea
                </button>
              </div>
            )}

            {tabLoading ? (
              <TabLoading />
            ) : tareas.length === 0 ? (
              <SectionEmpty
                icon={ClipboardList}
                text="No hay tareas en este curso"
                action={canManage ? { label: "Crear primera tarea", onClick: () => navigate("/tareas") } : undefined}
              />
            ) : (
              <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                {/* Group by module */}
                {(() => {
                  const groups = [];
                  modulos.forEach(mod => {
                    const mt = tareasPorMod[mod._id] ?? [];
                    if (mt.length > 0) groups.push({ key: mod._id, label: mod.titulo, items: mt });
                  });
                  const sinMod = tareasPorMod["none"] ?? [];
                  if (sinMod.length > 0) groups.push({ key: "none", label: "Sin módulo", items: sinMod });
                  if (groups.length === 0) groups.push({ key: "all", label: "Tareas", items: tareas });

                  return groups.map(({ key, label, items }) => (
                    <div key={key}>
                      <div style={{ padding: "10px 18px 6px", borderBottom: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: 0 }}>
                          {label}
                        </p>
                      </div>
                      {items.map(t => (
                        <div
                          key={t._id}
                          style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "12px 18px",
                            borderBottom: "1px solid var(--color-border)",
                            transition: "background 150ms",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <ClipboardList style={{ width: 16, height: 16, flexShrink: 0, color: "#0C6AC4", opacity: 0.7 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.titulo}
                            </p>
                            {t.descripcion && (
                              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {t.descripcion}
                              </p>
                            )}
                          </div>
                          {t.fechaEntrega && (
                            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", flexShrink: 0 }}>
                              <Clock style={{ width: 11, height: 11 }} />
                              Vence {fmtDateShort(t.fechaEntrega)}
                            </span>
                          )}
                          <TareaStatusBadge estado={t.estado} />
                          {canManage && (
                            <button
                              onClick={() => { setTab("entregas"); loadEntregas(t); }}
                              title="Ver entregas"
                              style={{
                                fontSize: 12, fontWeight: 600, color: "#0C6AC4",
                                background: "rgba(12,106,196,0.08)", border: "none",
                                padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                              }}
                            >
                              <FileText style={{ width: 12, height: 12 }} /> Entregas
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: FOROS
            ═══════════════════════════════════════════════════════ */}
        {tab === "foros" && (
          <div>
            {canManage && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  onClick={() => setShowForoModal(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 10, border: "none",
                    background: "#0C6AC4", color: "white",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: 15, height: 15 }} /> Nuevo foro
                </button>
              </div>
            )}

            {tabLoading ? (
              <TabLoading />
            ) : foros.length === 0 ? (
              <SectionEmpty
                icon={MessageCircle}
                text="No hay foros en este curso"
                action={canManage ? { label: "Crear primer foro", onClick: () => setShowForoModal(true) } : undefined}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
                {foros.map((foro, idx) => (
                  <div
                    key={foro._id}
                    style={{
                      background: "var(--color-surface)", borderRadius: 14,
                      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                      overflow: "hidden", display: "flex", flexDirection: "column",
                    }}
                  >
                    <div style={{ height: 4, background: cc(idx) }} />
                    <div style={{ padding: "16px 18px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0, lineHeight: 1.35 }}>
                          {foro.titulo}
                        </h3>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                          fontSize: 10.5, fontWeight: 700,
                          background: foro.estado === "abierto" ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.12)",
                          color: foro.estado === "abierto" ? "#16A34A" : "#64748B",
                        }}>
                          {foro.estado === "abierto"
                            ? <><Unlock style={{ width: 10, height: 10 }} /> Abierto</>
                            : <><Lock style={{ width: 10, height: 10 }} /> Cerrado</>
                          }
                        </span>
                      </div>
                      {foro.descripcion && (
                        <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {foro.descripcion}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                        {foro.publico !== false && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--color-text-muted)" }}>
                            <Globe style={{ width: 11, height: 11 }} /> Público
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => navigate(`/foros/${foro._id}`)}
                        style={{
                          flex: 1, padding: "7px 12px", borderRadius: 8,
                          background: "rgba(12,106,196,0.08)", border: "none",
                          color: "#0C6AC4", fontSize: 12.5, fontWeight: 600,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        <ExternalLink style={{ width: 12, height: 12 }} /> Abrir foro
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleToggleForoEstado(foro)}
                            title={foro.estado === "abierto" ? "Cerrar foro" : "Abrir foro"}
                            style={{ padding: "7px 9px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}
                            onMouseEnter={e => (e.currentTarget.style.color = foro.estado === "abierto" ? "#D97706" : "#16A34A")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                          >
                            {foro.estado === "abierto"
                              ? <Lock style={{ width: 13, height: 13 }} />
                              : <Unlock style={{ width: 13, height: 13 }} />
                            }
                          </button>
                          <button
                            onClick={() => handleDeleteForo(foro)}
                            title="Eliminar foro"
                            style={{ padding: "7px 9px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: PARTICIPANTES
            ═══════════════════════════════════════════════════════ */}
        {tab === "participantes" && (
          <div>
            {(canManage || isAdmin) && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  onClick={() => setShowParticModal(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 10, border: "none",
                    background: "#0C6AC4", color: "white",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <UserPlus style={{ width: 15, height: 15 }} /> Agregar participante
                </button>
              </div>
            )}

            {tabLoading ? (
              <TabLoading />
            ) : participantes.length === 0 ? (
              <SectionEmpty
                icon={Users}
                text="No hay participantes registrados"
                action={(canManage || isAdmin) ? { label: "Agregar participante", onClick: () => setShowParticModal(true) } : undefined}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 12 }}>
                {participantes.map(({ usuario, etiqueta }) => (
                  <div
                    key={usuario._id}
                    style={{
                      background: "var(--color-surface)", borderRadius: 14,
                      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                      padding: "16px 18px", display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    <UserAvatar
                      user={usuario}
                      size={44}
                      showStatus
                      onClick={() => navigate("/perfil")}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <RoleBadge rol={etiqueta ?? usuario.rol} />
                      </div>
                    </div>
                    {(canManage || isAdmin) && (
                      <button
                        onClick={() => handleRemovePartic(usuario._id, `${usuario.nombre} ${usuario.apellido}`)}
                        title="Remover del curso"
                        style={{ padding: 6, borderRadius: 7, border: "none", background: "none", color: "var(--color-text-muted)", cursor: "pointer", flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: ENTREGAS (docente/admin only)
            ═══════════════════════════════════════════════════════ */}
        {tab === "entregas" && canManage && (
          <div>
            {/* Tarea selector */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 8 }}>Seleccionar tarea para revisar entregas:</p>
              {tabLoading ? (
                <Sk h={40} w={320} r={10} />
              ) : tareas.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>Sin tareas disponibles</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {tareas.map(t => (
                    <button
                      key={t._id}
                      onClick={() => loadEntregas(t)}
                      style={{
                        padding: "7px 14px", borderRadius: 10,
                        border: `1.5px solid ${selectedTarea?._id === t._id ? "#0C6AC4" : "var(--color-border)"}`,
                        background: selectedTarea?._id === t._id ? "rgba(12,106,196,0.08)" : "var(--color-surface)",
                        color: selectedTarea?._id === t._id ? "#0C6AC4" : "var(--color-text)",
                        fontSize: 13, fontWeight: selectedTarea?._id === t._id ? 700 : 500,
                        cursor: "pointer", transition: "all 150ms",
                      }}
                    >
                      {t.titulo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Entregas stats */}
            {selectedTarea && Object.keys(entregasStats).length > 0 && (
              <div style={{
                display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18,
              }}>
                {[
                  { label: "Total", value: entregasStats.total ?? entregas.length, color: "#0C6AC4", bg: "rgba(12,106,196,0.08)" },
                  { label: "Enviadas", value: entregasStats.entregadas ?? 0, color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
                  { label: "Calificadas", value: entregasStats.calificadas ?? 0, color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
                  { label: "Pendientes", value: entregasStats.pendientes ?? 0, color: "#D97706", bg: "rgba(217,119,6,0.08)" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ padding: "10px 16px", borderRadius: 10, background: bg, display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
                    <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Entregas list */}
            {selectedTarea && (
              entregasLoading ? (
                <TabLoading />
              ) : entregas.length === 0 ? (
                <SectionEmpty icon={FileText} text="Sin entregas para esta tarea aún" />
              ) : (
                <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                  {entregas.map(entrega => {
                    const submitter = entrega.padre ?? entrega.estudiante;
                    return (
                      <div
                        key={entrega._id}
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "13px 18px",
                          borderBottom: "1px solid var(--color-border)",
                          transition: "background 150ms",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <UserAvatar user={submitter} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {submitter?.nombre} {submitter?.apellido}
                          </p>
                          <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock style={{ width: 10, height: 10 }} />
                            {fmtDate(entrega.fechaEnvio ?? entrega.fecha)}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {entrega.archivos?.length > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, color: "var(--color-text-muted)" }}>
                              <Paperclip style={{ width: 11, height: 11 }} />
                              {entrega.archivos.length}
                            </span>
                          )}
                          <EntregaStatusBadge estado={entrega.estado} />
                          {entrega.calificacion != null && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700, color: "#16A34A" }}>
                              <Star style={{ width: 12, height: 12 }} />
                              {entrega.calificacion}
                            </span>
                          )}
                          {(entrega.estado === "enviada" || entrega.estado === "tarde") && (
                            <button
                              onClick={() => {
                                setCalificando(entrega);
                                setGradeForm({ nota: entrega.calificacion ?? "", comentario: "" });
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: 8, border: "none",
                                background: "#0C6AC4", color: "white",
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 4,
                              }}
                            >
                              <Star style={{ width: 12, height: 12 }} /> Calificar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {!selectedTarea && !tabLoading && tareas.length > 0 && (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--color-text-muted)" }}>
                <BarChart2 style={{ width: 36, height: 36, margin: "0 auto 10px", opacity: 0.4 }} />
                <p style={{ fontSize: 14, margin: 0 }}>Selecciona una tarea para ver sus entregas</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════════════════ */}

      {/* Edit curso */}
      <Modal
        isOpen={showEditCurso}
        onClose={() => { setShowEditCurso(false); setCoverFile(null); }}
        title="Editar curso"
        size="sm"
      >
        <form onSubmit={handleSaveCurso}>
          <FInput
            label="Nombre del curso"
            value={cursoForm.nombre}
            onChange={e => setCursoForm(p => ({ ...p, nombre: e.target.value }))}
            required
          />
          <FTextarea
            label="Descripción"
            value={cursoForm.descripcion}
            onChange={e => setCursoForm(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Describe el contenido del curso..."
          />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--color-text)", marginBottom: 5 }}>
              Imagen de portada
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13, color: "var(--color-text)" }}
            />
            {coverFile && <p style={{ fontSize: 11.5, color: "#16A34A", marginTop: 4 }}>✓ {coverFile.name}</p>}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowEditCurso(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={savingCurso} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 600, cursor: savingCurso ? "not-allowed" : "pointer", opacity: savingCurso ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {savingCurso && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Módulo create/edit */}
      <Modal
        isOpen={showModModal}
        onClose={() => setShowModModal(false)}
        title={editingMod ? "Editar módulo" : "Nuevo módulo"}
        size="sm"
      >
        <form onSubmit={handleSaveMod}>
          <FInput
            label="Título del módulo *"
            value={modForm.titulo}
            onChange={e => setModForm(p => ({ ...p, titulo: e.target.value }))}
            placeholder="Ej: Introducción a álgebra"
            required
          />
          <FTextarea
            label="Descripción"
            value={modForm.descripcion}
            onChange={e => setModForm(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Describe los temas de este módulo..."
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowModModal(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={savingMod} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 600, cursor: savingMod ? "not-allowed" : "pointer", opacity: savingMod ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {savingMod && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              {editingMod ? "Actualizar" : "Crear módulo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Foro create */}
      <Modal
        isOpen={showForoModal}
        onClose={() => setShowForoModal(false)}
        title="Nuevo foro"
        size="sm"
      >
        <form onSubmit={handleCreateForo}>
          <FInput
            label="Título del foro *"
            value={foroForm.titulo}
            onChange={e => setForoForm(p => ({ ...p, titulo: e.target.value }))}
            placeholder="Ej: Dudas sobre la unidad 1"
            required
          />
          <FTextarea
            label="Descripción"
            value={foroForm.descripcion}
            onChange={e => setForoForm(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="¿De qué trata este foro?"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={foroForm.publico}
              onChange={e => setForoForm(p => ({ ...p, publico: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13.5, color: "var(--color-text)" }}>Foro público (visible para todos)</span>
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowForoModal(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={savingForo} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 600, cursor: savingForo ? "not-allowed" : "pointer", opacity: savingForo ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {savingForo && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              Crear foro
            </button>
          </div>
        </form>
      </Modal>

      {/* Add participant */}
      <Modal
        isOpen={showParticModal}
        onClose={() => setShowParticModal(false)}
        title="Agregar participante"
        description="El participante recibirá acceso al curso"
        size="sm"
      >
        <form onSubmit={handleAddPartic}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <FInput
              label="Nombre *"
              value={particForm.nombre}
              onChange={e => setParticForm(p => ({ ...p, nombre: e.target.value }))}
              required
            />
            <FInput
              label="Apellido"
              value={particForm.apellido}
              onChange={e => setParticForm(p => ({ ...p, apellido: e.target.value }))}
            />
          </div>
          <FInput
            label="Cédula *"
            value={particForm.cedula}
            onChange={e => setParticForm(p => ({ ...p, cedula: e.target.value }))}
            placeholder="Número de identificación"
            required
          />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--color-text)", marginBottom: 5 }}>Teléfono</label>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--color-border)", borderRadius: 10, overflow: "hidden", background: "var(--color-surface)" }}>
              <span style={{ padding: "9px 12px", fontSize: 13.5, color: "var(--color-text-muted)", borderRight: "1.5px solid var(--color-border)", background: "var(--color-bg)", flexShrink: 0 }}>+57</span>
              <input
                type="tel"
                value={particForm.telefono}
                onChange={e => setParticForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="3001234567"
                style={{ flex: 1, padding: "9px 12px", fontSize: 13.5, border: "none", outline: "none", background: "transparent", color: "var(--color-text)" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowParticModal(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={savingPartic} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontSize: 13, fontWeight: 600, cursor: savingPartic ? "not-allowed" : "pointer", opacity: savingPartic ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {savingPartic && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              Agregar
            </button>
          </div>
        </form>
      </Modal>

      {/* Calificar entrega */}
      <Modal
        isOpen={!!calificando}
        onClose={() => setCalificando(null)}
        title="Calificar entrega"
        size="sm"
      >
        <form onSubmit={handleCalificar}>
          {calificando && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 14px", borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <UserAvatar user={calificando.padre ?? calificando.estudiante} size={36} />
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  {(calificando.padre ?? calificando.estudiante)?.nombre} {(calificando.padre ?? calificando.estudiante)?.apellido}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                  Entregado {fmtDate(calificando.fechaEnvio ?? calificando.fecha)}
                </p>
              </div>
            </div>
          )}
          <FInput
            label="Nota (0 – 10) *"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={gradeForm.nota}
            onChange={e => setGradeForm(p => ({ ...p, nota: e.target.value }))}
            placeholder="Ej: 8.5"
            required
          />
          <FTextarea
            label="Comentario para el estudiante"
            value={gradeForm.comentario}
            onChange={e => setGradeForm(p => ({ ...p, comentario: e.target.value }))}
            placeholder="Retroalimentación (opcional)..."
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setCalificando(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={savingGrade} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#16A34A", color: "white", fontSize: 13, fontWeight: 600, cursor: savingGrade ? "not-allowed" : "pointer", opacity: savingGrade ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {savingGrade && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              <Star style={{ width: 14, height: 14 }} /> Guardar calificación
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
