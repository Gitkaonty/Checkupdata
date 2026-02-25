const db = require("../../Models");
require('dotenv').config();

// const updateMontantImmo = async (id_compte, id_dossier, id_exercice, id_details_immo) => {
//     const exercice = await db.exercices.findByPk(id_exercice);

//     if (!exercice) {
//         throw new Error('Exercice non trouvé');
//     }

//     const debut_exercice = exercice.date_debut ? new Date(exercice.date_debut) : null;
//     const fin_exercice = exercice.date_fin ? new Date(exercice.date_fin) : null;

//     const result = await db.sequelize.query(`
//         UPDATE details_immo d
//         SET 
//             amort_ant_comp = COALESCE(sub.amort_ant_comp, 0),
//             dotation_periode_comp = COALESCE(sub.dotation_periode_comp, 0),
//             amort_ant_fisc = COALESCE(sub.amort_ant_fisc, 0),
//             dotation_periode_fisc = COALESCE(sub.dotation_periode_fisc, 0),

//             total_amortissement_comp =
//                 COALESCE(sub.amort_ant_comp, 0)
//             + COALESCE(sub.dotation_periode_comp, 0)
//             + COALESCE(d.amort_exceptionnel_comp, 0)
//             + COALESCE(d.derogatoire_comp, 0),

//             total_amortissement_fisc =
//                 COALESCE(sub.amort_ant_fisc, 0)
//             + COALESCE(sub.dotation_periode_fisc, 0)
//             + COALESCE(d.amort_exceptionnel_fisc, 0)
//             + COALESCE(d.derogatoire_fisc, 0),

//             vnc = COALESCE(d.montant_ht, 0)
//             - (
//                 COALESCE(sub.amort_ant_comp, 0)
//                 + COALESCE(sub.dotation_periode_comp, 0)
//                 + COALESCE(d.amort_exceptionnel_comp, 0)
//                 + COALESCE(d.derogatoire_comp, 0)
//                 )

//         FROM (
//             SELECT 
//                 SUM(dl.amort_ant_comp) AS amort_ant_comp,
//                 SUM(dl.dotation_periode_comp) AS dotation_periode_comp,
//                 SUM(dl.amort_ant_fisc) AS amort_ant_fisc,
//                 SUM(dl.dotation_periode_fisc) AS dotation_periode_fisc
//             FROM details_immo_lignes dl
//             WHERE dl.id_detail_immo = :id_details_immo
//             AND dl.date_mise_service <= :fin_exercice
//             AND dl.date_fin_exercice BETWEEN :debut_exercice AND :fin_exercice
//         ) AS sub

//         WHERE
//             d.id = :id_details_immo
//             AND d.id_dossier = :id_dossier
//             AND d.id_exercice = :id_exercice
//             AND d.id_compte = :id_compte

//         RETURNING *
//     `, {
//         type: db.Sequelize.QueryTypes.UPDATE,
//         replacements: {
//             id_compte,
//             id_dossier,
//             id_exercice,
//             id_details_immo,
//             debut_exercice,
//             fin_exercice
//         }
//     });

//     return result;
// };

const updateMontantImmo = async (id_compte, id_dossier, id_exercice, id_details_immo) => {
    const exercice = await db.exercices.findByPk(id_exercice);

    if (!exercice) {
        throw new Error('Exercice non trouvé');
    }

    const debut_exercice = exercice.date_debut ? new Date(exercice.date_debut) : null;
    const fin_exercice = exercice.date_fin ? new Date(exercice.date_fin) : null;

    const result = await db.sequelize.query(`
        UPDATE details_immo d
        SET 
            amort_ant_comp = COALESCE(NULLIF(sub.amort_ant_comp, 0), sub.amort_ant_fisc, 0),
            dotation_periode_comp = COALESCE(NULLIF(sub.dotation_periode_comp, 0), sub.dotation_periode_fisc, 0),
            amort_ant_fisc = COALESCE(NULLIF(sub.amort_ant_fisc, 0), sub.amort_ant_comp, 0),
            dotation_periode_fisc = COALESCE(NULLIF(sub.dotation_periode_fisc, 0), sub.dotation_periode_comp, 0),

            total_amortissement_comp =
              COALESCE(NULLIF(sub.amort_ant_comp, 0), sub.amort_ant_fisc, 0)
            + COALESCE(NULLIF(sub.dotation_periode_comp, 0), sub.dotation_periode_fisc, 0)
            + COALESCE(NULLIF(d.amort_exceptionnel_comp, 0), d.amort_exceptionnel_fisc, 0)
            + COALESCE(NULLIF(d.derogatoire_comp, 0), d.derogatoire_fisc, 0) ,

            total_amortissement_fisc =
            COALESCE(NULLIF(sub.amort_ant_fisc, 0), sub.amort_ant_comp, 0)
            + COALESCE(sub.dotation_periode_fisc, 0)
            + COALESCE(d.amort_exceptionnel_fisc, 0)
            + COALESCE(d.derogatoire_fisc, 0),

            vnc = COALESCE(d.montant_ht, 0)
            - (
                COALESCE(NULLIF(sub.amort_ant_comp, 0), sub.amort_ant_fisc, 0)
                + COALESCE(NULLIF(sub.dotation_periode_comp, 0), sub.dotation_periode_fisc, 0)
                + COALESCE(NULLIF(d.amort_exceptionnel_comp, 0), d.amort_exceptionnel_fisc, 0)
                + COALESCE(NULLIF(d.derogatoire_comp, 0), d.derogatoire_fisc, 0)
                )

        FROM (
            SELECT 
                SUM(dl.amort_ant_comp) AS amort_ant_comp,
                SUM(dl.dotation_periode_comp) AS dotation_periode_comp,
                SUM(dl.amort_ant_fisc) AS amort_ant_fisc,
                SUM(dl.dotation_periode_fisc) AS dotation_periode_fisc
            FROM details_immo_lignes dl
            WHERE dl.id_detail_immo = :id_details_immo
            AND dl.date_mise_service <= :fin_exercice
            AND dl.date_fin_exercice BETWEEN :debut_exercice AND :fin_exercice
        ) AS sub

        WHERE
            d.id = :id_details_immo
            AND d.id_dossier = :id_dossier
            AND d.id_exercice = :id_exercice
            AND d.id_compte = :id_compte

        RETURNING *
    `, {
        type: db.Sequelize.QueryTypes.UPDATE,
        replacements: {
            id_compte,
            id_dossier,
            id_exercice,
            id_details_immo,
            debut_exercice,
            fin_exercice
        }
    });

    return result;
};

module.exports = {
    updateMontantImmo
}