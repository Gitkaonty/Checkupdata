require('dotenv').config();
const path = require('path');
const db = require('../../Models');
const Irsa = db.irsa;

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

const exportIrsaTableExcel = async (id_compte, id_dossier, id_exercice, mois, annee, workbook, nomDossier, nomCompte, nomMois, dateDebut, dateFin) => {
    // Récupérer les données IRSA
    const irsaData = await Irsa.findAll({
        where: {
            id_compte,
            id_dossier,
            id_exercice,
            mois: Number(mois),
            annee: Number(annee)
        }
    });

    // Charger personnels (matricule -> id_fonction) et fonctions (id -> nom) pour afficher le libellé
    const PersonnelModel = db.Personnel || db.personnel || db.personnels;
    const FonctionModel = db.Fonction || db.fonction || db.fonctions;
    let persByMat = new Map();
    let fonctionById = new Map();
    try {
        if (PersonnelModel && typeof PersonnelModel.findAll === 'function') {
            const personnels = await PersonnelModel.findAll({
                where: { id_compte, id_dossier },
                attributes: ['matricule', 'id_fonction']
            });
            persByMat = new Map(personnels.map(p => [String(p.matricule).trim(), Number(p.id_fonction)]));
        }
        if (FonctionModel && typeof FonctionModel.findAll === 'function') {
            const fonctions = await FonctionModel.findAll({
                where: { id_compte, id_dossier },
                attributes: ['id', 'nom']
            });
            fonctionById = new Map(fonctions.map(f => [Number(f.id), String(f.nom)]));
        }
        try {
            console.log('[IRSA EXCEL] persByMat size:', persByMat.size);
            console.log('[IRSA EXCEL] fonctionById size:', fonctionById.size);
        } catch { }
    } catch (e) {
        console.warn('[IRSA EXCEL] mapping personnels/fonctions failed:', e?.message || e);
    }

    // Créer une nouvelle feuille
    const sheetIrsa = workbook.addWorksheet(`IRSA ${nomMois} ${annee}`);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    // Colonnes IRSA
    sheetIrsa.columns = [
        { header: 'Nom', width: 15 },
        { header: 'Prénom', width: 15 },
        { header: 'CIN', width: 15 },
        { header: 'CNAPS', width: 15 },
        { header: 'Fonction', width: 20 },
        { header: 'Date Entrée', width: 12 },
        { header: 'Date Sortie', width: 12 },
        { header: 'Salaire Base', width: 15 },
        { header: 'Heures Supp', width: 15 },
        { header: 'Prime/Gratification', width: 18 },
        { header: 'Autres', width: 15 },
        { header: 'Salaire Brut', width: 15 },
        { header: 'CNAPS Retenu', width: 15 },
        { header: 'Org. Santé', width: 15 },
        { header: 'Salaire Net', width: 15 },
        { header: 'Autre Déduction', width: 18 },
        { header: 'Montant Imposable', width: 18 },
        { header: 'Impôt Corr.', width: 18 },
        { header: 'Réd. Charge Fam.', width: 20 },
        { header: 'Impôt Dû', width: 15 },
        { header: 'Mois', width: 8 },
        { header: 'Année', width: 8 }
    ];

    // Title row
    sheetIrsa.insertRow(1, ['DÉCLARATION IRSA']);
    sheetIrsa.mergeCells('A1:V1');
    const titre = sheetIrsa.getRow(1);
    titre.font = { bold: true, size: 20 };
    titre.alignment = { horizontal: 'center', vertical: 'middle' };
    titre.height = 25;

    // --- Ligne du sous-titre (centrée seulement pour "Dossier") ---
    sheetIrsa.insertRow(2, [`Dossier : ${nomDossier}`]);
    sheetIrsa.mergeCells('A2:V2');
    const dossierRow = sheetIrsa.getRow(2);
    dossierRow.font = { bold: true, size: 14 };
    dossierRow.alignment = { horizontal: 'center', vertical: 'middle' };
    dossierRow.height = 25;

    // --- Ligne des infos restantes ---
    sheetIrsa.insertRow(3, [
        `Mois et année : ${nomMois} ${annee}\nExercice du : ${dateDebut} au ${dateFin}`
    ]);
    sheetIrsa.mergeCells('A3:V3');
    const sousTitre = sheetIrsa.getRow(3);
    sousTitre.font = { bold: true, size: 12 };
    sousTitre.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    sousTitre.height = 70;

    sheetIrsa.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 60, height: 60 },
        editAs: 'absolute',
    });

    // Header row (row 4) : texte à gauche, montants à droite, dates à gauche
    const headerRow = sheetIrsa.getRow(4);
    headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        if ([1, 2, 3, 4, 5, 6, 7, 21, 22].includes(colNumber)) {
            // Colonnes texte / dates / mois / année
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
            // Colonnes de montants
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
    });

    // Fonction formatage date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    // Totaux
    const totals = Array(13).fill(0); // colonnes de 8 à 20 = 13 totaux

    // Lignes de données
    irsaData.forEach(row => {
        // Résoudre le libellé de la fonction via matricule -> id_fonction -> nom
        const mat = String(row.matricule || '').trim();
        const idFonct = persByMat.get(mat);
        const fonctionLibelle = idFonct != null ? (fonctionById.get(Number(idFonct)) || '') : '';
        try { console.log('[IRSA EXCEL][RESOLVE]', { mat, idFonct, fonctionLibelle }); } catch { }
        const dataRow = sheetIrsa.addRow([
            row.nom || '',
            row.prenom || '',
            row.cin || '',
            row.cnaps || '',
            fonctionLibelle || '',
            formatDate(row.dateEntree),
            formatDate(row.dateSortie),
            parseFloat(row.salaireBase) || 0,
            parseFloat(row.heuresSupp) || 0,
            parseFloat(row.primeGratification) || 0,
            parseFloat(row.autres) || 0,
            parseFloat(row.salaireBrut) || 0,
            parseFloat(row.cnapsRetenu) || 0,
            parseFloat(row.ostie) || 0,
            parseFloat(row.salaireNet) || 0,
            parseFloat(row.autreDeduction) || 0,
            parseFloat(row.montantImposable) || 0,
            parseFloat(row.impotCorrespondant) || 0,
            parseFloat(row.reductionChargeFamille) || 0,
            parseFloat(row.impotDu) || 0,
            row.mois || Number(mois),
            row.annee || Number(annee)
        ]);

        // Cumuler les totaux
        for (let i = 0; i < 13; i++) {
            totals[i] += dataRow.getCell(i + 8).value || 0;
        }

        // Alignement des cellules : texte/dates à gauche, montants à droite
        dataRow.eachCell((cell, colNumber) => {
            if (colNumber >= 8 && colNumber <= 20) {
                // Colonnes montants
                cell.numFmt = '#,##0.00';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            } else {
                // Colonnes texte / dates / mois / année
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
        });
    });

    // Ligne Total
    const totalRow = sheetIrsa.addRow([
        'TOTAL', '', '', '', '', '', '',
        ...totals,
        '', '' // Mois, Année
    ]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF89A8B2' } };
        if (colNumber >= 8 && colNumber <= 20) { // colonnes de montants
            cell.numFmt = '#,##0.00'; // format français
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
    });
    sheetIrsa.mergeCells(`A${totalRow.number}:G${totalRow.number}`);

    return workbook;
};

module.exports = { exportIrsaTableExcel };
