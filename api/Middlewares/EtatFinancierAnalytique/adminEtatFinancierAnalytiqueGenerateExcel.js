const db = require("../../Models");
require('dotenv').config();
const path = require('path');

const rubriquesExternesAnalytiques = db.rubriquesExternesAnalytiques;
const rubriqueExternesEvcpAnalytiques = db.rubriqueExternesEvcpAnalytiques;

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const generateTitleAnalytique = (sheetName, label, dossier, compte, date_debut, date_fin, cellEnd) => {
    sheetName.insertRow(1, [label]);
    sheetName.mergeCells(`A1:${cellEnd}1`);

    const titre = sheetName.getRow(1);
    titre.font = { bold: true, size: 20 };
    titre.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
    };
    titre.height = 25;

    sheetName.insertRow(2, [`Dossier : ${dossier || ''}`]);
    sheetName.mergeCells(`A2:${cellEnd}2`);

    const sousTitre = sheetName.getRow(2);
    sousTitre.font = { italic: true, bold: true, size: 15, color: { argb: 'FF555555' } };
    sousTitre.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
    };
    sousTitre.height = 25;

    sheetName.insertRow(3, [`Période du : ${date_debut || ''} au ${date_fin || ''}`]);
    sheetName.mergeCells(`A3:${cellEnd}3`);

    const periodeRow = sheetName.getRow(4);
    periodeRow.font = { italic: true, size: 12, color: { argb: 'FF777777' } };
    periodeRow.alignment = {
        horizontal: 'left',
        vertical: 'middle'
    };
    periodeRow.height = 20;
};

const getRubriqueExterneAnalytiqueData = async (id_compte, id_dossier, id_exercice, id_etat) => {
    return rubriquesExternesAnalytiques.findAll({
        where: {
            id_dossier,
            id_exercice,
            id_compte,
            id_etat,
        },
        order: [['ordre', 'ASC']]
    })
}

const exportBilanAnalytiqueToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const bilanActifData = await getRubriqueExterneAnalytiqueData(id_compte, id_dossier, id_exercice, 'BILAN_ACTIF');
    const bilanPassifData = await getRubriqueExterneAnalytiqueData(id_compte, id_dossier, id_exercice, 'BILAN_PASSIF');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    const sheetActif = workbook.addWorksheet('Bilan Actif');
    sheetActif.columns = [
        { header: 'Actif', width: 45 },
        { header: 'Montant brut', width: 20 },
        { header: 'Amort./Perte val.', width: 20 },
        { header: 'Montant net N', width: 20 },
        { header: 'Montant net N-1', width: 20 }
    ];

    generateTitleAnalytique(sheetActif, 'Liste des Bilan actif', dossier, compte, date_debut, date_fin, 'E');

    sheetActif.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerActif = sheetActif.getRow(4);
    headerActif.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        if (colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 6) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
            cell.alignment = { vertical: 'middle' };
        }
    });

    bilanActifData.forEach(row => {
        const isTitre = row.type === 'TITRE';
        const isTotal = row.type === 'TOTAL';
        const isSousTotal = row.type === 'SOUS-TOTAL';
        const bgColor = isTotal ? '89A8B2' : isTitre ? 'f0f0f0' : isSousTotal ? '9bc2cf' : null;

        const newRow = sheetActif.addRow([
            row.libelle || '',
            isTitre ? '' : Number(row.montantbrut),
            isTitre ? '' : Number(row.montantamort),
            isTitre ? '' : Number(row.montantnet),
            isTitre ? '' : Number(row.montantnetn1)
        ]);

        if (bgColor) {
            newRow.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });

    for (let i = 2; i <= 5; i++) {
        sheetActif.getColumn(i).numFmt = '#,##0.00';
    }

    const sheetPassif = workbook.addWorksheet('Bilan Passif');
    sheetPassif.columns = [
        { header: 'Capitaux propres', width: 60 },
        { header: 'Montant N', width: 20 },
        { header: 'Montant N-1', width: 20 }
    ];

    generateTitleAnalytique(sheetPassif, 'Liste des Bilan passif', dossier, compte, date_debut, date_fin, 'C');

    sheetPassif.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerPassif = sheetPassif.getRow(4);
    headerPassif.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        if (colNumber === 3 || colNumber === 4) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
            cell.alignment = { vertical: 'middle' };
        }
    });

    for (let i = 1; i <= 2; i++) {
        sheetPassif.getColumn(i).numFmt = '#,##0.00';
    }

    bilanPassifData.forEach(row => {
        const isTitre = row.type === 'TITRE';
        const isTotal = row.type === 'TOTAL';
        const isSousTotal = row.type === 'SOUS-TOTAL';
        const bgColor = isTotal ? '89A8B2' : isTitre ? 'f0f0f0' : isSousTotal ? '9bc2cf' : null;

        const newRow = sheetPassif.addRow([
            row.libelle || '',
            isTitre ? '' : Number(row.montantnet),
            isTitre ? '' : Number(row.montantnetn1)
        ]);

        if (bgColor) {
            newRow.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });
}

const exportCrnAnalytiqueToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const crnData = await getRubriqueExterneAnalytiqueData(id_compte, id_dossier, id_exercice, 'CRN');
    const sheetCrn = workbook.addWorksheet('Compte de résultats par nature');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetCrn.columns = [
        { header: 'Rubriques', width: 60 },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitleAnalytique(sheetCrn, 'Liste des compte de résultats par fonction', dossier, compte, date_debut, date_fin, 'C');

    sheetCrn.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerCrn = sheetCrn.getRow(4);
    headerCrn.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
    });

    crnData.forEach(row => {
        const isTitre = row.type === 'TITRE';
        const isTotal = row.type === 'TOTAL';
        const isSousTotal = row.type === 'SOUS-TOTAL';
        const bgColor = isTotal ? '89A8B2' : isTitre ? 'f0f0f0' : isSousTotal ? '9bc2cf' : null;

        const newRow = sheetCrn.addRow([
            row.libelle || '',
            isTitre ? '' : Number(row.montantnet) || 0,
            isTitre ? '' : Number(row.montantnetn1) || 0
        ]);

        if (bgColor) {
            newRow.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });

    for (let i = 1; i <= 2; i++) {
        sheetCrn.getColumn(i).numFmt = '#,##0.00';
    }
}

const exportCrfAnalytiqueToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const crfData = await getRubriqueExterneAnalytiqueData(id_compte, id_dossier, id_exercice, 'CRF');
    const sheetCrf = workbook.addWorksheet('Compte de résultats par fonction');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetCrf.columns = [
        { header: 'Rubriques', width: 60 },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitleAnalytique(sheetCrf, 'Liste des compte de résultats par fonction', dossier, compte, date_debut, date_fin, 'C');

    sheetCrf.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerCrf = sheetCrf.getRow(4);
    headerCrf.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
    });

    crfData.forEach(row => {
        const isTitre = row.type === 'TITRE';
        const isTotal = row.type === 'TOTAL';
        const isSousTotal = row.type === 'SOUS-TOTAL';
        const bgColor = isTotal ? '89A8B2' : isTitre ? 'f0f0f0' : isSousTotal ? '9bc2cf' : null;

        const newRow = sheetCrf.addRow([
            row.libelle || '',
            isTitre ? '' : Number(row.montantnet) || 0,
            isTitre ? '' : Number(row.montantnetn1) || 0
        ]);

        if (bgColor) {
            newRow.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });

    for (let i = 1; i <= 2; i++) {
        sheetCrf.getColumn(i).numFmt = '#,##0.00';
    }
}

const exportTftiAnalytiqueToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const tftiData = await getRubriqueExterneAnalytiqueData(id_compte, id_dossier, id_exercice, 'TFTI');
    const sheetTfti = workbook.addWorksheet('TFTI Méth. Indirecte');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetTfti.columns = [
        { header: 'Rubriques', width: 72, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitleAnalytique(sheetTfti, 'Liste des Tableau de flux de trésoreries méthode indirecte', dossier, compte, date_debut, date_fin, 'C');

    sheetTfti.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerRow = sheetTfti.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    tftiData.forEach(row => {
        const isTitre = row.type === 'TITRE';
        const isTotal = row.type === 'TOTAL';
        const isSousTotal = row.type === 'SOUS-TOTAL';
        const bgColor = isTotal ? '89A8B2' : isTitre ? 'f0f0f0' : isSousTotal ? '9bc2cf' : null;

        const newRow = sheetTfti.addRow([
            row.libelle || '',
            isTitre ? '' : Number(row.montantnet) || 0,
            isTitre ? '' : Number(row.montantnetn1) || 0
        ]);

        if (bgColor) {
            newRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });

    sheetTfti.getColumn(1).numFmt = '#,##0.00';
    sheetTfti.getColumn(2).numFmt = '#,##0.00';
}

const exportTftdAnalytiqueToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const tftdData = await getRubriqueExterneAnalytiqueData(id_compte, id_dossier, id_exercice, 'TFTD');
    const sheetTftd = workbook.addWorksheet('TFTD Méth. Directe');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetTftd.columns = [
        { header: 'Rubriques', width: 72, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitleAnalytique(sheetTftd, 'Liste des Tableau de flux de trésoreries méthode directe', dossier, compte, date_debut, date_fin, 'D');

    sheetTftd.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerRow = sheetTftd.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    tftdData.forEach(row => {
        const isTitre = row.type === 'TITRE';
        const isTotal = row.type === 'TOTAL';
        const isSousTotal = row.type === 'SOUS-TOTAL';
        const bgColor = isTotal ? '89A8B2' : isTitre ? 'f0f0f0' : isSousTotal ? '9bc2cf' : null;

        const newRow = sheetTftd.addRow([
            row.libelle || '',
            isTitre ? '' : Number(row.montantnet) || 0,
            isTitre ? '' : Number(row.montantnetn1) || 0
        ]);

        if (bgColor) {
            newRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });

    sheetTftd.getColumn(1).numFmt = '#,##0.00';
    sheetTftd.getColumn(2).numFmt = '#,##0.00';
}

const exportEvcpAnalytiqueToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const evcpData = await rubriqueExternesEvcpAnalytiques.findAll({
        where: {
            id_compte,
            id_dossier,
            id_exercice
        }
    })
    const sheetEvcp = workbook.addWorksheet('Etat de variation des capitaux propres');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetEvcp.columns = [
        { header: 'Rubriques', width: 50, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Note', width: 12, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Capital social', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Capital prime & res', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Ecart d\'évaluation', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Résultat', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Report à nouveau', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Total', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitleAnalytique(sheetEvcp, 'Liste des Etat de variation des capitaux propres', dossier, compte, date_debut, date_fin, 'H');

    sheetEvcp.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerRow = sheetEvcp.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    evcpData.forEach(row => {
        const isLevel1 = row.niveau === 1;
        const bgColor = isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetEvcp.addRow([
            row.libelle || '',
            row.note || '',
            Number(row.capitalsocial) || 0,
            Number(row.primereserve) || 0,
            Number(row.ecartdevaluation) || 0,
            Number(row.resultat) || 0,
            Number(row.report_anouveau) || 0,
            Number(row.total_varcap) || 0
        ]);

        if (bgColor) {
            newRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }
    });

    sheetEvcp.getColumn(3).numFmt = '#,##0.00';
    sheetEvcp.getColumn(4).numFmt = '#,##0.00';
    sheetEvcp.getColumn(5).numFmt = '#,##0.00';
    sheetEvcp.getColumn(6).numFmt = '#,##0.00';
    sheetEvcp.getColumn(7).numFmt = '#,##0.00';
    sheetEvcp.getColumn(8).numFmt = '#,##0.00';
}

module.exports = {
    exportBilanAnalytiqueToExcel,
    exportCrnAnalytiqueToExcel,
    exportCrfAnalytiqueToExcel,
    exportTftiAnalytiqueToExcel,
    exportTftdAnalytiqueToExcel,
    exportEvcpAnalytiqueToExcel,
}