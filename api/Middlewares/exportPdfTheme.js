// Thème et helpers communs pour les exports PDF (pdfmake) — charte verte Checkupdata
const THEME = {
  green: '#0E7C86',
  greenDark: '#0A5D65',
  ink: '#0E2733',
  text: '#16202B',
  muted: '#6A7785',
  faint: '#9AA6B2',
  soft: '#F6FAF9',
  softGreen: '#E2F0F1',
  totalGreen: '#CFE6E4',
  line: '#E2E6EA',
  separator: '#B9D6D1',
  zebra: '#EFF7F4',
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Largeur utile du contenu selon l'orientation (marges latérales 15 + 15)
const contentWidth = (orientation) => (orientation === 'landscape' ? 811 : 565);

// Libellé lisible d'un exercice (le modèle n'a pas de champ « libelle » : on compose
// le rang + la période). Évite d'afficher l'ID brut dans les en-têtes d'export.
function exerciceLabel(exercice) {
  if (!exercice) return '';
  const d1 = formatDate(exercice.date_debut);
  const d2 = formatDate(exercice.date_fin);
  const rang = exercice.libelle_rang ? `${exercice.libelle_rang} : ` : '';
  if (d1 && d2) return `${rang}${d1} – ${d2}`;
  return exercice.libelle_rang || '';
}

/**
 * En-tête de document :
 *  - Bandeau de titre vert à coins arrondis (canvas + texte superposé)
 *  - Bandeau d'informations doux à coins arrondis (Dossier · Entité · Période · extra)
 * @param {string} title
 * @param {object} info  { dossier, compte, periode, extra: { label, value } }
 * @param {number} cw    largeur utile (contentWidth('landscape'|'portrait'))
 */
function buildHeader(title, info = {}, cw = 565) {
  const content = [];

  // --- Bandeau de titre (vert, arrondi) ---
  const TH = 30;
  content.push({
    stack: [
      { canvas: [{ type: 'rect', x: 0, y: 0, w: cw, h: TH, r: 9, color: THEME.green }] },
      { text: String(title).toUpperCase(), color: '#FFFFFF', bold: true, fontSize: 13, characterSpacing: 1, margin: [14, -20, 14, 0] },
    ],
    margin: [0, 0, 0, 10],
  });

  // --- Bandeau d'informations (doux, arrondi) ---
  const seg = [];
  const push = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    if (seg.length) seg.push({ text: '     •     ', color: THEME.faint });
    seg.push({ text: `${label} `, color: THEME.muted });
    seg.push({ text: String(value), color: THEME.ink, bold: true });
  };
  push('Dossier', info.dossier);
  push('Entité', info.compte);
  push('Période', info.periode);
  if (info.extra) push(info.extra.label, info.extra.value);

  if (seg.length) {
    const IH = 24;
    content.push({
      stack: [
        { canvas: [{ type: 'rect', x: 0, y: 0, w: cw, h: IH, r: 8, color: THEME.soft, lineColor: '#DCE7E4', lineWidth: 1 }] },
        { text: seg, fontSize: 9, margin: [14, -16, 14, 0] },
      ],
      margin: [0, 0, 0, 12],
    });
  }

  return content;
}

// ── Icônes SVG modernes pour les cellules de statut (pdfmake supporte { svg }) ──
// Validé : pastille verte + coche blanche. À valider : anneau ambre (comme l'UI).
const ICON_VALID = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="11" fill="#1F8A70"/><path d="M6.8 12.4l3.3 3.3L17.2 8.2" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PENDING = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="#B5791A" stroke-width="2.6"/></svg>';
// Anomalie : triangle d'alerte ambre. Conforme : coche verte fine.
const ICON_ANOMALY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 3l9.5 16.5H2.5z" fill="#B5791A"/><rect x="11" y="9" width="2" height="5.5" rx="1" fill="#FFFFFF"/><circle cx="12" cy="17" r="1.2" fill="#FFFFFF"/></svg>';
const ICON_OK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#1F8A70" stroke-width="2"/><path d="M7.2 12.4l3.1 3.1L16.8 8.6" fill="none" stroke="#1F8A70" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Cellule pdfmake : icône de validation (✓ vert / ○ ambre)
function valideIconCell(isValid) {
  return { svg: isValid ? ICON_VALID : ICON_PENDING, width: 10, height: 10, alignment: 'center', margin: [0, 1, 0, 1] };
}
// Cellule pdfmake : icône d'anomalie (△ ambre / ✓ vert)
function anomalieIconCell(hasAnomaly) {
  return { svg: hasAnomaly ? ICON_ANOMALY : ICON_OK, width: 10, height: 10, alignment: 'center', margin: [0, 1, 0, 1] };
}

// ── Symboles Excel colorés (ExcelJS ne gère pas de SVG par cellule) ──
// Applique un symbole coloré à une cellule ExcelJS. Miroir des icônes PDF.
function setExcelAnomalieCell(cell, hasAnomaly) {
  cell.value = hasAnomaly ? '⚠' : '✓';
  cell.font = { name: 'Segoe UI Symbol', bold: true, size: 12, color: { argb: hasAnomaly ? 'FFB5791A' : 'FF1F8A70' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}
function setExcelValideCell(cell, isValid) {
  cell.value = isValid ? '✓' : '○';
  cell.font = { name: 'Segoe UI Symbol', bold: true, size: 12, color: { argb: isValid ? 'FF1F8A70' : 'FFB5791A' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

// ── Bandeau de statistiques (Anomalies / Restant à valider) ──
// Réutilisable pour les exports individuels et globaux. `label` optionnel
// (nom du contrôle) placé à gauche.
function statsBand(total, restant, label) {
  const box = (title, value, color, bg) => ({
    width: 'auto',
    table: { widths: ['auto', 'auto'], body: [[
      { text: title, fontSize: 7, bold: true, color: THEME.muted, border: [false, false, false, false], margin: [0, 2, 5, 0] },
      { text: String(value), fontSize: 12, bold: true, color, border: [false, false, false, false] },
    ]] },
    layout: { fillColor: () => bg, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 3, paddingBottom: () => 3, hLineWidth: () => 0, vLineWidth: () => 0 },
  });
  const cols = [];
  if (label) cols.push({ width: '*', text: label, bold: true, fontSize: 9, color: THEME.ink, margin: [0, 6, 8, 0] });
  cols.push(box('ANOMALIES', total, THEME.ink, THEME.softGreen));
  // restant === null → on n'affiche pas « Restant à valider » (contrôles sans validation)
  if (restant !== null && restant !== undefined) {
    cols.push(box('RESTANT À VALIDER', restant, restant > 0 ? '#BE3A2F' : '#1F8A70', restant > 0 ? '#F7E7E4' : '#E7F2EE'));
  }
  if (!label) cols.push({ text: '', width: '*' });
  return { columns: cols, columnGap: 8, margin: [0, label ? 4 : 0, 0, 8] };
}

// Écrit une ligne de statistiques dans une feuille ExcelJS. Renvoie l'index de la ligne suivante.
function writeExcelStats(ws, rowIndex, total, restant, label) {
  const row = ws.getRow(rowIndex);
  const c1 = row.getCell(1);
  const hasRestant = restant !== null && restant !== undefined;
  c1.value = {
    richText: [
      ...(label ? [{ font: { bold: true, size: 10, color: { argb: 'FF0E7C86' } }, text: `${label}   ` }] : []),
      { font: { bold: true, size: 10, color: { argb: 'FF6A7785' } }, text: 'Anomalies : ' },
      { font: { bold: true, size: 11, color: { argb: 'FF0E2733' } }, text: `${total}` },
      ...(hasRestant ? [
        { font: { size: 10, color: { argb: 'FF9AA6B2' } }, text: '      •      ' },
        { font: { bold: true, size: 10, color: { argb: 'FF6A7785' } }, text: 'Restant à valider : ' },
        { font: { bold: true, size: 11, color: { argb: restant > 0 ? 'FFBE3A2F' : 'FF1F8A70' } }, text: `${restant}` },
      ] : []),
    ],
  };
  c1.alignment = { horizontal: 'left', vertical: 'middle' };
  return rowIndex + 2;
}

// Valeurs richText ExcelJS (pour les lignes construites via row.values = [...])
function xlValide(isValid) {
  return { richText: [{ font: { name: 'Segoe UI Symbol', bold: true, size: 12, color: { argb: isValid ? 'FF1F8A70' : 'FFB5791A' } }, text: isValid ? '✓' : '○' }] };
}
function xlAnomalie(hasAnomaly) {
  return { richText: [{ font: { name: 'Segoe UI Symbol', bold: true, size: 12, color: { argb: hasAnomaly ? 'FFB5791A' : 'FF1F8A70' } }, text: hasAnomaly ? '⚠' : '✓' }] };
}

// Pied de page : date d'édition (gauche) + pagination (droite)
function pageFooter(genDate) {
  return (currentPage, pageCount) => ({
    margin: [15, 8, 15, 0],
    columns: [
      { text: genDate ? `Édité le ${genDate}` : '', fontSize: 7, color: THEME.muted },
      { text: `Page ${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 7, color: THEME.muted },
    ],
  });
}

module.exports = { THEME, buildHeader, pageFooter, formatDate, contentWidth, exerciceLabel, valideIconCell, anomalieIconCell, setExcelAnomalieCell, setExcelValideCell, xlValide, xlAnomalie, statsBand, writeExcelStats };
