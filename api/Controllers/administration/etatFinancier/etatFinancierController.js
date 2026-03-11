const db = require("../../../Models");
const { Op } = require('sequelize');
const PdfPrinter = require('pdfmake');
const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const fonctionUpdateBalanceSold = require('../../../Middlewares/UpdateSolde/updateBalanceSold');
const fonctionUpdateRubriqueExterne = require('../../../Middlewares/EtatFinanciere/updateRubrique');

const etatFinancierGeneratePdf = require('../../../Middlewares/EtatFinanciere/adminEtatFinanciereGeneratePDF');
const etatFinancierGenerateExcel = require('../../../Middlewares/EtatFinanciere/adminEtatFinancierGenerateExcel');

const fonctionUpdateSoldeEtatFinancier = require('../../../Middlewares/EtatFinanciere/updateSoldeEtatFinancier');
const updateSolde = fonctionUpdateSoldeEtatFinancier.updateSoldeEtatFinancier;
const totalRubriqueExterneEVCP = fonctionUpdateSoldeEtatFinancier.totalRubriqueExterneEVCP;

const recupEtatFinancier = require('../../../Middlewares/Administration/EtatFinancier');
const getEtatFinancierComplet = recupEtatFinancier.getEtatFinancierComplet;
const getDetailLigneEtatFinancier = recupEtatFinancier.getDetailLigneEtatFinancier;
const getSigComplet = recupEtatFinancier.getSigComplet;

const rubriquesExternes = db.rubriquesExternes;
const dossierplancomptableModel = db.dossierplancomptable;
const compteRubriquesExternes = db.compteRubriquesExternes;
const balances = db.balances;
const ajustementExternes = db.ajustementExternes;
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const etatsEtatFinancier = db.etatsEtatFinancier;
const rubriqueExternesEvcp = db.rubriqueExternesEvcp;
const periodes = db.periodes;

const generateBilanContent = etatFinancierGeneratePdf.generateBilanContent;
const generateBilanActifContent = etatFinancierGeneratePdf.generateBilanActifContent;
const generateBilanPassifContent = etatFinancierGeneratePdf.generateBilanPassifContent;
const generateCrnContent = etatFinancierGeneratePdf.generateCrnContent;
const generateCrfContent = etatFinancierGeneratePdf.generateCrfContent;
const generateTftdContent = etatFinancierGeneratePdf.generateTftdContent;
const generateTftiContent = etatFinancierGeneratePdf.generateTftiContent;
const generateEvcpContent = etatFinancierGeneratePdf.generateEvcpContent;
const generateSigContent = etatFinancierGeneratePdf.generateSigContent;

const exportBilanToExcel = etatFinancierGenerateExcel.exportBilanToExcel;
const exportCrnToExcel = etatFinancierGenerateExcel.exportCrnToExcel;
const exportCrfToExcel = etatFinancierGenerateExcel.exportCrfToExcel;
const exportTftiToExcel = etatFinancierGenerateExcel.exportTftiToExcel;
const exportTftdToExcel = etatFinancierGenerateExcel.exportTftdToExcel;
const exportEvcpToExcel = etatFinancierGenerateExcel.exportEvcpToExcel;
const exportSigToExcel = etatFinancierGenerateExcel.exportSigToExcel;

const columnsMapping = {
    BILAN_ACTIF: [
        { col: 'rubriquebilanactifbrutexterne', nature: 'BRUT' },
        { col: 'rubriquebilanactifamortexterne', nature: 'AMORT' }
    ],
    BILAN_PASSIF: [
        { col: 'rubriquebilanpassifbrutexterne', nature: 'BRUT' }
    ],
    CRN: [
        { col: 'rubriquecrnexterne', nature: 'BRUT' }
    ],
    CRF: [
        { col: 'rubriquecrfexterne', nature: 'BRUT' }
    ],
    TFTD: [
        { col: 'rubriquetftdexterne', nature: 'BRUT' }
    ],
    TFTI: [
        { col: 'rubriquetftiexterne', nature: 'BRUT' }
    ],
    SIG: [
        { col: 'rubriquesig', nature: 'BRUT' }
    ]
};

const logoPath = path.join(__dirname, `../../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [annee, mois, jour] = dateStr.split('-');
    return `${jour.padStart(2, '0')}-${mois.padStart(2, '0')}-${annee}`;
};

const infoBlock = (dossier, compte, exercice, texteDatePeriode) => ([
    { text: `Dossier : ${dossier?.dossier}`, style: 'subTitle', margin: [0, 0, 0, 5] },
    { text: texteDatePeriode, style: 'subTitle1', margin: [0, 0, 0, 10] }
]);

const generateTableauAuto = async (id_dossier, id_exercice, id_compte, id_etat) => {
    try {

        if (!id_dossier || !id_exercice || !id_compte || !id_etat) {
            throw new Error("Paramètres manquants pour la génération du : ", id_etat);
        }

        try {
            await fonctionUpdateBalanceSold.updateSold(id_compte, id_dossier, id_exercice, [], true);
            await fonctionUpdateRubriqueExterne.updateRubrique(id_compte, id_dossier, id_exercice, id_etat);

        } catch (err) {
            throw new Error(`Erreur lors de la mise à jour des soldes ou des rubriques : ${err.message}`);
        }

        await updateSolde(id_dossier, id_compte, id_exercice, id_etat);

        return true;
    } catch (error) {
        console.error("Erreur lors de la génération automatique :", error);
        throw error;
    }
}

const generatePdfBuffer = (printer, docDefinition) => {
    return new Promise((resolve, reject) => {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];

        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', err => reject(err));

        pdfDoc.end();
    });
};

exports.getEtatFinancierGlobal = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        const compteRubriquesData = await compteRubriquesExternes.findAll({
            where: {
                id_dossier,
                id_exercice,
                id_compte,
                active: true
            },
            attributes: [
                'id_rubrique',
                'id_etat',
                'compte',
                'equation'
            ],
            raw: true
        });

        const compteRubriqueMap = new Map();

        for (const cr of compteRubriquesData) {
            compteRubriqueMap.set(
                `${cr.id_rubrique}_${cr.id_etat}_${cr.compte}`,
                cr.equation
            );
        }

        const rubriqueExterneData = (await rubriquesExternes.findAll({
            where: { id_dossier, id_compte, id_exercice, active: true },
            include: [
                {
                    model: ajustementExternes,
                    as: 'ajusts',
                    attributes: ['id', 'id_compte', 'id_dossier', 'id_exercice', 'id_etat', 'id_rubrique', 'nature', 'motif', 'montant'],
                    required: false,
                    where: {
                        id_dossier,
                        id_exercice,
                        id_compte
                    }
                },
            ],
            order: [['ordre', 'ASC']]
        })).map(r => {
            const rub = r.toJSON();

            rub.ajusts = rub.ajusts.filter(a => a.id_etat === rub.id_etat);
            rub.id = Number(rub.id);
            rub.id_compte = Number(rub.id_compte);
            rub.id_dossier = Number(rub.id_dossier);
            rub.id_exercice = Number(rub.id_exercice);
            return rub;
        });

        const rubriqueExterneEvcpData = (await rubriqueExternesEvcp.findAll({
            where: {
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice),
                id_compte: Number(id_compte)
            },
            include: [
                {
                    model: ajustementExternes,
                    as: 'ajusts',
                    attributes: ['id', 'id_compte', 'id_dossier', 'id_exercice', 'id_etat', 'id_rubrique', 'nature', 'motif', 'montant'],
                    required: false,
                    where: {
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice),
                        id_compte: Number(id_compte)
                    }
                },
            ],
            order: [['ordre', 'ASC']]
        })).map(r => {
            const rub = r.toJSON();

            rub.ajusts = rub.ajusts.filter(a => a.id_etat === rub.id_etat);
            rub.id = Number(rub.id);
            rub.id_compte = Number(rub.id_compte);
            rub.id_dossier = Number(rub.id_dossier);
            rub.id_exercice = Number(rub.id_exercice);
            return rub;
        });

        const balancesData = await balances.findAll({
            where: { id_dossier, id_compte, id_exercice },
            raw: true
        });

        const allRubriques = [...rubriqueExterneData, ...rubriqueExterneEvcpData];

        const rubriqueMap = new Map();
        allRubriques.forEach(r => {
            rubriqueMap.set(`${r.id_rubrique}_${r.id_etat}`, r);
        });

        for (const r of allRubriques) {
            const mapping = columnsMapping[r.id_etat];
            if (!mapping) {
                r.infosCompte = [];
                continue;
            }

            const comptesTrouvés = [];

            for (const { col, nature } of mapping) {
                const matches = balancesData.filter(b => b[col] === r.id_rubrique);

                if (matches.length) {
                    const idsNumComptes = [...new Set(matches.map(m => Number(m.id_numcompte)))];

                    const planComptableData = await dossierplancomptableModel.findAll({
                        where: { id: { [Op.in]: idsNumComptes } },
                        attributes: ['id', 'compte', 'libelle'],
                        raw: true
                    });

                    const comptesMap = Object.fromEntries(
                        planComptableData.map(p => [p.id, p])
                    );

                    const comptesValides = matches
                        .filter(b => r.id_etat === 'TFTD' ? Number(b.soldedebittreso) !== 0 || Number(b.soldecredittreso) !== 0 : Number(b.soldedebit) !== 0 || Number(b.soldecredit) !== 0)
                        .map(b => {
                            const compteNumero = comptesMap[b.id_numcompte]?.compte || '';

                            const regle = compteRubriquesData.find(cr =>
                                cr.id_rubrique === b[col] &&
                                cr.id_etat === r.id_etat &&
                                compteNumero.startsWith(cr.compte)
                            );

                            const equation =
                                regle?.equation?.trim().toUpperCase() || 'ADDITIF';

                            const signe = equation === 'SOUSTRACTIF' ? -1 : 1;

                            const debitBrut = r.id_etat === 'TFTD'
                                ? Number(b.soldedebittreso)
                                : Number(b.soldedebit);

                            const creditBrut = r.id_etat === 'TFTD'
                                ? Number(b.soldecredittreso)
                                : Number(b.soldecredit);

                            return {
                                compte: comptesMap[b.id_numcompte]?.compte || null,
                                libelle: comptesMap[b.id_numcompte]?.libelle || null,
                                soldedebit: Number((debitBrut * signe).toFixed(2)),
                                soldecredit: Number((creditBrut * signe).toFixed(2)),
                                nature,
                                equation
                            };
                        });

                    comptesTrouvés.push(...comptesValides);
                }
            }

            r.infosCompte = comptesTrouvés;
        }

        const regrouped = {
            BILAN_ACTIF: allRubriques.filter(el => el.id_etat === "BILAN_ACTIF"),
            BILAN_PASSIF: allRubriques.filter(el => el.id_etat === "BILAN_PASSIF"),
            CRN: allRubriques.filter(el => el.id_etat === "CRN"),
            CRF: allRubriques.filter(el => el.id_etat === "CRF"),
            TFTD: allRubriques.filter(el => el.id_etat === "TFTD"),
            TFTI: allRubriques.filter(el => el.id_etat === "TFTI"),
            EVCP: allRubriques.filter(el => el.id_etat === "EVCP"),
            SIG: allRubriques.filter(el => el.id_etat === "SIG")
        };

        return res.json({
            liste: regrouped,
            state: true,
            message: "Récupéré avec succès"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur serveur",
            state: false,
            error: error.message
        });
    }
};

exports.generateTableEtatFinancier = async (req, res) => {
    try {
        const { id_dossier, id_exercice, id_compte } = req.body;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'id_compte manquant' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'id_dossier manquant' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'id_exercice manquant' });
        }

        await totalRubriqueExterneEVCP(id_compte, id_dossier, id_exercice);

        return res.status(200).json({
            state: true,
            message: `Génération du tableau EVCP réussie`,
        });

    } catch (error) {
        console.error("Erreur dans generateTableEtatFinancier:", error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur lors de la génération du tableau de l'état financier",
            error: error.message,
        });
    }
};

exports.addModifyAjustementExterne = async (req, res) => {
    try {
        const {
            id,
            id_compte,
            id_dossier,
            id_exercice,
            id_rubrique,
            id_etat,
            nature,
            motif,
            montant
        } = req.body;

        let resData = {
            state: false,
            msg: 'une erreur est survenue lors du traitement.',
            liste: [],
            etatglobal: [],
            detailAnom: []
        }

        const testIfExist = await ajustementExternes.findAll({
            where:
            {
                id: id,
                id_compte: id_compte,
                id_dossier: id_dossier,
                id_exercice: id_exercice,
                id_etat: id_etat,
                id_rubrique: id_rubrique,
                nature: nature
            }
        });

        if (testIfExist.length === 0) {
            const addAjust = await ajustementExternes.create({
                id_compte: id_compte,
                id_dossier: id_dossier,
                id_exercice: id_exercice,
                id_etat: id_etat,
                id_rubrique: id_rubrique,
                nature: nature,
                motif: motif,
                montant: montant
            });

            if (addAjust) {
                resData.state = true;
                resData.msg = "Traitement effectué avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        } else {
            const ModifyAjust = await ajustementExternes.update(
                {
                    motif: motif,
                    montant: montant
                },
                {
                    where:
                    {
                        id: id,
                        id_compte: id_compte,
                        id_dossier: id_dossier,
                        id_exercice: id_exercice,
                        id_etat: id_etat,
                        id_rubrique: id_rubrique,
                        nature: nature
                    }
                }
            );

            if (ModifyAjust) {
                resData.state = true;
                resData.msg = "Modification effectuée avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        }

        if (id_etat === 'EVCP') {
            await totalRubriqueExterneEVCP(id_compte, id_dossier, id_exercice);
        }

        return res.json(resData);
    } catch (error) {
        console.log(error);
    }
}

exports.getAjustementExterne = async (req, res) => {
    try {
        const { compteId, dossierId, exerciceId, etatId, rubriqueId, nature } = req.query;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
            etatglobal: [],
            detailAnom: []
        }

        const liste = await ajustementExternes.findAll({
            where:
            {
                id_compte: compteId,
                id_dossier: dossierId,
                id_exercice: exerciceId,
                id_etat: etatId,
                id_rubrique: rubriqueId,
                nature: nature
            }
        });

        if (liste) {
            resData.state = true;
            resData.liste = liste;
            resData.msg = 'Traitement terminé avec succès.';
        }

        return res.json(resData);
    } catch (error) {
        console.log(error);
    }
}

exports.deleteAjustementExterne = async (req, res) => {
    try {
        const { id } = req.params;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
        }

        const ajustementDataBeforeDelete = await ajustementExternes.findByPk(id);

        if (!ajustementDataBeforeDelete) {
            resData.msg = 'Aucune ajustement trouvé';
            return res.json(resData);
        }

        const id_compte = Number(ajustementDataBeforeDelete.id_compte);
        const id_exercice = Number(ajustementDataBeforeDelete.id_exercice);
        const id_dossier = Number(ajustementDataBeforeDelete.id_dossier);
        const id_etat = ajustementDataBeforeDelete.id_etat;

        const stateDeleting = await ajustementExternes.destroy({
            where: { id }
        });

        if (id_etat === 'EVCP') {
            await totalRubriqueExterneEVCP(id_compte, id_dossier, id_exercice);
        }

        if (stateDeleting > 0) {
            resData.state = true;
            resData.msg = "Suppression de la ligne effectuée avec succès.";
        }

        return res.json(resData);
    } catch (error) {
        console.log(error);
    }
}

exports.exportEtatFinancierToPdf = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, id_etat, id_periode } = req.params;
        if (!id_dossier || !id_compte || !id_exercice || !id_etat) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }
        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);
        const periode = await periodes.findByPk(id_periode);

        let date_debut_periode, date_fin_periode = null;
        if (periode) {
            date_debut_periode = periode?.date_debut;
            date_fin_periode = periode?.date_fin;
        }

        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };

        const printer = new PdfPrinter(fonts);

        let texteDatePeriode = '';

        if (date_debut_periode && date_fin_periode) {
            texteDatePeriode = `Période du ${formatDate(date_debut_periode)} au ${formatDate(date_fin_periode)}`;
        } else {
            texteDatePeriode = `Période du ${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`
        }

        let docDefinition = {}
        if (id_etat === 'BILAN') {
            const { buildTable, bilanActifData, bilanPassifData } = await generateBilanContent(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
            docDefinition = {
                content: [
                    { text: 'Bilan actif', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(bilanActifData, 'actif'),
                    { text: '', pageBreak: 'before' },
                    { text: 'Bilan passif', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(bilanPassifData, 'passif')
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        } else if (id_etat === 'CRN') {
            const { buildTable, crnData } = await generateCrnContent(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
            docDefinition = {
                content: [
                    { text: 'Compte de résultat par nature', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(crnData)
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        } else if (id_etat === 'CRF') {
            const { buildTable, crfData } = await generateCrfContent(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
            docDefinition = {
                content: [
                    { text: 'Compte de résultat par fonction', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(crfData)
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        } else if (id_etat === 'TFTD') {
            const { buildTable, tftdData } = await generateTftdContent(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
            docDefinition = {
                content: [
                    { text: 'Tableau de flux de trésoreries méthode directe', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(tftdData)
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        } else if (id_etat === 'TFTI') {
            const { buildTable, tftiData } = await generateTftiContent(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
            docDefinition = {
                content: [
                    { text: 'Tableau de flux de trésoreries méthode indirecte', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(tftiData)
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        } else if (id_etat === 'EVCP') {
            const { buildTable, evcpData } = await generateEvcpContent(id_compte, id_dossier, id_exercice);
            docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                content: [
                    { text: 'Etat de variation des capitaux propres', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(evcpData)
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        } else if (id_etat === 'SIG') {
            const { buildTable, sigData } = await generateSigContent(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);
            docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                content: [
                    { text: 'Soldes intermédiaires de géstion', style: 'title' },
                    infoBlock(dossier, compte, exercice, texteDatePeriode),
                    ...buildTable(sigData)
                ],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };
        }
        else {
            return res.status(400).json({ msg: "Type d'état invalide" });
        }
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${id_etat}.pdf"`);
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur génération PDF' });
    }
}

exports.exportEtatFinancierToExcel = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, id_etat, id_periode } = req.params;
        if (!id_dossier || !id_compte || !id_exercice || !id_etat) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }

        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);

        const workbook = new ExcelJS.Workbook();
        if (id_etat === 'BILAN') {
            await exportBilanToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        } else if (id_etat === 'CRN') {
            await exportCrnToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        } else if (id_etat === 'CRF') {
            await exportCrfToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        } else if (id_etat === 'TFTI') {
            await exportTftiToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        } else if (id_etat === 'TFTD') {
            await exportTftdToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        } else if (id_etat === 'EVCP') {
            await exportEvcpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        } else if (id_etat === 'SIG') {
            await exportSigToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        }
        workbook.views = [
            { activeTab: 0 }
        ];
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${id_etat}.xlsx`
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur génération Excel' });
    }
}

exports.exportAllEtatFinancierToExcel = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice } = req.params;
        if (!id_dossier || !id_compte || !id_exercice) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }

        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);

        const workbook = new ExcelJS.Workbook();

        await exportBilanToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        await exportCrnToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        await exportCrfToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        await exportTftdToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        await exportTftiToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
        await exportEvcpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));

        workbook.views = [
            { activeTab: 0 }
        ];
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Etat financier.xlsx`
        );
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur génération Excel' });
    }
}

exports.exportAllEtatFinancierToPdf = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice } = req.params;
        if (!id_dossier || !id_compte || !id_exercice) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }

        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);

        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        const printer = new PdfPrinter(fonts);

        const sections = [
            { generator: generateBilanActifContent, title: 'Bilan Actif', landscape: false },
            { generator: generateBilanPassifContent, title: 'Bilan Passif', landscape: false },
            { generator: generateCrnContent, title: 'Compte de résultat par nature', landscape: false },
            { generator: generateCrfContent, title: 'Compte de résultat par fonction', landscape: false },
            { generator: generateTftdContent, title: 'Tableau de flux de trésoreries méthode directe', landscape: false },
            { generator: generateTftiContent, title: 'Tableau de flux de trésoreries méthode indirecte', landscape: false },
            { generator: generateEvcpContent, title: 'Etat de variation des capitaux propres', landscape: true },
        ];

        const pdfBuffers = [];

        for (let i = 0; i < sections.length; i++) {
            const { generator, title, landscape } = sections[i];
            const { buildTable, ...data } = await generator(id_compte, id_dossier, id_exercice);
            const tableData = Object.values(data).find(v => Array.isArray(v)) || [];

            const content = [
                {
                    text: title,
                    style: 'title',
                },
                infoBlock(dossier, compte, exercice),
                ...(buildTable && tableData.length > 0 ? buildTable(tableData) : [{ text: 'Aucune donnée', italics: true }])
            ];

            const docDefinition = {
                content,
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return [
                            {
                                image: logoImage,
                                width: 50,
                                absolutePosition: { x: 10, y: 10 }
                            }
                        ];
                    }
                    return [];
                },
                pageOrientation: landscape ? 'landscape' : 'portrait',
                styles: {
                    title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] },
                    subTitle1: { fontSize: 9 },
                },
                defaultStyle: { font: 'Helvetica', fontSize: 7 }
            };

            const buffer = await generatePdfBuffer(printer, docDefinition);
            pdfBuffers.push(buffer);
        }

        const mergedPdf = await PDFDocument.create();
        for (const buffer of pdfBuffers) {
            const pdf = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        const finalPdfBytes = await mergedPdf.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="BILAN.pdf"`);
        res.send(Buffer.from(finalPdfBytes));

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur génération PDF' });
    }
}

exports.getVerouillageEtatFinancier = async (req, res) => {
    try {
        const { compteId, fileId, exerciceId } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
        }

        const infosListe = await etatsEtatFinancier.findAll({
            where:
            {
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId
            }
        });

        if (infosListe) {
            resData.state = true;
            resData.liste = infosListe;
            resData.msg = 'Traitement terminé avec succès.';
        }

        return res.json(resData);
    } catch (error) {
        console.log(error);
    }
}

exports.lockEtatFinancier = async (req, res) => {
    try {
        const { compteId, fileId, exerciceId, tableau, verr } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
        }

        const infosUpdate = await etatsEtatFinancier.update(
            {
                valide: verr
            },
            {
                where:
                {
                    id_compte: compteId,
                    id_dossier: fileId,
                    id_exercice: exerciceId,
                    code: tableau,
                }
            }
        );

        if (infosUpdate) {
            resData.state = true;
            resData.msg = 'Traitement terminé avec succès.';
        }

        return res.json(resData);
    } catch (error) {
        console.log(error);
    }
}

exports.getEtatFinancier = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, id_etat, date_debut_periode, date_fin_periode } = req.body;
        // if (!id_etat) {
        //   return res.json({ state: false, message: 'Tableau non trouvé' });
        // }
        if (!id_compte) {
            return res.json({ state: false, message: 'Compte non trouvé' });
        }
        if (!id_dossier) {
            return res.json({ state: false, message: 'Dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.json({ state: false, message: ('Exercice non trouvé') });
        }

        const data = await getEtatFinancierComplet(id_compte, id_dossier, id_exercice, date_debut_periode, date_fin_periode);

        const rubriqueExterneEvcpData = (await rubriqueExternesEvcp.findAll({
            where: {
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice),
                id_compte: Number(id_compte)
            },
            include: [
                {
                    model: ajustementExternes,
                    as: 'ajusts',
                    attributes: ['id', 'id_compte', 'id_dossier', 'id_exercice', 'id_etat', 'id_rubrique', 'nature', 'motif', 'montant'],
                    required: false,
                    where: {
                        id_dossier: Number(id_dossier),
                        id_exercice: Number(id_exercice),
                        id_compte: Number(id_compte)
                    }
                },
            ],
            order: [['ordre', 'ASC']]
        })).map(r => {
            const rub = r.toJSON();

            rub.ajusts = rub.ajusts.filter(a => a.id_etat === rub.id_etat);
            rub.id = Number(rub.id);
            rub.id_compte = Number(rub.id_compte);
            rub.id_dossier = Number(rub.id_dossier);
            rub.id_exercice = Number(rub.id_exercice);
            return rub;
        });

        const regrouped = {
            BILAN_ACTIF: data.filter(el => el.id_etat === 'BILAN_ACTIF'),
            BILAN_PASSIF: data.filter(el => el.id_etat === 'BILAN_PASSIF'),
            CRN: data.filter(el => el.id_etat === 'CRN'),
            CRF: data.filter(el => el.id_etat === 'CRF'),
            TFTD: data.filter(el => el.id_etat === 'TFTD'),
            TFTI: data.filter(el => el.id_etat === 'TFTI'),
            EVCP: rubriqueExterneEvcpData
        }

        return res.json({
            liste: regrouped,
            state: true,
            message: "Récupéré avec succès"
        });

    } catch (error) {
        console.log(error);
    }
}

exports.getSig = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, id_etat, date_debut_periode, date_fin_periode } = req.body;
        // if (!id_etat) {
        //   return res.json({ state: false, message: 'Tableau non trouvé' });
        // }
        if (!id_compte) {
            return res.json({ state: false, message: 'Compte non trouvé' });
        }
        if (!id_dossier) {
            return res.json({ state: false, message: 'Dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.json({ state: false, message: ('Exercice non trouvé') });
        }

        const data = await getSigComplet(id_compte, id_dossier, id_exercice, id_etat, date_debut_periode, date_fin_periode);

        return res.json({
            liste: data,
            state: true,
            message: "Récupéré avec succès"
        });
    } catch (error) {
        console.log(error);
    }
}

exports.getEtatFinancierDetail = async (req, res) => {
    try {
        const { id_etat, id_dossier, id_exercice, id_compte, id_rubrique, subtable, date_debut_periode, date_fin_periode } = req.body;
        if (!id_etat) {
            return res.json({ state: false, message: 'Tableau non trouvé' });
        }
        if (!id_dossier) {
            return res.json({ state: false, message: 'Dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.json({ state: false, message: 'Exercice non trouvé' });
        }
        if (!id_compte) {
            return res.json({ state: false, message: 'Compte non trouvé' });
        }
        if (!id_rubrique) {
            return res.json({ state: false, message: 'Rubrique non trouvé' });
        }
        const data = await getDetailLigneEtatFinancier(id_compte, id_dossier, id_exercice, id_etat, id_rubrique, subtable, date_debut_periode, date_fin_periode);
        return res.json({ state: true, detail: data });
    } catch (error) {
        console.log(error);
    }
}