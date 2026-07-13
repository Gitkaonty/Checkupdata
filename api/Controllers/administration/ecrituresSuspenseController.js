const db = require('../../Models');
const { Op, fn, col, where } = require('sequelize');
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { applyKaontyStyle } = require('../../Middlewares/kaontyExcelStyle');

const journals = db.journals;
const codejournals = db.codejournals;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatMontant = (val) => {
  if (val === null || val === undefined) return '0,00';
  return Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const tryReadLogo = () => {
  try {
    const logoPath = path.join(__dirname, '../../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      return { dataUrl: `data:image/png;base64,${logoData.toString('base64')}` };
    }
  } catch (err) {
    console.log('Logo not found:', err.message);
  }
  return null;
};

const getSuspenseData = async (id_compte, id_dossier, id_exercice, date_debut, date_fin) => {
  const whereClause = {
    id_compte: parseInt(id_compte),
    id_dossier: parseInt(id_dossier),
    id_exercice: parseInt(id_exercice),
    comptegen: { [Op.iLike]: '47%' }
  };

  if (date_debut || date_fin) {
    const andConditions = [];
    if (date_debut && date_fin) {
      andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.between]: [date_debut, date_fin] }));
    } else if (date_debut) {
      andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.gte]: date_debut }));
    } else if (date_fin) {
      andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.lte]: date_fin }));
    }
    if (andConditions.length) {
      whereClause[Op.and] = andConditions;
    }
  }

  const rows = await journals.findAll({
    where: whereClause,
    include: [{ model: codejournals, attributes: ['code'], required: false }],
    order: [['dateecriture', 'ASC'], ['id', 'ASC']],
    attributes: ['id', 'comptegen', 'piece', 'libelle', 'debit', 'credit', 'dateecriture'],
    raw: true,
    nest: true
  });

  return (rows || []).map((row) => ({
    id: row.id,
    compte: row.comptegen,
    journal: row.codejournal?.code ?? row.codejournals?.code ?? null,
    piece: row.piece,
    libelle: row.libelle,
    debit: row.debit,
    credit: row.credit,
    date_ecriture: row.dateecriture
  }));
};

exports.getExportData = async (id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin) => {
    return await getSuspenseData(id_compte, id_dossier, id_exercice, date_debut, date_fin);
};

exports.buildPdfSection = (data, ctx = {}) => {
    const tableBody = [
      ['Compte', 'Journal', 'Pièce', 'Libellé', 'Débit', 'Crédit'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))
    ];

    let totalDebit = 0, totalCredit = 0;
    (data || []).forEach((row, i) => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;
      totalDebit += debit;
      totalCredit += credit;
      const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
      tableBody.push([
        { text: row.compte || '', style: 'cell', fillColor: rowColor },
        { text: row.journal || '', style: 'cell', fillColor: rowColor },
        { text: row.piece || '', style: 'cell', fillColor: rowColor },
        { text: row.libelle || '', style: 'cell', fillColor: rowColor },
        { text: formatMontant(debit), alignment: 'right', style: 'cell', fillColor: rowColor },
        { text: formatMontant(credit), alignment: 'right', style: 'cell', fillColor: rowColor }
      ]);
    });

    tableBody.push([
      { text: 'Total', colSpan: 4, alignment: 'right', style: 'totalRow' }, {}, {}, {},
      { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
      { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' }
    ]);

    const content = [
        { table: { headerRows: 1, widths: ['10%', '10%', '12%', '*', '12%', '12%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : undefined, hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } },
        { text: `Total : ${(data || []).length} écriture(s)`, style: 'noData', margin: [0, 10, 0, 0] }
    ];

    const styles = {
        tableHeader: { bold: true, fontSize: 8, color: '#2C3E50' },
        cell: { fontSize: 7, color: '#2C3E50' },
        totalRow: { bold: true, fontSize: 7, color: '#2C3E50', fillColor: '#CFE6E4' },
        noData: { fontSize: 9, italics: true, color: '#7F8C8D', margin: [0, 10, 0, 10] }
    };

    return { content, styles };
};

exports.addExcelSheets = (workbook, data, ctx = {}) => {
    const worksheet = workbook.addWorksheet('Écritures en suspens');

    worksheet.columns = [
        { key: 'compte', width: 14 },
        { key: 'journal', width: 12 },
        { key: 'piece', width: 12 },
        { key: 'libelle', width: 40 },
        { key: 'debit', width: 14 },
        { key: 'credit', width: 14 }
    ];

    const lastCol = worksheet.columns.length; // 6

    // Bloc titre style Kaonty (au-dessus du tableau).
    worksheet.mergeCells(1, 1, 1, lastCol);
    worksheet.getRow(1).getCell(1).value = 'ÉCRITURES EN SUSPENS';

    worksheet.mergeCells(2, 1, 2, lastCol);
    worksheet.getRow(2).getCell(1).value = `Dossier : ${ctx.dossierName || ''}`;

    worksheet.mergeCells(3, 1, 3, lastCol);
    worksheet.getRow(3).getCell(1).value = `Période : ${ctx.periodeText || ''}`;

    // Ligne 4 : vide.

    // Ligne 5 : en-tête.
    const HEADER_ROW = 5;
    worksheet.getRow(HEADER_ROW).values = ['Compte', 'Journal', 'Pièce', 'Libellé', 'Débit', 'Crédit'];
    const headerRow = worksheet.getRow(HEADER_ROW);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { horizontal: 'center' };

    // Lignes 6+ : données.
    let rowNo = HEADER_ROW;
    (data || []).forEach(row => {
        rowNo += 1;
        worksheet.getRow(rowNo).values = [
            row.compte || '',
            row.journal || '',
            row.piece || '',
            row.libelle || '',
            Number(row.debit) || 0,
            Number(row.credit) || 0
        ];
    });

    // Format debit/credit columns (données uniquement).
    for (let i = HEADER_ROW + 1; i <= rowNo; i++) {
        const row = worksheet.getRow(i);
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(6).numFmt = '#,##0.00';
    }

    return worksheet;
};

Object.assign(module.exports, {
    getLignes: async (req, res) => {
        try {
            const { id_compte, id_dossier, id_exercice } = req.params;
            const { date_debut, date_fin } = req.query;

            if (!id_compte || !id_dossier || !id_exercice) {
                return res.status(400).json({ state: false, message: 'Paramètres manquants' });
            }

            const whereClause = {
                id_compte: parseInt(id_compte),
                id_dossier: parseInt(id_dossier),
                id_exercice: parseInt(id_exercice),
                comptegen: { [Op.iLike]: '47%' }
            };

            if (date_debut || date_fin) {
                const andConditions = [];
                if (date_debut && date_fin) {
                    andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.between]: [date_debut, date_fin] }));
                } else if (date_debut) {
                    andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.gte]: date_debut }));
                } else if (date_fin) {
                    andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.lte]: date_fin }));
                }

                if (andConditions.length) {
                    whereClause[Op.and] = andConditions;
                }
            }

            const result = await journals.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: codejournals,
                        attributes: ['code'],
                        required: false
                    }
                ],
                order: [['dateecriture', 'ASC'], ['id', 'ASC']],
                attributes: ['id', 'comptegen', 'piece', 'libelle', 'debit', 'credit', 'dateecriture'],
                raw: true,
                nest: true
            });

            const list = (result.rows || []).map((row) => ({
                id: row.id,
                compte: row.comptegen,
                journal: row.codejournal?.code ?? row.codejournals?.code ?? null,
                piece: row.piece,
                libelle: row.libelle,
                debit: row.debit,
                credit: row.credit,
                date_ecriture: row.dateecriture
            }));

            return res.status(200).json({
                state: true,
                data: list,
                count: result.count || 0
            });
        } catch (error) {
            console.error('[ECRITURES_SUSPENSE] error:', error);
            return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
        }
    },

    exportPdf: async (req, res) => {
        try {
            const { id_compte, id_dossier, id_exercice } = req.params;
            const { date_debut, date_fin } = req.query;

            if (!id_compte || !id_dossier || !id_exercice) {
                return res.status(400).json({ state: false, message: 'Paramètres manquants' });
            }

            const data = await getSuspenseData(id_compte, id_dossier, id_exercice, date_debut, date_fin);

            const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
            const printer = new PdfPrinter(fonts);
            const logo = tryReadLogo();

            const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
            const exercice = await db.exercices.findOne({ where: { id: id_exercice } });

            const headerColumns = [];
            if (logo?.dataUrl) headerColumns.push({ image: logo.dataUrl, width: 90 });
            headerColumns.push({
              width: '*',
              stack: [
                { text: 'ÉCRITURES EN SUSPENS', style: 'header', alignment: 'center' },
                { text: `Dossier : ${dossier?.dossier || id_dossier}`, style: 'subheader', alignment: 'center' },
                { text: `Exercice : ${exercice?.libelle || id_exercice}`, style: 'subheader2', alignment: 'center' }
              ]
            });

            const section = module.exports.buildPdfSection(data);

            const docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                pageMargins: [15, 15, 15, 25],
                defaultStyle: { font: 'Helvetica', fontSize: 8 },
                content: [
                    { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 15] },
                    ...section.content
                ],
                styles: {
                    header: { fontSize: 16, bold: true, color: '#2C3E50' },
                    subheader: { fontSize: 10, bold: true, color: '#34495E', margin: [0, 2, 0, 2] },
                    subheader2: { fontSize: 9, color: '#566573' },
                    ...section.styles
                }
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Ecritures_Suspense_${id_dossier}_${id_exercice}.pdf`);
            pdfDoc.pipe(res);
            pdfDoc.end();

        } catch (error) {
            console.error('[ECRITURES_SUSPENSE] export PDF error:', error);
            return res.status(500).json({ state: false, message: 'Erreur export PDF', error: error.message });
        }
    },

    exportExcel: async (req, res) => {
        try {
            const { id_compte, id_dossier, id_exercice } = req.params;
            const { date_debut, date_fin } = req.query;

            if (!id_compte || !id_dossier || !id_exercice) {
                return res.status(400).json({ state: false, message: 'Paramètres manquants' });
            }

            const data = await getSuspenseData(id_compte, id_dossier, id_exercice, date_debut, date_fin);

            const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
            const exercice = await db.exercices.findOne({ where: { id: id_exercice } });

            const dossierName = dossier?.dossier || id_dossier;
            let periodeText = exercice?.libelle || id_exercice;
            if (date_debut || date_fin) {
                periodeText += ` (${formatDate(date_debut) || '...'} - ${formatDate(date_fin) || '...'})`;
            }

            const workbook = new ExcelJS.Workbook();
            module.exports.addExcelSheets(workbook, data, { dossierName, periodeText });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Ecritures_Suspense_${id_dossier}_${id_exercice}.xlsx`);

            workbook.worksheets.forEach(ws => applyKaontyStyle(ws));

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('[ECRITURES_SUSPENSE] export Excel error:', error);
            return res.status(500).json({ state: false, message: 'Erreur export Excel', error: error.message });
        }
    }
});
