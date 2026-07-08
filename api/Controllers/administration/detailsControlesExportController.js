// ─────────────────────────────────────────────────────────────────────────────
// Export GLOBAL de tous les contrôles de la page « Détails des contrôles »
// Produit UN SEUL classeur Excel (un onglet par contrôle) et UN SEUL PDF
// (une section par contrôle). Réutilise les builders DRY exposés par chaque
// contrôleur : getExportData / buildPdfSection / addExcelSheets.
// ─────────────────────────────────────────────────────────────────────────────
const db = require('../../Models');
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const dossiers = db.dossiers;
const exercices = db.exercices;

// Contrôleurs sources (chacun expose getExportData / buildPdfSection / addExcelSheets)
const revueAnalytique = require('../dashboard/revuAnalytiqueController');
const revueMensuelle = require('../dashboard/revuAnalytiqueMensuelleController');
const controleGlobal = require('../revision/revisionExportController'); // Contrôle Global Balance (révision auto)
const analyseTiers = require('./analyseFournisseurController');
const rechercheDoublon = require('./rechercheDoublonController');
const ecrituresSuspense = require('./ecrituresSuspenseController');
const revisionAnalytique = require('./revisionAnalytiqueController');
const { applyKaontyStyle } = require('../../Middlewares/kaontyExcelStyle');

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const tryReadLogo = () => {
  const candidatePaths = [
    process.env.REPORT_LOGO_PATH,
    path.join(process.cwd(), 'assets', 'logo.png'),
    path.join(__dirname, '..', '..', 'assets', 'logo.png'),
    path.join(__dirname, '..', '..', '..', 'front', 'kaonti', 'src', 'img', '30.png')
  ].filter(Boolean);
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        return { dataUrl: `data:image/png;base64,${buf.toString('base64')}`, buffer: buf, extension: 'png' };
      }
    } catch (_) { }
  }
  return null;
};

// Préfixe tous les styles nommés d'une section pour éviter les collisions entre
// contrôles qui définissent un même nom de style (ex. « cell », « tableHeader »)
// avec des valeurs différentes. Clone en profondeur le content en réécrivant les
// propriétés `style` (chaîne ou tableau) et renvoie les styles préfixés.
const namespaceSection = (section, prefix) => {
  const remap = (node) => {
    if (Array.isArray(node)) return node.map(remap);
    if (node && typeof node === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === 'style') {
          out[k] = Array.isArray(v) ? v.map(s => `${prefix}__${s}`) : `${prefix}__${v}`;
        } else {
          out[k] = remap(v); // les fonctions (layout) sont conservées telles quelles
        }
      }
      return out;
    }
    return node; // primitives et fonctions
  };

  const content = (section?.content || []).map(remap);
  const styles = {};
  for (const [k, v] of Object.entries(section?.styles || {})) {
    styles[`${prefix}__${k}`] = v;
  }
  return { content, styles };
};

// Ordre et libellés des sections (alignés sur le menu latéral de DetailsControles)
const SECTION_TITLES = {
  revueAnalytique: 'Revue Analytique N/N-1',
  revueMensuelle: 'Revue Mensuelle',
  controleGlobal: 'Contrôle Global Balance',
  analyseTiers: 'Analyse Fournisseurs / Clients',
  doublons: 'Recherche de Doublons',
  suspense: 'Écritures en suspens',
  analytique: 'Codes Analytiques',
};

// ── Synthèse des anomalies (1re page / 1er onglet) ──────────────────────────
// `synthese` provient du client : { rows: [{ nom, anomalies, restantes, progress }],
// totals: { anomalies, restantes, validated, progress } }. Identique au dashboard.

const isValidSynthese = (s) => s && Array.isArray(s.rows) && s.totals;

// Palette (accent Kaonty teal)
const C = {
  teal: '#0E7C86', tealDark: '#0a5d65', tealSoft: '#E2F0F1',
  ink: '#0E2733', muted: '#6A7785', line: '#E0E0E0',
  pos: '#1F8A70', neg: '#BE3A2F',
  zebra: '#F6F9F9', white: '#FFFFFF',
  kTotal: '#E2F0F1', kDone: '#E8F5EE', kLeft: '#FBECEA', kProg: '#EAF1FB',
};

// Styles globaux (chrome de l'export) — les sections de contrôle gardent leurs
// propres styles préfixés via namespaceSection().
const STYLES = {
  _hTitle: { fontSize: 19, bold: true, color: '#FFFFFF' },
  _hSubtitle: { fontSize: 9, color: '#CDE7E7' },
  _hMeta: { fontSize: 9, color: '#EAF6F6', margin: [0, 6, 0, 0] },
  _footer: { fontSize: 7, color: '#9AA6B2' },
  _sectionBand: { fontSize: 12, bold: true, color: '#0a5d65' },
  _sectionError: { fontSize: 9, italics: true, color: '#BE3A2F', margin: [0, 6, 0, 6] },
  _synthTitle: { fontSize: 14, bold: true, color: '#0E2733', margin: [0, 0, 0, 10] },
  _kpiLabel: { fontSize: 8, color: '#6A7785', alignment: 'center' },
  _kpiTeal: { fontSize: 18, bold: true, color: '#0E7C86', alignment: 'center' },
  _kpiPos: { fontSize: 18, bold: true, color: '#1F8A70', alignment: 'center' },
  _kpiNeg: { fontSize: 18, bold: true, color: '#BE3A2F', alignment: 'center' },
  _kpiInk: { fontSize: 18, bold: true, color: '#0E2733', alignment: 'center' },
  _synthHead: { bold: true, fontSize: 9, color: '#FFFFFF' },
  _synthCell: { fontSize: 8.5, color: '#2C3E50' },
  _synthCellPos: { fontSize: 8.5, bold: true, color: '#1F8A70' },
  _synthCellNeg: { fontSize: 8.5, bold: true, color: '#BE3A2F' },
};

// Bandeau de titre de section (fond teal clair + barre d'accent à gauche)
const sectionBandNode = (index, title) => ({
  table: { widths: ['*'], body: [[{ text: `${index}.  ${title}`, style: '_sectionBand' }]] },
  layout: {
    fillColor: () => C.tealSoft,
    hLineWidth: () => 0,
    vLineWidth: (i) => (i === 0 ? 3 : 0),
    vLineColor: () => C.teal,
    paddingLeft: () => 10, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6,
  },
  margin: [0, 0, 0, 10],
});

const buildSyntheseNodes = (synthese) => {
  const t = synthese.totals || {};
  const rows = synthese.rows || [];

  const card = (label, value, valStyle) => ({
    stack: [
      { text: label, style: '_kpiLabel' },
      { text: String(value), style: valStyle, margin: [0, 4, 0, 0] },
    ],
  });

  return [
    { text: 'Synthèse des anomalies', style: '_synthTitle' },
    // Cartes KPI colorées
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [[
          card('Total anomalies', t.anomalies ?? 0, '_kpiTeal'),
          card('Traitées', t.validated ?? 0, '_kpiPos'),
          card('Restantes', t.restantes ?? 0, '_kpiNeg'),
          card('Progression', `${t.progress ?? 0}%`, '_kpiInk'),
        ]],
      },
      layout: {
        fillColor: (ri, node, ci) => [C.kTotal, C.kDone, C.kLeft, C.kProg][ci],
        hLineWidth: () => 0,
        vLineWidth: () => 6, vLineColor: () => C.white,
        paddingTop: () => 10, paddingBottom: () => 10, paddingLeft: () => 10, paddingRight: () => 10,
      },
      margin: [0, 0, 0, 14],
    },
    // Tableau détaillé par contrôle
    {
      table: {
        headerRows: 1,
        widths: ['*', '15%', '15%', '15%', '15%'],
        body: [
          ['Contrôle', 'Anomalies', 'Restantes', 'Traitées', 'Progression'].map((h, i) => ({
            text: h, style: '_synthHead', alignment: i === 0 ? 'left' : 'center',
          })),
          ...rows.map((r) => {
            const anomalies = Number(r.anomalies) || 0;
            const restantes = Number(r.restantes) || 0;
            const progress = Number(r.progress) || 0;
            return [
              { text: r.nom || '', style: '_synthCell' },
              { text: String(anomalies), style: '_synthCell', alignment: 'center' },
              { text: String(restantes), style: restantes > 0 ? '_synthCellNeg' : '_synthCell', alignment: 'center' },
              { text: String(anomalies - restantes), style: '_synthCell', alignment: 'center' },
              { text: `${progress}%`, style: progress >= 100 ? '_synthCellPos' : (progress < 50 ? '_synthCellNeg' : '_synthCell'), alignment: 'center' },
            ];
          }),
        ],
      },
      layout: {
        fillColor: (ri) => (ri === 0 ? C.teal : ri % 2 === 0 ? C.zebra : C.white),
        hLineColor: () => C.line, vLineColor: () => C.line,
        hLineWidth: () => 0.3, vLineWidth: () => 0.3,
        paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 8, paddingRight: () => 8,
      },
    },
  ];
};

// Ajoute (en premier) l'onglet « Synthèse des anomalies » au classeur.
// En-tête au style Kaonty (titre teal + dossier/période), cartes KPI et tableau.
const addSyntheseSheet = (workbook, synthese, ctx = {}) => {
  const t = synthese.totals || {};
  const rows = synthese.rows || [];
  const ws = workbook.addWorksheet('Synthèse des anomalies', {
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 46 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }];

  const thin = { style: 'thin', color: { argb: 'FFD9E2E5' } };
  const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

  // ── En-tête style Kaonty ──
  ws.mergeCells('A1:E1');
  const title = ws.getCell('A1');
  title.value = 'SYNTHÈSE DES ANOMALIES';
  title.font = { bold: true, size: 16, color: { argb: 'FF0E7C86' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  ws.mergeCells('A2:E2');
  const dossierCell = ws.getCell('A2');
  dossierCell.value = `Dossier : ${ctx.dossierName || ''}`;
  dossierCell.font = { italic: true, bold: true, size: 14, color: { argb: 'FF555555' } };
  dossierCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const periodeCell = ws.getCell('A3');
  periodeCell.value = `Période du : ${ctx.periodeText || ''}`;
  periodeCell.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
  periodeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Cartes KPI (ligne 5 : libellés, ligne 6 : valeurs), une couleur par KPI ──
  const kpis = [
    { label: 'Total anomalies', value: t.anomalies ?? 0, fill: 'FFE2F0F1', color: 'FF0E7C86' },
    { label: 'Traitées', value: t.validated ?? 0, fill: 'FFE8F5EE', color: 'FF1F8A70' },
    { label: 'Restantes', value: t.restantes ?? 0, fill: 'FFFBECEA', color: 'FFBE3A2F' },
    { label: 'Progression', value: `${t.progress ?? 0}%`, fill: 'FFEAF1FB', color: 'FF0E2733' },
  ];
  kpis.forEach((k, i) => {
    const col = i + 2; // colonnes B..E
    const cLabel = ws.getRow(5).getCell(col);
    cLabel.value = k.label;
    cLabel.font = { size: 9, color: { argb: 'FF6A7785' } };
    cLabel.alignment = { horizontal: 'center' };
    cLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.fill } };
    cLabel.border = { top: allBorders.top, left: allBorders.left, right: allBorders.right };
    const cVal = ws.getRow(6).getCell(col);
    cVal.value = k.value;
    cVal.font = { bold: true, size: 14, color: { argb: k.color } };
    cVal.alignment = { horizontal: 'center' };
    cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.fill } };
    cVal.border = { bottom: allBorders.bottom, left: allBorders.left, right: allBorders.right };
  });
  ws.getRow(6).height = 24;

  // ── En-tête du tableau (ligne 8), style Kaonty : teal + blanc ──
  const headerRow = ws.getRow(8);
  headerRow.values = ['Contrôle', 'Anomalies', 'Restantes', 'Traitées', 'Progression'];
  headerRow.eachCell((cell, col) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
    cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
    cell.border = allBorders;
  });
  headerRow.height = 20;

  // ── Lignes de données (zébrage + couleurs conditionnelles) ──
  let cursor = 9;
  rows.forEach((r, idx) => {
    const anomalies = Number(r.anomalies) || 0;
    const restantes = Number(r.restantes) || 0;
    const progress = Number(r.progress) || 0;
    const row = ws.getRow(cursor);
    row.values = [r.nom || '', anomalies, restantes, anomalies - restantes, `${progress}%`];
    const zebra = idx % 2 === 1 ? 'FFF6FAF9' : 'FFFFFFFF';
    row.eachCell((cell, col) => {
      cell.border = allBorders;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
      cell.alignment = { horizontal: col === 1 ? 'left' : 'center' };
      cell.font = { size: 10, color: { argb: 'FF2C3E50' } };
    });
    if (restantes > 0) row.getCell(3).font = { size: 10, bold: true, color: { argb: 'FFBE3A2F' } };
    if (progress >= 100) row.getCell(5).font = { size: 10, bold: true, color: { argb: 'FF1F8A70' } };
    else if (progress < 50) row.getCell(5).font = { size: 10, bold: true, color: { argb: 'FFBE3A2F' } };
    cursor += 1;
  });

  return ws;
};

// Le style Kaonty (titres + en-têtes + bordures) est centralisé dans
// Middlewares/kaontyExcelStyle et partagé avec les exports unitaires.

// ── Export PDF global ──────────────────────────────────────────────────────────

exports.exportGlobalPdf = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode, date_debut, date_fin } = req.query;
    const synthese = req.body?.synthese;

    if (!id_compte || !id_dossier || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);

    const periodeText = (date_debut && date_fin)
      ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
      : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    // Construit chaque section (préfixée) — une par contrôle. Un contrôle en
    // échec n'interrompt pas l'export global.
    const mergedContent = [];
    const mergedStyles = { ...STYLES };

    let sectionIndex = 0;
    const pushSection = (key, section) => {
      const prefix = `s${sectionIndex}`;
      const ns = namespaceSection(section, prefix);
      if (sectionIndex > 0) mergedContent.push({ text: '', pageBreak: 'before' });
      mergedContent.push(sectionBandNode(sectionIndex + 1, SECTION_TITLES[key]));
      mergedContent.push(...ns.content);
      Object.assign(mergedStyles, ns.styles);
      sectionIndex += 1;
    };
    const pushError = (key, err) => {
      if (sectionIndex > 0) mergedContent.push({ text: '', pageBreak: 'before' });
      mergedContent.push(sectionBandNode(sectionIndex + 1, SECTION_TITLES[key]));
      mergedContent.push({ text: `Impossible de générer ce contrôle : ${err?.message || err}`, style: '_sectionError' });
      sectionIndex += 1;
    };

    // 0 — Revue Analytique N/N-1
    try {
      const data = await revueAnalytique.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      pushSection('revueAnalytique', revueAnalytique.buildPdfSection(data, { periodeText }));
    } catch (e) { console.error('[GLOBAL_PDF] revueAnalytique:', e.message); pushError('revueAnalytique', e); }

    // 1 — Revue Mensuelle
    try {
      const data = await revueMensuelle.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      pushSection('revueMensuelle', revueMensuelle.buildPdfSection(data, { periodeText }));
    } catch (e) { console.error('[GLOBAL_PDF] revueMensuelle:', e.message); pushError('revueMensuelle', e); }

    // 2 — Contrôle Global Balance (révision auto, une sous-section par type)
    try {
      const section = await controleGlobal.buildPdfSection({ id_compte, id_dossier, id_exercice, date_debut, date_fin, id_periode });
      pushSection('controleGlobal', section);
    } catch (e) { console.error('[GLOBAL_PDF] controleGlobal:', e.message); pushError('controleGlobal', e); }

    // 3 — Analyse Fournisseurs / Clients
    try {
      const data = await analyseTiers.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      pushSection('analyseTiers', analyseTiers.buildPdfSection(data, { periodeText }));
    } catch (e) { console.error('[GLOBAL_PDF] analyseTiers:', e.message); pushError('analyseTiers', e); }

    // 4 — Recherche de Doublons
    try {
      const data = await rechercheDoublon.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      pushSection('doublons', rechercheDoublon.buildPdfSection(data, { periodeText }));
    } catch (e) { console.error('[GLOBAL_PDF] doublons:', e.message); pushError('doublons', e); }

    // 5 — Écritures en suspens
    try {
      const data = await ecrituresSuspense.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      pushSection('suspense', ecrituresSuspense.buildPdfSection(data, { periodeText }));
    } catch (e) { console.error('[GLOBAL_PDF] suspense:', e.message); pushError('suspense', e); }

    // 6 — Codes Analytiques
    try {
      const data = await revisionAnalytique.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      pushSection('analytique', revisionAnalytique.buildPdfSection(data, { periodeText }));
    } catch (e) { console.error('[GLOBAL_PDF] analytique:', e.message); pushError('analytique', e); }

    // En-tête global : bandeau teal (logo sur pavé blanc + titre/méta en blanc)
    const logo = tryReadLogo();
    const headerTextCell = {
      stack: [
        { text: 'DÉTAILS DES CONTRÔLES', style: '_hTitle' },
        { text: 'Rapport global des contrôles comptables', style: '_hSubtitle' },
        { text: `Dossier : ${dossier?.dossier || ''}      Période : ${periodeText}`, style: '_hMeta' },
      ],
      margin: [10, 14, 10, 14],
    };
    const headerBand = logo?.dataUrl
      ? {
          table: { widths: [92, '*'], body: [[
            { image: logo.dataUrl, width: 74, alignment: 'center', margin: [4, 12, 4, 12] },
            headerTextCell,
          ]] },
          layout: {
            fillColor: (ri, node, ci) => (ci === 0 ? C.white : C.teal),
            hLineWidth: () => 0, vLineWidth: () => 0,
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 0, paddingBottom: () => 0,
          },
          margin: [0, 0, 0, 16],
        }
      : {
          table: { widths: ['*'], body: [[headerTextCell]] },
          layout: {
            fillColor: () => C.teal, hLineWidth: () => 0, vLineWidth: () => 0,
            paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 0, paddingBottom: () => 0,
          },
          margin: [0, 0, 0, 16],
        };

    const content = [headerBand];
    // 1re page : synthèse des anomalies (si fournie par le client)
    if (isValidSynthese(synthese)) {
      content.push(...buildSyntheseNodes(synthese));
      if (mergedContent.length) content.push({ text: '', pageBreak: 'before' });
    }
    content.push(...mergedContent);

    const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [24, 22, 24, 40],
      defaultStyle: { font: 'Helvetica', fontSize: 8, color: '#2C3E50' },
      footer: (currentPage, pageCount) => ({
        margin: [24, 8, 24, 0],
        columns: [
          { text: `${dossier?.dossier || ''}`, style: '_footer' },
          { text: `Page ${currentPage} / ${pageCount}`, alignment: 'right', style: '_footer' },
        ],
      }),
      content,
      styles: mergedStyles,
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Controles_Globaux_${id_dossier}_${id_exercice}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('[DETAILS_CONTROLES][GLOBAL_PDF] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

// ── Export Excel global ──────────────────────────────────────────────────────

exports.exportGlobalExcel = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode, date_debut, date_fin } = req.query;
    const synthese = req.body?.synthese;

    if (!id_compte || !id_dossier || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const periodeText = (date_debut && date_fin)
      ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
      : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    const workbook = new ExcelJS.Workbook();
    const logo = tryReadLogo();
    const ctx = { logo, periodeText, dossierName: dossier?.dossier };

    // 1er onglet : synthèse des anomalies (si fournie par le client)
    if (isValidSynthese(synthese)) {
      try { addSyntheseSheet(workbook, synthese, ctx); }
      catch (e) { console.error('[GLOBAL_EXCEL] synthese:', e.message); }
    }

    const addSheets = async (label, fn) => {
      try {
        await fn();
      } catch (e) {
        console.error(`[GLOBAL_EXCEL] ${label}:`, e.message);
        // Onglet d'erreur pour tracer le contrôle manquant sans casser l'export.
        const name = `ERREUR ${label}`.substring(0, 31);
        try {
          const ws = workbook.addWorksheet(name);
          ws.getCell('A1').value = `Impossible de générer « ${label} » : ${e.message}`;
        } catch (_) { /* nom d'onglet en doublon : ignorer */ }
      }
    };

    // 0 — Revue Analytique N/N-1
    await addSheets(SECTION_TITLES.revueAnalytique, async () => {
      const data = await revueAnalytique.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      revueAnalytique.addExcelSheets(workbook, data, ctx);
    });

    // 1 — Revue Mensuelle
    await addSheets(SECTION_TITLES.revueMensuelle, async () => {
      const data = await revueMensuelle.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      revueMensuelle.addExcelSheets(workbook, data, ctx);
    });

    // 2 — Contrôle Global Balance (un onglet par type)
    await addSheets(SECTION_TITLES.controleGlobal, async () => {
      await controleGlobal.addExcelSheets(workbook, { id_compte, id_dossier, id_exercice, date_debut, date_fin, id_periode }, ctx);
    });

    // 3 — Analyse Fournisseurs / Clients (2 onglets)
    await addSheets(SECTION_TITLES.analyseTiers, async () => {
      const data = await analyseTiers.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      analyseTiers.addExcelSheets(workbook, data, ctx);
    });

    // 4 — Recherche de Doublons
    await addSheets(SECTION_TITLES.doublons, async () => {
      const data = await rechercheDoublon.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      rechercheDoublon.addExcelSheets(workbook, data, ctx);
    });

    // 5 — Écritures en suspens
    await addSheets(SECTION_TITLES.suspense, async () => {
      const data = await ecrituresSuspense.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      ecrituresSuspense.addExcelSheets(workbook, data, ctx);
    });

    // 6 — Codes Analytiques
    await addSheets(SECTION_TITLES.analytique, async () => {
      const data = await revisionAnalytique.getExportData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
      revisionAnalytique.addExcelSheets(workbook, data, ctx);
    });

    // Uniformise le style de tous les onglets de contrôle (en-têtes teal + bordures).
    workbook.worksheets.forEach((ws) => {
      if (ws.name === 'Synthèse des anomalies') return; // déjà stylé
      try { applyKaontyStyle(ws); }
      catch (e) { console.error('[GLOBAL_EXCEL] theme', ws.name, e.message); }
    });

    // Filet de sécurité : ExcelJS exige au moins un onglet.
    if (workbook.worksheets.length === 0) {
      const ws = workbook.addWorksheet('Contrôles');
      ws.getCell('A1').value = 'Aucune donnée de contrôle disponible';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Controles_Globaux_${id_dossier}_${id_exercice}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[DETAILS_CONTROLES][GLOBAL_EXCEL] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};
