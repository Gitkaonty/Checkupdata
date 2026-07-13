const db = require('../../Models');
const { QueryTypes } = require('sequelize');
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { applyKaontyStyle } = require('../../Middlewares/kaontyExcelStyle');
const { valideIconCell, xlValide, statsBand, writeExcelStats, exerciceLabel } = require('../../Middlewares/exportPdfTheme');

// Stats doublons : total = nb de groupes ; restant = groupes non validés
const doublonStats = (resultats) => {
  const g = {};
  (resultats || []).forEach(r => { if (g[r.id_doublon] === undefined) g[r.id_doublon] = (r.statut === 'VALIDE'); });
  const total = Object.keys(g).length;
  const restant = Object.values(g).filter(v => !v).length;
  return { total, restant };
};

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

// Correspondance champ SQL (interne) -> alias de colonne en sortie, pour pouvoir
// trier/filtrer dans la requête externe qui ne voit que les alias.
const GROUPFIELD_ALIAS = {
    'j.dateecriture': 'dateecriture',
    'j.compteAux': 'compte',
    'cj.code': 'journal',
    'j.piece': 'piece',
    'j.libelle': 'libelle',
    'j.debit': 'debit',
    'j.credit': 'credit',
};
const toAlias = (f) => GROUPFIELD_ALIAS[f] || f;

/**
 * Insère les résultats en INSERT brut multi-lignes par lots (bien plus rapide que
 * bulkCreate de l'ORM, qui instancie chaque ligne).
 */
const insertDoublonsRaw = async (rows) => {
    if (!rows || rows.length === 0) return;

    const esc = (v) => (v === null || v === undefined) ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
    const dt = (v) => {
        if (v === null || v === undefined) return 'NULL';
        if (v instanceof Date) return `'${v.toISOString().slice(0, 10)}'`;
        return `'${String(v).slice(0, 10).replace(/'/g, "''")}'`;
    };

    const CHUNK = 1000;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const values = slice.map(r =>
            `(${r.id_dossier}, ${r.id_exercice}, ${r.id_periode == null ? 'NULL' : r.id_periode}, ${r.id_jnl}, ${dt(r.date)}, ${esc(r.compte)}, ${esc(r.journal)}, ${esc(r.piece)}, ${esc(r.libelle)}, ${Number(r.debit) || 0}, ${Number(r.credit) || 0}, ${r.id_doublon}, NOW(), NOW())`
        ).join(',');

        await db.sequelize.query(`
            INSERT INTO recherche_doublons
                (id_dossier, id_exercice, id_periode, id_jnl, date, compte, journal, piece, libelle, debit, credit, id_doublon, "createdAt", "updatedAt")
            VALUES ${values}
        `, { type: QueryTypes.INSERT });
    }
};

/**
 * Exécute la requête de recherche de doublons pour DÉBIT uniquement.
 * Le filtre occurrences >= 2 est appliqué EN SQL (requête externe) pour ne ramener
 * que les lignes appartenant à un groupe de doublons (au lieu de toute la période).
 */
const executeDebitSearchQuery = async (params, groupByFields) => {
    const { id_dossier, id_exercice, date_debut, date_fin } = params;

    const baseFields = groupByFields.filter(f => f && f.trim() !== '');
    const groupByClause = baseFields.length > 0
        ? [...baseFields, 'j.debit'].join(', ')
        : 'j.debit';

    // Tri sur la requête externe -> via les alias de colonnes
    const outerOrderBy = (baseFields.length > 0
        ? [...baseFields.map(toAlias), 'debit', 'id_jnl']
        : ['debit', 'id_jnl']).join(', ');

    const query = `
      SELECT * FROM (
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
          AND j.debit > 0
      ) sub
      WHERE sub.occurrences >= 2
      ORDER BY ${outerOrderBy}
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

    const outerOrderBy = (baseFields.length > 0
        ? [...baseFields.map(toAlias), 'credit', 'id_jnl']
        : ['credit', 'id_jnl']).join(', ');

    const query = `
        SELECT * FROM (
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
        ) sub
        WHERE sub.occurrences >= 2
        ORDER BY ${outerOrderBy}
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
            const outerOrderBy = [...groupByFields.map(toAlias), 'id_jnl'].join(', ');
            const query = `
                SELECT * FROM (
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
                ) sub
                WHERE sub.occurrences >= 2
                ORDER BY ${outerOrderBy}
            `;
            
            const journalsData = await db.sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements: { id_dossier, id_exercice, date_debut, date_fin }
            });
            
            const results = processResults(journalsData, groupByFields, searchParams);
            allResultsToInsert = results.resultsToInsert;
            totalGroupesGlobal = results.totalGroupes;
        }

        // --- Étape 6: Insertion (INSERT brut par lots, bien plus rapide que l'ORM) ---
        if (allResultsToInsert.length > 0) {
            await insertDoublonsRaw(allResultsToInsert);
        }

        // --- Étape 7: Récupération (requête brute -> pas d'hydratation ORM de milliers de lignes) ---
        const periodeClause = (id_periode !== undefined && id_periode !== null && id_periode !== '')
            ? 'id_periode = :id_periode'
            : 'id_periode IS NULL';
        const finalResults = await db.sequelize.query(`
            SELECT id, id_doublon, date, journal, piece, compte, libelle, debit, credit, statut, date_validation
            FROM recherche_doublons
            WHERE id_dossier = :id_dossier
              AND id_exercice = :id_exercice
              AND ${periodeClause}
            ORDER BY id_doublon ASC, id ASC
        `, {
            type: QueryTypes.SELECT,
            replacements: { id_dossier, id_exercice, ...(periodeClause.includes(':id_periode') ? { id_periode } : {}) }
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

        const replacements = { id_dossier, id_exercice };
        let whereSql = 'id_dossier = :id_dossier AND id_exercice = :id_exercice';
        if (id_periode) {
            whereSql += ' AND id_periode = :id_periode';
            replacements.id_periode = id_periode;
        }

        const [stats] = await db.sequelize.query(
            `SELECT
                COUNT(*) AS nb_lignes,
                COUNT(DISTINCT id_doublon) AS nb_groupes,
                COUNT(DISTINCT id_doublon) FILTER (WHERE statut = 'VALIDE') AS nb_valides
             FROM recherche_doublons
             WHERE ${whereSql}`,
            { type: QueryTypes.SELECT, replacements }
        );

        const nbLignes = Number(stats.nb_lignes) || 0;
        const nbGroupes = Number(stats.nb_groupes) || 0;
        const nbGroupesValides = Number(stats.nb_valides) || 0;
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

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatMontant = (val) => {
  if (val === null || val === undefined) return '0,00';
  return Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const tryReadLogo = () => {
  try {
    const logoPath = path.join(__dirname, '../../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      return { dataUrl: `data:image/png;base64,${logoData.toString('base64')}` };
    }
  } catch (err) {
    console.log('Logo not found:', err.message);
  }
  return null;
};

// ==========================================
// SECTION 6: Fonctions réutilisables pour l'export global
// ==========================================

/**
 * Récupère les données de doublons pour l'export (PDF / Excel).
 * Extrait la requête inline utilisée par exportPdf / exportExcel.
 * Retourne le tableau `resultats`.
 */
exports.getExportData = async (id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin) => {
  const whereClause = { id_dossier, id_exercice };
  if (id_periode) whereClause.id_periode = id_periode;

  const resultats = await db.rechercheDoublons.findAll({
    where: whereClause,
    order: [['id_doublon', 'ASC'], ['id', 'ASC']]
  });

  return resultats;
};

/**
 * Construit la section PDF (tableau uniquement) pour la Recherche de Doublons.
 * @param {Array} data - tableau resultats issu de getExportData
 * @returns {{ content: Array, styles: Object }}
 *   content = uniquement le nœud table (groupement + rowSpan) ; pas de logo/titre/headerColumns.
 *   styles  = uniquement les styles nommés utilisés par le tableau ; pas de header/subheader.
 */
exports.buildPdfSection = (data, ctx = {}) => {
  const resultats = data || [];

  // Group by id_doublon
  const grouped = {};
  resultats.forEach(item => {
    if (!grouped[item.id_doublon]) {
      grouped[item.id_doublon] = [];
    }
    grouped[item.id_doublon].push(item);
  });

  const tableBody = [
    [{ text: 'Groupe', style: 'tableHeader', alignment: 'center' }, { text: 'Compte', style: 'tableHeader', alignment: 'center' }, { text: 'Date', style: 'tableHeader', alignment: 'center' }, { text: 'Journal', style: 'tableHeader', alignment: 'center' }, { text: 'Pièce', style: 'tableHeader', alignment: 'center' }, { text: 'Libellé', style: 'tableHeader', alignment: 'center' }, { text: 'Débit', style: 'tableHeader', alignment: 'center' }, { text: 'Crédit', style: 'tableHeader', alignment: 'center' }, { text: 'Statut', style: 'tableHeader', alignment: 'center' }]
  ];

  let rowCounter = 1;
  Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b)).forEach(groupId => {
    const group = grouped[groupId];
    group.forEach((item, idx) => {
      const rowColor = rowCounter % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
      tableBody.push([
        idx === 0 ? { text: `GRP-${groupId}`, rowSpan: group.length, style: 'cell', alignment: 'center', fillColor: rowColor } : {},
        { text: item.compte || '', style: 'cell', fillColor: rowColor },
        { text: formatDate(item.date), style: 'cell', fillColor: rowColor },
        { text: item.journal || '', style: 'cell', fillColor: rowColor },
        { text: item.piece || '', style: 'cell', fillColor: rowColor },
        { text: item.libelle || '', style: 'cell', fillColor: rowColor },
        { text: formatMontant(item.debit), alignment: 'right', style: 'cell', fillColor: rowColor },
        { text: formatMontant(item.credit), alignment: 'right', style: 'cell', fillColor: rowColor },
        { ...valideIconCell(item.statut === 'VALIDE'), fillColor: rowColor }
      ]);
      rowCounter++;
    });
  });

  const content = [
    { table: { headerRows: 1, widths: ['8%', '10%', '10%', '10%', '12%', '25%', '10%', '10%', '5%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : undefined, hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } }
  ];

  const styles = {
    tableHeader: { bold: true, fontSize: 8, color: '#2C3E50' },
    cell: { fontSize: 7, color: '#2C3E50' }
  };

  return { content, styles };
};

/**
 * Ajoute l'onglet 'Doublons' au workbook passé en paramètre.
 * Colonnes / en-têtes / formatage identiques à l'export existant.
 */
exports.addExcelSheets = (workbook, data, ctx = {}) => {
  const resultats = data || [];
  const worksheet = workbook.addWorksheet('Doublons');

  // Colonnes sans en-tête (le bloc titre + l'en-tête sont écrits manuellement).
  worksheet.columns = [
    { key: 'groupe', width: 10 },
    { key: 'compte', width: 12 },
    { key: 'date', width: 12 },
    { key: 'journal', width: 12 },
    { key: 'piece', width: 15 },
    { key: 'libelle', width: 35 },
    { key: 'debit', width: 12 },
    { key: 'credit', width: 12 },
    { key: 'statut', width: 12 }
  ];

  // --- Bloc titre style Kaonty (le styliseur le colorera a posteriori) ---
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').value = 'RECHERCHE DE DOUBLONS';

  worksheet.mergeCells('A2:I2');
  worksheet.getCell('A2').value = `Dossier : ${ctx.dossierName || ''}`;

  worksheet.mergeCells('A3:I3');
  worksheet.getCell('A3').value = `Période : ${ctx.periodeText || ''}`;

  // Ligne 4 : statistiques (Anomalies / Restant à valider)
  {
    const { total, restant } = doublonStats(resultats);
    writeExcelStats(worksheet, 4, total, restant);
  }

  // --- En-tête du tableau (ligne 5) ---
  worksheet.getRow(5).values = ['Groupe', 'Compte', 'Date', 'Journal', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Statut'];
  const headerRow = worksheet.getRow(5);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  headerRow.alignment = { horizontal: 'center' };

  // --- Données (lignes 6+) ---
  let rowIndex = 6;
  resultats.forEach(item => {
    const row = worksheet.getRow(rowIndex);
    row.values = [
      `GRP-${item.id_doublon}`,
      item.compte || '',
      formatDate(item.date),
      item.journal || '',
      item.piece || '',
      item.libelle || '',
      item.debit || 0,
      item.credit || 0,
      xlValide(item.statut === 'VALIDE')
    ];
    row.getCell(7).numFmt = '#,##0.00';
    row.getCell(8).numFmt = '#,##0.00';
    row.getCell(9).alignment = { horizontal: 'center' };
    rowIndex++;
  });

  return worksheet;
};

// ==========================================
// SECTION 7: Endpoints d'export
// ==========================================

/**
 * Export PDF for Recherche Doublons
 */
exports.exportPdf = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode } = req.query;

    const resultats = await exports.getExportData(id_compte, id_dossier, id_exercice, id_periode);

    const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
    const printer = new PdfPrinter(fonts);
    const logo = tryReadLogo();

    const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
    const exercice = await db.exercices.findOne({ where: { id: id_exercice } });

    const headerColumns = [];
    if (logo?.dataUrl) headerColumns.push({ image: logo.dataUrl, width: 90 });
    headerColumns.push({
      width: '*',
      stack: [
        { text: 'RECHERCHE DE DOUBLONS', style: 'header', alignment: 'center' },
        { text: `Dossier : ${dossier?.dossier || id_dossier}`, style: 'subheader', alignment: 'center' },
        { text: `Exercice : ${exerciceLabel(exercice) || id_exercice}`, style: 'subheader2', alignment: 'center' }
      ]
    });

    const section = exports.buildPdfSection(resultats);

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [15, 15, 15, 25],
      defaultStyle: { font: 'Helvetica', fontSize: 8 },
      content: [
        { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 12] },
        (() => { const { total, restant } = doublonStats(resultats); return statsBand(total, restant); })(),
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
    res.setHeader('Content-Disposition', `attachment; filename=Recherche_Doublons_${id_dossier}_${id_exercice}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Erreur export PDF recherche doublons:', error);
    return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Export Excel for Recherche Doublons
 */
exports.exportExcel = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode } = req.query;

    const resultats = await exports.getExportData(id_compte, id_dossier, id_exercice, id_periode);

    // Dossier / période : même logique que l'export PDF (en-tête PDF affiche Dossier + Période)
    const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
    const exercice = await db.exercices.findOne({ where: { id: id_exercice } });
    const ctx = {
      dossierName: dossier?.dossier || id_dossier,
      periodeText: exerciceLabel(exercice) || id_exercice
    };

    const workbook = new ExcelJS.Workbook();
    exports.addExcelSheets(workbook, resultats, ctx);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Recherche_Doublons_${id_dossier}_${id_exercice}.xlsx`);
    workbook.worksheets.forEach(ws => applyKaontyStyle(ws));
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erreur export Excel recherche doublons:', error);
    return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
  }
};
