const db = require("../../Models");
require('dotenv').config();
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');

const fs = require('fs');
const path = require('path');

const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const { generateJournalContent } = require('../../Middlewares/Journal/JournalGeneratePdf');
const { exportJournalTableExcel } = require('../../Middlewares/Journal/JournalGenerateExcel');

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

module.exports = {
  exportPdf: async (req, res) => {
    try {
      const { compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin } = req.body || {};
      if (!compteId || !fileId || !exerciceId) {
        return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
      }

      const dossier = await dossiers.findByPk(fileId);
      const exercice = await exercices.findByPk(exerciceId);

      const { buildTable, list } = await generateJournalContent(compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin);
      if (!list || list.length === 0) {
        return res.status(404).json({ state: false, msg: 'Aucune écriture trouvée pour ce filtre.' });
      }

      const fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      // Build table from middleware then override widths and layout
      const built = generateJournalContent ? (await generateJournalContent(compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin)).buildTable(list)[0] : null;
      const baseTable = (built && built.table) ? built.table : (buildTable(list)[0]?.table);
      const tableBody = baseTable?.body || [];
      const fixedWidths = ['10%', '5%', '10%', '*', '12%', '5%', '5%', '12%', '12%'];

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [10, 40, 10, 40],
        defaultStyle: { font: 'Helvetica', fontSize: 8 },
        content: [
          { text: 'JOURNAL COMPTABLE', style: 'header', alignment: 'center', margin: [0, 0, 0, 8] },
          { text: `Dossier : ${dossier?.dossier || ''}`, alignment: 'center', fontSize: 15, bold: true, margin: [0, 0, 0, 5] },
          // { text: `Type Journaux : ${Array.isArray(journalCodes) && journalCodes.length ? journalCodes.join(', ') : 'Tous'}`, alignment: 'left', fontSize: 9, margin: [0, 0, 0, 3] },
          { text: `Période du : ${formatDate(dateDebut || exercice?.date_debut)} au ${formatDate(dateFin || exercice?.date_fin)}`, alignment: 'left', fontSize: 9, margin: [0, 0, 0, 15] },
          {
            table: {
              headerRows: 1,
              widths: fixedWidths,
              body: tableBody
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              fillColor: (rowIndex) => rowIndex % 2 === 0 ? null : '#f2f2f2'
            }
          }
        ],
        background: function (currentPage, pageSize) {
          if (currentPage === 1) {
            return [
              {
                image: logoImage,
                width: 60,
                absolutePosition: { x: 10, y: 10 }
              }
            ];
          }
          return [];
        },
        styles: {
          header: { fontSize: 18, bold: true, font: 'Helvetica' },
          subheader: { fontSize: 10, bold: true, font: 'Helvetica' },
          tableHeader: { bold: true, fontSize: 7, color: 'white', fillColor: '#1A5276', alignment: 'center', font: 'Helvetica' }
        }
      };

      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Journal_${fileId}_${exerciceId}.pdf`);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error('[JOURNAL][PDF] error:', error);
      return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
  }
  ,
  exportExcel: async (req, res) => {
    try {
      const { compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin } = req.body || {};
      if (!compteId || !fileId || !exerciceId) {
        return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
      }

      const dossier = await dossiers.findByPk(fileId);
      const exercice = await exercices.findByPk(exerciceId);
      const compte = await userscomptes.findByPk(compteId, { attributes: ['id', 'nom'], raw: true });

      const workbook = new ExcelJS.Workbook();
      await exportJournalTableExcel(compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin, workbook, dossier?.dossier, compte?.nom, exercice?.date_debut, exercice?.date_fin);
      workbook.views = [{ activeTab: 0 }];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Journal_${fileId}_${exerciceId}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('[JOURNAL][EXCEL] error:', error);
      return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
  }
};
