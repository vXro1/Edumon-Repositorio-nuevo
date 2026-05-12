// src/components/ui/PadresCsvTemplate.jsx  (también exportable como util puro)
//
// Genera y descarga la plantilla CSV para registro masivo de padres de familia.
// Se puede usar de dos formas:
//
//   1. Como función utilitaria pura (sin React):
//      import { descargarPlantillaPadresCSV } from "./PadresCsvTemplate";
//      descargarPlantillaPadresCSV();
//
//   2. Como componente botón listo para usar:
//      import PadresCsvTemplateButton from "./PadresCsvTemplate";
//      <PadresCsvTemplateButton />
//
// Columnas según el endpoint POST /cursos/:id/usuarios-masivo:
//   nombre, apellido, telefono, cedula
//
// La plantilla incluye:
//   - Fila de encabezados (requerida por el backend)
//   - 3 filas de ejemplo comentadas con datos ficticios colombianos
//   - BOM UTF-8 para compatibilidad con Excel en Windows

const COLUMNAS = ["nombre", "apellido", "telefono", "cedula"];

const EJEMPLOS = [
  ["María", "González Ruiz", "3101234567", "52345678"],
  ["Carlos", "Martínez López", "3209876543", "79876543"],
  ["Lucía", "Ramírez Torres", "3155551234", "43210987"],
];

/**
 * Genera el contenido CSV como string con BOM UTF-8.
 * @returns {string}
 */
export function generarContenidoCsvPadres() {
  const encabezado = COLUMNAS.join(",");
  const filas = EJEMPLOS.map((fila) =>
    fila.map((v) => `"${v}"`).join(",")
  );
  // BOM UTF-8 (\uFEFF) → Excel en Windows lo detecta correctamente
  return "\uFEFF" + [encabezado, ...filas].join("\r\n");
}

/**
 * Descarga la plantilla CSV directamente en el navegador.
 * @param {string} [filename="plantilla_padres.csv"]
 */
export function descargarPlantillaPadresCSV(filename = "plantilla_padres.csv") {
  const contenido = generarContenidoCsvPadres();
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Componente botón (uso opcional) ─────────────────────────────────────────
const DOWNLOAD_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/**
 * Botón reutilizable que descarga la plantilla al hacer clic.
 *
 * Props:
 *   label     {string}  Texto del botón
 *   filename  {string}  Nombre del archivo descargado
 *   style     {object}  Estilos adicionales inline
 *   className {string}  Clase CSS adicional
 */
export default function PadresCsvTemplateButton({
  label = "Descargar plantilla CSV",
  filename = "plantilla_padres.csv",
  style = {},
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={() => descargarPlantillaPadresCSV(filename)}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 8,
        border: "1px solid var(--color-border-tertiary, #e5e7eb)",
        background: "var(--color-background-primary, #fff)",
        color: "var(--color-text-info, #2563eb)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-background-info, #eff6ff)";
        e.currentTarget.style.borderColor = "var(--color-text-info, #2563eb)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-background-primary, #fff)";
        e.currentTarget.style.borderColor = "var(--color-border-tertiary, #e5e7eb)";
      }}
    >
      {DOWNLOAD_ICON}
      {label}
    </button>
  );
}

// ─── Constantes exportadas por si otros módulos las necesitan ────────────────
export { COLUMNAS as CSV_COLUMNAS_PADRES };