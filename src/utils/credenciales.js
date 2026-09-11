// contraseña inicial de cualquier usuario creado desde el panel: siempre la cédula.
// el frontend nunca la manda, deja que el backend la asigne
export function contrasenaInicial(cedula) {
  return String(cedula ?? "").trim();
}

export const TEXTO_CONTRASENA_INICIAL =
  "La contraseña inicial es la cédula del usuario. Se le pedirá cambiarla en su primer ingreso.";

export const TEXTO_CONTRASENA_INICIAL_CORTO =
  "Contraseña inicial: la cédula del usuario.";

export const CEDULA_REGEX = /^\d{6,10}$/;

export const CEDULA_ERROR = "La cédula debe tener entre 6 y 10 dígitos numéricos";

export function toCedula(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

export function isValidCedula(value) {
  return CEDULA_REGEX.test(String(value ?? "").trim());
}

// contraseña nueva: mismas reglas que el backend — 6-128 caracteres, mayúscula, minúscula, número
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;

export const PASSWORD_RULES = [
  { label: `${PASSWORD_MIN}+ caracteres`, test: (p) => p.length >= PASSWORD_MIN },
  { label: "Mayúscula",                   test: (p) => /[A-Z]/.test(p) },
  { label: "Minúscula",                   test: (p) => /[a-z]/.test(p) },
  { label: "Número",                      test: (p) => /\d/.test(p) },
];

export const TEXTO_REQUISITOS_CONTRASENA =
  "Mínimo 6 caracteres, con al menos una mayúscula, una minúscula y un número.";

export function validarContrasenaNueva(value) {
  const pw = String(value ?? "");
  if (!pw)                    return "La contraseña es requerida";
  if (pw.length < PASSWORD_MIN) return `Mínimo ${PASSWORD_MIN} caracteres`;
  if (pw.length > PASSWORD_MAX) return `Máximo ${PASSWORD_MAX} caracteres`;
  if (!/[A-Z]/.test(pw))      return "Debe contener al menos una mayúscula";
  if (!/[a-z]/.test(pw))      return "Debe contener al menos una minúscula";
  if (!/\d/.test(pw))         return "Debe contener al menos un número";
  return null;
}
