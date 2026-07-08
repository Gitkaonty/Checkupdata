// ─────────────────────────────────────────────────────────────────────────────
// Style Kaonty pour les exports Excel (ExcelJS).
// Applique, sur un worksheet déjà rempli, l'habillage standard Kaonty :
//   • Titres (lignes avant l'en-tête) : 1re ligne = titre teal gras centré,
//     lignes suivantes (dossier / période) = gris italique.
//   • En-têtes de tableau : fond teal + texte blanc gras centré (les fonds
//     d'en-tête hétérogènes des différents contrôleurs sont unifiés).
//   • Bordures fines sur les cellules de données.
// Idempotent : peut être appliqué plusieurs fois sans dommage.
// ─────────────────────────────────────────────────────────────────────────────

const TEAL = 'FF0E7C86';
const GRID_THIN = { style: 'thin', color: { argb: 'FFD9E2E5' } };
const GRID_BORDERS = { top: GRID_THIN, left: GRID_THIN, bottom: GRID_THIN, right: GRID_THIN };
// Fonds d'en-tête utilisés par les différents contrôleurs → tous ramenés au teal.
const HEADER_FILL_ARGBS = new Set(['FFE8EEF7', 'FF4472C4', 'FF0E7C86']);

const isSlaveCell = (cell) => cell.isMerged && cell.master && cell.master.address !== cell.address;

const cellFillArgb = (cell) => {
  const f = cell.fill;
  return f && f.type === 'pattern' && f.fgColor && f.fgColor.argb
    ? String(f.fgColor.argb).toUpperCase() : null;
};

function applyKaontyStyle(ws) {
  if (!ws) return ws;

  // 1) Repérer la 1re ligne d'en-tête (fond d'en-tête connu).
  let headerRowNo = null;
  ws.eachRow({ includeEmpty: false }, (row, rn) => {
    if (headerRowNo) return;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (headerRowNo) return;
      const argb = cellFillArgb(cell);
      if (argb && HEADER_FILL_ARGBS.has(argb)) headerRowNo = rn;
    });
  });

  // 2) Titres (lignes situées avant l'en-tête) au style Kaonty.
  let titleDone = false;
  ws.eachRow({ includeEmpty: false }, (row, rn) => {
    if (headerRowNo && rn >= headerRowNo) return;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (isSlaveCell(cell)) return;
      const v = cell.value;
      if (v === null || v === undefined || v === '') return;
      if (!titleDone) {
        cell.font = { bold: true, size: 16, color: { argb: TEAL } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleDone = true;
      } else {
        cell.font = { italic: true, size: 12, color: { argb: 'FF555555' }, bold: !!(cell.font && cell.font.bold) };
        if (!cell.alignment) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  // 3) En-têtes de tableau → fond teal + texte blanc gras ; bordures sur les données.
  ws.eachRow({ includeEmpty: false }, (row) => {
    let touched = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      const argb = cellFillArgb(cell);
      if (argb && HEADER_FILL_ARGBS.has(argb)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
        cell.font = { ...(cell.font || {}), bold: true, color: { argb: 'FFFFFFFF' } };
        if (!cell.alignment) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        touched = true;
      }
      const v = cell.value;
      if (!cell.isMerged && v !== null && v !== undefined && v !== '') {
        cell.border = GRID_BORDERS;
      }
    });
    if (touched) row.height = 20;
  });

  return ws;
}

// Applique le style à tous les onglets d'un classeur (option : onglets à ignorer).
function applyKaontyStyleToWorkbook(workbook, { skip = [] } = {}) {
  const skipSet = new Set(skip);
  workbook.worksheets.forEach((ws) => {
    if (skipSet.has(ws.name)) return;
    try { applyKaontyStyle(ws); } catch (_) { /* ne jamais casser l'export pour un souci de style */ }
  });
  return workbook;
}

module.exports = { applyKaontyStyle, applyKaontyStyleToWorkbook, HEADER_FILL_ARGBS };
