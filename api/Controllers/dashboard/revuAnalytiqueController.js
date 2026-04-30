const db = require("../../Models");
const { journals, exercices } = db;
const { Op } = require("sequelize");
const recupExerciceN1 = require('../../Middlewares/Standard/recupExerciceN1');

const round2 = (value) => Math.round(value * 100) / 100;

exports.getRevuAnalytiqueNN1 = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        let { date_debut, date_fin } = req.query; // Dates de periode si selectionnee
        const { id_periode } = req.query; // ID de periode alternative

        // Si id_periode est fourni mais pas les dates, récupérer les dates de la période
        if (id_periode && (!date_debut || !date_fin)) {
            const periode = await db.periodes.findOne({
                where: { id: id_periode }
            });
            if (periode) {
                date_debut = periode.date_debut;
                date_fin = periode.date_fin;
            } else {
                console.log('[DEBUG NN1] Période non trouvée pour id:', id_periode);
            }
        }

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        // Récupérer le seuil d'anomalie du dossier
        const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
        const seuilPourcent = dossier && dossier.seuil_revu_analytique ? dossier.seuil_revu_analytique : 30.0;
        const seuilDecimal = seuilPourcent / 100.0; // ex: 30.0 -> 0.3
        console.log('[revuAnalytiqueNN1] seuil dossier:', { id_dossier, seuilPourcent, seuilDecimal });

        // Récupérer l'exercice N
        const exerciceN = await exercices.findOne({
            where: { id: id_exercice }
        });
        if (!exerciceN) {
            return res.status(404).json({ state: false, message: "Exercice N non trouvé" });
        }

        // Récupérer l'exercice N-1
        const exerciceN1 = await exercices.findOne({
            where: {
                id_dossier,
                rang: exerciceN.rang - 1 // on utilise rang ici
            }
        });

        const id_exerciceN1 = exerciceN1 ? exerciceN1.id : null;
        // console.log('[revuAnalytiqueNN1] hasN1 =', !!exerciceN1, 'id_exerciceN1 =', id_exerciceN1);

        // Calcul du facteur de proratisation pour N-1
        let facteurProrata = 1; // Par défaut, pas de proratisation
        let nbrMoisPeriodeN = null;
        let nbrMoisTotalN1 = null;

        if (exerciceN1 && exerciceN1.date_debut && exerciceN1.date_fin) {
            // Nombre de mois total de l'exercice N-1
            const debutN1 = new Date(exerciceN1.date_debut);
            const finN1 = new Date(exerciceN1.date_fin);
            nbrMoisTotalN1 = (finN1.getFullYear() - debutN1.getFullYear()) * 12 +
                (finN1.getMonth() - debutN1.getMonth()) + 1;

            // Si une période est sélectionnée dans N, calculer sa durée en mois
            if (date_debut && date_fin) {
                const debutPeriode = new Date(date_debut);
                const finPeriode = new Date(date_fin);
                nbrMoisPeriodeN = (finPeriode.getFullYear() - debutPeriode.getFullYear()) * 12 +
                    (finPeriode.getMonth() - debutPeriode.getMonth()) + 1;

                // Calculer le facteur de proratisation
                if (nbrMoisTotalN1 > 0) {
                    facteurProrata = nbrMoisPeriodeN / nbrMoisTotalN1;
                }
            }
        }

        // console.log('[revuAnalytiqueNN1] prorata:', { nbrMoisPeriodeN, nbrMoisTotalN1, facteurProrata });

        // Requête SQL pour agréger les données des exercices N et N-1
        // Dans la requête SQL, on peut calculer directement var et var%
        let query;
        let replacements;

        // Condition de date pour N (filtre par periode si applicable)
        const dateConditionN = date_debut && date_fin
            ? `AND id_exercice = (SELECT id FROM exerciceN) AND dateecriture BETWEEN :date_debut AND :date_fin`
            : `AND id_exercice = (SELECT id FROM exerciceN)`;

        // Pour N-1, on prend tout l exercice complet (pas de filtre par date) car on applique le prorata
        const dateConditionN1 = `AND id_exercice = (SELECT id FROM exerciceN1)`;

 
            query = `
                WITH exos AS (
                    SELECT id, id_dossier, rang
                    FROM exercices
                    WHERE id_dossier = :id_dossier
                ),

                exerciceN AS (
                    SELECT id, rang
                    FROM exos
                    WHERE id = :id_exercice
                ),

                exerciceN1 AS (
                    SELECT id
                    FROM exos
                    WHERE rang = (SELECT rang - 1 FROM exerciceN)
                ),

                jn AS (
                    SELECT
                        NULLIF(TRIM(comptegen),'') AS compte_key,
                        MIN(libellecompte) AS libellecompte,
                        SUM(COALESCE(debit,0) - COALESCE(credit,0)) AS solde
                    FROM journals
                    WHERE id_compte = :id_compte
                    AND id_dossier = :id_dossier
                    AND id_exercice = (SELECT id FROM exerciceN)
                    ${date_debut && date_fin ? 'AND dateecriture BETWEEN :date_debut AND :date_fin' : ''}
                    AND comptegen IS NOT NULL
                    AND TRIM(comptegen) != ''
                    GROUP BY NULLIF(TRIM(comptegen),'')
                ),

                jn1 AS (
                    SELECT
                        NULLIF(TRIM(comptegen),'') AS compte_key,
                        MIN(libellecompte) AS libellecompte,
                        SUM(COALESCE(debit,0) - COALESCE(credit,0)) AS solde
                    FROM journals
                    WHERE id_compte = :id_compte
                    AND id_dossier = :id_dossier
                    AND id_exercice = (SELECT id FROM exerciceN1)
                    AND comptegen IS NOT NULL
                    AND TRIM(comptegen) != ''
                    GROUP BY NULLIF(TRIM(comptegen),'')
                )

                SELECT
                    COALESCE(jn.compte_key, jn1.compte_key) AS compte,
                    COALESCE(jn.libellecompte, jn1.libellecompte) AS libelle,
                    COALESCE(jn.solde,0) AS "soldeN",
                    COALESCE(jn1.solde * :facteurProrata,0) AS "soldeN1",
                    COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0) AS var,

                    CASE
                        WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 AND COALESCE(jn.solde,0) = 0 THEN 0
                        WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 AND COALESCE(jn.solde,0) != 0 THEN 100
                        ELSE ROUND(
                            (((COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0))
                            / NULLIF(jn1.solde * :facteurProrata,0)) * 100)::numeric
                        ,2)
                    END AS "varPourcent",

                    COALESCE(ca_periode.valide_anomalie, ca_null.valide_anomalie, false) AS "valide_anomalie",

                    CASE
                        WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 THEN false
                        WHEN ABS((COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0))
                                / NULLIF(jn1.solde * :facteurProrata,0)) >= :seuilDecimal THEN true
                        ELSE false
                    END AS anomalies,

                    COALESCE(ca_periode.commentaire, ca_null.commentaire, '') AS commentaire

                FROM jn
                FULL OUTER JOIN jn1 ON jn.compte_key = jn1.compte_key

                LEFT JOIN commentaireanalytiques ca_periode
                ON ca_periode.id_compte = :id_compte
                AND ca_periode.id_dossier = :id_dossier
                AND ca_periode.id_exercice = :id_exercice
                AND ca_periode.id_periode = :id_periode
                AND ca_periode.compte = COALESCE(jn.compte_key, jn1.compte_key)

                LEFT JOIN commentaireanalytiques ca_null
                ON ca_null.id_compte = :id_compte
                AND ca_null.id_dossier = :id_dossier
                AND ca_null.id_exercice = :id_exercice
                AND ca_null.id_periode IS NULL
                AND ca_null.compte = COALESCE(jn.compte_key, jn1.compte_key)
                AND ca_periode.id IS NULL

                ORDER BY compte;
            `;
            replacements = {
                id_compte,
                id_dossier,
                id_exercice,
                id_periode: id_periode || null,
                facteurProrata,
                seuilDecimal,
                ...(date_debut && { date_debut }),
                ...(date_fin && { date_fin })
            };
        

        // Exécuter la requête
        // console.log('[revuAnalytiqueNN1] params reçus:', { id_compte, id_dossier, id_exercice, id_exerciceN1 });
        const results = await db.sequelize.query(query, {
            replacements: replacements,
            type: db.Sequelize.QueryTypes.SELECT
        });

        // Totaux pour N
        const totals = await db.sequelize.query(
            `SELECT COUNT(*) as lignes, SUM(debit) as total_debit, SUM(credit) as total_credit
             FROM journals
             WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice`,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Comptes distincts pour N
        const comptesDistincts = await db.sequelize.query(
            `SELECT DISTINCT TRIM(comptegen) as compte
             FROM journals
             WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice
               AND comptegen IS NOT NULL AND TRIM(comptegen) != ''
             ORDER BY compte`,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        if (id_exerciceN1) {
            const comptesDistinctsN1 = await db.sequelize.query(
                `SELECT DISTINCT TRIM(comptegen) as compte
                 FROM journals
                 WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exerciceN1
                   AND comptegen IS NOT NULL AND TRIM(comptegen) != ''
                 ORDER BY compte`,
                {
                    replacements: { id_compte, id_dossier, id_exerciceN1 },
                    type: db.Sequelize.QueryTypes.SELECT
                }
            );

            const setN = new Set((comptesDistincts || []).map(r => r.compte));
            const setN1 = new Set((comptesDistinctsN1 || []).map(r => r.compte));
            const onlyInN = Array.from(setN).filter(c => !setN1.has(c));
            const onlyInN1 = Array.from(setN1).filter(c => !setN.has(c));
        }

        // Formatter les résultats
        const formattedResults = results.map((row, index) => {
            let compteKey = row.compte ? String(row.compte).trim() : '';
            compteKey = compteKey.replace(/^"+|"+$/g, '');
            return {
                compte: compteKey,
                libelle: row.libelle || '',
                soldeN: round2(parseFloat(row.soldeN) || 0),
                soldeN1: row.soldeN1 !== null && row.soldeN1 !== undefined ? round2(parseFloat(row.soldeN1)) : null,
                var: round2(parseFloat(row.var) || 0),
                varPourcent: row.varPourcent !== null && row.varPourcent !== undefined ? round2(parseFloat(row.varPourcent)) : null,
                valide_anomalie: !!row.valide_anomalie,
                anomalies: !!row.anomalies,
                commentaire: row.commentaire || ''
            };
        });


        // Sauvegarder/Mettre à jour les anomalies dans revu_analytique pour la synthèse
        try {
            const anomaliesToSave = formattedResults.filter(r => r.anomalies);

            const revuAnalytiqueModel = db.revuAnalytique;
            if (!revuAnalytiqueModel) {
                console.error('[DEBUG NN1] Modèle revuAnalytique non initialisé');
            }

            for (const anomaly of anomaliesToSave) {
                // Vérifier si une entrée existe déjà
                const [existing] = await revuAnalytiqueModel.findOrCreate({
                    where: {
                        id_compte,
                        id_exercice,
                        id_dossier,
                        id_periode: id_periode || null,
                        compte: anomaly.compte,
                        type_revue: 'analytiqueNN1'
                    },
                    defaults: {
                        nbr_anomalies: 1,
                        anomalies_valides: anomaly.valide_anomalie ? 1 : 0
                    }
                });

                if (!existing.isNewRecord) {
                    // Mettre à jour si nécessaire
                    await existing.update({
                        nbr_anomalies: 1,
                        // Préserver les validations existantes
                        anomalies_valides: anomaly.valide_anomalie ? 1 : (existing.anomalies_valides || 0)
                    });
                }
            }

        } catch (saveError) {
            console.error('[DEBUG NN1] Erreur lors de la sauvegarde:', saveError.message);
            // Ne pas bloquer la réponse si la sauvegarde échoue
        }

        return res.json({
            data: formattedResults,
            state: true,
            message: 'Données récupérées avec succès'
        });
    } catch (error) {
        console.error('Erreur dans getRevuAnalytiqueNN1:', error);
        return res.status(500).json({
            message: "Erreur serveur",
            state: false,
            error: error.message
        });
    }
};