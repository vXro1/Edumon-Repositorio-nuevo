//ruta base de la API
// src/lib/apiClient.js
// ============================================================
// api.js — Edumon Plataforma Educativa
// Cubre todos los endpoints documentados en la API REST v1.0
// Organizado por módulo; cada función indica el rol requerido.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

// Log de configuración en desarrollo
if (import.meta.env.DEV) {
}

// ── Logout automático ante 401 ────────────────────────────────
let _logoutCallback = null;
export const registerLogoutCallback = (cb) => { _logoutCallback = cb; };

// ── Utilidad base ─────────────────────────────────────────────
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  // Manejar respuestas sin contenido
  let data = {};
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      // Si no es JSON válido, continuar con objeto vacío
      data = {};
    }
  }

  // Manejar 401 antes de revisar si es OK
  if (res.status === 401) {
    // Login fallido por credenciales incorrectas — NO redirigir a ?expired=1
    if (endpoint === "/auth/login") {
      throw new Error("Teléfono o contraseña incorrectos. Verifica tus credenciales.");
    }
    // Cualquier otro 401 = sesión expirada → logout automático
    if (_logoutCallback) {
      _logoutCallback();
    }
    throw new Error(data.message || "Sesión expirada. Por favor inicia sesión de nuevo.");
  }

  if (!res.ok) {
    // Dar más contexto sobre el error
    const errorMsg = data.message || data.error || `Error ${res.status} en la API`;
    
    // Para errores de validación, mostrar detalles
    if (res.status === 400 && data.errors && Array.isArray(data.errors)) {
      console.error(`❌ Errores de validación:`, data.errors);
      const err = new Error(data.message || "Errores de validación");
      err.validationErrors = data.errors; // [{ type, msg, path, location }]
      throw err;
    }
    
    console.error(`API Error (${res.status}):`, errorMsg, data);
    throw new Error(errorMsg);
  }

  return data;
};

/**
 * Wrapper para llamadas multipart/form-data (archivos).
 * No establece Content-Type para que el navegador lo haga con el boundary.
 */
export const apiFetchFormData = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  // Debug: log FormData content
  if (options.body instanceof FormData) {
    const formDataObj = {};
    for (const [key, value] of options.body.entries()) {
      if (!formDataObj[key]) {
        formDataObj[key] = value;
      }
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  let data = {};
  try { data = await res.json(); } catch { /* respuesta sin cuerpo JSON */ }

  if (res.status === 401) {
    if (_logoutCallback) _logoutCallback();
    throw new Error(data.message || "Sesión expirada. Por favor inicia sesión de nuevo.");
  }

  if (!res.ok) {
    const errorMsg = data.message || data.error || `Error ${res.status} en la API`;
    if (res.status === 400 && data.errors && Array.isArray(data.errors)) {
      console.error(`❌ Errores de validación:`, data.errors);
      const detail = data.errors
        .map(e => e.path ? `${e.path}: ${e.msg || e.message}` : (e.field ? `${e.field}: ${e.message}` : e.msg || e.message))
        .join(", ");
      throw new Error(`${errorMsg} - ${detail}`);
    }
    console.error(`API Error (${res.status}):`, errorMsg, data);
    throw new Error(errorMsg);
  }

  return data;
};

// ═══════════════════════════════════════════════════════════════
// 1. AUTH — /api/auth
// ═══════════════════════════════════════════════════════════════

/**
 * Registra un nuevo usuario.
 * ROL: Público
 * @param {{ nombre, apellido, cedula, correo, contrasena, rol, telefono }} body
 * @returns {{ token, user }} + dispara evento USUARIO_BIENVENIDA
 */
export const authRegister = ({ contrasena, ...rest }) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...rest, contraseña: contrasena }),
  });

/**
 * Inicia sesión con teléfono y contraseña.
 * ROL: Público
 * @param {{ telefono, contrasena }} body
 * @returns {{ token, user, primerInicioSesion }}
 */
export const authLogin = ({ telefono, contrasena }) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ telefono, contraseña: contrasena }),
  });

/**
 * Devuelve el perfil del usuario autenticado.
 * ROL: Autenticado (cualquier rol)
 * @returns {{ id, nombre, apellido, cedula, correo, rol, telefono,
 *             estado, fechaRegistro, ultimoAcceso, fotoPerfilUrl, preferencias }}
 */
export const authGetProfile = () => apiFetch("/auth/profile");

/**
 * Cambia la contraseña del usuario autenticado.
 * ROL: Autenticado (cualquier rol)
 * @param {{ contrasenaActual, contrasenaNueva }} body
 */
export const authChangePassword = ({ contrasenaActual, contrasenaNueva }) =>
  apiFetch("/auth/change-password", {
    method: "PUT",
    // El backend valida el campo con nombre "contraseña" (no "contraseñaActual")
    body: JSON.stringify({ contraseña: contrasenaActual, contraseñaNueva: contrasenaNueva }),
  });

/**
 * Completa el registro en el primer inicio de sesión.
 * ROL: Autenticado — solo cuando primerInicioSesion === true.
 * @param {{ nombre, apellido, cedula, correo, telefono?, contraseñaNueva, fotoPredeterminadaUrl? }} body
 * @returns {{ token, user }}
 */
export const authCompleteRegistro = (body) =>
  apiFetch("/auth/completar-registro", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Cierra sesión (stateless — el cliente debe eliminar el token localmente).
 * ROL: Autenticado (cualquier rol)
 */
export const authLogout = () =>
  apiFetch("/auth/logout", { method: "POST" });

/**
 * Solicita un código de recuperación de contraseña.
 * ROL: Público — siempre responde 200 por seguridad.
 * @param {{ correo }} body
 */
export const authForgotPassword = (body) =>
  apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Resetea la contraseña usando el código recibido por correo.
 * ROL: Público
 * @param {{ correo, codigo, contrasenaNueva }} body
 */
export const authResetPassword = ({ correo, codigo, contrasenaNueva }) =>
  apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ correo, codigo, contraseñaNueva: contrasenaNueva }),
  });

// ═══════════════════════════════════════════════════════════════
// 2. USERS — /api/users
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un nuevo usuario.
 * ROL: Autenticado (normalmente administrador o superadmin)
 * @param {{ nombre, apellido, cedula, correo, contrasena, rol, telefono }} body
 */
export const usersCreate = (body) =>
  apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Lista todos los usuarios con paginación y filtros opcionales.
 * ROL: Autenticado (administrador / superadmin)
 * @param {{ page?, limit?, rol?, estado? }} params
 * @returns {{ users, pagination: { currentPage, totalPages, totalUsers, hasNextPage, hasPrevPage } }}
 */
export const usersGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/users${qs ? `?${qs}` : ""}`);
};

/**
 * Devuelve el perfil completo del usuario autenticado.
 * ROL: Autenticado (cualquier rol)
 */
export const usersGetMyProfile = () => apiFetch("/users/me/profile");

/**
 * Actualiza la foto de perfil del usuario autenticado.
 * ROL: Autenticado (cualquier rol)
 * Enviar exactamente uno de los dos campos:
 *   - foto (File)  → sube a Cloudinary y elimina la anterior si no es predeterminada
 *   - fotoPredeterminadaUrl (string) → asigna un avatar del catálogo
 * @param {FormData} formData
 */
export const usersUpdateMyPhoto = (formData) =>
  apiFetchFormData("/users/me/foto-perfil", {
    method: "PUT",
    body: formData,
  });

/**
 * Devuelve el catálogo de avatares predeterminados de Cloudinary.
 * ROL: Autenticado (cualquier rol)
 * @returns {{ fotos: [{ url, publicId, nombre }] }}
 */
export const usersGetDefaultPhotos = () =>
  apiFetch("/users/fotos-predeterminadas");

/**
 * Asigna un avatar predeterminado del catálogo como foto de perfil.
 * Usado en el flujo de primer inicio de sesión.
 * ROL: Autenticado (cualquier rol)
 * @param {string} fotoPredeterminadaUrl URL del avatar seleccionado
 */
export const usersPatchFotoDefault = (fotoPredeterminadaUrl) =>
  apiFetch("/users/foto-perfil", {
    method: "PATCH",
    body: JSON.stringify({ fotoPredeterminadaUrl }),
  });

/**
 * Sube una imagen propia como foto de perfil.
 * Usado en el flujo de primer inicio de sesión.
 * ROL: Autenticado (cualquier rol)
 * @param {File} file Archivo de imagen
 */
export const usersPatchFotoFile = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetchFormData("/users/foto-perfil", {
    method: "PATCH",
    body: fd,
  });
};


/**
 * Obtiene un usuario por su ID.
 * ROL: Autenticado (administrador / superadmin)
 * @param {string} id ObjectId de MongoDB
 */
export const usersGetById = (id) => apiFetch(`/users/${id}`);

/**
 * Actualiza un usuario por ID.
 * Los campos contrasena, _id y fechaRegistro son ignorados aunque se envíen.
 * ROL: Autenticado (administrador / superadmin)
 * @param {string} id
 * @param {object} body Campos actualizables
 */
export const usersUpdate = (id, body) =>
  apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Suspende un usuario (soft delete — cambia estado a "suspendido").
 * ROL: Autenticado (administrador / superadmin)
 * @param {string} id
 */
export const usersDelete = (id) =>
  apiFetch(`/users/${id}`, { method: "DELETE" });

/**
 * Registra o actualiza el token FCM del usuario autenticado para notificaciones push.
 * ROL: Autenticado (cualquier rol)
 * @param {{ fcmToken }} body
 */
export const usersUpdateFcmToken = (body) =>
  apiFetch("/users/me/fcm-token", {
    method: "PUT",
    body: JSON.stringify(body),
  });

// ═══════════════════════════════════════════════════════════════
// 3. INSTITUCIONES — /api/instituciones
// ═══════════════════════════════════════════════════════════════

/**
 * Crea una institución y su administrador en una sola operación.
 * La contraseña inicial del admin es su cédula.
 * ROL: Superadmin
 * @param {{ nombre, nit, direccion, telefono, correo,
 *           adminNombre, adminApellido, adminCedula, adminCorreo, adminTelefono }} body
 * @returns {{ institucion, admin }} + dispara USUARIO_BIENVENIDA
 */
export const institucionesCreate = (body) =>
  apiFetch("/instituciones", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Lista todas las instituciones activas.
 * ROL: Superadmin
 * @returns {{ instituciones: [...] }}
 */
export const institucionesGetAll = () => apiFetch("/instituciones");

/**
 * Actualiza datos editables de una institución (no modifica nit, adminId ni codigo).
 * ROL: Superadmin
 * @param {string} id
 * @param {{ nombre?, direccion?, telefono?, correo? }} body
 */
export const institucionesUpdate = (id, body) =>
  apiFetch(`/instituciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Devuelve la institución asociada al usuario autenticado.
 * ROL: Administrador / Superadmin
 */
export const institucionesGetMine = () =>
  apiFetch("/instituciones/mi-institucion");

/**
 * Pre-registra un docente y lo asigna a la institución del admin autenticado.
 * Contraseña inicial: cédula. Si no se provee correo, se genera cedula@temp.com.
 * ROL: Administrador
 * @param {{ nombre, apellido, cedula, telefono, correo? }} body
 * @returns {{ docente }} + dispara USUARIO_BIENVENIDA
 */
export const institucionesCreateDocente = (body) =>
  apiFetch("/instituciones/docentes", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Carga masiva de docentes desde un archivo CSV.
 * Columnas requeridas: nombre, apellido, telefono, cedula.
 * Lógica por registro:
 *   (1) no existe → crea y asigna
 *   (2) existe sin institución → asigna
 *   (3) ya en esta institución → duplicado
 *   (4) en otra institución → error
 * ROL: Administrador
 * @param {FormData} formData campo: archivoCSV
 * @returns {{ total, exitosos, duplicados, errores, detalles[] }}
 */
export const institucionesCreateDocentesCsv = (formData) =>
  apiFetchFormData("/instituciones/docentes/csv", {
    method: "POST",
    body: formData,
  });

// ═══════════════════════════════════════════════════════════════
// 4. CURSOS — /api/cursos
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un nuevo curso. institucionId se toma del token automáticamente.
 * El docente creador se agrega como participante con etiqueta "docente".
 * ROL: Administrador / Docente
 * @param {FormData} formData
 *   Campos: nombre (req), descripcion, docenteId (req), fotoPortadaUrl?,
 *           fotoPortada (File)?, archivoCSV (File)?
 * @returns {{ curso, cargaMasiva? }} + dispara USUARIO_BIENVENIDA y USUARIO_AGREGADO_CURSO
 */
export const cursosCreate = (formData) =>
  apiFetchFormData("/cursos", {
    method: "POST",
    body: formData,
  });

/**
 * Lista cursos con paginación y filtros.
 * ROL: Administrador / Docente / Padre
 * @param {{ page?, limit?, estado?, docenteId? }} params
 */
export const cursosGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos${qs ? `?${qs}` : ""}`);
};

/**
 * Lista solo los cursos activos donde el usuario autenticado figura como participante.
 * ROL: Autenticado (cualquier rol)
 * @param {{ page?, limit? }} params
 */
export const cursosGetMine = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos/mis-cursos${qs ? `?${qs}` : ""}`);
};

/**
 * Lista participantes de un curso con filtros opcionales.
 * ROL: Administrador / Docente
 * @param {string} id
 * @param {{ etiqueta?, search?, page?, limit? }} params
 */
export const cursosGetParticipantes = (id, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos/${id}/participantes${qs ? `?${qs}` : ""}`);
};

/**
 * Obtiene un curso por ID con docente y participantes populados.
 * ROL: Autenticado (cualquier rol)
 * @param {string} id
 */
export const cursosGetById = (id) => apiFetch(`/cursos/${id}`);

/**
 * Actualiza un curso. Acepta fotoPortada (File) para reemplazar la portada.
 * ROL: Administrador / Docente
 * @param {string} id
 * @param {FormData} formData Cualquier campo actualizable
 */
export const cursosUpdate = (id, formData) =>
  apiFetchFormData(`/cursos/${id}`, {
    method: "PUT",
    body: formData,
  });

/**
 * Archiva un curso (soft delete — cambia estado a "archivado").
 * ROL: Administrador / Docente (solo sus propios cursos)
 * @param {string} id
 */
export const cursosDelete = (id) =>
  apiFetch(`/cursos/${id}`, { method: "DELETE" });

/**
 * Agrega un participante individual al curso.
 * Si el usuario ya existe (por cédula) se agrega sin crear cuenta.
 * Si no existe, se crea con rol "padre" y contraseña igual a su cédula.
 * ROL: Administrador / Docente / Padre
 * @param {string} id
 * @param {{ nombre, apellido, cedula, telefono, contrasena }} body
 */
export const cursosAddParticipante = (id, body) =>
  apiFetch(`/cursos/${id}/participantes`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Elimina un participante del curso.
 * No se puede eliminar al docente principal.
 * ROL: Administrador / Docente
 * @param {string} cursoId
 * @param {string} usuarioId
 */
export const cursosRemoveParticipante = (cursoId, usuarioId) =>
  apiFetch(`/cursos/${cursoId}/participantes/${usuarioId}`, {
    method: "DELETE",
  });

/**
 * Carga masiva de participantes (padres) desde CSV.
 * Columnas: nombre, apellido, telefono, cedula.
 * ROL: Administrador / Docente
 * @param {string} id
 * @param {FormData} formData campo: archivoCSV
 */
export const cursosAddParticipantesCsv = (id, formData) =>
  apiFetchFormData(`/cursos/${id}/usuarios-masivo`, {
    method: "POST",
    body: formData,
  });

// ═══════════════════════════════════════════════════════════════
// 5. MÓDULOS — /api/modulos
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un módulo dentro de un curso.
 * ROL: Autenticado (normalmente docente)
 * @param {{ cursoId, titulo, descripcion }} body
 */
export const modulosCreate = (body) =>
  apiFetch("/modulos", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Lista módulos con paginación y filtros.
 * ROL: Autenticado (cualquier rol)
 * @param {{ page?, limit?, cursoId?, incluirInactivos? }} params
 */
export const modulosGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/modulos${qs ? `?${qs}` : ""}`);
};

/**
 * Lista todos los módulos de un curso sin paginación.
 * ROL: Autenticado (cualquier rol)
 * @param {string} cursoId
 * @param {{ incluirInactivos? }} params
 */
export const modulosGetByCurso = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/modulos/curso/${cursoId}${qs ? `?${qs}` : ""}`);
};

/**
 * Obtiene un módulo por ID.
 * ROL: Autenticado (cualquier rol)
 * @param {string} id
 */
export const modulosGetById = (id) => apiFetch(`/modulos/${id}`);

/**
 * Actualiza un módulo (se ignoran _id y fechaCreacion).
 * ROL: Autenticado (normalmente docente)
 * @param {string} id
 * @param {object} body
 */
export const modulosUpdate = (id, body) =>
  apiFetch(`/modulos/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Desactiva un módulo (soft delete — cambia estado a "inactivo").
 * ROL: Autenticado (normalmente docente)
 * @param {string} id
 */
export const modulosDelete = (id) =>
  apiFetch(`/modulos/${id}`, { method: "DELETE" });

/**
 * Reactiva un módulo inactivo.
 * ROL: Autenticado (normalmente docente)
 * @param {string} id
 */
export const modulosRestore = (id) =>
  apiFetch(`/modulos/${id}/restore`, { method: "PATCH" });

// ═══════════════════════════════════════════════════════════════
// 6. TAREAS — /api/tareas
// ═══════════════════════════════════════════════════════════════

/**
 * Crea una tarea académica.
 * Si asignacionTipo = "todos" se limpia participantesSeleccionados.
 * Los adjuntos soportan archivos (Cloudinary) y enlaces (URL externa).
 * ROL: Docente
 * @param {FormData} formData
 *   Campos: titulo (req), descripcion, cursoId (req), moduloId?, docenteId,
 *           fechaEntrega, asignacionTipo, participantesSeleccionados[], enlaces[],
 *           archivos (File[])
 * @returns {{ tarea }} + dispara TAREA_CREADA
 */
export const tareasCreate = (formData) =>
  apiFetchFormData("/tareas", {
    method: "POST",
    body: formData,
  });

/**
 * Lista tareas filtradas por rol:
 *   - docente: solo sus propias tareas
 *   - padre: tareas "todos" de sus cursos + las que lo incluyen en seleccionados
 *   - administrador: todas sin restricción
 * ROL: Autenticado (cualquier rol)
 * @param {{ page?, limit?, cursoId?, moduloId?, docenteId?, estado?, asignacionTipo? }} params
 */
export const tareasGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/tareas${qs ? `?${qs}` : ""}`);
};

/**
 * Obtiene una tarea por ID con relaciones populadas.
 * ROL: Autenticado (cualquier rol)
 * @param {string} id
 */
export const tareasGetById = (id) => apiFetch(`/tareas/${id}`);

/**
 * Actualiza una tarea.
 * Los nuevos archivos se agregan (no reemplazan). archivosAEliminar elimina de Cloudinary.
 * ROL: Docente
 * @param {string} id
 * @param {FormData} formData
 *   Campos: archivosAEliminar[] (publicIds), archivos (File[]), nuevosEnlaces[], asignacionTipo?
 */
export const tareasUpdate = (id, formData) =>
  apiFetchFormData(`/tareas/${id}`, {
    method: "PUT",
    body: formData,
  });

/**
 * Cierra una tarea (cambia estado a "cerrada").
 * ROL: Autenticado (normalmente docente)
 * @param {string} id
 * @returns {{ tarea }} + dispara TAREA_CERRADA
 */
export const tareasCerrar = (id) =>
  apiFetch(`/tareas/${id}/cerrar`, { method: "PATCH" });

/**
 * Elimina una tarea (soft delete — estado "cerrada") y limpia archivos en Cloudinary.
 * Los enlaces no tienen limpieza en Cloudinary.
 * ROL: Autenticado (normalmente docente / administrador)
 * @param {string} id
 */
export const tareasDelete = (id) =>
  apiFetch(`/tareas/${id}`, { method: "DELETE" });

// ═══════════════════════════════════════════════════════════════
// 7. ENTREGAS — /api/entregas
// ═══════════════════════════════════════════════════════════════

/**
 * Crea una entrega para una tarea.
 * Si estado = "enviada" y la tarea ya venció, el estado se fuerza a "tarde".
 * ROL: Padre
 * @param {FormData} formData
 *   Campos: tareaId (req), padreId (req), textoRespuesta?, estado?,
 *           archivos (File[], máx 5)
 * @returns {{ entrega }} + dispara ENTREGA_CREADA si no es borrador
 */
export const entregasCreate = (formData) =>
  apiFetchFormData("/entregas", {
    method: "POST",
    body: formData,
  });

/**
 * Lista entregas (solo "enviada" o "tarde").
 * Los docentes solo ven entregas de sus propias tareas.
 * ROL: Autenticado (cualquier rol)
 * @param {{ page?, limit?, estado? }} params
 */
export const entregasGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/entregas${qs ? `?${qs}` : ""}`);
};

/**
 * Lista entregas de una tarea con estadísticas.
 * ROL: Autenticado (cualquier rol)
 * @param {string} tareaId
 * @param {{ page?, limit?, estado? }} params
 * @returns {{ tarea, estadisticas: { total, enviadas, tarde, calificadas }, entregas[], pagination }}
 */
export const entregasGetByTarea = (tareaId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/entregas/tarea/${tareaId}${qs ? `?${qs}` : ""}`);
};

/**
 * Lista entregas enviadas/tarde de un padre específico.
 * ROL: Autenticado (cualquier rol)
 * @param {string} padreId
 * @param {{ page?, limit?, estado? }} params
 */
export const entregasGetByPadre = (padreId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/entregas/padre/${padreId}${qs ? `?${qs}` : ""}`);
};

/**
 * Lista todas las entregas (incluidos borradores) del padre autenticado para una tarea.
 * padreId se toma del token.
 * ROL: Padre
 * @param {string} tareaId
 */
export const entregasGetMineByTarea = (tareaId) =>
  apiFetch(`/entregas/mis-entregas/${tareaId}`);

/**
 * Obtiene una entrega por ID.
 * Acceso controlado: padre dueño / docente / administrador.
 * ROL: Autenticado (con permisos)
 * @param {string} id
 */
export const entregasGetById = (id) => apiFetch(`/entregas/${id}`);

/**
 * Actualiza una entrega (solo si está en estado "borrador").
 * Los campos calificacion, tareaId y padreId son ignorados.
 * Si se cambia a "enviada" y la tarea venció → estado "tarde".
 * ROL: Padre dueño
 * @param {string} id
 * @param {FormData} formData Campos: textoRespuesta?, estado?, archivos (File[])
 */
export const entregasUpdate = (id, formData) =>
  apiFetchFormData(`/entregas/${id}`, {
    method: "PUT",
    body: formData,
  });

/**
 * Envía una entrega (de "borrador" a "enviada" o "tarde").
 * ROL: Padre dueño
 * @param {string} id
 * @returns {{ entrega, message }} + dispara ENTREGA_CREADA
 */
export const entregasEnviar = (id) =>
  apiFetch(`/entregas/${id}/enviar`, { method: "PATCH" });

/**
 * Califica una entrega. Si ya tiene calificación, la actualiza.
 * ROL: Docente
 * @param {string} id
 * @param {{ nota, comentario, docenteId }} body
 * @returns {{ entrega, esActualizacion }} + dispara ENTREGA_CALIFICADA
 */
export const entregasCalificar = (id, body) =>
  apiFetch(`/entregas/${id}/calificar`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

/**
 * Elimina permanentemente una entrega en estado "borrador" y sus archivos en Cloudinary.
 * ROL: Padre dueño
 * @param {string} id
 */
export const entregasDelete = (id) =>
  apiFetch(`/entregas/${id}`, { method: "DELETE" });

/**
 * Elimina un archivo adjunto de una entrega en estado "borrador".
 * ROL: Padre dueño
 * @param {string} entregaId
 * @param {string} archivoId
 */
export const entregasDeleteArchivo = (entregaId, archivoId) =>
  apiFetch(`/entregas/${entregaId}/archivos/${archivoId}`, {
    method: "DELETE",
  });

// ═══════════════════════════════════════════════════════════════
// 8. FOROS — /api/foros
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un foro dentro de un curso.
 * Los archivos con errores de validación se reportan como advertencias sin bloquear la creación.
 * ROL: Docente / Administrador
 * @param {FormData} formData
 *   Campos: titulo (req), descripcion (req), cursoId (req), publico?,
 *           archivos (File[], JPEG/PNG/GIF/WEBP ≤5MB | MP4/MOV/AVI ≤50MB | PDF ≤10MB)
 */
export const forosCreate = (formData) =>
  apiFetchFormData("/foros", {
    method: "POST",
    body: formData,
  });

/**
 * Lista foros de un curso.
 * Acceso: docente del curso, participantes o administrador.
 * ROL: Autenticado (con acceso al curso)
 * @param {string} cursoId
 * @returns {{ foros: [...] }}
 */
export const forosGetByCurso = (cursoId) =>
  apiFetch(`/foros/curso/${cursoId}`);

/**
 * Obtiene un foro por ID. Los administradores tienen acceso irrestricto.
 * ROL: Autenticado (con acceso al foro)
 * @param {string} id
 */
export const forosGetById = (id) => apiFetch(`/foros/${id}`);

export const forosDashboard = (id) => apiFetch(`/foros/${id}/dashboard`);

/**
 * Actualiza un foro (título, descripción, estado, publico).
 * ROL: Docente creador / Administrador
 * @param {string} id
 * @param {{ titulo?, descripcion?, estado?, publico? }} body
 */
export const forosUpdate = (id, body) =>
  apiFetch(`/foros/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Cambia el estado del foro (abierto | cerrado).
 * ROL: Docente creador / Administrador
 * @param {string} id
 * @param {{ estado: "abierto" | "cerrado" }} body
 */
export const forosCambiarEstado = (id, body) =>
  apiFetch(`/foros/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

/**
 * Elimina un foro y en cascada: archivos del foro → archivos de mensajes
 * → documentos MensajeForo → el foro. Eliminación permanente.
 * ROL: Docente creador / Administrador
 * @param {string} id
 */
export const forosDelete = (id) =>
  apiFetch(`/foros/${id}`, { method: "DELETE" });

// ═══════════════════════════════════════════════════════════════
// 9. MENSAJES DE FORO — /api/mensajes-foro
// ═══════════════════════════════════════════════════════════════

/**
 * Publica un mensaje en un foro.
 * Restricciones:
 *   - El foro debe estar abierto.
 *   - Los padres solo pueden responder a mensajes de docente/admin.
 *   - Solo un nivel de anidamiento (no se puede responder a una respuesta).
 * ROL: Autenticado (cualquier rol con acceso al foro)
 * @param {FormData} formData
 *   Campos: foroId (req), contenido (req), respuestaA?, archivos (File[], máx 5)
 */
export const mensajesForoCreate = (formData) =>
  apiFetchFormData("/mensajes-foro", {
    method: "POST",
    body: formData,
  });

/**
 * Lista mensajes principales de un foro con sus respuestas anidadas (árbol 2 niveles).
 * ROL: Autenticado (con acceso al foro)
 * @param {string} foroId
 * @returns {{ mensajes: [{ ...mensaje, respuestas: [...] }] }}
 */
export const mensajesForoGetByForo = (foroId) =>
  apiFetch(`/mensajes-foro/foro/${foroId}`);

/**
 * Toggle de like en un mensaje.
 * ROL: Autenticado (con acceso al foro del mensaje)
 * @param {string} id
 * @returns {{ message, likes: [...], yaLeDioLike: boolean }}
 */
export const mensajesForoToggleLike = (id) =>
  apiFetch(`/mensajes-foro/${id}/like`, { method: "POST" });

/**
 * Edita el contenido de un mensaje. Solo texto; los adjuntos no se pueden cambiar.
 * ROL: Autor del mensaje (el foro debe estar abierto)
 * @param {string} id
 * @param {{ contenido }} body
 */
export const mensajesForoUpdate = (id, body) =>
  apiFetch(`/mensajes-foro/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Elimina un mensaje y en cascada sus respuestas y archivos en Cloudinary. Permanente.
 * ROL: Autor del mensaje / Administrador
 * @param {string} id
 */
export const mensajesForoDelete = (id) =>
  apiFetch(`/mensajes-foro/${id}`, { method: "DELETE" });

// ═══════════════════════════════════════════════════════════════
// 10. EVENTOS — /api/eventos
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un evento de calendario.
 * Los docentes solo pueden crear eventos para sus propios cursos.
 * ROL: Administrador / Docente
 * @param {FormData} formData
 *   Campos: titulo (req), descripcion (req), fechaInicio (req), fechaFin (req),
 *           hora?, ubicacion?, cursosIds (req, mín 1), categoria?, adjunto (File)?
 * @returns {{ evento }} + dispara EVENTO_CREADO
 */
export const eventosCreate = (formData) =>
  apiFetchFormData("/eventos", {
    method: "POST",
    body: formData,
  });

/**
 * Lista eventos filtrados por rol:
 *   - docente: solo sus eventos
 *   - padre: eventos de sus cursos
 *   - administrador: todos
 * ROL: Autenticado (cualquier rol)
 * @param {{ page?, limit?, categoria?, estado?, cursoId? }} params
 */
export const eventosGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/eventos${qs ? `?${qs}` : ""}`);
};

/**
 * Devuelve los eventos del día actual (00:00 — 23:59). Aplica filtro por rol.
 * ROL: Autenticado (cualquier rol)
 * @returns {{ eventos: [...], total: N }}
 */
export const eventosGetHoy = () => apiFetch("/eventos/hoy");

/**
 * Obtiene un evento por ID.
 * Control de acceso: docente (solo los suyos) | padre (solo sus cursos) | admin (total).
 * ROL: Autenticado (con permisos)
 * @param {string} id
 */
export const eventosGetById = (id) => apiFetch(`/eventos/${id}`);

/**
 * Actualiza un evento. Acepta adjunto (File) para reemplazar el archivo en Cloudinary.
 * ROL: Administrador / Docente dueño
 * @param {string} id
 * @param {FormData} formData Campos actualizables (se ignoran _id, docenteId, fechaCreacion)
 */
export const eventosUpdate = (id, formData) =>
  apiFetchFormData(`/eventos/${id}`, {
    method: "PUT",
    body: formData,
  });

/**
 * Elimina un evento y su archivo adjunto en Cloudinary. Eliminación permanente.
 * ROL: Administrador / Docente dueño
 * @param {string} id
 */
export const eventosDelete = (id) =>
  apiFetch(`/eventos/${id}`, { method: "DELETE" });

// ═══════════════════════════════════════════════════════════════
// 11. NOTIFICACIONES — /api/notificaciones
// ═══════════════════════════════════════════════════════════════

/**
 * Crea y emite una notificación por WebSocket.
 * ROL: Autenticado (normalmente el sistema / backend; disponible para cualquier rol)
 * @param {{ usuarioId, titulo, mensaje, tipo, referenciaId }} body
 */
export const notificacionesCreate = (body) =>
  apiFetch("/notificaciones", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Lista notificaciones del usuario autenticado con paginación y filtros.
 * ROL: Autenticado (cualquier rol)
 * @param {{ page?, limit?, tipo?, leido? }} params
 * @returns {{ notificaciones[], pagination, noLeidas: N }}
 */
export const notificacionesGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/notificaciones${qs ? `?${qs}` : ""}`);
};

/**
 * Devuelve solo el conteo de notificaciones no leídas del usuario.
 * ROL: Autenticado (cualquier rol)
 * @returns {{ noLeidas: N }}
 */
export const notificacionesGetConteoNoLeidas = () =>
  apiFetch("/notificaciones/conteo-no-leidas");

/**
 * Obtiene una notificación por ID (solo si pertenece al usuario autenticado).
 * ROL: Autenticado (cualquier rol)
 * @param {string} id
 */
export const notificacionesGetById = (id) =>
  apiFetch(`/notificaciones/${id}`);

/**
 * Marca una notificación como leída.
 * ROL: Autenticado (cualquier rol)
 * @param {string} id
 * @returns {{ message, notificacion, noLeidas: N }}
 */
export const notificacionesMarcarLeida = (id) =>
  apiFetch(`/notificaciones/${id}/leer`, { method: "PATCH" });

/**
 * Marca múltiples notificaciones como leídas. Ignora IDs ajenos al usuario.
 * ROL: Autenticado (cualquier rol)
 * @param {{ notificacionIds: string[] }} body
 * @returns {{ message, modificadas: N, noLeidas: N }}
 */
export const notificacionesMarcarMultiplesLeidas = (body) =>
  apiFetch("/notificaciones/leer-multiples", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

/**
 * Marca todas las notificaciones no leídas del usuario como leídas.
 * ROL: Autenticado (cualquier rol)
 * @returns {{ message, modificadas: N, noLeidas: 0 }}
 */
export const notificacionesMarcarTodasLeidas = () =>
  apiFetch("/notificaciones/leer-todas", { method: "PATCH" });

/**
 * Elimina permanentemente una notificación propia.
 * ROL: Autenticado (cualquier rol)
 * @param {string} id
 * @returns {{ message, noLeidas: N }}
 */
export const notificacionesDelete = (id) =>
  apiFetch(`/notificaciones/${id}`, { method: "DELETE" });

/**
 * Elimina permanentemente notificaciones leídas con antigüedad mayor a `dias` días.
 * ROL: Autenticado (cualquier rol)
 * @param {{ dias?: number }} params  (default: 30)
 * @returns {{ message, eliminadas: N }}
 */
export const notificacionesLimpiarAntiguas = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(
    `/notificaciones/limpiar/antiguas${qs ? `?${qs}` : ""}`,
    { method: "DELETE" }
  );
};

// ═══════════════════════════════════════════════════════════════
// 12. PERFILES FAMILIARES — /api/perfiles
// ═══════════════════════════════════════════════════════════════

/**
 * Lista los perfiles familiares del titular autenticado.
 * ROL: Autenticado (padre / titular)
 * @returns {{ titular: { _id, nombre, avatarUrl, esTitular: true }, perfiles: [...] }}
 */
export const perfilesGetAll = () => apiFetch("/perfiles");

/**
 * Crea un nuevo perfil familiar. Máximo 5 perfiles por titular.
 * ROL: Autenticado (padre / titular)
 * @param {{ nombre, avatarUrl }} body
 */
export const perfilesCreate = (body) =>
  apiFetch("/perfiles", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Selecciona un perfil activo y devuelve un nuevo token JWT con perfilId embebido.
 * Pasar perfilId = null o "titular" activa el perfil principal.
 * ROL: Autenticado (padre / titular)
 * @param {{ perfilId: string | null | "titular" }} body
 * @returns {{ token, perfilActivo }}
 *
 * IMPORTANTE: guardar el nuevo token en localStorage tras esta llamada.
 */
export const perfilesSeleccionar = (body) =>
  apiFetch("/perfiles/seleccionar", {
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Actualiza nombre o avatar de un perfil familiar.
 * ROL: Autenticado (padre / titular)
 * @param {string} id
 * @param {{ nombre?, avatarUrl? }} body
 */
export const perfilesUpdate = (id, body) =>
  apiFetch(`/perfiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Desactiva un perfil familiar (soft delete — cambia activo a false).
 * ROL: Autenticado (padre / titular)
 * @param {string} id
 */
export const perfilesDelete = (id) =>
  apiFetch(`/perfiles/${id}`, { method: "DELETE" });

/**
 * Registra un token FCM para un perfil o el titular.
 * ROL: Autenticado (padre / titular)
 * @param {{ perfilId: string | null | "titular", fcmToken: string }} body
 */
export const perfilesUpdateFcmToken = (body) =>
  apiFetch("/perfiles/fcm-token", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ═══════════════════════════════════════════════════════════════
// 13. CALENDARIO — /api/calendario
// ═══════════════════════════════════════════════════════════════

/**
 * Vista mensual del calendario de un curso.
 * ROL: Autenticado (cualquier rol)
 * @param {string} cursoId
 * @param {{ mes?: number (1–12), anio?: number }} params
 * @returns {{ curso, items[], itemsAgrupados,
 *             estadisticas: { totalTareas, totalEventos, tareasVencidas, eventosProximos } }}
 */
export const calendarioGetByCurso = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/calendario/${cursoId}${qs ? `?${qs}` : ""}`);
};

/**
 * Eventos y tareas de un día específico en un curso.
 * ROL: Autenticado (cualquier rol)
 * @param {string} cursoId
 * @param {{ fecha: string }} params  Formato: YYYY-MM-DD (requerido)
 * @returns {{ tareas: [...], eventos: [...] }}
 */
export const calendarioGetDia = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/calendario/${cursoId}/dia${qs ? `?${qs}` : ""}`);
};

/**
 * Próximos eventos y tareas de un curso.
 * ROL: Autenticado (cualquier rol)
 * @param {string} cursoId
 * @param {{ limite?: number }} params  (default: 10)
 * @returns {{ proximosEventos: [{ id, tipo, titulo, fecha, modulo, categoria }] }}
 */
export const calendarioGetProximos = (cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(
    `/calendario/${cursoId}/proximos${qs ? `?${qs}` : ""}`
  );
};

// ═══════════════════════════════════════════════════════════════
// RESUMEN DE ROLES POR MÓDULO
// ═══════════════════════════════════════════════════════════════
//
//  superadmin  → institucionesCreate, institucionesGetAll, institucionesUpdate
//
//  administrador → cursosCreate, cursosGetAll, cursosGetParticipantes,
//                  cursosUpdate, cursosDelete, cursosAddParticipante,
//                  cursosRemoveParticipante, cursosAddParticipantesCsv,
//                  forosCreate, forosCambiarEstado, forosDelete,
//                  mensajesForoDelete, eventosCreate, eventosUpdate,
//                  eventosDelete, usersCreate, usersGetAll, usersGetById,
//                  usersUpdate, usersDelete, institucionesGetMine,
//                  institucionesCreateDocente, institucionesCreateDocentesCsv
//
//  docente     → cursosCreate, cursosUpdate, cursosDelete, cursosGetAll,
//                cursosGetParticipantes, cursosAddParticipante,
//                cursosRemoveParticipante, cursosAddParticipantesCsv,
//                modulosCreate, modulosUpdate, modulosDelete, modulosRestore,
//                tareasCreate, tareasUpdate, tareasCerrar, tareasDelete,
//                entregasCalificar, forosCreate, forosCambiarEstado,
//                forosDelete, eventosCreate, eventosUpdate, eventosDelete
//
//  padre       → cursosGetMine, cursosAddParticipante,
//                tareasGetAll, entregasCreate, entregasUpdate, entregasEnviar,
//                entregasGetMineByTarea, entregasDelete, entregasDeleteArchivo,
//                perfilesGetAll, perfilesCreate, perfilesSeleccionar,
//                perfilesUpdate, perfilesDelete, perfilesUpdateFcmToken
//
//  todos (autenticado) → authGetProfile, authChangePassword, authLogout,
//                        usersGetMyProfile, usersUpdateMyPhoto,
//                        usersGetDefaultPhotos, usersUpdateFcmToken,
//                        cursosGetById, modulosGetAll, modulosGetByCurso,
//                        modulosGetById, tareasGetById, entregasGetAll,
//                        entregasGetByTarea, entregasGetByPadre, entregasGetById,
//                        forosGetByCurso, forosGetById, forosUpdate,
//                        mensajesForoCreate, mensajesForoGetByForo,
//                        mensajesForoToggleLike, mensajesForoUpdate,
//                        eventosGetAll, eventosGetHoy, eventosGetById,
//                        notificacionesCreate, notificacionesGetAll,
//                        notificacionesGetConteoNoLeidas, notificacionesGetById,
//                        notificacionesMarcarLeida, notificacionesMarcarMultiplesLeidas,
//                        notificacionesMarcarTodasLeidas, notificacionesDelete,
//                        notificacionesLimpiarAntiguas,
//                        calendarioGetByCurso, calendarioGetDia, calendarioGetProximos
//
// ═══════════════════════════════════════════════════════════════
// BUZÓN DE CONTACTO — /api/buzon
// ═══════════════════════════════════════════════════════════════

/**
 * Envía un mensaje de contacto desde la landing page.
 * Pública (sin auth). Rate-limited: 3 envíos por IP / 15 min.
 * @param {{ nombre, correo, telefono, institucion?, mensaje }} body
 */
export const buzonEnviar = (body) =>
  apiFetch("/buzon", { method: "POST", body: JSON.stringify(body) });

/**
 * Lista todos los mensajes recibidos.
 * ROL: superadmin
 * @param {{ page?, limit?, leido? }} params
 */
export const buzonGetAll = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/buzon${qs ? `?${qs}` : ""}`);
};

/**
 * Marca un mensaje como leído.
 * ROL: superadmin
 * @param {string} id
 */
export const buzonMarcarLeido = (id) =>
  apiFetch(`/buzon/${id}/leido`, { method: "PATCH" });

//  público     → authRegister, authLogin, authForgotPassword, authResetPassword
// ═══════════════════════════════════════════════════════════════