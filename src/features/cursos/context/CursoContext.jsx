import { createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { cursosGetById } from "@/features/cursos/services/cursosService";
import { normalizeCurso } from "@/lib/normalizers";
import { queryKeys } from "@/services/queryKeys";
import { usePermission, PERMISSIONS } from "@/hooks/usePermission";
import { useAuth } from "@/features/auth/hooks/useAuth";

const CursoContext = createContext(null);

// Debe coincidir con DEFAULT_COLOR de CursosPage.jsx (var(--color-primary))
const DEFAULT_CURSO_COLOR = "var(--color-primary)";

export function CursoProvider({ cursoId: cursoIdProp, children }) {
  const { id: idFromParams } = useParams();
  const cursoId = cursoIdProp ?? idFromParams;
  const { user } = useAuth();

  const {
    data:      curso,
    isLoading: loading,
    error,
    refetch:   reloadCurso,
  } = useQuery({
    queryKey: queryKeys.cursos.detail(cursoId),
    queryFn:  async () => {
      const res = await cursosGetById(cursoId);
      return normalizeCurso(res.curso ?? res);
    },
    enabled:   !!cursoId,
    staleTime: 60_000,
  });

  const canEditCourse         = usePermission(PERMISSIONS.CREATE_COURSES);
  const canManageModules      = usePermission(PERMISSIONS.MANAGE_MODULES);
  const canManageTasks        = usePermission(PERMISSIONS.MANAGE_TASKS);
  const canCreateForo         = usePermission(PERMISSIONS.CREATE_FORO);
  const canManageForo         = usePermission(PERMISSIONS.MANAGE_FORO);
  const canManageParticipants = usePermission(PERMISSIONS.MANAGE_COURSE_PARTICIPANTS);
  const canViewParticipants   = usePermission(PERMISSIONS.VIEW_COURSE_PARTICIPANTS);
  const canGradeEntregas      = usePermission(PERMISSIONS.GRADE_ENTREGAS);
  const canSubmitEntrega      = usePermission(PERMISSIONS.SUBMIT_ENTREGA);

  // Color del curso ya normalizado (con fallback consistente en toda la app)
  const cursoColor = curso?.color || DEFAULT_CURSO_COLOR;

  const value = {
    cursoId,
    curso,
    cursoColor,
    loading,
    error,
    reloadCurso,
    user,

    canEditCourse,
    canManageModules,
    canManageTasks,
    canCreateForo,
    canManageForo,
    canManageParticipants,
    canViewParticipants,
    canGradeEntregas,
    canSubmitEntrega,
  };

  return (
    <CursoContext.Provider value={value}>
      {children}
    </CursoContext.Provider>
  );
}

export function useCursoContext() {
  const ctx = useContext(CursoContext);
  if (!ctx) throw new Error("useCursoContext debe usarse dentro de <CursoProvider>");
  return ctx;
}

export default CursoContext;