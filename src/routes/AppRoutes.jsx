// src/routes/AppRoutes.jsx
// La navegación por pestañas usa el query param ?tab= (ej. /cursos/:id?tab=tareas).
// Los tabs usan { replace: true } para no contaminar el historial del back-button.

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { LoadingScreen }                                 from "@/components";
import { ProtectedRoute, PublicOnlyRoute, RoleRedirect } from "./ProtectedRoute";
import MainLayout                                        from "../components/layout/MainLayout";

// ── Páginas públicas ──────────────────────────────────────────────
const LandingPage    = lazy(() => import("../pages/LandingPage"));
const NotFoundPage   = lazy(() => import("../pages/NotFoundPage"));
const DemoPage       = lazy(() => import("../pages/DemoPage"));

// ── Autenticación ─────────────────────────────────────────────────
const LoginPage          = lazy(() => import("../features/auth/pages/LoginPage")         .then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = lazy(() => import("../features/auth/pages/ResetPasswordPage") .then(m => ({ default: m.ResetPasswordPage })));
// FIX: faltaba registrar esta ruta por completo — por eso el wizard de
// primer login nunca se veía (caía en el catch-all "*" → NotFoundPage).
const FirstLoginScreen   = lazy(() => import("../features/auth/pages/FirstLoginScreen"));

// ── Dashboards ────────────────────────────────────────────────────
const AdminHomePage   = lazy(() => import("../features/dashboard/admin/pages/AdminHomePage"));
const DocenteHomePage = lazy(() => import("../features/dashboard/docente/pages/DocenteHomePage"));
const PadreHomePage   = lazy(() => import("../features/dashboard/padre/pages/PadreHomePage"));

// ── Administración ────────────────────────────────────────────────
const InstitucionesPage = lazy(() => import("../features/instituciones/pages/InstitucionesPage"));
const MiInstitucionPage = lazy(() => import("../features/instituciones/pages/MiInstitucionPage"));
const UsuariosPage      = lazy(() => import("../features/usuarios/pages/UsuariosPage"));
const DocentesPage      = lazy(() => import("../features/docentes/pages/DocentesPage"));

// ── Cursos ────────────────────────────────────────────────────────
const CursosPage   = lazy(() => import("../features/cursos/pages/CursosPage"));
const CursoHubPage = lazy(() => import("../features/cursos/pages/CursoHubPage"));

// ── Docente ───────────────────────────────────────────────────────
const TareasPage      = lazy(() => import("../features/tareas/pages/TareasPage"));
const EntregasPage    = lazy(() => import("../features/tareas/pages/EntregasPage"));
const EventosPage     = lazy(() => import("../features/eventos/pages/EventosPage"));
const CalendarioPage  = lazy(() => import("../features/calendario/pages/CalendarioPage"));

// ── Foros ─────────────────────────────────────────────────────────
const ForosPage       = lazy(() => import("../features/foros/pages/ForosPage"));
// /foros/:id → redirige a la URL canónica /curso/:cursoId/foro/:foroId
const ForoRedirect    = lazy(() => import("../features/foros/pages/ForoRedirect"));
// Vista canónica del foro con TanStack Query
const ForumPage       = lazy(() => import("../features/foros/pages/ForumPage"));

// ── Familia ───────────────────────────────────────────────────────
const FamiliaPerfilesPage   = lazy(() => import("../features/familia/pages/FamiliaPerfilesPage"));
const FamiliaCursosPage     = lazy(() => import("../features/familia/pages/FamiliaCursosPage"));
const FamiliaTareasPage     = lazy(() => import("../features/familia/pages/FamiliaTareasPage"));
const FamiliaEntregasPage   = lazy(() => import("../features/familia/pages/FamiliaEntregasPage"));
const FamiliaForosPage      = lazy(() => import("../features/familia/pages/FamiliaForosPage"));
const FamiliaCalendarioPage = lazy(() => import("../features/familia/pages/FamiliaCalendarioPage"));

// ── Universal ─────────────────────────────────────────────────────
const PerfilPage         = lazy(() => import("../features/perfil/pages/PerfilPage"));
const NotificacionesPage = lazy(() => import("../features/notificaciones/pages/NotificacionesPage"));
const BuzonPage          = lazy(() => import("../features/buzon/pages/BuzonPage"));

// ── Sesiones ──────────────────────────────────────────────────────
const SesionesPage = lazy(() => import("../features/auth/pages/SesionesPage"));

const ALL_ROLES = ["administrador", "superadmin", "docente", "padre", "padre/tutor", "estudiante"];

const PageLoader = () => <LoadingScreen message="Cargando..." />;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── RAÍZ PÚBLICA ── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── DEMO — vista previa del dashboard sin iniciar sesión ── */}
          <Route path="/demo" element={<DemoPage />} />

          {/* ── AUTENTICACIÓN (solo sin sesión) ── */}
          <Route path="/login"           element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

          {/* ── RUTAS PROTEGIDAS (dentro de MainLayout) ── */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

            {/* Dashboards por rol */}
            <Route path="/admin"   element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><AdminHomePage /></ProtectedRoute>} />
            <Route path="/docente" element={<ProtectedRoute allowedRoles={["docente"]}><DocenteHomePage /></ProtectedRoute>} />
            <Route path="/padre"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><PadreHomePage /></ProtectedRoute>} />

            {/* Administración */}
            <Route path="/instituciones" element={<ProtectedRoute allowedRoles={["superadmin"]}><InstitucionesPage /></ProtectedRoute>} />
            <Route path="/institucion"   element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><MiInstitucionPage /></ProtectedRoute>} />
            <Route path="/usuarios"      element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><UsuariosPage /></ProtectedRoute>} />
            <Route path="/docentes"      element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><DocentesPage /></ProtectedRoute>} />

            {/* Cursos */}
            <Route path="/cursos" element={<ProtectedRoute allowedRoles={["administrador","superadmin","docente"]}><CursosPage /></ProtectedRoute>} />
            <Route path="/cursos/:id" element={<ProtectedRoute allowedRoles={ALL_ROLES}><CursoHubPage /></ProtectedRoute>} />

            {/* Foros — la URL canónica vive dentro del contexto del curso */}
            <Route path="/foros"     element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><ForosPage /></ProtectedRoute>} />
            <Route path="/foros/:id" element={<ProtectedRoute allowedRoles={ALL_ROLES}><ForoRedirect /></ProtectedRoute>} />
            <Route
              path="/curso/:cursoId/foro/:foroId"
              element={<ProtectedRoute allowedRoles={ALL_ROLES}><ForumPage /></ProtectedRoute>}
            />

            {/* Tareas */}
            <Route path="/tareas"              element={<ProtectedRoute allowedRoles={["docente"]}><TareasPage /></ProtectedRoute>} />
            <Route path="/tareas/:id/entregas" element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><EntregasPage /></ProtectedRoute>} />

            {/* Eventos */}
            <Route path="/eventos" element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><EventosPage /></ProtectedRoute>} />

            {/* Calendario */}
            <Route path="/calendario" element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin","padre","padre/tutor"]}><CalendarioPage /></ProtectedRoute>} />

            {/* Portal familia */}
            <Route path="/familia/perfiles"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaPerfilesPage /></ProtectedRoute>} />
            <Route path="/familia/cursos"     element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaCursosPage /></ProtectedRoute>} />
            <Route path="/familia/tareas"     element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaTareasPage /></ProtectedRoute>} />
            <Route path="/familia/entregas"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaEntregasPage /></ProtectedRoute>} />
            <Route path="/familia/foros"      element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaForosPage /></ProtectedRoute>} />
            <Route path="/familia/calendario" element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><FamiliaCalendarioPage /></ProtectedRoute>} />

            {/* Universal */}
            <Route path="/perfil"         element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
            <Route path="/notificaciones" element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />
            <Route path="/buzon"          element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><BuzonPage /></ProtectedRoute>} />
            <Route path="/sesiones"       element={<ProtectedRoute><SesionesPage /></ProtectedRoute>} />

          </Route>

          {/* /dashboard → smart redirect al home del rol */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

          {/* Wizard de primer inicio de sesión — FIX: ruta que faltaba registrar.
              Fuera de MainLayout (no queremos sidebar/navbar durante el wizard),
              sin allowedRoles (aplica a cualquier rol la primera vez). */}
          <Route path="/primer-inicio" element={<ProtectedRoute><FirstLoginScreen /></ProtectedRoute>} />

          {/* 404 — catch-all */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}