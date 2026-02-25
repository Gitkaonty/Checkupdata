const db = require("../../Models");
require('dotenv').config();
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');

const fs = require('fs');
const path = require('path');

const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const { generateGrandLivreContent } = require('../../Middlewares/GrandLivre/GrandLivreGeneratePdf');
const { exportGrandLivreTableExcel } = require('../../Middlewares/GrandLivre/GrandLivreGenerateExcel');

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
      const compte = await userscomptes.findByPk(compteId, { attributes: ['id', 'nom'], raw: true });

      const { buildSections, groups } = await generateGrandLivreContent(compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin);
      if (!groups || Object.keys(groups).length === 0) {
        return res.status(404).json({ state: false, msg: 'Aucun mouvement trouvé pour ce filtre.' });
      }

      const fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [10, 40, 10, 40],
        defaultStyle: { font: 'Helvetica', fontSize: 8 },
        content: [
          { text: 'GRAND LIVRE', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
          { text: `Dossier : ${dossier?.dossier || ''}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 8] },
          { text: `Période du : ${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`, alignment: 'left', margin: [0, 0, 0, 10] },
          ...buildSections(groups)
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
          header: { fontSize: 16, bold: true, font: 'Helvetica' },
          subheader: { fontSize: 11, bold: true, font: 'Helvetica' },
          tableHeader: { bold: true, fontSize: 7, color: 'white', fillColor: '#1A5276', alignment: 'center', font: 'Helvetica' },
          accountHeader: { bold: true, fillColor: '#CDE9F6' }
        }
      };

      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=GrandLivre_${fileId}_${exerciceId}.pdf`);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error('[GRAND LIVRE][PDF] error:', error);
      return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
  },
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
      await exportGrandLivreTableExcel(compteId, fileId, exerciceId, journalCodes, dateDebut, dateFin, workbook, dossier?.dossier, compte?.nom, exercice?.date_debut, exercice?.date_fin);
      workbook.views = [{ activeTab: 0 }];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=GrandLivre_${fileId}_${exerciceId}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('[GRAND LIVRE][EXCEL] error:', error);
      return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
  }
};
