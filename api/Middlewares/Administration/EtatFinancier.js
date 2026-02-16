const db = require('../../Models');
const recupExerciceN1 = require('../../Middlewares/Standard/recupExerciceN1');

const runEtatFinancier = async (id_compte, id_dossier, id_exercice) => {
    const {
        id_exerciceN1,
    } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

    const rows = await db.sequelize.query(
        `
CREATE OR REPLACE FUNCTION calc_totalmix_liaison(
    p_tableau text,
    p_table_name text,
    p_id_compte int,
    p_id_dossier int,
    p_id_exercice int
)
RETURNS TABLE(
    id_totalmixte int,
    id_rubrique int,
    coeff int
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.id_rubrique AS id_totalmixte,
        cr.compte AS id_rubrique,
        CASE WHEN cr.equation = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS coeff
    FROM compterubriqueexternes cr
    LEFT JOIN rubriquesexternes r
        ON r.id_rubrique = cr.id_rubrique
        AND r.id_etat = 'TFTI'
        AND r.id_compte = p_id_compte
        AND r.id_dossier = p_id_dossier
        AND r.id_exercice = p_id_exercice
    WHERE cr.id_etat = 'TFTI'
      AND cr.tableau = p_tableau
      AND cr.compte ~ '^[0-9]+$'
      AND cr.id_compte = p_id_compte
      AND cr.id_dossier = p_id_dossier
      AND cr.id_exercice = p_id_exercice
      AND r.type = 'LIAISON';
END;
$$ LANGUAGE plpgsql;
        -- BALANCE N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N 
        WITH RECURSIVE BALANCE_N AS (
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

        -- BALANCE N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 
        BALANCE_N1 AS (
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

        -- BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF EXERCICE N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_BILAN_ACTIF_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'BILAN_ACTIF'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'BILAN_ACTIF'
        ),

        LIGNE_DETAIL_BILAN_ACTIF_N AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'BILAN_ACTIF'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'BILAN_ACTIF'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_BILAN_ACTIF_N CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'BILAN_ACTIF'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_BILAN_ACTIF_N AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'BILAN_ACTIF'
                AND SUBTABLE = 1
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_BILAN_ACTIF_N AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_BILAN_ACTIF_N r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'BILAN_ACTIF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_BILAN_ACTIF_N AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_BILAN_ACTIF_N cr
            JOIN 
                RUBRIQUE_UNIQUE_BILAN_ACTIF_N r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_BILAN_ACTIF_N AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_BILAN_ACTIF_N ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'BILAN_ACTIF'
                AND SUBTABLE = 1
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_BILAN_ACTIF_N tr
            JOIN LIENS_TOTAL_BILAN_ACTIF_N lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        BILAN_ACTIF_N AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'BILAN_ACTIF'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_BILAN_ACTIF_N tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'BILAN_ACTIF'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice
                AND SUBTABLE = 1
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF BILAN ACTIF EXERCICE N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 

        COMPTE_RUBRIQUES_BILAN_ACTIF_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN_ACTIF'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN_ACTIF'
        ),

        LIGNE_DETAIL_BILAN_ACTIF_N1 AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'BILAN_ACTIF'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'BILAN_ACTIF'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_BILAN_ACTIF_N1 CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'BILAN_ACTIF'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_BILAN_ACTIF_N1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN_ACTIF'
                AND SUBTABLE = 1
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_BILAN_ACTIF_N1 AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_BILAN_ACTIF_N1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'BILAN_ACTIF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_BILAN_ACTIF_N1 AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_BILAN_ACTIF_N1 cr
            JOIN 
                RUBRIQUE_UNIQUE_BILAN_ACTIF_N1 r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_BILAN_ACTIF_N1 AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_BILAN_ACTIF_N1 ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'BILAN_ACTIF'
                AND SUBTABLE = 1
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_BILAN_ACTIF_N1 tr
            JOIN LIENS_TOTAL_BILAN_ACTIF_N1 lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        BILAN_ACTIF_N1 AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'BILAN_ACTIF'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice_N1
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_BILAN_ACTIF_N1 tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'BILAN_ACTIF'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice_N1
                AND SUBTABLE = 1
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- BILAN ACTF COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        BILAN_ACTIF_COMPLET AS (
            SELECT
                n.id,
                n.ID_RUBRIQUE,
                n.LIBELLE,
                n.TYPE,
                n.ORDRE,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.ajusts
            FROM BILAN_ACTIF_N n
            LEFT JOIN BILAN_ACTIF_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        ),

        -- BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF EXERCICE N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_BILAN_PASSIF_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'BILAN_PASSIF'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'BILAN_PASSIF'
        ),

        LIGNE_DETAIL_BILAN_PASSIF_N AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'BILAN_PASSIF'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'BILAN_PASSIF'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_BILAN_PASSIF_N CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'BILAN_PASSIF'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_BILAN_PASSIF_N AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'BILAN_PASSIF'
                AND SUBTABLE = 2
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_BILAN_PASSIF_N AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_BILAN_PASSIF_N r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'BILAN_PASSIF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_BILAN_PASSIF_N AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_BILAN_PASSIF_N cr
            JOIN 
                RUBRIQUE_UNIQUE_BILAN_PASSIF_N r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_BILAN_PASSIF_N AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_BILAN_PASSIF_N ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'BILAN_PASSIF'
                AND SUBTABLE = 2
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_BILAN_PASSIF_N tr
            JOIN LIENS_TOTAL_BILAN_PASSIF_N lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        BILAN_PASSIF_N AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'BILAN_PASSIF'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_BILAN_PASSIF_N tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'BILAN_PASSIF'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice
                AND SUBTABLE = 2
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF BILAN PASSIF EXERCICE N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1

        COMPTE_RUBRIQUES_BILAN_PASSIF_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN_PASSIF'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN_PASSIF'
        ),

        LIGNE_DETAIL_BILAN_PASSIF_N1 AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'BILAN_PASSIF'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'BILAN_PASSIF'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_BILAN_PASSIF_N1 CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'BILAN_PASSIF'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_BILAN_PASSIF_N1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'BILAN_PASSIF'
                AND SUBTABLE = 2
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_BILAN_PASSIF_N1 AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_BILAN_PASSIF_N1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'BILAN_PASSIF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_BILAN_PASSIF_N1 AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_BILAN_PASSIF_N1 cr
            JOIN 
                RUBRIQUE_UNIQUE_BILAN_PASSIF_N1 r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_BILAN_PASSIF_N1 AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_BILAN_PASSIF_N1 ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'BILAN_PASSIF'
                AND SUBTABLE = 2
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_BILAN_PASSIF_N1 tr
            JOIN LIENS_TOTAL_BILAN_PASSIF_N1 lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        BILAN_PASSIF_N1 AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'BILAN_PASSIF'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice_N1
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_BILAN_PASSIF_N1 tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'BILAN_PASSIF'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice_N1
                AND SUBTABLE = 2
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- BILAN PASSIF COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        BILAN_PASSIF_COMPLET AS (
            SELECT
                n.id,
                n.ID_RUBRIQUE,
                n.LIBELLE,
                n.TYPE,
                n.ORDRE,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.ajusts
            FROM BILAN_PASSIF_N n
            LEFT JOIN BILAN_PASSIF_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        ),

        -- CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_CRN_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRN'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRN'
        ),

        LIGNE_DETAIL_CRN_N AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'CRN'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'CRN'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_CRN_N CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'CRN'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_CRN_N AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRN'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_CRN_N AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_CRN_N r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'CRN'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_CRN_N AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_CRN_N cr
            JOIN 
                RUBRIQUE_UNIQUE_CRN_N r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_CRN_N AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_CRN_N ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'CRN'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_CRN_N tr
            JOIN LIENS_TOTAL_CRN_N lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        CRN_N AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'CRN'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_CRN_N tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'CRN'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN CRN N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1

        COMPTE_RUBRIQUES_CRN_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'CRN'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'CRN'
        ),

        LIGNE_DETAIL_CRN_N1 AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'CRN'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'CRN'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_CRN_N1 CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'CRN'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_CRN_N1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'CRN'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_CRN_N1 AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_CRN_N1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'CRN'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_CRN_N1 AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_CRN_N1 cr
            JOIN 
                RUBRIQUE_UNIQUE_CRN_N1 r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_CRN_N1 AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_CRN_N1 ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'CRN'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_CRN_N1 tr
            JOIN LIENS_TOTAL_CRN_N1 lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        CRN_N1 AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'CRN'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice_N1
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_CRN_N1 tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'CRN'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice_N1
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- CRN COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        CRN_COMPLET AS (
            SELECT
                n.id,
                n.ID_RUBRIQUE,
                n.LIBELLE,
                n.TYPE,
                n.ORDRE,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.ajusts
            FROM CRN_N n
            LEFT JOIN CRN_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        ),

        -- CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_CRF_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRF'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRF'
        ),

        LIGNE_DETAIL_CRF_N AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'CRF'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'CRF'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_CRF_N CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'CRF'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_CRF_N AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'CRF'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_CRF_N AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_CRF_N r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'CRF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_CRF_N AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_CRF_N cr
            JOIN 
                RUBRIQUE_UNIQUE_CRF_N r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_CRF_N AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_CRF_N ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'CRF'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_CRF_N tr
            JOIN LIENS_TOTAL_CRF_N lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        CRF_N AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'CRF'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_CRF_N tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'CRF'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF CRF N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 

        COMPTE_RUBRIQUES_CRF_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'CRF'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'CRF'
        ),

        LIGNE_DETAIL_CRF_N1 AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'CRF'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'CRF'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_CRF_N1 CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'CRF'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_CRF_N1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'CRF'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_CRF_N1 AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_CRF_N1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'CRF'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_CRF_N1 AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_CRF_N1 cr
            JOIN 
                RUBRIQUE_UNIQUE_CRF_N1 r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_CRF_N1 AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_CRF_N1 ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'CRF'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_CRF_N1 tr
            JOIN LIENS_TOTAL_CRF_N1 lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        CRF_N1 AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'CRF'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice_N1
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_CRF_N1 tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'CRF'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice_N1
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- CRF COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        CRF_COMPLET AS (
            SELECT
                n.id,
                n.ID_RUBRIQUE,
                n.LIBELLE,
                n.TYPE,
                n.ORDRE,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.ajusts
            FROM CRF_N n
            LEFT JOIN CRF_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        ),

        -- TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_TFTD_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTD'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTD'
        ),

        LIGNE_DETAIL_TFTD_N AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBITTRESO,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDITTRESO,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBITTRESO,0) - COALESCE(b.SOLDECREDITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDITTRESO,0) - COALESCE(b.SOLDEDEBITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'TFTD'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBITTRESO,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDITTRESO,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBITTRESO,0) - COALESCE(b.SOLDECREDITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDITTRESO,0) - COALESCE(b.SOLDEDEBITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'TFTD'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_TFTD_N CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'TFTD'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_TFTD_N AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTD'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_TFTD_N AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_TFTD_N r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'TFTD'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_TFTD_N AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_TFTD_N cr
            JOIN 
                RUBRIQUE_UNIQUE_TFTD_N r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_TFTD_N AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_TFTD_N ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'TFTD'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_TFTD_N tr
            JOIN LIENS_TOTAL_TFTD_N lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        TFTD_N AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'TFTD'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_TFTD_N tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'TFTD'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD TFTD N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 

        COMPTE_RUBRIQUES_TFTD_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'TFTD'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'TFTD'
        ),

        LIGNE_DETAIL_TFTD_N1 AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBITTRESO,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDITTRESO,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBITTRESO,0) - COALESCE(b.SOLDECREDITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDITTRESO,0) - COALESCE(b.SOLDEDEBITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'TFTD'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBITTRESO,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDITTRESO,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBITTRESO,0) - COALESCE(b.SOLDECREDITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDITTRESO,0) - COALESCE(b.SOLDEDEBITTRESO,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'TFTD'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_TFTD_N1 CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'TFTD'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_TFTD_N1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'TFTD'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_TFTD_N1 AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_TFTD_N1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'TFTD'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_TFTD_N1 AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_TFTD_N1 cr
            JOIN 
                RUBRIQUE_UNIQUE_TFTD_N1 r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_TFTD_N1 AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_TFTD_N1 ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'TFTD'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_TFTD_N1 tr
            JOIN LIENS_TOTAL_TFTD_N1 lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        TFTD_N1 AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'TFTD'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice_N1
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_TFTD_N1 tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'TFTD'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice_N1
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- TFTD COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TFTD_COMPLET AS (
            SELECT
                n.id,
                n.ID_RUBRIQUE,
                n.LIBELLE,
                n.TYPE,
                n.ORDRE,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.ajusts
            FROM TFTD_N n
            LEFT JOIN TFTD_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        ),

        -- TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI N N N N N N N N N N N N N N N N N N N 

        -- LIAISON N BILAN ACTTIF N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TOTALMIXTE_LIAISON_N_BILAN_ACTIF_TFTI AS (
            SELECT
                CR.ID_RUBRIQUE AS ID_TOTALMIXTE,
                CR.COMPTE AS ID_RUBRIQUE,
                CASE
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM
                COMPTERUBRIQUEEXTERNES CR
                LEFT JOIN RUBRIQUESEXTERNES R ON R.ID_RUBRIQUE = CR.ID_RUBRIQUE
                AND R.ID_ETAT = 'TFTI'
                AND R.ID_COMPTE = :id_compte
                AND R.ID_DOSSIER = :id_dossier
                AND R.ID_EXERCICE = :id_exercice
            WHERE
                CR.ID_ETAT = 'TFTI'
                AND CR.TABLEAU = 'BILAN_ACTIF'
                AND CR.COMPTE ~ '^[0-9]+$'
                AND CR.ID_COMPTE = :id_compte
                AND CR.ID_DOSSIER = :id_dossier
                AND CR.ID_EXERCICE = :id_exercice
                AND R.TYPE = 'LIAISON'
        ),

        TOTAL_MIXTE_LIAISON_N_BILAN_ACTIF_SUM_TFTI AS (
            SELECT
                totalmixte.ID_TOTALMIXTE,
                SUM(tableau.MONTANTNET * totalmixte.COEFF) AS MONTANTNET
            FROM TOTALMIXTE_LIAISON_N_BILAN_ACTIF_TFTI totalmixte
            LEFT JOIN BILAN_ACTIF_N tableau
                ON tableau.ID_RUBRIQUE = totalmixte.ID_RUBRIQUE
            GROUP BY totalmixte.ID_TOTALMIXTE
        ),

        -- LIAISON N BILAN PASSIF N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TOTALMIXTE_LIAISON_N_BILAN_PASSIF_TFTI AS (
            SELECT
                CR.ID_RUBRIQUE AS ID_TOTALMIXTE,
                CR.COMPTE AS ID_RUBRIQUE,
                CASE
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM
                COMPTERUBRIQUEEXTERNES CR
                LEFT JOIN RUBRIQUESEXTERNES R ON R.ID_RUBRIQUE = CR.ID_RUBRIQUE
                AND R.ID_ETAT = 'TFTI'
                AND R.ID_COMPTE = :id_compte
                AND R.ID_DOSSIER = :id_dossier
                AND R.ID_EXERCICE = :id_exercice
            WHERE
                CR.ID_ETAT = 'TFTI'
                AND CR.TABLEAU = 'BILAN_PASSIF'
                AND CR.COMPTE ~ '^[0-9]+$'
                AND CR.ID_COMPTE = :id_compte
                AND CR.ID_DOSSIER = :id_dossier
                AND CR.ID_EXERCICE = :id_exercice
                AND R.TYPE = 'LIAISON'
        ),

        TOTAL_MIXTE_LIAISON_N_BILAN_PASSIF_SUM_TFTI AS (
            SELECT
                totalmixte.ID_TOTALMIXTE,
                SUM(tableau.MONTANTNET * totalmixte.COEFF) AS MONTANTNET
            FROM TOTALMIXTE_LIAISON_N_BILAN_PASSIF_TFTI totalmixte
            LEFT JOIN BILAN_PASSIF_N tableau
                ON tableau.ID_RUBRIQUE = totalmixte.ID_RUBRIQUE
            GROUP BY totalmixte.ID_TOTALMIXTE
        ),
        
        -- LIAISON N CRN N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TOTALMIXTE_LIAISON_N_CRN_TFTI AS (
            SELECT
                CR.ID_RUBRIQUE AS ID_TOTALMIXTE,
                CR.COMPTE AS ID_RUBRIQUE,
                CASE
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM
                COMPTERUBRIQUEEXTERNES CR
                LEFT JOIN RUBRIQUESEXTERNES R ON R.ID_RUBRIQUE = CR.ID_RUBRIQUE
                AND R.ID_ETAT = 'TFTI'
                AND R.ID_COMPTE = :id_compte
                AND R.ID_DOSSIER = :id_dossier
                AND R.ID_EXERCICE = :id_exercice
            WHERE
                CR.ID_ETAT = 'TFTI'
                AND CR.TABLEAU = 'CRN'
                AND CR.COMPTE ~ '^[0-9]+$'
                AND CR.ID_COMPTE = :id_compte
                AND CR.ID_DOSSIER = :id_dossier
                AND CR.ID_EXERCICE = :id_exercice
                AND R.TYPE = 'LIAISON'
        ),

        TOTAL_MIXTE_LIAISON_N_CRN_SUM_TFTI AS (
            SELECT
                totalmixte.ID_TOTALMIXTE,
                SUM(tableau.MONTANTNET * totalmixte.COEFF) AS MONTANTNET
            FROM TOTALMIXTE_LIAISON_N_CRN_TFTI totalmixte
            LEFT JOIN CRN_N tableau
                ON tableau.ID_RUBRIQUE = totalmixte.ID_RUBRIQUE
            GROUP BY totalmixte.ID_TOTALMIXTE
        ),

        -- LIAISON N CRF N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TOTALMIXTE_LIAISON_N_CRF_TFTI AS (
            SELECT
                CR.ID_RUBRIQUE AS ID_TOTALMIXTE,
                CR.COMPTE AS ID_RUBRIQUE,
                CASE
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM
                COMPTERUBRIQUEEXTERNES CR
                LEFT JOIN RUBRIQUESEXTERNES R ON R.ID_RUBRIQUE = CR.ID_RUBRIQUE
                AND R.ID_ETAT = 'TFTI'
                AND R.ID_COMPTE = :id_compte
                AND R.ID_DOSSIER = :id_dossier
                AND R.ID_EXERCICE = :id_exercice
            WHERE
                CR.ID_ETAT = 'TFTI'
                AND CR.TABLEAU = 'CRF'
                AND CR.COMPTE ~ '^[0-9]+$'
                AND CR.ID_COMPTE = :id_compte
                AND CR.ID_DOSSIER = :id_dossier
                AND CR.ID_EXERCICE = :id_exercice
                AND R.TYPE = 'LIAISON'
        ),

        TOTAL_MIXTE_LIAISON_N_CRF_SUM_TFTI AS (
            SELECT
                totalmixte.ID_TOTALMIXTE,
                SUM(tableau.MONTANTNET * totalmixte.COEFF) AS MONTANTNET
            FROM TOTALMIXTE_LIAISON_N_CRF_TFTI totalmixte
            LEFT JOIN CRF_N tableau
                ON tableau.ID_RUBRIQUE = totalmixte.ID_RUBRIQUE
            GROUP BY totalmixte.ID_TOTALMIXTE
        ),

        -- LIAISON N TFTD N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TOTALMIXTE_LIAISON_N_TFTD_TFTI AS (
            SELECT
                CR.ID_RUBRIQUE AS ID_TOTALMIXTE,
                CR.COMPTE AS ID_RUBRIQUE,
                CASE
                    WHEN CR.EQUATION = 'SOUSTRACTIF' THEN -1
                    ELSE 1
                END AS COEFF
            FROM
                COMPTERUBRIQUEEXTERNES CR
                LEFT JOIN RUBRIQUESEXTERNES R ON R.ID_RUBRIQUE = CR.ID_RUBRIQUE
                AND R.ID_ETAT = 'TFTI'
                AND R.ID_COMPTE = :id_compte
                AND R.ID_DOSSIER = :id_dossier
                AND R.ID_EXERCICE = :id_exercice
            WHERE
                CR.ID_ETAT = 'TFTI'
                AND CR.TABLEAU = 'TFTD'
                AND CR.COMPTE ~ '^[0-9]+$'
                AND CR.ID_COMPTE = :id_compte
                AND CR.ID_DOSSIER = :id_dossier
                AND CR.ID_EXERCICE = :id_exercice
                AND R.TYPE = 'LIAISON'
        ),

        TOTAL_MIXTE_LIAISON_N_TFTD_SUM_TFTI AS (
            SELECT
                totalmixte.ID_TOTALMIXTE,
                SUM(tableau.MONTANTNET * totalmixte.COEFF) AS MONTANTNET
            FROM TOTALMIXTE_LIAISON_N_TFTD_TFTI totalmixte
            LEFT JOIN TFTD_N tableau
                ON tableau.ID_RUBRIQUE = totalmixte.ID_RUBRIQUE
            GROUP BY totalmixte.ID_TOTALMIXTE
        ),

        -- LIAISON N TFTD N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        COMPTE_RUBRIQUES_TFTI_N AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTI'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTI'
        ),

        LIGNE_DETAIL_TFTI_N AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'TFTI'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice
                    AND A.ID_ETAT = 'TFTI'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_TFTI_N CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice
            AND CR2.ID_ETAT = 'TFTI'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_TFTI_N AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice
                AND ID_ETAT = 'TFTI'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_TFTI_N AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_TFTI_N r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'TFTI'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_TFTI_N AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_TFTI_N cr
            JOIN 
                RUBRIQUE_UNIQUE_TFTI_N r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_TFTI_N AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_TFTI_N ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice
                AND r.ID_ETAT = 'TFTI'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_TFTI_N tr
            JOIN LIENS_TOTAL_TFTI_N lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        TFTI_N AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'TFTI'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_TFTI_N tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'TFTI'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI TFTI N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1 N1

        COMPTE_RUBRIQUES_TFTI_N1 AS (
            SELECT DISTINCT ID_RUBRIQUE
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'TFTI'
                AND TYPE <> 'TITRE'

            UNION

            SELECT DISTINCT ID_RUBRIQUE
            FROM AJUSTEMENTEXTERNES
            WHERE ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'TFTI'
        ),

        LIGNE_DETAIL_TFTI_N1 AS (
            SELECT
                CR.ID_RUBRIQUE,
                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'BRUT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'TFTI'
                    AND A.NATURE = 'BRUT'
                ),0) AS MONTANTBRUT,

                COALESCE(
                    SUM(
                        CASE
                            WHEN CR2.NATURE = 'AMORT'
                                AND (
                                    CR2.CONDITION = 'SOLDE'
                                    OR (CR2.CONDITION = 'SiD' AND COALESCE(b.SOLDEDEBIT,0) <> 0)
                                    OR (CR2.CONDITION = 'SiC' AND COALESCE(b.SOLDECREDIT,0) <> 0)
                                )
                            THEN
                                CASE CR2.SENSCALCUL
                                    WHEN 'D-C' THEN (COALESCE(b.SOLDEDEBIT,0) - COALESCE(b.SOLDECREDIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    WHEN 'C-D' THEN (COALESCE(b.SOLDECREDIT,0) - COALESCE(b.SOLDEDEBIT,0))
                                        * CASE WHEN CR2.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END
                                    ELSE 0
                                END
                            ELSE 0
                        END
                    ),0
                ) 
                + COALESCE((
                    SELECT SUM(A.MONTANT)
                    FROM AJUSTEMENTEXTERNES A
                    WHERE A.ID_RUBRIQUE = CR.ID_RUBRIQUE
                    AND A.ID_COMPTE = :id_compte
                    AND A.ID_DOSSIER = :id_dossier
                    AND A.ID_EXERCICE = :id_exercice_N1
                    AND A.ID_ETAT = 'TFTI'
                    AND A.NATURE = 'AMORT'
                ),0) AS MONTANTAMORT

            FROM COMPTE_RUBRIQUES_TFTI_N1 CR

            LEFT JOIN COMPTERUBRIQUEEXTERNES CR2
                ON CR2.ID_RUBRIQUE = CR.ID_RUBRIQUE
            AND CR2.ID_COMPTE = :id_compte
            AND CR2.ID_DOSSIER = :id_dossier
            AND CR2.ID_EXERCICE = :id_exercice_N1
            AND CR2.ID_ETAT = 'TFTI'
            AND CR2.ACTIVE = true

            LEFT JOIN BALANCE_N1 b
                ON CR2.COMPTE IS NOT NULL
            AND b.COMPTE LIKE CR2.COMPTE || '%'

            GROUP BY CR.ID_RUBRIQUE
        ),

        RUBRIQUE_UNIQUE_TFTI_N1 AS (
            SELECT DISTINCT ON (ID_RUBRIQUE) *
            FROM RUBRIQUESEXTERNES
            WHERE 
                ID_COMPTE = :id_compte
                AND ID_DOSSIER = :id_dossier
                AND ID_EXERCICE = :id_exercice_N1
                AND ID_ETAT = 'TFTI'
                AND SUBTABLE = 0
            ORDER BY ID_RUBRIQUE, ID_ETAT, ORDRE
        ),

        COMPTERUBRIQUES_UNIQUE_TFTI_N1 AS (
            SELECT
                cr.ID_RUBRIQUE,
                cr.ID_COMPTE,
                cr.ID_DOSSIER,
                cr.ID_EXERCICE,
                json_agg(json_build_object('compte', cr.COMPTE, 'equation', cr.EQUATION)) AS comptes,
                cr.ACTIVE,
                cr.ID_ETAT
            FROM COMPTERUBRIQUEEXTERNES cr
            JOIN RUBRIQUE_UNIQUE_TFTI_N1 r
                ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
                AND r.ID_COMPTE = cr.ID_COMPTE
                AND r.ID_DOSSIER = cr.ID_DOSSIER
                AND r.ID_EXERCICE = cr.ID_EXERCICE
            WHERE 
                cr.ACTIVE = TRUE
                AND cr.ID_ETAT = 'TFTI'
            GROUP BY cr.ID_RUBRIQUE, cr.ID_COMPTE, cr.ID_DOSSIER, cr.ID_EXERCICE, cr.ACTIVE, cr.ID_ETAT
        ),

        LIENS_TOTAL_TFTI_N1 AS (
            SELECT DISTINCT
                cr.ID_RUBRIQUE AS ID_TOTAL,
                (elem ->> 'compte') AS ID_ENFANT,
                elem ->> 'equation' AS EQUATION
            FROM COMPTERUBRIQUES_UNIQUE_TFTI_N1 cr
            JOIN 
                RUBRIQUE_UNIQUE_TFTI_N1 r ON r.ID_RUBRIQUE = cr.ID_RUBRIQUE
            CROSS JOIN LATERAL jsonb_array_elements(cr.comptes::jsonb) AS elem
            WHERE 
                r.TYPE IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL')
        ),

        TOTAL_RECURSIVE_TFTI_N1 AS (
            SELECT DISTINCT
                ld.ID_RUBRIQUE AS ID_RUBRIQUE,
                ld.MONTANTBRUT::numeric AS MONTANTBRUT,
                ld.MONTANTAMORT::numeric AS MONTANTAMORT
            FROM LIGNE_DETAIL_TFTI_N1 ld
            JOIN 
                RUBRIQUESEXTERNES r ON r.ID_RUBRIQUE = ld.ID_RUBRIQUE
            WHERE r.ID_COMPTE = :id_compte
                AND r.ID_DOSSIER = :id_dossier
                AND r.ID_EXERCICE = :id_exercice_N1
                AND r.ID_ETAT = 'TFTI'
                AND SUBTABLE = 0
                AND r.TYPE NOT IN ('TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'TITRE')

            UNION ALL

            SELECT DISTINCT
                lt.ID_TOTAL AS ID_RUBRIQUE,
                tr.MONTANTBRUT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTBRUT,
                tr.MONTANTAMORT * CASE WHEN lt.EQUATION = 'SOUSTRACTIF' THEN -1 ELSE 1 END AS MONTANTAMORT
            FROM TOTAL_RECURSIVE_TFTI_N1 tr
            JOIN LIENS_TOTAL_TFTI_N1 lt
            ON lt.ID_ENFANT = tr.ID_RUBRIQUE
        ),

        TFTI_N1 AS (
            SELECT
                r.ID_RUBRIQUE,
                r.LIBELLE,
                r.TYPE,
                r.ORDRE,
                r.SUBTABLE,
                r.ID_ETAT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float AS MONTANTBRUT,
                COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTAMORT,
                COALESCE(SUM(tr.MONTANTBRUT), 0)::float - COALESCE(SUM(tr.MONTANTAMORT), 0)::float AS MONTANTNET,
                r.id::int AS id,
                COALESCE((
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
                    FROM AJUSTEMENTEXTERNES aj
                    WHERE aj.id_rubrique = r.ID_RUBRIQUE
                    AND aj.ID_ETAT = 'TFTI'
                    AND aj.ID_DOSSIER = :id_dossier
                    AND aj.ID_EXERCICE = :id_exercice_N1
                    AND aj.ID_COMPTE = :id_compte
                ), '[]'::json) AS ajusts
            FROM RUBRIQUESEXTERNES r
            LEFT JOIN TOTAL_RECURSIVE_TFTI_N1 tr ON tr.ID_RUBRIQUE = r.ID_RUBRIQUE
            WHERE 
                r.ID_ETAT = 'TFTI'
                AND r.id_compte = :id_compte
                AND r.id_dossier = :id_dossier
                AND r.id_exercice = :id_exercice_N1
                AND SUBTABLE = 0
            GROUP BY r.ID_RUBRIQUE, r.LIBELLE, r.TYPE, r.ORDRE, r.SUBTABLE, r.id, r.ID_ETAT
            ORDER BY r.ORDRE
        ),

        -- TFTI COMPLET N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N N

        TFTI_COMPLET AS (
            SELECT
                n.id,
                n.ID_RUBRIQUE,
                n.LIBELLE,
                n.TYPE,
                n.ORDRE,
                n.SUBTABLE,
                n.ID_ETAT,
                n.MONTANTBRUT,
                n.MONTANTAMORT,
                n.MONTANTNET,
                COALESCE(n1.MONTANTNET, 0) AS MONTANTNETN1,
                n.ajusts
            FROM TFTI_N n
            LEFT JOIN TFTI_N1 n1
                ON n1.ID_RUBRIQUE = n.ID_RUBRIQUE
        )

        SELECT * FROM TOTAL_MIXTE_LIAISON_N_BILAN_ACTIF_SUM_TFTI

        `,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, id_exercice_N1: id_exerciceN1 }
        }
    );

    return rows;
}

const getEtatFinancierComplet = async (id_compte, id_dossier, id_exercice, id_etat) => {
    const rows = await runEtatFinancier(id_compte, id_dossier, id_exercice);
    return rows;
};

const getDetailLigneEtatFinancier = async (id_compte, id_dossier, id_exercice, id_etat, id_rubrique, subtable) => {
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
                FROM rubriquesexternes R
                JOIN COMPTERUBRIQUEEXTERNES CR
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

module.exports = {
    getEtatFinancierComplet,
    getDetailLigneEtatFinancier
}