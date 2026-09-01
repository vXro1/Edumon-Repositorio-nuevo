// el orden debe coincidir exactamente con el parseo por posición del backend —
// cambiarlo sin tocar el backend desalinea los datos silenciosamente
export const CSV_COLUMNAS_DOCENTES = ["nombre", "apellido", "telefono", "cedula"];

const FILAS_EJEMPLO = [
  ["María",  "González", "3001234567", "1020304050"],
  ["Carlos", "Ramírez",  "3009876543", "1098765432"],
  ["Ana",    "Torres",   "3012223344", "1122334455"],
];

export function descargarPlantillaDocentesCSV() {
  const filas = [CSV_COLUMNAS_DOCENTES, ...FILAS_EJEMPLO];
  const csvContent = filas.map((fila) => fila.join(",")).join("\r\n");

  // BOM UTF-8: sin esto, Excel en Windows muestra mal tildes y "ñ"
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla_docentes.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}