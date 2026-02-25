require('dotenv').config();
const path = require('path');

const db = require('../../Models');
const Annex = db.etatsTvaAnnexes;

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const exportTvaTableExcel = async (id_compte, id_dossier, id_exercice, mois, annee, workbook, dossier, compte, moisNoms, date_debut, date_fin) => {
    const tvaData = await Annex.findAll({
        where: {
            id_compte,
            id_dossier,
            id_exercice,
            mois: Number(mois),
            annee: Number(annee)
        }
    });

    const sheetTva = workbook.addWorksheet('Annexes TVA');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetTva.columns = [
        { header: 'Collecte/Déductible', width: 20 },
        { header: 'Local/Etranger', width: 16 },
        { header: 'NIF', width: 18 },
        { header: 'Raison sociale', width: 28 },
        { header: 'STAT', width: 18 },
        { header: 'Adresse', width: 30 },
        { header: 'Montant HT', width: 16 },
        { header: 'Montant TVA', width: 16 },
        { header: 'Référence facture', width: 22 },
        { header: 'Date facture', width: 16 },
        { header: 'Nature', width: 18 },
        { header: 'Libellé', width: 24 },
        { header: 'Date paiement', width: 16 },
        { header: 'Observation', width: 18 },
        { header: 'N° DAU', width: 14 },
        { header: 'Ligne formulaire', width: 18 },
        { header: 'Mois', width: 8 },
        { header: 'Année', width: 8 },
        { header: 'Code TVA', width: 14 },
    ];


    // Title row
    sheetTva.insertRow(1, ['Annexes TVA']);
    sheetTva.mergeCells('A1:S1');
    const titre = sheetTva.getRow(1);
    titre.font = { bold: true, size: 20 };
    titre.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    titre.height = 25;

    // Subtitle row
    sheetTva.insertRow(2, [`Dossier : ${dossier}\nCompte : ${compte}\nMois et année : ${moisNoms} ${annee}\nExercice du : ${date_debut} au ${date_fin}`]);
    sheetTva.mergeCells('A2:S2');
    const sousTitre = sheetTva.getRow(2);
    sousTitre.font = { bold: true, size: 12 };
    sousTitre.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    sousTitre.height = 70;

    sheetTva.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 60, height: 60 },
        editAs: 'absolute',
    });

    // Header row (row 3)
    const headerRow = sheetTva.getRow(3);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    let totalHT = 0;
    let totalTVA = 0;

    // Ajout des lignes de données TVA
    tvaData.forEach(row => {
        totalHT += parseFloat(row.montant_ht) || 0;
        totalTVA += parseFloat(row.montant_tva) || 0;
        sheetTva.addRow([
            row.collecte_deductible || '',
            row.local_etranger || '',
            row.nif || '',
            row.raison_sociale || '',
            row.stat || '',
            row.adresse || '',
            Number(row.montant_ht) || 0,
            Number(row.montant_tva) || 0,
            row.reference_facture || '',
            formatDate(row.date_facture) || '',
            row.nature || '',
            row.libelle_operation || '',
            formatDate(row.date_paiement) || '',
            row.observation || '',
            row.n_dau || '',
            row.ligne_formulaire || '',
            row.mois || Number(mois),
            row.annee || Number(annee),
            row.code_tva || ''
        ]);
    });

    // Ligne Total
    const totalRow = sheetTva.addRow([
        'Total', '', '', '', '', '',
        Number(totalHT) || 0,
        Number(totalTVA) || 0,
        '', '', '', '', '', '', '', '', '', '', ''
    ]);

    // Style du total
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF89A8B2' } };
        if (colNumber === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
    });

    // Fusionner les cellules 1 à 6 pour le label "Total"
    sheetTva.mergeCells(`A${totalRow.number}:F${totalRow.number}`);

    // Format numérique pour les montants (col 7 et 8)
    sheetTva.getColumn(7).numFmt = '#,##0.00';
    sheetTva.getColumn(8).numFmt = '#,##0.00';
};

module.exports = { exportTvaTableExcel };