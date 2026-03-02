const db = require("../../Models");
const { Op } = require('sequelize');

const fonctionRecupExerciceN1 = require('../../Middlewares/Standard/recupExerciceN1');

const rubriquesExternes = db.rubriquesExternes;
const compteRubriquesExternes = db.compteRubriquesExternes;
const dossierplancomptableModel = db.dossierplancomptable;
const ajustementExternes = db.ajustementExternes;
const compterubriques = db.compterubriques;
const rubriquesexternesevcps = db.rubriqueExternesEvcp;
const balances = db.balances;

const recupExerciceN1 = fonctionRecupExerciceN1.recupInfos;

const calculateRubrique = async (id_dossier, id_compte, id_exercice, id_etat) => {
    const ajustementData = await ajustementExternes.findAll({
        where: {
            id_dossier,
            id_exercice,
            id_compte,
            id_etat
        }
    })

    const resultatAdjustements = Object.values(
        ajustementData.reduce((acc, item) => {
            const id = item.id_rubrique.toString();
            if (!acc[id]) acc[id] = { id_rubrique: id, montantbrut: 0, montantamort: 0 };

            if (item.nature === "BRUT") acc[id].montantbrut += Number(item.montant || 0);
            if (item.nature === "AMORT") acc[id].montantamort += Number(item.montant || 0);

            return acc;
        }, {})
    ).map(r => ({
        ...r,
        montantnet: Number((r.montantbrut - r.montantamort).toFixed(2))
    }));

    // Calcul Rubrique
    const rubriqueData = (await rubriquesExternes.findAll({
        where: {
            id_dossier,
            id_compte,
            id_exercice,
            id_etat,
            active: true,
            type: { [Op.in]: ['RUBRIQUE', 'SOUS-RUBRIQUE', 'LIAISON', 'LIAISON VAR ACTIF', 'LIAISON VAR PASSIF', 'LIAISON N1'] }
        }
    })).map(r => ({
        ...r.toJSON(),
        id: Number(r.id),
        id_compte: Number(r.id_compte),
        id_dossier: Number(r.id_dossier),
        id_exercice: Number(r.id_exercice),
    }))

    if (!rubriqueData.length) {
        console.warn(`Aucune rubrique trouvée pour ${id_dossier}/${id_compte}/${id_exercice}`);
        return;
    }

    const idRubriqueList = [...new Set(rubriqueData.map(val => val.id_rubrique))];

    const compteRubriqueData = (await compteRubriquesExternes.findAll({
        where: {
            id_dossier,
            id_compte,
            id_exercice,
            id_etat,
            active: true,
            id_rubrique: idRubriqueList
        }
    })).map(r => ({
        ...r.toJSON(),
        id: Number(r.id),
        id_compte: Number(r.id_compte),
        id_dossier: Number(r.id_dossier),
        id_exercice: Number(r.id_exercice),
    }))

    if (!compteRubriqueData.length) {
        console.warn(`Aucune liaison compte-rubrique trouvée pour ${id_dossier}/${id_compte}/${id_exercice}`);
    }

    const results = await Promise.all(
        compteRubriqueData
            .filter(c => c && c.id_rubrique)
            .map(async (compteRubrique) => {
                try {
                    const associatedIdRubrique = rubriqueData.find(
                        b => b.id_rubrique?.toString() === compteRubrique.id_rubrique?.toString()
                    );

                    const relatedBalances = await balances.findAll({
                        where: {
                            id_compte,
                            id_dossier,
                            id_exercice,
                            nature: { [Op.notIn]: ['Collectif'] },
                        },
                        attributes: ['soldedebit', 'soldecredit', 'id_numcompte', 'soldedebittreso', 'soldecredittreso'],
                        include: [
                            {
                                model: dossierplancomptableModel,
                                as: 'infosCompte',
                                attributes: ['compte'],
                            }
                        ],
                        raw: true,
                    });

                    const filteredBalances = relatedBalances.filter(b =>
                        b['infosCompte.compte']?.startsWith(compteRubrique.compte?.toString()) && b.nature !== 'Collectif'
                    );

                    let filteredBalancesForCalc = filteredBalances;

                    if (id_etat === 'TFTD') {
                        if (compteRubrique.condition === "SiD") {
                            filteredBalancesForCalc = filteredBalances.filter(b => Number(b.soldedebittreso) !== 0);
                        } else if (compteRubrique.condition === "SiC") {
                            filteredBalancesForCalc = filteredBalances.filter(b => Number(b.soldecredittreso) !== 0);
                        }

                    } else {
                        if (compteRubrique.condition === "SiD") {
                            filteredBalancesForCalc = filteredBalances.filter(b => Number(b.soldedebit) !== 0);
                        } else if (compteRubrique.condition === "SiC") {
                            filteredBalancesForCalc = filteredBalances.filter(b => Number(b.soldecredit) !== 0);
                        }
                    }

                    const totalDebit = filteredBalancesForCalc.reduce((sum, b) => sum + (Number(b.soldedebit) || 0), 0);
                    const totalCredit = filteredBalancesForCalc.reduce((sum, b) => sum + (Number(b.soldecredit) || 0), 0);

                    const totalDebitTreso = filteredBalancesForCalc.reduce((sum, b) => sum + (Number(b.soldedebittreso) || 0), 0);
                    const totalCreditTreso = filteredBalancesForCalc.reduce((sum, b) => sum + (Number(b.soldecredittreso) || 0), 0);

                    let solde = 0;

                    if (compteRubrique.senscalcul === "D-C") {
                        if (id_etat === 'TFTD') {
                            solde = totalDebitTreso - totalCreditTreso;
                        } else {
                            solde = totalDebit - totalCredit;
                        }
                        if (compteRubrique.condition === "SiD" && solde <= 0) solde = 0;
                        else if (compteRubrique.condition === "SiC" && solde >= 0) solde = 0;
                    } else if (compteRubrique.senscalcul === "C-D") {
                        if (id_etat === 'TFTD') {
                            solde = totalCreditTreso - totalDebitTreso;
                        } else {
                            solde = totalCredit - totalDebit;
                        }
                        if (compteRubrique.condition === "SiD" && solde >= 0) solde = 0;
                        else if (compteRubrique.condition === "SiC" && solde <= 0) solde = 0;
                    }

                    if (associatedIdRubrique) {
                        const rubriqueExterneAssociatedIdRubrique = await rubriquesExternes.findOne({
                            where: {
                                id_dossier,
                                id_exercice,
                                id_compte,
                                id_etat: compteRubrique.tableau,
                                id_rubrique: compteRubrique.compte
                            }
                        });

                        switch ((associatedIdRubrique.type || "").toUpperCase()) {
                            case "LIAISON VAR ACTIF":
                                solde = (rubriqueExterneAssociatedIdRubrique?.montantnetn1 || 0) -
                                    (rubriqueExterneAssociatedIdRubrique?.montantnet || 0);
                                break;
                            case "LIAISON VAR PASSIF":
                                solde = (rubriqueExterneAssociatedIdRubrique?.montantnet || 0) -
                                    (rubriqueExterneAssociatedIdRubrique?.montantnetn1 || 0);
                                break;
                            case "LIAISON":
                                solde = rubriqueExterneAssociatedIdRubrique?.montantnet || 0;
                                break;
                            case "LIAISON N1":
                                solde = rubriqueExterneAssociatedIdRubrique?.montantnetn1 || 0;
                                break;
                        }
                    }

                    if (compteRubrique.equation === "SOUSTRACTIF") solde = -solde;

                    return {
                        id_rubrique: compteRubrique.id_rubrique,
                        compte: compteRubrique.compte,
                        nature: compteRubrique.nature,
                        senscalcul: compteRubrique.senscalcul,
                        condition: compteRubrique.condition,
                        equation: compteRubrique.equation,
                        montantbrut: compteRubrique.nature === "BRUT" ? solde : 0,
                        montantamort: compteRubrique.nature === "AMORT" ? solde : 0,
                    };
                } catch (error) {
                    console.error(`Erreur pour la compteRubrique ${compteRubrique?.id_rubrique} :`, error.message);
                    return null;
                }
            })
    );

    const tableauFinal = results.reduce((acc, r) => {
        if (!acc[r.id_rubrique]) acc[r.id_rubrique] = { montantbrut: 0, montantamort: 0 };
        acc[r.id_rubrique].montantbrut += r.montantbrut;
        acc[r.id_rubrique].montantamort += r.montantamort;
        return acc;
    }, {});

    const tableauRubrique = Object.entries(tableauFinal).map(([id_rubrique, vals]) => ({
        id_rubrique,
        montantbrut: Number(vals.montantbrut.toFixed(2)),
        montantamort: Number(vals.montantamort.toFixed(2)),
        montantnet: Number((vals.montantbrut - vals.montantamort).toFixed(2))
    }));

    const merged = [...tableauRubrique, ...resultatAdjustements];

    const tableauComplet = Object.values(
        merged.reduce((acc, item) => {
            const id = item.id_rubrique.toString();
            if (!acc[id]) acc[id] = { id_rubrique: id, montantbrut: 0, montantamort: 0 };

            acc[id].montantbrut += item.montantbrut || 0;
            acc[id].montantamort += item.montantamort || 0;

            return acc;
        }, {})
    ).map(r => ({
        ...r,
        montantnet: Number((r.montantbrut - r.montantamort).toFixed(2))
    }));

    return tableauComplet;
};

const calculateRubriqueSig = async (id_dossier, id_compte, id_exercice, id_etat) => {
    const ajustementData = await ajustementExternes.findAll({
        where: {
            id_dossier,
            id_exercice,
            id_compte,
            id_etat
        }
    })

    const resultatAdjustements = Object.values(
        ajustementData.reduce((acc, item) => {
            const id = item.id_rubrique.toString();
            if (!acc[id]) acc[id] = { id_rubrique: id, montantbrut: 0, montantamort: 0 };

            if (item.nature === "BRUT") acc[id].montantbrut += Number(item.montant || 0);
            if (item.nature === "AMORT") acc[id].montantamort += Number(item.montant || 0);

            return acc;
        }, {})
    ).map(r => ({
        ...r,
        montantnet: Number((r.montantbrut - r.montantamort).toFixed(2)),
        montantnetn1: 0
    }));

    // Calcul Rubrique
    const rubriqueData = (await rubriquesExternes.findAll({
        where: {
            id_dossier,
            id_compte,
            id_exercice,
            id_etat,
            active: true,
            type: { [Op.in]: ['RUBRIQUE', 'SOUS-RUBRIQUE', 'LIAISON', 'LIAISON VAR ACTIF', 'LIAISON VAR PASSIF'] }
        }
    })).map(r => ({
        ...r.toJSON(),
        id: Number(r.id),
        id_compte: Number(r.id_compte),
        id_dossier: Number(r.id_dossier),
        id_exercice: Number(r.id_exercice),
    }))

    if (!rubriqueData.length) {
        console.warn(`Aucune rubrique trouvée pour ${id_dossier}/${id_compte}/${id_exercice}`);
        return;
    }

    const idRubriqueList = [...new Set(rubriqueData.map(val => val.id_rubrique))];

    const compteRubriqueData = (await compteRubriquesExternes.findAll({
        where: {
            id_dossier,
            id_compte,
            id_exercice,
            id_etat,
            active: true,
            id_rubrique: idRubriqueList
        }
    })).map(r => ({
        ...r.toJSON(),
        id: Number(r.id),
        id_compte: Number(r.id_compte),
        id_dossier: Number(r.id_dossier),
        id_exercice: Number(r.id_exercice),
    }))

    if (!compteRubriqueData.length) {
        console.warn(`Aucune liaison compte-rubrique trouvée pour ${id_dossier}/${id_compte}/${id_exercice}`);
    }

    const results = await Promise.all(
        compteRubriqueData.map(async (compteRubrique) => {
            try {
                const associatedIdRubrique = rubriqueData.find(
                    b => b.id_rubrique?.toString() === compteRubrique.id_rubrique?.toString()
                );

                const relatedBalances = await balances.findAll({
                    where: {
                        id_compte,
                        id_dossier,
                        id_exercice,
                        nature: { [Op.notIn]: ['Collectif'] },
                    },
                    attributes: ['soldedebit', 'soldecredit', 'id_numcompte'],
                    include: [
                        {
                            model: dossierplancomptableModel,
                            as: 'infosCompte',
                            attributes: ['compte'],
                        }
                    ],
                    raw: true,
                });

                const filteredBalances = relatedBalances.filter(b =>
                    b['infosCompte.compte']?.startsWith(compteRubrique.compte?.toString()) && b.nature !== 'Collectif'
                );

                let filteredBalancesForCalc = filteredBalances;

                if (compteRubrique.condition === "SiD") {
                    filteredBalancesForCalc = filteredBalances.filter(b => Number(b.soldedebit) !== 0);
                } else if (compteRubrique.condition === "SiC") {
                    filteredBalancesForCalc = filteredBalances.filter(b => Number(b.soldecredit) !== 0);
                }

                const totalDebit = filteredBalancesForCalc.reduce((sum, b) => sum + (Number(b.soldedebit) || 0), 0);
                const totalCredit = filteredBalancesForCalc.reduce((sum, b) => sum + (Number(b.soldecredit) || 0), 0);

                let solde = 0;
                if (compteRubrique.senscalcul === "D-C") {
                    solde = totalDebit - totalCredit;
                    if (compteRubrique.condition === "SiD" && solde <= 0) solde = 0;
                    else if (compteRubrique.condition === "SiC" && solde >= 0) solde = 0;
                } else if (compteRubrique.senscalcul === "C-D") {
                    solde = totalCredit - totalDebit;
                    if (compteRubrique.condition === "SiD" && solde >= 0) solde = 0;
                    else if (compteRubrique.condition === "SiC" && solde <= 0) solde = 0;
                }

                if (associatedIdRubrique) {
                    const rubriqueExterneAssociatedIdRubrique = await rubriquesExternes.findOne({
                        where: {
                            id_dossier,
                            id_exercice,
                            id_compte,
                            id_etat: compteRubrique.tableau,
                            id_rubrique: compteRubrique.compte
                        }
                    })
                    switch ((associatedIdRubrique.type || "").toUpperCase()) {
                        case "LIAISON VAR ACTIF":
                            solde = (rubriqueExterneAssociatedIdRubrique?.montantnet || 0) -
                                (rubriqueExterneAssociatedIdRubrique?.montantnetn1 || 0);
                            break;
                        case "LIAISON VAR PASSIF":
                            solde = (rubriqueExterneAssociatedIdRubrique?.montantnetn1 || 0) -
                                (rubriqueExterneAssociatedIdRubrique?.montantnet || 0);
                            break;
                        case "LIAISON":
                            solde = rubriqueExterneAssociatedIdRubrique?.montantnet || 0;
                            break;
                        case "LIAISON N1":
                            solde = rubriqueExterneAssociatedIdRubrique?.montantnetn1 || 0;
                            break;
                    }
                }

                if (compteRubrique.equation === "SOUSTRACTIF") solde = -solde;

                return {
                    id_rubrique: compteRubrique.id_rubrique,
                    compte: compteRubrique.compte,
                    nature: compteRubrique.nature,
                    senscalcul: compteRubrique.senscalcul,
                    condition: compteRubrique.condition,
                    equation: compteRubrique.equation,
                    montantbrut: compteRubrique.nature === "BRUT" ? solde : 0,
                    montantamort: compteRubrique.nature === "AMORT" ? solde : 0,
                };
            } catch (error) {
                console.error(`Erreur pour la compteRubrique ${compteRubrique.id_rubrique} :`, error.message);
                return null;
            }
        })
    );

    const tableauFinal = results.reduce((acc, r) => {
        if (!acc[r.id_rubrique]) acc[r.id_rubrique] = { montantbrut: 0, montantamort: 0 };
        acc[r.id_rubrique].montantbrut += r.montantbrut;
        acc[r.id_rubrique].montantamort += r.montantamort;
        return acc;
    }, {});

    const tableauRubrique = Object.entries(tableauFinal).map(([id_rubrique, vals]) => {
        const rubriqueExterne = rubriqueData.find(r => r.id_rubrique.toString() === id_rubrique);

        return {
            id_rubrique,
            montantbrut: Number(vals.montantbrut.toFixed(2)),
            montantamort: Number(vals.montantamort.toFixed(2)),
            montantnet: Number((vals.montantbrut - vals.montantamort).toFixed(2)),
            montantnetn1: rubriqueExterne ? Number(rubriqueExterne.montantnetn1 || 0) : 0
        };
    });

    const merged = [...tableauRubrique, ...resultatAdjustements];

    const tableauComplet = Object.values(
        merged.reduce((acc, item) => {
            const id = item.id_rubrique.toString();
            if (!acc[id]) acc[id] = { id_rubrique: id, montantbrut: 0, montantamort: 0, montantnetn1: 0 };

            acc[id].montantbrut += item.montantbrut || 0;
            acc[id].montantamort += item.montantamort || 0;
            acc[id].montantnetn1 += item.montantnetn1 != null ? Number(item.montantnetn1) : 0;

            return acc;
        }, {})
    ).map(r => ({
        ...r,
        montantnet: Number((r.montantbrut - r.montantamort).toFixed(2)),
    }));

    const tableauCompletCalculed = tableauComplet.map(r => {
        const variation = Number((r.montantnet - r.montantnetn1).toFixed(2));
        const pourcentagevariation = r.montantnetn1
            ? Number(((variation / r.montantnetn1) * 100).toFixed(2))
            : 0;

        return {
            ...r,
            variation,
            pourcentagevariation,
        };
    });

    return tableauCompletCalculed;
};

const calculateTotal = async (id_dossier, id_compte, id_exercice, id_etat, tableauFinalRubrique) => {
    const rubriqueDataTotal = (await rubriquesExternes.findAll({
        where: {
            id_dossier,
            id_compte,
            id_exercice,
            id_etat,
            active: true,
            type: { [Op.in]: ['TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL'] }
        },
        order: [['ordre', 'ASC']]
    })).map(r => ({
        ...r.toJSON(),
        id: Number(r.id),
        id_compte: Number(r.id_compte),
        id_dossier: Number(r.id_dossier),
        id_exercice: Number(r.id_exercice),
    }));

    const idRubriqueListTotal = [...new Set(rubriqueDataTotal.map(val => val.id_rubrique))];
    const idRubriqueRubriqueActifData = (await compteRubriquesExternes.findAll({
        where: {
            id_dossier,
            id_compte,
            id_exercice,
            id_etat,
            active: true,
            id_rubrique: idRubriqueListTotal
        }
    })).map(r => ({
        ...r.toJSON(),
        id: Number(r.id),
        id_compte: Number(r.id_compte),
        id_dossier: Number(r.id_dossier),
        id_exercice: Number(r.id_exercice),
    }));

    const typeOrder = { 'TOTAL SOUS-RUBRIQUES': 1, 'TOTAL': 2, 'SOUS-TOTAL': 3 };
    const sortedTotalData = [...rubriqueDataTotal].sort((a, b) => {
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        return Number(a.ordre) - Number(b.ordre);
    });

    const totalIds = sortedTotalData.map(r => r.id_rubrique.toString());

    const valueMap = Object.fromEntries(
        tableauFinalRubrique.map(item => [
            item.id_rubrique.toString(),
            {
                montantbrut: item.montantbrut || 0,
                montantamort: item.montantamort || 0,
                variation: item.variation || 0,
                pourcentagevariation: item.pourcentagevariation || 0
            }
        ])
    );

    for (const totalId of totalIds) {
        if (!valueMap[totalId]) valueMap[totalId] = { montantbrut: 0, montantamort: 0, variation: 0, pourcentagevariation: 0 };
    }

    const computedTotals = new Set();
    let progress = true;

    while (progress) {
        progress = false;

        for (const totalId of totalIds) {
            if (computedTotals.has(totalId)) continue;

            const liaisons = idRubriqueRubriqueActifData.filter(l => l.id_rubrique === totalId);

            let totalBrut = 0;
            let totalAmort = 0;
            let totalVariation = 0;
            let totalPourcentageVariation = 0;

            for (const liaison of liaisons) {
                const childKey = liaison.compte?.toString();
                const child = valueMap[childKey] || { montantbrut: 0, montantamort: 0, variation: 0, pourcentagevariation: 0 };

                const mult = liaison.equation === "SOUSTRACTIF" ? -1 : 1;
                totalBrut += (child.montantbrut || 0) * mult;
                totalAmort += (child.montantamort || 0) * mult;
                totalVariation += (child.variation || 0) * mult;
                totalPourcentageVariation += (child.pourcentagevariation || 0) * mult;
            }

            valueMap[totalId] = { montantbrut: totalBrut, montantamort: totalAmort, variation: totalVariation, pourcentagevariation: totalPourcentageVariation };
            computedTotals.add(totalId);
            progress = true;
        }
    }

    return totalIds.map(totalId => {
        const v = valueMap[totalId.toString()] || { montantbrut: 0, montantamort: 0, variation: 0, pourcentagevariation: 0 };
        const brut = Number(v.montantbrut.toFixed(2));
        const amort = Number(v.montantamort.toFixed(2));
        const variation = Number(v.variation.toFixed(2));
        const pourcentagevariation = Number(v.pourcentagevariation.toFixed(2));
        return {
            id_rubrique: totalId,
            montantbrut: brut,
            montantamort: amort,
            montantnet: Number((brut - amort).toFixed(2)),
            variation,
            pourcentagevariation
        };
    });
}

const copyNToN1 = async (id_compte, id_dossier, id_exercice, id_etat) => {
    const { id_exerciceN1 } = await recupExerciceN1(id_compte, id_dossier, id_exercice);
    if (!id_exerciceN1) return;

    const rubriqueExterneN1 = await rubriquesExternes.findAll({
        where: { id_dossier, id_exercice: id_exerciceN1, id_compte, id_etat }
    });

    if (!rubriqueExterneN1.length) return;

    const mapN1 = Object.fromEntries(rubriqueExterneN1.map(r => [r.id_rubrique, r.montantnet]));

    const rubriqueExterneN = await rubriquesExternes.findAll({
        where: { id_dossier, id_exercice, id_compte, id_etat }
    });

    await Promise.all(
        rubriqueExterneN.map(async rN => {
            const montantnetN1 = mapN1[rN.id_rubrique] || 0;
            try {
                await rubriquesExternes.update(
                    { montantnetn1: montantnetN1 },
                    { where: { id_rubrique: rN.id_rubrique, id_etat: rN.id_etat, id_exercice, id_dossier, id_compte } }
                );
            } catch (error) {
                console.error(`Erreur pour id_rubrique ${rN.id_rubrique}: ${error.message}`);
            }
        })
    );
};

const updateSoldeEtatFinancier = async (id_dossier, id_compte, id_exercice, id_etat) => {

    await copyNToN1(id_compte, id_dossier, id_exercice, id_etat);

    if (id_etat === 'SIG') {
        const tableauRubrique = await calculateRubriqueSig(id_dossier, id_compte, id_exercice, 'SIG');
        const tableauTotal = await calculateTotal(id_dossier, id_compte, id_exercice, id_etat, tableauRubrique);

        const tableauComplet = [
            ...tableauRubrique,
            ...tableauTotal
        ];

        await Promise.all(
            tableauComplet.map(async rub => {
                const { id_rubrique, montantbrut, montantamort, montantnet, variation, pourcentagevariation } = rub;
                try {
                    await rubriquesExternes.update(
                        { montantbrut, montantamort, montantnet, variation, pourcentagevariation },
                        {
                            where: {
                                id_compte,
                                id_dossier,
                                id_exercice,
                                id_etat,
                                active: true,
                                id_rubrique,
                            },
                        }
                    );
                } catch (error) {
                    console.error(`Erreur lors de la mise à jour de la rubrique ${id_rubrique}: ${error.message}`);
                }
            })
        );
    } else {
        const tableauRubrique = await calculateRubrique(id_dossier, id_compte, id_exercice, id_etat);
        const tableauTotal = await calculateTotal(id_dossier, id_compte, id_exercice, id_etat, tableauRubrique);

        const tableauComplet = [
            ...tableauRubrique,
            ...tableauTotal
        ];

        await Promise.all(
            tableauComplet.map(async rub => {
                const { id_rubrique, montantbrut, montantamort, montantnet } = rub;
                try {
                    await rubriquesExternes.update(
                        { montantbrut, montantamort, montantnet },
                        {
                            where: {
                                id_compte,
                                id_dossier,
                                id_exercice,
                                id_etat,
                                active: true,
                                id_rubrique,
                            },
                        }
                    );
                } catch (error) {
                    console.error(`Erreur lors de la mise à jour de la rubrique ${id_rubrique}: ${error.message}`);
                }
            })
        );
    }

}

const totalRubriqueExterneEVCP = async (id_compte, id_dossier, id_exercice) => {
    try {
        const {
            id_exerciceN1,
        } = await recupExerciceN1(id_compte, id_dossier, id_exercice);

        const exercice_idN1 = id_exerciceN1 ? id_exerciceN1 : 0;

        const listRubriqueTotal = (await rubriquesexternesevcps.findAll({
            where:
            {
                id_compte: id_compte,
                id_dossier: id_dossier,
                id_exercice: id_exercice,
                id_etat: 'EVCP',
                nature: { [Op.like]: 'TOTAL%' }
            },
            order: [['ordre', 'ASC']]
        })).map(r => {
            const rub = r.toJSON();

            rub.id = Number(rub.id);
            rub.id_compte = Number(rub.id_compte);
            rub.id_dossier = Number(rub.id_dossier);
            rub.id_exercice = Number(rub.id_exercice);
            rub.id_rubrique = Number(rub.id_rubrique)
            return rub;
        });

        await db.sequelize.query(`
            WITH balance_n AS (
                SELECT
                    MIN(J.COMPTEGEN) || J.COMPTEAUX AS COMPTE,
                    GREATEST(SUM(J.DEBIT) - SUM(J.CREDIT), 0) AS SOLDEDEBIT,
                    GREATEST(SUM(J.CREDIT) - SUM(J.DEBIT), 0) AS SOLDECREDIT

                FROM
                    JOURNALS J
                    LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
                WHERE
                    J.ID_DOSSIER = :id_dossier
                    AND J.ID_EXERCICE = :id_exercice
                    AND J.ID_COMPTE = :id_compte
                    AND NOT EXISTS (
                        SELECT 1
                        FROM DOSSIERPLANCOMPTABLES DPC
                        WHERE DPC.COMPTE = J.COMPTEAUX
                        AND DPC.ID_DOSSIER = :id_dossier
                        AND DPC.ID_COMPTE = :id_compte
                        AND DPC.NATURE = 'Collectif'
                    )

                GROUP BY
                    J.COMPTEAUX
            )

            UPDATE rubriquesexternesevcps as tabA SET

            resultat = (
            SELECT COALESCE(SUM(b.soldecredit - b.soldedebit),0)
                FROM balance_n AS b
                WHERE (b.compte LIKE '6%' OR b.compte LIKE '7%')
            )

            + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = '14'
            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'RESULT'),

            capitalsocial = (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = '14'
            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'CAPSOC'),

            primereserve = (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = '14'
            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'PRIME'),

            ecartdevaluation = (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = '14'
            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'ECART'),

            report_anouveau = (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = '14'
            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'REPORT')

            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
            AND tabA.id_etat = 'EVCP' AND tabA.id_rubrique = '14'
        `,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {
                if (total.nature === 'TOTAL') {
                    const listeAssociatedToRubriqueADDITIF = (await compterubriques.findAll({
                        where:
                        {
                            id_compte: id_compte,
                            id_dossier: id_dossier,
                            id_exercice: id_exercice,
                            id_etat: 'EVCP',
                            id_rubrique: Number(total.id_rubrique),
                            equation: 'ADDITIF',
                            active: true,
                        }
                    }))

                    //Liste des rubriques à calculer en SOUSTRACTIF
                    const listeAssociatedToRubriqueSOUSTRACTIF = await (compterubriques.findAll({
                        where:
                        {
                            id_compte: id_compte,
                            id_dossier: id_dossier,
                            id_exercice: id_exercice,
                            id_etat: 'EVCP',
                            id_rubrique: Number(total.id_rubrique),
                            equation: 'SOUSTRACTIF',
                            active: true
                        }
                    }))

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = 0,
                            primereserve = 0,
                            ecartdevaluation = 0,
                            resultat = 0,
                            report_anouveau = 0,
                            total_varcap = 0
                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature IN ('TOTAL') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { id_compte, id_dossier, id_exercice },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => `'${item.compte}'`);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = capitalsocial + (SELECT COALESCE(SUM(capitalsocial),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            primereserve = primereserve + (SELECT COALESCE(SUM(primereserve),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            ecartdevaluation = ecartdevaluation + (SELECT COALESCE(SUM(ecartdevaluation),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            resultat = resultat + (SELECT COALESCE(SUM(resultat),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            report_anouveau = report_anouveau + (SELECT COALESCE(SUM(report_anouveau),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP')

                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { id_compte, id_dossier, id_exercice },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );

                    }

                    //calcul le total des rubriques SOUSTRACTIF
                    if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                        const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => `'${item.compte}'`);
                        const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = capitalsocial - (SELECT COALESCE(SUM(capitalsocial),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            primereserve = primereserve - (SELECT COALESCE(SUM(primereserve),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            ecartdevaluation = ecartdevaluation - (SELECT COALESCE(SUM(ecartdevaluation),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            resultat = resultat - (SELECT COALESCE(SUM(resultat),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP'),

                            report_anouveau = report_anouveau - (SELECT COALESCE(SUM(report_anouveau),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :id_exercice
                            AND tabB.id_etat='EVCP')

                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { id_compte, id_dossier, id_exercice },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                }

                if (total.nature === 'TOTALN1') {
                    //Liste des rubriques à calculer en ADDITIF
                    const listeAssociatedToRubriqueADDITIF = (await compterubriques.findAll({
                        where:
                        {
                            id_compte: id_compte,
                            id_dossier: id_dossier,
                            id_exercice: id_exercice,
                            id_etat: 'EVCP',
                            id_rubrique: Number(total.id_rubrique),
                            equation: 'ADDITIF',
                            active: true,
                        }
                    }))

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = 0,
                            primereserve = 0,
                            ecartdevaluation = 0,
                            resultat = 0,
                            report_anouveau = 0,
                            total_varcap = 0
                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature IN ('TOTALN1') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { id_compte, id_dossier, id_exercice },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => `'${item.compte}'`);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = capitalsocial + (SELECT COALESCE(SUM(capitalsocial),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'CAPSOC'),

                            primereserve = primereserve + (SELECT COALESCE(SUM(primereserve),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP')+ (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'PRIME'),

                            ecartdevaluation = ecartdevaluation + (SELECT COALESCE(SUM(ecartdevaluation),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'ECART'),

                            resultat = resultat + (SELECT COALESCE(SUM(resultat),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'RESULT'),

                            report_anouveau = report_anouveau + (SELECT COALESCE(SUM(report_anouveau),0) FROM rubriquesexternesevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :id_compte AND tabB.id_dossier = :id_dossier AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'REPORT')

                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTALN1' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { id_compte, id_dossier, id_exercice, exercice_idN1 },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                }

                if (total.nature === 'TOTALN') {
                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = 0,
                            primereserve = 0,
                            ecartdevaluation = 0,
                            resultat = 0,
                            report_anouveau = 0,
                            total_varcap = 0
                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature IN ('TOTALN') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { id_compte, id_dossier, id_exercice },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    await db.sequelize.query(`
                            UPDATE rubriquesexternesevcps as tabA SET
                            capitalsocial = capitalsocial + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'CAPSOC'),

                            primereserve = primereserve + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'PRIME'),

                            ecartdevaluation = ecartdevaluation + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'ECART'),

                            resultat = resultat + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'RESULT'),

                            report_anouveau = report_anouveau + (SELECT COALESCE(SUM(montant),0) FROM ajustementexternes WHERE ajustementexternes.id_rubrique = tabA.id_rubrique
                            AND ajustementexternes.id_compte = :id_compte AND ajustementexternes.id_dossier = :id_dossier AND ajustementexternes.id_exercice = :id_exercice
                            AND ajustementexternes.id_etat = 'EVCP' AND ajustementexternes.nature = 'REPORT')

                            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTALN' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { id_compte, id_dossier, id_exercice, exercice_idN1 },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        await db.sequelize.query(`
            UPDATE rubriquesexternesevcps as tabA SET
            total_varcap = capitalsocial + primereserve + ecartdevaluation + resultat + report_anouveau
             
            WHERE tabA.id_compte = :id_compte AND tabA.id_dossier = :id_dossier AND tabA.id_exercice = :id_exercice
            AND tabA.id_etat = 'EVCP'
        `,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        return true;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    updateSoldeEtatFinancier,
    totalRubriqueExterneEVCP
}