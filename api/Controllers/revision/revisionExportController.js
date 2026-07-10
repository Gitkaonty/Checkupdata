const db = require("../../Models");
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { applyKaontyStyle } = require('../../Middlewares/kaontyExcelStyle');
const { valideIconCell, xlValide, statsBand, writeExcelStats } = require('../../Middlewares/exportPdfTheme');

// Statistiques d'un contrôle à partir de ses anomalies
const computeStats = (anomalies) => {
  const list = anomalies || [];
  return { total: list.length, restant: list.filter(a => !a.valide).length };
};

const dossiers = db.dossiers;
const exercices = db.exercices;
const revisionControle = db.revisionControle;
const tableControleAnomalies = db.tableControleAnomalies;
const journals = db.journals;

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

const formatMontant = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ');
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

// ── Data fetching ────────────────────────────────────────────────────────────

const getRevisionDetailsData = async (id_compte, id_dossier, id_exercice, id_controle, date_debut, date_fin, id_periode) => {
  const controle = await revisionControle.findOne({ where: { id_compte, id_dossier, id_exercice, id_controle } });
  if (!controle) throw new Error('Contrôle non trouvé');

  const type = controle.Type || '';
  let affichage = controle.Affichage || 'ligne';
  if (type === 'ATYPIQUE') affichage = 'ligne';

  const anomalyWhere = { id_compte, id_dossier, id_exercice, id_controle };
  if (id_periode) anomalyWhere.id_periode = parseInt(id_periode, 10);

  const anomalies = await tableControleAnomalies.findAll({
    where: anomalyWhere,
    order: [['id', 'ASC']]
  });

  const dateFilter = (date_debut && date_fin)
    ? { dateecriture: { [Op.gte]: date_debut, [Op.lte]: date_fin } }
    : {};

  const idJnlKeys = [...new Set(anomalies.map(a => a.id_jnl).filter(Boolean))];
  let journalLines = [];

  console.log('[REVISION][DATA] type:', type, 'idJnlKeys count:', idJnlKeys.length, 'idJnlKeys sample:', idJnlKeys.slice(0, 5));

  if (idJnlKeys.length > 0) {
    let rawLines = [];
    if (type === 'SENS_SOLDE' || type === 'SENS_ECRITURE' || type === 'IMMO_CHARGE') {
      // Pour ces types, id_jnl = ID de ligne journal individuelle (journals.id)
      const lineIds = idJnlKeys.map(v => parseInt(v, 10)).filter(v => Number.isFinite(v));
      if (lineIds.length > 0) {
        rawLines = await journals.findAll({
          where: { id: { [Op.in]: lineIds }, id_compte, id_dossier, id_exercice, ...dateFilter },
          order: [['dateecriture', 'ASC'], ['id', 'ASC']]
        });
      }
    } else if (type === 'UTIL_CPT_TVA' || affichage === 'ecriture') {
      rawLines = await journals.findAll({
        where: { id_ecriture: { [Op.in]: idJnlKeys }, id_compte: id_compte, id_dossier, id_exercice, ...dateFilter },
        order: [['dateecriture', 'ASC'], ['id', 'ASC']]
      });
    } else {
      // ATYPIQUE et autres : recherche par id
      const ids = idJnlKeys.map(v => parseInt(v, 10)).filter(v => Number.isFinite(v));
      if (ids.length > 0) {
        rawLines = await journals.findAll({
          where: { id: { [Op.in]: ids }, id_compte, id_dossier, id_exercice, ...dateFilter },
          order: [['dateecriture', 'ASC'], ['id', 'ASC']]
        });
      }
    }
    // Convertir en objets simples pour éviter les problèmes d'accès aux propriétés
    journalLines = rawLines.map(r => (r?.get ? r.get({ plain: true }) : r));
  }

  console.log('[REVISION][DATA] journalLines fetched:', journalLines.length);

  const anomaliesWithLines = anomalies.map((a) => {
    const anomalieData = a.toJSON();
    let lines = [];

    if (type === 'SENS_SOLDE' || type === 'SENS_ECRITURE' || type === 'IMMO_CHARGE') {
      // Pour ces types, id_jnl = ID de ligne journal individuelle (journals.id)
      lines = journalLines.filter(l => String(l.id) === String(a.id_jnl));
    } else if (type === 'UTIL_CPT_TVA' || affichage === 'ecriture') {
      lines = journalLines.filter(l => {
        const cpt = l.comptegen || '';
        return String(l.id_ecriture) === String(a.id_jnl) && !cpt.startsWith('28');
      });
    } else {
      lines = journalLines.filter(l => String(l.id) === String(a.id_jnl));
    }

    anomalieData.journalLines = lines;
    // compteNum = le compte de la ligne (comptegen), pas l'id_jnl
    anomalieData.compteNum = (type === 'SENS_SOLDE' || type === 'SENS_ECRITURE' || type === 'IMMO_CHARGE')
      ? (lines[0]?.comptegen || lines[0]?.compteaux || a.id_jnl)
      : null;
    return anomalieData;
  });

  return { controle, anomalies: anomaliesWithLines, type };
};

// ── ATYPIQUE: Grouping by compte (one table per compte) ─────────────────────

const groupAnomaliesByCompte = (anomalies, preferAux = false) => {
  const grouped = {};
  anomalies.forEach(anomalie => {
    if (!Array.isArray(anomalie.journalLines)) return;
    anomalie.journalLines.forEach(line => {
      const compte = preferAux
        ? (line?.compteaux || line?.comptegen)
        : (line?.comptegen || line?.compteaux);
      if (!compte) return;
      if (!grouped[compte]) grouped[compte] = { anomalies: [], allLines: [] };
      if (!grouped[compte].anomalies.includes(anomalie)) grouped[compte].anomalies.push(anomalie);
      if (!grouped[compte].allLines.some(l => l.id === line.id)) grouped[compte].allLines.push(line);
    });
  });
  return grouped;
};

// ── PDF Export ───────────────────────────────────────────────────────────────

exports.exportPdf = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, id_controle } = req.params;
    const { date_debut, date_fin, id_periode } = req.query;

    if (!id_compte || !id_dossier || !id_exercice || !id_controle) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);

    const { controle, anomalies, type } =
      await getRevisionDetailsData(
        id_compte,
        id_dossier,
        id_exercice,
        id_controle,
        date_debut,
        date_fin,
        id_periode
      );

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);
    const logo = tryReadLogo();

    const periodeText =
      (date_debut && date_fin)
        ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
        : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    // ---------------- HEADER ----------------
    const headerColumns = [];

    if (logo?.dataUrl) {
      headerColumns.push({ image: logo.dataUrl, width: 90 });
    }

    headerColumns.push({
      width: '*',
      stack: [
        {
          text: 'DETAILS DE REVISION',
          style: 'header',
          alignment: 'center'
        },
        {
          text: `Dossier : ${dossier?.dossier || ''}`,
          style: 'subheader',
          alignment: 'center'
        },
        {
          text: `${controle?.description || ''}`,
          style: 'subheader2',
          alignment: 'center'
        },
        {
          text: `Type : ${type}`,
          style: 'subheader2',
          alignment: 'center'
        },
        {
          text: `Période : ${periodeText}`,
          style: 'subheader2',
          alignment: 'center'
        }
      ]
    });

    const content = [
      {
        columns: headerColumns,
        columnGap: 10,
        margin: [0, 0, 0, 12]
      }
    ];

    // ---------------- STATS ----------------
    {
      const { total, restant } = computeStats(anomalies);
      content.push(statsBand(total, restant));
    }

    // ---------------- CONTENT ----------------
    console.log('[REVISION][PDF] anomalies count:', anomalies?.length, 'type:', type);
    if (anomalies.length > 0) {
      console.log('[REVISION][PDF] first anomaly keys:', Object.keys(anomalies[0]));
      console.log('[REVISION][PDF] first anomaly journalLines count:', anomalies[0]?.journalLines?.length);
      console.log('[REVISION][PDF] first anomaly id_jnl:', anomalies[0]?.id_jnl, 'compteNum:', anomalies[0]?.compteNum);
    }

    if (!anomalies || anomalies.length === 0) {
      content.push({
        text: 'Aucune anomalie détectée',
        style: 'noData'
      });
    } else if (type === 'ATYPIQUE') {

      const grouped = groupAnomaliesByCompte(anomalies, true);
      const comptes = Object.keys(grouped).sort();
      console.log('[REVISION][PDF] ATYPIQUE grouped comptes:', comptes.length, comptes.slice(0, 5));

      comptes.forEach((compte) => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        const label = firstAnomaly?.message || `Anomalie (${data.anomalies.length})`;

        content.push({
          text: `Compte ${compte} - ${label}`,
          style: 'anomalyHeader'
        });

        if (lines.length > 0) {

          const tableBody = [[
            'Date',
            'Compte',
            'Pièce',
            'Libellé',
            'Débit',
            'Crédit',
            'Lettrage',
            'Analytique',
            'Validé',
            'Commentaire'
          ].map(h => ({
            text: h,
            style: 'tableHeader',
            alignment: 'center'
          }))];

          lines.forEach((l, i) => {

            const relatedAnomaly =
              data.anomalies.find(a =>
                a.journalLines?.some(jl => jl.id === l.id)
              ) || firstAnomaly;

            const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';

            tableBody.push([
              { text: formatDate(l.dateecriture), style: 'cell' },
              { text: l.comptegen || l.compteaux || '', style: 'cell' },
              { text: l.piece || '', style: 'cell' },
              { text: l.libelle || '', style: 'cell' },
              { text: formatMontant(parseFloat(l.debit) || 0), alignment: 'right', style: 'cell' },
              { text: formatMontant(parseFloat(l.credit) || 0), alignment: 'right', style: 'cell' },
              { text: l.lettrage || '', style: 'cell' },
              { text: l.analytique || '', style: 'cell' },
              valideIconCell(relatedAnomaly?.valide),
              { text: relatedAnomaly?.commentaire || '', style: 'cell' }
            ].map(cell => ({
              ...cell,
              fillColor: rowColor
            })));
          });

          content.push({
            table: {
              headerRows: 1,
              widths: ['9%', '9%', '8%', '*', '11%', '11%', '7%', '9%', '6%', '12%'],
              body: tableBody
            },
            layout: {
              fillColor: (rowIndex) => {
                if (rowIndex === 0) return '#E8EEF7'; // header léger bleu-gris
                return rowIndex % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
              },
              hLineColor: () => '#E0E0E0',
              vLineColor: () => '#E0E0E0',
              hLineWidth: () => 0.3,
              vLineWidth: () => 0.3,
              paddingTop: () => 3,
              paddingBottom: () => 3,
              paddingLeft: () => 4,
              paddingRight: () => 4
            }
          });

        } else {
          content.push({
            text: 'Aucune ligne pour ce compte',
            style: 'noData'
          });
        }
      });

    } else if (type === 'IMMO_CHARGE') {

      const grouped = groupAnomaliesByCompte(anomalies);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach((compte) => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        content.push({
          text: `Actions pour le compte ${compte}`,
          style: 'anomalyHeader'
        });

        if (lines.length > 0) {

          const tableBody = [[
            'Date',
            'Compte',
            'Pièce',
            'Libellé',
            'Débit',
            'Crédit',
            'Lettrage',
            'Analytique',
            'Validé',
            'Commentaire'
          ].map(h => ({
            text: h,
            style: 'tableHeader',
            alignment: 'center'
          }))];

          let totalDebit = 0;
          let totalCredit = 0;

          lines.forEach((l, i) => {

            const relatedAnomaly =
              data.anomalies.find(a =>
                a.journalLines?.some(jl => jl.id === l.id)
              ) || firstAnomaly;

            const debit = parseFloat(l.debit) || 0;
            const credit = parseFloat(l.credit) || 0;
            totalDebit += debit;
            totalCredit += credit;

            const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';

            tableBody.push([
              { text: formatDate(l.dateecriture), style: 'cell' },
              { text: l.comptegen || l.compteaux || '', style: 'cell' },
              { text: l.piece || '', style: 'cell' },
              { text: l.libelle || '', style: 'cell' },
              { text: formatMontant(debit), alignment: 'right', style: 'cell' },
              { text: formatMontant(credit), alignment: 'right', style: 'cell' },
              { text: l.lettrage || '', style: 'cell' },
              { text: l.analytique || '', style: 'cell' },
              valideIconCell(relatedAnomaly?.valide),
              { text: relatedAnomaly?.commentaire || '', style: 'cell' }
            ].map(cell => ({
              ...cell,
              fillColor: rowColor
            })));
          });

          // Ligne Total
          const solde = totalDebit - totalCredit;
          const soldeNormalise = Math.abs(solde) < 0.01 ? 0 : solde;

          tableBody.push([
            { text: 'Total', colSpan: 4, alignment: 'right', style: 'totalRow' },
            {}, {}, {},
            { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
            { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' },
            { text: '', style: 'totalRow' },
            { text: '', style: 'totalRow' },
            { text: '', style: 'totalRow' },
            { text: '', style: 'totalRow' }
          ]);

          // Ligne Solde
          const soldeLabel = soldeNormalise > 0
            ? 'Solde Débiteur'
            : soldeNormalise < 0
              ? 'Solde Créditeur'
              : 'Solde nul';

          tableBody.push([
            { text: soldeLabel, colSpan: 5, alignment: 'right', style: 'soldeRow' },
            {}, {}, {}, {},
            { text: formatMontant(Math.abs(soldeNormalise)), alignment: 'right', style: 'soldeRow' },
            { text: '', style: 'soldeRow' },
            { text: '', style: 'soldeRow' },
            { text: '', style: 'soldeRow' },
            { text: '', style: 'soldeRow' }
          ]);

          content.push({
            table: {
              headerRows: 1,
              widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'],
              body: tableBody
            },
            layout: {
              fillColor: (rowIndex) => {
                if (rowIndex === 0) return '#E8EEF7';
                return rowIndex % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
              },
              hLineColor: () => '#E0E0E0',
              vLineColor: () => '#E0E0E0',
              hLineWidth: () => 0.3,
              vLineWidth: () => 0.3,
              paddingTop: () => 3,
              paddingBottom: () => 3,
              paddingLeft: () => 4,
              paddingRight: () => 4
            }
          });

        } else {
          content.push({
            text: 'Aucune ligne pour ce compte',
            style: 'noData'
          });
        }
      });

    } else if (type === 'SENS_SOLDE') {

      const grouped = groupAnomaliesByCompte(anomalies);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach((compte) => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        const testType = (controle?.test || '').toUpperCase();
        let detailMessage = `Le compte "${compte}" doit avoir un solde `;
        if (testType === 'DEBITEUR') detailMessage += 'débiteur';
        else if (testType === 'CREDITEUR') detailMessage += 'créditeur';
        else if (testType === 'NULL') detailMessage += 'nul';
        else detailMessage = `Anomalie de sens de solde pour le compte "${compte}"`;

        content.push({ text: detailMessage, style: 'anomalyHeader' });

        if (lines.length > 0) {
          const tableBody = [[
            'Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'
          ].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];

          let totalDebit = 0, totalCredit = 0;

          lines.forEach((l, i) => {
            const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
            const debit = parseFloat(l.debit) || 0;
            const credit = parseFloat(l.credit) || 0;
            totalDebit += debit;
            totalCredit += credit;
            const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';

            tableBody.push([
              { text: formatDate(l.dateecriture), style: 'cell' },
              { text: l.comptegen || l.compteaux || '', style: 'cell' },
              { text: l.piece || '', style: 'cell' },
              { text: l.libelle || '', style: 'cell' },
              { text: formatMontant(debit), alignment: 'right', style: 'cell' },
              { text: formatMontant(credit), alignment: 'right', style: 'cell' },
              { text: l.lettrage || '', style: 'cell' },
              { text: l.analytique || '', style: 'cell' },
              valideIconCell(relatedAnomaly?.valide),
              { text: relatedAnomaly?.commentaire || '', style: 'cell' }
            ].map(cell => ({ ...cell, fillColor: rowColor })));
          });

          const solde = totalDebit - totalCredit;
          const soldeNormalise = Math.abs(solde) < 0.01 ? 0 : solde;

          tableBody.push([
            { text: 'Total', colSpan: 4, alignment: 'right', style: 'totalRow' }, {}, {}, {},
            { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
            { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' },
            { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }
          ]);

          const soldeLabel = soldeNormalise > 0 ? 'Solde Débiteur' : soldeNormalise < 0 ? 'Solde Créditeur' : 'Solde nul';
          tableBody.push([
            { text: soldeLabel, colSpan: 5, alignment: 'right', style: 'soldeRow' }, {}, {}, {}, {},
            { text: formatMontant(Math.abs(soldeNormalise)), alignment: 'right', style: 'soldeRow' },
            { text: '', style: 'soldeRow' }, { text: '', style: 'soldeRow' }, { text: '', style: 'soldeRow' }, { text: '', style: 'soldeRow' }
          ]);

          content.push({
            table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody },
            layout: {
              fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
              hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0',
              hLineWidth: () => 0.3, vLineWidth: () => 0.3,
              paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4
            }
          });
        } else {
          content.push({ text: 'Aucune ligne pour ce compte', style: 'noData' });
        }
      });

    } else if (type === 'SENS_ECRITURE') {

      const grouped = groupAnomaliesByCompte(anomalies);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach((compte) => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        content.push({
          text: `Anomalie de sens d'écriture pour le compte "${compte}"`,
          style: 'anomalyHeader'
        });

        if (lines.length > 0) {
          const tableBody = [[
            'Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'
          ].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];

          let totalDebit = 0, totalCredit = 0;

          lines.forEach((l, i) => {
            const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
            const debit = parseFloat(l.debit) || 0;
            const credit = parseFloat(l.credit) || 0;
            totalDebit += debit;
            totalCredit += credit;
            const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';

            tableBody.push([
              { text: formatDate(l.dateecriture), style: 'cell' },
              { text: l.comptegen || l.compteaux || '', style: 'cell' },
              { text: l.piece || '', style: 'cell' },
              { text: l.libelle || '', style: 'cell' },
              { text: formatMontant(debit), alignment: 'right', style: 'cell' },
              { text: formatMontant(credit), alignment: 'right', style: 'cell' },
              { text: l.lettrage || '', style: 'cell' },
              { text: l.analytique || '', style: 'cell' },
              valideIconCell(relatedAnomaly?.valide),
              { text: relatedAnomaly?.commentaire || '', style: 'cell' }
            ].map(cell => ({ ...cell, fillColor: rowColor })));
          });

          tableBody.push([
            { text: 'Total', colSpan: 4, alignment: 'right', style: 'totalRow' }, {}, {}, {},
            { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
            { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' },
            { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }
          ]);

          content.push({
            table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody },
            layout: {
              fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
              hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0',
              hLineWidth: () => 0.3, vLineWidth: () => 0.3,
              paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4
            }
          });
        } else {
          content.push({ text: 'Aucune ligne pour ce compte', style: 'noData' });
        }
      });

    } else if (type === 'UTIL_CPT_TVA') {

      anomalies.forEach((anomalie) => {
        const lines = anomalie.journalLines || [];
        content.push({
          text: `Écriture - ${anomalie.message || 'Anomalie TVA'}`,
          style: 'anomalyHeader'
        });

        if (lines.length > 0) {
          const tableBody = [[
            'Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'
          ].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];

          lines.forEach((l, i) => {
            const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
            tableBody.push([
              { text: formatDate(l.dateecriture), style: 'cell' },
              { text: l.comptegen || l.compteaux || '', style: 'cell' },
              { text: l.piece || '', style: 'cell' },
              { text: l.libelle || '', style: 'cell' },
              { text: formatMontant(parseFloat(l.debit) || 0), alignment: 'right', style: 'cell' },
              { text: formatMontant(parseFloat(l.credit) || 0), alignment: 'right', style: 'cell' },
              { text: l.lettrage || '', style: 'cell' },
              { text: l.analytique || '', style: 'cell' },
              valideIconCell(anomalie.valide),
              { text: anomalie.commentaire || '', style: 'cell' }
            ].map(cell => ({ ...cell, fillColor: rowColor })));
          });

          content.push({
            table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody },
            layout: {
              fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
              hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0',
              hLineWidth: () => 0.3, vLineWidth: () => 0.3,
              paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4
            }
          });
        } else {
          content.push({ text: 'Aucune ligne de journal', style: 'noData' });
        }
      });

    } else {

      // EXISTENCE et autres types : affichage par anomalie
      anomalies.forEach((anomalie) => {
        const lines = anomalie.journalLines || [];
        content.push({
          text: anomalie.message || 'Anomalie',
          style: 'anomalyHeader'
        });

        if (lines.length > 0) {
          const tableBody = [[
            'Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'
          ].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];

          lines.forEach((l, i) => {
            const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
            tableBody.push([
              { text: formatDate(l.dateecriture), style: 'cell' },
              { text: l.comptegen || l.compteaux || '', style: 'cell' },
              { text: l.piece || '', style: 'cell' },
              { text: l.libelle || '', style: 'cell' },
              { text: formatMontant(parseFloat(l.debit) || 0), alignment: 'right', style: 'cell' },
              { text: formatMontant(parseFloat(l.credit) || 0), alignment: 'right', style: 'cell' },
              { text: l.lettrage || '', style: 'cell' },
              { text: l.analytique || '', style: 'cell' },
              valideIconCell(anomalie.valide),
              { text: anomalie.commentaire || '', style: 'cell' }
            ].map(cell => ({ ...cell, fillColor: rowColor })));
          });

          content.push({
            table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody },
            layout: {
              fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
              hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0',
              hLineWidth: () => 0.3, vLineWidth: () => 0.3,
              paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4
            }
          });
        } else {
          content.push({ text: 'Aucune ligne de journal', style: 'noData' });
        }
      });
    }

    // ---------------- DOCUMENT ----------------
    // En-tête de page dynamique : contrôle (fixe) + sous-contrôle (compte) courant.
    content.forEach((n) => { if (n && n.style === 'anomalyHeader' && n.headlineLevel === undefined) n.headlineLevel = 2; });
    const ctrlLabel = `${controle?.description || 'Contrôle'}`;
    const sectionsL2 = [];
    const lastAtOrBefore = (arr, page) => arr.filter(s => s.page <= page).sort((a, b) => a.page - b.page).pop();

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [15, 34, 15, 25],

      defaultStyle: {
        font: 'Helvetica',
        fontSize: 8
      },

      pageBreakBefore: (currentNode) => {
        const pg = currentNode.startPosition && currentNode.startPosition.pageNumber;
        if (pg && currentNode.headlineLevel === 2) sectionsL2.push({ page: pg, label: currentNode.text });
        return false;
      },

      header: (currentPage) => {
        if (currentPage === 1) return null;
        const sous = lastAtOrBefore(sectionsL2, currentPage);
        return {
          margin: [15, 12, 15, 0],
          columns: [
            { text: ctrlLabel, bold: true, fontSize: 8, color: '#0E7C86' },
            { text: sous ? sous.label : '', alignment: 'right', fontSize: 8, color: '#6A7785' },
          ],
        };
      },

      content,

      styles: {
        header: {
          fontSize: 16,
          bold: true,
          color: '#2C3E50'
        },

        subheader: {
          fontSize: 10,
          bold: true,
          color: '#34495E',
          margin: [0, 2, 0, 2]
        },

        subheader2: {
          fontSize: 9,
          color: '#566573'
        },

        anomalyHeader: {
          fontSize: 10,
          bold: true,
          color: '#2C3E50',
          margin: [0, 10, 0, 5]
        },

        tableHeader: {
          bold: true,
          fontSize: 8,
          color: '#2C3E50'
        },

        cell: {
          fontSize: 7,
          color: '#2C3E50'
        },

        totalRow: {
          bold: true,
          fontSize: 7,
          color: '#2C3E50',
          fillColor: '#CFE6E4'
        },

        soldeRow: {
          bold: true,
          fontSize: 7,
          color: '#2C3E50',
          fillColor: '#FDEBD0'
        },

        noData: {
          fontSize: 9,
          italics: true,
          color: '#7F8C8D',
          margin: [0, 10, 0, 10]
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Revision_${id_controle}_${id_dossier}_${id_exercice}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('[REVISION][PDF] error:', error);
    return res.status(500).json({
      state: false,
      msg: 'Erreur serveur',
      error: error.message
    });
  }
};

// ── Excel Export ─────────────────────────────────────────────────────────────

exports.exportExcel = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, id_controle } = req.params;
    const { date_debut, date_fin, id_periode } = req.query;

    if (!id_compte || !id_dossier || !id_exercice || !id_controle) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const { controle, anomalies, type } = await getRevisionDetailsData(id_compte, id_dossier, id_exercice, id_controle, date_debut, date_fin, id_periode);

    const workbook = new ExcelJS.Workbook();
    const logo = tryReadLogo();

    const periodeText = (date_debut && date_fin)
      ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
      : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    const ws = workbook.addWorksheet('Ecritures');

    // Logo
    if (logo?.buffer) {
      const imageId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension || 'png' });
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 140, height: 45 } });
    }

    // Header info
    ws.mergeCells('A2:J2');
    ws.getCell('A2').value = 'DÉTAILS DE RÉVISION';
    ws.getCell('A2').font = { bold: true, size: 14 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:J3');
    ws.getCell('A3').value = `Dossier : ${dossier?.dossier || ''}`;
    ws.getCell('A3').font = { bold: true, size: 11 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.mergeCells('A4:J4');
    ws.getCell('A4').value = `${controle?.description || controle?.id_controle || ''} - Type: ${type}`;
    ws.getCell('A4').font = { bold: true, size: 10 };
    ws.getCell('A4').alignment = { horizontal: 'center' };

    ws.mergeCells('A5:J5');
    ws.getCell('A5').value = `Période : ${periodeText}`;
    ws.getCell('A5').font = { bold: true, size: 9 };
    ws.getCell('A5').alignment = { horizontal: 'center' };

    // Column widths
    ws.columns = [
      { width: 12 },  // Date
      { width: 14 },  // Compte
      { width: 12 },  // Pièce
      { width: 40 },  // Libellé
      { width: 14 },  // Débit
      { width: 14 },  // Crédit
      { width: 10 },  // Lettrage
      { width: 12 },  // Analytique
      { width: 8 },   // Validé
      { width: 30 }   // Commentaire
    ];

    // Bandeau de statistiques (Anomalies / Restant à valider)
    let rowCursor = 6;
    {
      const { total, restant } = computeStats(anomalies);
      rowCursor = writeExcelStats(ws, rowCursor, total, restant);
    }

    if (anomalies.length === 0) {
      ws.getRow(rowCursor).values = ['Aucune anomalie détectée'];
    } else if (type === 'ATYPIQUE') {
      // ── ATYPIQUE : un seul tableau par compte (auxiliaire) ──
      const grouped = groupAnomaliesByCompte(anomalies, true);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach(compte => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];
        const label = firstAnomaly?.message || `Anomalie atypique (${data.anomalies.length})`;

        // Compte header row
        const compteRow = ws.getRow(rowCursor);
        compteRow.values = [`Compte ${compte} - ${label}`];
        compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
        rowCursor += 1;

        // Table header
        const headerRow = ws.getRow(rowCursor);
        headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
        headerRow.alignment = { horizontal: 'center' };
        rowCursor += 1;

        // Data rows
        lines.forEach(l => {
          const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
          const dataRow = ws.getRow(rowCursor);
          dataRow.values = [
            formatDate(l.dateecriture),
            l.comptegen || l.compteaux || '',
            l.piece || '',
            l.libelle || '',
            parseFloat(l.debit) || 0,
            parseFloat(l.credit) || 0,
            l.lettrage || '',
            l.analytique || '',
            xlValide(relatedAnomaly?.valide),
            relatedAnomaly?.commentaire || ''
          ];
          dataRow.getCell('E').numFmt = '#,##0.00';
          dataRow.getCell('F').numFmt = '#,##0.00';
          rowCursor += 1;
        });

        // Empty row between comptes
        rowCursor += 1;
      });
    } else if (type === 'IMMO_CHARGE') {
      // ── IMMO_CHARGE : un seul tableau par compte ──
      const grouped = groupAnomaliesByCompte(anomalies);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach(compte => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        // Compte header row
        const compteRow = ws.getRow(rowCursor);
        compteRow.values = [`Actions pour le compte ${compte}`];
        compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
        rowCursor += 1;

        // Table header
        const headerRow = ws.getRow(rowCursor);
        headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
        headerRow.alignment = { horizontal: 'center' };
        rowCursor += 1;

        let totalDebit = 0;
        let totalCredit = 0;

        // Data rows
        lines.forEach(l => {
          const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
          const debit = parseFloat(l.debit) || 0;
          const credit = parseFloat(l.credit) || 0;
          totalDebit += debit;
          totalCredit += credit;
          const dataRow = ws.getRow(rowCursor);
          dataRow.values = [
            formatDate(l.dateecriture),
            l.comptegen || l.compteaux || '',
            l.piece || '',
            l.libelle || '',
            debit,
            credit,
            l.lettrage || '',
            l.analytique || '',
            xlValide(relatedAnomaly?.valide),
            relatedAnomaly?.commentaire || ''
          ];
          dataRow.getCell('E').numFmt = '#,##0.00';
          dataRow.getCell('F').numFmt = '#,##0.00';
          rowCursor += 1;
        });

        // Total row
        const solde = totalDebit - totalCredit;
        const soldeNormalise = Math.abs(solde) < 0.01 ? 0 : solde;
        const totalRow = ws.getRow(rowCursor);
        totalRow.values = ['Total', '', '', '', totalDebit, totalCredit, '', '', '', ''];
        totalRow.font = { bold: true };
        totalRow.getCell('E').numFmt = '#,##0.00';
        totalRow.getCell('F').numFmt = '#,##0.00';
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE6E4' } };
        rowCursor += 1;

        // Solde row
        const soldeLabel = soldeNormalise > 0
          ? 'Solde Débiteur'
          : soldeNormalise < 0
            ? 'Solde Créditeur'
            : 'Solde nul';
        const soldeRow = ws.getRow(rowCursor);
        soldeRow.values = [soldeLabel, '', '', '', '', Math.abs(soldeNormalise), '', '', '', ''];
        soldeRow.font = { bold: true };
        soldeRow.getCell('F').numFmt = '#,##0.00';
        soldeRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEBD0' } };
        rowCursor += 1;

        // Empty row between comptes
        rowCursor += 1;
      });
    } else if (type === 'SENS_SOLDE') {
      // ── SENS_SOLDE : groupé par compte avec total et solde ──
      const grouped = groupAnomaliesByCompte(anomalies);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach(compte => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        const testType = (controle?.test || '').toUpperCase();
        let detailMessage = `Le compte "${compte}" doit avoir un solde `;
        if (testType === 'DEBITEUR') detailMessage += 'débiteur';
        else if (testType === 'CREDITEUR') detailMessage += 'créditeur';
        else if (testType === 'NULL') detailMessage += 'nul';
        else detailMessage = `Anomalie de sens de solde pour le compte "${compte}"`;

        const compteRow = ws.getRow(rowCursor);
        compteRow.values = [detailMessage];
        compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
        rowCursor += 1;

        const headerRow = ws.getRow(rowCursor);
        headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
        headerRow.alignment = { horizontal: 'center' };
        rowCursor += 1;

        let totalDebit = 0, totalCredit = 0;

        lines.forEach(l => {
          const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
          const debit = parseFloat(l.debit) || 0;
          const credit = parseFloat(l.credit) || 0;
          totalDebit += debit;
          totalCredit += credit;
          const dataRow = ws.getRow(rowCursor);
          dataRow.values = [
            formatDate(l.dateecriture), l.comptegen || l.compteaux || '', l.piece || '', l.libelle || '',
            debit, credit, l.lettrage || '', l.analytique || '',
            xlValide(relatedAnomaly?.valide), relatedAnomaly?.commentaire || ''
          ];
          dataRow.getCell('E').numFmt = '#,##0.00';
          dataRow.getCell('F').numFmt = '#,##0.00';
          rowCursor += 1;
        });

        // Total
        const solde = totalDebit - totalCredit;
        const soldeNormalise = Math.abs(solde) < 0.01 ? 0 : solde;
        const totalRow = ws.getRow(rowCursor);
        totalRow.values = ['Total', '', '', '', totalDebit, totalCredit, '', '', '', ''];
        totalRow.font = { bold: true };
        totalRow.getCell('E').numFmt = '#,##0.00';
        totalRow.getCell('F').numFmt = '#,##0.00';
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE6E4' } };
        rowCursor += 1;

        // Solde
        const soldeLabel = soldeNormalise > 0 ? 'Solde Débiteur' : soldeNormalise < 0 ? 'Solde Créditeur' : 'Solde nul';
        const soldeRow = ws.getRow(rowCursor);
        soldeRow.values = [soldeLabel, '', '', '', '', Math.abs(soldeNormalise), '', '', '', ''];
        soldeRow.font = { bold: true };
        soldeRow.getCell('F').numFmt = '#,##0.00';
        soldeRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEBD0' } };
        rowCursor += 1;

        rowCursor += 1;
      });
    } else if (type === 'SENS_ECRITURE') {
      // ── SENS_ECRITURE : groupé par compte avec total ──
      const grouped = groupAnomaliesByCompte(anomalies);
      const comptes = Object.keys(grouped).sort();

      comptes.forEach(compte => {
        const data = grouped[compte];
        const lines = data.allLines;
        const firstAnomaly = data.anomalies[0];

        const compteRow = ws.getRow(rowCursor);
        compteRow.values = [`Anomalie de sens d'écriture pour le compte "${compte}"`];
        compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
        rowCursor += 1;

        const headerRow = ws.getRow(rowCursor);
        headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
        headerRow.alignment = { horizontal: 'center' };
        rowCursor += 1;

        let totalDebit = 0, totalCredit = 0;

        lines.forEach(l => {
          const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
          const debit = parseFloat(l.debit) || 0;
          const credit = parseFloat(l.credit) || 0;
          totalDebit += debit;
          totalCredit += credit;
          const dataRow = ws.getRow(rowCursor);
          dataRow.values = [
            formatDate(l.dateecriture), l.comptegen || l.compteaux || '', l.piece || '', l.libelle || '',
            debit, credit, l.lettrage || '', l.analytique || '',
            xlValide(relatedAnomaly?.valide), relatedAnomaly?.commentaire || ''
          ];
          dataRow.getCell('E').numFmt = '#,##0.00';
          dataRow.getCell('F').numFmt = '#,##0.00';
          rowCursor += 1;
        });

        // Total
        const totalRow = ws.getRow(rowCursor);
        totalRow.values = ['Total', '', '', '', totalDebit, totalCredit, '', '', '', ''];
        totalRow.font = { bold: true };
        totalRow.getCell('E').numFmt = '#,##0.00';
        totalRow.getCell('F').numFmt = '#,##0.00';
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE6E4' } };
        rowCursor += 1;

        rowCursor += 1;
      });
    } else if (type === 'UTIL_CPT_TVA') {
      // ── UTIL_CPT_TVA : par anomalie (écriture) ──
      anomalies.forEach(anomalie => {
        const lines = anomalie.journalLines || [];

        const compteRow = ws.getRow(rowCursor);
        compteRow.values = [`Écriture - ${anomalie.message || 'Anomalie TVA'}`];
        compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
        rowCursor += 1;

        if (lines.length > 0) {
          const headerRow = ws.getRow(rowCursor);
          headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
          headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
          headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
          headerRow.alignment = { horizontal: 'center' };
          rowCursor += 1;

          lines.forEach(l => {
            const dataRow = ws.getRow(rowCursor);
            dataRow.values = [
              formatDate(l.dateecriture), l.comptegen || l.compteaux || '', l.piece || '', l.libelle || '',
              parseFloat(l.debit) || 0, parseFloat(l.credit) || 0, l.lettrage || '', l.analytique || '',
              xlValide(anomalie.valide), anomalie.commentaire || ''
            ];
            dataRow.getCell('E').numFmt = '#,##0.00';
            dataRow.getCell('F').numFmt = '#,##0.00';
            rowCursor += 1;
          });
        }

        rowCursor += 1;
      });
    } else {
      // ── EXISTENCE et autres types : par anomalie ──
      anomalies.forEach(anomalie => {
        const lines = anomalie.journalLines || [];

        const compteRow = ws.getRow(rowCursor);
        compteRow.values = [anomalie.message || 'Anomalie'];
        compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
        rowCursor += 1;

        if (lines.length > 0) {
          const headerRow = ws.getRow(rowCursor);
          headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
          headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
          headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
          headerRow.alignment = { horizontal: 'center' };
          rowCursor += 1;

          lines.forEach(l => {
            const dataRow = ws.getRow(rowCursor);
            dataRow.values = [
              formatDate(l.dateecriture), l.comptegen || l.compteaux || '', l.piece || '', l.libelle || '',
              parseFloat(l.debit) || 0, parseFloat(l.credit) || 0, l.lettrage || '', l.analytique || '',
              xlValide(anomalie.valide), anomalie.commentaire || ''
            ];
            dataRow.getCell('E').numFmt = '#,##0.00';
            dataRow.getCell('F').numFmt = '#,##0.00';
            rowCursor += 1;
          });
        }

        rowCursor += 1;
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Revision_${id_controle}_${id_dossier}_${id_exercice}.xlsx`);
    workbook.worksheets.forEach(ws => applyKaontyStyle(ws));
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('[REVISION][EXCEL] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

// ── Helper: add type-specific content to a pdfmake content array ────────────

const buildTypeContent = (type, anomalies, controle) => {
  const content = [];

  if (!anomalies || anomalies.length === 0) {
    content.push({ text: 'Aucune anomalie détectée', style: 'noData' });
    return content;
  }

  if (type === 'ATYPIQUE') {
    const grouped = groupAnomaliesByCompte(anomalies, true);
    const comptes = Object.keys(grouped).sort();
    comptes.forEach((compte) => {
      const data = grouped[compte];
      const lines = data.allLines;
      const firstAnomaly = data.anomalies[0];
      const label = firstAnomaly?.message || `Anomalie (${data.anomalies.length})`;
      content.push({ text: `Compte ${compte} - ${label}`, style: 'anomalyHeader' });
      if (lines.length > 0) {
        const tableBody = [['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];
        lines.forEach((l, i) => {
          const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
          const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
          tableBody.push([
            { text: formatDate(l.dateecriture), style: 'cell' },
            { text: l.comptegen || l.compteaux || '', style: 'cell' },
            { text: l.piece || '', style: 'cell' },
            { text: l.libelle || '', style: 'cell' },
            { text: formatMontant(parseFloat(l.debit) || 0), alignment: 'right', style: 'cell' },
            { text: formatMontant(parseFloat(l.credit) || 0), alignment: 'right', style: 'cell' },
            { text: l.lettrage || '', style: 'cell' },
            { text: l.analytique || '', style: 'cell' },
            valideIconCell(relatedAnomaly?.valide),
            { text: relatedAnomaly?.commentaire || '', style: 'cell' }
          ].map(cell => ({ ...cell, fillColor: rowColor })));
        });
        content.push({ table: { headerRows: 1, widths: ['9%', '9%', '8%', '*', '11%', '11%', '7%', '9%', '6%', '12%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF', hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } });
      } else {
        content.push({ text: 'Aucune ligne pour ce compte', style: 'noData' });
      }
    });
  } else if (type === 'IMMO_CHARGE' || type === 'SENS_SOLDE' || type === 'SENS_ECRITURE') {
    const grouped = groupAnomaliesByCompte(anomalies);
    const comptes = Object.keys(grouped).sort();
    comptes.forEach((compte) => {
      const data = grouped[compte];
      const lines = data.allLines;
      const firstAnomaly = data.anomalies[0];

      let headerText = `Compte ${compte}`;
      if (type === 'IMMO_CHARGE') headerText = `Actions pour le compte ${compte}`;
      else if (type === 'SENS_SOLDE') {
        const testType = (controle?.test || '').toUpperCase();
        headerText = `Le compte "${compte}" doit avoir un solde ${testType === 'DEBITEUR' ? 'débiteur' : testType === 'CREDITEUR' ? 'créditeur' : testType === 'NULL' ? 'nul' : ''}`.trim() || `Anomalie de sens de solde pour le compte "${compte}"`;
      } else if (type === 'SENS_ECRITURE') headerText = `Anomalie de sens d'écriture pour le compte "${compte}"`;

      content.push({ text: headerText, style: 'anomalyHeader' });
      if (lines.length > 0) {
        const tableBody = [['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];
        let totalDebit = 0, totalCredit = 0;
        lines.forEach((l, i) => {
          const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
          const debit = parseFloat(l.debit) || 0;
          const credit = parseFloat(l.credit) || 0;
          totalDebit += debit;
          totalCredit += credit;
          const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
          tableBody.push([
            { text: formatDate(l.dateecriture), style: 'cell' },
            { text: l.comptegen || l.compteaux || '', style: 'cell' },
            { text: l.piece || '', style: 'cell' },
            { text: l.libelle || '', style: 'cell' },
            { text: formatMontant(debit), alignment: 'right', style: 'cell' },
            { text: formatMontant(credit), alignment: 'right', style: 'cell' },
            { text: l.lettrage || '', style: 'cell' },
            { text: l.analytique || '', style: 'cell' },
            valideIconCell(relatedAnomaly?.valide),
            { text: relatedAnomaly?.commentaire || '', style: 'cell' }
          ].map(cell => ({ ...cell, fillColor: rowColor })));
        });

        if (type === 'IMMO_CHARGE' || type === 'SENS_SOLDE') {
          const solde = totalDebit - totalCredit;
          const soldeNormalise = Math.abs(solde) < 0.01 ? 0 : solde;
          tableBody.push([
            { text: 'Total', colSpan: 4, alignment: 'right', style: 'totalRow' }, {}, {}, {},
            { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
            { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' },
            { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }
          ]);
          const soldeLabel = soldeNormalise > 0 ? 'Solde Débiteur' : soldeNormalise < 0 ? 'Solde Créditeur' : 'Solde nul';
          tableBody.push([
            { text: soldeLabel, colSpan: 5, alignment: 'right', style: 'soldeRow' }, {}, {}, {}, {},
            { text: formatMontant(Math.abs(soldeNormalise)), alignment: 'right', style: 'soldeRow' },
            { text: '', style: 'soldeRow' }, { text: '', style: 'soldeRow' }, { text: '', style: 'soldeRow' }, { text: '', style: 'soldeRow' }
          ]);
        } else {
          tableBody.push([
            { text: 'Total', colSpan: 4, alignment: 'right', style: 'totalRow' }, {}, {}, {},
            { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
            { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' },
            { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }, { text: '', style: 'totalRow' }
          ]);
        }

        content.push({ table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF', hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } });
      } else {
        content.push({ text: 'Aucune ligne pour ce compte', style: 'noData' });
      }
    });
  } else if (type === 'UTIL_CPT_TVA') {
    anomalies.forEach((anomalie) => {
      const lines = anomalie.journalLines || [];
      content.push({ text: `Écriture - ${anomalie.message || 'Anomalie TVA'}`, style: 'anomalyHeader' });
      if (lines.length > 0) {
        const tableBody = [['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];
        lines.forEach((l, i) => {
          const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
          tableBody.push([
            { text: formatDate(l.dateecriture), style: 'cell' },
            { text: l.comptegen || l.compteaux || '', style: 'cell' },
            { text: l.piece || '', style: 'cell' },
            { text: l.libelle || '', style: 'cell' },
            { text: formatMontant(parseFloat(l.debit) || 0), alignment: 'right', style: 'cell' },
            { text: formatMontant(parseFloat(l.credit) || 0), alignment: 'right', style: 'cell' },
            { text: l.lettrage || '', style: 'cell' },
            { text: l.analytique || '', style: 'cell' },
            valideIconCell(anomalie.valide),
            { text: anomalie.commentaire || '', style: 'cell' }
          ].map(cell => ({ ...cell, fillColor: rowColor })));
        });
        content.push({ table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF', hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } });
      } else {
        content.push({ text: 'Aucune ligne de journal', style: 'noData' });
      }
    });
  } else {
    anomalies.forEach((anomalie) => {
      const lines = anomalie.journalLines || [];
      content.push({ text: anomalie.message || 'Anomalie', style: 'anomalyHeader' });
      if (lines.length > 0) {
        const tableBody = [['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];
        lines.forEach((l, i) => {
          const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
          tableBody.push([
            { text: formatDate(l.dateecriture), style: 'cell' },
            { text: l.comptegen || l.compteaux || '', style: 'cell' },
            { text: l.piece || '', style: 'cell' },
            { text: l.libelle || '', style: 'cell' },
            { text: formatMontant(parseFloat(l.debit) || 0), alignment: 'right', style: 'cell' },
            { text: formatMontant(parseFloat(l.credit) || 0), alignment: 'right', style: 'cell' },
            { text: l.lettrage || '', style: 'cell' },
            { text: l.analytique || '', style: 'cell' },
            valideIconCell(anomalie.valide),
            { text: anomalie.commentaire || '', style: 'cell' }
          ].map(cell => ({ ...cell, fillColor: rowColor })));
        });
        content.push({ table: { headerRows: 1, widths: ['8%', '8%', '8%', '*', '9%', '9%', '7%', '8%', '7%', '12%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF', hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } });
      } else {
        content.push({ text: 'Aucune ligne de journal', style: 'noData' });
      }
    });
  }

  return content;
};

// ── Helper: add type-specific rows to an ExcelJS worksheet ──────────────────

const addTypeRowsToSheet = (ws, type, anomalies, controle, rowCursor) => {
  if (!anomalies || anomalies.length === 0) {
    ws.getRow(rowCursor).values = ['Aucune anomalie détectée'];
    return rowCursor + 2;
  }

  const addHeaderRow = (cursor) => {
    const headerRow = ws.getRow(cursor);
    headerRow.values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Lettrage', 'Analytique', 'Validé', 'Commentaire'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C86' } };
    headerRow.alignment = { horizontal: 'center' };
    return cursor + 1;
  };

  const addDataRow = (cursor, l, valideText, commentaireText) => {
    const dataRow = ws.getRow(cursor);
    dataRow.values = [
      formatDate(l.dateecriture), l.comptegen || l.compteaux || '', l.piece || '', l.libelle || '',
      parseFloat(l.debit) || 0, parseFloat(l.credit) || 0, l.lettrage || '', l.analytique || '',
      valideText, commentaireText
    ];
    dataRow.getCell('E').numFmt = '#,##0.00';
    dataRow.getCell('F').numFmt = '#,##0.00';
    return cursor + 1;
  };

  if (type === 'ATYPIQUE') {
    const grouped = groupAnomaliesByCompte(anomalies, true);
    const comptes = Object.keys(grouped).sort();
    comptes.forEach(compte => {
      const data = grouped[compte];
      const lines = data.allLines;
      const firstAnomaly = data.anomalies[0];
      const label = firstAnomaly?.message || `Anomalie atypique (${data.anomalies.length})`;
      const compteRow = ws.getRow(rowCursor);
      compteRow.values = [`Compte ${compte} - ${label}`];
      compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
      rowCursor += 1;
      rowCursor = addHeaderRow(rowCursor);
      lines.forEach(l => {
        const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
        rowCursor = addDataRow(rowCursor, l, xlValide(relatedAnomaly?.valide), relatedAnomaly?.commentaire || '');
      });
      rowCursor += 1;
    });
  } else if (type === 'IMMO_CHARGE' || type === 'SENS_SOLDE' || type === 'SENS_ECRITURE') {
    const grouped = groupAnomaliesByCompte(anomalies);
    const comptes = Object.keys(grouped).sort();
    comptes.forEach(compte => {
      const data = grouped[compte];
      const lines = data.allLines;
      const firstAnomaly = data.anomalies[0];
      let headerText = `Compte ${compte}`;
      if (type === 'IMMO_CHARGE') headerText = `Actions pour le compte ${compte}`;
      else if (type === 'SENS_SOLDE') {
        const testType = (controle?.test || '').toUpperCase();
        headerText = `Le compte "${compte}" doit avoir un solde ${testType === 'DEBITEUR' ? 'débiteur' : testType === 'CREDITEUR' ? 'créditeur' : testType === 'NULL' ? 'nul' : ''}`.trim() || `Anomalie de sens de solde pour le compte "${compte}"`;
      } else if (type === 'SENS_ECRITURE') headerText = `Anomalie de sens d'écriture pour le compte "${compte}"`;

      const compteRow = ws.getRow(rowCursor);
      compteRow.values = [headerText];
      compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
      rowCursor += 1;
      rowCursor = addHeaderRow(rowCursor);

      let totalDebit = 0, totalCredit = 0;
      lines.forEach(l => {
        const relatedAnomaly = data.anomalies.find(a => a.journalLines?.some(jl => jl.id === l.id)) || firstAnomaly;
        const debit = parseFloat(l.debit) || 0;
        const credit = parseFloat(l.credit) || 0;
        totalDebit += debit;
        totalCredit += credit;
        rowCursor = addDataRow(rowCursor, l, xlValide(relatedAnomaly?.valide), relatedAnomaly?.commentaire || '');
      });

      // Total row
      const totalRow = ws.getRow(rowCursor);
      totalRow.values = ['Total', '', '', '', totalDebit, totalCredit, '', '', '', ''];
      totalRow.font = { bold: true };
      totalRow.getCell('E').numFmt = '#,##0.00';
      totalRow.getCell('F').numFmt = '#,##0.00';
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE6E4' } };
      rowCursor += 1;

      if (type === 'IMMO_CHARGE' || type === 'SENS_SOLDE') {
        const solde = totalDebit - totalCredit;
        const soldeNormalise = Math.abs(solde) < 0.01 ? 0 : solde;
        const soldeLabel = soldeNormalise > 0 ? 'Solde Débiteur' : soldeNormalise < 0 ? 'Solde Créditeur' : 'Solde nul';
        const soldeRow = ws.getRow(rowCursor);
        soldeRow.values = [soldeLabel, '', '', '', '', Math.abs(soldeNormalise), '', '', '', ''];
        soldeRow.font = { bold: true };
        soldeRow.getCell('F').numFmt = '#,##0.00';
        soldeRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEBD0' } };
        rowCursor += 1;
      }
      rowCursor += 1;
    });
  } else if (type === 'UTIL_CPT_TVA') {
    anomalies.forEach(anomalie => {
      const lines = anomalie.journalLines || [];
      const compteRow = ws.getRow(rowCursor);
      compteRow.values = [`Écriture - ${anomalie.message || 'Anomalie TVA'}`];
      compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
      rowCursor += 1;
      if (lines.length > 0) {
        rowCursor = addHeaderRow(rowCursor);
        lines.forEach(l => {
          rowCursor = addDataRow(rowCursor, l, xlValide(anomalie.valide), anomalie.commentaire || '');
        });
      }
      rowCursor += 1;
    });
  } else {
    anomalies.forEach(anomalie => {
      const lines = anomalie.journalLines || [];
      const compteRow = ws.getRow(rowCursor);
      compteRow.values = [anomalie.message || 'Anomalie'];
      compteRow.font = { bold: true, color: { argb: 'FF0E7C86' }, size: 10 };
      rowCursor += 1;
      if (lines.length > 0) {
        rowCursor = addHeaderRow(rowCursor);
        lines.forEach(l => {
          rowCursor = addDataRow(rowCursor, l, xlValide(anomalie.valide), anomalie.commentaire || '');
        });
      }
      rowCursor += 1;
    });
  }

  return rowCursor;
};

// ── Reusable PDF section builder (all types) ─────────────────────────────────
// Builds the per-type sections (no logo, no global header). Returns the
// pdfmake content nodes and the styles used by those sections.

exports.buildPdfSection = async ({ id_compte, id_dossier, id_exercice, date_debut, date_fin, id_periode }) => {
  // Fetch all controls for this exercice
  const allControles = await revisionControle.findAll({
    where: { id_compte, id_dossier, id_exercice },
    order: [['Type', 'ASC'], ['id_controle', 'ASC']]
  });

  // Group by Type
  const byType = new Map();
  for (const c of allControles) {
    const key = c.Type || '';
    if (!key) continue;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key).push(c);
  }

  const content = [];

  // En-tête d'un contrôle : titre unique + saut de page (sauf le tout premier).
  // headlineLevel:1 permet à l'en-tête de page dynamique de retrouver le contrôle courant.
  const controlHeader = (label) => ({
    text: label,
    style: 'typeSectionHeader',
    headlineLevel: 1,
    pageBreak: content.length ? 'before' : undefined,
    margin: [0, 0, 0, 6],
  });

  // Iterate over each type — un en-tête PAR contrôle (plus de doublon de titre),
  // chaque contrôle démarre sur une nouvelle page.
  const types = Array.from(byType.keys()).sort();
  for (const type of types) {
    const controlesForType = byType.get(type);

    let anyAnomaly = false;
    for (const controle of controlesForType) {
      try {
        const { anomalies } = await getRevisionDetailsData(
          id_compte, id_dossier, id_exercice, controle.id_controle,
          date_debut, date_fin, id_periode
        );
        if (!anomalies || anomalies.length === 0) continue;
        anyAnomaly = true;
        const { total, restant } = computeStats(anomalies);
        content.push(controlHeader(`${controle.description || 'Contrôle'}`));
        content.push(statsBand(total, restant));
        content.push(...buildTypeContent(type, anomalies, controle));
      } catch (err) {
        console.error(`[REVISION][GLOBAL_PDF] Error fetching data for controle ${controle.id_controle}:`, err.message);
        content.push({ text: `Erreur pour le contrôle ${controle.id_controle}`, style: 'noData' });
      }
    }
    if (!anyAnomaly) {
      const c0 = controlesForType[0];
      content.push(controlHeader(`${c0?.description || type}`));
      content.push({ text: 'Aucune anomalie détectée', style: 'noData' });
    }
  }

  // Marque les sous-en-têtes (par compte / écriture) pour l'en-tête de page dynamique.
  content.forEach((n) => { if (n && n.style === 'anomalyHeader' && n.headlineLevel === undefined) n.headlineLevel = 2; });

  const styles = {
    typeSectionHeader: { fontSize: 13, bold: true, color: '#0E7C86', margin: [0, 15, 0, 5] },
    anomalyHeader: { fontSize: 10, bold: true, color: '#2C3E50', margin: [0, 10, 0, 5] },
    tableHeader: { bold: true, fontSize: 8, color: '#2C3E50' },
    cell: { fontSize: 7, color: '#2C3E50' },
    totalRow: { bold: true, fontSize: 7, color: '#2C3E50', fillColor: '#CFE6E4' },
    soldeRow: { bold: true, fontSize: 7, color: '#2C3E50', fillColor: '#FDEBD0' },
    noData: { fontSize: 9, italics: true, color: '#7F8C8D', margin: [0, 10, 0, 10] }
  };

  return { content, styles };
};

// ── Global PDF Export (all types) ────────────────────────────────────────────

exports.exportGlobalPdf = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { date_debut, date_fin, id_periode } = req.query;

    if (!id_compte || !id_dossier || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);

    const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
    const printer = new PdfPrinter(fonts);
    const logo = tryReadLogo();

    const periodeText = (date_debut && date_fin)
      ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
      : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    // Header
    const headerColumns = [];
    if (logo?.dataUrl) headerColumns.push({ image: logo.dataUrl, width: 90 });
    headerColumns.push({
      width: '*',
      stack: [
        { text: 'RÉVISION GLOBALE', style: 'header', alignment: 'center' },
        { text: `Dossier : ${dossier?.dossier || ''}`, style: 'subheader', alignment: 'center' },
        { text: `Période : ${periodeText}`, style: 'subheader2', alignment: 'center' }
      ]
    });

    const section = await exports.buildPdfSection({ id_compte, id_dossier, id_exercice, date_debut, date_fin, id_periode });

    const content = [
      { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 15] },
      ...section.content
    ];

    // En-tête de page dynamique : on enregistre, pendant la mise en page, la page
    // de début de chaque contrôle (headlineLevel 1) et sous-contrôle (headlineLevel 2),
    // puis l'en-tête affiche, pour chaque page, le contrôle/sous-contrôle courant.
    const sectionsL1 = [];
    const sectionsL2 = [];
    const lastAtOrBefore = (arr, page) => arr.filter(s => s.page <= page).sort((a, b) => a.page - b.page).pop();

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [15, 34, 15, 25],
      defaultStyle: { font: 'Helvetica', fontSize: 8 },
      content,
      pageBreakBefore: (currentNode) => {
        const pg = currentNode.startPosition && currentNode.startPosition.pageNumber;
        if (pg) {
          if (currentNode.headlineLevel === 1) sectionsL1.push({ page: pg, label: currentNode.text });
          else if (currentNode.headlineLevel === 2) sectionsL2.push({ page: pg, label: currentNode.text });
        }
        return false;
      },
      header: (currentPage) => {
        if (currentPage === 1) return null; // page 1 : le grand bloc titre suffit
        const ctrl = lastAtOrBefore(sectionsL1, currentPage);
        if (!ctrl) return null;
        const sous = lastAtOrBefore(sectionsL2, currentPage);
        const sousLabel = (sous && sous.page >= ctrl.page) ? sous.label : '';
        return {
          margin: [15, 12, 15, 0],
          columns: [
            { text: ctrl.label, bold: true, fontSize: 8, color: '#0E7C86' },
            { text: sousLabel, alignment: 'right', fontSize: 8, color: '#6A7785' },
          ],
        };
      },
      styles: {
        header: { fontSize: 16, bold: true, color: '#2C3E50' },
        subheader: { fontSize: 10, bold: true, color: '#34495E', margin: [0, 2, 0, 2] },
        subheader2: { fontSize: 9, color: '#566573' },
        ...section.styles
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Revision_Globale_${id_dossier}_${id_exercice}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('[REVISION][GLOBAL_PDF] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

// ── Reusable Excel sheet builder (all types) ─────────────────────────────────
// Adds one worksheet per control type to the workbook PASSED IN.
// Does not create a workbook and does not write to a response.

exports.addExcelSheets = async (workbook, { id_compte, id_dossier, id_exercice, date_debut, date_fin, id_periode }, ctx = {}) => {
  const dossier = await dossiers.findByPk(id_dossier);
  const exercice = await exercices.findByPk(id_exercice);

  const allControles = await revisionControle.findAll({
    where: { id_compte, id_dossier, id_exercice },
    order: [['Type', 'ASC'], ['id_controle', 'ASC']]
  });

  const byType = new Map();
  for (const c of allControles) {
    const key = c.Type || '';
    if (!key) continue;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key).push(c);
  }

  const logo = ctx.logo || tryReadLogo();

  const periodeText = (date_debut && date_fin)
    ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
    : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

  // Create one sheet per type
  const types = Array.from(byType.keys()).sort();
  for (const type of types) {
    const controlesForType = byType.get(type);
    const description = controlesForType[0]?.description || type;

    // Sheet name max 31 chars for Excel
    const sheetName = type.substring(0, 31);
    const ws = workbook.addWorksheet(sheetName);

    ws.columns = [
      { width: 12 }, { width: 14 }, { width: 12 }, { width: 40 },
      { width: 14 }, { width: 14 }, { width: 10 }, { width: 12 },
      { width: 8 }, { width: 30 }
    ];

    // Logo
    if (logo?.buffer) {
      const imageId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension || 'png' });
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 140, height: 45 } });
    }

    // Header info
    ws.mergeCells('A2:J2');
    ws.getCell('A2').value = `RÉVISION - ${description}`;
    ws.getCell('A2').font = { bold: true, size: 14 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:J3');
    ws.getCell('A3').value = `Dossier : ${dossier?.dossier || ''}`;
    ws.getCell('A3').font = { bold: true, size: 11 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.mergeCells('A4:J4');
    ws.getCell('A4').value = `Période : ${periodeText}`;
    ws.getCell('A4').font = { bold: true, size: 9 };
    ws.getCell('A4').alignment = { horizontal: 'center' };

    let rowCursor = 6;

    // On saute les contrôles sans anomalie pour éviter la répétition de
    // « Aucune anomalie détectée » ; message écrit une seule fois si le type est vide.
    let anyAnomaly = false;
    for (const controle of controlesForType) {
      try {
        const { anomalies } = await getRevisionDetailsData(
          id_compte, id_dossier, id_exercice, controle.id_controle,
          date_debut, date_fin, id_periode
        );
        if (!anomalies || anomalies.length === 0) continue;
        anyAnomaly = true;
        const { total, restant } = computeStats(anomalies);
        // Libellé seulement s'il y a plusieurs contrôles dans le type (sinon = titre de l'onglet).
        const statLabel = controlesForType.length > 1 ? (controle.description || `Contrôle ${controle.id_controle}`) : null;
        rowCursor = writeExcelStats(ws, rowCursor, total, restant, statLabel);
        rowCursor = addTypeRowsToSheet(ws, type, anomalies, controle, rowCursor);
      } catch (err) {
        console.error(`[REVISION][GLOBAL_EXCEL] Error for controle ${controle.id_controle}:`, err.message);
        ws.getRow(rowCursor).values = [`Erreur pour le contrôle ${controle.id_controle}`];
        rowCursor += 2;
      }
    }
    if (!anyAnomaly) {
      ws.getRow(rowCursor).values = ['Aucune anomalie détectée'];
      rowCursor += 2;
    }
  }

  return workbook;
};

// ── Global Excel Export (all types) ─────────────────────────────────────────

exports.exportGlobalExcel = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { date_debut, date_fin, id_periode } = req.query;

    if (!id_compte || !id_dossier || !id_exercice) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const workbook = new ExcelJS.Workbook();

    await exports.addExcelSheets(workbook, { id_compte, id_dossier, id_exercice, date_debut, date_fin, id_periode });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Revision_Globale_${id_dossier}_${id_exercice}.xlsx`);
    workbook.worksheets.forEach(ws => applyKaontyStyle(ws));
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('[REVISION][GLOBAL_EXCEL] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};
