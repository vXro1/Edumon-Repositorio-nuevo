// orquestador de tabs; toda la lógica de datos y permisos viene de CursoProvider
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ClipboardList, MessageSquare, Users, Calendar } from "lucide-react";

import { CursoProvider, useCursoContext } from "../context/CursoContext";
import { tienePermiso } from "@/security/roleMatrix";
import { PERMISSIONS } from "@/security/permissions";
import { Button } from "@/components";

import HubHeader        from "../components/hub/HubHeader";
import HubTabs          from "../components/hub/HubTabs";
import ModulosTab       from "../components/modules/ModulosTab";
import TareasTab        from "../components/tareas/TareasTab";
import ForosTab         from "../components/foros/ForosTab";
import ParticipantesTab from "../components/participantes/ParticipantesTab";
import CalendarioTab    from "../components/calendario/CalendarioTab";

// ─── Definición de tabs ───────────────────────────────────────────────────────
const TAB_CONFIG = [
  { key: "modulos",       label: "Módulos",       icon: BookOpen,      always: true },
  { key: "tareas",        label: "Retos",         icon: ClipboardList, perm: PERMISSIONS.VIEW_TASKS },
  { key: "calendario",    label: "Calendario",    icon: Calendar,      perm: PERMISSIONS.VIEW_TASKS },
  { key: "foros",         label: "Foros",         icon: MessageSquare, perm: PERMISSIONS.VIEW_FOROS },
  { key: "participantes", label: "Participantes", icon: Users,         perm: PERMISSIONS.VIEW_COURSE_PARTICIPANTS },
];

// ─── Contenido ────────────────────────────────────────────────────────────────

function CursoHubContent() {
  const navigate       = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    cursoId, curso, cursoColor, loading, user,
    canManageModules, canManageTasks, canGradeEntregas,
    canCreateForo, canViewParticipants, canManageParticipants,
  } = useCursoContext();

  const rawRole = user?.rol ?? user?.role ?? "";

  // Tabs visibles según permisos del usuario
  const tabs     = TAB_CONFIG.filter((t) => t.always || tienePermiso(rawRole, t.perm));
  const tabFromUrl = searchParams.get("tab");
  const activeTab  = tabs.find((t) => t.key === tabFromUrl) ? tabFromUrl : (tabs[0]?.key ?? "modulos");
  const setTab     = (key) => setSearchParams({ tab: key }, { replace: true });

  const esPadre = rawRole === "padre" || rawRole === "padre/tutor";
  const esEstudiante = rawRole === "estudiante";

  const renderTab = () => {
    switch (activeTab) {
      case "modulos":
        return <ModulosTab cursoId={cursoId} canManage={canManageModules} />;
      case "tareas":
        return <TareasTab cursoId={cursoId} canManage={canManageTasks}
          canGrade={canGradeEntregas} esPadre={esPadre} />;
      case "calendario":
        return <CalendarioTab cursoId={cursoId} canManage={canManageTasks} />;
      case "foros":
        return <ForosTab cursoId={cursoId} cursoNombre={curso?.nombre ?? ""} canCreate={canCreateForo} />;
      case "participantes":
        return canViewParticipants
          ? <ParticipantesTab cursoId={cursoId} canManage={canManageParticipants} />
          : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", "--curso-color": cursoColor }}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: 14 }}>
        <ArrowLeft style={{ width: 15, height: 15 }} /> Volver
      </Button>
      <HubHeader curso={curso} loading={loading} esPadre={esPadre} esEstudiante={esEstudiante} />
      <HubTabs   tabs={tabs} activeTab={activeTab} onTabChange={setTab} color={cursoColor} />
      <div>{renderTab()}</div>
    </div>
  );
}

// ─── Page (entry point con Provider) ─────────────────────────────────────────

export default function CursoHubPage() {
  return (
    <CursoProvider>
      <CursoHubContent />
    </CursoProvider>
  );
}