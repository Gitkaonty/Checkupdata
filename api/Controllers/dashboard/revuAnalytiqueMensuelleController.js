const db = require("../../Models");
const { journals, exercices } = db;
const { Op } = require("sequelize");

const round2 = (value) => Math.round(value * 100) / 100;

// Fonction pour générer la liste des mois d'un exercice
function generateMonthsForExercice(dateDebut, dateFin) {
    const mois = [];
    const current = new Date(dateDebut);
    const end = new Date(dateFin);

    while (current <= end) {
        const moisNum = current.getMonth() + 1;
        const annee = current.getFullYear();
        const nomMois = current.toLocaleDateString('fr-FR', { month: 'long' });

        mois.push({
            numero: moisNum,
            nom: `${nomMois}_${annee}`,
            nomAffiche: `${nomMois.charAt(0).toUpperCase() + nomMois.slice(1)} ${annee}`
        });

        current.setMonth(current.getMonth() + 1);
    }

    return mois;
}

// Fonction pour construire la requête SQL dynamique
function buildDynamicQuery(moisExercice) {
    // Construire les colonnes PIVOT
    let pivotColumns = '';
    moisExercice.forEach((mois) => {
        const annee = mois.nom.split('_')[1];
        pivotColumns += `COALESCE(MAX(CASE WHEN mois_num = ${mois.numero} AND annee = ${annee} THEN solde_mois END), 0) AS "${mois.nom}",\n`;
    });

    // Construire la logique de variations
    let variationConditions = '';
    moisExercice.forEach((mois, index) => {
        if (index > 0) {
            const moisPrecedent = moisExercice[index - 1];
            variationConditions += `        (mp."${mois.nom}" != 0 AND mp."${moisPrecedent.nom}" != 0 AND ABS(mp."${mois.nom}" - mp."${moisPrecedent.nom}") / NULLIF(ABS(mp."${moisPrecedent.nom}"), 0) >= 0.3) OR\n`;
        }
    });

    // Enlever le dernier " OR"
    if (variationConditions.endsWith(' OR\n')) {
        variationConditions = variationConditions.slice(0, -4);
    }

    return {
        pivotColumns: pivotColumns.slice(0, -2), // Enlever la dernière virgule
        variationConditions
    };
}

exports.getRevuAnalytiqueMensuelle = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { date_debut, date_fin, id_periode } = req.query; // Ajout de id_periode

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        // 1️⃣ Récupérer l'exercice
        const exercice = await exercices.findOne({ where: { id: id_exercice } });
        if (!exercice) {
            return res.status(404).json({ state: false, message: 'Exercice non trouvé' });
        }

        // Utiliser les dates de periode si fournies, sinon utiliser les dates de l'exercice
        const periodeDebut = date_debut || exercice.date_debut;
        const periodeFin = date_fin || exercice.date_fin;

        // 2️⃣ Générer les mois de la periode
        const moisExercice = generateMonthsForExercice(periodeDebut, periodeFin);

        // Condition de date pour les requetes
        const dateCondition = date_debut && date_fin 
            ? `AND dateecriture BETWEEN :date_debut AND :date_fin`
            : '';
        
        const queryReplacements = { 
            id_compte, 
            id_dossier, 
            id_exercice,
            ...(date_debut && { date_debut }),
            ...(date_fin && { date_fin })
        };

        /**
         * 3️⃣ TOUS les comptes de l’exercice (même source que N/N-1)
         */
        const allComptes = await db.sequelize.query(
            `
      SELECT DISTINCT
        NULLIF(TRIM(comptegen), '') AS compte_key,
        libellecompte
      FROM journals
      WHERE id_compte = :id_compte
        AND id_dossier = :id_dossier
        AND id_exercice = :id_exercice
        ${dateCondition}
        AND comptegen IS NOT NULL
        AND TRIM(comptegen) != ''
      ORDER BY compte_key
      `,
            {
                replacements: queryReplacements,
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // // console.log('[revuAnalytiqueMensuelle] allComptes count', allComptes?.length || 0);
        // // console.log('[revuAnalytiqueMensuelle] allComptes sample', (allComptes || []).slice(0, 20));

        const comptesDistincts = await db.sequelize.query(
            `SELECT DISTINCT NULLIF(TRIM(comptegen), '') AS compte_key
             FROM journals
             WHERE id_compte = :id_compte
               AND id_dossier = :id_dossier
               AND id_exercice = :id_exercice
               ${dateCondition}
               AND comptegen IS NOT NULL
               AND TRIM(comptegen) != ''
             ORDER BY compte_key`,
            {
                replacements: queryReplacements,
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        /**
         * 4️⃣ Données mensuelles (avec filtre de dates si periode selectionnee)
         */
        const monthlyResults = await db.sequelize.query(
            `
      SELECT
        NULLIF(TRIM(comptegen), '') AS compte_key,
        libellecompte,
        EXTRACT(MONTH FROM dateecriture)::int AS mois,
        EXTRACT(YEAR FROM dateecriture)::int AS annee,
        SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) AS solde_mois
      FROM journals
      WHERE id_compte = :id_compte
        AND id_dossier = :id_dossier
        AND id_exercice = :id_exercice
        ${dateCondition}
        AND comptegen IS NOT NULL
        AND TRIM(comptegen) != ''
      GROUP BY
        NULLIF(TRIM(comptegen), ''),
        libellecompte,
        EXTRACT(MONTH FROM dateecriture),
        EXTRACT(YEAR FROM dateecriture)
      ORDER BY compte_key, annee, mois
      `,
            {
                replacements: queryReplacements,
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const comptesMonthly = new Set((monthlyResults || []).map(r => r.compte_key));
        const comptesAll = new Set((allComptes || []).map(r => r.compte_key));
        const comptesAllSansMonthly = Array.from(comptesAll).filter(c => c && !comptesMonthly.has(c));

        /**
         * 5️⃣ Initialisation pivot (tous les comptes, tous les mois à 0)
         */
        const map = new Map();

        // Vérifier s'il y a des écritures avant le début de l'exercice
        const avantExerciceQuery = `
            SELECT DISTINCT NULLIF(TRIM(comptegen), '') AS compte_key
            FROM journals
            WHERE id_compte = :id_compte
            AND id_dossier = :id_dossier
            AND id_exercice = :id_exercice
            AND dateecriture < :date_debut
            AND dateecriture >= :date_debut_annee_precedente
            AND comptegen IS NOT NULL
            AND TRIM(comptegen) != ''
        `;
        
        const dateDebutAnneePrecedente = new Date(exercice.date_debut);
        dateDebutAnneePrecedente.setFullYear(dateDebutAnneePrecedente.getFullYear() - 1);
        
        const avantExerciceResult = await db.sequelize.query(avantExerciceQuery, {
            replacements: { 
                id_compte, 
                id_dossier, 
                id_exercice, 
                date_debut: exercice.date_debut,
                date_debut_annee_precedente: dateDebutAnneePrecedente.toISOString().split('T')[0]
            },
            type: db.Sequelize.QueryTypes.SELECT
        });
        
        const comptesAvecAvantExercice = avantExerciceResult.map(r => r.compte_key);
        // // console.log(`[DEBUG] Comptes avec écritures avant exercice: ${comptesAvecAvantExercice.length} comptes`);
        
        // Créer la colonne pour le mois/année avant l'exercice
        const moisAvantExercice = new Date(exercice.date_debut);
        moisAvantExercice.setMonth(moisAvantExercice.getMonth() - 1);
        const nomMoisAvantExercice = `${moisAvantExercice.toLocaleDateString('fr-FR', { month: 'long' })}_${moisAvantExercice.getFullYear()}`;
        const nomMoisAvantExerciceAffiche = moisAvantExercice.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        // // console.log(`[DEBUG] Colonne ajoutée: ${nomMoisAvantExercice} (${nomMoisAvantExerciceAffiche})`);

        allComptes.forEach((c, index) => {
            const row = {
                id: index,
                compte: c.compte_key,
                libelle: c.libellecompte,
                total_exercice: 0,
                anomalies: false,
                commentaire: '',
                valide_anomalie: false
            };

            moisExercice.forEach(m => {
                row[m.nom] = 0;
            });

            // AJOUT: Ajouter la colonne pour les comptes qui en ont besoin
            if (comptesAvecAvantExercice.includes(c.compte_key)) {
                row[nomMoisAvantExercice] = 0;
                if (comptesAvecAvantExercice.length <= 5) {
                    // console.log(`[DEBUG] Ajout colonne ${nomMoisAvantExercice} pour ${c.compte_key}`);
                }
            }

            map.set(c.compte_key, row);
        });

        // Charger les données de revu_analytique (nouvelle table pour anomalies)
        const revuAnalytiqueModel = db.revuAnalytique;
        if (!revuAnalytiqueModel) {
            throw new Error("Modèle revuAnalytique non initialisé");
        }

        const revuAnalytiqueData = await revuAnalytiqueModel.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                type_revue: 'analytiqueMensuelle'
            }
        });

        revuAnalytiqueData.forEach((ra) => {
            const row = map.get(ra.compte);
            if (!row) return;
            row.anomalies = (ra.nbr_anomalies || 0) > 0;
            row.valide_anomalie = (ra.anomalies_valides || 0) > 0;
        });

        // Charger les commentaires mensuels (table dédiée - sans anomalies)
        const commentaireAnalytiqueMensuelle = db.commentaireAnalytiqueMensuelle;
        if (commentaireAnalytiqueMensuelle) {
            const commentaires = await commentaireAnalytiqueMensuelle.findAll({
                where: {
                    id_compte,
                    id_dossier,
                    id_exercice
                }
            });

            commentaires.forEach((c) => {
                const row = map.get(c.compte);
                if (!row) return;
                row.commentaire = c.commentaire || '';
                // valide_anomalie est maintenant géré par revu_analytique
            });
        }

        /**
         * 6️⃣ Remplissage mensuel - UTILISER LE TOTAL EXACT DE N/N-1
         */
        // // console.log('[DEBUG] Début remplissage mensuel');
        
        // D'abord, récupérer les totaux exacts comme N/N-1
        const totalsQuery = `
            SELECT 
                NULLIF(TRIM(comptegen), '') AS compte_key,
                SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) AS total_exact
            FROM journals
            WHERE id_compte = :id_compte
            AND id_dossier = :id_dossier
            AND id_exercice = :id_exercice
            ${dateCondition}
            AND comptegen IS NOT NULL
            AND TRIM(comptegen) != ''
            GROUP BY NULLIF(TRIM(comptegen), '')
        `;
        
        const totalsResults = await db.sequelize.query(totalsQuery, {
            replacements: queryReplacements,
            type: db.Sequelize.QueryTypes.SELECT
        });
        
        // // console.log('[DEBUG] Totaux exacts:', totalsResults.slice(0, 3));
        
        monthlyResults.forEach((r, idx) => {
            const row = map.get(r.compte_key);
            if (!row) {
                // console.log(`[DEBUG] Compte ${r.compte_key} non trouvé dans le map`);
                return;
            }

            // Vérifier si c'est une écriture avant l'exercice
            const dateEcriture = new Date(`${r.annee}-${r.mois.toString().padStart(2, '0')}-01`);
            if (dateEcriture < new Date(exercice.date_debut)) {
                const val = round2(parseFloat(r.solde_mois) || 0);
                row[nomMoisAvantExercice] = val;
                row.total_exercice += val;
                if (idx < 5) {
                    // console.log(`[DEBUG] Assigné: ${r.compte_key} ${nomMoisAvantExercice} = ${val}`);
                }
            } else {
                // Gérer les mois normaux de l'exercice
                const mois = moisExercice.find(
                    m => m.numero === parseInt(r.mois) && m.nom.includes(r.annee.toString())
                );

                if (mois) {
                    const val = round2(parseFloat(r.solde_mois) || 0);
                    row[mois.nom] = val;
                    row.total_exercice += val;
                    if (idx < 5) {
                        // console.log(`[DEBUG] Assigné: ${r.compte_key} ${mois.nom} = ${val}`);
                    }
                } else {
                    if (idx < 5) {
                        // console.log(`[DEBUG] Mois non trouvé pour ${r.compte_key}: mois=${r.mois}, annee=${r.annee}`);
                    }
                }
            }
        });

        // SANS CORRECTION: Garder les totaux calculés naturellement
        // // console.log('\n=== VÉRIFICATION DES TOTAUX NATURELS ===');
        let totalCorrections = 0;
        totalsResults.forEach(total => {
            const row = map.get(total.compte_key);
            if (row) {
                const calculeTotal = row.total_exercice;
                const exactTotal = round2(parseFloat(total.total_exact) || 0);
                const difference = Math.abs(calculeTotal - exactTotal);
                
                if (difference > 0.01) {
                    // console.log(`[DIFFÉRENCE] ${total.compte_key}: calculé=${calculeTotal}, exact=${exactTotal}, diff=${difference.toFixed(2)}`);
                    totalCorrections++;
                }
            }
        });
        
        // Sauvegarder les anomalies pour la Synthèse si une période est sélectionnée
        if (id_periode) {
            try {
                
                // D'abord, supprimer les anciennes anomalies mensuelles pour ce contexte
                const deleteWhereClause = {
                    id_compte,
                    id_exercice,
                    id_dossier,
                    id_periode: Number(id_periode),
                    type_revue: 'analytiqueMensuelle'
                };
                
                await revuAnalytiqueModel.destroy({ where: deleteWhereClause });
                
                // Compter les anomalies depuis commentaireAnalytiqueMensuelle
                const anomalyWhere = {
                    id_compte,
                    id_dossier,
                    id_exercice,
                    anomalies: true
                };
                if (id_periode) anomalyWhere.id_periode = Number(id_periode);

                const anomaliesCount = await db.commentaireAnalytiqueMensuelle.count({
                    where: anomalyWhere
                });
                
                const validatedWhere = {
                    ...anomalyWhere,
                    valide_anomalie: true
                };
                const validatedCount = await db.commentaireAnalytiqueMensuelle.count({
                    where: validatedWhere
                });
                
                // Créer une entrée globale pour les statistiques
                if (anomaliesCount > 0) {
                    await revuAnalytiqueModel.create({
                        id_compte,
                        id_exercice,
                        id_dossier,
                        id_periode: id_periode || null,
                        compte: 'GLOBAL', // Compte global pour stats
                        type_revue: 'analytiqueMensuelle',
                        nbr_anomalies: anomaliesCount,
                        anomalies_valides: validatedCount
                    });
                }
                
            } catch (saveError) {
                console.error('[DEBUG MENSUELLE] Erreur sauvegarde anomalies mensuelles:', saveError);
            }
        }

        // // console.log('\n=== COMPARAISON TOTAUX MENSUELLE vs N/N-1 ===');
        
        // Identification simple des écritures problématiques pour TOUS les comptes
        // // console.log('\n=== IDENTIFICATION DES ÉCRITURES PROBLÉMATIQUES ===');
        
        // 1. Total toutes écritures (comme N/N-1) - TOUS LES COMPTES
        const totalAllQuery = `
            SELECT 
                NULLIF(TRIM(comptegen), '') AS compte_key,
                COUNT(*) as count_all,
                SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) as total_all
            FROM journals
            WHERE id_compte = :id_compte
            AND id_dossier = :id_dossier
            AND id_exercice = :id_exercice
            ${dateCondition}
            AND comptegen IS NOT NULL
            AND TRIM(comptegen) != ''
            GROUP BY NULLIF(TRIM(comptegen), '')
            ORDER BY compte_key
        `;
        
        const totalAllResult = await db.sequelize.query(totalAllQuery, {
            replacements: queryReplacements,
            type: db.Sequelize.QueryTypes.SELECT
        });
        
        // 2. Total écritures avec dates valides (qui passent dans mensuelle) - TOUS LES COMPTES
        const totalValidQuery = `
            SELECT 
                NULLIF(TRIM(comptegen), '') AS compte_key,
                COUNT(*) as count_valid,
                SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) as total_valid
            FROM journals
            WHERE id_compte = :id_compte
            AND id_dossier = :id_dossier
            AND id_exercice = :id_exercice
            ${dateCondition}
            AND comptegen IS NOT NULL
            AND TRIM(comptegen) != ''
            AND dateecriture >= '1900-01-01'
            GROUP BY NULLIF(TRIM(comptegen), '')
            ORDER BY compte_key
        `;
        
        const totalValidResult = await db.sequelize.query(totalValidQuery, {
            replacements: queryReplacements,
            type: db.Sequelize.QueryTypes.SELECT
        });
        
        // // console.log('Analyse des écarts pour tous les comptes:');
        // // console.log('Compte\t\tÉcritures perdues\tMontant perdu\t% perdu');
        // // console.log('--------------------------------------------------------------------');
        
        let totalEcrituresPerdues = 0;
        let totalMontantPerdu = 0;
        let totalMontantGlobal = 0;
        
        totalAllResult.forEach(all => {
            const valid = totalValidResult.find(v => v.compte_key === all.compte_key);
            
            if (valid) {
                const countDiff = parseInt(all.count_all) - parseInt(valid.count_valid);
                const montantDiff = parseFloat(all.total_all) - parseFloat(valid.total_valid);
                const pourcentagePerdu = all.total_all != 0 ? (montantDiff / Math.abs(parseFloat(all.total_all))) * 100 : 0;
                
                totalEcrituresPerdues += countDiff;
                totalMontantPerdu += montantDiff;
                totalMontantGlobal += Math.abs(parseFloat(all.total_all));
                
                if (countDiff > 0 || Math.abs(montantDiff) > 0.01) {
                    // console.log(`${all.compte_key}\t\t${countDiff}\t\t${montantDiff.toFixed(2)}\t\t${pourcentagePerdu.toFixed(2)}%`);
                }
            }
        });
        
        const pourcentageGlobalPerdu = totalMontantGlobal > 0 ? (totalMontantPerdu / totalMontantGlobal) * 100 : 0;
        
        // // console.log('--------------------------------------------------------------------');
        // // console.log(`TOTAL\t\t${totalEcrituresPerdues}\t\t${totalMontantPerdu.toFixed(2)}\t\t${pourcentageGlobalPerdu.toFixed(2)}%`);
        // // console.log('=== FIN IDENTIFICATION ===\n');
        
        // Debug simple: compter les écritures pour le compte 401000
        const countQuery = `
            SELECT COUNT(*) as total_ecritures, SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) as total_solde
            FROM journals
            WHERE id_compte = :id_compte
            AND id_dossier = :id_dossier
            AND id_exercice = :id_exercice
            AND comptegen = '401000'
        `;
        
        const countResult = await db.sequelize.query(countQuery, {
            replacements: { id_compte, id_dossier, id_exercice },
            type: db.Sequelize.QueryTypes.SELECT
        });
        
        // // console.log('[DEBUG] Compte 401000 - Écritures brutes:', countResult[0]);
        
        // Debug: voir les résultats mensuels pour 401000
        const monthly401000 = monthlyResults.filter(r => r.compte_key === '401000');
        // // console.log('[DEBUG] Compte 401000 - Résultats mensuels:', monthly401000);
        
        // Récupérer les données N/N-1 pour comparaison (même requête que N/N-1)
        const nn1Query = `
            SELECT 
                NULLIF(TRIM(comptegen), '') AS compte_key,
                libellecompte,
                SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) AS soldeN
            FROM journals
            WHERE id_compte = :id_compte
            AND id_dossier = :id_dossier
            AND id_exercice = :id_exercice
            AND comptegen IS NOT NULL
            AND TRIM(comptegen) != ''
            GROUP BY NULLIF(TRIM(comptegen), ''), libellecompte
            ORDER BY compte_key
        `;

        const nn1Results = await db.sequelize.query(nn1Query, {
            replacements: { id_compte, id_dossier, id_exercice },
            type: db.Sequelize.QueryTypes.SELECT
        });

        // // console.log(`[DEBUG] N/N-1 results count: ${nn1Results.length}`);
        // // console.log('[DEBUG] Sample N/N-1 results:', nn1Results.slice(0, 3));

        // // console.log('Comparaison compte par compte:');
        // // console.log('Compte\t\t\tTotal Mensuel\t\tSolde N/N-1\t\tDifférence');
        // // console.log('--------------------------------------------------------------------');

        let totalMensuelGlobal = 0;
        let totalNn1Global = 0;

        nn1Results.forEach(nn1 => {
            const mensuelRow = Array.from(map.values()).find(r => r.compte === nn1.compte_key);
            
            if (mensuelRow) {
                const totalMensuel = mensuelRow.total_exercice || 0;
                const soldeNn1 = nn1.solden || 0; // CORRIGÉ: utiliser solden au lieu de soldeN
                const diff = totalMensuel - soldeNn1;
                totalMensuelGlobal += totalMensuel;
                totalNn1Global += soldeNn1;
                
                    // // console.log(`${nn1.compte_key}\t\t${totalMensuel.toFixed(2)}\t\t${soldeNn1.toFixed(2)}\t\t${diff.toFixed(2)}`);
            } else {
                const soldeNn1 = nn1.solden || 0; // CORRIGÉ: utiliser solden au lieu de soldeN
                totalNn1Global += soldeNn1;
                // // console.log(`${nn1.compte_key}\t\tABSENT\t\t\t${soldeNn1.toFixed(2)}\t\tMANQUANT`);
            }
        });

        // // console.log('--------------------------------------------------------------------');
        // // console.log(`TOTAL GLOBAL\t\t${totalMensuelGlobal.toFixed(2)}\t\t${totalNn1Global.toFixed(2)}\t\t${(totalMensuelGlobal - totalNn1Global).toFixed(2)}`);
        // // console.log('=== FIN COMPARAISON ===\n');

        // Préparer les colonnes à renvoyer au frontend
        let finalMoisColumns = [...moisExercice];
        
        // Ajouter la colonne avant exercice si des comptes en ont besoin
        if (comptesAvecAvantExercice.length > 0) {
            finalMoisColumns.unshift({
                nom: nomMoisAvantExercice,
                nomAffiche: nomMoisAvantExerciceAffiche,
                numero: new Date(exercice.date_debut).getMonth() + 1,
                annee: new Date(exercice.date_debut).getFullYear() - 1
            });
            // // console.log(`[DEBUG] Ajout de ${nomMoisAvantExercice} dans moisColumns`);
        }

        // Fusionner les données de commentaireAnalytiqueMensuelle (anomalies, valide_anomalie, commentaire)
        const commentaireWhere = {
            id_compte,
            id_dossier,
            id_exercice
        };
        if (id_periode) commentaireWhere.id_periode = Number(id_periode);

        const commentaires = await db.commentaireAnalytiqueMensuelle.findAll({
            where: commentaireWhere,
            raw: true
        });

        const commentaireMap = new Map();
        commentaires.forEach(c => {
            commentaireMap.set(c.compte, c);
        });

        const finalData = Array.from(map.values()).map(row => {
            const c = commentaireMap.get(row.compte);
            if (c) {
                return {
                    ...row,
                    anomalies: c.anomalies || false,
                    valide_anomalie: c.valide_anomalie || false,
                    commentaire: c.commentaire || ''
                };
            }
            return {
                ...row,
                anomalies: false,
                valide_anomalie: false,
                commentaire: ''
            };
        });

        return res.json({
            state: true,
            data: finalData,
            moisColumns: finalMoisColumns,
            message: 'Revue analytique mensuelle générée avec succès'
        });

    } catch (error) {
        console.error('Erreur getRevuAnalytiqueMensuelle:', error);
        return res.status(500).json({
            state: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};
