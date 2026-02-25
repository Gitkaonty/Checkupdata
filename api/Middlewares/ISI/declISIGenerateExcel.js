require('dotenv').config();
const path = require('path');

const db = require("../../Models");
const isis = db.isi;

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const formatDate = (dateStr) => {
    if (!dateStr) return '';

    const d = new Date(dateStr);

    if (isNaN(d)) return '';

    const jour = String(d.getDate()).padStart(2, '0');
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const annee = d.getFullYear();

    return `${jour}/${mois}/${annee}`;
};

const generateTitle = (
    sheetName,
    label,
    dossier,
    moisNoms,
    annee,
    date_debut,
    date_fin,
    cellEnd
) => {
    // ===== Ligne 1 : Titre principal =====
    sheetName.insertRow(1, [label]);
    sheetName.mergeCells(`A1:${cellEnd}1`);
    const titre = sheetName.getRow(1);
    titre.font = { bold: true, size: 20 };
    titre.alignment = { horizontal: 'center', vertical: 'middle' };
    titre.height = 25;

    // ===== Ligne 2 : Dossier =====
    sheetName.insertRow(2, [`Dossier : ${dossier || ''}`]);
    sheetName.mergeCells(`A2:${cellEnd}2`);
    const ligne2 = sheetName.getRow(2);
    ligne2.font = { bold: true, size: 12, color: { argb: 'FF555555' } };
    ligne2.alignment = { horizontal: 'center', vertical: 'middle' };
    ligne2.height = 20;

    // ===== Ligne 3 : Mois et année =====
    sheetName.insertRow(3, [`Mois et année : ${moisNoms || ''} ${annee || ''}`]);
    sheetName.mergeCells(`A3:${cellEnd}3`);
    const ligne3 = sheetName.getRow(3);
    ligne3.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
    ligne3.alignment = { horizontal: 'left', vertical: 'middle' };
    ligne3.height = 20;

    // ===== Ligne 4 : Exercice =====
    sheetName.insertRow(4, [`Exercice du : ${date_debut || ''} au ${date_fin || ''}`]);
    sheetName.mergeCells(`A4:${cellEnd}4`);
    const ligne4 = sheetName.getRow(4);
    ligne4.font = { italic: true, size: 12, color: { argb: 'FF555555' } };
    ligne4.alignment = { horizontal: 'left', vertical: 'middle' };
    ligne4.height = 20;
};


const exportISIToExcel = async (id_compte, id_dossier, id_exercice, mois, annee, workbook, dossier, compte, moisNoms, date_debut, date_fin) => {
    const isi = await isis.findAll({
        where: {
            id_compte,
            id_dossier,
            id_exercice,
            declisimois: mois,
            declisiannee: annee
        }
    })

    const sheetISI = workbook.addWorksheet('Déclaration ISI');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetISI.columns = [
        { header: 'Nom', width: 35 },
        { header: 'CIN', width: 20 },
        { header: 'Nature', width: 15 },
        { header: 'Date', width: 13 },
        { header: 'Province', width: 30 },
        { header: 'Région', width: 30 },
        { header: 'Commune', width: 30 },
        { header: 'Fokontany', width: 30 },
        { header: 'Montant transaction', width: 23 },
        { header: 'Montant ISI', width: 23 },
    ];

    generateTitle(sheetISI, 'Déclaration ISI', dossier, moisNoms, annee, date_debut, date_fin, 'J');

    sheetISI.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 60, height: 60 },
        editAs: 'absolute',
    });

    const headerRow = sheetISI.getRow(5);
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let totalTransaction = 0;
    let totalIsi = 0;

    // Ajout des lignes
    isi.forEach(row => {
        totalTransaction += parseFloat(row.montant_transaction) || 0;
        totalIsi += parseFloat(row.montant_isi) || 0;
        sheetISI.addRow([
            row.nom || '',
            row.cin || '',
            row.nature || '',
            formatDate(row.date_transaction) || '',
            row.province || '',
            row.region || '',
            row.commune || '',
            row.fokontany || '',
            Number(row.montant_transaction) || 0,
            Number(row.montant_isi) || 0
        ]);
    });

    // Ligne Total
    const totalRow = sheetISI.addRow([
        'Total',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        Number(totalTransaction) || 0,
        Number(totalIsi) || 0
    ]);

    // Style du total
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '89A8B2' }
        };
        if (colNumber === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
    });

    // Fusionner les cellules 1 à 8 pour le label "Total"
    sheetISI.mergeCells(`A${totalRow.number}:H${totalRow.number}`);

    // Format numérique pour les montants (col 9 et 10)
    sheetISI.getColumn(9).numFmt = '#,##0.00';
    sheetISI.getColumn(10).numFmt = '#,##0.00';
};

module.exports = {
    exportISIToExcel
}