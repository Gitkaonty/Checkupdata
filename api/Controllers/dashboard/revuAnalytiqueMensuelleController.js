const db = require("../../Models");
const { journals, exercices } = db;
const { Op } = require("sequelize");
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { applyKaontyStyle } = require('../../Middlewares/kaontyExcelStyle');

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
        
        // Créer la colonne pour le mois/année avant l'exercice
        const moisAvantExercice = new Date(exercice.date_debut);
        moisAvantExercice.setMonth(moisAvantExercice.getMonth() - 1);
        const nomMoisAvantExercice = `${moisAvantExercice.toLocaleDateString('fr-FR', { month: 'long' })}_${moisAvantExercice.getFullYear()}`;
        const nomMoisAvantExerciceAffiche = moisAvantExercice.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        

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
        
        
        monthlyResults.forEach((r, idx) => {
            const row = map.get(r.compte_key);
            if (!row) {
                return;
            }

            // Vérifier si c'est une écriture avant l'exercice
            const dateEcriture = new Date(`${r.annee}-${r.mois.toString().padStart(2, '0')}-01`);
            if (dateEcriture < new Date(exercice.date_debut)) {
                const val = round2(parseFloat(r.solde_mois) || 0);
                row[nomMoisAvantExercice] = val;
                row.total_exercice += val;
                if (idx < 5) {
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
                    }
                } else {
                    if (idx < 5) {
                    }
                }
            }
        });

        // SANS CORRECTION: Garder les totaux calculés naturellement
        let totalCorrections = 0;
        totalsResults.forEach(total => {
            const row = map.get(total.compte_key);
            if (row) {
                const calculeTotal = row.total_exercice;
                const exactTotal = round2(parseFloat(total.total_exact) || 0);
                const difference = Math.abs(calculeTotal - exactTotal);
                
                if (difference > 0.01) {
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

        
        // Identification simple des écritures problématiques pour TOUS les comptes
        
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
                }
            }
        });
        
        const pourcentageGlobalPerdu = totalMontantGlobal > 0 ? (totalMontantPerdu / totalMontantGlobal) * 100 : 0;
        
        
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
        
        
        // Debug: voir les résultats mensuels pour 401000
        const monthly401000 = monthlyResults.filter(r => r.compte_key === '401000');
        
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
                
            } else {
                const soldeNn1 = nn1.solden || 0; // CORRIGÉ: utiliser solden au lieu de soldeN
                totalNn1Global += soldeNn1;
            }
        });


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

// Helpers for export
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const formatMontant = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ');
};

const tryReadLogo = () => {
    const candidatePaths = [
        process.env.REPORT_LOGO_PATH,
        path.join(process.cwd(), 'assets', 'logo.png'),
        path.join(__dirname, '..', '..', 'assets', 'logo.png'),
        path.join(__dirname, '..', '..', '..', 'front', 'kaonti', 'src', 'img', '30.png')
    ].filter(Boolean);
    for (const p of candidatePaths) {
        try {
            if (fs.existsSync(p)) {
                const buf = fs.readFileSync(p);
                return { dataUrl: `data:image/png;base64,${buf.toString('base64')}`, buffer: buf, extension: 'png' };
            }
        } catch (_) { }
    }
    return null;
};

// Helper to fetch mensuelle data (same logic as getRevuAnalytiqueMensuelle)
const getMensuelleData = async (id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin) => {
    const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
    const exercice = await exercices.findOne({ where: { id: id_exercice } });
    if (!exercice) throw new Error('Exercice non trouvé');

    const periodeDebut = date_debut || exercice.date_debut;
    const periodeFin = date_fin || exercice.date_fin;
    const moisExercice = generateMonthsForExercice(periodeDebut, periodeFin);

    const dateCondition = date_debut && date_fin ? `AND dateecriture BETWEEN :date_debut AND :date_fin` : '';
    const queryReplacements = { id_compte, id_dossier, id_exercice, ...(date_debut && { date_debut }), ...(date_fin && { date_fin }) };

    // All accounts
    const allComptes = await db.sequelize.query(`
        SELECT DISTINCT NULLIF(TRIM(comptegen), '') AS compte_key, libellecompte
        FROM journals WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice
        ${dateCondition} AND comptegen IS NOT NULL AND TRIM(comptegen) != '' ORDER BY compte_key`,
        { replacements: queryReplacements, type: db.Sequelize.QueryTypes.SELECT });

    // Monthly data
    const monthlyResults = await db.sequelize.query(`
        SELECT NULLIF(TRIM(comptegen), '') AS compte_key, libellecompte,
            EXTRACT(MONTH FROM dateecriture)::int AS mois, EXTRACT(YEAR FROM dateecriture)::int AS annee,
            SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) AS solde_mois
        FROM journals WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice
        ${dateCondition} AND comptegen IS NOT NULL AND TRIM(comptegen) != ''
        GROUP BY NULLIF(TRIM(comptegen), ''), libellecompte, EXTRACT(MONTH FROM dateecriture), EXTRACT(YEAR FROM dateecriture)
        ORDER BY compte_key, annee, mois`,
        { replacements: queryReplacements, type: db.Sequelize.QueryTypes.SELECT });

    // Before-exercise accounts
    const dateDebutAnneePrecedente = new Date(exercice.date_debut);
    dateDebutAnneePrecedente.setFullYear(dateDebutAnneePrecedente.getFullYear() - 1);
    const avantExerciceResult = await db.sequelize.query(`
        SELECT DISTINCT NULLIF(TRIM(comptegen), '') AS compte_key FROM journals
        WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice
        AND dateecriture < :date_debut AND dateecriture >= :date_debut_annee_precedente
        AND comptegen IS NOT NULL AND TRIM(comptegen) != ''`,
        { replacements: { id_compte, id_dossier, id_exercice, date_debut: exercice.date_debut, date_debut_annee_precedente: dateDebutAnneePrecedente.toISOString().split('T')[0] }, type: db.Sequelize.QueryTypes.SELECT });

    const comptesAvecAvantExercice = avantExerciceResult.map(r => r.compte_key);
    const moisAvantExercice = new Date(exercice.date_debut);
    moisAvantExercice.setMonth(moisAvantExercice.getMonth() - 1);
    const nomMoisAvantExercice = `${moisAvantExercice.toLocaleDateString('fr-FR', { month: 'long' })}_${moisAvantExercice.getFullYear()}`;
    const nomMoisAvantExerciceAffiche = moisAvantExercice.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Build pivot map
    const map = new Map();
    allComptes.forEach((c, index) => {
        const row = { id: index, compte: c.compte_key, libelle: c.libellecompte, total_exercice: 0, anomalies: false, commentaire: '', valide_anomalie: false };
        moisExercice.forEach(m => { row[m.nom] = 0; });
        if (comptesAvecAvantExercice.includes(c.compte_key)) { row[nomMoisAvantExercice] = 0; }
        map.set(c.compte_key, row);
    });

    // Fill monthly data
    monthlyResults.forEach(r => {
        const row = map.get(r.compte_key);
        if (!row) return;
        const dateEcriture = new Date(`${r.annee}-${r.mois.toString().padStart(2, '0')}-01`);
        if (dateEcriture < new Date(exercice.date_debut)) {
            const val = round2(parseFloat(r.solde_mois) || 0);
            row[nomMoisAvantExercice] = val;
            row.total_exercice += val;
        } else {
            const mois = moisExercice.find(m => m.numero === parseInt(r.mois) && m.nom.includes(r.annee.toString()));
            if (mois) { const val = round2(parseFloat(r.solde_mois) || 0); row[mois.nom] = val; row.total_exercice += val; }
        }
    });

    // Comments & anomalies
    const commentaireWhere = { id_compte, id_dossier, id_exercice };
    if (id_periode) commentaireWhere.id_periode = Number(id_periode);
    const commentaires = await db.commentaireAnalytiqueMensuelle.findAll({ where: commentaireWhere, raw: true });
    const commentaireMap = new Map();
    commentaires.forEach(c => { commentaireMap.set(c.compte, c); });

    const revuAnalytiqueData = await db.revuAnalytique.findAll({ where: { id_compte, id_dossier, id_exercice, type_revue: 'analytiqueMensuelle' } });
    revuAnalytiqueData.forEach(ra => {
        const row = map.get(ra.compte);
        if (!row) return;
        row.anomalies = (ra.nbr_anomalies || 0) > 0;
        row.valide_anomalie = (ra.anomalies_valides || 0) > 0;
    });

    const finalData = Array.from(map.values()).map(row => {
        const c = commentaireMap.get(row.compte);
        if (c) return { ...row, anomalies: c.anomalies || row.anomalies, valide_anomalie: c.valide_anomalie || row.valide_anomalie, commentaire: c.commentaire || '' };
        return { ...row };
    });

    let finalMoisColumns = [...moisExercice];
    if (comptesAvecAvantExercice.length > 0) {
        finalMoisColumns.unshift({ nom: nomMoisAvantExercice, nomAffiche: nomMoisAvantExerciceAffiche, numero: new Date(exercice.date_debut).getMonth() + 1, annee: new Date(exercice.date_debut).getFullYear() - 1 });
    }

    return { dossier, exercice, finalData, finalMoisColumns };
};

// Expose internal data fetcher for reuse (global combined export)
exports.getExportData = getMensuelleData;

// Build the PDF data-table section (no logo/global title/headerColumns), for combined PDF
exports.buildPdfSection = (data, ctx = {}) => {
    const { finalData, finalMoisColumns } = data;

    const tableHeader = ['Compte', 'Libellé'];
    finalMoisColumns.forEach(m => tableHeader.push(m.nomAffiche));
    tableHeader.push('Anomalies', 'Validé', 'Commentaire');

    const tableBody = [tableHeader.map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];

    finalData.forEach((r, i) => {
        const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
        const row = [{ text: r.compte, style: 'cell' }, { text: r.libelle, style: 'cell' }];
        finalMoisColumns.forEach(m => {
            const val = r[m.nom] || 0;
            row.push({ text: formatMontant(val), alignment: 'right', style: 'cell' });
        });
        row.push(
            { text: r.anomalies ? 'Oui' : 'Non', alignment: 'center', style: 'cell' },
            { text: r.valide_anomalie ? 'Oui' : 'Non', alignment: 'center', style: 'cell' },
            { text: r.commentaire || '', style: 'cell' }
        );
        tableBody.push(row.map(cell => ({ ...cell, fillColor: rowColor })));
    });

    const content = [
        { table: { headerRows: 1, widths: ['8%', '15%', ...finalMoisColumns.map(() => '6%'), '6%', '6%', '15%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF', hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 2, paddingBottom: () => 2, paddingLeft: () => 3, paddingRight: () => 3 } }
    ];

    const styles = {
        tableHeader: { bold: true, fontSize: 7, color: '#2C3E50' },
        cell: { fontSize: 6, color: '#2C3E50' }
    };

    return { content, styles };
};

// Add the 'Revue Mensuelle' worksheet to an existing workbook, for combined Excel
exports.addExcelSheets = (workbook, data, ctx = {}) => {
    const { dossier, exercice, finalData, finalMoisColumns } = data;
    const logo = ctx.logo || tryReadLogo();
    const periodeText = (ctx.date_debut && ctx.date_fin)
        ? `${formatDate(ctx.date_debut)} au ${formatDate(ctx.date_fin)}`
        : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

    const ws = workbook.addWorksheet('Revue Mensuelle');

    if (logo?.buffer) {
        const imageId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension || 'png' });
        ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 140, height: 45 } });
    }

    const headerEndCol = String.fromCharCode(65 + 2 + finalMoisColumns.length + 2);
    ws.mergeCells(`A2:${headerEndCol}2`);
    ws.getCell('A2').value = 'REVUE ANALYTIQUE MENSUELLE';
    ws.getCell('A2').font = { bold: true, size: 14 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells(`A3:${headerEndCol}3`);
    ws.getCell('A3').value = `Dossier : ${dossier?.dossier || ''}`;
    ws.getCell('A3').font = { bold: true, size: 11 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.mergeCells(`A4:${headerEndCol}4`);
    ws.getCell('A4').value = `Période : ${periodeText}`;
    ws.getCell('A4').font = { bold: true, size: 9 };
    ws.getCell('A4').alignment = { horizontal: 'center' };

    ws.columns = [{ width: 12 }, { width: 30 }, ...finalMoisColumns.map(() => ({ width: 10 })), { width: 10 }, { width: 10 }, { width: 30 }];

    const headerRow = ws.getRow(7);
    const headerValues = ['Compte', 'Libellé'];
    finalMoisColumns.forEach(m => headerValues.push(m.nomAffiche));
    headerValues.push('Anomalies', 'Validé', 'Commentaire');
    headerRow.values = headerValues;
    headerRow.font = { bold: true, size: 9 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF7' } };
    headerRow.alignment = { horizontal: 'center' };

    finalData.forEach((r, i) => {
        const row = ws.getRow(8 + i);
        const rowValues = [r.compte, r.libelle];
        finalMoisColumns.forEach(m => rowValues.push(r[m.nom] || 0));
        rowValues.push(r.anomalies ? 'Oui' : 'Non', r.valide_anomalie ? 'Oui' : 'Non', r.commentaire || '');
        row.values = rowValues;

        for (let j = 2; j < 2 + finalMoisColumns.length; j++) {
            row.getCell(j + 1).numFmt = '#,##0.00';
            row.getCell(j + 1).alignment = { horizontal: 'right' };
        }
        row.getCell(2 + finalMoisColumns.length + 1).alignment = { horizontal: 'center' };
        row.getCell(2 + finalMoisColumns.length + 2).alignment = { horizontal: 'center' };
    });

    return ws;
};

// Export PDF
exports.exportPdf = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode, date_debut, date_fin } = req.query;

        const data = await getMensuelleData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
        const { dossier, exercice } = data;

        const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
        const printer = new PdfPrinter(fonts);
        const logo = tryReadLogo();

        const periodeText = (date_debut && date_fin) ? `${formatDate(date_debut)} au ${formatDate(date_fin)}` : `${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`;

        const headerColumns = [];
        if (logo?.dataUrl) headerColumns.push({ image: logo.dataUrl, width: 90 });
        headerColumns.push({
            width: '*',
            stack: [
                { text: 'REVUE ANALYTIQUE MENSUELLE', style: 'header', alignment: 'center' },
                { text: `Dossier : ${dossier?.dossier || ''}`, style: 'subheader', alignment: 'center' },
                { text: `Période : ${periodeText}`, style: 'subheader2', alignment: 'center' }
            ]
        });

        const section = exports.buildPdfSection(data, { date_debut, date_fin });

        const docDefinition = {
            pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [15, 15, 15, 25],
            defaultStyle: { font: 'Helvetica', fontSize: 7 },
            content: [
                { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 15] },
                ...section.content
            ],
            styles: {
                header: { fontSize: 16, bold: true, color: '#2C3E50' },
                subheader: { fontSize: 10, bold: true, color: '#34495E', margin: [0, 2, 0, 2] },
                subheader2: { fontSize: 9, color: '#566573' },
                ...section.styles
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Revue_Mensuelle_${id_dossier}_${id_exercice}.pdf`);
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Erreur export PDF revuAnalytiqueMensuelle:', error);
        return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
    }
};

// Export Excel
exports.exportExcel = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode, date_debut, date_fin } = req.query;

        const data = await getMensuelleData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);

        const workbook = new ExcelJS.Workbook();
        exports.addExcelSheets(workbook, data, { date_debut, date_fin });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Revue_Mensuelle_${id_dossier}_${id_exercice}.xlsx`);
        workbook.worksheets.forEach(ws => applyKaontyStyle(ws));
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export Excel revuAnalytiqueMensuelle:', error);
        return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
    }
};
