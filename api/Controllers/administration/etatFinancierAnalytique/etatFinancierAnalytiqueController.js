const db = require("../../../Models");
const { Op } = require('sequelize');
const PdfPrinter = require('pdfmake');
const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const rubriquesExternesAnalytiques = db.rubriquesExternesAnalytiques;
const dossierplancomptableModel = db.dossierplancomptable;
const balanceAnalytiques = db.balanceAnalytiques;
const ajustemenExternesAnalytiques = db.ajustemenExternesAnalytiques;
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const etatsEtatFinancierAnalitiques = db.etatsEtatFinancierAnalitiques;
const rubriqueExternesEvcpAnalytiques = db.rubriqueExternesEvcpAnalytiques;
const caAxes = db.caAxes;
const caSections = db.caSections;

const recupEtatFinancierAnalytique = require('../../../Middlewares/Administration/EtatFinancierAnalytique');
const getEtatFinancierAnalytiqueComplet = recupEtatFinancierAnalytique.getEtatFinancierAnalytiqueComplet;
const getDetailLigneEtatFinancierAnalytique = recupEtatFinancierAnalytique.getDetailLigneEtatFinancierAnalytique;

const fonctionUpdateBalanceSoldAnalytique = require('../../../Middlewares/UpdateSolde/updateBalanceAnalytique');
const updateSoldAnalytiqueGlobal = fonctionUpdateBalanceSoldAnalytique.updateSoldAnalytiqueGlobal;

const fonctionCopyRubriqueAnalytique = require('../../../Middlewares/EtatFinancierAnalytique/copyRubriqueExterneAnalytique');
const copyRubriqueExterneAnalytique = fonctionCopyRubriqueAnalytique.copyRubriqueExterneAnalytique;

const fonctionUpdateSoldeEtatFinancierAnalytique = require('../../../Middlewares/EtatFinancierAnalytique/updateSoldeEtatFinancierAnalytique');
const updateSoldeEtatFinancierAnalytique = fonctionUpdateSoldeEtatFinancierAnalytique.updateSoldeEtatFinancierAnalytique;
const totalRubriqueExterneEVCPAnalytique = fonctionUpdateSoldeEtatFinancierAnalytique.totalRubriqueExterneEVCPAnalytique;

const fonctionUpdateRubriquBalanceAnalytique = require('../../../Middlewares/EtatFinancierAnalytique/updateRubriqueAnalytique');
const updateRubriqueAnalytique = fonctionUpdateRubriquBalanceAnalytique.updateRubriqueAnalytique;

const fonctionAjoutEtatAnalytique = require('../../../Middlewares/EtatFinancierAnalytique/etatEtatFinancierAnalytique');
const createEtatsEtatFinancierAnalytiqueIfNotExist = fonctionAjoutEtatAnalytique.createEtatsEtatFinancierAnalytiqueIfNotExist;

const etatFinancierAnalytiqueGeneratePdf = require('../../../Middlewares/EtatFinancierAnalytique/adminEtatFinancierAnalytiqueGeneratePDF');

const generateBilanAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateBilanAnalytiqueContent;
const generateBilanActifAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateBilanActifAnalytiqueContent;
const generateBilanPassifAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateBilanPassifAnalytiqueContent;
const generateCrnAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateCrnAnalytiqueContent;
const generateCrfAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateCrfAnalytiqueContent;
const generateTftdAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateTftdAnalytiqueContent;
const generateTftiAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateTftiAnalytiqueContent;
const generateEvcpAnalytiqueContent = etatFinancierAnalytiqueGeneratePdf.generateEvcpAnalytiqueContent;

const etatFinancierAnalytiqueGenerateExcel = require('../../../Middlewares/EtatFinancierAnalytique/adminEtatFinancierAnalytiqueGenerateExcel');
const exportBilanAnalytiqueToExcel = etatFinancierAnalytiqueGenerateExcel.exportBilanAnalytiqueToExcel;
const exportCrnAnalytiqueToExcel = etatFinancierAnalytiqueGenerateExcel.exportCrnAnalytiqueToExcel;
const exportCrfAnalytiqueToExcel = etatFinancierAnalytiqueGenerateExcel.exportCrfAnalytiqueToExcel;
const exportTftiAnalytiqueToExcel = etatFinancierAnalytiqueGenerateExcel.exportTftiAnalytiqueToExcel;
const exportTftdAnalytiqueToExcel = etatFinancierAnalytiqueGenerateExcel.exportTftdAnalytiqueToExcel;
const exportEvcpAnalytiqueToExcel = etatFinancierAnalytiqueGenerateExcel.exportEvcpAnalytiqueToExcel;

const columnsMapping = {
    BILAN_ACTIF: [
        { col: 'rubriquebilanactifbrutanalytique', nature: 'BRUT' },
        { col: 'rubriquebilanactifamortanalytique', nature: 'AMORT' }
    ],
    BILAN_PASSIF: [
        { col: 'rubriquebilanpassifbrutanalytique', nature: 'BRUT' }
    ],
    CRN: [
        { col: 'rubriquecrnanalytique', nature: 'BRUT' }
    ],
    CRF: [
        { col: 'rubriquecrfanalytique', nature: 'BRUT' }
    ],
    TFTD: [
        { col: 'rubriquetftdanalytique', nature: 'BRUT' }
    ],
    TFTI: [
        { col: 'rubriquetftianalytique', nature: 'BRUT' }
    ],
};

const logoPath = path.join(__dirname, `../../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [annee, mois, jour] = dateStr.split('-');
    return `${jour.padStart(2, '0')}-${mois.padStart(2, '0')}-${annee}`;
};

const generateTableauAnalytiqueAuto = async (id_dossier, id_exercice, id_compte, id_etat, id_axe, id_sections) => {
    try {

        if (!id_dossier || !id_exercice || !id_compte || !id_etat) {
            throw new Error("Paramètres manquants pour la génération du : ", id_etat);
        }

        // Pour la balance
        try {
            await updateSoldAnalytiqueGlobal(id_compte, id_dossier, id_exercice, id_axe, id_sections);
            await updateRubriqueAnalytique(id_compte, id_dossier, id_exercice, id_etat, id_axe, id_sections);

        } catch (err) {
            throw new Error(`Erreur lors de la mise à jour des soldes ou des rubriques : ${err.message}`);
        }

        // Etats financier analytique
        await updateSoldeEtatFinancierAnalytique(id_dossier, id_compte, id_exercice, id_etat, id_axe, id_sections);

        return true;
    } catch (error) {
        console.error("Erreur lors de la génération automatique :", error);
        throw error;
    }
}

exports.getEtatFinancierAnalytiqueGlobal = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_axe, id_sections } = req.body;

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        if (!id_axe) {
            return res.status(400).json({ state: false, message: 'Axe manquante' });
        }
        if (!id_sections) {
            return res.status(400).json({ state: false, message: 'Section manquant' });
        }

        const rubriqueExterneData = (await rubriquesExternesAnalytiques.findAll({
            where: { id_dossier, id_compte, id_exercice, active: true },
            include: [
                {
                    model: ajustemenExternesAnalytiques,
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

        const rubriqueExterneEvcpData = (await rubriqueExternesEvcpAnalytiques.findAll({
            where: {
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice),
                id_compte: Number(id_compte)
            },
            include: [
                {
                    model: ajustemenExternesAnalytiques,
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

        const balancesData = await balanceAnalytiques.findAll({
            where: { id_dossier, id_compte, id_exercice },
            // raw: true,
            include: [
                { model: caAxes },
                { model: caSections },
            ]
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
                    const idsNumComptes = [...new Set(matches.map(m => Number(m.id_numcpt)))];

                    const planComptableData = await dossierplancomptableModel.findAll({
                        where: { id: { [Op.in]: idsNumComptes } },
                        attributes: ['id', 'compte', 'libelle'],
                        raw: true
                    });

                    const comptesMap = Object.fromEntries(
                        planComptableData.map(p => [p.id, p])
                    );

                    const comptesValides = matches
                        .filter(b => r.id_etat === 'TFTD' ? Number(b.soldedebittresoanalytique) !== 0 || Number(b.soldecredittresoanalytique) !== 0 : Number(b.soldedebitanalytique) !== 0 || Number(b.soldecreditanalytique) !== 0)
                        .map(b => {
                            const rubData = rubriqueMap.get(`${b[col]}_${r.id_etat}`);
                            const codeAxe = b.caax ? b.caax.code : null;
                            const section = b.casection ? b.casection.section : null;

                            const libelle = `${codeAxe ?? ""} : ${section ?? ""}`;

                            const equation = rubData?.equation?.trim().toUpperCase() === 'SOUSTRACTIF'
                                ? 'SOUSTRACTIF'
                                : 'ADDITIF';

                            return {
                                compte: comptesMap[b.id_numcpt]?.compte || null,
                                libelle: comptesMap[b.id_numcpt]?.libelle || null,
                                soldedebitanalytique: r.id_etat === 'TFTD' ? Number(Number(b.soldedebittresoanalytique)) : Number(Number(b.soldedebitanalytique)),
                                soldecreditanalytique: r.id_etat === 'TFTD' ? Number(Number(b.soldecredittresoanalytique)) : Number(Number(b.soldecreditanalytique)),
                                nature,
                                equation,
                                libelleAxeSection: libelle
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

exports.generateTableEtatFinancierAnalytique = async (req, res) => {
    try {
        const { id_dossier, id_exercice, id_compte, id_etat, id_axe, id_sections } = req.body;

        if (!id_compte) {
            return res.status(200).json({ state: false, message: 'id_compte manquant' });
        }
        if (!id_dossier) {
            return res.status(200).json({ state: false, message: 'id_dossier manquant' });
        }
        if (!id_exercice) {
            return res.status(200).json({ state: false, message: 'id_exercice manquant' });
        }
        if (!id_etat) {
            return res.status(200).json({ state: false, message: 'id_etat manquant' });
        }
        if (!id_axe) {
            return res.status(200).json({ state: false, message: 'Veuillez sélectionner une axe' });
        }
        if (id_sections.length === 0 || !id_sections) {
            return res.status(200).json({ state: false, message: 'Veuillez sélectionner au moins une section' });
        }

        try {
            await createEtatsEtatFinancierAnalytiqueIfNotExist(id_dossier, id_compte, id_exercice, id_etat);
        } catch (err) {
            throw new Error(`Erreur lors de l\'ajout de l'état du tableau : ${err.message}`);
        }

        if (id_etat === "BILAN") {
            await copyRubriqueExterneAnalytique(id_dossier, id_exercice, id_compte, "BILAN_ACTIF");
            await copyRubriqueExterneAnalytique(id_dossier, id_exercice, id_compte, "BILAN_PASSIF");
        } else {
            await copyRubriqueExterneAnalytique(id_dossier, id_exercice, id_compte, id_etat);
        }

        const rubriqueData = await rubriquesExternesAnalytiques.findAll({
            where:
                id_etat === "BILAN"
                    ? {
                        id_dossier,
                        id_exercice,
                        id_compte,
                        id_etat: { [Op.in]: ["BILAN_ACTIF", "BILAN_PASSIF"] },
                    }
                    : { id_dossier, id_exercice, id_compte, id_etat },
        });

        if (!rubriqueData || rubriqueData.length === 0) {
            if (id_etat !== 'EVCP') {
                return res.status(200).json({
                    state: false,
                    message:
                        id_etat === "BILAN"
                            ? "Aucune rubrique trouvé pour le tableau BILAN ACTIF ou PASSIF"
                            : `Aucune rubrique trouvé pour le tableau ${id_etat}`,
                });
            }
        }

        let success = false;

        if (id_etat === "BILAN") {
            const actifSuccess = await generateTableauAnalytiqueAuto(id_dossier, id_exercice, id_compte, "BILAN_ACTIF", id_axe, id_sections);
            const passifSuccess = await generateTableauAnalytiqueAuto(id_dossier, id_exercice, id_compte, "BILAN_PASSIF", id_axe, id_sections);

            success = actifSuccess && passifSuccess;
        } else if (id_etat === 'EVCP') {
            success = await totalRubriqueExterneEVCPAnalytique(id_compte, id_dossier, id_exercice, id_axe, id_sections);
        } else {
            success = await generateTableauAnalytiqueAuto(id_dossier, id_exercice, id_compte, id_etat, id_axe, id_sections);
        }

        if (success) {
            return res.status(200).json({
                state: true,
                message:
                    id_etat === "BILAN"
                        ? "Génération du BILAN ACTIF et PASSIF automatique réussie"
                        : `Génération du ${id_etat} automatique réussie`,
            });
        } else {
            return res.status(200).json({
                state: false,
                message:
                    id_etat === "BILAN"
                        ? "Erreur lors de la génération automatique du BILAN ACTIF ou PASSIF"
                        : `Erreur lors de la génération automatique du ${id_etat}`,
            });
        }

    } catch (error) {
        console.error("Erreur dans generateTableEtatFinancier:", error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur lors de la génération du tableau de l'état financier",
            error: error.message,
        });
    }
};

exports.addModifyAjustementExterneAnalytique = async (req, res) => {
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
            montant,
            id_axe,
            id_sections
        } = req.body;

        let resData = {
            state: false,
            msg: 'une erreur est survenue lors du traitement.',
            liste: [],
            etatglobal: [],
            detailAnom: []
        }

        const testIfExist = await ajustemenExternesAnalytiques.findAll({
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
            const addAjust = await ajustemenExternesAnalytiques.create({
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
            const ModifyAjust = await ajustemenExternesAnalytiques.update(
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
            await totalRubriqueExterneEVCPAnalytique(id_compte, id_dossier, id_exercice, id_axe, id_sections);
        } else {
            await updateSoldeEtatFinancierAnalytique(id_dossier, id_compte, id_exercice, id_etat, id_axe, id_sections);
        }

        return res.json(resData);
    } catch (error) {
        console.log(error);
    }
}

exports.getAjustementExterneAnalytique = async (req, res) => {
    try {
        const { compteId, dossierId, exerciceId, etatId, rubriqueId, nature } = req.query;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
            etatglobal: [],
            detailAnom: []
        }

        const liste = await ajustemenExternesAnalytiques.findAll({
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

exports.deleteAjustementExterneAnalytique = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            id_axe,
            id_sections
        } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
        }

        if (!id_axe || !id_sections) {
            resData.state = false;
            resData.msg = "Axe ou section non trouvé";
            return res.json(resData);
        }

        const ajustementDataBeforeDelete = await ajustemenExternesAnalytiques.findByPk(id);

        if (!ajustementDataBeforeDelete) {
            resData.msg = 'Aucune ajustement trouvé';
            return res.json(resData);
        }

        const id_compte = Number(ajustementDataBeforeDelete.id_compte);
        const id_exercice = Number(ajustementDataBeforeDelete.id_exercice);
        const id_dossier = Number(ajustementDataBeforeDelete.id_dossier);
        const id_etat = ajustementDataBeforeDelete.id_etat;

        const stateDeleting = await ajustemenExternesAnalytiques.destroy({
            where: { id }
        });

        if (id_etat === 'EVCP') {
            await totalRubriqueExterneEVCPAnalytique(id_compte, id_dossier, id_exercice, id_axe, id_sections);
        } else {
            await updateSoldeEtatFinancierAnalytique(id_dossier, id_compte, id_exercice, id_etat, id_axe, id_sections);
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

exports.getVerouillageEtatFinancierAnalytique = async (req, res) => {
    try {
        const { compteId, fileId, exerciceId } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
        }

        const infosListe = await etatsEtatFinancierAnalitiques.findAll({
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

exports.lockEtatFinancierAnalytique = async (req, res) => {
    try {
        const { compteId, fileId, exerciceId, tableau, verr } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            liste: [],
        }

        const infosUpdate = await etatsEtatFinancierAnalitiques.update(
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

const infoBlock = (dossier, compte, exercice) => ([
    { text: `Dossier : ${dossier?.dossier}`, style: 'subTitle', margin: [0, 0, 0, 5] },
    { text: `Période du : ${formatDate(exercice.date_debut)} au ${formatDate(exercice.date_fin)}`, style: 'subTitle1', margin: [0, 0, 0, 10] }
]);

exports.exportEtatFinancierAnalytiqueToPdf = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, id_etat, id_axe, id_section } = req.params;
        const sections = id_section
            ? id_section.split(',').map(id => Number(id))
            : [];
        if (!id_dossier || !id_compte || !id_exercice || !id_etat) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }
        if (!id_axe) return res.json({ state: true, msg: 'Axe vide' });
        if (!sections || sections.length === 0) return res.json({ state: true, msg: 'Section vide' });

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

        let docDefinition = {}
        if (id_etat === 'BILAN') {
            const { buildTable, bilanActifData, bilanPassifData } = await generateBilanAnalytiqueContent(id_compte, id_dossier, id_exercice, id_axe, sections);
            docDefinition = {
                content: [
                    { text: 'Bilan actif', style: 'title' },
                    infoBlock(dossier, compte, exercice),
                    ...buildTable(bilanActifData, 'actif'),
                    { text: '', pageBreak: 'before' },
                    { text: 'Bilan passif', style: 'title' },
                    infoBlock(dossier, compte, exercice),
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
            const { buildTable, crnData } = await generateCrnAnalytiqueContent(id_compte, id_dossier, id_exercice, id_axe, sections);
            docDefinition = {
                content: [
                    { text: 'Compte de résultat par nature', style: 'title' },
                    infoBlock(dossier, compte, exercice),
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
            const { buildTable, crfData } = await generateCrfAnalytiqueContent(id_compte, id_dossier, id_exercice, id_axe, sections);
            docDefinition = {
                content: [
                    { text: 'Compte de résultat par fonction', style: 'title' },
                    infoBlock(dossier, compte, exercice),
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
            const { buildTable, tftdData } = await generateTftdAnalytiqueContent(id_compte, id_dossier, id_exercice, id_axe, sections);
            docDefinition = {
                content: [
                    { text: 'Tableau de flux de trésoreries méthode directe', style: 'title' },
                    infoBlock(dossier, compte, exercice),
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
            const { buildTable, tftiData } = await generateTftiAnalytiqueContent(id_compte, id_dossier, id_exercice, id_axe, sections);
            docDefinition = {
                content: [
                    { text: 'Tableau de flux de trésoreries méthode indirecte', style: 'title' },
                    infoBlock(dossier, compte, exercice),
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
            const { buildTable, evcpData } = await generateEvcpAnalytiqueContent(id_compte, id_dossier, id_exercice);
            docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                content: [
                    { text: 'Etat de variation des capitaux propres', style: 'title' },
                    infoBlock(dossier, compte, exercice),
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

exports.exportEtatFinancierAnalytiqueToExcel = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, id_etat, id_axe, id_section } = req.params;
        const sections = id_section
            ? id_section.split(',').map(id => Number(id))
            : [];
        if (!id_dossier || !id_compte || !id_exercice || !id_etat) {
            return res.status(200).json({ msg: 'Paramètres manquants' });
        }
        if (!id_axe) return res.json({ state: true, msg: 'Axe vide' });
        if (!sections || sections.length === 0) return res.json({ state: true, msg: 'Section vide' });

        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);

        const workbook = new ExcelJS.Workbook();
        if (id_etat === 'BILAN') {
            await exportBilanAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        } else if (id_etat === 'CRN') {
            await exportCrnAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        } else if (id_etat === 'CRF') {
            await exportCrfAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        } else if (id_etat === 'TFTI') {
            await exportTftiAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        } else if (id_etat === 'TFTD') {
            await exportTftdAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        } else if (id_etat === 'EVCP') {
            await exportEvcpAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        } else {
            return res.status(200).json({ msg: "Type d'état invalide" });
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

exports.exportAllEtatFinancierAnalytiqueToExcel = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, id_axe, id_section } = req.params;
        const sections = id_section
            ? id_section.split(',').map(id => Number(id))
            : [];
        if (!id_dossier || !id_compte || !id_exercice) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }
        if (!id_axe) return res.json({ state: true, msg: 'Axe vide' });
        if (!sections || sections.length === 0) return res.json({ state: true, msg: 'Section vide' });

        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);

        const workbook = new ExcelJS.Workbook();

        await exportBilanAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        await exportCrnAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        await exportCrfAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        await exportTftdAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        await exportTftiAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);
        await exportEvcpAnalytiqueToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin), id_axe, sections);

        workbook.views = [
            { activeTab: 0 }
        ];
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Etat financier analytique.xlsx`
        );
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur génération Excel' });
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

exports.exportAllEtatFinancierAnalytiqueToPdf = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, id_axe, id_section } = req.params;
        const sectionsAxes = id_section
            ? id_section.split(',').map(id => Number(id))
            : [];
        if (!id_dossier || !id_compte || !id_exercice) {
            return res.status(400).json({ msg: 'Paramètres manquants' });
        }
        if (!id_axe) return res.json({ state: true, msg: 'Axe vide' });
        if (!sectionsAxes || sectionsAxes.length === 0) return res.json({ state: true, msg: 'Section vide' });

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
            { generator: generateBilanActifAnalytiqueContent, title: 'Bilan Actif', landscape: false },
            { generator: generateBilanPassifAnalytiqueContent, title: 'Bilan Passif', landscape: false },
            { generator: generateCrnAnalytiqueContent, title: 'Compte de résultat par nature', landscape: false },
            { generator: generateCrfAnalytiqueContent, title: 'Compte de résultat par fonction', landscape: false },
            { generator: generateTftdAnalytiqueContent, title: 'Tableau de flux de trésoreries méthode directe', landscape: false },
            { generator: generateTftiAnalytiqueContent, title: 'Tableau de flux de trésoreries méthode indirecte', landscape: false },
            { generator: generateEvcpAnalytiqueContent, title: 'Etat de variation des capitaux propres', landscape: true },
        ];

        const pdfBuffers = [];

        for (let i = 0; i < sections.length; i++) {
            const { generator, title, landscape } = sections[i];
            const { buildTable, ...data } = await generator(id_compte, id_dossier, id_exercice, id_axe, sectionsAxes);
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
        res.setHeader('Content-Disposition', `inline; filename="BILAN Analytique.pdf"`);
        res.send(Buffer.from(finalPdfBytes));

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur génération PDF' });
    }
}

exports.getEtatFinancierAnalytique = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, id_etat, axeId, sectionId } = req.body;
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
        if (!axeId) return res.json({ state: true, msg: 'Axe vide' });
        if (!sectionId || sectionId.length === 0) return res.json({ state: true, msg: 'Section vide' });

        const data = await getEtatFinancierAnalytiqueComplet(id_compte, id_dossier, id_exercice, id_etat, axeId, sectionId);

        const rubriqueExterneEvcpData = (await rubriqueExternesEvcpAnalytiques.findAll({
            where: {
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice),
                id_compte: Number(id_compte)
            },
            include: [
                {
                    model: ajustemenExternesAnalytiques,
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

exports.getEtatFinancierAnalytiqueDetail = async (req, res) => {
    try {
        const { id_etat, id_dossier, id_exercice, id_compte, id_rubrique, subtable, axeId, sectionId } = req.body;
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
        const data = await getDetailLigneEtatFinancierAnalytique(id_compte, id_dossier, id_exercice, id_etat, id_rubrique, subtable, axeId, sectionId);
        return res.json({ state: true, detail: data });
    } catch (error) {
        console.log(error);
    }
}