require('dotenv').config();
const path = require('path');
const recupTableau = require('../../Middlewares/Ebilan/recupTableau');

const recupEbilan = require('../../Middlewares/Declaration/Ebilan/EblianMiddleware');
const getEbilanComplet = recupEbilan.getEbilanComplet;

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [jour, mois, annee] = dateStr.split('-');

    return `${annee}/${mois.padStart(2, '0')}/${jour.padStart(2, '0')}`;
};

const generateTitle = (sheetName, label, dossier, compte, date_debut, date_fin, cellEnd) => {
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

const exportBilanToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const bilanActif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 1);
    const bilanPassif = data.filter(val => val.id_etat === 'BILAN' && val.subtable === 2);

    // Feuille Actif
    const sheetActif = workbook.addWorksheet('Bilan Actif');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetActif.columns = [
        { header: 'Actif', width: 45 },
        { header: 'Note', width: 12 },
        { header: 'Montant brut', width: 20 },
        { header: 'Amort./Perte val.', width: 20 },
        { header: 'Montant net N', width: 20 },
        { header: 'Montant net N-1', width: 20 }
    ];

    generateTitle(sheetActif, 'Bilan actif', dossier, compte, date_debut, date_fin, 'F');

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

    bilanActif.forEach(row => {
        const isLevel0 = row.niveau === 0;
        const isLevel4 = row.niveau === 4;

        const bgColor = isLevel4 ? 'FF89A8B2' : isLevel0 ? 'FFF0F0F0' : null;

        const newRow = sheetActif.addRow([
            row.libelle || '',
            row.note || '',
            isLevel0 ? '' : Number(row.montantbrut),
            isLevel0 ? '' : Number(row.montantamort),
            isLevel0 ? '' : Number(row.montantnet),
            isLevel0 ? '' : Number(row.montantnetn1)
        ]);

        // Appliquer la couleur de fond
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

    for (let i = 4; i <= 6; i++) {
        sheetActif.getColumn(i).numFmt = '#,##0.00';
    }

    // Feuille Passif
    const sheetPassif = workbook.addWorksheet('Bilan Passif');
    // sheetPassif.views = [
    //     { state: 'frozen', ySplit: 1 }
    // ];
    sheetPassif.columns = [
        { header: 'Capitaux propres', width: 60 },
        { header: 'Note', width: 12 },
        { header: 'Montant N', width: 20 },
        { header: 'Montant N-1', width: 20 }
    ];

    generateTitle(sheetPassif, 'Bilan passif', dossier, compte, date_debut, date_fin, 'D');

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

    for (let i = 2; i <= 4; i++) {
        sheetPassif.getColumn(i).numFmt = '#,##0.00';
    }

    bilanPassif.forEach(row => {
        const isLevel0 = row.niveau === 0;
        const isLevel4 = row.niveau === 4;

        const bgColor = isLevel4 ? 'FF89A8B2' : isLevel0 ? 'FFF0F0F0' : null;
        const newRow = sheetPassif.addRow([
            row.libelle || '',
            row.note || '',
            row.niveau === 0 ? '' : Number(row.montantnet),
            row.niveau === 0 ? '' : Number(row.montantnetn1)
        ]);

        // Appliquer la couleur de fond
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
};

const exportCrnToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const crn = data.filter(val => val.id_etat === 'CRN' && val.subtable === 0);

    const sheetCrn = workbook.addWorksheet('Compte de résultats par nature');

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // sheetCrn.views = [
    //     { state: 'frozen', ySplit: 1 }
    // ];
    sheetCrn.columns = [
        { header: 'Rubriques', width: 60 },
        { header: 'Note', width: 12 },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetCrn, 'Compte de résultats par nature', dossier, compte, date_debut, date_fin, 'D');

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

    crn.forEach(row => {
        const isLevel1 = row.niveau === 1;
        const bgColor = isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetCrn.addRow([
            row.libelle || '',
            row.note || '',
            isLevel1 ? '' : Number(row.montantnet) || 0,
            isLevel1 ? '' : Number(row.montantnetn1) || 0
        ]);

        // Appliquer la couleur de fond
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

    for (let i = 2; i <= 4; i++) {
        sheetCrn.getColumn(i).numFmt = '#,##0.00';
    }
};

const exportCrfToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const crf = data.filter(val => val.id_etat === 'CRF' && val.subtable === 0);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    const sheetCrf = workbook.addWorksheet('Compte de résultats par fonction');
    // sheetCrf.views = [
    //     { state: 'frozen', ySplit: 1 }
    // ];
    sheetCrf.columns = [
        { header: 'Rubriques', width: 60 },
        { header: 'Note', width: 12 },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetCrf, 'Compte de résultats par fonction', dossier, compte, date_debut, date_fin, 'D');

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

    crf.forEach(row => {
        const isLevel0 = row.niveau === 0;
        const isLevel4 = row.niveau === 4;
        const isLevel1 = row.niveau === 1;
        const bgColor = isLevel4 ? 'FF89A8B2' : isLevel0 ? 'FFF0F0F0' : isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetCrf.addRow([
            row.libelle || '',
            row.note || '',
            isLevel1 ? '' : Number(row.montantnet) || 0,
            isLevel1 ? '' : Number(row.montantnetn1) || 0
        ]);

        // Appliquer la couleur de fond
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

    for (let i = 2; i <= 4; i++) {
        sheetCrf.getColumn(i).numFmt = '#,##0.00';
    }
};

const exportTftdToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const tftd = data.filter(val => val.id_etat === 'TFTD' && val.subtable === 0);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Feuille TFTD avec nom court
    const sheetTftd = workbook.addWorksheet('TFTD Méth. Directe');
    // sheetTftd.views = [{ state: 'frozen', ySplit: 1 }];

    // Colonnes avec alignement par défaut
    sheetTftd.columns = [
        { header: 'Rubriques', width: 72, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Note', width: 12, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Sens', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetTftd, 'Tableau de flux de trésoreries méthode directe', dossier, compte, date_debut, date_fin, 'E');

    sheetTftd.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetTftd.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    tftd.forEach(row => {
        const isLevel0 = row.niveau === 0;
        const isLevel4 = row.niveau === 4;
        const isLevel1 = row.niveau === 1;
        const bgColor = isLevel4 ? 'FF89A8B2' : isLevel0 ? 'FFF0F0F0' : isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetTftd.addRow([
            row.libelle || '',
            row.note || '',
            row.senscalcul || '',
            isLevel1 ? '' : Number(row.montantnet) || 0,
            isLevel1 ? '' : Number(row.montantnetn1) || 0
        ]);

        // Appliquer la couleur de fond
        if (bgColor) {
            newRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }

        // Centrer la colonne "Sens"
        newRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Format numérique pour les montants
    sheetTftd.getColumn(4).numFmt = '#,##0.00';
    sheetTftd.getColumn(5).numFmt = '#,##0.00';
};

const exportTftiToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const data = await getEbilanComplet(id_compte, id_dossier, id_exercice);

    const tfti = data.filter(val => val.id_rubrique === 'TFTI' && val.subtable === 0);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Feuille TFTI avec nom court
    const sheetTfti = workbook.addWorksheet('TFTI Méth. Indirecte');
    // sheetTfti.views = [{ state: 'frozen', ySplit: 1 }];

    // Colonnes avec alignement par défaut
    sheetTfti.columns = [
        { header: 'Rubriques', width: 72, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Note', width: 12, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant net N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant net N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetTfti, 'Tableau de flux de trésoreries méthode indirecte', dossier, compte, date_debut, date_fin, 'D');

    sheetTfti.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetTfti.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    tfti.forEach(row => {
        const isLevel0 = row.niveau === 0;
        const isLevel4 = row.niveau === 4;
        const isLevel1 = row.niveau === 1;
        const bgColor = isLevel4 ? 'FF89A8B2' : isLevel0 ? 'FFF0F0F0' : isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetTfti.addRow([
            row.libelle || '',
            row.note || '',
            isLevel1 ? '' : Number(row.montantnet) || 0,
            isLevel1 ? '' : Number(row.montantnetn1) || 0
        ]);

        // Appliquer la couleur de fond
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

    // Format numérique pour les montants
    sheetTfti.getColumn(3).numFmt = '#,##0.00';
    sheetTfti.getColumn(4).numFmt = '#,##0.00';
};

const exportEvcpToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const evcp = await recupTableau.recupEVCP(id_compte, id_dossier, id_exercice);

    // Feuille EVCP avec nom court
    const sheetEvcp = workbook.addWorksheet('Etat de variation des capitaux propres');
    // sheetEvcp.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
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

    generateTitle(sheetEvcp, 'Etat de variation des capitaux propres', dossier, compte, date_debut, date_fin, 'H');

    sheetEvcp.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetEvcp.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    evcp.forEach(row => {
        const isLevel1 = row.niveau === 1;
        const bgColor = isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetEvcp.addRow([
            row.rubriquesmatrix?.libelle || '',
            row.note || '',
            Number(row.capitalsocial) || 0,
            Number(row.primereserve) || 0,
            Number(row.ecartdevaluation) || 0,
            Number(row.resultat) || 0,
            Number(row.report_anouveau) || 0,
            Number(row.total_varcap) || 0
        ]);

        // Appliquer la couleur de fond
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

    // Format numérique pour les montants
    sheetEvcp.getColumn(3).numFmt = '#,##0.00';
    sheetEvcp.getColumn(4).numFmt = '#,##0.00';
    sheetEvcp.getColumn(5).numFmt = '#,##0.00';
    sheetEvcp.getColumn(6).numFmt = '#,##0.00';
    sheetEvcp.getColumn(7).numFmt = '#,##0.00';
    sheetEvcp.getColumn(8).numFmt = '#,##0.00';
};

const exportDrfToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const drf = await recupTableau.recupDRF(id_compte, id_dossier, id_exercice);

    // Feuille DRF avec nom court
    const sheetDrf = workbook.addWorksheet('Détermination du résultat fiscal');
    // sheetDrf.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetDrf.columns = [
        { header: 'Rubriques', width: 90, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Note', width: 40, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Sens', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Montant', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetDrf, 'Détermination du résultat fiscal', dossier, compte, date_debut, date_fin, 'D');

    sheetDrf.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetDrf.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    drf.forEach(row => {
        const isLevel1 = row.niveau === 1;
        const isLevel4 = row.niveau === 4;
        const bgColor = isLevel4 ? 'FF89A8B2' : isLevel1 ? 'f0f0f0' : null;

        const newRow = sheetDrf.addRow([
            row.rubriquesmatrix?.libelle || '',
            row.note || '',
            row.signe || '',
            Number(row.montant_brut) || 0
        ]);

        // Appliquer la couleur de fond
        if (bgColor) {
            newRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
            });
        }

        newRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Format numérique pour les montants
    sheetDrf.getColumn(4).numFmt = '#,##0.00';
};

const exportBhiapcToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const bhiapc = await recupTableau.recupBHIAPC(id_compte, id_dossier, id_exercice);

    // Feuille BHIAPC avec nom court
    const sheetBhiapc = workbook.addWorksheet('Etat des bénéficiaires d\'honoraires,d\'intérêts ou d\'arrérages portés en charge');
    // sheetBhiapc.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetBhiapc.columns = [
        { header: 'NIF', width: 35, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Raison sociale', width: 40, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Adresse', width: 40, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant charge', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant bénéficiaire', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetBhiapc, 'Etat des bénéficiaires d\'honoraires, d\'intérêts ou d\'arrérages portés en charge', dossier, compte, date_debut, date_fin, 'E');

    sheetBhiapc.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetBhiapc.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let total_montant_charge = 0;
    let total_montant_beneficiaire = 0;

    // Ajout des lignes
    bhiapc.forEach(row => {
        total_montant_charge += parseFloat(row.montant_charge) || 0;
        total_montant_beneficiaire += parseFloat(row.montant_beneficiaire) || 0;
        const newRow = sheetBhiapc.addRow([
            Number(row.nif) || '',
            row.raison_sociale || '',
            row.adresse || '',
            Number(row.montant_charge) || 0,
            Number(row.montant_beneficiaire) || 0
        ]);
    });

    // Ligne Total
    const totalRow = sheetBhiapc.addRow([
        'Total',
        '',
        '',
        Number(total_montant_charge) || 0,
        Number(total_montant_beneficiaire) || 0
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

    // Fusionner les cellules 1 à 3 pour le label "Total"
    sheetBhiapc.mergeCells(`A${totalRow.number}:C${totalRow.number}`);

    // Format numérique pour les montants
    sheetBhiapc.getColumn(4).numFmt = '#,##0.00';
    sheetBhiapc.getColumn(5).numFmt = '#,##0.00';
};

const exportMpToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const mp = await recupTableau.recupMP(id_compte, id_dossier, id_exercice);

    // Feuille MP avec nom court
    const sheetMp = workbook.addWorksheet('Marché public');
    // sheetMp.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetMp.columns = [
        { header: 'Marché', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Référence', width: 40, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Date', width: 40, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Date payement', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant HT', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant payé', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'TMP', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetMp, 'Marché public', dossier, compte, date_debut, date_fin, 'G');

    sheetMp.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetMp.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let total_montant_ht = 0;
    let total_montant_paye = 0;
    let total_tmp = 0;

    // Ajout des lignes
    mp.forEach(row => {
        total_montant_ht += parseFloat(row.montant_marche_ht) || 0;
        total_montant_paye += parseFloat(row.montant_paye) || 0;
        total_tmp += parseFloat(row.tmp) || 0;
        const newRow = sheetMp.addRow([
            row.marche || '',
            row.ref_marche || '',
            formatDate(row.date) || '',
            formatDate(row.date_paiement) || '',
            Number(row.montant_marche_ht) || 0,
            Number(row.montant_paye) || 0,
            Number(row.tmp) || 0
        ]);
    });

    // Ligne Total
    const totalRow = sheetMp.addRow([
        'Total',
        '',
        '',
        '',
        Number(total_montant_ht) || 0,
        Number(total_montant_paye) || 0,
        Number(total_tmp) || 0
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

    // Fusionner les cellules 1 à 3 pour le label "Total"
    sheetMp.mergeCells(`A${totalRow.number}:D${totalRow.number}`);

    // Format numérique pour les montants
    sheetMp.getColumn(5).numFmt = '#,##0.00';
    sheetMp.getColumn(6).numFmt = '#,##0.00';
    sheetMp.getColumn(7).numFmt = '#,##0.00';
};

const exportDaToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const da = await recupTableau.recupDA(id_compte, id_dossier, id_exercice);

    const sheetDa = workbook.addWorksheet('Détails amortissements');
    // sheetDa.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes
    sheetDa.columns = [
        { header: 'Designation', width: 30, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'N° compte', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Date acquis.', width: 15, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Taux', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Valeur acquis. (A)', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Augmentation (B)', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Diminution (C)', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Amort. cumulés début (D)', width: 38, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Dot. exercice (E)', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Amort. cumulés fin (F) = (D)+(E)', width: 42, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Valeur nette comptable (G) = (A)+(B)-(C)-(F)', width: 41, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetDa, 'Détails amortissements', dossier, compte, date_debut, date_fin, 'K');

    sheetDa.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style entête
    const headerRow = sheetDa.getRow(4);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let total = {
        valeur_acquisition: 0,
        augmentation: 0,
        diminution: 0,
        amort_anterieur_debut: 0,
        dotation_exercice: 0,
        amort_cumule: 0,
        valeur_nette: 0
    };

    let sousTotal = { ...total };
    let currentRubrique = null;

    const addSousTotalRow = (label, data) => {
        const row = sheetDa.addRow([
            label, '', '', '',
            data.valeur_acquisition,
            data.augmentation,
            data.diminution,
            data.amort_anterieur_debut,
            data.dotation_exercice,
            data.amort_cumule,
            data.valeur_nette
        ]);
        row.font = { bold: true };
        row.eachCell((cell, col) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6EAF8' } };
            cell.alignment = col === 1 ? { horizontal: 'left' } : { horizontal: 'right' };
        });
    };

    da.forEach((row, index) => {
        // Changement de rubrique
        if (row.rubriques_poste !== currentRubrique) {
            if (currentRubrique !== null) {
                addSousTotalRow('Sous-total', sousTotal);
                sousTotal = { ...total };
            }
            currentRubrique = row.rubriques_poste;

            const rubriqueLabel =
                currentRubrique === "GOODWILL" ? "GOODWILL" :
                    currentRubrique === "IMMO_CORP" ? "Immobilisations corporelles" :
                        currentRubrique === "IMMO_ENCOURS" ? "Immobilisations en cours" :
                            currentRubrique === "IMMO_FIN" ? "Immobilisations financières" :
                                currentRubrique === "IMMO_INCORP" ? "Immobilisations incorporelles" :
                                    "Indéfinie";

            const sepRow = sheetDa.addRow([rubriqueLabel, '', '', '', '', '', '', '', '', '', '']);
            sepRow.font = { bold: true };
            sepRow.eachCell((cell, col) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D5DBDB' } };
                if (col === 1) cell.alignment = { horizontal: 'left' };
            });

            sousTotal = {
                valeur_acquisition: 0,
                augmentation: 0,
                diminution: 0,
                amort_anterieur_debut: 0,
                dotation_exercice: 0,
                amort_cumule: 0,
                valeur_nette: 0
            };
        }

        // Ajout des valeurs
        const va = parseFloat(row.valeur_acquisition) || 0;
        const aug = parseFloat(row.augmentation) || 0;
        const dim = parseFloat(row.diminution) || 0;
        const amdeb = parseFloat(row.amort_anterieur_debut) || 0;
        const dot = parseFloat(row.dotation_exercice) || 0;
        const amfin = parseFloat(row.amort_cumule) || 0;
        const vn = parseFloat(row.valeur_nette) || 0;

        total.valeur_acquisition += va;
        total.augmentation += aug;
        total.diminution += dim;
        total.amort_anterieur_debut += amdeb;
        total.dotation_exercice += dot;
        total.amort_cumule += amfin;
        total.valeur_nette += vn;

        sousTotal.valeur_acquisition += va;
        sousTotal.augmentation += aug;
        sousTotal.diminution += dim;
        sousTotal.amort_anterieur_debut += amdeb;
        sousTotal.dotation_exercice += dot;
        sousTotal.amort_cumule += amfin;
        sousTotal.valeur_nette += vn;

        sheetDa.addRow([
            row.libelle || '',
            Number(row.num_compte) || '',
            formatDate(row.date_acquisition) || '',
            row.taux || '',
            va, aug, dim, amdeb, dot, amfin, vn
        ]);

        // Si dernière ligne, on ajoute le dernier sous-total
        if (index === da.length - 1) {
            addSousTotalRow('Sous-total', sousTotal);
        }
    });

    // Ligne total
    const totalRow = sheetDa.addRow([
        'Total', '', '', '',
        total.valeur_acquisition,
        total.augmentation,
        total.diminution,
        total.amort_anterieur_debut,
        total.dotation_exercice,
        total.amort_cumule,
        total.valeur_nette
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB2BABB' } };
        cell.alignment = col === 1 ? { horizontal: 'left' } : { horizontal: 'right' };
    });
    sheetDa.mergeCells(`A${totalRow.number}:D${totalRow.number}`);

    // Formats numériques
    for (let i = 5; i <= 11; i++) {
        sheetDa.getColumn(i).numFmt = '#,##0.00';
    }
};

const exportDpToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const dp = await recupTableau.recupDP(id_compte, id_dossier, id_exercice);

    const sheetDp = workbook.addWorksheet('Détails provisions');
    // sheetDp.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes
    sheetDp.columns = [
        { header: 'Désignation', width: 40, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant début exercice (A)', width: 25, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Augmentation dot. de l\'exercice (B)', width: 35, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Diminution reprise de l\'exercice (C)', width: 35, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant fin exercice (D) = (A)+(B)-(C)', width: 35, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetDp, 'Détails provisions', dossier, compte, date_debut, date_fin, 'E');

    sheetDp.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style entête
    const headerRow = sheetDp.getRow(4);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let total = {
        montant_debut_ex: 0,
        augm_dot_ex: 0,
        dim_repr_ex: 0,
        montant_fin: 0
    };

    let sousTotal = { ...total };
    let currentRubrique = null;

    const addSousTotalRow = (label, data) => {
        const row = sheetDp.addRow([
            label,
            data.montant_debut_ex,
            data.augm_dot_ex,
            data.dim_repr_ex,
            data.montant_fin
        ]);
        row.font = { bold: true };
        row.eachCell((cell, col) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6EAF8' } };
            cell.alignment = col === 1 ? { horizontal: 'left' } : { horizontal: 'right' };
        });
    };

    dp.forEach((row, index) => {
        // Changement de rubrique
        if (row.nature_prov !== currentRubrique) {
            if (currentRubrique !== null) {
                addSousTotalRow('Sous-total', sousTotal);
                sousTotal = { ...total };
            }
            currentRubrique = row.nature_prov;

            const sepRow = sheetDp.addRow([currentRubrique, '', '', '', '']);
            sepRow.font = { bold: true };
            sepRow.eachCell((cell, col) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D5DBDB' } };
                if (col === 1) cell.alignment = { horizontal: 'left' };
            });

            sousTotal = {
                montant_debut_ex: 0,
                augm_dot_ex: 0,
                dim_repr_ex: 0,
                montant_fin: 0
            };
        }

        // Valeurs numériques
        const md = parseFloat(row.montant_debut_ex) || 0;
        const dot = parseFloat(row.augm_dot_ex) || 0;
        const rep = parseFloat(row.dim_repr_ex) || 0;
        const mf = parseFloat(row.montant_fin) || 0;

        // Cumuls totaux et sous-totaux
        total.montant_debut_ex += md;
        total.augm_dot_ex += dot;
        total.dim_repr_ex += rep;
        total.montant_fin += mf;

        sousTotal.montant_debut_ex += md;
        sousTotal.augm_dot_ex += dot;
        sousTotal.dim_repr_ex += rep;
        sousTotal.montant_fin += mf;

        sheetDp.addRow([
            row.libelle || '',
            md, dot, rep, mf
        ]);

        // Si dernière ligne -> sous-total
        if (index === dp.length - 1) {
            addSousTotalRow('Sous-total', sousTotal);
        }
    });

    // Ligne total
    const totalRow = sheetDp.addRow([
        'Total',
        total.montant_debut_ex,
        total.augm_dot_ex,
        total.dim_repr_ex,
        total.montant_fin
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB2BABB' } };
        cell.alignment = col === 1 ? { horizontal: 'left' } : { horizontal: 'right' };
    });
    // sheetDp.mergeCells(`A${totalRow.number}:B${totalRow.number}`);

    // Formats numériques
    for (let i = 2; i <= 5; i++) {
        sheetDp.getColumn(i).numFmt = '#,##0.00';
    }
};

const exportEiafncToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const eiafnc = await recupTableau.recupEIAFNC(id_compte, id_dossier, id_exercice);

    const sheetEiafnc = workbook.addWorksheet('Evolution des immobilisations et actifs financiers non courants');
    // sheetEiafnc.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes
    sheetEiafnc.columns = [
        { header: 'N° compte', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Libelle', width: 25, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Valeur brut de l\'éxercice (A)', width: 26, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Augmentation de l\'exercice (B)', width: 30, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Diminution l\'exercice (C)', width: 24, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Val. brut clôture (D) = (A)+(B)-(C)', width: 31, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetEiafnc, 'Evolution des immobilisations et actifs financiers non courants', dossier, compte, date_debut, date_fin, 'F');

    sheetEiafnc.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style entête
    const headerRow = sheetEiafnc.getRow(4);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let total = {
        valeur_acquisition: 0,
        augmentation: 0,
        diminution: 0,
        valeur_brute: 0
    };

    let sousTotal = { ...total };
    let currentRubrique = null;

    const addSousTotalRow = (label, data) => {
        const row = sheetEiafnc.addRow([
            label, '',
            data.valeur_acquisition,
            data.augmentation,
            data.diminution,
            data.valeur_brute
        ]);
        row.font = { bold: true };
        row.eachCell((cell, col) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6EAF8' } };
            cell.alignment = col === 1 ? { horizontal: 'left' } : { horizontal: 'right' };
        });
    };

    eiafnc.forEach((row, index) => {
        // Changement de rubrique
        if (row.rubriques_poste !== currentRubrique) {
            if (currentRubrique !== null) {
                addSousTotalRow('Sous-total', sousTotal);
                sousTotal = { ...total };
            }
            currentRubrique = row.rubriques_poste;

            const sepRow = sheetEiafnc.addRow([currentRubrique, '', '', '', '', '']);
            sepRow.font = { bold: true };
            sepRow.eachCell((cell, col) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D5DBDB' } };
                if (col === 1) cell.alignment = { horizontal: 'left' };
            });

            // Réinitialisation des sous-totaux
            sousTotal = {
                valeur_acquisition: 0,
                augmentation: 0,
                diminution: 0,
                valeur_brute: 0
            };
        }

        // Valeurs numériques
        const va = parseFloat(row.valeur_acquisition) || 0;
        const aug = parseFloat(row.augmentation) || 0;
        const dim = parseFloat(row.diminution) || 0;
        const vb = parseFloat(row.valeur_brute) || 0;

        // Cumuls totaux et sous-totaux
        total.valeur_acquisition += va;
        total.augmentation += aug;
        total.diminution += dim;
        total.valeur_brute += vb;

        sousTotal.valeur_acquisition += va;
        sousTotal.augmentation += aug;
        sousTotal.diminution += dim;
        sousTotal.valeur_brute += vb;

        sheetEiafnc.addRow([
            Number(row.num_compte) || '',
            row.libelle || '',
            va, aug, dim, vb
        ]);

        // Si dernière ligne -> sous-total
        if (index === eiafnc.length - 1) {
            addSousTotalRow('Sous-total', sousTotal);
        }
    });

    // Ligne total
    const totalRow = sheetEiafnc.addRow([
        'Total', '',
        total.valeur_acquisition,
        total.augmentation,
        total.diminution,
        total.valeur_brute
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB2BABB' } };
        cell.alignment = col === 1 ? { horizontal: 'left' } : { horizontal: 'right' };
    });
    sheetEiafnc.mergeCells(`A${totalRow.number}:B${totalRow.number}`);

    // Formats numériques
    for (let i = 3; i <= 6; i++) {
        sheetEiafnc.getColumn(i).numFmt = '#,##0.00';
    }
};

const exportSadToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const sad = await recupTableau.recupSAD(id_compte, id_dossier, id_exercice);

    // Feuille SAD avec nom court
    const sheetSad = workbook.addWorksheet('Suivi des amortissements différés');
    // sheetSad.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetSad.columns = [
        { header: 'Libelle', width: 35, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'N-6', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-5', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-4', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-3', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-2', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Total imputation', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetSad, 'Suivi des amortissements différés', dossier, compte, date_debut, date_fin, 'I');

    sheetSad.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetSad.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    sad.forEach(row => {
        const newRow = sheetSad.addRow([
            row.libelle || '',
            Number(row.n6) || 0,
            Number(row.n5) || 0,
            Number(row.n4) || 0,
            Number(row.n3) || 0,
            Number(row.n2) || 0,
            Number(row.n1) || 0,
            Number(row.n) || 0,
            Number(row.total_imputation) || 0
        ]);
    });

    // Format numérique pour les montants
    sheetSad.getColumn(2).numFmt = '#,##0.00';
    sheetSad.getColumn(3).numFmt = '#,##0.00';
    sheetSad.getColumn(4).numFmt = '#,##0.00';
    sheetSad.getColumn(5).numFmt = '#,##0.00';
    sheetSad.getColumn(6).numFmt = '#,##0.00';
    sheetSad.getColumn(7).numFmt = '#,##0.00';
    sheetSad.getColumn(8).numFmt = '#,##0.00';
    sheetSad.getColumn(9).numFmt = '#,##0.00';
};

const exportSdrToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const sdr = await recupTableau.recupSDR(id_compte, id_dossier, id_exercice);

    // Feuille SDR avec nom court
    const sheetSdr = workbook.addWorksheet('Suivi des déficits reportables');
    // sheetSdr.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetSdr.columns = [
        { header: 'Constitution / Imputation', width: 45, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'N-6', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-5', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-4', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-3', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-2', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'N-1', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Exercice', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Total', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Solde imp. sur ex. ultérieur', width: 30, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Solde non imp. sur ex. ultérieur', width: 30, style: { alignment: { horizontal: 'right', vertical: 'middle' } } }
    ];

    generateTitle(sheetSdr, 'Suivi des déficits reportables', dossier, compte, date_debut, date_fin, 'K');

    sheetSdr.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetSdr.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    sdr.forEach(row => {
        const isLevel1 = row.niveau === 1;
        const isLevel40 = row.niveau === 40;
        const bgColor = isLevel1 ? 'f0f0f0' : isLevel40 ? '435347ff' : null;

        const newRow = sheetSdr.addRow([
            row.libelle || '',
            Number(row.n6) || 0,
            Number(row.n5) || 0,
            Number(row.n4) || 0,
            Number(row.n3) || 0,
            Number(row.n2) || 0,
            Number(row.n1) || 0,
            Number(row.exercice) || 0,
            Number(row.total) || 0,
            Number(row.solde_imputable) || 0,
            Number(row.solde_non_imputable) || 0
        ]);

        // Appliquer la couleur de fond
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

    // Format numérique pour les montants
    sheetSdr.getColumn(2).numFmt = '#,##0.00';
    sheetSdr.getColumn(3).numFmt = '#,##0.00';
    sheetSdr.getColumn(4).numFmt = '#,##0.00';
    sheetSdr.getColumn(5).numFmt = '#,##0.00';
    sheetSdr.getColumn(6).numFmt = '#,##0.00';
    sheetSdr.getColumn(7).numFmt = '#,##0.00';
    sheetSdr.getColumn(8).numFmt = '#,##0.00';
    sheetSdr.getColumn(9).numFmt = '#,##0.00';
    sheetSdr.getColumn(10).numFmt = '#,##0.00';
    sheetSdr.getColumn(11).numFmt = '#,##0.00';
};

const exportSeToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const se = await recupTableau.recupSE(id_compte, id_dossier, id_exercice);

    // Feuille MP avec nom court
    const sheetSe = workbook.addWorksheet('Suivi des emprunts');
    // sheetSe.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetSe.columns = [
        { header: 'Emprunteurs', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Date contrat', width: 23, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Durée contrat', width: 15, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montants emprunts (capital)', width: 28, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montans intérêts', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant total', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Date mise à disp.', width: 23, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Date de remboursement', width: 23, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Montant remb. de la période (capital)', width: 35, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant remb. de la période (intérêts)', width: 35, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Solde non remb. fin d\'éxercice', width: 30, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
    ];

    generateTitle(sheetSe, 'Suivi des emprunts', dossier, compte, date_debut, date_fin, 'K');

    sheetSe.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetSe.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let total_montant_emprunt = 0;
    let total_montant_interet = 0;
    let total_montant_total = 0;
    let total_montant_rembourse_capital = 0;
    let total_montant_rembourse_interet = 0;
    let total_solde_non_rembourse = 0;

    // Ajout des lignes
    se.forEach(row => {
        total_montant_emprunt += parseFloat(row.montant_emprunt) || 0;
        total_montant_interet += parseFloat(row.montant_interet) || 0;
        total_montant_total += parseFloat(row.montant_total) || 0;
        total_montant_rembourse_capital += parseFloat(row.montant_rembourse_capital) || 0;
        total_montant_rembourse_interet += parseFloat(row.montant_rembourse_interet) || 0;
        total_solde_non_rembourse += parseFloat(row.solde_non_rembourse) || 0;
        const newRow = sheetSe.addRow([
            row.liste_emprunteur || '',
            formatDate(row.date_contrat) || '',
            Number(row.duree_contrat) || 0,
            Number(row.montant_emprunt) || 0,
            Number(row.montant_interet) || 0,
            Number(row.montant_total) || 0,
            formatDate(row.date_disposition) || '',
            formatDate(row.date_remboursement) || '',
            Number(row.montant_rembourse_capital) || 0,
            Number(row.montant_rembourse_interet) || 0,
            Number(row.solde_non_rembourse) || 0
        ]);
    });

    // Ligne Total
    const totalRow = sheetSe.addRow([
        'Total',
        '',
        '',
        Number(total_montant_emprunt) || 0,
        Number(total_montant_interet) || 0,
        Number(total_montant_total) || 0,
        '',
        '',
        Number(total_montant_rembourse_capital) || 0,
        Number(total_montant_rembourse_capital) || 0,
        Number(total_solde_non_rembourse) || 0
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

    // Fusionner les cellules 1 à 3 pour le label "Total"
    sheetSe.mergeCells(`A${totalRow.number}:C${totalRow.number}`);

    // Format numérique pour les montants
    sheetSe.getColumn(4).numFmt = '#,##0.00';
    sheetSe.getColumn(5).numFmt = '#,##0.00';
    sheetSe.getColumn(6).numFmt = '#,##0.00';
    sheetSe.getColumn(9).numFmt = '#,##0.00';
    sheetSe.getColumn(10).numFmt = '#,##0.00';
    sheetSe.getColumn(11).numFmt = '#,##0.00';
};

const exportNeToExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin) => {
    const ne = await recupTableau.recupNE(id_compte, id_dossier, id_exercice);

    // Feuille NE avec nom court
    const sheetNe = workbook.addWorksheet('Notes explicatives');
    // sheetNe.views = [{ state: 'frozen', ySplit: 1 }];

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes avec alignement par défaut
    sheetNe.columns = [
        { header: 'Tableau', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Note', width: 23, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Commentaires', width: 100, height: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
    ];

    generateTitle(sheetNe, 'Notes explicatives', dossier, compte, date_debut, date_fin, 'C');

    sheetNe.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    // Style de l'entête
    const headerRow = sheetNe.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A5276' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Ajout des lignes
    ne.forEach(row => {
        const newRow = sheetNe.addRow([
            row.tableau || '',
            row.ref_note || '',
            row.commentaires || '',
        ]);
    });
};

module.exports = {
    exportBilanToExcel,
    exportCrnToExcel,
    exportCrfToExcel,
    exportTftdToExcel,
    exportTftiToExcel,
    exportEvcpToExcel,
    exportDrfToExcel,
    exportBhiapcToExcel,
    exportMpToExcel,
    exportDaToExcel,
    exportDpToExcel,
    exportEiafncToExcel,
    exportSadToExcel,
    exportSdrToExcel,
    exportSeToExcel,
    exportNeToExcel
}