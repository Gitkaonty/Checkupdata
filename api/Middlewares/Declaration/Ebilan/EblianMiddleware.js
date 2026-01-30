const db = require('../../../Models');
const recupExerciceN1 = require('../../../Middlewares/Standard/recupExerciceN1');

const runBilan = async (id_compte, id_dossier, id_exercice, id_etat, subtable) => {
    const rows = await db.sequelize.query(
        `
        WITH RECURSIVE balance AS (
            SELECT
                J.COMPTEAUX AS COMPTE,
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
        ),

        ligne_detail AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR.NATURE = 'BRUT'
                                AND (
                                    CR.CONDITION = 'SOLDE'
                                    OR (
                                        :id_etat = 'TFTD'
                                        AND CR.CONDITION = 'SiD'
                                        AND b.SOLDEDEBITTRESO <> 0
                                    )
                                    OR (
                                        :id_etat = 'TFTD'
                                        AND CR.CONDITION = 'SiC'
                                        AND b.SOLDECREDITTRESO <> 0
                                    )
                                    OR (
                                        :id_etat <> 'TFTD'
                                        AND CR.CONDITION = 'SiD'
                                        AND b.SOLDEDEBIT <> 0
                                    )
                                    OR (
                                        :id_etat <> 'TFTD'
                                        AND CR.CONDITION = 'SiC'
                                        AND b.SOLDECREDIT <> 0
                                    )
                                )
                            THEN
                                CASE CR.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        CASE
                                            WHEN :id_etat = 'TFTD'
                                                THEN b.SOLDEDEBITTRESO - b.SOLDECREDITTRESO
                                            ELSE b.SOLDEDEBIT - b.SOLDECREDIT
                                        END
                                    WHEN 'C-D' THEN
                                        CASE
                                            WHEN :id_etat = 'TFTD'
                                                THEN b.SOLDECREDITTRESO - b.SOLDEDEBITTRESO
                                            ELSE b.SOLDECREDIT - b.SOLDEDEBIT
                                        END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                    0
                )
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = :id_etat
                        AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR.NATURE = 'AMORT'
                                AND (
                                    CR.CONDITION = 'SOLDE'
                                    OR (
                                        :id_etat = 'TFTD'
                                        AND CR.CONDITION = 'SiD'
                                        AND b.SOLDEDEBITTRESO <> 0
                                    )
                                    OR (
                                        :id_etat = 'TFTD'
                                        AND CR.CONDITION = 'SiC'
                                        AND b.SOLDECREDITTRESO <> 0
                                    )
                                    OR (
                                        :id_etat <> 'TFTD'
                                        AND CR.CONDITION = 'SiD'
                                        AND b.SOLDEDEBIT <> 0
                                    )
                                    OR (
                                        :id_etat <> 'TFTD'
                                        AND CR.CONDITION = 'SiC'
                                        AND b.SOLDECREDIT <> 0
                                    )
                                )
                            THEN
                                CASE CR.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        CASE
                                            WHEN :id_etat = 'TFTD'
                                                THEN b.SOLDEDEBITTRESO - b.SOLDECREDITTRESO
                                            ELSE b.SOLDEDEBIT - b.SOLDECREDIT
                                        END
                                    WHEN 'C-D' THEN
                                        CASE
                                            WHEN :id_etat = 'TFTD'
                                                THEN b.SOLDECREDITTRESO - b.SOLDEDEBITTRESO
                                            ELSE b.SOLDECREDIT - b.SOLDEDEBIT
                                        END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                    0
                )
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = :id_etat
                        AND A.NATURE = 'AMORT'
                ), 0) AS MONTANTAMORT

            FROM COMPTERUBRIQUES CR
            LEFT JOIN balance b
                ON b.COMPTE LIKE CR.COMPTE || '%'
            WHERE
                CR.ID_COMPTE = :id_compte
                AND CR.ID_DOSSIER = :id_dossier
                AND CR.ID_EXERCICE = :id_exercice
                AND CR.ID_ETAT = :id_etat
                AND CR.ACTIVE = true
            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = :id_etat
                AND SUBTABLE = :subtable
            ORDER BY ID_RUBRIQUE, ORDRE
        ),

        compterubriques_unique AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                ARRAY_AGG(DISTINCT cr.COMPTE::int) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM compterubriques cr
            JOIN rubrique_unique r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = :id_etat
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        liens_total AS (
            SELECT
                cr.ID_RUBRIQUE::int AS ID_TOTAL,
                unnest(cr.comptes) AS ID_ENFANT
            FROM compterubriques_unique cr
            JOIN rubrique_unique r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            WHERE r.NATURE = 'TOTAL'
        ),

        total_calcule AS (
            SELECT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                SUM(ld.MONTANTBRUT) AS MONTANTBRUT,
                SUM(ld.MONTANTAMORT) AS MONTANTAMORT
            FROM liens_total lt
            LEFT JOIN ligne_detail ld
                ON ld.ID_RUBRIQUE = lt.ID_ENFANT
            GROUP BY lt.ID_TOTAL
        ),

        total_recursive AS (
            SELECT
                ld.ID_RUBRIQUE,
                ld.MONTANTBRUT,
                ld.MONTANTAMORT
            FROM ligne_detail ld
            JOIN rubriques r
                ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE 
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = :id_etat
                AND r.SUBTABLE = :subtable
                AND r.NATURE NOT IN ('TOTAL', 'TITRE')

            UNION ALL

            SELECT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT,
                tr.MONTANTAMORT
            FROM total_recursive tr
            JOIN liens_total lt
                ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        )

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
            WHERE aj.id_rubrique = r.id
              AND aj.id_dossier = :id_dossier
              AND aj.id_exercice = :id_exercice
              AND aj.id_compte = :id_compte
        ), '[]'::json
    ) AS ajusts
        FROM rubriquesmatrices r
        LEFT JOIN total_recursive tr
            ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
        WHERE 
            r.ID_ETAT = :id_etat
            AND r.SUBTABLE = :subtable
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
        `,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, id_etat, subtable }
        }
    );

    return rows;
}

const getEbilanComplet = async (id_compte, id_dossier, id_exercice, id_etat) => {
    const {
        id_exerciceN1,
    } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);
    let id_etat_final = 'BILAN';
    let subtable = 0;
    if (id_etat === 'BILAN_ACTIF') {
        subtable = 1;
    } else if (id_etat === 'BILAN_PASSIF') {
        subtable = 2;
    } else {
        id_etat_final = id_etat;
    }

    const id_exerciceN_1 = id_exerciceN1 ?? 0;
    const rowsN = await runBilan(id_compte, id_dossier, id_exercice, id_etat_final, subtable);
    let rowsN1 = [];
    if (id_exerciceN_1 !== 0) {
        rowsN1 = await runBilan(id_compte, id_dossier, id_exerciceN_1, id_etat_final, subtable);
    }
    const mapN1 = Object.fromEntries(
        rowsN1.map(r => [r.id_rubrique, r.montantnet])
    )
    const finalRows = rowsN.map(r => ({
        ...r,
        montantnetn1: mapN1[r.id_rubrique] ?? 0,
        id_compte,
        id_dossier,
        id_exercice
    }));

    return finalRows;
};

const getDetailLigne = async (id_compte, id_dossier, id_exercice, id_etat, id_rubrique, subtable) => {
    const rows = await db.sequelize.query(
        `
            WITH balance AS (
                SELECT
                    J.COMPTEAUX AS COMPTE,
                    MAX(J.LIBELLECOMPTE) AS LIBELLE,

                    GREATEST(SUM(J.DEBIT) - SUM(J.CREDIT), 0) AS SOLDEDEBIT,
                    GREATEST(SUM(J.CREDIT) - SUM(J.DEBIT), 0) AS SOLDECREDIT,

                    GREATEST(
                        SUM(J.DEBIT) FILTER (WHERE CJ.TYPE IN ('BANQUE','CAISSE'))
                    - SUM(J.CREDIT) FILTER (WHERE CJ.TYPE IN ('BANQUE','CAISSE')),
                    0) AS SOLDEDEBITTRESO,

                    GREATEST(
                        SUM(J.CREDIT) FILTER (WHERE CJ.TYPE IN ('BANQUE','CAISSE'))
                    - SUM(J.DEBIT) FILTER (WHERE CJ.TYPE IN ('BANQUE','CAISSE')),
                    0) AS SOLDECREDITTRESO

                FROM JOURNALS J
                LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
                WHERE
                    J.ID_DOSSIER = :id_dossier
                    AND J.ID_EXERCICE = :id_exercice
                    AND J.ID_COMPTE = :id_compte
                    AND NOT EXISTS (
                        SELECT 1
                        FROM DOSSIERPLANCOMPTABLES DPC
                        WHERE
                            DPC.COMPTE = J.COMPTEAUX
                            AND DPC.ID_DOSSIER = :id_dossier
                            AND DPC.ID_COMPTE = :id_compte
                            AND DPC.NATURE = 'Collectif'
                    )
                GROUP BY J.COMPTEAUX
            ),

            rubrique_comptes AS (
                SELECT
                    R.ID_RUBRIQUE,
                    CR.COMPTE,
                    CR.CONDITION,
                    R.SENSCALCUL,
                    R.ID_DOSSIER, 
                    R.ID_EXERCICE,
                    R.ID_ETAT
                FROM RUBRIQUES R
                JOIN COMPTERUBRIQUES CR
                    ON CR.ID_RUBRIQUE = R.ID_RUBRIQUE
                    AND CR.ID_DOSSIER = :id_dossier
                    AND CR.ID_COMPTE = :id_compte
                    AND CR.ID_EXERCICE = :id_exercice
                    AND CR.ID_ETAT = :id_etat
                WHERE
                    R.ID_RUBRIQUE = :id_rubrique
                    AND R.ID_DOSSIER = :id_dossier
                    AND R.ID_COMPTE = :id_compte
                    AND R.ID_EXERCICE = :id_exercice
                    AND R.ID_ETAT = :id_etat
                    AND R.SUBTABLE = :subtable
                    AND CR.ACTIVE = true
            ),

            ligne_detail AS (
                SELECT
                    b.COMPTE,
                    b.LIBELLE,

                    SUM(
                        CASE
                            WHEN (
                                rc.CONDITION = 'SOLDE'
                                OR (
                                    :id_etat = 'TFTD'
                                    AND rc.CONDITION = 'SiD'
                                    AND b.SOLDEDEBITTRESO <> 0
                                )
                                OR (
                                    :id_etat = 'TFTD'
                                    AND rc.CONDITION = 'SiC'
                                    AND b.SOLDECREDITTRESO <> 0
                                )
                                OR (
                                    :id_etat <> 'TFTD'
                                    AND rc.CONDITION = 'SiD'
                                    AND b.SOLDEDEBIT <> 0
                                )
                                OR (
                                    :id_etat <> 'TFTD'
                                    AND rc.CONDITION = 'SiC'
                                    AND b.SOLDECREDIT <> 0
                                )
                            )
                            THEN
                                CASE
                                    WHEN :id_etat = 'TFTD'
                                        THEN b.SOLDEDEBITTRESO
                                    ELSE b.SOLDEDEBIT
                                END
                            ELSE 0
                        END
                    ) AS SOLDEDEBIT,

                    SUM(
                        CASE
                            WHEN (
                                rc.CONDITION = 'SOLDE'
                                OR (
                                    :id_etat = 'TFTD'
                                    AND rc.CONDITION = 'SiD'
                                    AND b.SOLDEDEBITTRESO <> 0
                                )
                                OR (
                                    :id_etat = 'TFTD'
                                    AND rc.CONDITION = 'SiC'
                                    AND b.SOLDECREDITTRESO <> 0
                                )
                                OR (
                                    :id_etat <> 'TFTD'
                                    AND rc.CONDITION = 'SiD'
                                    AND b.SOLDEDEBIT <> 0
                                )
                                OR (
                                    :id_etat <> 'TFTD'
                                    AND rc.CONDITION = 'SiC'
                                    AND b.SOLDECREDIT <> 0
                                )
                            )
                            THEN
                                CASE
                                    WHEN :id_etat = 'TFTD'
                                        THEN b.SOLDECREDITTRESO
                                    ELSE b.SOLDECREDIT
                                END
                            ELSE 0
                        END
                    ) AS SOLDECREDIT

                FROM rubrique_comptes rc
                JOIN balance b
                    ON b.COMPTE LIKE rc.COMPTE || '%'
                GROUP BY
                    b.COMPTE,
                    b.LIBELLE
                ORDER BY b.COMPTE ASC
            )

            SELECT *
            FROM ligne_detail
            WHERE
                SOLDEDEBIT <> 0
                OR SOLDECREDIT <> 0;
            
        `,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, id_rubrique, id_etat, subtable }
        }
    )

    return rows;
}

module.exports = {
    getEbilanComplet,
    getDetailLigne
};
