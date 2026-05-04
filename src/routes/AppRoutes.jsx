// src/routes/AppRoutes.jsx
// ── VERIFICACIÓN: rutas de CursoHubPage soportan ?tab= query param.
// No se crean subrutas separadas para cada tab porque el Hub ya maneja
// la navegación interna por query string (?tab=tareas, ?tab=foros, etc.)
// Si en el futuro se quieren subrutas reales (/cursos/:id/tareas),
// se pueden agregar aquí sin romper nada.

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth pages
import { LoginPage }          from "../features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage }  from "../features/auth/pages/ResetPasswordPage";

// Role home pages
import AdminHomePage   from "../features/dashboard/admin/pages/AdminHomePage";
import DocenteHomePage from "../features/dashboard/docente/pages/DocenteHomePage";
import PadreHomePage   from "../features/dashboard/padre/pages/PadreHomePage";

// Superadmin / Admin views
import InstitucionesPage  from "../features/instituciones/pages/InstitucionesPage";
import MiInstitucionPage  from "../features/instituciones/pages/MiInstitucionPage";
import UsuariosPage       from "../features/usuarios/pages/UsuariosPage";
import DocentesPage       from "../features/docentes/pages/DocentesPage";

// Cursos
import CursosPage    from "../features/cursos/pages/CursosPage";
import CursoHubPage  from "../features/cursos/pages/CursoHubPage.refinal";

// Docente feature views
import TareasPage      from "../features/tareas/pages/TareasPage";
import EntregasPage    from "../features/tareas/pages/EntregasPage";
import ForosPage       from "../features/foros/pages/ForosPage";
import ForoDetallePage from "../features/foros/pages/ForoDetallePage";
import EventosPage     from "../features/eventos/pages/EventosPage";
import PerfilPage      from "../features/perfil/pages/PerfilPage";

// Padre / Familia views
import FamiliaPerfilesPage   from "../features/familia/pages/FamiliaPerfilesPage";
import FamiliaCursosPage     from "../features/familia/pages/FamiliaCursosPage";
import FamiliaTareasPage     from "../features/familia/pages/FamiliaTareasPage";
import FamiliaEntregasPage   from "../features/familia/pages/FamiliaEntregasPage";
import FamiliaForosPage      from "../features/familia/pages/FamiliaForosPage";
import FamiliaCalendarioPage from "../features/familia/pages/FamiliaCalendarioPage";

// All-roles views
import NotificacionesPage from "../features/notificaciones/pages/NotificacionesPage";

// Route guards
import { ProtectedRoute, PublicOnlyRoute, RoleRedirect } from "./ProtectedRoute";

// Layouts
import MainLayout from "../components/layout/MainLayout";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── RUTAS PÚBLICAS ── */}
        <Route path="/login"            element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password"  element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
        <Route path="/reset-password"   element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

        {/* ── RUTAS PROTEGIDAS ── */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

          {/* Dashboards por rol */}
          <Route path="/admin"   element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><AdminHomePage /></ProtectedRoute>} />
          <Route path="/docente" element={<ProtectedRoute allowedRoles={["docente"]}><DocenteHomePage /></ProtectedRoute>} />
          <Route path="/padre"   element={<ProtectedRoute allowedRoles={["padre","padre/tutor"]}><PadreHomePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/instituciones" element={<ProtectedRoute allowedRoles={["superadmin"]}><InstitucionesPage /></ProtectedRoute>} />
          <Route path="/institucion"   element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><MiInstitucionPage /></ProtectedRoute>} />
          <Route path="/usuarios"      element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><UsuariosPage /></ProtectedRoute>} />
          <Route path="/docentes"      element={<ProtectedRoute allowedRoles={["administrador","superadmin"]}><DocentesPage /></ProtectedRoute>} />

          {/* Cursos — lista */}
          <Route path="/cursos" element={<ProtectedRoute allowedRoles={["administrador","superadmin","docente"]}><CursosPage /></ProtectedRoute>} />

          {/* ─── CURSO HUB — entry point de todas las cards ───────────────────────
              Todos los roles acceden a /cursos/:id.
              El Hub internamente filtra tabs y acciones según permisos.
              Los botones de CourseCard navegan con ?tab=X para abrir directamente
              la tab correcta sin subrutas adicionales.
          ─────────────────────────────────────────────────────────────────────── */}
          <Route
            path="/cursos/:id"
            element={
              <ProtectedRoute allowedRoles={["administrador","superadmin","docente","padre","padre/tutor","estudiante"]}>
                <CursoHubPage />
              </ProtectedRoute>
            }
          />

          {/* Tareas */}
          <Route path="/tareas"                element={<ProtectedRoute allowedRoles={["docente"]}><TareasPage /></ProtectedRoute>} />
          <Route path="/tareas/:id/entregas"   element={<ProtectedRoute allowedRoles={["docente","administrador","superadmin"]}><EntregasPage /></ProtectedRoute>} />

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
          <Route path="/perfil"          element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
          <Route path="/notificaciones"  element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />

        </Route>

        {/* Raíz → redirige al home del rol */}
        <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}