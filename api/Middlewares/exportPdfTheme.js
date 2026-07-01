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

module.exports = { THEME, buildHeader, pageFooter, formatDate, contentWidth };
