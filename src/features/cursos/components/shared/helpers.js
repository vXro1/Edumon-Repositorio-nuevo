// src/features/cursos/components/shared/helpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Helpers de formato y normalización compartidos entre tabs
// ─────────────────────────────────────────────────────────────────────────────

export function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtHour(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtRelative(date) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? "s" : ""}`;
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays <= 7) return `En ${diffDays} días`;
  return fmt(date);
}

export const getAutor = (m) =>
  m?.usuarioId ?? m?.autor ?? m?.autorId ?? m?.user ?? m?.usuario ?? null;

export const getNombre = (autor) => {
  if (!autor) return "Usuario";
  if (typeof autor === "string") return "Usuario";
  return `${autor?.nombre ?? ""} ${autor?.apellido ?? ""}`.trim() || autor?.email || "Usuario";
};

export const getAvatar = (autor) => {
  if (!autor || typeof autor === "string") return null;
  return autor?.fotoPerfilUrl ?? autor?.avatar ?? null;
};

export const isMine = (m, userId) => {
  const autor = getAutor(m);
  const id = typeof autor === "string" ? autor : autor?._id;
  return id && userId && String(id) === String(userId);
};

export const esPasada = (fecha) => fecha && new Date(fecha) < new Date();

/** Hook factory: notificaciones toast de 3 s */
export function makeNotify(setToast) {
  return (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };
}