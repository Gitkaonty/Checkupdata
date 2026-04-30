const db = require("../../Models");
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const dossiers = db.dossiers;
const exercices = db.exercices;
const revisionControle = db.revisionControle;
const tableControleAnomalies = db.tableControleAnomalies;
const journals = db.journals;

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
  // Formater manuellement pour éviter les problèmes d'espaces insécables dans pdfmake
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Ajouter des espaces comme séparateurs de milliers
  let formatted = '';
  let count = 0;
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      formatted = ' ' + formatted;
    }
    formatted = integerPart[i] + formatted;
    count++;
  }
  
  return formatted + ',' + decimalPart;
}

const tryReadLogo = () => {
  const explicitPath = process.env.REPORT_LOGO_PATH;
  const candidatePaths = [
    explicitPath,
    path.join(process.cwd(), 'assets', 'logo.png'),
    path.join(__dirname, '..', '..', 'assets', 'logo.png'),
    path.join(__dirname, '..', '..', '..', 'front', 'kaonti', 'src', 'img', '30.png')
  ].filter(Boolean);

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        return {
          dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
          buffer: buf,
          extension: 'png'
        };
      }
    } catch (_) {
    }
  }
  return null;
};

// Récupérer les données pour l'export (PDF/Excel)
const getRevisionDetailsData = async (id_compte, id_dossier, id_exercice, id_controle, date_debut, date_fin) => {
  const controle = await revisionControle.findOne({ where: { id_compte, id_dossier, id_exercice, id_controle } });
  if (!controle) throw new Error('Contrôle non trouvé');

  const affichage = controle?.Affichage || 'ligne';
  const anomalies = await tableControleAnomalies.findAll({
    where: { id_compte, id_dossier, id_exercice, id_controle },
    order: [['id', 'ASC']]
  });

  const dateFilter = (date_debut && date_fin)
    ? { dateecriture: { [Op.gte]: date_debut, [Op.lte]: date_fin } }
    : {};

  const idJnlKeys = [...new Set(anomalies.map(a => a.id_jnl).filter(Boolean))];
  let journalLines = [];

  if (idJnlKeys.length > 0) {
    if (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE') {
      journalLines = await journals.findAll({
        where: { comptegen: { [Op.in]: idJnlKeys }, id_compte, id_dossier, id_exercice, ...dateFilter },
        order: [['dateecriture', 'ASC'], ['id', 'ASC']]
      });
    } else if (controle?.Type === 'UTIL_CPT_TVA' || affichage === 'ecriture') {
      journalLines = await journals.findAll({
        where: { id_ecriture: { [Op.in]: idJnlKeys }, id_compte, id_dossier, id_exercice, ...dateFilter },
        order: [['dateecriture', 'ASC'], ['id', 'ASC']]
      });
    } else {
      const ids = idJnlKeys.map(v => parseInt(v, 10)).filter(v => Number.isFinite(v));
      if (ids.length > 0) {
        journalLines = await journals.findAll({
          where: { id: { [Op.in]: ids }, id_compte, id_dossier, id_exercice, ...dateFilter },
          order: [['dateecriture', 'ASC'], ['id', 'ASC']]
        });
      }
    }
  }

  const anomaliesWithLines = anomalies.map((a) => {
    const anomalieData = a.toJSON();
    let lines = [];

    if (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE') {
      lines = journalLines.filter(l => String(l.comptegen) === String(a.id_jnl));
    } else if (controle?.Type === 'IMMO_CHARGE') {
      lines = journalLines.filter(l => {
        const debit = parseFloat(l.debit) || 0;
        return String(l.comptegen) === String(a.id_jnl) && debit > 500;
      });
    } else if (controle?.Type === 'UTIL_CPT_TVA' || affichage === 'ecriture') {
      lines = journalLines.filter(l => {
        const cpt = l.comptegen || '';
        return String(l.id_ecriture) === String(a.id_jnl) && !cpt.startsWith('28');
      });
    } else {
      lines = journalLines.filter(l => String(l.id) === String(a.id_jnl));
    }

    anomalieData.journalLines = lines;
    anomalieData.compteNum = (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE') ? a.id_jnl : null;
    return anomalieData;
  });

  const rows = [];
  anomaliesWithLines.forEach((an) => {
    const compte = an.compteNum || an.id_jnl || '';
    (an.journalLines || []).forEach((l) => {
      rows.push({
        compte,
        date: formatDate(l.dateecriture),
        journal: l.id_journal ?? l.codejournal ?? '',
        piece: l.piece || '',
        libelle: l.libelle || '',
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0
      });
    });
  });

  return { controle, anomalies: anomaliesWithLines, rows };
};

// Export PDF
exports.exportPdf = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, id_controle } = req.params;
    const { date_debut, date_fin } = req.query;

    if (!id_compte || !id_dossier || !id_exercice || !id_controle) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const { controle, anomalies, rows } = await getRevisionDetailsData(id_compte, id_dossier, id_exercice, id_controle, date_debut, date_fin);

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

    const periodeText = (date_debut && date_fin)
      ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
      : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    const headerColumns = [];
    if (logo?.dataUrl) {
      headerColumns.push({ image: logo.dataUrl, width: 110, alignment: 'left' });
    }
    headerColumns.push({
      width: '*',
      stack: [
        { text: 'DÉTAILS DE RÉVISION', style: 'header', alignment: 'center' },
        { text: `Dossier : ${dossier?.dossier || ''}`, style: 'subheader', alignment: 'center', margin: [0, 2, 0, 0] },
        { text: '' },
        { text: `${controle?.description || controle?.id_controle || ''}`, style: 'subheader2', alignment: 'center' },
        { text: `Période : ${periodeText}`, style: 'subheader2', alignment: 'center' }
      ]
    });

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [20, 20, 20, 30],
      defaultStyle: { font: 'Helvetica', fontSize: 8 },
      content: [
        { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 10] },
        ...(anomalies.length ? anomalies.flatMap((a) => {
          const compte = a.compteNum || a.id_jnl || '';
          const title = `Compte ${compte}: ${a.message || ''}`;
          const lines = Array.isArray(a.journalLines) ? a.journalLines : [];

          const tableBody = [[
            { text: 'Date', style: 'tableHeader' },
            { text: 'Pièce', style: 'tableHeader' },
            { text: 'Libellé', style: 'tableHeader' },
            { text: 'Débit', style: 'tableHeader' },
            { text: 'Crédit', style: 'tableHeader' }
          ]];

          let totalDebit = 0;
          let totalCredit = 0;

          lines.forEach((l) => {
            const debit = parseFloat(l.debit) || 0;
            const credit = parseFloat(l.credit) || 0;
            totalDebit += debit;
            totalCredit += credit;
            tableBody.push([
              { text: formatDate(l.dateecriture), margin: [0, 2, 0, 2] },
              { text: l.piece || '', margin: [0, 2, 0, 2] },
              { text: l.libelle || '', margin: [0, 2, 0, 2] },
              { text: formatMontant(debit), alignment: 'right', margin: [0, 2, 0, 2] },
              { text: formatMontant(credit), alignment: 'right', margin: [0, 2, 0, 2] }
            ]);
          });

          if (lines.length > 0) {
            tableBody.push([
              { text: 'Total', colSpan: 3, alignment: 'right', style: 'tableHeader' },
              {},
              {},
              { text: formatMontant(totalDebit), alignment: 'right', style: 'tableHeader' },
              { text: formatMontant(totalCredit), alignment: 'right', style: 'tableHeader' }
            ]);
          }

          return [
            { text: title, style: 'anomalyHeader', margin: [0, 8, 0, 4] },
            lines.length
              ? {
                table: {
                  headerRows: 1,
                  widths: ['12%', '15%', '*', '15%', '15%'],
                  body: tableBody
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  paddingTop: () => 2,
                  paddingBottom: () => 2,
                  minRowHeight: (rowIndex) => rowIndex === 0 ? 22 : 16,
                  fillColor: (rowIndex) => {
                    if (rowIndex === 0) return '#1A5276';        // header bleu
                    return rowIndex % 2 === 0 ? '#f2f2f2' : null; // alternance gris/blanc
                  }
                }
              }
              : { text: 'Aucune écriture trouvée', style: 'noData', margin: [0, 0, 0, 6] }
          ];
        }) : [{ text: 'Aucune anomalie', style: 'noData' }])
      ],
      styles: {
        header: { fontSize: 16, bold: true, font: 'Helvetica', margin: [0, 5, 0, 5] },
        subheader: { fontSize: 12, bold: true, font: 'Helvetica', margin: [0, 2, 0, 2] },
        subheader2: { fontSize: 10, bold: true, font: 'Helvetica', margin: [0, 2, 0, 2] },
        anomalyHeader: { fontSize: 12, bold: true, font: 'Helvetica', color: '#1A5276' },
        tableHeader: { bold: true, fontSize: 8, color: 'white', fillColor: '#1A5276', alignment: 'center', font: 'Helvetica' },
        noData: { fontSize: 9, color: '#666', italics: true }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Revision_${id_controle}_${id_dossier}_${id_exercice}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('[REVISION DETAILS][PDF] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

// Export Excel
exports.exportExcel = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, id_controle } = req.params;
    const { date_debut, date_fin } = req.query;

    if (!id_compte || !id_dossier || !id_exercice || !id_controle) {
      return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const { controle, anomalies, rows } = await getRevisionDetailsData(id_compte, id_dossier, id_exercice, id_controle, date_debut, date_fin);

    const workbook = new ExcelJS.Workbook();
    const logo = tryReadLogo();

    const ws = workbook.addWorksheet('Ecritures');
    if (logo?.buffer) {
      const imageId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension || 'png' });
      // Logo positionné en haut à gauche
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 150, height: 50 } });
    }

    const periodeText = (date_debut && date_fin)
      ? `${formatDate(date_debut)} au ${formatDate(date_fin)}`
      : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    // Ligne 2: DÉTAILS DE RÉVISION (fusionné et centré)
    ws.mergeCells('A2:F2');
    ws.getCell('A2').value = 'DÉTAILS DE RÉVISION';
    ws.getCell('A2').font = { bold: true, size: 16 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    // Ligne 3: Dossier
    ws.mergeCells('A3:F3');
    ws.getCell('A3').value = `Dossier: ${dossier?.dossier || ''}`;
    ws.getCell('A3').font = { bold: true, size: 12 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    // Ligne 4: Contrôle
    ws.mergeCells('A4:F4');
    ws.getCell('A4').value = `${controle?.description || controle?.id_controle || ''}`;
    ws.getCell('A4').font = { bold: true, size: 11 };
    ws.getCell('A4').alignment = { horizontal: 'center' };

    // Ligne 5: Période
    ws.mergeCells('A5:F5');
    ws.getCell('A5').value = `Période: ${periodeText}`;
    ws.getCell('A5').font = { bold: true, size: 10 };
    ws.getCell('A5').alignment = { horizontal: 'center' };

    ws.columns = [
      { width: 12 },
      { width: 16 },
      { width: 14 },
      { width: 50 },
      { width: 14 },
      { width: 14 }
    ];

    let rowCursor = 7;
    const writeHeaderRow = (rowIndex) => {
      ws.getRow(rowIndex).values = ['Date', 'Compte', 'Pièce', 'Libellé', 'Débit', 'Crédit'];
      ws.getRow(rowIndex).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getRow(rowIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
    };

    anomalies.forEach((a) => {
      const compte = a.compteNum || a.id_jnl || '';
      const title = `Compte ${compte}: ${a.message || ''}`;

      ws.getRow(rowCursor).values = [title];
      ws.getRow(rowCursor).font = { bold: true, color: { argb: 'FF1A5276' } };
      rowCursor += 1;

      writeHeaderRow(rowCursor);
      rowCursor += 1;

      const lines = Array.isArray(a.journalLines) ? a.journalLines : [];
      lines.forEach((l) => {
        const debit = parseFloat(l.debit) || 0;
        const credit = parseFloat(l.credit) || 0;
        ws.getRow(rowCursor).values = [
          formatDate(l.dateecriture),
          compte,
          l.piece || '',
          l.libelle || '',
          debit,
          credit
        ];
        ws.getRow(rowCursor).getCell(5).numFmt = '#,##0.00';
        ws.getRow(rowCursor).getCell(6).numFmt = '#,##0.00';
        rowCursor += 1;
      });

      rowCursor += 1;
    });

    ws.views = [{ state: 'frozen', ySplit: 7 }];

    const wsA = workbook.addWorksheet('Anomalies');
    wsA.getRow(1).values = ['Compte', 'Message', 'Validé', 'Commentaire'];
    wsA.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsA.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
    anomalies.forEach((a, idx) => {
      const rowIndex = 2 + idx;
      wsA.getRow(rowIndex).values = [a.compteNum || a.id_jnl || '', a.message || '', a.valide ? 'Oui' : 'Non', a.commentaire || ''];
    });
    wsA.columns = [{ width: 18 }, { width: 80 }, { width: 10 }, { width: 40 }];

    workbook.views = [{ activeTab: 0 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Revision_${id_controle}_${id_dossier}_${id_exercice}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('[REVISION DETAILS][EXCEL] error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};
