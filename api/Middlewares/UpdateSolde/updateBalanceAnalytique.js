const db = require("../../Models");
require('dotenv').config();
const { Op } = require('sequelize');

const balanceanalytiques = db.balanceAnalytiques;
const analytiques = db.analytiques;
const journals = db.journals;
const dossierplancomptableModel = db.dossierplancomptable;
const balances = db.balances;
const caSections = db.caSections;
const codejournals = db.codejournals;

const updateSoldAnalytique = async (compte_id, dossier_id, exercice_id) => {
    try {
        let stateUpdate = false;

        await balanceanalytiques.destroy({
            where: {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id
            }
        });

        const lignes = await analytiques.findAll({
            attributes: ['id_axe', 'id_section', 'debit', 'credit'],
            include: [
                {
                    model: journals,
                    as: 'journals',
                    attributes: ['id_numcpt'],
                    required: true
                }
            ],
            where: {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id
            }
        });

        if (lignes.length === 0) return;

        const grouped = lignes.reduce((acc, line) => {
            const key = `${line.journals.id_numcpt}-${line.id_axe}-${line.id_section}`;

            if (!acc[key]) {
                acc[key] = {
                    id_numcpt: line.journals.id_numcpt,
                    id_axe: line.id_axe,
                    id_section: line.id_section,
                    mvtdebitanalytique: 0,
                    mvtcreditanalytique: 0
                };
            }

            acc[key].mvtdebitanalytique += Number(line.debit) || 0;
            acc[key].mvtcreditanalytique += Number(line.credit) || 0;

            return acc;
        }, {});

        const payload = Object.values(grouped).map(group => {
            const { mvtdebitanalytique, mvtcreditanalytique } = group;

            let soldedebitanalytique = mvtdebitanalytique - mvtcreditanalytique;
            let soldecreditanalytique = mvtcreditanalytique - mvtdebitanalytique;

            soldedebitanalytique = soldedebitanalytique < 0 ? 0 : soldedebitanalytique;
            soldecreditanalytique = soldecreditanalytique < 0 ? 0 : soldecreditanalytique;

            const valeuranalytique = Math.abs(mvtcreditanalytique - mvtdebitanalytique);

            return {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_numcpt: group.id_numcpt,
                id_axe: group.id_axe,
                id_section: group.id_section,
                mvtdebitanalytique,
                mvtcreditanalytique,
                soldedebitanalytique,
                soldecreditanalytique,
                valeuranalytique
            };
        });

        await balanceanalytiques.bulkCreate(payload);

        return stateUpdate;
    } catch (error) {
        console.error("Erreur dans updateSold :", error.message);
        console.log(error);
    }
};

const addCompteBilanToBalanceAnalytiqueOneAxe = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    try {
        const analytiqueData = await analytiques.findAll({
            where: {
                id_dossier,
                id_exercice,
                id_compte,
                id_axe,
                id_section: { [Op.in]: id_section }
            },
            attributes: ['id_ligne_ecriture']
        })

        const id_journals = [...new Set(analytiqueData.map(val => val.id_ligne_ecriture))];

        const journalData = await journals.findAll({
            where: {
                id: { [Op.in]: id_journals }
            },
            attributes: ['id_ecriture', 'id']
        })

        const id_ecritures = [...new Set(journalData.map(val => val.id_ecriture))];

        for (const id_ecriture of id_ecritures) {

            const id_journal = journalData
                .filter(val => val.id_ecriture === id_ecriture)
                .map(val => val.id);

            const journal_6_7 = await journals.findAll({
                where: { id_ecriture },
                include: [{
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    where: {
                        compte: { [Op.regexp]: '^(6|7)' }
                    }
                }],
                attributes: ['debit', 'credit'],
            });

            const journal_in_1_5 = await journals.findAll({
                where: { id_ecriture },
                include: [
                    {
                        model: dossierplancomptableModel,
                        attributes: ['compte'],
                        where: { compte: { [Op.regexp]: '^(1|2|3|4|5)' } }
                    },
                    {
                        model: codejournals,
                        attributes: ['code']
                    }
                ],
                attributes: ['id_numcpt', 'debit', 'credit', 'id'],
            });

            const journal_treso_in_1_5 = await journals.findAll({
                where: { id_ecriture },
                include: [
                    {
                        model: dossierplancomptableModel,
                        attributes: ['compte'],
                        where: { compte: { [Op.regexp]: '^(1|2|3|4|5)' } }
                    },
                    {
                        model: codejournals,
                        attributes: ['type'],
                        where: { type: { [Op.in]: ['BANQUE', 'CAISSE'] } }
                    }
                ],
                attributes: ['id_numcpt', 'debit', 'credit', 'id'],
            });

            const total_debit_credit_6_7 = journal_6_7.reduce((sum, l) => sum + ((Number(l.credit) || 0) + (Number(l.debit) || 0)), 0);

            const total_treso_debit = journal_treso_in_1_5.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
            const total_treso_credit = journal_treso_in_1_5.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);

            const montant_treso = total_treso_debit - total_treso_credit;

            const amountByCompte = journal_in_1_5.reduce((map, row) => {
                const idNum = Number(row.id_numcpt);
                const amt = (Number(row.debit) || 0) + (Number(row.credit) || 0);
                map[idNum] = (map[idNum] || 0) + amt;
                return map;
            }, {});

            const id_numcpt_in_1_5 = [...new Set(journal_in_1_5.map(val => Number(val.id_numcpt)))];

            for (const all_section of id_section) {
                const sectionsInAnalytique = await analytiques.findAll({
                    where: {
                        id_ligne_ecriture: { [Op.in]: id_journal },
                        id_section: all_section,
                        id_compte,
                        id_dossier,
                        id_exercice,
                    },
                    attributes: ['debit', 'credit'],
                });

                const total_section = sectionsInAnalytique.reduce((sum, l) => sum + ((Number(l.credit) || 0) + (Number(l.debit) || 0)), 0);

                const coef = total_debit_credit_6_7 > 0 ? total_section / total_debit_credit_6_7 : 0;
                const montant_treso_analytique = coef * montant_treso;

                const soldedebittresoanalytique = montant_treso_analytique > 0 ? montant_treso_analytique : 0;
                const soldecredittresoanalytique = montant_treso_analytique < 0 ? Math.abs(montant_treso_analytique) : 0;

                for (const compte_in_1_5 of id_numcpt_in_1_5) {
                    const assinedBalance_in_1_5 = await balances.findOne({
                        where: {
                            id_numcompte: compte_in_1_5,
                            id_dossier,
                            id_compte,
                            id_exercice
                        },
                        attributes: ['mvtdebit', 'mvtcredit', 'soldedebit', 'soldecredit', 'valeur', 'id'],
                    });

                    if (!assinedBalance_in_1_5) {
                        throw new Error('Compte non trouvé dans la balance');
                    }

                    const mvtdebit = Number(assinedBalance_in_1_5.mvtdebit) || 0;
                    const mvtcredit = Number(assinedBalance_in_1_5.mvtcredit) || 0;
                    const soldedebit = Number(assinedBalance_in_1_5.soldedebit) || 0;
                    const soldecredit = Number(assinedBalance_in_1_5.soldecredit) || 0;
                    const valeur = Number(assinedBalance_in_1_5.valeur) || 0;

                    const amountCompteInEcriture = amountByCompte[compte_in_1_5] || 0;

                    const existing = await balanceanalytiques.findOne({
                        where: {
                            id_compte,
                            id_dossier,
                            id_exercice,
                            id_numcpt: compte_in_1_5,
                            id_axe: id_axe,
                            id_section: all_section
                        }
                    });

                    const newValues = {
                        mvtdebitanalytique: (coef * mvtdebit * amountCompteInEcriture),
                        mvtcreditanalytique: (coef * mvtcredit * amountCompteInEcriture),
                        soldedebitanalytique: (coef * soldedebit * amountCompteInEcriture),
                        soldecreditanalytique: (coef * soldecredit * amountCompteInEcriture),
                        soldedebittresoanalytique,
                        soldecredittresoanalytique,
                        valeuranalytique: (coef * valeur * amountCompteInEcriture)
                    };

                    if (existing) {
                        await existing.update({
                            mvtdebitanalytique: existing.mvtdebitanalytique + newValues.mvtdebitanalytique,
                            mvtcreditanalytique: existing.mvtcreditanalytique + newValues.mvtcreditanalytique,
                            soldedebitanalytique: existing.soldedebitanalytique + newValues.soldedebitanalytique,
                            soldecreditanalytique: existing.soldecreditanalytique + newValues.soldecreditanalytique,
                            valeuranalytique: existing.valeuranalytique + newValues.valeuranalytique,
                            soldedebittresoanalytique: existing.soldedebittresoanalytique + newValues.soldedebittresoanalytique,
                            soldecredittresoanalytique: existing.soldecredittresoanalytique + newValues.soldecredittresoanalytique,
                        });
                    } else {
                        await balanceanalytiques.create({
                            id_compte,
                            id_dossier,
                            id_exercice,
                            id_numcpt: compte_in_1_5,
                            id_axe: id_axe,
                            id_section: all_section,
                            ...newValues
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error("Erreur dans addCompteBilanToBalanceAnalytiqueOneAxe :", error.message);
        console.log(error);
    }
}

const addCompteBilanToBalanceAnalytiqueManyAxes = async (id_compte, id_dossier, id_exercice, id_axes, id_section) => {
    try {
        const analytiqueData = await analytiques.findAll({
            where: {
                id_dossier,
                id_exercice,
                id_compte,
                id_axe: { [Op.in]: id_axes },
                id_section: { [Op.in]: id_section }
            },
            attributes: ['id_ligne_ecriture']
        })

        const id_journals = [...new Set(analytiqueData.map(val => val.id_ligne_ecriture))];

        const journalData = await journals.findAll({
            where: {
                id: { [Op.in]: id_journals }
            },
            attributes: ['id_ecriture', 'id']
        })

        const id_ecritures = [...new Set(journalData.map(val => val.id_ecriture))];

        const compteToCreate = [];

        for (const id_ecriture of id_ecritures) {

            const id_journal = journalData
                .filter(val => val.id_ecriture === id_ecriture)
                .map(val => val.id);

            const journal_6_7 = await journals.findAll({
                where: { id_ecriture },
                include: [{
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    where: {
                        compte: { [Op.regexp]: '^(6|7)' }
                    }
                }],
                attributes: ['debit', 'credit'],
            });

            const journal_in_1_5 = await journals.findAll({
                where: { id_ecriture },
                include: [{
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    where: { compte: { [Op.regexp]: '^(1|2|3|4|5)' } }
                }],
                attributes: ['id_numcpt', 'debit', 'credit'],
            });

            const total_debit_credit_6_7 = journal_6_7.reduce((sum, l) =>
                sum + ((Number(l.credit) || 0) + (Number(l.debit) || 0))
                , 0);

            const amountCompteIn_1_5 = journal_in_1_5.reduce((map, row) => {
                const idNum = Number(row.id_numcpt);
                const amt = (Number(row.debit) || 0) + (Number(row.credit) || 0);
                map[idNum] = (map[idNum] || 0) + amt;
                return map;
            }, {});

            const id_numcpt_in_1_5 = [...new Set(journal_in_1_5.map(val => Number(val.id_numcpt)))];

            for (const all_axe of id_axes) {
                for (const all_section of id_section) {
                    for (const compte_in_1_5 of id_numcpt_in_1_5) {

                        const sectionsInAnalytique = await analytiques.findAll({
                            where: {
                                id_ligne_ecriture: { [Op.in]: id_journal },
                                id_section: all_section,
                                id_compte,
                                id_dossier,
                                id_exercice,
                            },
                            attributes: ['debit', 'credit'],
                        });

                        const total_section = sectionsInAnalytique.reduce((sum, l) =>
                            sum + ((Number(l.credit) || 0) + (Number(l.debit) || 0))
                            , 0);

                        const coef = total_debit_credit_6_7 > 0 ? total_section / total_debit_credit_6_7 : 0;

                        const assinedBalance_in_1_5 = await balances.findOne({
                            where: {
                                id_numcompte: compte_in_1_5,
                                id_dossier,
                                id_compte,
                                id_exercice
                            },
                            attributes: ['mvtdebit', 'mvtcredit', 'soldedebit', 'soldecredit', 'valeur', 'id'],
                        });

                        if (!assinedBalance_in_1_5) {
                            throw new Error('Compte non trouvé dans la balance');
                        }

                        const mvtdebit = Number(assinedBalance_in_1_5.mvtdebit) || 0;
                        const mvtcredit = Number(assinedBalance_in_1_5.mvtcredit) || 0;
                        const soldedebit = Number(assinedBalance_in_1_5.soldedebit) || 0;
                        const soldecredit = Number(assinedBalance_in_1_5.soldecredit) || 0;
                        const valeur = Number(assinedBalance_in_1_5.valeur) || 0;

                        const amountCompteInEcriture = amountCompteIn_1_5[compte_in_1_5] || 0;

                        await balanceanalytiques.create({
                            id_compte,
                            id_dossier,
                            id_exercice,
                            id_numcpt: compte_in_1_5,
                            id_axe: all_axe,
                            id_section: all_section,
                            mvtdebitanalytique: +(coef * mvtdebit * amountCompteInEcriture),
                            mvtcreditanalytique: +(coef * mvtcredit * amountCompteInEcriture),
                            soldedebitanalytique: +(coef * soldedebit * amountCompteInEcriture),
                            soldecreditanalytique: +(coef * soldecredit * amountCompteInEcriture),
                            valeuranalytique: +(coef * valeur * amountCompteInEcriture),
                        })
                    }
                }
            }
        }
        // return compteToCreate;
    } catch (error) {
        console.error("Erreur dans addCompteBilanToBalanceAnalytiqueManyAxes :", error.message);
        console.log(error);
    }
};

const createAnalytiqueIfNotExist = async (id_compte, id_dossier, id_exercice) => {
    const journal_in_6_7 = await journals.findAll({
        where: {
            id_dossier,
            id_exercice,
            id_compte,
            compteaux: { [Op.regexp]: '^(6|7)' }
        },
        attributes: ['debit', 'credit', 'id_ecriture'],
    });

    const sections = await caSections.findAll({
        where: { id_compte, id_dossier },
        attributes: ['id_axe', 'id', 'pourcentage']
    });

    const id_ecritures = [...new Set(journal_in_6_7.map(val => val.id_ecriture))];

    for (const id_ecriture of id_ecritures) {

        const journalEcriture = await journals.findAll({
            where: {
                id_ecriture,
                id_dossier,
                id_exercice,
                id_compte,
                compteaux: { [Op.regexp]: '^(6|7)' }
            },
            attributes: ['id', 'debit', 'credit'],
        });

        if (journalEcriture.length === 0) {
            continue;
        }

        for (const journalLine of journalEcriture) {

            const analytique = await analytiques.findOne({
                where: { id_ligne_ecriture: journalLine.id }
            });

            if (!analytique) {
                for (const section of sections) {

                    const debitAnalytique =
                        section.pourcentage > 0
                            ? (journalLine.debit * section.pourcentage) / 100
                            : 0;

                    const creditAnalytique =
                        section.pourcentage > 0
                            ? (journalLine.credit * section.pourcentage) / 100
                            : 0;

                    await analytiques.create({
                        id_compte,
                        id_exercice,
                        id_dossier,
                        id_axe: section.id_axe,
                        id_section: section.id,
                        id_ligne_ecriture: journalLine.id,
                        pourcentage: section.pourcentage,
                        debit: debitAnalytique,
                        credit: creditAnalytique
                    });
                }
            }
        }
    }
};

const updateSoldAnalytiqueGlobal = async (id_compte, id_dossier, id_exercice, id_axes, id_sections) => {
    await createAnalytiqueIfNotExist(id_compte, id_dossier, id_exercice);
    // await updateSold(id_compte, id_dossier, id_exercice, [], true);
    // await updateSoldAnalytique(id_compte, id_dossier, id_exercice);

    // const analytiqueData = await analytiques.findAll({
    //     where: {
    //         id_dossier,
    //         id_compte,
    //         id_exercice
    //     }
    // })

    // if (!analytiqueData) return

    // const mappedAxesIds = [...new Set(analytiqueData.map(val => Number(val.id_axe)))];
    // const mappedSectionsIds = [...new Set(analytiqueData.map(val => Number(val.id_section)))];

    // const axesIds = !id_axes || id_axes.length === 0 ? mappedAxesIds : id_axes;
    // const sectionsIds = !id_sections || id_sections.length === 0 ? mappedSectionsIds : id_sections;

    // await addCompteBilanToBalanceAnalytiqueOneAxe(id_compte, id_dossier, id_exercice, id_axes, sectionsIds);
    // await addCompteBilanToBalanceAnalytiqueManyAxes(id_compte, id_dossier, id_exercice, mappedAxesIds, mappedSectionsIds);
}

module.exports = {
    updateSoldAnalytique,
    addCompteBilanToBalanceAnalytiqueOneAxe,
    addCompteBilanToBalanceAnalytiqueManyAxes,
    updateSoldAnalytiqueGlobal,
    createAnalytiqueIfNotExist
};