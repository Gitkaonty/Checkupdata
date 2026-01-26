require('dotenv').config();
const db = require("../../Models");

const getBalanceGeneral = async (id_compte, id_dossier, id_exercice) => {
    const [rows] = await db.sequelize.query(
        `
        SELECT 
            J.COMPTEAUX AS COMPTE,
            GREATEST(SUM(J.DEBIT) - SUM(J.CREDIT), 0) AS SOLDEDEBIT,
            GREATEST(SUM(J.CREDIT) - SUM(J.DEBIT), 0) AS SOLDECREDIT,

        FROM JOURNALS J
        WHERE
            J.ID_DOSSIER = :id_dossier
            AND J.ID_EXERCICE = :id_exercice
            AND J.ID_COMPTE = :id_compte
        GROUP BY J.COMPTEAUX
        ORDER BY J.COMPTEAUX ASC
        `,
        {
            replacements: {
                id_compte: Number(id_compte),
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice)
            },
            type: db.Sequelize.QueryTypes.SELECT
        }
    );

    return rows;
};

const getBalanceTresorerie = async (id_compte, id_dossier, id_exercice) => {
    const [rows] = await db.sequelize.query(
        `
        SELECT 
            J.COMPTEGEN AS COMPTE,
            J.COMPTEAUX AS COMPTEAUX,

            GREATEST(
                COALESCE(SUM(CASE WHEN J.ID_JOURNAL IN (
                    SELECT id FROM codejournals 
                    WHERE id_compte = :id_compte
                      AND id_dossier = :id_dossier
                      AND type IN ('BANQUE', 'CAISSE')
                ) THEN J.DEBIT ELSE 0 END),0) -
                COALESCE(SUM(CASE WHEN J.ID_JOURNAL IN (
                    SELECT id FROM codejournals 
                    WHERE id_compte = :id_compte
                      AND id_dossier = :id_dossier
                      AND type IN ('BANQUE', 'CAISSE')
                ) THEN J.CREDIT ELSE 0 END),0), 0
            ) AS SOLDEDEBITTRESO,

            GREATEST(
                COALESCE(SUM(CASE WHEN J.ID_JOURNAL IN (
                    SELECT id FROM codejournals 
                    WHERE id_compte = :id_compte
                      AND id_dossier = :id_dossier
                      AND type IN ('BANQUE', 'CAISSE')
                ) THEN J.CREDIT ELSE 0 END),0) -
                COALESCE(SUM(CASE WHEN J.ID_JOURNAL IN (
                    SELECT id FROM codejournals 
                    WHERE id_compte = :id_compte
                      AND id_dossier = :id_dossier
                      AND type IN ('BANQUE', 'CAISSE')
                ) THEN J.DEBIT ELSE 0 END),0), 0
            ) AS SOLDECREDITTRESO

        FROM JOURNALS J
        WHERE
            J.ID_DOSSIER = :id_dossier
            AND J.ID_EXERCICE = :id_exercice
            AND J.ID_COMPTE = :id_compte
        GROUP BY J.COMPTEGEN
        ORDER BY J.COMPTEGEN ASC
        `,
        {
            replacements: {
                id_compte: Number(id_compte),
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice)
            },
            type: db.Sequelize.QueryTypes.SELECT
        }
    );

    return rows;
};

module.exports = {
    getBalanceGeneral,
    getBalanceTresorerie
}