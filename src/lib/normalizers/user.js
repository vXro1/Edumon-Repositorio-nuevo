// src/lib/normalizers/user.js

/**
 * Normaliza un usuario individual
 * Compatible con backend parcial, frontend-only o datos enriquecidos
 */
export function normalizeUser(user) {
  // Usuario vacío / fallback seguro
  // Debe mantener el MISMO shape que el objeto normal — cualquier campo
  // omitido aquí puede causar un crash silencioso (ej. usuario.cursos.length)
  // en componentes que no verifican existencia antes de usarlo.
  if (!user) {
    return {
      id: null,
      _id: null,

      // Básico
      nombre: "Sin nombre",
      apellido: "",
      nombreCompleto: "Sin nombre",

      // Sistema
      rol: "desconocido",
      estado: "activo",

      // Perfil
      avatar: null,
      fotoPerfilUrl: null,
      genero: null,
      fechaNacimiento: null,

      // Contacto
      email: "",
      correo: "",
      cedula: "",
      telefono: "",
      direccion: "",
      ciudad: "",
      pais: "",

      // Académico / institucional
      codigoEstudiante: "",
      grado: null,
      curso: null,

      // Seguridad / sesión
      ultimoAcceso: null,
      primerInicioSesion: false,

      // Fechas
      fechaRegistro: null,
      createdAt: null,
      updatedAt: null,

      // Configuración
      preferencias: {},

      // Relaciones opcionales
      hijos: [],
      cursos: [],
      permisos: [],
    };
  }

  const id =
    user._id ||
    user.id ||
    null;

  // Correo unificado
  const emailVal =
    user.correo ||
    user.email ||
    "";

  // Avatar / foto
  const avatarUrl =
    user.fotoPerfilUrl ||
    user.avatarUrl ||
    user.avatar ||
    user.foto ||
    null;

  // Nombre completo
  const nombre =
    user.nombre ||
    "Sin nombre";

  const apellido =
    user.apellido ||
    "";

  const nombreCompleto =
    `${nombre} ${apellido}`.trim();

  return {
    // IDs
    id,
    _id: id,

    // Básico
    nombre,
    apellido,
    nombreCompleto,

    // Sistema
    rol:
      user.rol ||
      "desconocido",

    estado:
      user.estado ||
      "activo",

    // Perfil
    avatar: avatarUrl,
    fotoPerfilUrl: avatarUrl,

    genero:
      user.genero ||
      null,

    fechaNacimiento:
      user.fechaNacimiento ||
      null,

    // Contacto
    email: emailVal,
    correo: emailVal,

    cedula:
      user.cedula ||
      "",

    telefono:
      user.telefono ||
      "",

    direccion:
      user.direccion ||
      "",

    ciudad:
      user.ciudad ||
      "",

    pais:
      user.pais ||
      "",

    // Académico / institucional
    codigoEstudiante:
      user.codigoEstudiante ||
      "",

    grado:
      user.grado ||
      null,

    curso:
      user.curso ||
      null,

    // Seguridad / sesión
    ultimoAcceso:
      user.ultimoAcceso ||
      null,

    primerInicioSesion: !!user.primerInicioSesion,

    // Fechas
    fechaRegistro:
      user.fechaRegistro ||
      user.createdAt ||
      null,

    createdAt:
      user.createdAt ||
      null,

    updatedAt:
      user.updatedAt ||
      null,

    // Configuración
    preferencias:
      typeof user.preferencias === "object" &&
      user.preferencias !== null
        ? user.preferencias
        : {},

    // Relaciones opcionales
    hijos:
      Array.isArray(user.hijos)
        ? user.hijos
        : [],

    cursos:
      Array.isArray(user.cursos)
        ? user.cursos
        : [],

    permisos:
      Array.isArray(user.permisos)
        ? user.permisos
        : [],
  };
}

/**
 * Normaliza múltiples usuarios
 */
export function normalizeUsers(users) {
  if (!Array.isArray(users)) return [];
  return users
    .map(normalizeUser)
    .filter(Boolean);
}

/**
 * Convierte usuarios a mapa por ID
 */
export function normalizeUsersMap(users) {
  return normalizeUsers(users).reduce(
    (acc, user) => {
      acc[user.id] = user;
      return acc;
    },
    {}
  );
}