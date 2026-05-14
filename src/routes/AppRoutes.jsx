// src/routes/AppRoutes.jsx
// Tab navigation uses ?tab= query param (e.g. /cursos/:id?tab=tareas).
// No subroutes needed — CursoHubPage manages internal tab state.

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { LoadingScreen }                                from "@/components";
import { ProtectedRoute, PublicOnlyRoute, RoleRedirect } from "./ProtectedRoute";
import MainLayout                                       from "../components/layout/MainLayout";

// ── Auth pages ──────────────────────────────────────────────────
const LoginPage          = lazy(() => import("../features/auth/pages/LoginPage")         .then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = lazy(() => import("../features/auth/pages/ResetPasswordPage") .then(m => ({ default: m.ResetPasswordPage })));

// ── Dashboards ──────────────────────────────────────────────────
const AdminHomePage   = lazy(() => import("../features/dashboard/admin/pages/AdminHomePage"));
const DocenteHomePage = lazy(() => import("../features/dashboard/docente/pages/DocenteHomePage"));
const PadreHomePage   = lazy(() => import("../features/dashboard/padre/pages/PadreHomePage"));

// ── Admin management ─────────────────────────────────────────────
const InstitucionesPage = lazy(() => import("../features/instituciones/pages/InstitucionesPage"));
const MiInstitucionPage = lazy(() => import("../features/instituciones/pages/MiInstitucionPage"));
const UsuariosPage      = lazy(() => import("../features/usuarios/pages/UsuariosPage"));
const DocentesPage      = lazy(() => import("../features/docentes/pages/DocentesPage"));

// ── Cursos ───────────────────────────────────────────────────────
const CursosPage   = lazy(() => import("../features/cursos/pages/CursosPage"));
const CursoHubPage = lazy(() => import("../features/cursos/pages/CursoHubPage"));

// ── Docente features ─────────────────────────────────────────────
const TareasPage      = lazy(() => import("../features/tareas/pages/TareasPage"));
const EntregasPage    = lazy(() => import("../features/tareas/pages/EntregasPage"));
const ForosPage       = lazy(() => import("../features/foros/pages/ForosPage"));
const ForoDetallePage = lazy(() => import("../features/foros/pages/ForoDetallePage"));
const EventosPage     = lazy(() => import("../features/eventos/pages/EventosPage"));

// ── Familia ──────────────────────────────────────────────────────
const FamiliaPerfilesPage   = lazy(() => import("../features/familia/pages/FamiliaPerfilesPage"));
const FamiliaCursosPage     = lazy(() => import("../features/familia/pages/FamiliaCursosPage"));
const FamiliaTareasPage     = lazy(() => import("../features/familia/pages/FamiliaTareasPage"));
const FamiliaEntregasPage   = lazy(() => import("../features/familia/pages/FamiliaEntregasPage"));
const FamiliaForosPage      = lazy(() => import("../features/familia/pages/FamiliaForosPage"));
const FamiliaCalendarioPage = lazy(() => import("../features/familia/pages/FamiliaCalendarioPage"));

// ── All roles ────────────────────────────────────────────────────
const PerfilPage         = lazy(() => import("../features/perfil/pages/PerfilPage"));
const NotificacionesPage = lazy(() => import("../features/notificaciones/pages/NotificacionesPage"));

const PageLoader = () => <LoadingScreen message="Cargando..." />;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── RUTAS PUBLICAS ── */}
          <Route path="/login"           element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

          {/* ── RUTAS PROTEGIDAS (todas dentro de MainLayout) ── */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

            {/* Dashboards */}
            <Route path="/admin"   element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><AdminHomePage /></ProtectedRoute>} />
            <Route path="/docente" element={<ProtectedRoute allowedRoles={["docente"]}><DocenteHomePage /></ProtectedRoute>} />
            <Route path="/padre"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><PadreHomePage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/instituciones" element={<ProtectedRoute allowedRoles={["superadmin"]}><InstitucionesPage /></ProtectedRoute>} />
            <Route path="/institucion"   element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><MiInstitucionPage /></ProtectedRoute>} />
            <Route path="/usuarios"      element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><UsuariosPage /></ProtectedRoute>} />
            <Route path="/docentes"      element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><DocentesPage /></ProtectedRoute>} />

            {/* Cursos */}
            <Route path="/cursos" element={<ProtectedRoute allowedRoles={["administrador","superadmin","docente"]}><CursosPage /></ProtectedRoute>} />
            <Route
              path="/cursos/:id"
              element={
                <ProtectedRoute allowedRoles={["administrador","superadmin","docente","padre","padre/tutor","estudiante"]}>
                  <CursoHubPage />
                </ProtectedRoute>
              }
            />

            {/* Tareas */}
            <Route path="/tareas"              element={<ProtectedRoute allowedRoles={["docente"]}><TareasPage /></ProtectedRoute>} />
            <Route path="/tareas/:id/entregas" element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><EntregasPage /></ProtectedRoute>} />

            {/* Foros */}
            <Route path="/foros"     element={<ProtectedRoute allowedRoles={["docente"]}><ForosPage /></ProtectedRoute>} />
            <Route path="/foros/:id" element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><ForoDetallePage /></ProtectedRoute>} />

            {/* Eventos */}
            <Route path="/eventos" element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><EventosPage /></ProtectedRoute>} />

            {/* Familia */}
            <Route path="/familia/perfiles"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaPerfilesPage /></ProtectedRoute>} />
            <Route path="/familia/cursos"     element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaCursosPage /></ProtectedRoute>} />
            <Route path="/familia/tareas"     element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaTareasPage /></ProtectedRoute>} />
            <Route path="/familia/entregas"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaEntregasPage /></ProtectedRoute>} />
            <Route path="/familia/foros"      element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaForosPage /></ProtectedRoute>} />
            <Route path="/familia/calendario" element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaCalendarioPage /></ProtectedRoute>} />

            {/* Todos los roles */}
            <Route path="/perfil"         element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
            <Route path="/notificaciones" element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />

          </Route>

          {/* Raiz → redirige al home del rol */}
          <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
