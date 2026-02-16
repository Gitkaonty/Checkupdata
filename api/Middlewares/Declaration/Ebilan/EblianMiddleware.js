const db = require('../../../Models');
const recupExerciceN1 = require('../../../Middlewares/Standard/recupExerciceN1');

const runBilanCompet = async (id_compte, id_dossier, id_exercice) => {
    const {
        id_exerciceN1,
    } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

    const rows = await db.sequelize.query(
        `
        -- BALANCE N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N
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

        -- BALANCE N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1
        balance_n1 AS (
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
                J.ID_DOSSIER = :id_dossier
                AND J.ID_EXERCICE = :id_exercice_N1
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

        -- BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A EXERCICE N

        COMPTE_RUBRIQUES_BILAN_A_P_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM COMPTERUBRIQUES
            WHERE ID_COMPTE = :id_compte
            AND ID_DOSSIER = :id_dossier
            AND ID_EXERCICE = :id_exercice
            AND ID_ETAT = 'BILAN'
            AND ACTIVE = true

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTS
            WHERE ID_COMPTE = :id_compte
            AND ID_DOSSIER = :id_dossier
            AND ID_EXERCICE = :id_exercice
            AND ID_ETAT = 'BILAN'
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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = 'BILAN'
                        AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT,

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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = 'BILAN'
                        AND A.NATURE = 'AMORT'
                ), 0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_BILAN_A_P_N CR

            LEFT JOIN COMPTERUBRIQUES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'BILAN'
            AND CR2.ACTIVE = true

            LEFT JOIN balance_n b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique_bilan_a_p_n AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
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
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
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
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
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
        ),

        -- BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A BILAN P/A EXERCICE N1

        COMPTE_RUBRIQUES_BILAN_A_P_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM COMPTERUBRIQUES
            WHERE ID_COMPTE = :id_compte
            AND ID_DOSSIER = :id_dossier
            AND ID_EXERCICE = :id_exercice_N1
            AND ID_ETAT = 'BILAN'
            AND ACTIVE = true

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTS
            WHERE ID_COMPTE = :id_compte
            AND ID_DOSSIER = :id_dossier
            AND ID_EXERCICE = :id_exercice_N1
            AND ID_ETAT = 'BILAN'
        ),

        ligne_detail_bilan_a_p_n1 AS (
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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice_N1
                        AND A.ID_ETAT = 'BILAN'
                        AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT,

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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice_N1
                        AND A.ID_ETAT = 'BILAN'
                        AND A.NATURE = 'AMORT'
                ), 0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_BILAN_A_P_N1 CR

            LEFT JOIN COMPTERUBRIQUES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'BILAN'
            AND CR2.ACTIVE = true

            LEFT JOIN balance_n1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique_bilan_a_p_n1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN'
                AND SUBTABLE IN (1, 2)
            ORDER BY ID_RUBRIQUE, ORDRE
        ),

        compterubriques_unique_bilan_a_p_n1 AS (
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
            JOIN rubrique_unique_bilan_a_p_n1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'BILAN'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        liens_total_bilan_a_p_n1 AS (
            SELECT
                cr.ID_RUBRIQUE::int AS ID_TOTAL,
                (elem ->> 'compte')::int AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM compterubriques_unique_bilan_a_p_n1 cr
            JOIN rubrique_unique_bilan_a_p_n1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE r.NATURE = 'TOTAL'
        ),

        total_recursive_bilan_a_p_n1 AS (
            SELECT
                ld.ID_RUBRIQUE,
                ld.MONTANTBRUT,
                ld.MONTANTAMORT
            FROM ligne_detail_bilan_a_p_n1 ld
            JOIN rubriques r
                ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE 
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'BILAN'
                AND SUBTABLE IN (1, 2)
                AND r.NATURE NOT IN ('TOTAL', 'TITRE')

            UNION ALL

            SELECT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM total_recursive_bilan_a_p_n1 tr
            JOIN liens_total_bilan_a_p_n1 lt
                ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        BILAN_A_P_N1 AS (
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
                        AND aj.ID_DOSSIER = :id_dossier
                        AND aj.ID_EXERCICE = :id_exercice_N1
                        AND aj.ID_COMPTE = :id_compte
                    ), '[]'::json
                ) AS ajusts
            FROM rubriquesmatrices r
            LEFT JOIN total_recursive_bilan_a_p_n1 tr
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
        ),

        -- BILAN COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        BILAN_P_A_COMPLET AS (
            SELECT
                n.ID_RUBRIQUE,
                n.NOTE,
                n.LIBELLE,
                n.NATURE,
                n.ORDRE,
                n.NIVEAU,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.id,
                n.ajusts
            FROM BILAN_A_P_N n
            LEFT JOIN BILAN_A_P_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        ),

        -- CRN N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_CRN AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM COMPTERUBRIQUES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRN'
                AND ACTIVE = true

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTS
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRN'
                AND NATURE = 'BRUT'
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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = 'CRN'
                        AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT

            FROM COMPTE_RUBRIQUES_CRN CR

            LEFT JOIN COMPTERUBRIQUES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'CRN'
            AND CR2.ACTIVE = true

            LEFT JOIN balance_n b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique_crn_n AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
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
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
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
                            AND aj.ID_DOSSIER = :id_dossier
                            AND aj.ID_EXERCICE = :id_exercice
                            AND aj.ID_COMPTE = :id_compte
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
        ),

        -- CRF N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_CRF AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM COMPTERUBRIQUES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRF'
                AND ACTIVE = true

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTS
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRF'
                AND NATURE = 'BRUT'
        ),

        ligne_detail_crf_n AS (
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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = 'CRF'
                        AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT

            FROM COMPTE_RUBRIQUES_CRF CR

            LEFT JOIN COMPTERUBRIQUES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'CRF'
            AND CR2.ACTIVE = true

            LEFT JOIN balance_n b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'
            
            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique_crf_n AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRF'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ORDRE
        ),

        compterubriques_unique_crf_n AS (
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
            JOIN rubrique_unique_crf_n r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'CRF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        liens_total_crf_n AS (
            SELECT
                cr.ID_RUBRIQUE::int AS ID_TOTAL,
                (elem ->> 'compte')::int AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM compterubriques_unique_crf_n cr
            JOIN rubrique_unique_crf_n r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE r.NATURE = 'TOTAL'
        ),

        total_recursive_crf_n AS (
            SELECT
                ld.ID_RUBRIQUE,
                ld.MONTANTBRUT,
                0::numeric AS MONTANTAMORT
            FROM ligne_detail_crf_n ld
            JOIN rubriques r
                ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE 
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'CRF'
                AND SUBTABLE = 0
                AND r.NATURE NOT IN ('TOTAL', 'TITRE')

            UNION ALL

            SELECT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                0::numeric AS MONTANTAMORT
            FROM total_recursive_crf_n tr
            JOIN liens_total_crf_n lt
                ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        CRF_N AS (
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
                            AND aj.ID_ETAT = 'CRF'
                            AND aj.id_dossier = :id_dossier
                            AND aj.id_exercice = :id_exercice
                            AND aj.id_compte = :id_compte
                    ), '[]'::json
                ) AS ajusts
            FROM rubriquesmatrices r
            LEFT JOIN total_recursive_crf_n tr
                ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'CRF'
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
        ),

        -- TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD N

        totalmixte_bilan_to_tftd_map_n AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTI'
                AND cr.NATURE = 'BILAN'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice
                AND cr.EXERCICE = 'N'
        ),

        totalmixte_bilan_to_tftd_sum_n AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(ba.MONTANTNET * m.COEFF) AS MONTANTNET_BILAN_N
            FROM totalmixte_bilan_to_tftd_map_n m
            LEFT JOIN BILAN_A_P_N ba
                ON ba.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),

        totalmixte_bilan_to_tftd_map_n1 AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTD'
                AND cr.NATURE = 'BILAN'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice_N1
                AND cr.EXERCICE = 'N1'
        ),

        totalmixte_bilan_to_tftd_sum_n1 AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(ba.MONTANTNET * m.COEFF) AS MONTANTNET_BILAN_N1
            FROM totalmixte_bilan_to_tftd_map_n1 m
            LEFT JOIN BILAN_A_P_N1 ba
                ON ba.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),

        COMPTE_RUBRIQUES_TFTD AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM COMPTERUBRIQUES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTD'
                AND ACTIVE = true

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTS
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTD'
                AND NATURE = 'BRUT'
        ),
        
        ligne_detail_tftd_n AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                            AND (
                                CR2.CONDITION = 'SOLDE'
                                OR (CR2.CONDITION = 'SiD' AND b.SOLDEDEBITTRESO <> 0)
                                OR (CR2.CONDITION = 'SiC' AND b.SOLDECREDITTRESO <> 0)
                            )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (
                                            COALESCE(b.SOLDEDEBITTRESO, 0)
                                        - COALESCE(b.SOLDECREDITTRESO, 0)
                                        )
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (
                                            COALESCE(b.SOLDECREDITTRESO, 0)
                                        - COALESCE(b.SOLDEDEBITTRESO, 0)
                                        )
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE(MAX(tmbn.MONTANTNET_BILAN_N), 0)
                + COALESCE(MAX(tmbn1.MONTANTNET_BILAN_N1), 0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE
                        A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                        AND A.ID_COMPTE = :id_compte
                        AND A.ID_DOSSIER = :id_dossier
                        AND A.ID_EXERCICE = :id_exercice
                        AND A.ID_ETAT = 'TFTD'
                        AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT

            FROM COMPTE_RUBRIQUES_TFTD CR

            LEFT JOIN COMPTERUBRIQUES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'TFTD'
            AND CR2.ACTIVE = true

            LEFT JOIN balance_n b
                ON b.COMPTE LIKE CR2.COMPTE::text || '%'

            LEFT JOIN totalmixte_bilan_to_tftd_sum_n tmbn 
                ON tmbn.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            LEFT JOIN totalmixte_bilan_to_tftd_sum_n1 tmbn1
                ON tmbn1.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique_tftd_n AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTD'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ORDRE
        ),

        compterubriques_unique_tftd_n AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object(
                    'compte', cr.COMPTE::int,
                    'equation', cr.EQUATION
                )) AS comptes,
                MAX(cr.EQUATION) AS EQUATION,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM compterubriques cr
            JOIN rubrique_unique_tftd_n r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'TFTD'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        liens_total_tftd_n AS (
            SELECT
                cr.ID_RUBRIQUE::int AS ID_TOTAL,
                (elem ->> 'compte')::int AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM compterubriques_unique_tftd_n cr
            JOIN rubrique_unique_tftd_n r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE r.NATURE = 'TOTAL'
        ),

        total_recursive_tftd_n AS (
            SELECT
                ld.ID_RUBRIQUE,
                ld.MONTANTBRUT,
                0::numeric AS MONTANTAMORT
            FROM ligne_detail_tftd_n ld
            JOIN rubriques r
                ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE 
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'TFTD'
                AND r.SUBTABLE = 0
                AND r.NATURE NOT IN ('TOTAL', 'TITRE')

            UNION ALL

            SELECT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                0::numeric AS MONTANTAMORT
            FROM total_recursive_tftd_n tr
            JOIN liens_total_tftd_n lt
                ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        TFTD_N AS (
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
                        AND aj.id_dossier = :id_dossier
                        AND aj.id_exercice = :id_exercice
                        AND aj.id_compte = :id_compte
                        AND aj.ID_ETAT = 'TFTD'
                    ), '[]'::json
                ) AS ajusts
            FROM rubriquesmatrices r
            LEFT JOIN total_recursive_tftd_n tr
                ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'TFTD'
                AND r.SUBTABLE = 0
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
        ),

        -- TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI N

        totalmixte_bilan_to_tfti_map_n AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTI'
                AND cr.NATURE = 'BILAN'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice
                AND cr.EXERCICE = 'N'
        ),

        totalmixte_bilan_to_tfti_sum_n AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(ba.MONTANTNET * m.COEFF) AS MONTANTNET_BILAN_N
            FROM totalmixte_bilan_to_tfti_map_n m
            LEFT JOIN BILAN_A_P_N ba
                ON ba.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),

        totalmixte_bilan_to_tfti_map_n1 AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTI'
                AND cr.NATURE = 'BILAN'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice_N1
                AND cr.EXERCICE = 'N1'
        ),

        totalmixte_bilan_to_tfti_sum_n1 AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(ba.MONTANTNET * m.COEFF) AS MONTANTNET_BILAN_N1
            FROM totalmixte_bilan_to_tfti_map_n1 m
            LEFT JOIN BILAN_A_P_N1 ba
                ON ba.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),

        totalmixte_crn_to_tfti_map_n AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTI'
                AND cr.NATURE = 'CRN'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice
                AND cr.EXERCICE = 'N'
        ),

        totalmixte_crn_to_tfti_sum_n AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(crn.MONTANTNET * m.COEFF) AS MONTANTNET_CRN_N
            FROM totalmixte_crn_to_tfti_map_n m
            LEFT JOIN CRN_N crn
                ON crn.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),
        
        totalmixte_bilan_a_var_to_tfti_map_n AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTI'
                AND cr.NATURE = 'BILAN_ACTIF_VAR'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice
                AND cr.EXERCICE = 'N'
        ),

        totalmixte_bilan_a_var_to_tfti_sum_n AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(
                    (
                        COALESCE(ba.MONTANTNETN1, 0)
                    - COALESCE(ba.MONTANTNET, 0)
                    ) * m.COEFF
                )
                AS MONTANTNET_BILAN_A_VAR_N
            FROM totalmixte_bilan_a_var_to_tfti_map_n m
            LEFT JOIN BILAN_P_A_COMPLET ba
                ON ba.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),

        totalmixte_bilan_p_var_to_tfti_map_n AS (
            SELECT
                cr.ID_RUBRIQUE      AS ID_TOTALMIXTE,
                cr.COMPTE::int      AS ID_RUBRIQUE_BILAN,
                CASE 
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM compterubriques cr
            WHERE
                cr.ID_ETAT = 'TFTI'
                AND cr.NATURE = 'BILAN_PASSIF_VAR'
                AND cr.COMPTE ~ '^[0-9]+$'
                AND cr.ID_COMPTE = :id_compte
                AND cr.ID_DOSSIER = :id_dossier
                AND cr.ID_EXERCICE = :id_exercice
                AND cr.EXERCICE = 'N'
        ),

        totalmixte_bilan_p_var_to_tfti_sum_n AS (
            SELECT
                m.ID_TOTALMIXTE,
                SUM(
                    (
                        COALESCE(ba.MONTANTNET, 0)
                    - COALESCE(ba.MONTANTNETN1, 0)
                    ) * m.COEFF
                )
                AS MONTANTNET_BILAN_P_VAR_N
            FROM totalmixte_bilan_p_var_to_tfti_map_n m
            LEFT JOIN BILAN_P_A_COMPLET ba
                ON ba.ID_RUBRIQUE = m.ID_RUBRIQUE_BILAN
            GROUP BY m.ID_TOTALMIXTE
        ),

        COMPTE_RUBRIQUES_TFTI AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM COMPTERUBRIQUES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTI'
                AND ACTIVE = true

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTS
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTI'
                AND NATURE = 'BRUT'
        ),

        ligne_detail_tfti_n AS (
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
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN
                                        (b.SOLDEDEBIT - b.SOLDECREDIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN
                                        (b.SOLDECREDIT - b.SOLDEDEBIT)
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),
                0)
                + COALESCE(MAX(tmbn.MONTANTNET_BILAN_N), 0)
                + COALESCE(MAX(tmbn1.MONTANTNET_BILAN_N1), 0)
                + COALESCE(MAX(tmcrnn.MONTANTNET_CRN_N), 0)
                + COALESCE(MAX(tmbav.MONTANTNET_BILAN_A_VAR_N), 0)
                + COALESCE(MAX(tmbpv.MONTANTNET_BILAN_P_VAR_N), 0)
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTS A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'TFTI'
                    AND A.NATURE = 'BRUT'
                ), 0) AS MONTANTBRUT

            FROM COMPTE_RUBRIQUES_TFTI CR

            LEFT JOIN COMPTERUBRIQUES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'TFTI'
            AND CR2.ACTIVE = true

            LEFT JOIN balance_n b
                ON b.COMPTE LIKE CR2.COMPTE::text || '%'

            LEFT JOIN totalmixte_bilan_to_tfti_sum_n tmbn
                ON tmbn.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            LEFT JOIN totalmixte_bilan_to_tfti_sum_n1 tmbn1
                ON tmbn1.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            LEFT JOIN totalmixte_crn_to_tfti_sum_n tmcrnn
                ON tmcrnn.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            LEFT JOIN totalmixte_bilan_a_var_to_tfti_sum_n tmbav
                ON tmbav.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            LEFT JOIN totalmixte_bilan_p_var_to_tfti_sum_n tmbpv
                ON tmbpv.ID_TOTALMIXTE = CR.ID_RUBRIQUE

            GROUP BY CR.ID_RUBRIQUE
        ),

        rubrique_unique_tfti_n AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM rubriques
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTI'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ORDRE
        ),

        compterubriques_unique_tfti_n AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object(
                    'compte', cr.COMPTE::int,
                    'equation', cr.EQUATION
                )) AS comptes,
                MAX(cr.EQUATION) AS EQUATION,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM compterubriques cr
            JOIN rubrique_unique_tfti_n r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'TFTI'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        liens_total_tfti_n AS (
            SELECT
                cr.ID_RUBRIQUE::int AS ID_TOTAL,
                (elem ->> 'compte')::int AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM compterubriques_unique_tfti_n cr
            JOIN rubrique_unique_tfti_n r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE r.NATURE = 'TOTAL'
        ),

        total_recursive_tfti_n AS (
            SELECT
                ld.ID_RUBRIQUE,
                ld.MONTANTBRUT,
                0::numeric AS MONTANTAMORT
            FROM ligne_detail_tfti_n ld
            JOIN rubriques r
                ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE 
                r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'TFTI'
                AND r.SUBTABLE = 0
                AND r.NATURE NOT IN ('TOTAL', 'TITRE')

            UNION ALL

            SELECT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                0::numeric AS MONTANTAMORT
            FROM total_recursive_tfti_n tr
            JOIN liens_total_tfti_n lt
                ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        TFTI_N AS (
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
                        AND aj.id_dossier = :id_dossier
                        AND aj.id_exercice = :id_exercice
                        AND aj.id_compte = :id_compte
                        AND aj.ID_ETAT = 'TFTI'
                ), '[]'::json) AS ajusts
            FROM rubriquesmatrices r
            LEFT JOIN total_recursive_tfti_n tr
                ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'TFTI'
                AND r.SUBTABLE = 0
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

        SELECT * FROM BILAN_P_A_COMPLET
        UNION ALL
        SELECT * FROM CRN_N
        UNION ALL
        SELECT * FROM CRF_N
        UNION ALL
        SELECT * FROM TFTD_N
        UNION ALL
        SELECT * FROM TFTI_N

        `,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, id_exercice_N1: id_exerciceN1 }
        }
    );

    return rows;
}

const getEbilanComplet = async (id_compte, id_dossier, id_exercice, id_etat) => {
    const {
        id_exerciceN1,
    } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

    const id_exerciceN_1 = id_exerciceN1 ?? 0;
    const rowsN = await runBilanCompet(id_compte, id_dossier, id_exercice);
    let rowsN1 = [];

    if (id_exerciceN_1 !== 0) {
        rowsN1 = await runBilanCompet(id_compte, id_dossier, id_exerciceN_1);
    }

    const mapN1 = Object.fromEntries(
        rowsN1.map(r => [`${r.id_rubrique}_${r.id_etat}`, r.montantnet])
    )

    const finalRows = rowsN.map(r => ({
        ...r,
        montantnetn1: mapN1[`${r.id_rubrique}_${r.id_etat}`] ?? 0,
        id_compte,
        id_dossier,
        id_exercice
    }));

    return finalRows;
    // return rowsN;
};

const getDetailLigne = async (id_compte, id_dossier, id_exercice, id_etat, id_rubrique, subtable) => {
    const rows = await db.sequelize.query(
        `
            WITH balance AS (
                SELECT
                    MIN(J.COMPTEGEN) || J.COMPTEAUX AS COMPTEFILTER,
                    MIN(J.COMPTEAUX) AS COMPTE,
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
                    AND TRIM(R.NATURE) NOT LIKE 'TOTAL%'
            ),

            ligne_detail AS (
                SELECT
                    b.COMPTEFILTER,
                    b.LIBELLE,
                    MIN(b.COMPTE) AS COMPTE,

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
                    ON b.COMPTEFILTER LIKE rc.COMPTE || '%'
                GROUP BY
                    b.COMPTEFILTER,
                    b.LIBELLE
                ORDER BY b.COMPTEFILTER ASC
            )

            SELECT *
            FROM ligne_detail
            WHERE
                SOLDEDEBIT <> 0
                OR SOLDECREDIT <> 0

        `,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, id_rubrique, id_etat, subtable }
        }
    )

    return rows;
}

const getListeCompteNonAssocieTFTD = async (id_compte, id_dossier, id_exercice, id_etat) => {
    const data = await db.sequelize.query(`
        WITH
            BALANCE AS (
                SELECT
                    MIN(J.COMPTEGEN) AS COMPTEGEN,
                    J.COMPTEAUX AS COMPTE,
                    MIN(J.COMPTEGEN) || J.COMPTEAUX AS COMPTEFILTER, 
                    MIN(J.LIBELLEAUX) AS LIBELLE
                FROM
                    JOURNALS J
                    LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
                WHERE
                    J.ID_DOSSIER = :id_dossier
                    AND J.ID_EXERCICE = :id_exercice
                    AND J.ID_COMPTE = :id_compte
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            DOSSIERPLANCOMPTABLES DPC
                        WHERE
                            DPC.COMPTE = J.COMPTEAUX
                            AND DPC.ID_DOSSIER = :id_dossier
                            AND DPC.ID_COMPTE = :id_compte
                            AND DPC.NATURE = 'Collectif'
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            CODEJOURNALS CJ2
                        WHERE
                            CJ2.COMPTEASSOCIE IS NOT NULL
                            AND CJ2.COMPTEASSOCIE = J.COMPTEAUX
                    )
                GROUP BY
                    J.COMPTEAUX
                ORDER BY
                    COMPTEGEN,
                    COMPTE
            ),
            RUBRIQUE_COMPTES AS (
                SELECT DISTINCT
                    CR.COMPTE
                FROM
                    RUBRIQUES R
                    JOIN COMPTERUBRIQUES CR ON CR.ID_RUBRIQUE = R.ID_RUBRIQUE
                WHERE
                    R.ID_DOSSIER = :id_dossier
                    AND R.ID_COMPTE = :id_compte
                    AND R.ID_EXERCICE = :id_exercice
                    AND R.ID_ETAT = :id_etat
                    AND R.SUBTABLE = 0
                    AND TRIM(R.NATURE) IN ('BRUT', 'AMORT')
                    AND CR.ID_DOSSIER = :id_dossier
                    AND CR.ID_COMPTE = :id_compte
                    AND CR.ID_EXERCICE = :id_exercice
                    AND CR.ID_ETAT = :id_etat
                    AND CR.ACTIVE = TRUE
            )
        SELECT
            B.*
        FROM
            BALANCE B
        WHERE
            NOT EXISTS (
                SELECT
                    1
                FROM
                    RUBRIQUE_COMPTES RC
                WHERE
                    B.COMPTEFILTER LIKE RC.COMPTE || '%'
            )
        ORDER BY
            B.COMPTE ASC;
    `, {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id_compte, id_dossier, id_exercice, id_etat }
    })

    return data;
}

module.exports = {
    getEbilanComplet,
    getDetailLigne,
    getListeCompteNonAssocieTFTD
};
