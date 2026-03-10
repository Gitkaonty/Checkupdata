const db = require("../../Models");
require('dotenv').config();
const { Op } = require('sequelize');
const recupExerciceN1 = require('../Standard/recupExerciceN1');

const liassedrfs = db.liassedrfs;
const liasseevcps = db.liasseevcps;

const rubriques = db.rubriques;
const compterubriques = db.compterubriques;

const totalRubriqueBilan = async (compte_id, dossier_id, exercice_id) => {
    try {
        //mettre à jour les lignes totaux
        const listRubriqueTotal = await rubriques.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'BILAN',
                nature: 'TOTAL'
            },
            order: [['ordre', 'ASC']]
        });

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {
                const listeAssociatedToRubrique = await compterubriques.findAll({
                    where:
                    {
                        id_compte: compte_id,
                        id_dossier: dossier_id,
                        id_exercice: exercice_id,
                        id_etat: 'BILAN',
                        id_rubrique: total.id_rubrique,
                        //nature: 'BRUT',
                        active: true
                    }
                });

                if (listeAssociatedToRubrique.length >= 1) {
                    const arrayList = listeAssociatedToRubrique.map(item => item.compte);
                    const inClause = `(${arrayList.join(',')})`;

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClause}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='BILAN'),

                        montantnet = (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClause}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='BILAN'),

                        montantamort = (SELECT COALESCE(SUM(montantamort),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClause}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='BILAN')

                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'BILAN' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        return true;

    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueCRN = async (compte_id, dossier_id, exercice_id) => {
    try {
        //mettre à jour les lignes totaux
        const listRubriqueTotal = await rubriques.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'CRN',
                nature: 'TOTAL'
            },
            order: [['ordre', 'ASC']]
        });

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {
                //Liste des rubriques à calculer en ADDITIF
                const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                    where:
                    {
                        id_compte: compte_id,
                        id_dossier: dossier_id,
                        id_exercice: exercice_id,
                        id_etat: 'CRN',
                        id_rubrique: total.id_rubrique,
                        equation: 'ADDITIF',
                        active: true,

                    }
                });

                //Liste des rubriques à calculer en SOUSTRACTIF
                const listeAssociatedToRubriqueSOUSTRACTIF = await compterubriques.findAll({
                    where:
                    {
                        id_compte: compte_id,
                        id_dossier: dossier_id,
                        id_exercice: exercice_id,
                        id_etat: 'CRN',
                        id_rubrique: total.id_rubrique,
                        equation: 'SOUSTRACTIF',
                        active: true
                    }
                });

                //réinitialiser à 0 la valeur 
                await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = 0,
                        montantnet = 0
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'CRN' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                    {
                        replacements: { compte_id, dossier_id, exercice_id },
                        type: db.Sequelize.QueryTypes.UPDATE
                    }
                );

                //calcul le total des rubriques ADDITIFS
                if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                    const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                    const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = montantbrut + (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRN'),

                        montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRN')
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'CRN' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }

                //calcul le total des rubriques SOUSTRACTIF
                if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                    const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => item.compte);
                    const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = montantbrut - (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRN'),

                        montantnet = montantnet - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRN')
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'CRN' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        return true;

    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueCRF = async (compte_id, dossier_id, exercice_id) => {
    try {
        //mettre à jour les lignes totaux
        const listRubriqueTotal = await rubriques.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'CRF',
                nature: 'TOTAL'
            },
            order: [['ordre', 'ASC']]
        });

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {
                //Liste des rubriques à calculer en ADDITIF
                const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                    where:
                    {
                        id_compte: compte_id,
                        id_dossier: dossier_id,
                        id_exercice: exercice_id,
                        id_etat: 'CRF',
                        id_rubrique: total.id_rubrique,
                        equation: 'ADDITIF',
                        active: true,

                    }
                });

                //Liste des rubriques à calculer en SOUSTRACTIF
                const listeAssociatedToRubriqueSOUSTRACTIF = await compterubriques.findAll({
                    where:
                    {
                        id_compte: compte_id,
                        id_dossier: dossier_id,
                        id_exercice: exercice_id,
                        id_etat: 'CRF',
                        id_rubrique: total.id_rubrique,
                        equation: 'SOUSTRACTIF',
                        active: true
                    }
                });

                //réinitialiser à 0 la valeur 
                await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = 0,
                        montantnet = 0
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'CRF' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                    {
                        replacements: { compte_id, dossier_id, exercice_id },
                        type: db.Sequelize.QueryTypes.UPDATE
                    }
                );

                //calcul le total des rubriques ADDITIFS
                if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                    const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                    const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = montantbrut + (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRF'),

                        montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRF')
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'CRF' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }

                //calcul le total des rubriques SOUSTRACTIF
                if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                    const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => item.compte);
                    const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = montantbrut - (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRF'),

                        montantnet = montantnet - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='CRF')
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'CRF' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                    `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        return true;

    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueTFTD = async (compte_id, dossier_id, exercice_id) => {
    try {
        //récuperer les informations sur l'exercice N-1
        const {
            id_exerciceN1,
            date_debutN1,
            date_finN1,
            libelleExerciceN1,
            rangN1,
            clotureN1
        } = await recupExerciceN1.recupInfos(compte_id, dossier_id, exercice_id);

        const exercice_idN1 = id_exerciceN1 ? id_exerciceN1 : 0;

        //mettre à jour les lignes totaux
        const listRubriqueTotal = await rubriques.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'TFTD',
                nature: { [Op.like]: 'TOTAL%' }
            },
            order: [['ordre', 'ASC']]
        });

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {

                if (total.nature === 'TOTAL') {
                    //Liste des rubriques à calculer en ADDITIF
                    const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'TFTD',
                            id_rubrique: total.id_rubrique,
                            equation: 'ADDITIF',
                            active: true,
                        }
                    });

                    //Liste des rubriques à calculer en SOUSTRACTIF
                    const listeAssociatedToRubriqueSOUSTRACTIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'TFTD',
                            id_rubrique: total.id_rubrique,
                            equation: 'SOUSTRACTIF',
                            active: true
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = 0,
                            montantnet = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = montantbrut + (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTD'),

                            montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTD')
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }

                    //calcul le total des rubriques SOUSTRACTIF
                    if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                        const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => item.compte);
                        const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = montantbrut - (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTD'),

                            montantnet = montantnet - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTD')
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                } else if (total.nature === 'TOTALMIXTE') {
                    //Liste des rubriques à calculer
                    const listeAssociatedToRubrique = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'TFTD',
                            id_rubrique: total.id_rubrique,
                            active: true,
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = 0,
                            montantnet = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTD' AND tabA.nature IN ('TOTALMIXTE') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    if (listeAssociatedToRubrique.length > 0) {
                        for (let rubrik of listeAssociatedToRubrique) {
                            let totalValue = 0;

                            if (rubrik.nature === 'BILAN') {
                                if (rubrik.exercice === 'N1') {
                                    if (rubrik.equation === 'ADDITIF') {

                                        await db.sequelize.query(`
                                            UPDATE rubriques as tabA SET
                                            montantbrut = montantbrut + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                                            AND tabB.id_etat='BILAN'),

                                            montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                                            AND tabB.id_etat='BILAN')
                                            
                                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                            `,
                                            {
                                                replacements: { compte_id, dossier_id, exercice_id, exercice_idN1 },
                                                type: db.Sequelize.QueryTypes.UPDATE
                                            }
                                        );
                                    } else if (rubrik.equation === 'SOUSTRACTIF') {
                                        await db.sequelize.query(`
                                            UPDATE rubriques as tabA SET
                                            montantbrut = montantbrut - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                                            AND tabB.id_etat='BILAN'),

                                            montantnet = montantnet - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                                            AND tabB.id_etat='BILAN')

                                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                            `,
                                            {
                                                replacements: { compte_id, dossier_id, exercice_id, exercice_idN1 },
                                                type: db.Sequelize.QueryTypes.UPDATE
                                            }
                                        );
                                    }

                                } else if (rubrik.exercice === 'N') {
                                    if (rubrik.equation === 'ADDITIF') {
                                        await db.sequelize.query(`
                                            UPDATE rubriques as tabA SET
                                            montantbrut = montantbrut + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                                            AND tabB.id_etat='BILAN'),

                                            montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                                            AND tabB.id_etat='BILAN')

                                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                            `,
                                            {
                                                replacements: { compte_id, dossier_id, exercice_id, exercice_idN1 },
                                                type: db.Sequelize.QueryTypes.UPDATE
                                            }
                                        );
                                    } else if (rubrik.equation === 'SOUSTRACTIF') {
                                        await db.sequelize.query(`
                                            UPDATE rubriques as tabA SET
                                            montantbrut = montantbrut - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                                            AND tabB.id_etat='BILAN'),

                                            montantnet = montantnet - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                            WHERE tabB.id_rubrique = ${rubrik.compte}
                                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                                            AND tabB.id_etat='BILAN')

                                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                            AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                            `,
                                            {
                                                replacements: { compte_id, dossier_id, exercice_id },
                                                type: db.Sequelize.QueryTypes.UPDATE
                                            }
                                        );
                                    }
                                }
                            }
                        }
                    }

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = montantbrut
                        + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                        AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                        AND ajustements.id_etat = 'TFTD' AND ajustements.nature = 'BRUT'),

                        montantnet = montantnet
                        + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                        AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                        AND ajustements.id_etat = 'TFTD' AND ajustements.nature = 'BRUT')

                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'TFTD' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        return true;

    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueTFTI = async (compte_id, dossier_id, exercice_id) => {
    try {
        //récuperer les informations sur l'exercice N-1
        const {
            id_exerciceN1,
            date_debutN1,
            date_finN1,
            libelleExerciceN1,
            rangN1,
            clotureN1
        } = await recupExerciceN1.recupInfos(compte_id, dossier_id, exercice_id);

        const exercice_idN1 = id_exerciceN1 ? id_exerciceN1 : 0;

        //mettre à jour les lignes totaux
        const listRubriqueTotal = await rubriques.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'TFTI',
                nature: { [Op.like]: 'TOTAL%' }
            },
            order: [['ordre', 'ASC']]
        });

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {

                if (total.nature === 'TOTAL') {
                    //Liste des rubriques à calculer en ADDITIF
                    const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'TFTI',
                            id_rubrique: total.id_rubrique,
                            equation: 'ADDITIF',
                            active: true,
                        }
                    });

                    //Liste des rubriques à calculer en SOUSTRACTIF
                    const listeAssociatedToRubriqueSOUSTRACTIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'TFTI',
                            id_rubrique: total.id_rubrique,
                            equation: 'SOUSTRACTIF',
                            active: true
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = 0,
                            montantnet = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTI' AND tabA.nature IN ('TOTAL') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = montantbrut + (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTI'),

                            montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTI')
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTI' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }

                    //calcul le total des rubriques SOUSTRACTIF
                    if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                        const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => item.compte);
                        const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = montantbrut - (SELECT COALESCE(SUM(montantbrut),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTI'),

                            montantnet = montantnet - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='TFTI')
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTI' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                } else if (total.nature === 'TOTALMIXTE') {
                    //Liste des rubriques à calculer
                    const listeAssociatedToRubrique = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'TFTI',
                            id_rubrique: total.id_rubrique,
                            active: true,
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE rubriques as tabA SET
                            montantbrut = 0,
                            montantnet = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'TFTI' AND tabA.nature IN ('TOTALMIXTE') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    if (listeAssociatedToRubrique.length > 0) {
                        for (let rubrik of listeAssociatedToRubrique) {
                            let exerciceAnterieur = 0;
                            let equation = '';
                            let variation = '';

                            exerciceAnterieur = rubrik.exercice === 'N'
                                ? exercice_id
                                : exercice_idN1;
                            equation = rubrik.equation === 'ADDITIF' ? '+' : '-';

                            if (rubrik.nature === 'BILAN_ACTIF_VAR') {
                                await db.sequelize.query(`
                                    UPDATE rubriques as tabA SET
                                    montantbrut = montantbrut + (SELECT COALESCE(SUM(montantnetn1),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN')
                                    - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN'),
                                   
                                    montantnet = montantnet + (SELECT COALESCE(SUM(montantnetn1),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN')
                                    - (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN')

                                    WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                    AND tabA.id_etat = 'TFTI' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                    `,
                                    {
                                        replacements: { compte_id, dossier_id, exercice_id, exerciceAnterieur },
                                        type: db.Sequelize.QueryTypes.UPDATE
                                    }
                                );
                            } else if (rubrik.nature === 'BILAN_PASSIF_VAR') {
                                await db.sequelize.query(`
                                    UPDATE rubriques as tabA SET
                                    montantbrut = montantbrut + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN')
                                    - (SELECT COALESCE(SUM(montantnetn1),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN'),
                                   
                                    montantnet = montantnet + (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN')
                                    - (SELECT COALESCE(SUM(montantnetn1),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='BILAN')
                                    
                                    WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                    AND tabA.id_etat = 'TFTI' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                    `,
                                    {
                                        replacements: { compte_id, dossier_id, exercice_id, exerciceAnterieur },
                                        type: db.Sequelize.QueryTypes.UPDATE
                                    }
                                );
                            } else {
                                await db.sequelize.query(`
                                    UPDATE rubriques as tabA SET
                                    montantbrut = montantbrut ${equation} (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='${rubrik.nature}'),

                                    montantnet = montantnet ${equation} (SELECT COALESCE(SUM(montantnet),0) FROM rubriques as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='${rubrik.nature}')
                                    
                                    WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                    AND tabA.id_etat = 'TFTI' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                                    `,
                                    {
                                        replacements: { compte_id, dossier_id, exercice_id, exerciceAnterieur },
                                        type: db.Sequelize.QueryTypes.UPDATE
                                    }
                                );
                            }

                        }
                    }

                    await db.sequelize.query(`
                        UPDATE rubriques as tabA SET
                        montantbrut = montantbrut
                        + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                        AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                        AND ajustements.id_etat = 'TFTI' AND ajustements.nature = 'BRUT'),

                        montantnet = montantnet
                        + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                        AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                        AND ajustements.id_etat = 'TFTI' AND ajustements.nature = 'BRUT')

                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'TFTI' AND tabA.nature='TOTALMIXTE' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        return true;

    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueEVCP = async (compte_id, dossier_id, exercice_id) => {
    try {
        //récuperer les informations sur l'exercice N-1
        const {
            id_exerciceN1,
            date_debutN1,
            date_finN1,
            libelleExerciceN1,
            rangN1,
            clotureN1
        } = await recupExerciceN1.recupInfos(compte_id, dossier_id, exercice_id);

        const exercice_idN1 = id_exerciceN1 ? id_exerciceN1 : 0;

        //mettre à jour les lignes totaux
        const listRubriqueTotal = await liasseevcps.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'EVCP',
                nature: { [Op.like]: 'TOTAL%' }
            },
            order: [['ordre', 'ASC']]
        });

        //copie du résultat
        await db.sequelize.query(`
            -- BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE BALANCE
            WITH RECURSIVE
            balance_n AS (
                SELECT
                MIN(J.COMPTEGEN) || J.COMPTEAUX AS COMPTE,
                GREATEST(SUM(J.DEBIT) - SUM(J.CREDIT), 0) AS SOLDEDEBIT,
                GREATEST(SUM(J.CREDIT) - SUM(J.DEBIT), 0) AS SOLDECREDIT,
                GREATEST(
                    SUM(J.DEBIT) FILTER (
                        WHERE
                            CJ.TYPE IN ('BANQUE', 'CAISSE')
                    ) - SUM(J.CREDIT) FILTER (
                        WHERE
                            CJ.TYPE IN ('BANQUE', 'CAISSE')
                    ),
                    0
                ) AS SOLDEDEBITTRESO,
                GREATEST(
                    SUM(J.CREDIT) FILTER (
                        WHERE
                            CJ.TYPE IN ('BANQUE', 'CAISSE')
                    ) - SUM(J.DEBIT) FILTER (
                        WHERE
                            CJ.TYPE IN ('BANQUE', 'CAISSE')
                    ),
                    0
                ) AS SOLDECREDITTRESO
            FROM
                JOURNALS J
                LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
            WHERE
                J.ID_DOSSIER = :dossier_id
                AND J.ID_EXERCICE = :exercice_id
                AND J.ID_COMPTE = :compte_id
                AND NOT EXISTS (
                    SELECT 1
                    FROM DOSSIERPLANCOMPTABLES DPC
                    WHERE DPC.COMPTE = J.COMPTEAUX
                    AND DPC.ID_DOSSIER = :dossier_id
                    AND DPC.ID_COMPTE = :compte_id
                    AND DPC.NATURE = 'Collectif'
                )

            GROUP BY
                J.COMPTEAUX
            ),

            COMPTE_RUBRIQUES_BILAN_A_P_N AS (
                SELECT DISTINCT ID_RUBRIQUE
                FROM COMPTERUBRIQUES
                WHERE ID_COMPTE = :compte_id
                AND ID_DOSSIER = :dossier_id
                AND ID_EXERCICE = :exercice_id
                AND ID_ETAT = 'BILAN'
                AND ACTIVE = true

                UNION

                SELECT DISTINCT ID_RUBRIQUE
                FROM AJUSTEMENTS
                WHERE ID_COMPTE = :compte_id
                AND ID_DOSSIER = :dossier_id
                AND ID_EXERCICE = :exercice_id
                AND ID_ETAT = 'BILAN'
            ),

            ajustements_agreges_bilan_a_p_n AS (
                SELECT
                    ID_RUBRIQUE,
                    NATURE,
                    SUM(MONTANT) AS montant
                FROM AJUSTEMENTS
                WHERE
                    ID_COMPTE = :compte_id
                    AND ID_DOSSIER = :dossier_id
                    AND ID_EXERCICE = :exercice_id
                    AND ID_ETAT = 'BILAN'
                GROUP BY ID_RUBRIQUE, NATURE
            ),

            ligne_detail_bilan_a_p_n AS (
                SELECT
                    CR.ID_RUBRIQUE,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND b.SOLDEDEBIT <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND b.SOLDECREDIT <> 0)
                                )
                                THEN
                                    (
                                        CASE CR2.SENSCALCUL
                                            WHEN 'D-C' THEN b.SOLDEDEBIT - b.SOLDECREDIT
                                            WHEN 'C-D' THEN b.SOLDECREDIT - b.SOLDEDEBIT
                                            ELSE 0
                                        END
                                    )
                                    * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                ELSE 0
                            END
                        ),0
                    )
                    + COALESCE(aj_brut.montant,0) AS MONTANTBRUT,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND b.SOLDEDEBIT <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND b.SOLDECREDIT <> 0)
                                )
                                THEN
                                    (
                                        CASE CR2.SENSCALCUL
                                            WHEN 'D-C' THEN b.SOLDEDEBIT - b.SOLDECREDIT
                                            WHEN 'C-D' THEN b.SOLDECREDIT - b.SOLDEDEBIT
                                            ELSE 0
                                        END
                                    )
                                    * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                ELSE 0
                            END
                        ),0
                    )
                    + COALESCE(aj_amort.montant,0) AS MONTANTAMORT

                FROM COMPTE_RUBRIQUES_BILAN_A_P_N CR

                LEFT JOIN COMPTERUBRIQUES CR2
                    ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND CR2.ID_COMPTE = :compte_id
                    AND CR2.ID_DOSSIER = :dossier_id
                    AND CR2.ID_EXERCICE = :exercice_id
                    AND CR2.ID_ETAT = 'BILAN'
                    AND CR2.ACTIVE = true

                LEFT JOIN balance_n b
                    ON CR2.COMPTE IS NOT NULL
                    AND b.COMPTE LIKE CR2.COMPTE || '%'

                LEFT JOIN ajustements_agreges_bilan_a_p_n aj_brut
                    ON aj_brut.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND aj_brut.NATURE = 'BRUT'

                LEFT JOIN ajustements_agreges_bilan_a_p_n aj_amort
                    ON aj_amort.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND aj_amort.NATURE = 'AMORT'

                GROUP BY
                    CR.ID_RUBRIQUE,
                    aj_brut.montant,
                    aj_amort.montant
            ),

            rubrique_unique_bilan_a_p_n AS (
                SELECT DISTINCT ON (ID_RUBRIQUE) *
                FROM rubriques
                WHERE ID_COMPTE = :compte_id
                    AND ID_DOSSIER = :dossier_id
                    AND ID_EXERCICE = :exercice_id
                    AND ID_ETAT = 'BILAN'
                    AND SUBTABLE IN (1, 2)
                ORDER BY ID_RUBRIQUE, ORDRE
            ),

            compterubriques_unique_bilan_a_p_n AS (
                SELECT
                    cr.ID_RUBRIQUE,
                    cr.ID_COMPTE,
                    cr.ID_DOSSIER,
                    cr.ID_EXERCICE,
                    json_agg(
                        json_build_object(
                            'compte', cr.COMPTE::int,
                            'equation', cr.EQUATION
                        )
                    ) AS comptes,
                    cr.ACTIVE,
                    cr.ID_ETAT
                FROM compterubriques cr
                JOIN rubrique_unique_bilan_a_p_n r
                    ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                    AND r.ID_COMPTE = cr.ID_COMPTE
                    AND r.ID_DOSSIER = cr.ID_DOSSIER
                    AND r.ID_EXERCICE = cr.ID_EXERCICE
                WHERE 
                    cr.ACTIVE = TRUE
                    AND cr.ID_ETAT = 'BILAN'
                GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
            ),

            liens_total_bilan_a_p_n AS (
                SELECT
                    cr.ID_RUBRIQUE::int AS ID_TOTAL,
                    (elem ->> 'compte')::int AS ID_ENFANT,
                    elem ->> 'equation' AS EQUATION
                FROM compterubriques_unique_bilan_a_p_n cr
                JOIN rubrique_unique_bilan_a_p_n r
                    ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
                WHERE r.NATURE = 'TOTAL'
            ),

            total_recursive_bilan_a_p_n AS (
                SELECT
                    ld.ID_RUBRIQUE,
                    ld.MONTANTBRUT,
                    ld.MONTANTAMORT
                FROM ligne_detail_bilan_a_p_n ld
                JOIN rubriques r
                    ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
                WHERE 
                    r.ID_COMPTE = :compte_id
                    AND r.ID_DOSSIER = :dossier_id
                    AND r.ID_EXERCICE = :exercice_id
                    AND r.ID_ETAT = 'BILAN'
                    AND SUBTABLE IN (1, 2)
                    AND r.NATURE NOT IN ('TOTAL', 'TITRE')

                UNION ALL

                SELECT
                    lt.ID_TOTAL AS ID_RUBRIQUE,
                    tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                    tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
                FROM total_recursive_bilan_a_p_n tr
                JOIN liens_total_bilan_a_p_n lt
                    ON lt.ID_ENFANT = tr.ID_RUBRIQUE
            ),

            BILAN_A_P_N AS (
                SELECT
                    r.ID_RUBRIQUE,
                    r.NOTE,
                    r.LIBELLE,
                    r.NATURE,
                    r.ORDRE,
                    r.NIVEAU,
                    r.SUBTABLE,
                    r.ID_ETAT,
                    COALESCE(SUM(tr.MONTANTBRUT), 0) AS MONTANTBRUT,
                    COALESCE(SUM(tr.MONTANTAMORT), 0) AS MONTANTAMORT,
                    COALESCE(SUM(tr.MONTANTBRUT), 0) - COALESCE(SUM(tr.MONTANTAMORT), 0) AS MONTANTNET,
                    r.id AS id,
                    COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', aj.id,
                            'id_compte', aj.id_compte,
                            'id_dossier', aj.id_dossier,
                            'id_etat', aj.id_etat,
                            'id_exercice', aj.id_exercice,
                            'id_rubrique', aj.id_rubrique,
                            'montant', aj.montant,
                            'motif', aj.motif,
                            'nature', aj.nature
                        ))
                        FROM ajustements aj
                        WHERE aj.id_rubrique = r.ID_RUBRIQUE
                        AND aj.ID_ETAT = 'BILAN'
                        AND aj.ID_DOSSIER = :dossier_id
                        AND aj.ID_EXERCICE = :exercice_id
                        AND aj.ID_COMPTE = :compte_id
                    ), '[]'::json) AS ajusts
                FROM rubriquesmatrices r
                LEFT JOIN total_recursive_bilan_a_p_n tr
                    ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
                WHERE 
                    r.ID_ETAT = 'BILAN'
                    AND SUBTABLE IN (1, 2)
                GROUP BY
                    r.ID_RUBRIQUE,
                    r.NOTE,
                    r.LIBELLE,
                    r.NATURE,
                    r.ORDRE,
                    r.NIVEAU,
                    r.SUBTABLE,
                    r.id,
                    r.ID_ETAT
                ORDER BY r.ORDRE
            )

            UPDATE liasseevcps AS tabA
            SET
                resultat = COALESCE(b.MONTANTNET,0)
                        + (SELECT COALESCE(SUM(montant),0) 
                            FROM ajustements 
                            WHERE id_rubrique = 14
                                AND id_compte = :compte_id
                                AND id_dossier = :dossier_id
                                AND id_exercice = :exercice_id
                                AND id_etat = 'EVCP'
                                AND nature = 'RESULT'),
                capitalsocial = (SELECT COALESCE(SUM(montant),0) 
                                FROM ajustements 
                                WHERE id_rubrique = 14
                                AND id_compte = :compte_id
                                AND id_dossier = :dossier_id
                                AND id_exercice = :exercice_id
                                AND id_etat = 'EVCP'
                                AND nature = 'CAPSOC'),
                primereserve = (SELECT COALESCE(SUM(montant),0) 
                                FROM ajustements 
                                WHERE id_rubrique = 14
                                AND id_compte = :compte_id
                                AND id_dossier = :dossier_id
                                AND id_exercice = :exercice_id
                                AND id_etat = 'EVCP'
                                AND nature = 'PRIME'),
                ecartdevaluation = (SELECT COALESCE(SUM(montant),0) 
                                    FROM ajustements 
                                    WHERE id_rubrique = 14
                                    AND id_compte = :compte_id
                                    AND id_dossier = :dossier_id
                                    AND id_exercice = :exercice_id
                                    AND id_etat = 'EVCP'
                                    AND nature = 'ECART'),
                report_anouveau = (SELECT COALESCE(SUM(montant),0) 
                                FROM ajustements 
                                WHERE id_rubrique = 14
                                    AND id_compte = :compte_id
                                    AND id_dossier = :dossier_id
                                    AND id_exercice = :exercice_id
                                    AND id_etat = 'EVCP'
                                    AND nature = 'REPORT')
            FROM BILAN_A_P_N b
            WHERE tabA.id_compte = :compte_id
            AND tabA.id_dossier = :dossier_id
            AND tabA.id_exercice = :exercice_id
            AND tabA.id_etat = 'EVCP'
            AND tabA.id_rubrique = 14
            AND b.ID_RUBRIQUE = 29;
        `,
            {
                replacements: { compte_id, dossier_id, exercice_id, exercice_idN1 },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {
                if (total.nature === 'TOTAL') {
                    //Liste des rubriques à calculer en ADDITIF
                    const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'EVCP',
                            id_rubrique: total.id_rubrique,
                            equation: 'ADDITIF',
                            active: true,
                        }
                    });

                    //Liste des rubriques à calculer en SOUSTRACTIF
                    const listeAssociatedToRubriqueSOUSTRACTIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'EVCP',
                            id_rubrique: total.id_rubrique,
                            equation: 'SOUSTRACTIF',
                            active: true
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = 0,
                            primereserve = 0,
                            ecartdevaluation = 0,
                            resultat = 0,
                            report_anouveau = 0,
                            total_varcap = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature IN ('TOTAL') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = capitalsocial + (SELECT COALESCE(SUM(capitalsocial),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            primereserve = primereserve + (SELECT COALESCE(SUM(primereserve),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            ecartdevaluation = ecartdevaluation + (SELECT COALESCE(SUM(ecartdevaluation),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            resultat = resultat + (SELECT COALESCE(SUM(resultat),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            report_anouveau = report_anouveau + (SELECT COALESCE(SUM(report_anouveau),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP')

                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );

                    }

                    //calcul le total des rubriques SOUSTRACTIF
                    if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                        const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => item.compte);
                        const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = capitalsocial - (SELECT COALESCE(SUM(capitalsocial),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            primereserve = primereserve - (SELECT COALESCE(SUM(primereserve),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            ecartdevaluation = ecartdevaluation - (SELECT COALESCE(SUM(ecartdevaluation),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            resultat = resultat - (SELECT COALESCE(SUM(resultat),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP'),

                            report_anouveau = report_anouveau - (SELECT COALESCE(SUM(report_anouveau),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='EVCP')

                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                }

                if (total.nature === 'TOTALN1') {
                    //Liste des rubriques à calculer en ADDITIF
                    const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'EVCP',
                            id_rubrique: total.id_rubrique,
                            equation: 'ADDITIF',
                            active: true,
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = 0,
                            primereserve = 0,
                            ecartdevaluation = 0,
                            resultat = 0,
                            report_anouveau = 0,
                            total_varcap = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature IN ('TOTALN1') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = capitalsocial + (SELECT COALESCE(SUM(capitalsocial),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'CAPSOC'),

                            primereserve = primereserve + (SELECT COALESCE(SUM(primereserve),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP')+ (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'PRIME'),

                            ecartdevaluation = ecartdevaluation + (SELECT COALESCE(SUM(ecartdevaluation),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'ECART'),

                            resultat = resultat + (SELECT COALESCE(SUM(resultat),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'RESULT'),

                            report_anouveau = report_anouveau + (SELECT COALESCE(SUM(report_anouveau),0) FROM liasseevcps as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_idN1
                            AND tabB.id_etat='EVCP') + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'REPORT')

                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTALN1' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id, exercice_idN1 },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                }

                if (total.nature === 'TOTALN') {
                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = 0,
                            primereserve = 0,
                            ecartdevaluation = 0,
                            resultat = 0,
                            report_anouveau = 0,
                            total_varcap = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature IN ('TOTALN') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    await db.sequelize.query(`
                            UPDATE liasseevcps as tabA SET
                            capitalsocial = capitalsocial + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'CAPSOC'),

                            primereserve = primereserve + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'PRIME'),

                            ecartdevaluation = ecartdevaluation + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'ECART'),

                            resultat = resultat + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'RESULT'),

                            report_anouveau = report_anouveau + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                            AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                            AND ajustements.id_etat = 'EVCP' AND ajustements.nature = 'REPORT')

                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'EVCP' AND tabA.nature='TOTALN' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id, exercice_idN1 },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        await db.sequelize.query(`
            UPDATE liasseevcps as tabA SET
            total_varcap = capitalsocial + primereserve + ecartdevaluation + resultat + report_anouveau
             
            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
            AND tabA.id_etat = 'EVCP'
        `,
            {
                replacements: { compte_id, dossier_id, exercice_id },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        return true;
    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueDRF = async (compte_id, dossier_id, exercice_id) => {
    try {
        //récuperer les informations sur l'exercice N-1
        const {
            id_exerciceN1,
            date_debutN1,
            date_finN1,
            libelleExerciceN1,
            rangN1,
            clotureN1
        } = await recupExerciceN1.recupInfos(compte_id, dossier_id, exercice_id);

        const exercice_idN1 = id_exerciceN1 ? id_exerciceN1 : 0;

        //mettre à jour les lignes totaux
        const listRubriqueTotal = await liassedrfs.findAll({
            where:
            {
                id_compte: compte_id,
                id_dossier: dossier_id,
                id_exercice: exercice_id,
                id_etat: 'DRF',
                nature: { [Op.like]: 'TOTAL%' }
            },
            order: [['ordre', 'ASC']]
        });

        if (listRubriqueTotal.length >= 1) {
            for (let total of listRubriqueTotal) {
                if (total.nature === 'TOTAL') {
                    //Liste des rubriques à calculer en ADDITIF
                    const listeAssociatedToRubriqueADDITIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'DRF',
                            id_rubrique: total.id_rubrique,
                            equation: 'ADDITIF',
                            active: true,
                        }
                    });

                    //Liste des rubriques à calculer en SOUSTRACTIF
                    const listeAssociatedToRubriqueSOUSTRACTIF = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'DRF',
                            id_rubrique: total.id_rubrique,
                            equation: 'SOUSTRACTIF',
                            active: true
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE liassedrfs as tabA SET
                            montant_brut = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'DRF' AND tabA.nature IN ('TOTAL') AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    //calcul le total des rubriques ADDITIFS
                    if (listeAssociatedToRubriqueADDITIF.length >= 1) {
                        const arrayListADDITIF = listeAssociatedToRubriqueADDITIF.map(item => item.compte);
                        const inClauseADDITIF = `(${arrayListADDITIF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE liassedrfs as tabA SET
                            montant_brut = montant_brut + (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB WHERE tabB.id_rubrique IN ${inClauseADDITIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='DRF')

                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'DRF' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );

                    }

                    //calcul le total des rubriques SOUSTRACTIF
                    if (listeAssociatedToRubriqueSOUSTRACTIF.length >= 1) {
                        const arrayListSOUSTRACTIFF = listeAssociatedToRubriqueSOUSTRACTIF.map(item => item.compte);
                        const inClauseSOUSTRACTIF = `(${arrayListSOUSTRACTIFF.join(',')})`;

                        await db.sequelize.query(`
                            UPDATE liassedrfs as tabA SET
                            montant_brut = montant_brut - (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB WHERE tabB.id_rubrique IN ${inClauseSOUSTRACTIF}
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='DRF')

                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'DRF' AND tabA.nature='TOTAL' AND tabA.id = ${total.id}
                        `,
                            {
                                replacements: { compte_id, dossier_id, exercice_id },
                                type: db.Sequelize.QueryTypes.UPDATE
                            }
                        );
                    }
                }

                if (total.nature === 'TOTALMIXTE') {
                    //Liste des rubriques à calculer
                    const listeAssociatedToRubrique = await compterubriques.findAll({
                        where:
                        {
                            id_compte: compte_id,
                            id_dossier: dossier_id,
                            id_exercice: exercice_id,
                            id_etat: 'DRF',
                            id_rubrique: total.id_rubrique,
                            active: true,
                        }
                    });

                    //réinitialiser à 0 la valeur 
                    await db.sequelize.query(`
                            UPDATE liassedrfs as tabA SET
                            montant_brut = 0
                            WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                            AND tabA.id_etat = 'DRF' AND tabA.nature = 'TOTALMIXTE' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );

                    if (listeAssociatedToRubrique.length > 0) {
                        for (let rubrik of listeAssociatedToRubrique) {
                            let exerciceAnterieur = 0;
                            let equation = '';
                            let variation = '';

                            exerciceAnterieur = rubrik.exercice === 'N'
                                ? exercice_id
                                : exercice_idN1;
                            equation = rubrik.equation === 'ADDITIF' ? '+' : '-';

                            if (rubrik.nature === 'CRN') {
                                await db.sequelize.query(`
                                    WITH RECURSIVE balance_n AS (
                                        SELECT
                                            MIN(J.COMPTEGEN) || J.COMPTEAUX AS COMPTE,
                                            GREATEST(SUM(J.DEBIT) - SUM(J.CREDIT), 0) AS SOLDEDEBIT,
                                            GREATEST(SUM(J.CREDIT) - SUM(J.DEBIT), 0) AS SOLDECREDIT,
                                            GREATEST(
                                                SUM(J.DEBIT) FILTER (
                                                    WHERE
                                                        CJ.TYPE IN ('BANQUE', 'CAISSE')
                                                ) - SUM(J.CREDIT) FILTER (
                                                    WHERE
                                                        CJ.TYPE IN ('BANQUE', 'CAISSE')
                                                ),
                                                0
                                            ) AS SOLDEDEBITTRESO,
                                            GREATEST(
                                                SUM(J.CREDIT) FILTER (
                                                    WHERE
                                                        CJ.TYPE IN ('BANQUE', 'CAISSE')
                                                ) - SUM(J.DEBIT) FILTER (
                                                    WHERE
                                                        CJ.TYPE IN ('BANQUE', 'CAISSE')
                                                ),
                                                0
                                            ) AS SOLDECREDITTRESO
                                        FROM
                                            JOURNALS J
                                            LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
                                        WHERE
                                            J.ID_DOSSIER = :dossier_id
                                            AND J.ID_EXERCICE = :exerciceAnterieur
                                            AND J.ID_COMPTE = :compte_id
                                            AND NOT EXISTS (
                                                SELECT 1
                                                FROM DOSSIERPLANCOMPTABLES DPC
                                                WHERE DPC.COMPTE = J.COMPTEAUX
                                                AND DPC.ID_DOSSIER = :dossier_id
                                                AND DPC.ID_COMPTE = :compte_id
                                                AND DPC.NATURE = 'Collectif'
                                            )

                                        GROUP BY
                                            J.COMPTEAUX
                                    ),

                                    COMPTE_RUBRIQUES_CRN AS (
                                        SELECT DISTINCT ID_RUBRIQUE
                                        FROM COMPTERUBRIQUES
                                        WHERE ID_COMPTE = :compte_id
                                            AND ID_DOSSIER = :dossier_id
                                            AND ID_EXERCICE = :exerciceAnterieur
                                            AND ID_ETAT = 'CRN'
                                            AND ACTIVE = true

                                        UNION

                                        SELECT DISTINCT ID_RUBRIQUE
                                        FROM AJUSTEMENTS
                                        WHERE ID_COMPTE = :compte_id
                                            AND ID_DOSSIER = :dossier_id
                                            AND ID_EXERCICE = :exerciceAnterieur
                                            AND ID_ETAT = 'CRN'
                                            AND NATURE = 'BRUT'
                                    ),

                                            ajustements_agreges_crn AS (
                                                SELECT
                                                    ID_RUBRIQUE,
                                                    NATURE,
                                                    SUM(MONTANT) AS montant
                                                FROM AJUSTEMENTS
                                                WHERE
                                                    ID_COMPTE = :compte_id
                                                    AND ID_DOSSIER = :dossier_id
                                                    AND ID_EXERCICE = :exercice_id
                                                    AND ID_ETAT = 'CRN'
                                                GROUP BY ID_RUBRIQUE, NATURE
                                            ),

                                            ligne_detail_crn_n AS (
                                                SELECT
                                                    CR.ID_RUBRIQUE,
                                                    COALESCE(
                                                        SUM(
                                                            CASE
                                                                WHEN CR2.NATURE = 'BRUT'
                                                                AND (
                                                                    CR2.CONDITION = 'SOLDE'
                                                                    OR (CR2.CONDITION = 'SiD' AND b.SOLDEDEBIT <> 0)
                                                                    OR (CR2.CONDITION = 'SiC' AND b.SOLDECREDIT <> 0)
                                                                )
                                                                THEN
                                                                    (
                                                                        CASE CR2.SENSCALCUL
                                                                            WHEN 'D-C' THEN b.SOLDEDEBIT - b.SOLDECREDIT
                                                                            WHEN 'C-D' THEN b.SOLDECREDIT - b.SOLDEDEBIT
                                                                            ELSE 0
                                                                        END
                                                                    )
                                                                    * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                                                ELSE 0
                                                            END
                                                        ),0
                                                    )
                                                    + COALESCE(SUM(aj.montant) FILTER (WHERE aj.NATURE = 'BRUT'),0) AS MONTANTBRUT

                                                FROM COMPTE_RUBRIQUES_CRN CR

                                                LEFT JOIN COMPTERUBRIQUES CR2
                                                    ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
                                                    AND CR2.ID_COMPTE = :compte_id
                                                    AND CR2.ID_DOSSIER = :dossier_id
                                                    AND CR2.ID_EXERCICE = :exercice_id
                                                    AND CR2.ID_ETAT = 'CRN'
                                                    AND CR2.ACTIVE = true

                                                LEFT JOIN balance_n b
                                                    ON CR2.COMPTE IS NOT NULL
                                                    AND b.COMPTE LIKE CR2.COMPTE || '%'

                                                LEFT JOIN ajustements_agreges_crn aj
                                                    ON aj.ID_RUBRIQUE = CR.ID_RUBRIQUE

                                                GROUP BY CR.ID_RUBRIQUE
                                            ),

                                    rubrique_unique_crn_n AS (
                                        SELECT DISTINCT ON (ID_RUBRIQUE) *
                                        FROM rubriques
                                        WHERE ID_COMPTE = :compte_id
                                            AND ID_DOSSIER = :dossier_id
                                            AND ID_EXERCICE = :exerciceAnterieur
                                            AND ID_ETAT = 'CRN'
                                            AND SUBTABLE = 0
                                        ORDER BY ID_RUBRIQUE, ORDRE
                                    ),

                                    compterubriques_unique_crn_n AS (
                                        SELECT
                                            cr.ID_RUBRIQUE,
                                            cr.ID_COMPTE,
                                            cr.ID_DOSSIER,
                                            cr.ID_EXERCICE,
                                            json_agg(
                                                json_build_object(
                                                    'compte', cr.COMPTE::int,
                                                    'equation', cr.EQUATION
                                                )
                                            ) AS comptes,
                                            cr.ACTIVE,
                                            cr.ID_ETAT
                                        FROM compterubriques cr
                                        JOIN rubrique_unique_crn_n r
                                            ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                                            AND r.ID_COMPTE = cr.ID_COMPTE
                                            AND r.ID_DOSSIER = cr.ID_DOSSIER
                                            AND r.ID_EXERCICE = cr.ID_EXERCICE
                                        WHERE 
                                            cr.ACTIVE = TRUE
                                            AND cr.ID_ETAT = 'CRN'
                                        GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
                                    ),

                                    liens_total_crn_n AS (
                                        SELECT
                                            cr.ID_RUBRIQUE::int AS ID_TOTAL,
                                            (elem ->> 'compte')::int AS ID_ENFANT,
                                            elem ->> 'equation' as EQUATION
                                        FROM compterubriques_unique_crn_n cr
                                        JOIN rubrique_unique_crn_n r
                                            ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                                        CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
                                        WHERE r.NATURE = 'TOTAL'
                                    ),

                                    total_recursive_crn_n AS (
                                        SELECT
                                            ld.ID_RUBRIQUE,
                                            ld.MONTANTBRUT,
                                            0::numeric AS MONTANTAMORT
                                        FROM ligne_detail_crn_n ld
                                        JOIN rubriques r
                                            ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
                                        WHERE 
                                            r.ID_COMPTE = :compte_id
                                            AND r.ID_DOSSIER = :dossier_id
                                            AND r.ID_EXERCICE = :exerciceAnterieur
                                            AND r.ID_ETAT = 'CRN'
                                            AND SUBTABLE = 0
                                            AND r.NATURE NOT IN ('TOTAL', 'TITRE')

                                        UNION ALL

                                        SELECT
                                            lt.ID_TOTAL AS ID_RUBRIQUE,
                                            tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                                            0::numeric AS MONTANTAMORT
                                        FROM total_recursive_crn_n tr
                                        JOIN liens_total_crn_n lt
                                            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
                                    ),

                                    CRN_N AS (
                                        SELECT
                                            r.ID_RUBRIQUE,
                                            r.NOTE,
                                            r.LIBELLE,
                                            r.NATURE,
                                            r.ORDRE,
                                            r.NIVEAU,
                                            r.SUBTABLE,
                                            r.ID_ETAT,
                                            COALESCE(SUM(tr.MONTANTBRUT), 0) AS MONTANTBRUT,
                                            COALESCE(SUM(tr.MONTANTAMORT), 0) AS MONTANTAMORT,
                                            COALESCE(SUM(tr.MONTANTBRUT), 0) - COALESCE(SUM(tr.MONTANTAMORT), 0) AS MONTANTNET,
                                            0::numeric AS MONTANTNETN1,
                                            r.id AS id,
                                            COALESCE(
                                                (
                                                    SELECT json_agg(json_build_object(
                                                        'id', aj.id,
                                                        'id_compte', aj.id_compte,
                                                        'id_dossier', aj.id_dossier,
                                                        'id_etat', aj.id_etat,
                                                        'id_exercice', aj.id_exercice,
                                                        'id_rubrique', aj.id_rubrique,
                                                        'montant', aj.montant,
                                                        'motif', aj.motif,
                                                        'nature', aj.nature
                                                    ))
                                                    FROM ajustements aj
                                                    WHERE 
                                                        aj.id_rubrique = r.ID_RUBRIQUE
                                                        AND aj.ID_ETAT = 'CRN'
                                                        AND aj.ID_DOSSIER = :dossier_id
                                                        AND aj.ID_EXERCICE = :exerciceAnterieur
                                                        AND aj.ID_COMPTE = :compte_id
                                                ), '[]'::json
                                            ) AS ajusts
                                        FROM rubriquesmatrices r
                                        LEFT JOIN total_recursive_crn_n tr
                                            ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
                                        WHERE 
                                            r.ID_ETAT = 'CRN'
                                            AND SUBTABLE = 0
                                        GROUP BY
                                            r.ID_RUBRIQUE,
                                            r.NOTE,
                                            r.LIBELLE,
                                            r.NATURE,
                                            r.ORDRE,
                                            r.NIVEAU,
                                            r.SUBTABLE,
                                            r.id,
                                            r.ID_ETAT
                                        ORDER BY r.ORDRE
                                    )

                                    UPDATE liassedrfs AS tabA
                                    SET
                                        montant_brut = montant_brut ${equation} COALESCE(c.MONTANTNET,0)
                                            + (
                                                SELECT COALESCE(SUM(montant),0)
                                                FROM ajustements
                                                WHERE id_rubrique = tabA.id_rubrique
                                                    AND id_compte = :compte_id
                                                    AND id_dossier = :dossier_id
                                                    AND id_exercice = :exercice_id
                                                    AND id_etat = 'DRF'
                                                    AND nature = 'BRUT'
                                            )
                                    FROM CRN_N c
                                    WHERE tabA.id_compte = :compte_id
                                    AND tabA.id_dossier = :dossier_id
                                    AND tabA.id_exercice = :exercice_id
                                    AND tabA.id_etat = 'DRF'
                                    AND tabA.nature = 'TOTALMIXTE'
                                    AND tabA.id = ${total.id}
                                    AND c.ID_RUBRIQUE = ${rubrik.compte}
                                    `,
                                    {
                                        replacements: { compte_id, dossier_id, exercice_id, exerciceAnterieur },
                                        type: db.Sequelize.QueryTypes.UPDATE
                                    }
                                );
                            } else {
                                await db.sequelize.query(`
                                    UPDATE liassedrfs as tabA SET
                                    montant_brut = montant_brut ${equation} (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB 
                                    WHERE tabB.id_rubrique = ${rubrik.compte}
                                    AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exerciceAnterieur
                                    AND tabB.id_etat='${rubrik.nature}')
                                    + (SELECT COALESCE(SUM(montant),0) FROM ajustements WHERE ajustements.id_rubrique = tabA.id_rubrique
                                    AND ajustements.id_compte = :compte_id AND ajustements.id_dossier = :dossier_id AND ajustements.id_exercice = :exercice_id
                                    AND ajustements.id_etat = 'DRF' AND ajustements.nature = 'BRUT')

                                    WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                                    AND tabA.id_etat = 'DRF' AND tabA.nature = 'TOTALMIXTE' AND tabA.id = ${total.id}
                                    `,
                                    {
                                        replacements: { compte_id, dossier_id, exercice_id, exerciceAnterieur },
                                        type: db.Sequelize.QueryTypes.UPDATE
                                    }
                                );
                            }
                        }
                    }

                }

                if (total.nature === 'TOTALREV_THE') {
                    const taux = await db.sequelize.query(`
                            SELECT SUM(tauxir) as taux FROM dossiers
                            WHERE dossiers.id_compte = :compte_id AND dossiers.id = :dossier_id 
                        `,
                        {
                            replacements: { compte_id, dossier_id },
                            type: db.Sequelize.QueryTypes.SELECT
                        }
                    );

                    const tauxIr = taux[0]?.taux ?? 0;

                    await db.sequelize.query(`
                        UPDATE liassedrfs as tabA SET
                        montant_brut = (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB 
                        WHERE tabB.id_rubrique = 15
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='DRF')*${tauxIr}/100
                        
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'DRF' AND tabA.nature = 'TOTALREV_THE' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }

                if (total.nature === 'TOTALMIN_PER') {
                    const dataCalculMinPer = await db.sequelize.query(`
                            SELECT SUM(pourcentageca) as pourcentageca, SUM(montantmin) as montantmin FROM dossiers
                            WHERE dossiers.id_compte = :compte_id AND dossiers.id = :dossier_id 
                        `,
                        {
                            replacements: { compte_id, dossier_id },
                            type: db.Sequelize.QueryTypes.SELECT
                        }
                    );

                    const pourcentageca = dataCalculMinPer[0]?.pourcentageca ?? 0;
                    const montantmin = dataCalculMinPer[0]?.montantmin ?? 0;

                    await db.sequelize.query(`
                        UPDATE liassedrfs as tabA SET
                        montant_brut = (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB 
                        WHERE tabB.id_rubrique = 1
                        AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                        AND tabB.id_etat='DRF')*${pourcentageca}/100 + ${montantmin}
                        
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'DRF' AND tabA.nature = 'TOTALMIN_PER' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }

                if (total.nature === 'TOTALIMP_DU') {
                    await db.sequelize.query(`
                        UPDATE liassedrfs as tabA SET
                        montant_brut = GREATEST(
                            (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB 
                            WHERE tabB.id_rubrique = 16
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='DRF'),

                            (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabC 
                            WHERE tabC.id_rubrique = 17
                            AND tabC.id_compte = :compte_id AND tabC.id_dossier = :dossier_id AND tabC.id_exercice = :exercice_id
                            AND tabC.id_etat='DRF')
                        )
                        
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'DRF' AND tabA.nature = 'TOTALIMP_DU' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }

                if (total.nature === 'TOTALIMP_DU1') {
                    await db.sequelize.query(`
                        UPDATE liassedrfs as tabA SET
                        montant_brut = GREATEST(
                            (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabB 
                            WHERE tabB.id_rubrique = 18
                            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id
                            AND tabB.id_etat='DRF')
                            -
                            (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabC 
                            WHERE tabC.id_rubrique = 19
                            AND tabC.id_compte = :compte_id AND tabC.id_dossier = :dossier_id AND tabC.id_exercice = :exercice_id
                            AND tabC.id_etat='DRF')
                            ,
                            (SELECT COALESCE(SUM(montant_brut),0) FROM liassedrfs as tabD 
                            WHERE tabD.id_rubrique = 17
                            AND tabD.id_compte = :compte_id AND tabD.id_dossier = :dossier_id AND tabD.id_exercice = :exercice_id
                            AND tabD.id_etat='DRF')
                        )
                        
                        WHERE tabA.id_compte = :compte_id AND tabA.id_dossier = :dossier_id AND tabA.id_exercice = :exercice_id
                        AND tabA.id_etat = 'DRF' AND tabA.nature = 'TOTALIMP_DU1' AND tabA.id = ${total.id}
                        `,
                        {
                            replacements: { compte_id, dossier_id, exercice_id },
                            type: db.Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        }

        return true;
    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueSAD = async (compte_id, dossier_id, exercice_id) => {
    try {
        await db.sequelize.query(`
            UPDATE liassesads as TabA SET
            total_imputation = n6+n5+n4+n3+n2+n1+n
            WHERE TabA.id_compte = :compte_id AND TabA.id_dossier = :dossier_id AND TabA.id_exercice = :exercice_id
            `,
            {
                replacements: { compte_id, dossier_id, exercice_id },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );
        return true;
    } catch (error) {
        console.log(error);
    }
}

const totalRubriqueSDR = async (compte_id, dossier_id, exercice_id) => {
    try {
        //calcul ligne total
        await db.sequelize.query(`
            UPDATE liassesdrs as TabA SET
            n6 = (SELECT COALESCE(SUM(n6),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            n5 = (SELECT COALESCE(SUM(n5),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            n4 = (SELECT COALESCE(SUM(n4),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            n3 = (SELECT COALESCE(SUM(n3),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            n2 = (SELECT COALESCE(SUM(n2),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            n1 = (SELECT COALESCE(SUM(n1),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            exercice = (SELECT COALESCE(SUM(exercice),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            solde_imputable = (SELECT COALESCE(SUM(solde_imputable),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id),

            solde_non_imputable = (SELECT COALESCE(SUM(solde_non_imputable),0) FROM liassesdrs as tabB 
            WHERE tabB.id_rubrique IN (1,2,3,4,5,6,7)
            AND tabB.id_compte = :compte_id AND tabB.id_dossier = :dossier_id AND tabB.id_exercice = :exercice_id)

            WHERE TabA.id_compte = :compte_id AND TabA.id_dossier = :dossier_id AND TabA.id_exercice = :exercice_id
            AND TabA.id_rubrique = 8
            `,
            {
                replacements: { compte_id, dossier_id, exercice_id },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        await db.sequelize.query(`
            UPDATE liassesdrs as TabA SET
            total = n6+n5+n4+n3+n2+n1+exercice
            WHERE TabA.id_compte = :compte_id AND TabA.id_dossier = :dossier_id AND TabA.id_exercice = :exercice_id
            `,
            {
                replacements: { compte_id, dossier_id, exercice_id },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        return true;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    totalRubriqueBilan,
    totalRubriqueCRN,
    totalRubriqueCRF,
    totalRubriqueTFTD,
    totalRubriqueTFTI,
    totalRubriqueEVCP,
    totalRubriqueDRF,
    totalRubriqueSAD,
    totalRubriqueSDR
};