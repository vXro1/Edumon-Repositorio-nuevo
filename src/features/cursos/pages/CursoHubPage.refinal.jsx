// src/features/cursos/pages/CursoHubPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ORQUESTADOR — Solo carga el curso, gestiona tabs y renderiza el layout.
// Toda la lógica de negocio vive en los componentes de cada tab.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ClipboardList, MessageSquare, Users, Calendar } from "lucide-react";

import { useAuthContext } from "@/features/auth/context/AuthContext";
import { tienePermiso, normalizeRole, ROLES } from "@/security/roleMatrix";
import { PERMISSIONS } from "@/security/permissions";
import { apiFetch } from "@/lib/apiClient";
import { normalizeCurso } from "@/lib/normalizers";
import { Button } from "@/components";

// Componentes modulares
import HubHeader        from "../components/hub/HubHeader";
import HubTabs          from "../components/hub/HubTabs";
import ModulosTab       from "../components/modules/ModulosTab";
import TareasTab        from "../components/tareas/TareasTab";
import ForosTab         from "../components/foros/ForosTab";
import ParticipantesTab from "../components/participantes/ParticipantesTab";
import CalendarioTab    from "../components/calendario/CalendarioTab";

// ─────────────────────────────────────────────────────────────────────────────
// Definición de tabs (filtradas por permiso en runtime)
// ─────────────────────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  { key: "modulos",       label: "Módulos",       icon: BookOpen,      always: true },
  { key: "tareas",        label: "Tareas",        icon: ClipboardList, perm: PERMISSIONS.VIEW_TASKS },
  { key: "calendario",    label: "Calendario",    icon: Calendar,      perm: PERMISSIONS.VIEW_TASKS },
  { key: "foros",         label: "Foros",         icon: MessageSquare, perm: PERMISSIONS.VIEW_FOROS },
  { key: "participantes", label: "Participantes", icon: Users,         perm: PERMISSIONS.VIEW_COURSE_PARTICIPANTS },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function CursoHubPage() {
  const { id: cursoId } = useParams();
  const navigate        = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user }        = useAuthContext();

  const [curso, setCurso]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Rol y permisos ──────────────────────────────────────────────────────
  const rawRole = user?.role ?? user?.rol ?? "";
  const role    = normalizeRole(rawRole);

  const perms = {
    canManageCourse:  tienePermiso(rawRole, PERMISSIONS.MANAGE_MODULES) || tienePermiso(rawRole, PERMISSIONS.MANAGE_TASKS),
    canManageTasks:   tienePermiso(rawRole, PERMISSIONS.MANAGE_TASKS),
    canGradeEntregas: tienePermiso(rawRole, PERMISSIONS.GRADE_ENTREGAS),
    canCreateForo:    tienePermiso(rawRole, PERMISSIONS.CREATE_FORO),
    canSeeParticipants: tienePermiso(rawRole, PERMISSIONS.VIEW_COURSE_PARTICIPANTS),
    canManageParts:   tienePermiso(rawRole, PERMISSIONS.MANAGE_COURSE_PARTICIPANTS),
    esPadre:          role === ROLES.PADRE,
    isDocente:        role === ROLES.DOCENTE,
  };

  // ── Tabs disponibles según permisos ────────────────────────────────────
  const tabs = TAB_CONFIG.filter((t) => t.always || tienePermiso(rawRole, t.perm));
  const tabFromUrl  = searchParams.get("tab");
  const activeTab   = tabs.find((t) => t.key === tabFromUrl) ? tabFromUrl : (tabs[0]?.key ?? "modulos");
  const setTab      = (key) => setSearchParams({ tab: key }, { replace: true });

  // ── Carga del curso ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!cursoId) return;
    setLoading(true);
    apiFetch(`/cursos/${cursoId}`)
      .then((res) => setCurso(normalizeCurso(res.curso ?? res)))
      .catch(() => setCurso(null))
      .finally(() => setLoading(false));
  }, [cursoId]);

  const userId = user?._id ?? user?.id;

  // ── Render del tab activo ───────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case "modulos":
        return <ModulosTab cursoId={cursoId} canManage={perms.canManageCourse} />;
      case "tareas":
        return <TareasTab cursoId={cursoId} canManage={perms.canManageTasks}
          canGrade={perms.canGradeEntregas} esPadre={perms.esPadre} />;
      case "calendario":
        return <CalendarioTab cursoId={cursoId} />;
      case "foros":
        return <ForosTab cursoId={cursoId} canCreate={perms.canCreateForo}
          isDocente={perms.isDocente} userId={userId} />;
      case "participantes":
        return perms.canSeeParticipants
          ? <ParticipantesTab cursoId={cursoId} canManage={perms.canManageParts} />
          : null;
      default:
        return null;
    }
  };

  // ── Layout ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: 14 }}>
        <ArrowLeft style={{ width: 15, height: 15 }} /> Volver
      </Button>

      <HubHeader curso={curso} loading={loading} role={role} />
      <HubTabs   tabs={tabs} activeTab={activeTab} onTabChange={setTab} />

      <div>{renderTab()}</div>
    </div>
  );
}