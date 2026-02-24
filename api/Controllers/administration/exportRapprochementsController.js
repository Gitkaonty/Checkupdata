const db = require("../../Models");
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const { generateRapproContent } = require('../../Middlewares/rapprochements/RapprochementsGeneratePdf');
const { exportRapprochementExcel } = require('../../Middlewares/rapprochements/RapprochementsGenerateExcel');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const dossierplancomptables = db.dossierplancomptable;
const rapprochements = db.rapprochements;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString).substring(0, 10);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

module.exports = {
  exportPdf: async (req, res) => {
    try {
      const rapproId = Number(req.query?.rapproId);
      const rawFileId = Number(req.query?.fileId);
      const rawCompteId = Number(req.query?.compteId);
      const rawExerciceId = Number(req.query?.exerciceId);
      const rawPcId = Number(req.query?.pcId);

      if (rapproId === undefined || rapproId === null || isNaN(rapproId)) {
        return res.status(400).json({ state: false, msg: 'Paramètre rapproId manquant' });
      }

      try {
        console.log('[RAPPRO][EXPORT][PDF][PARAMS]', { fileId: rawFileId, compteId: rawCompteId, exerciceId: rawExerciceId, pcId: rawPcId, rapproId });
      } catch (e) { }

      // On récupère d'abord la ligne réelle à partir de son id, puis on en déduit les autres ids
      const row = await rapprochements.findByPk(rapproId);
      if (!row) return res.status(404).json({ state: false, msg: 'Ligne de rapprochement introuvable' });

      const fileId = row.id_dossier;
      const compteId = row.id_compte;
      const exerciceId = row.id_exercice;
      const pcId = row.pc_id;

      const dossier = await dossiers.findByPk(fileId);
      const exercice = await exercices.findByPk(exerciceId);

      const fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      const headerLines = [
        {
          columns: [
            {
              image: logoImage,
              width: 60
            },
            {
              stack: [
                {
                  text: 'RAPPROCHEMENT BANCAIRE',
                  style: 'header',
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                {
                  text: `Dossier : ${dossier?.dossier || ''}`,
                  fontSize: 15,
                  bold: true,
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                }
              ],
              width: '*'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            { text: 'Exercice : ', bold: true },
            { text: `${formatDate(exercice?.date_debut)} - ${formatDate(exercice?.date_fin)}` }
          ],
          alignment: 'left',
          fontSize: 9,
          margin: [0, 10, 0, 6]
        }
      ];

      const { rjson, summary, rapproTable, ecrituresTable } = await generateRapproContent(fileId, compteId, exerciceId, pcId, rapproId, exercice?.date_debut, exercice?.date_fin);

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [20, 40, 20, 40],
        defaultStyle: { font: 'Helvetica', fontSize: 9 },
        content: [
          ...headerLines,
          {
            text: [
              { text: 'Période : ', bold: true },
              { text: `du ${formatDate(rjson?.date_debut)} au ${formatDate(rjson?.date_fin)}` }
            ], alignment: 'left', fontSize: 9, margin: [0, -1, 0, 6]
          },
          {
            text: [
              { text: `Date d'édition : `, bold: true },
              { text: `${formatDate(new Date())}` }
            ], alignment: 'left', fontSize: 9, margin: [0, -1, 0, 6]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    text: '',
                    border: [false, true, false, false]
                  }
                ]
              ]
            },
            layout: {
              hLineColor: () => '#1A5276',
              hLineWidth: () => 2,
              vLineWidth: () => 0
            },
            margin: [0, 10, 0, 0]
          },
          { text: '1. Synthèse financière', style: 'subheader', margin: [0, 0, 0, 10] },
          summary,
          { text: '2. Détail des écritures bancaires', style: 'subheader', margin: [0, 20, 0, 10] },
          rapproTable,
          ecrituresTable
        ],
        styles: {
          header: { fontSize: 18, bold: true, font: 'Helvetica' },
          subheader: { fontSize: 11, bold: true, font: 'Helvetica' },
          tableHeader: { bold: true, fontSize: 8, color: 'white', fillColor: '#1A5276', alignment: 'center', font: 'Helvetica' }
        }
      };

      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Rapprochement_${rapproId}.pdf`);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error('[RAPPRO][PDF] error:', error);
      return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
  },

  exportExcel: async (req, res) => {
    try {
      const rapproId = Number(req.query?.rapproId);
      const rawFileId = Number(req.query?.fileId);
      const rawCompteId = Number(req.query?.compteId);
      const rawExerciceId = Number(req.query?.exerciceId);
      const rawPcId = Number(req.query?.pcId);

      if (!rapproId || isNaN(rapproId)) {
        return res.status(400).json({ state: false, msg: 'Paramètre rapproId manquant' });
      }

      try {
        console.log('[RAPPRO][EXPORT][EXCEL][PARAMS]', { fileId: rawFileId, compteId: rawCompteId, exerciceId: rawExerciceId, pcId: rawPcId, rapproId });
      } catch (e) { }

      const row = await rapprochements.findByPk(rapproId);
      if (!row) return res.status(404).json({ state: false, msg: 'Ligne de rapprochement introuvable' });

      const fileId = row.id_dossier;
      const compteId = row.id_compte;
      const exerciceId = row.id_exercice;
      const pcId = row.pc_id;

      const dossier = await dossiers.findByPk(fileId);
      const exercice = await exercices.findByPk(exerciceId);
      const compte = await userscomptes.findByPk(compteId, { attributes: ['id', 'nom'], raw: true });
      const pc = await dossierplancomptables.findByPk(pcId);

      const workbook = new ExcelJS.Workbook();
      await exportRapprochementExcel(fileId, compteId, exerciceId, pcId, rapproId, workbook, dossier?.dossier, compte?.nom, exercice?.date_debut, exercice?.date_fin);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Rapprochement_${rapproId}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('[RAPPRO][EXCEL] error:', error);
      return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
  }
};
