const db = require("../../Models");
require('dotenv').config();
const { Op } = require('sequelize');

const codejournals = db.codejournals;
const dossierPlanComptable = db.dossierplancomptables;
const balances = db.balances;

const updateNatureBalance = async (id_compte, id_dossier, id_exercice) => {
    // Mise à jour optimisée en une seule requête SQL
    await db.sequelize.query(`
        UPDATE balances b
        SET nature = dpc.nature
        FROM dossierplancomptables dpc
        WHERE b.id_numcompte = dpc.id
        AND b.id_compte = :id_compte
        AND b.id_dossier = :id_dossier
        AND b.id_exercice = :id_exercice
        AND dpc.id_compte = :id_compte
        AND dpc.id_dossier = :id_dossier
    `, {
        replacements: { id_compte, id_dossier, id_exercice }
    });
}

const updateSold = async (compte_id, dossier_id, exercice_id, listecompte, allCompte) => {
    let stateUpdate = false;
    try {
        if (allCompte) {
            await updateNatureBalance(compte_id, dossier_id, exercice_id);
            const existingBalances = await balances.findAll({
                where: {
                    id_compte: compte_id,
                    id_dossier: dossier_id,
                    id_exercice: exercice_id
                },
                attributes: ['id_numcompte'],
            });

            const existingSet = new Set(existingBalances.map(b => Number(b.id_numcompte)));

            const listeCpt = await dossierPlanComptable.findAll({
                where: {
                    id_compte: compte_id,
                    id_dossier: dossier_id,
                }
            });

            if (listeCpt.length > 0) {
                const payload = listeCpt
                    .filter(item => !existingSet.has(Number(item.id)))
                    .map(item => ({
                        id_compte: item.id_compte,
                        id_dossier: item.id_dossier,
                        id_exercice: exercice_id,
                        id_numcompte: item.id,
                        id_numcomptecentr: item.baseaux_id,
                        nature: item.nature,
                    }));

                if (payload.length > 0) {
                    await balances.bulkCreate(payload);
                }
            }

            //récupérer la liste des codes journaux de trésoreries pour reconstituer la balance des tréso
            const listCodeJournauxTreso = await codejournals.findAll({
                where:
                {
                    id_compte: compte_id,
                    id_dossier: dossier_id,
                    type: { [Op.in]: ['BANQUE', 'CAISSE'] }
                }
            });

            //mettre à jour la balance tréso s'il y a des codes jouranaux de trésorerie
            if (listCodeJournauxTreso.length > 0) {
                const arrayListCodeJnl = listCodeJournauxTreso.map(item => item.id);
                const inClauseCodeJnl = `(${arrayListCodeJnl.join(',')})`;

                await db.sequelize.query(`
                UPDATE balances SET
                    mvtdebittreso = ROUND(
                        (SELECT COALESCE(SUM(debit), 0)::numeric 
                        FROM journals 
                        WHERE journals.id_numcpt = balances.id_numcompte
                        AND journals.id_compte = :compte_id
                        AND journals.id_dossier = :dossier_id
                        AND journals.id_exercice = :exercice_id
                        AND journals.id_journal IN ${inClauseCodeJnl}), 2
                    ),
                    mvtcredittreso = ROUND(
                        (SELECT COALESCE(SUM(credit), 0)::numeric 
                        FROM journals 
                        WHERE journals.id_numcpt = balances.id_numcompte
                        AND journals.id_compte = :compte_id
                        AND journals.id_dossier = :dossier_id
                        AND journals.id_exercice = :exercice_id
                        AND journals.id_journal IN ${inClauseCodeJnl}), 2
                    )
                WHERE balances.id_compte = :compte_id 
                AND balances.id_dossier = :dossier_id 
                AND balances.id_exercice = :exercice_id
            `,
                    {
                        replacements: { compte_id, dossier_id, exercice_id },
                        type: db.Sequelize.QueryTypes.UPDATE
                    });
            }

            await db.sequelize.query(`
                UPDATE balances SET
                    mvtdebit = ROUND(
                        (SELECT COALESCE(SUM(debit), 0)::numeric 
                        FROM journals 
                        WHERE journals.id_numcpt = balances.id_numcompte
                        AND journals.id_compte = :compte_id
                        AND journals.id_dossier = :dossier_id
                        AND journals.id_exercice = :exercice_id), 2
                    ),
                    mvtcredit = ROUND(
                        (SELECT COALESCE(SUM(credit), 0)::numeric 
                        FROM journals 
                        WHERE journals.id_numcpt = balances.id_numcompte
                        AND journals.id_compte = :compte_id
                        AND journals.id_dossier = :dossier_id
                        AND journals.id_exercice = :exercice_id), 2
                    )
                WHERE balances.id_compte = :compte_id 
                AND balances.id_dossier = :dossier_id 
                AND balances.id_exercice = :exercice_id
            `,
                {
                    replacements: { compte_id, dossier_id, exercice_id },
                    type: db.Sequelize.QueryTypes.UPDATE
                });

            await db.sequelize.query(`
                UPDATE balances SET
                    mvtdebit = ROUND(
                        (SELECT COALESCE(SUM(debit), 0)::numeric 
                        FROM journals 
                        WHERE journals.id_numcptcentralise = balances.id_numcompte
                        AND journals.id_compte = :compte_id
                        AND journals.id_dossier = :dossier_id
                        AND journals.id_exercice = :exercice_id), 2
                    ),
                    mvtcredit = ROUND(
                        (SELECT COALESCE(SUM(credit), 0)::numeric 
                        FROM journals 
                        WHERE journals.id_numcptcentralise = balances.id_numcompte
                        AND journals.id_compte = :compte_id
                        AND journals.id_dossier = :dossier_id
                        AND journals.id_exercice = :exercice_id), 2
                    )
                WHERE balances.id_compte = :compte_id 
                AND balances.id_dossier = :dossier_id 
                AND balances.id_exercice = :exercice_id
                AND nature = 'Collectif'
            `,
                {
                    replacements: { compte_id, dossier_id, exercice_id },
                    type: db.Sequelize.QueryTypes.UPDATE
                });

            await db.sequelize.query(`
                UPDATE balances SET
                    soldedebit = ROUND(GREATEST(mvtdebit - mvtcredit, 0)::numeric, 2),
                    soldecredit = ROUND(GREATEST(mvtcredit - mvtdebit, 0)::numeric, 2),
                    valeur = ROUND(ABS(mvtcredit - mvtdebit)::numeric, 2)
                WHERE balances.id_compte = :compte_id 
                AND balances.id_dossier = :dossier_id 
                AND balances.id_exercice = :exercice_id
            `,
                {
                    replacements: { compte_id, dossier_id, exercice_id },
                    type: db.Sequelize.QueryTypes.UPDATE
                });

            await db.sequelize.query(`
                UPDATE balances SET
                    soldedebittreso = ROUND(GREATEST(mvtdebittreso - mvtcredittreso, 0)::numeric, 2),
                    soldecredittreso = ROUND(GREATEST(mvtcredittreso - mvtdebittreso, 0)::numeric, 2),
                    valeurtreso = ROUND(ABS(mvtcredittreso - mvtdebittreso)::numeric, 2)
                WHERE balances.id_compte = :compte_id 
                AND balances.id_dossier = :dossier_id 
                AND balances.id_exercice = :exercice_id
            `,
                {
                    replacements: { compte_id, dossier_id, exercice_id },
                    type: db.Sequelize.QueryTypes.UPDATE
                });

            const compteCollectif = await dossierPlanComptable.findAll({
                where: {
                    id_compte: compte_id,
                    id_dossier: dossier_id,
                    nature: 'Collectif'
                }
            });

            if (compteCollectif.length > 0) {

                const compteCollectifId = [...new Set(compteCollectif.map(val => Number(val.id)))];

                for (const id_collectif of compteCollectifId) {

                    const compteAuxilliaire = await dossierPlanComptable.findAll({
                        where: {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            nature: 'Aux',
                            baseaux_id: id_collectif
                        }
                    });

                    if (compteAuxilliaire.length > 0) {

                        const compteAuxId = [...new Set(compteAuxilliaire.map(val => Number(val.id)))];

                        const balanceCompteAux = await balances.findAll({
                            where: {
                                id_numcompte: { [Op.in]: compteAuxId }
                            }
                        });

                        if (balanceCompteAux.length > 0) {

                            const totals = balanceCompteAux.reduce((acc, val) => {
                                acc.total_mvtdebit += Number(val.mvtdebit) || 0;
                                acc.total_mvtcredit += Number(val.mvtcredit) || 0;
                                acc.total_soldedebit += Number(val.soldedebit) || 0;
                                acc.total_soldecredit += Number(val.soldecredit) || 0;
                                acc.total_valeur += Number(val.valeur) || 0;
                                return acc;
                            }, {
                                total_mvtdebit: 0,
                                total_mvtcredit: 0,
                                total_soldedebit: 0,
                                total_soldecredit: 0,
                                total_valeur: 0
                            });

                            await balances.update(
                                {
                                    mvtdebit: totals.total_mvtdebit,
                                    mvtcredit: totals.total_mvtcredit,
                                    soldedebit: totals.total_soldedebit,
                                    soldecredit: totals.total_soldecredit,
                                    valeur: totals.total_valeur
                                },
                                {
                                    where: { id_numcompte: id_collectif }
                                }
                            );
                        }
                    }
                }
            }

            stateUpdate = true;
        }
        return stateUpdate;
    } catch (error) {
        stateUpdate = true;
        console.error("Erreur dans updateSold :", error.message);
        return stateUpdate;
    }
}

module.exports = { updateSold };