// src/utils/xlsxWriter.js
//
// Generador mínimo de archivos .xlsx en el navegador, sin dependencias
// externas. El backend dejó de aceptar CSV en las cargas masivas y ahora
// exige Excel (.xlsx/.xlsm) — las plantillas descargables deben ser un
// .xlsx real, no un .csv renombrado (Excel/el backend lo rechazarían).
//
// Construye un ZIP OOXML válido con compresión "stored" (sin comprimir):
// es spec-compliant y lo abren tanto Excel como cualquier parser de xlsx
// en el backend (exceljs, openpyxl, SheetJS, etc). Todas las celdas se
// escriben como texto (inlineStr) para que cédula/teléfono conserven
// ceros a la izquierda, tal como recomienda el backend.
//
// Además aplica un estilo visual: encabezado en negrita, blanco, con un
// color distinto por columna; filas de datos con bordes suaves y
// "zebra striping"; ancho de columna calculado según el contenido; y
// la fila de encabezado congelada. Puramente cosmético — el backend solo
// lee valores de celda, nunca estilos, así que esto no afecta el parseo.

function crc32(bytes) {
  let table = crc32._table;
  if (!table) {
    table = crc32._table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const enc = (s) => new TextEncoder().encode(s);
const u16 = (n) => [n & 0xff, (n >> 8) & 0xff];
const u32 = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];

function buildZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const nameBytes = enc(name);
    const crc = crc32(data);
    const header = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0),
    ]);
    chunks.push(header, nameBytes, data);

    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0),
      ...u32(offset),
    ]));
    central.push(nameBytes);

    offset += header.length + nameBytes.length + data.length;
  }

  const centralStart = offset;
  const centralSize = central.reduce((a, c) => a + c.length, 0);

  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0),
  ]);

  const total = new Uint8Array(offset + centralSize + end.length);
  let p = 0;
  for (const c of chunks) { total.set(c, p); p += c.length; }
  for (const c of central) { total.set(c, p); p += c.length; }
  total.set(end, p);
  return total;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Estilo visual ────────────────────────────────────────────────────────
// Un color de encabezado distinto por columna (se repite en ciclo si hay
// más columnas que colores) — más fácil de leer/rellenar que un encabezado
// de un solo color plano.
const HEADER_PALETTE = ["2563EB", "7C3AED", "059669", "D97706", "DB2777", "0891B2"];
const HEADER_FONT_COLOR = "FFFFFFFF";
const TEXT_COLOR = "FF1F2937";
const ZEBRA_FILL = "FFF3F4F6";
const BORDER_COLOR = "FFD1D5DB";
const HEADER_ROW_HEIGHT = 22;

function buildStylesXml(numCols) {
  const headerColorCount = Math.min(numCols, HEADER_PALETTE.length);

  const fonts = [
    `<font><sz val="11"/><color rgb="${TEXT_COLOR}"/><name val="Calibri"/></font>`,
    `<font><b/><sz val="11"/><color rgb="${HEADER_FONT_COLOR}"/><name val="Calibri"/></font>`,
  ];

  // fillId 0 y 1 están reservados por convención OOXML (none / gray125),
  // aunque aquí no se referencien — los parsers estrictos los esperan ahí.
  const fills = [
    `<fill><patternFill patternType="none"/></fill>`,
    `<fill><patternFill patternType="gray125"/></fill>`,
    ...HEADER_PALETTE.slice(0, headerColorCount).map(
      (hex) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${hex}"/><bgColor indexed="64"/></patternFill></fill>`
    ),
    `<fill><patternFill patternType="solid"><fgColor rgb="${ZEBRA_FILL}"/><bgColor indexed="64"/></patternFill></fill>`,
  ];
  const zebraFillId = fills.length - 1;

  const borders = [
    `<border><left/><right/><top/><bottom/><diagonal/></border>`,
    `<border><left style="thin"><color rgb="${BORDER_COLOR}"/></left><right style="thin"><color rgb="${BORDER_COLOR}"/></right><top style="thin"><color rgb="${BORDER_COLOR}"/></top><bottom style="thin"><color rgb="${BORDER_COLOR}"/></bottom><diagonal/></border>`,
  ];

  // cellXfs: 0 = default (requerido); 1..headerColorCount = encabezado por
  // columna (uno por color); luego 2 índices más para filas de datos
  // (normal / zebra).
  const cellXfs = [
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`,
    ...Array.from({ length: headerColorCount }, (_, i) =>
      `<xf numFmtId="0" fontId="1" fillId="${2 + i}" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>`
    ),
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>`,
    `<xf numFmtId="0" fontId="0" fillId="${zebraFillId}" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>`,
  ];
  const dataNormalXfId = 1 + headerColorCount;
  const dataZebraXfId = dataNormalXfId + 1;

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="${fonts.length}">${fonts.join("")}</fonts>` +
    `<fills count="${fills.length}">${fills.join("")}</fills>` +
    `<borders count="${borders.length}">${borders.join("")}</borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="${cellXfs.length}">${cellXfs.join("")}</cellXfs>` +
    `</styleSheet>`;

  return { xml, headerColorCount, dataNormalXfId, dataZebraXfId };
}

// Ancho de columna aproximado (en "caracteres", unidad que usa OOXML) según
// el contenido más largo de esa columna — así ninguna columna queda
// truncada ni absurdamente ancha.
function computeColWidths(rows) {
  const numCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const widths = new Array(numCols).fill(0);
  for (const row of rows) {
    row.forEach((val, c) => {
      const len = String(val ?? "").length;
      if (len > widths[c]) widths[c] = len;
    });
  }
  return widths.map((len) => Math.max(10, Math.min(40, len + 4)));
}

function buildSheetXml(rows, { dataNormalXfId, dataZebraXfId, colWidths }) {
  const colsXml = `<cols>${colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("")}</cols>`;

  const rowsXml = rows.map((row, r) => {
    const isHeader = r === 0;
    const rowStyleId = isHeader ? null : (r % 2 === 0 ? dataZebraXfId : dataNormalXfId);
    const cells = row.map((val, c) => {
      const ref = `${String.fromCharCode(65 + c)}${r + 1}`;
      const styleId = isHeader ? (c % HEADER_PALETTE.length) + 1 : rowStyleId;
      return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t xml:space="preserve">${esc(val)}</t></is></c>`;
    }).join("");
    const heightAttr = isHeader ? ` ht="${HEADER_ROW_HEIGHT}" customHeight="1"` : "";
    return `<row r="${r + 1}"${heightAttr}>${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    colsXml +
    `<sheetData>${rowsXml}</sheetData></worksheet>`;
}

/**
 * Construye los bytes de un .xlsx a partir de una matriz de filas (arrays de
 * strings). La primera fila se trata siempre como encabezado: se estiliza
 * en negrita/blanco con un color distinto por columna, con la fila
 * congelada; el resto de filas llevan bordes suaves y franjas alternadas
 * ("zebra"). El ancho de cada columna se calcula según su contenido.
 * @param {string[][]} rows
 * @param {string} [sheetName]
 * @returns {Uint8Array}
 */
export function buildXlsxBytes(rows, sheetName = "Hoja1") {
  const numCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const { xml: styles, dataNormalXfId, dataZebraXfId } = buildStylesXml(numCols);
  const colWidths = computeColWidths(rows);

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const entries = [
    { name: "[Content_Types].xml", data: enc(contentTypes) },
    { name: "_rels/.rels", data: enc(rootRels) },
    { name: "xl/workbook.xml", data: enc(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: enc(workbookRels) },
    { name: "xl/styles.xml", data: enc(styles) },
    { name: "xl/worksheets/sheet1.xml", data: enc(buildSheetXml(rows, { dataNormalXfId, dataZebraXfId, colWidths })) },
  ];

  return buildZip(entries);
}

/**
 * Genera y descarga un .xlsx en el navegador a partir de una matriz de filas.
 * @param {string[][]} rows
 * @param {string} filename
 * @param {string} [sheetName]
 */
export function descargarXlsx(rows, filename, sheetName) {
  const bytes = buildXlsxBytes(rows, sheetName);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
