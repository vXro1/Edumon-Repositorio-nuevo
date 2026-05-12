// src/lib/normalizers/user.js

/**
 * Normaliza un usuario individual
 * Compatible con backend parcial, frontend-only o datos enriquecidos
 */
export function normalizeUser(user) {
  // Usuario vacío / fallback seguro
  if (!user) {
    return {
      id: null,
      _id: null,

      // Básico
      nombre: "Sin nombre",
      apellido: "",
      nombreCompleto: "Sin nombre",

      // Perfil
      avatar: null,
      fotoPerfilUrl: null,

      // Contacto
      email: "",
      correo: "",
      telefono: "",
      cedula: "",

      // Sistema
      rol: "desconocido",
      estado: "activo",

      // Fechas
      fechaRegistro: null,
      ultimoAcceso: null,
      createdAt: null,
      updatedAt: null,

      // Extras
      preferencias: {},
      direccion: "",
      ciudad: "",
      pais: "",
    };
  }

  const id =
    user._id ||
    user.id ||
    null;

  // Email unificado
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