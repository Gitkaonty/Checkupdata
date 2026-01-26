const db = require("../../Models");
require('dotenv').config();
const { Op } = require('sequelize');

const dossierplancomptable = db.dossierplancomptable;
const balances = db.balances;
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const balanceAnalytiques = db.balanceAnalytiques;
const caSections = db.caSections;
const caAxes = db.caAxes;

const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const { generateBalanceContent } = require('../../Middlewares/Balance/BalanceGeneratePdf');
const { exportBalanceTableExcel } = require('../../Middlewares/Balance/BalanceGenerateExcel');

const fonctionUpdateSoldAnalytique = require('../../Middlewares/UpdateSolde/updateBalanceAnalytique');
const createAnalytiqueIfNotExist = fonctionUpdateSoldAnalytique.createAnalytiqueIfNotExist;

balances.belongsTo(dossierplancomptable, { as: 'compteLibelle', foreignKey: 'id_numcompte', targetKey: 'id' });
balances.belongsTo(dossierplancomptable, { as: 'compteCentralisation', foreignKey: 'id_numcomptecentr', targetKey: 'id' });

const recupBalance = async (req, res) => {
    try {
        const { centraliser, unSolded, movmentedCpt, compteId, fileId, exerciceId, type } = req.body || {};

        const cId = Number(compteId);
        const fId = Number(fileId);
        const eId = Number(exerciceId);

        if (!cId || !fId || !eId) {
            return res.json({ state: false, msg: 'Paramètres manquants pour la récupération de la balance.' });
        }

        let baseAUXFilter = {};

        if (type === 1) {
            baseAUXFilter = {
                baseaux: { [Op.like]: '401%' }
            };
        }

        if (type === 2) {
            baseAUXFilter = {
                baseaux: { [Op.like]: '411%' }
            };
        }

        const listeBalance = await balances.findAll({
            where: {
                id_compte: cId,
                id_dossier: fId,
                id_exercice: eId,
                valeur: { [Op.gt]: unSolded ? 0 : -1 },
                [Op.or]: [
                    { mvtdebit: { [Op.gt]: movmentedCpt ? 0 : -1 } },
                    { mvtcredit: { [Op.gt]: movmentedCpt ? 0 : -1 } }
                ]
            },
            include: [
                {
                    model: dossierplancomptable,
                    as: 'compteLibelle',
                    attributes: [
                        ['compte', 'compte'],
                        ['libelle', 'libelle'],
                        ['nature', 'nature'],
                        ['baseaux', 'baseaux']
                    ],
                    required: true,
                    where: {
                        id_compte: cId,
                        id_dossier: fId,
                        nature: { [Op.ne]: centraliser ? 'Aux' : 'Collectif' },
                        ...baseAUXFilter
                    }
                },
            ],
            raw: true,
            order: [
                [{ model: dossierplancomptable, as: 'compteLibelle' }, 'compte', 'ASC']
            ]
        })

        let resData = {
            state: true,
            list: listeBalance || []
        };

        return res.json(resData);

    } catch (error) {
        console.log(error);
        return res.json({ state: false, msg: "Erreur interne" });
    }
};

const recupBalanceFromJournal = async (req, res) => {
    try {
        const {
            compteId,
            fileId,
            exerciceId,
            centraliser = false,
            unSolded = false,
            movmentedCpt = false,
            type = null
        } = req.body;

        if (!compteId) {
            return res.json({ state: false, msg: 'Compte vide' })
        }
        if (!fileId) {
            return res.json({ state: false, msg: 'Dossier vide' })
        }
        if (!exerciceId) {
            return res.json({ state: false, msg: 'Exercice vide' })
        }

        const rows = await db.sequelize.query(
            `
            SELECT
                ${centraliser ? 'J.COMPTEGEN' : 'J.COMPTEAUX'} AS COMPTE,
                ${centraliser ? 'MAX(J.LIBELLECOMPTE)' : 'MAX(J.LIBELLEAUX)'} AS LIBELLE,
                SUM(J.DEBIT) AS MVMDEBIT,
                SUM(J.CREDIT) AS MVMCREDIT,
                GREATEST(SUM(J.DEBIT) - SUM(J.CREDIT), 0) AS SOLDEDEBIT,
                GREATEST(SUM(J.CREDIT) - SUM(J.DEBIT), 0) AS SOLDECREDIT
            FROM
                JOURNALS J
            WHERE
                J.ID_DOSSIER = :id_dossier
                AND J.ID_EXERCICE = :id_exercice
                AND J.ID_COMPTE = :id_compte
                AND (
                    :type = 0
                    OR (:type = 1 AND J.COMPTEGEN LIKE '401%')
                    OR (:type = 2 AND J.COMPTEGEN LIKE '411%')
                )
            GROUP BY
                ${centraliser ? 'J.COMPTEGEN' : 'J.COMPTEAUX'}
            HAVING
                (:unSolded = 0 OR ABS(SUM(J.DEBIT) - SUM(J.CREDIT)) > 0)
                AND (:movmentedCpt = 0 OR SUM(J.DEBIT) > 0 OR SUM(J.CREDIT) > 0)
            ORDER BY
                ${centraliser ? 'J.COMPTEGEN' : 'J.COMPTEAUX'} ASC
            `,
            {
                replacements: {
                    id_dossier: Number(fileId),
                    id_compte: Number(compteId),
                    id_exercice: Number(exerciceId),
                    unSolded: unSolded ? 1 : 0,
                    movmentedCpt: movmentedCpt ? 1 : 0,
                    type: Number(type)
                },
                type: db.Sequelize.QueryTypes.SELECT
            });

        return res.json({ state: true, list: rows, message: 'Balance générale récupérée avec succès' });

    } catch (error) {
        console.error(error);
        return res.json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
};

const recupBalanceAnalytiqueFromJournal = async (req, res) => {
    try {
        const {
            compteId,
            fileId,
            exerciceId,
            centraliser = false,
            unSolded = false,
            movmentedCpt = false,
            axeId,
            sectionId
        } = req.body;

        if (!compteId) return res.json({ state: false, msg: 'Compte vide' });
        if (!fileId) return res.json({ state: false, msg: 'Dossier vide' });
        if (!exerciceId) return res.json({ state: false, msg: 'Exercice vide' });
        if (!axeId) return res.json({ state: true, list: [], msg: 'Axe vide' });
        if (!sectionId || sectionId.length === 0) return res.json({ state: true, list: [], msg: 'Section vide' });

        const rows = await db.sequelize.query(
            `
            SELECT
                ${centraliser ? 'J.COMPTEGEN' : 'J.COMPTEAUX'} AS COMPTE,
                ${centraliser ? 'MAX(J.LIBELLECOMPTE)' : 'MAX(J.LIBELLEAUX)'} AS LIBELLE,
                SUM(A.DEBIT) AS MVMDEBIT,
                SUM(A.CREDIT) AS MVMCREDIT,
                GREATEST(SUM(A.DEBIT) - SUM(A.CREDIT), 0) AS SOLDEDEBIT,
                GREATEST(SUM(A.CREDIT) - SUM(A.DEBIT), 0) AS SOLDECREDIT
            FROM
                ANALYTIQUES A
                JOIN JOURNALS J ON A.ID_LIGNE_ECRITURE = J.ID
            WHERE
                A.ID_COMPTE = :id_compte
                AND A.ID_EXERCICE = :id_exercice
                AND A.ID_DOSSIER = :id_dossier
                AND A.ID_AXE = :id_axe
                AND A.ID_SECTION IN (:id_sections)
                AND J.ID_COMPTE = :id_compte
                AND J.ID_DOSSIER = :id_dossier
                AND J.ID_EXERCICE = :id_exercice
                AND ${centraliser ? "J.COMPTEGEN ~ '^(6|7)'" : "J.COMPTEAUX ~ '^(6|7)'"}

            GROUP BY
                ${centraliser ? 'J.COMPTEGEN' : 'J.COMPTEAUX'}
            HAVING 
                (:unSolded = 0 OR ABS(SUM(A.DEBIT) - SUM(A.CREDIT)) > 0)
                AND (:movmentedCpt = 0 OR SUM(A.DEBIT) > 0 OR SUM(A.CREDIT) > 0)
            ORDER BY
                ${centraliser ? 'J.COMPTEGEN' : 'J.COMPTEAUX'} ASC
            `,
            {
                replacements: {
                    id_dossier: Number(fileId),
                    id_exercice: Number(exerciceId),
                    id_compte: Number(compteId),
                    unSolded: unSolded ? 1 : 0,
                    movmentedCpt: movmentedCpt ? 1 : 0,
                    id_axe: axeId,
                    id_sections: sectionId
                },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        return res.json({ state: true, list: rows, msg: 'Balance analytique récupérée avec succès' });

    } catch (error) {
        console.error(error);
        return res.json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
}

const recupBalanceCa = async (req, res) => {
    const { fileId, exerciceId, compteId, id_axes, id_sections, centraliser, unSolded, movmentedCpt } = req.body;

    const sectionData = await caSections.findAll({
        where: {
            id_axe: id_axes
        }
    })

    const mappedSectionsIds = sectionData.map(val => Number(val.id));

    const sectionsIds = !id_sections || id_sections.length === 0 ? mappedSectionsIds : id_sections;

    const balanceAnalytique = await balanceAnalytiques.findAll({
        where: {
            id_dossier: Number(fileId),
            id_exercice: Number(exerciceId),
            id_compte: Number(compteId),
            id_axe: id_axes,
            id_section: { [Op.in]: sectionsIds },
            valeuranalytique: { [Op.gt]: unSolded ? 0 : -1 },
            [Op.or]: [
                { mvtdebitanalytique: { [Op.gt]: movmentedCpt ? 0 : -1 } },
                { mvtcreditanalytique: { [Op.gt]: movmentedCpt ? 0 : -1 } }
            ]
        },
        include: [
            { model: caAxes },
            { model: caSections },
            {
                model: dossierplancomptable,
                as: 'compteLibelle',
                attributes: [
                    ['compte', 'compte'],
                    ['libelle', 'libelle'],
                    ['nature', 'nature'],
                    ['baseaux', 'baseaux']
                ],
                required: true,
                where: {
                    id_dossier: Number(fileId),
                    id_compte: Number(compteId),
                    nature: { [Op.ne]: centraliser ? 'Aux' : 'Collectif' },
                }
            },
        ],
        order: [
            [{ model: dossierplancomptable, as: 'compteLibelle' }, 'compte', 'ASC']
        ]
    })

    const balanceAnalytiqueMapped = balanceAnalytique.map(val => {
        const codeAxe = val.caax ? val.caax.code : null;
        const section = val.casection ? val.casection.section : null;

        const compte = val.compteLibelle ? val.compteLibelle.compte : null;

        const libelle = `${codeAxe ?? ""} : ${section ?? ""}`;

        return {
            'compteLibelle.libelle': libelle,
            'compteLibelle.compte': compte,
            mvtdebitanalytique: val.mvtdebitanalytique,
            mvtcreditanalytique: val.mvtcreditanalytique,
            soldedebitanalytique: val.soldedebitanalytique,
            soldecreditanalytique: val.soldecreditanalytique,
            valeuranalytique: val.valeuranalytique
        }
    })

    return res.json({
        state: true,
        list: balanceAnalytiqueMapped
    });
};

const actualizeBalance = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, type, id_axe, id_sections } = req.body;
        if (type === 3) {
            await createAnalytiqueIfNotExist(id_compte, id_dossier, id_exercice);
            return res.json({ state: true, message: "Balance mise à jour avec succès" })
        }
    } catch (error) {
        console.log(error);
        return res.json({ state: false, message: "Erreur interne" });
    }
}

module.exports = {
    recupBalanceFromJournal,
    recupBalanceAnalytiqueFromJournal,
    recupBalance,
    exportPdf: async (req, res) => {
        try {
            const { centraliser = false, unSolded = false, movmentedCpt = false, compteId, fileId, exerciceId, data } = req.body || {};

            if (!compteId || !fileId || !exerciceId) {
                return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
            }

            const dossier = await dossiers.findByPk(fileId);
            const exercice = await exercices.findByPk(exerciceId);
            const compte = await userscomptes.findByPk(compteId, { attributes: ['id', 'nom'], raw: true });

            const { buildTable, list } = await generateBalanceContent(compteId, fileId, exerciceId, centraliser, unSolded, movmentedCpt, data);
            if (!list || list.length === 0) {
                return res.status(404).json({ state: false, msg: 'Aucune donnée de balance.' });
            }

            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return String(dateString);
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            };

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
                pageOrientation: 'landscape',
                pageMargins: [10, 40, 10, 40],
                defaultStyle: { font: 'Helvetica', fontSize: 8 },
                content: [
                    { text: 'BALANCE', style: 'header', alignment: 'center', margin: [0, 0, 0, 15] },
                    {
                        text: `Dossier: ${dossier?.dossier || ''}`, alignment: 'center',
                        style: 'subheader', margin: [0, 0, 0, 20]
                    },
                    {
                        text: `Période du ${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`,
                        alignment: 'left',
                        style: 'subheader2', margin: [0, 0, 0, 20]
                    },
                    {
                        ...buildTable(list)[0],
                        layout: {
                            hLineWidth: () => 0,
                            vLineWidth: () => 0,
                            paddingTop: () => 4,
                            paddingBottom: () => 4
                        }
                    }
                ],
                styles: {
                    header: { fontSize: 18, bold: true, font: 'Helvetica' },
                    subheader: { fontSize: 18, bold: true, font: 'Helvetica' },
                    subheader2: { fontSize: 12, bold: true, font: 'Helvetica' },
                    tableHeader: { bold: true, fontSize: 7, color: 'white', fillColor: '#1A5276', alignment: 'center', font: 'Helvetica' }
                }
            };

            const printer = new PdfPrinter(fonts);
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Balance_${fileId}_${exerciceId}.pdf`);
            pdfDoc.pipe(res);
            pdfDoc.end();
        } catch (error) {
            console.error('[BALANCE][PDF] error:', error);
            return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
        }
    },
    exportExcel: async (req, res) => {
        try {
            const { centraliser = false, unSolded = false, movmentedCpt = false, compteId, fileId, exerciceId, data } = req.body || {};
            if (!compteId || !fileId || !exerciceId) {
                return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
            }

            const dossier = await dossiers.findByPk(fileId);
            const exercice = await exercices.findByPk(exerciceId);
            const compte = await userscomptes.findByPk(compteId, { attributes: ['id', 'nom'], raw: true });

            const workbook = new ExcelJS.Workbook();
            await exportBalanceTableExcel(compteId, fileId, exerciceId, centraliser, unSolded, movmentedCpt, workbook, dossier?.dossier, compte?.nom, exercice?.date_debut, exercice?.date_fin, data);
            workbook.views = [{ activeTab: 0 }];

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Balance_${fileId}_${exerciceId}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('[BALANCE][EXCEL] error:', error);
            return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
        }
    },
    recupBalanceCa,
    actualizeBalance
}