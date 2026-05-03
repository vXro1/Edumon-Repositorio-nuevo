export function normalizeUser(user) {
  if (!user) {
    return {
      id: null,
      _id: null,
      nombre: "Sin nombre",
      apellido: "",
      avatar: null,
      fotoPerfilUrl: null,
      rol: "desconocido",
      email: "",
      correo: "",
      cedula: "",
      telefono: "",
      estado: "activo",
    };
  }

  const id = user._id || user.id;
  const emailVal = user.correo || user.email || "";
  const avatarUrl = user.fotoPerfilUrl || user.avatarUrl || null;

  return {
    id,
    _id: id,
    nombre: user.nombre || "Sin nombre",
    apellido: user.apellido || "",
    rol: user.rol || "desconocido",
    avatar: avatarUrl,
    fotoPerfilUrl: avatarUrl,
    email: emailVal,
    correo: emailVal,
    cedula: user.cedula || "",
    telefono: user.telefono || "",
    estado: user.estado || "activo",
  };
}
