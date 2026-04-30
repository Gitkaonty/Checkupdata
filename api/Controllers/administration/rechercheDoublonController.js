const db = require('../../Models');
const { QueryTypes } = require('sequelize');

// ==========================================
// SECTION 1: Extraction des critères
// ==========================================

/**
 * Extrait les critères 
 */
const extractCriteres = (query) => ({
    date: query.critere_date === 'true',
    compte: query.critere_compte === 'true',
    journal: query.critere_journal === 'true',
    piece: query.critere_piece === 'true',
    libelle: query.critere_libelle === 'true',
    montant: query.critere_montant === 'true'
});

/**
 * Vérifie qu'au moins un critère est activé
 */
const validateCriteres = (criteres) => {
    const hasCritere = Object.values(criteres).some(v => v);
    if (!hasCritere) {
        throw new Error('Aucun critère de recherche sélectionné');
    }
};

// ==========================================
// SECTION 2: Construction des champs SQL
// ==========================================

/**
 * Configuration des champs SQL pour chaque critère
 */
const CRITERIA_CONFIG = {
    date: { 
        groupBy: 'j.dateecriture', 
        select: 'j.dateecriture as date',
        rowExtractor: (row) => row.dateecriture
    },
    compte: { 
        groupBy: 'j.compteAux', 
        select: 'j.compteAux as compte',
        rowExtractor: (row) => row.compte
    },
    journal: { 
        groupBy: 'cj.code', 
        select: 'cj.code as journal',
        rowExtractor: (row) => row.journal
    },
    piece: { 
        groupBy: 'j.piece', 
        select: 'j.piece as piece',
        rowExtractor: (row) => row.piece
    },
    libelle: { 
        groupBy: 'j.libelle', 
        select: 'j.libelle',
        rowExtractor: (row) => row.libelle
    },
    montant: { 
        // Séparé en deux requêtes : débit vs débit, crédit vs crédit
        groupBy: null,
        select: null,
        rowExtractor: null
    }
};

/**
 * Construit les champs GROUP BY et SELECT selon les critères activés
 */
const buildSqlFields = (criteres) => {
    const groupByFields = [];
    const selectFields = [];

    // Critères standard
    Object.entries(CRITERIA_CONFIG).forEach(([key, config]) => {
        if (key === 'montant') return; // Géré séparément
        if (criteres[key]) {
            groupByFields.push(config.groupBy);
            selectFields.push(config.select);
        }
    });

    // Critère montant
    if (criteres.montant) {
        groupByFields.push(CRITERIA_CONFIG.montant.groupBy);
        selectFields.push('j.debit');
        selectFields.push('j.credit');
    }

    return { groupByFields, selectFields };
};

/**
 * Construit la clé de groupement pour une ligne
 */
const buildGroupKey = (groupByFields, row, montantType = null) => {
    const parts = groupByFields.map(field => {
        if (field === 'j.dateecriture') return CRITERIA_CONFIG.date.rowExtractor(row);
        if (field === 'j.compteAux') return CRITERIA_CONFIG.compte.rowExtractor(row);
        if (field === 'cj.code') return CRITERIA_CONFIG.journal.rowExtractor(row);
        if (field === 'j.piece') return CRITERIA_CONFIG.piece.rowExtractor(row);
        if (field === 'j.libelle') return CRITERIA_CONFIG.libelle.rowExtractor(row);
        return '';
    });
    
    // Ajouter le type de montant pour différencier débit et crédit
    if (montantType) {
        parts.push(montantType);
        parts.push(montantType === 'DEBIT' ? row.debit : row.credit);
    }
    
    return parts.join('|');
};

// ==========================================
// SECTION 3: Exécution SQL
// ==========================================

/**
 * Exécute la requête de recherche de doublons pour DÉBIT uniquement
 */
const executeDebitSearchQuery = async (params, groupByFields) => {
    const { id_dossier, id_exercice, date_debut, date_fin } = params;

    const baseFields = groupByFields.filter(f => f && f.trim() !== '');
    const groupByClause = baseFields.length > 0 
        ? [...baseFields, 'j.debit'].join(', ')
        : 'j.debit';

    const orderByClause = baseFields.length > 0
        ? [...baseFields, 'j.debit', 'j.id'].join(', ')
        : 'j.debit, j.id';

    const query = `
      SELECT 
    j.id as id_jnl,
    j.dateecriture,
    j.compteAux as compte,
    cj.code as journal,
    j.piece as piece,
    j.libelle,
    j.debit,
    j.credit,

    -- Compte combien de lignes ont la même combinaison définie dans ${groupByClause}
    -- La fonction OVER(PARTITION BY ...) crée des groupes logiques sans regrouper les lignes
    -- Chaque ligne garde donc son détail mais reçoit le nombre d'occurrences du groupe
    COUNT(*) OVER (PARTITION BY ${groupByClause}) as occurrences

FROM journals j
LEFT JOIN codejournals cj ON j.id_journal = cj.id

WHERE j.id_dossier = :id_dossier
AND j.id_exercice = :id_exercice
AND j.dateecriture BETWEEN :date_debut AND :date_fin
AND j.debit > 0

ORDER BY ${orderByClause}
    `;

    return await db.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { id_dossier, id_exercice, date_debut, date_fin }
    });
};

/**
 * Exécute la requête de recherche de doublons pour CRÉDIT uniquement
 */
const executeCreditSearchQuery = async (params, groupByFields) => {
    const { id_dossier, id_exercice, date_debut, date_fin } = params;

    const baseFields = groupByFields.filter(f => f && f.trim() !== '');
    const groupByClause = baseFields.length > 0 
        ? [...baseFields, 'j.credit'].join(', ')
        : 'j.credit';

    const orderByClause = baseFields.length > 0
        ? [...baseFields, 'j.credit', 'j.id'].join(', ')
        : 'j.credit, j.id';

    const query = `
        SELECT 
            j.id as id_jnl,
            j.dateecriture,
            j.compteAux as compte,
            cj.code as journal,
            j.piece as piece,
            j.libelle,
            j.debit,
            j.credit,
            COUNT(*) OVER (PARTITION BY ${groupByClause}) as occurrences
        FROM journals j
        LEFT JOIN codejournals cj ON j.id_journal = cj.id
        WHERE j.id_dossier = :id_dossier
        AND j.id_exercice = :id_exercice
        AND j.dateecriture BETWEEN :date_debut AND :date_fin
        AND j.credit > 0
        ORDER BY ${orderByClause}
    `;

    return await db.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { id_dossier, id_exercice, date_debut, date_fin }
    });
};

// ==========================================
// SECTION 4: Traitement des résultats
// ==========================================

/**
 * Traite les données brutes et assigne les ID de doublons
 */
const processResults = (journalsData, groupByFields, params, montantType = null) => {
    const { id_dossier, id_exercice, id_periode } = params;
    
    let currentIdDoublon = 0;
    let lastGroupKey = null;
    const resultsToInsert = [];

    for (const row of journalsData) {
        // Ignorer les groupes avec moins de 2 occurrences
        if (row.occurrences < 2) continue;

        // Identifier le groupe
        const groupKey = buildGroupKey(groupByFields, row, montantType);

        // Nouveau groupe détecté
        if (groupKey !== lastGroupKey) {
            currentIdDoublon++;
            lastGroupKey = groupKey;
        }

        // Ajouter le résultat
        resultsToInsert.push({
            id_dossier: parseInt(id_dossier),
            id_exercice: parseInt(id_exercice),
            id_periode: id_periode ? parseInt(id_periode) : null,
            id_jnl: row.id_jnl,
            date: row.dateecriture,
            compte: row.compte || null,
            journal: row.journal || null,
            piece: row.piece || null,
            libelle: row.libelle || null,
            debit: row.debit || 0,
            credit: row.credit || 0,
            id_doublon: currentIdDoublon,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    return { resultsToInsert, totalGroupes: currentIdDoublon };
};

/**
 * Formate les résultats pour la réponse API
 */
const formatResponse = (items) => items.map(item => ({
    id: item.id,
    id_doublon: item.id_doublon,
    date: item.date,
    journal: item.journal,
    piece: item.piece,
    compte: item.compte,
    libelle: item.libelle,
    debit: item.debit,
    credit: item.credit,
    statut: item.statut || 'NON_VALIDE',
    date_validation: item.date_validation
}));

// ==========================================
// SECTION 5: Endpoints API
// ==========================================

/**
 * POST /administration/rechercheDoublon/:id_compte/:id_dossier/:id_exercice
 */
exports.rechercherDoublons = async (req, res) => {
    try {
        // --- Étape 1: Paramètres ---
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { date_debut, date_fin, id_periode, ...queryParams } = req.query;

        // --- Étape 2: Validation ---
        const criteres = extractCriteres(queryParams);
        validateCriteres(criteres);

        // --- Étape 3: Nettoyage ---
        await db.rechercheDoublons.destroy({
            where: { id_dossier, id_exercice, id_periode: id_periode || null }
        });

        // --- Étape 4: Construction SQL ---
        const { groupByFields } = buildSqlFields(criteres);

        // --- Étape 5: Exécution ---
        const searchParams = { id_dossier, id_exercice, date_debut, date_fin, id_periode };
        
        let allResultsToInsert = [];
        let totalGroupesGlobal = 0;
        
        if (criteres.montant) {
            // Recherche DÉBIT vs DÉBIT
            const debitData = await executeDebitSearchQuery(searchParams, groupByFields);
            const debitResults = processResults(debitData, groupByFields, searchParams, 'DEBIT');
            
            // Recherche CRÉDIT vs CRÉDIT
            const creditData = await executeCreditSearchQuery(searchParams, groupByFields);
            const creditResults = processResults(creditData, groupByFields, searchParams, 'CREDIT');
            
            // Fusionner les résultats avec des ID séquentiels
            if (debitResults.resultsToInsert.length > 0) {
                allResultsToInsert = [...debitResults.resultsToInsert];
                totalGroupesGlobal = debitResults.totalGroupes;
            }
            
            if (creditResults.resultsToInsert.length > 0) {
                // Réassigner les ID des groupes crédit pour qu'ils suivent les groupes débit
                const creditResultsRenumbered = creditResults.resultsToInsert.map(item => ({
                    ...item,
                    id_doublon: item.id_doublon + totalGroupesGlobal
                }));
                allResultsToInsert = [...allResultsToInsert, ...creditResultsRenumbered];
                totalGroupesGlobal += creditResults.totalGroupes;
            }
        } else {
            // Recherche standard sans critère montant
            const query = `
                SELECT 
                    j.id as id_jnl,
                    j.dateecriture,
                    j.compteAux as compte,
                    cj.code as journal,
                    j.piece as piece,
                    j.libelle,
                    j.debit,
                    j.credit,
                    COUNT(*) OVER (PARTITION BY ${groupByFields.join(', ')}) as occurrences
                FROM journals j
                LEFT JOIN codejournals cj ON j.id_journal = cj.id
                WHERE j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND j.dateecriture BETWEEN :date_debut AND :date_fin
                ORDER BY ${groupByFields.join(', ')}, j.id
            `;
            
            const journalsData = await db.sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements: { id_dossier, id_exercice, date_debut, date_fin }
            });
            
            const results = processResults(journalsData, groupByFields, searchParams);
            allResultsToInsert = results.resultsToInsert;
            totalGroupesGlobal = results.totalGroupes;
        }

        // --- Étape 6: Insertion ---
        if (allResultsToInsert.length > 0) {
            await db.rechercheDoublons.bulkCreate(allResultsToInsert);
        }

        // --- Étape 7: Récupération ---
        const finalResults = await db.rechercheDoublons.findAll({
            where: { id_dossier, id_exercice, id_periode: id_periode || null },
            order: [['id_doublon', 'ASC'], ['id', 'ASC']]
        });

        // --- Étape 8: Réponse ---
        const formattedResults = formatResponse(finalResults);

        return res.status(200).json({
            state: true,
            message: `Recherche terminée. ${formattedResults.length} lignes de doublons trouvées dans ${totalGroupesGlobal} groupes.`,
            data: formattedResults,
            nbGroupes: totalGroupesGlobal,
            nbLignes: formattedResults.length
        });

    } catch (error) {
        console.error('Erreur recherche doublons:', error);
        return res.status(500).json({
            state: false,
            message: error.message || 'Erreur lors de la recherche de doublons',
            error: error.message
        });
    }
};

/**
 * GET /administration/rechercheDoublon/:id_dossier/:id_exercice/stats
 * Récupère les statistiques de recherche
 */
exports.getStats = async (req, res) => {
    try {
        const { id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        const whereClause = { id_dossier, id_exercice };
        if (id_periode) whereClause.id_periode = id_periode;

        const nbLignes = await db.rechercheDoublons.count({ where: whereClause });
        const nbGroupes = await db.rechercheDoublons.count({
            where: whereClause,
            distinct: true,
            col: 'id_doublon'
        });
        const nbGroupesValides = await db.rechercheDoublons.count({
            where: { ...whereClause, statut: 'VALIDE' },
            distinct: true,
            col: 'id_doublon'
        });
        const nbGroupesNonValides = Math.max(nbGroupes - nbGroupesValides, 0);

        return res.status(200).json({
            state: true,
            data: {
                nbLignes,
                // Synthèse anomalies: on compte par groupe (id_doublon)
                total_anomalies: nbGroupes,
                total: nbGroupes,
                nbGroupes,
                nbGroupesValides,
                nbGroupesNonValides,
                restantes: nbGroupesNonValides,
                nonValide: nbGroupesNonValides
            }
        });
    } catch (error) {
        console.error('Erreur stats doublons:', error);
        return res.status(500).json({
            state: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * GET /administration/rechercheDoublon/:id_dossier/:id_exercice
 * Récupère les résultats d'une recherche précédente
 */
exports.getResultats = async (req, res) => {
    try {
        const { id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        const whereClause = { id_dossier, id_exercice };
        if (id_periode) whereClause.id_periode = id_periode;

        const resultats = await db.rechercheDoublons.findAll({
            where: whereClause,
            order: [['id_doublon', 'ASC'], ['id', 'ASC']]
        });

        const formattedResults = formatResponse(resultats);

        const nbGroupes = await db.rechercheDoublons.count({
            where: whereClause,
            distinct: true,
            col: 'id_doublon'
        });

        return res.status(200).json({
            state: true,
            data: formattedResults,
            nbGroupes,
            nbLignes: formattedResults.length
        });

    } catch (error) {
        console.error('Erreur récupération résultats:', error);
        return res.status(500).json({
            state: false,
            message: 'Erreur lors de la récupération des résultats',
            error: error.message
        });
    }
};

/**
 * Supprime les résultats d'une recherche
 */
exports.supprimerResultats = async (req, res) => {
    try {
        const { id_dossier, id_exercice } = req.params;
        const { id_periode } = req.query;

        const whereClause = { id_dossier, id_exercice };
        if (id_periode) whereClause.id_periode = id_periode;

        await db.rechercheDoublons.destroy({ where: whereClause });

        return res.status(200).json({
            state: true,
            message: 'Résultats supprimés avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression résultats:', error);
        return res.status(500).json({
            state: false,
            message: 'Erreur lors de la suppression des résultats',
            error: error.message
        });
    }
};

/**
 * Valide un groupe de doublons
 */

exports.validerGroupeDoublon = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { id_compte, id_dossier, id_exercice, id_doublon } = req.params;
        
        // Validation des paramètres
        if (!id_compte || !id_dossier || !id_exercice || !id_doublon) {
            await transaction.rollback();
            return res.status(400).json({
                state: false,
                message: "Paramètres manquants"
            });
        }

        // Vérifier que le groupe existe
        const groupeExistant = await db.rechercheDoublons.findOne({
            where: { 
                id_dossier, 
                id_exercice, 
                id_doublon: parseInt(id_doublon) 
            },
            transaction
        });

        if (!groupeExistant) {
            await transaction.rollback();
            return res.status(404).json({
                state: false,
                message: "Groupe de doublons non trouvé"
            });
        }

        // Récupérer toutes les écritures du groupe
        const ecrituresGroupe = await db.rechercheDoublons.findAll({
            where: { 
                id_dossier, 
                id_exercice, 
                id_doublon: parseInt(id_doublon) 
            },
            attributes: ['id_jnl', 'id_doublon'],
            transaction
        });

        if (ecrituresGroupe.length === 0) {
            console.error('❌ [BACK] Aucune écriture trouvée');
            await transaction.rollback();
            return res.status(404).json({
                state: false,
                message: "Aucune écriture trouvée pour ce groupe"
            });
        }

        const idsJnl = ecrituresGroupe.map(e => e.id_jnl);
        
        // Vérifier d'abord ce qui existe
        const avant = await db.rechercheDoublons.findAll({
            where: { 
                id_dossier, 
                id_exercice, 
                id_doublon: parseInt(id_doublon) 
            },
            transaction
        });
        
        const [updateRechercheResult] = await db.rechercheDoublons.update(
            { 
                statut: 'VALIDE',
                date_validation: new Date(),
                updated_at: new Date()
            },
            { 
                where: { 
                    id_dossier, 
                    id_exercice, 
                    id_doublon: parseInt(id_doublon) 
                },
                transaction
            }
        );        
        // Vérifier après
        const apres = await db.rechercheDoublons.findAll({
            where: { 
                id_dossier, 
                id_exercice, 
                id_doublon: parseInt(id_doublon) 
            },
            transaction
        });

        await transaction.commit();

        return res.status(200).json({
            state: true,
            message: `Groupe ${id_doublon} validé avec succès (${updateRechercheResult} écritures)`,
            data: {
                id_doublon: parseInt(id_doublon),
                nb_ecritures_valides: ecrituresGroupe.length,
                ids_jnl: idsJnl,
                statut: 'VALIDE',
                date_validation: new Date().toISOString()
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ [BACK] Erreur validation groupe doublon:', error);
        console.error('❌ [BACK] Stack trace:', error.stack);
        return res.status(500).json({
            state: false,
            message: "Erreur lors de la validation du groupe",
            error: error.message
        });
    }
};
