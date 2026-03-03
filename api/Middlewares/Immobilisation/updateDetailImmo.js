const db = require("../../Models");
require('dotenv').config();

const updateMontantImmo = async (id_compte, id_dossier, id_exercice, id_details_immo) => {

    const exercice = await db.exercices.findByPk(id_exercice);
    if (!exercice) throw new Error('Exercice non trouvé');

    const debut_exercice = exercice.date_debut;
    const fin_exercice = exercice.date_fin;

    const result = await db.sequelize.query(`
        UPDATE details_immo d
        SET

            amort_ant_comp = COALESCE(sub_comp.amort_avant, 0),

            dotation_periode_comp = COALESCE(sub_comp.dotation_exercice, 0),

            total_amortissement_comp =
                COALESCE(sub_comp.amort_avant, 0)
              + COALESCE(sub_comp.dotation_exercice, 0)
              + COALESCE(d.amort_exceptionnel_comp, 0)
              + COALESCE(d.derogatoire_comp, 0),

            amort_ant_fisc = COALESCE(sub_fisc.amort_avant, 0),

            dotation_periode_fisc = COALESCE(sub_fisc.dotation_exercice, 0),

            total_amortissement_fisc =
                COALESCE(sub_fisc.amort_avant, 0)
              + COALESCE(sub_fisc.dotation_exercice, 0)
              + COALESCE(d.amort_exceptionnel_fisc, 0)
              + COALESCE(d.derogatoire_fisc, 0),

            vnc = COALESCE(d.montant_ht, 0)
                - (
                    COALESCE(sub_comp.amort_avant, 0)
                  + COALESCE(sub_comp.dotation_exercice, 0)
                  + COALESCE(d.amort_exceptionnel_comp, 0)
                  + COALESCE(d.derogatoire_comp, 0)
                )

        FROM
        (
            SELECT
                SUM(dl.dotation_periode_comp) FILTER (
                    WHERE dl.date_fin_exercice < :debut_exercice
                ) AS amort_avant,

                SUM(dl.dotation_periode_comp) FILTER (
                    WHERE dl.date_fin_exercice >= :debut_exercice
                    AND dl.date_fin_exercice <= :fin_exercice
                ) AS dotation_exercice

            FROM details_immo_lignes dl
            WHERE dl.id_detail_immo = :id_details_immo
        ) sub_comp,

        (
            SELECT
                SUM(dl.dotation_periode_fisc) FILTER (
                    WHERE dl.date_fin_exercice < :debut_exercice
                ) AS amort_avant,

                SUM(dl.dotation_periode_fisc) FILTER (
                    WHERE dl.date_fin_exercice >= :debut_exercice
                    AND dl.date_fin_exercice <= :fin_exercice
                ) AS dotation_exercice

            FROM details_immo_lignes dl
            WHERE dl.id_detail_immo = :id_details_immo
        ) sub_fisc

        WHERE
            d.id = :id_details_immo
            AND d.id_dossier = :id_dossier
            AND d.id_exercice = :id_exercice
            AND d.id_compte = :id_compte

        RETURNING *
    `, {
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