// src/components/ui/DocentesCsvTemplate.js
import { descargarXlsx } from "@/utils/xlsxWriter";

// El orden de estas columnas DEBE coincidir exactamente con el array
// `headers` fijo por posición que usa el parser de Excel en el backend
// (preregistrarDocentesExcel): ['nombre', 'apellido', 'telefono', 'cedula'].
// El backend NO lee correo del archivo — lo genera automáticamente como
// `${cedula}@temp.com`. Si cambias el orden aquí sin cambiar el backend,
// los datos se desalinean silenciosamente (ej. el teléfono se guarda
// como si fuera cédula).
export const CSV_COLUMNAS_DOCENTES = ["nombre", "apellido", "telefono", "cedula"];

const FILAS_EJEMPLO = [
  ["María",  "González", "3001234567", "1020304050"],
  ["Carlos", "Ramírez",  "3009876543", "1098765432"],
  ["Ana",    "Torres",   "3012223344", "1122334455"],
];

// El backend ya no acepta CSV: exige .xlsx/.xlsm (máx 5MB), con cedula y
// telefono idealmente como Texto para no perder ceros a la izquierda —
// por eso la plantilla se genera como Excel real, no como texto plano.
export function descargarPlantillaDocentesCSV() {
  const filas = [CSV_COLUMNAS_DOCENTES, ...FILAS_EJEMPLO];
  descargarXlsx(filas, "plantilla_docentes.xlsx", "Docentes");
}
