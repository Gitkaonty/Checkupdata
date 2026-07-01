const db = require('../../Models');
const { QueryTypes } = require('sequelize');
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

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

const getAnalytiqueData = async (id_compte, id_dossier, id_exercice, id_periode) => {
  const whereClause = { id_compte, id_dossier, id_exercice };
  if (id_periode) whereClause.id_periode = id_periode;

  const resultats = await db.revisionAnalytiqueResultats.findAll({
    where: whereClause,
    order: [['date', 'ASC'], ['compte', 'ASC']]
  });

  return resultats.map((item, index) => ({
    id: index + 1,
    date: item.date,
    compte: item.compte,
    libelle: item.libelle,
    debit: item.debit,
    credit: item.credit,
    total_analytiques: item.total_analytiques
  }));
};

/**
 * POST /administration/revisionAnalytique/:id_compte/:id_dossier/:id_exercice
 * Vérifie que chaque ligne des comptes 6* et 7* possèdent des analytiques
 * Algorithme : sélectionner toutes les lignes (6* et 7*) dont le total des analytiques = 0
 */
exports.controlerAnalytiques = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { date_debut, date_fin, id_periode } = req.query;

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({
                state: false,
                message: 'Paramètres manquants: id_compte, id_dossier, id_exercice requis'
            });
        }

        // Validation des dates
        if (!date_debut || !date_fin) {
            return res.status(400).json({
                state: false,
                message: 'Les dates de début et fin sont requises'
            });
        }


        // Étape 1: Nettoyer les anciens résultats pour cette combinaison
        await db.revisionAnalytiqueResultats.destroy({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                id_periode: id_periode || null
            }
        });

        // Étape 2: Requête SQL pour trouver les lignes sans analytiques
        // Comptes commençant par 6 ou 7 dont le total des analytiques = 0
        const query = `
            SELECT
                j.id as id_jnl,
                j.dateecriture as date,
                j.comptegen as compte,
                j.libelle,
                j.debit as debit_journal,
                j.credit as credit_journal,
                COALESCE(SUM(a.debit), 0) as total_analytiques_debit,
                COALESCE(SUM(a.credit), 0) as total_analytiques_credit
            FROM journals j
            LEFT JOIN analytiques a ON j.id = a.id_ligne_ecriture
                AND a.id_compte = :id_compte
                AND a.id_dossier = :id_dossier
                AND a.id_exercice = :id_exercice
            WHERE j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND j.dateecriture BETWEEN :date_debut AND :date_fin
                AND (j.comptegen LIKE '6%' OR j.comptegen LIKE '7%')
            GROUP BY j.id, j.dateecriture, j.comptegen, j.libelle, j.debit, j.credit
            HAVING 
                -- Soit pas d'analytique du tout
                (SUM(a.id) IS NULL)
                -- Soit les montants ne correspondent pas
                OR (ABS(COALESCE(SUM(a.debit), 0) - j.debit) > 0.01)
                OR (ABS(COALESCE(SUM(a.credit), 0) - j.credit) > 0.01)
            ORDER BY j.dateecriture, j.comptegen
        `;

        // Debug: compter les écritures 6*/7* dans la période
        const debugQuery = `
            SELECT 
                COUNT(*) as total_67,
                COUNT(DISTINCT j.id) as distinct_67,
                MIN(j.dateecriture) as min_date,
                MAX(j.dateecriture) as max_date
            FROM journals j
            WHERE j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND j.dateecriture BETWEEN :date_debut AND :date_fin
                AND (j.comptegen LIKE '6%' OR j.comptegen LIKE '7%')
        `;
        const debugResult = await db.sequelize.query(debugQuery, {
            type: QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, date_debut, date_fin }
        });
        console.log('[RevisionAnalytique] DEBUG - Écritures 6*/7*:', debugResult[0]);

        // DEBUG SPECIFIQUE pour la ligne 999765
        const specificDebug = await db.sequelize.query(`
            SELECT 
                j.id, j.comptegen, j.debit, j.credit, j.dateecriture,
                COALESCE(SUM(a.debit), 0) as ana_debit,
                COALESCE(SUM(a.credit), 0) as ana_credit
            FROM journals j
            LEFT JOIN analytiques a ON j.id = a.id_ligne_ecriture
                AND a.id_compte = :id_compte
                AND a.id_dossier = :id_dossier
                AND a.id_exercice = :id_exercice
            WHERE j.id = 999765
                AND j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
            GROUP BY j.id, j.comptegen, j.debit, j.credit, j.dateecriture
        `, {
            type: QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice }
        });
        if (specificDebug.length > 0) {
            const row = specificDebug[0];
            const diffDebit = Math.abs(row.ana_debit - row.debit);
            const diffCredit = Math.abs(row.ana_credit - row.credit);
        }

        // Debug: voir quelques écritures
        const sampleQuery = `
            SELECT j.id, j.comptegen, j.debit, j.credit, j.dateecriture
            FROM journals j
            WHERE j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND j.dateecriture BETWEEN :date_debut AND :date_fin
                AND (j.comptegen LIKE '6%' OR j.comptegen LIKE '7%')
            LIMIT 5
        `;
        const sampleResult = await db.sequelize.query(sampleQuery, {
            type: QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, date_debut, date_fin }
        });

        // Debug: voir les analytiques pour les samples
        for (const row of sampleResult) {
            const anaQuery = `
                SELECT 
                    a.id_ligne_ecriture,
                    COALESCE(SUM(a.debit), 0) as total_debit,
                    COALESCE(SUM(a.credit), 0) as total_credit,
                    COUNT(*) as nb_lignes
                FROM analytiques a
                WHERE a.id_ligne_ecriture = :id_jnl
                    AND a.id_compte = :id_compte
                    AND a.id_dossier = :id_dossier
                    AND a.id_exercice = :id_exercice
                GROUP BY a.id_ligne_ecriture
            `;
            const anaResult = await db.sequelize.query(anaQuery, {
                type: QueryTypes.SELECT,
                replacements: { 
                    id_jnl: row.id, 
                    id_compte, 
                    id_dossier, 
                    id_exercice 
                }
            });
        }

        const results = await db.sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                id_compte,
                id_dossier,
                id_exercice,
                date_debut,
                date_fin
            }
        });

        // Étape 3: Insérer les résultats dans la table
        const resultsToInsert = results.map(row => ({
            id_compte: parseInt(id_compte),
            id_dossier: parseInt(id_dossier),
            id_exercice: parseInt(id_exercice),
            id_periode: id_periode ? parseInt(id_periode) : null,
            id_jnl: row.id_jnl,
            date: row.date,
            compte: row.compte,
            libelle: row.libelle || '',
            debit: row.debit_journal || 0,
            credit: row.credit_journal || 0,
            total_analytiques: (Number(row.total_analytiques_debit) || 0) + (Number(row.total_analytiques_credit) || 0),
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        if (resultsToInsert.length > 0) {
            await db.revisionAnalytiqueResultats.bulkCreate(resultsToInsert);
        } else {
        }

        // Étape 4: Retourner les résultats formatés
        const formattedResults = resultsToInsert.map((item, index) => ({
            id: index + 1,
            id_jnl: item.id_jnl,
            date: item.date,
            compte: item.compte,
            libelle: item.libelle,
            debit: item.debit,
            credit: item.credit,
            total_analytiques: item.total_analytiques
        }));

        return res.status(200).json({
            state: true,
            message: `Contrôle terminé. ${formattedResults.length} ligne(s) sans analytiques trouvée(s) sur les comptes 6* et 7*.`,
            data: formattedResults,
            nbLignes: formattedResults.length
        });

    } catch (error) {
        console.error('[RevisionAnalytique] === ERREUR ===:', error);
        console.error('[RevisionAnalytique] Stack:', error.stack);
        return res.status(500).json({
            state: false,
            message: 'Erreur lors du contrôle analytique',
            error: error.message
        });
    }
};

/**
 * GET /administration/revisionAnalytique/:id_compte/:id_dossier/:id_exercice
 * Récupère les résultats d'un contrôle précédent
 */
exports.getResultats = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        const whereClause = {
            id_compte,
            id_dossier,
            id_exercice
        };
        if (id_periode) whereClause.id_periode = id_periode;

        const resultats = await db.revisionAnalytiqueResultats.findAll({
            where: whereClause,
            order: [['date', 'ASC'], ['compte', 'ASC']]
        });

        

        const formattedResults = resultats.map((item, index) => ({
            id: index + 1,
            id_db: item.id,
            id_jnl: item.id_jnl,
            date: item.date,
            compte: item.compte,
            libelle: item.libelle,
            debit: item.debit,
            credit: item.credit,
            total_analytiques: item.total_analytiques
        }));

        return res.status(200).json({
            state: true,
            data: formattedResults,
            nbLignes: formattedResults.length
        });

    } catch (error) {
        console.error('Erreur récupération résultats:', error);
        return res.status(500).json({
            state: false,
            message: 'Erreur lors de la récupération des résultats',
            error: error.message
        });
    }
};

/**
 * DELETE /administration/revisionAnalytique/:id_compte/:id_dossier/:id_exercice
 * Supprime les résultats d'un contrôle
 */
exports.supprimerResultats = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        const whereClause = {
            id_compte,
            id_dossier,
            id_exercice
        };
        if (id_periode) whereClause.id_periode = id_periode;

        await db.revisionAnalytiqueResultats.destroy({ where: whereClause });

        return res.status(200).json({
            state: true,
            message: 'Résultats supprimés avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression résultats:', error);
        return res.status(500).json({
            state: false,
            message: 'Erreur lors de la suppression des résultats',
            error: error.message
        });
    }
};

exports.exportPdf = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        const data = await getAnalytiqueData(id_compte, id_dossier, id_exercice, id_periode);

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
            { text: 'CONTRÔLE CODES ANALYTIQUES', style: 'header', alignment: 'center' },
            { text: `Dossier : ${dossier?.dossier || id_dossier}`, style: 'subheader', alignment: 'center' },
            { text: `Exercice : ${exercice?.libelle || id_exercice}`, style: 'subheader2', alignment: 'center' }
          ]
        });

        const tableBody = [
          ['Date', 'Compte', 'Libellé', 'Débit', 'Crédit', 'Total Analytiques'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))
        ];

        let totalDebit = 0, totalCredit = 0, totalAnalytiques = 0;
        data.forEach((row, i) => {
          const debit = parseFloat(row.debit) || 0;
          const credit = parseFloat(row.credit) || 0;
          const analytiques = parseFloat(row.total_analytiques) || 0;
          totalDebit += debit;
          totalCredit += credit;
          totalAnalytiques += analytiques;
          const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
          tableBody.push([
            { text: formatDate(row.date), style: 'cell', fillColor: rowColor },
            { text: row.compte || '', style: 'cell', fillColor: rowColor },
            { text: row.libelle || '', style: 'cell', fillColor: rowColor },
            { text: formatMontant(debit), alignment: 'right', style: 'cell', fillColor: rowColor },
            { text: formatMontant(credit), alignment: 'right', style: 'cell', fillColor: rowColor },
            { text: formatMontant(analytiques), alignment: 'right', style: 'cell', fillColor: rowColor }
          ]);
        });

        tableBody.push([
          { text: 'Total', colSpan: 3, alignment: 'right', style: 'totalRow' }, {}, {},
          { text: formatMontant(totalDebit), alignment: 'right', style: 'totalRow' },
          { text: formatMontant(totalCredit), alignment: 'right', style: 'totalRow' },
          { text: formatMontant(totalAnalytiques), alignment: 'right', style: 'totalRow' }
        ]);

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [15, 15, 15, 25],
            defaultStyle: { font: 'Helvetica', fontSize: 8 },
            content: [
                { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 15] },
                { table: { headerRows: 1, widths: ['10%', '10%', '*', '12%', '12%', '12%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : undefined, hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } },
                { text: `Total : ${data.length} écriture(s) sans analytiques`, style: 'noData', margin: [0, 10, 0, 0] }
            ],
            styles: {
                header: { fontSize: 16, bold: true, color: '#2C3E50' },
                subheader: { fontSize: 10, bold: true, color: '#34495E', margin: [0, 2, 0, 2] },
                subheader2: { fontSize: 9, color: '#566573' },
                tableHeader: { bold: true, fontSize: 8, color: '#2C3E50' },
                cell: { fontSize: 7, color: '#2C3E50' },
                totalRow: { bold: true, fontSize: 7, color: '#2C3E50', fillColor: '#CFE6E4' },
                noData: { fontSize: 9, italics: true, color: '#7F8C8D', margin: [0, 10, 0, 10] }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Controle_Analytique_${id_dossier}_${id_exercice}.pdf`);
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error('[REVISION_ANALYTIQUE] export PDF error:', error);
        return res.status(500).json({ state: false, message: 'Erreur export PDF', error: error.message });
    }
};

exports.exportExcel = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        const data = await getAnalytiqueData(id_compte, id_dossier, id_exercice, id_periode);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contrôle Analytique');

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 14 },
            { header: 'Compte', key: 'compte', width: 14 },
            { header: 'Libellé', key: 'libelle', width: 40 },
            { header: 'Débit', key: 'debit', width: 14 },
            { header: 'Crédit', key: 'credit', width: 14 },
            { header: 'Total Analytiques', key: 'total_analytiques', width: 18 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        worksheet.getRow(1).alignment = { horizontal: 'center' };

        data.forEach(row => {
            worksheet.addRow({
                date: row.date || '',
                compte: row.compte || '',
                libelle: row.libelle || '',
                debit: Number(row.debit) || 0,
                credit: Number(row.credit) || 0,
                total_analytiques: Number(row.total_analytiques) || 0
            });
        });

        // Format numeric columns
        const lastRow = worksheet.rowCount;
        for (let i = 2; i <= lastRow; i++) {
            const row = worksheet.getRow(i);
            row.getCell(4).numFmt = '#,##0.00';
            row.getCell(5).numFmt = '#,##0.00';
            row.getCell(6).numFmt = '#,##0.00';
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Controle_Analytique_${id_dossier}_${id_exercice}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[REVISION_ANALYTIQUE] export Excel error:', error);
        return res.status(500).json({ state: false, message: 'Erreur export Excel', error: error.message });
    }
};
