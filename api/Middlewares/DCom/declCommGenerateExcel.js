const db = require("../../Models");
require('dotenv').config();
const path = require('path');

const droitcommas = db.droitcommas;
const droitcommbs = db.droitcommbs;
const etatsplp = db.etatsplp;
const dossierplancomptable = db.dossierplancomptable;

const logoPath = path.join(__dirname, `../../public/logo/${process.env.LOGO_EXPORT}`);

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

const getDroitCommData = async (id_compte, id_dossier, id_exercice, id_etat) => {
    if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(id_etat)) {
        const data = await droitcommas.findAll({
            where: {
                id_dossier,
                id_exercice,
                id_compte,
                type: id_etat,
            },
            include: [
                {
                    model: dossierplancomptable,
                    attributes: ['compte']
                }
            ],
            order: [['id', 'ASC'], ['typeTier', 'ASC']],
        })
        const mappedData = data.map((val) => {
            const { dossierplancomptable, ...rest } = val.toJSON();
            return {
                ...rest,
                compte: dossierplancomptable?.compte || null,
            };
        })
        return mappedData;
    } else if (['MV', 'PSV', 'PL'].includes(id_etat)) {
        const data = await droitcommbs.findAll({
            where: {
                id_dossier,
                id_exercice,
                id_compte,
                type: id_etat,
            },
            include: [
                {
                    model: dossierplancomptable,
                    attributes: ['compte']
                }
            ],
            order: [['id', 'ASC'], ['typeTier', 'ASC']],
        })
        const mappedData = data.map((val) => {
            const { dossierplancomptable, ...rest } = val.toJSON();
            return {
                ...rest,
                compte: dossierplancomptable?.compte || null,
            };
        })
        return mappedData;
    } else {
        return await etatsplp.findAll({
            where: {
                id_dossier,
                id_exercice,
                id_compte
            },
            order: [['id', 'ASC']],
        })
    }
}

const combineByIdNumcpt = (data) => {
    const map = new Map();

    data.forEach(item => {
        const key = item.id_numcpt;
        if (!map.has(key)) {
            map.set(key, { ...item });
        } else {
            map.get(key).comptabilisees += item.comptabilisees;
            map.get(key).versees += item.versees;
            map.get(key).montanth_tva += item.montanth_tva;
        }
    });

    return Array.from(map.values());
};

exports.exportDroitCommasExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin, id_etat) => {
    const data = await getDroitCommData(id_compte, id_dossier, id_exercice, id_etat);
    const dataCombined = combineByIdNumcpt(data);

    const sheetDroitCommas = workbook.addWorksheet(`${id_etat}`);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetDroitCommas.columns = [
        { header: 'Compte', width: 45, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'NIF', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Stat', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'CIN', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'NIF repr', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Raison sociale', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Adresse', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Ville', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Ex-Province', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Comptabilisés', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Versés', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
    ];

    generateTitle(sheetDroitCommas, `Droit de communication : ${id_etat}`, dossier, compte, date_debut, date_fin, 'K');

    sheetDroitCommas.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerRow = sheetDroitCommas.getRow(4);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let totalComptabilises = 0;
    let totalVerses = 0;

    dataCombined.forEach(row => {
        totalComptabilises += parseFloat(row.comptabilisees) || 0;
        totalVerses += parseFloat(row.versees) || 0;
        sheetDroitCommas.addRow([
            row.compte || '',
            row.nif || '',
            row.num_stat || '',
            row.cin || '',
            row.nif_representaires || '',
            row.raison_sociale || '',
            row.adresse || '',
            row.ville || '',
            row.ex_province || '',
            Number(row.comptabilisees) || 0,
            Number(row.versees) || 0
        ]);
    });

    // Ligne Total
    const totalRow = sheetDroitCommas.addRow([
        'Total',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        Number(totalComptabilises) || 0,
        Number(totalVerses) || 0
    ]);

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

    sheetDroitCommas.mergeCells(`A${totalRow.number}:H${totalRow.number}`);

    sheetDroitCommas.getColumn(10).numFmt = '#,##0.00';
    sheetDroitCommas.getColumn(11).numFmt = '#,##0.00';
}

exports.exportDroitCommbsExcel = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin, id_etat) => {
    const data = await getDroitCommData(id_compte, id_dossier, id_exercice, id_etat);
    const dataCombined = combineByIdNumcpt(data);

    const sheetDroitCommbs = workbook.addWorksheet(`${id_etat}`);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetDroitCommbs.columns = [
        { header: 'Compte', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'NIF', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Stat', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'CIN', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'NIF repr', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Raison sociale', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Adresse', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Ville', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Ex-Province', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Mode de payement', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Montant HT', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
    ];

    generateTitle(sheetDroitCommbs, `Droit de communication : ${id_etat}`, dossier, compte, date_debut, date_fin, 'K');

    sheetDroitCommbs.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerRow = sheetDroitCommbs.getRow(4);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let totalMontantHt = 0;

    dataCombined.forEach(row => {
        totalMontantHt += parseFloat(row.montanth_tva) || 0;
        sheetDroitCommbs.addRow([
            row.compte || '',
            row.nif || '',
            row.num_stat || '',
            row.cin || '',
            row.nif_representaires || '',
            row.raison_sociale || '',
            row.adresse || '',
            row.ville || '',
            row.ex_province || '',
            row.mode_payement,
            Number(row.montanth_tva) || 0
        ]);
    });

    // Ligne Total
    const totalRow = sheetDroitCommbs.addRow([
        'Total',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        Number(totalMontantHt) || 0
    ]);

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

    sheetDroitCommbs.mergeCells(`A${totalRow.number}:H${totalRow.number}`);

    sheetDroitCommbs.getColumn(11).numFmt = '#,##0.00'
}

exports.exportDroitCommPlp = async (id_compte, id_dossier, id_exercice, workbook, dossier, compte, date_debut, date_fin, id_etat) => {
    const data = await getDroitCommData(id_compte, id_dossier, id_exercice, id_etat);
    const sheetDroitCommPlp = workbook.addWorksheet(`${id_etat}`);

    const logoId = workbook.addImage({
        filename: logoPath,
        extension: 'png',
    });

    sheetDroitCommPlp.columns = [
        { header: 'Code', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Nature', width: 50, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Unité', width: 20, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
        { header: 'Commercant quantité', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Commercant valeur', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Producteur quantité', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Producteur valeur', width: 20, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
    ];

    generateTitle(sheetDroitCommPlp, `Droit de communication : ${id_etat}`, dossier, compte, date_debut, date_fin, 'G');

    sheetDroitCommPlp.addImage(logoId, {
        tl: { x: 10, y: 5 },
        ext: { width: 67, height: 67 },
        editAs: 'absolute',
    });

    const headerRow = sheetDroitCommPlp.getRow(4);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let totalValCommercant = 0;
    let totalValProducteur = 0;

    data.forEach(row => {
        totalValCommercant += parseFloat(row.commercant_valeur) || 0;
        totalValProducteur += parseFloat(row.producteur_valeur) || 0;
        sheetDroitCommPlp.addRow([
            row.code_cn || '',
            row.nature_produit || '',
            row.unite_quantite || '',
            Number(row.commercant_quantite) || 0,
            Number(row.commercant_valeur) || 0,
            Number(row.producteur_quantite) || 0,
            Number(row.producteur_valeur) || 0,
        ]);
    });

    // Ligne Total
    const totalRow = sheetDroitCommPlp.addRow([
        'Total',
        '',
        '',
        '',
        Number(totalValCommercant) || 0,
        '',
        Number(totalValProducteur) || 0
    ]);

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

    sheetDroitCommPlp.mergeCells(`A${totalRow.number}:D${totalRow.number}`);

    sheetDroitCommPlp.getColumn(4).numFmt = '#,##0.00';
    sheetDroitCommPlp.getColumn(5).numFmt = '#,##0.00';
    sheetDroitCommPlp.getColumn(6).numFmt = '#,##0.00';
    sheetDroitCommPlp.getColumn(7).numFmt = '#,##0.00';
}