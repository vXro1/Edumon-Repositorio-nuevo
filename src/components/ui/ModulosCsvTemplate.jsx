// plantilla CSV para creación masiva de módulos — mismo patrón que PadresCsvTemplate
const COLUMNAS = ["titulo", "descripcion"];

const EJEMPLOS = [
  ["Introducción al curso",   "Conceptos básicos y bienvenida"],
  ["Fundamentos",             "Bases teóricas del área"],
  ["Práctica guiada",         "Ejercicios con acompañamiento docente"],
];

export function generarContenidoCsvModulos() {
  const encabezado = COLUMNAS.join(",");
  const filas = EJEMPLOS.map((fila) => fila.map((v) => `"${v}"`).join(","));
  // BOM UTF-8 → Excel en Windows lo detecta correctamente
  return "\uFEFF" + [encabezado, ...filas].join("\r\n");
}

export function descargarPlantillaModulosCSV(filename = "plantilla_modulos.csv") {
  const contenido = generarContenidoCsvModulos();
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

// parsea un File CSV a [{ titulo, descripcion }]; lanza si falta la columna "titulo"
export async function parsearCsvModulos(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Eliminar BOM si existe
        const text = e.target.result.replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          reject(new Error("El archivo no contiene datos además del encabezado."));
          return;
        }

        // Parseo simple de CSV (soporta valores entre comillas)
        const parseLine = (line) =>
          line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((v) =>
            v.replace(/^"|"$/g, "").trim()
          ) ?? [];

        const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
        const tituloIdx = headers.indexOf("titulo");
        const descIdx   = headers.indexOf("descripcion");

        if (tituloIdx === -1) {
          reject(new Error('El CSV debe tener una columna llamada "titulo".'));
          return;
        }

        const rows = lines.slice(1).map((line, i) => {
          const cols = parseLine(line);
          return {
            _fila: i + 2, // número de fila real (para mensajes de error)
            titulo:      cols[tituloIdx] ?? "",
            descripcion: descIdx !== -1 ? (cols[descIdx] ?? "") : "",
          };
        });

        resolve(rows);
      } catch (err) {
        reject(new Error("No se pudo leer el archivo: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsText(file, "UTF-8");
  });
}

// ─── Componente botón ─────────────────────────────────────────────────────────
const DOWNLOAD_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function ModulosCsvTemplateButton({
  label    = "Descargar plantilla CSV",
  filename = "plantilla_modulos.csv",
  style    = {},
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={() => descargarPlantillaModulosCSV(filename)}
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8,
        border: "1px solid var(--color-border-tertiary, #e5e7eb)",
        background: "var(--color-background-primary, #fff)",
        color: "var(--color-text-info, #2563eb)",
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background    = "var(--color-background-info, #eff6ff)";
        e.currentTarget.style.borderColor   = "var(--color-text-info, #2563eb)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background    = "var(--color-background-primary, #fff)";
        e.currentTarget.style.borderColor   = "var(--color-border-tertiary, #e5e7eb)";
      }}
    >
      {DOWNLOAD_ICON}
      {label}
    </button>
  );
}

export { COLUMNAS as CSV_COLUMNAS_MODULOS };