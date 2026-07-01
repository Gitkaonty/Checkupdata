const db = require("../../Models");
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const Sequelize = require('sequelize');
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const { generateJournalContent } = require('../../Middlewares/Journal/JournalGeneratePdf');
const { exportJournalTableExcel } = require('../../Middlewares/Journal/JournalGenerateExcel');
const { buildHeader, pageFooter, contentWidth } = require('../../Middlewares/exportPdfTheme');

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
      const compte = await userscomptes.findByPk(compteId, { attributes: ['id','nom'], raw: true });

      const { buildJournalTable, list } = await generateJournalContent(compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin);
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

      const { body: journalBody, widths: journalWidths, boundaries, shaded } = buildJournalTable(list);

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [15, 18, 15, 32],
        defaultStyle: { font: 'Helvetica', fontSize: 9, color: '#16202B' },
        footer: pageFooter(formatDate(new Date())),
        content: [
          ...buildHeader('Journal comptable', {
            dossier: dossier?.dossier,
            compte: compte?.nom,
            periode: `Du ${formatDate(dateDebut || exercice?.date_debut)} au ${formatDate(dateFin || exercice?.date_fin)}`,
            extra: { label: 'Journaux', value: (Array.isArray(journalCodes) && journalCodes.length) ? journalCodes.join(', ') : 'Tous' },
          }, contentWidth('landscape')),
          {
            table: {
              headerRows: 1,
              widths: journalWidths,
              body: journalBody
            },
            layout: {
              // Filet séparateur au-dessus de chaque nouvelle écriture (et du total)
              hLineWidth: (i) => (boundaries.has(i) ? 0.8 : 0),
              hLineColor: () => '#B9D6D1',
              vLineWidth: () => 0,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              // Trame douce par écriture (une écriture sur deux)
              fillColor: (rowIndex) => (shaded.has(rowIndex) ? '#EFF7F4' : null)
            }
          }
        ],
        styles: {
          header: { fontSize: 16, bold: true, color: '#0E7C86', characterSpacing: 1, font: 'Helvetica' },
          subheader: { fontSize: 10, bold: true, color: '#16202B', font: 'Helvetica' },
          tableHeader: { bold: true, fontSize: 7, color: 'white', fillColor: '#0E7C86', alignment: 'center', font: 'Helvetica' }
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
      const compte = await userscomptes.findByPk(compteId, { attributes: ['id','nom'], raw: true });

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
