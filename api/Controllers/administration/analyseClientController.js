const db = require('../../Models');
const { Op, Sequelize } = require('sequelize');

/**
 * Gère l'analyse des comptes clients avec détection d'anomalies
 */

// Types d'anomalies
const ANOMALIE_TYPES = {
  PAIEMENT_SANS_FACTURE: 'paiement_sans_facture',
  FACTURE_3MOIS_NON_REGLEE: 'facture_3mois_non_reglee',
  AJUSTEMENT_NON_TRAITE: 'ajustement_non_traite',
  SOLDE_SUSPENS: 'solde_suspens'
};

// Commentaires par type d'anomalie
const COMMENTAIRES = {
  PAIEMENT_DEBIT: 's\'agit-il d\'un remboursement sur facture d\'avoir?',
  PAIEMENT_CREDIT: 'Aucune facture liée à ce paiement ou un double paiement de facture?',
  FACTURE_3MOIS_CREDIT: 'facture d\'avoir toujours non soldée',
  FACTURE_3MOIS_DEBIT: 'délai de paiement de facture plus de 90j. A vérifier',
  AJUSTEMENT_NON_TRAITE: 'ajustement de compte non traité',
  SOLDE_SUSPENS: 'solde en suspens à régler'
};

const cleanupOldData = async (id_compte, id_dossier, id_exercice, id_periode) => {
  // Supprimer uniquement les lignes temporaires
  // Les anomalies restent avec leurs validations
  await db.analyseClientLignes.destroy({ 
    where: {
      id_compte,
      id_dossier,
      id_exercice,
      ...(id_periode ? { id_periode } : { id_periode: null })
    }
  });
};

/**
 * Récupérer les écritures des comptes clients (411*) pour une période
 * Règle: Code journal BANQUE et sans lettrage
 */
const getClientEcritures = async (id_compte, id_dossier, id_exercice, date_debut, date_fin) => {  
  // Convertir les dates au format YYYY-MM-DD
  const dateDebutFormatted = date_debut ? new Date(date_debut).toISOString().split('T')[0] : null;
  const dateFinFormatted = date_fin ? new Date(date_fin).toISOString().split('T')[0] : null;
    
  // Règle: BANQUE et sans lettrage
  const query = `
    SELECT 
      j.id,
      j.id_journal,
      j.dateecriture,
      j.compteaux,
      j.piece,
      j.libelle,
      j.debit,
      j.credit,
      j.lettrage,
      cj.code as code_journal,
      cj.type as type_journal
    FROM journals j
    LEFT JOIN codejournals cj ON j.id_journal = cj.id
    WHERE j.id_dossier = ${id_dossier}
      AND j.id_exercice = ${id_exercice}
      AND (j.compteaux LIKE '411%')
      AND j.dateecriture >= '${dateDebutFormatted}'
      AND j.dateecriture <= '${dateFinFormatted}'
      AND cj.type = 'BANQUE'
      AND (j.lettrage IS NULL OR j.lettrage = '')
    ORDER BY j.compteaux, j.dateecriture
  `;
    
  const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
  return results;
};

/**
 * Récupérer les factures VENTE non réglées depuis plus de 90 jours
 * Règle: date_controle - date_facture >= 90j et lettrage vide
 */
const getFactures3MoisNonReglees = async (id_dossier, id_exercice, date_debut, date_fin, date_controle) => {
  
  // Convertir les dates au format YYYY-MM-DD
  const dateDebutFormatted = date_debut ? new Date(date_debut).toISOString().split('T')[0] : null;
  const dateFinFormatted = date_fin ? new Date(date_fin).toISOString().split('T')[0] : null;
  const dateControleFormatted = date_controle ? new Date(date_controle).toISOString().split('T')[0] : null;
    
  // Calculer la date limite (date_controle - 90 jours)
  const dateLimite = new Date(date_controle);
  dateLimite.setDate(dateLimite.getDate() - 90);
  const dateLimiteFormatted = dateLimite.toISOString().split('T')[0];
    
  const query = `
    SELECT 
      j.id,
      j.id_journal,
      j.dateecriture,
      j.compteaux,
      j.piece,
      j.libelle,
      j.debit,
      j.credit,
      j.lettrage,
      cj.code as code_journal,
      cj.type as type_journal,
      ('${dateControleFormatted}'::date - j.dateecriture) as jours_retard
    FROM journals j
    LEFT JOIN codejournals cj ON j.id_journal = cj.id
    WHERE j.id_dossier = ${id_dossier}
      AND j.id_exercice = ${id_exercice}
      AND (j.compteaux LIKE '411%')
      AND j.dateecriture >= '${dateDebutFormatted}'
      AND j.dateecriture <= '${dateFinFormatted}'
      AND cj.type = 'VENTE'
      AND (j.lettrage IS NULL OR j.lettrage = '')
      AND ('${dateControleFormatted}'::date - j.dateecriture) >= 90
    ORDER BY j.compteaux, j.dateecriture
  `;
  
  // Debug: voir toutes les factures VENTE
  const debugQuery = `
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN j.lettrage IS NULL OR j.lettrage = '' THEN 1 END) as sans_lettrage,
           MIN(j.dateecriture) as min_date,
           MAX(j.dateecriture) as max_date
    FROM journals j
    LEFT JOIN codejournals cj ON j.id_journal = cj.id
    WHERE j.id_dossier = ${id_dossier}
      AND j.id_exercice = ${id_exercice}
      AND (j.compteaux LIKE '411%')
      AND cj.type = 'VENTE'
  `;
  const debugResult = await db.sequelize.query(debugQuery, { type: db.Sequelize.QueryTypes.SELECT });
  
  // Debug: voir les factures VENTE sans lettrage dans la période
  const debugQuery2 = `
    SELECT j.dateecriture, j.lettrage, j.debit, j.credit, j.compteaux,
           ('${dateControleFormatted}'::date - j.dateecriture) as jours
    FROM journals j
    LEFT JOIN codejournals cj ON j.id_journal = cj.id
    WHERE j.id_dossier = ${id_dossier}
      AND j.id_exercice = ${id_exercice}
      AND (j.compteaux LIKE '411%')
      AND j.dateecriture >= '${dateDebutFormatted}'
      AND j.dateecriture <= '${dateFinFormatted}'
      AND cj.type = 'VENTE'
      AND (j.lettrage IS NULL OR j.lettrage = '')
    ORDER BY j.dateecriture
  `;
  const debugResult2 = await db.sequelize.query(debugQuery2, { type: db.Sequelize.QueryTypes.SELECT });
  
  const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
  
  return results;
};

/**
 * Récupérer les ajustements non traités (journal != VENTE/BANQUE/RAN + lettrage vide)
 */
const getAjustementsNonTraites = async (id_dossier, id_exercice, date_debut, date_fin) => {
  
  // Convertir les dates au format YYYY-MM-DD
  const dateDebutFormatted = date_debut ? new Date(date_debut).toISOString().split('T')[0] : null;
  const dateFinFormatted = date_fin ? new Date(date_fin).toISOString().split('T')[0] : null;
  
  const query = `
    SELECT 
      j.id,
      j.id_journal,
      j.dateecriture,
      j.compteaux,
      j.piece,
      j.libelle,
      j.debit,
      j.credit,
      j.lettrage,
      cj.code as code_journal,
      cj.type as type_journal
    FROM journals j
    LEFT JOIN codejournals cj ON j.id_journal = cj.id
    WHERE j.id_dossier = ${id_dossier}
      AND j.id_exercice = ${id_exercice}
      AND (j.compteaux LIKE '411%')
      AND j.dateecriture >= '${dateDebutFormatted}'
      AND j.dateecriture <= '${dateFinFormatted}'
      AND cj.type NOT IN ('VENTE', 'BANQUE', 'RAN')
      AND (j.lettrage IS NULL OR j.lettrage = '')
    ORDER BY j.compteaux, j.dateecriture
  `;
    
  const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
  
  return results;
};

/**
 * Récupérer les soldes en suspens (journal RAN + lettrage vide)
 */
const getSoldesSuspens = async (id_dossier, id_exercice, date_debut, date_fin) => {
  
  // Convertir les dates au format YYYY-MM-DD
  const dateDebutFormatted = date_debut ? new Date(date_debut).toISOString().split('T')[0] : null;
  const dateFinFormatted = date_fin ? new Date(date_fin).toISOString().split('T')[0] : null;
  
  const query = `
    SELECT 
      j.id,
      j.id_journal,
      j.dateecriture,
      j.compteaux,
      j.piece,
      j.libelle,
      j.debit,
      j.credit,
      j.lettrage,
      cj.code as code_journal,
      cj.type as type_journal
    FROM journals j
    LEFT JOIN codejournals cj ON j.id_journal = cj.id
    WHERE j.id_dossier = ${id_dossier}
      AND j.id_exercice = ${id_exercice}
      AND (j.compteaux LIKE '411%')
      AND j.dateecriture >= '${dateDebutFormatted}'
      AND j.dateecriture <= '${dateFinFormatted}'
      AND cj.type = 'RAN'
      AND (j.lettrage IS NULL OR j.lettrage = '')
    ORDER BY j.compteaux, j.dateecriture
  `;
    
  const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
  
  return results;
};

/**
 * Analyser une ligne pour détecter les anomalies
 */
const analyzeLine = (line, typeRegle) => {
  const anomalies = [];
  const compte = line.compteaux;
  
  if (typeRegle === 'BANQUE') {
    if (parseFloat(line.debit || 0) > 0) {
      anomalies.push({
        type: ANOMALIE_TYPES.PAIEMENT_SANS_FACTURE,
        commentaire: COMMENTAIRES.PAIEMENT_DEBIT,
        montant: line.debit,
        sens: 'debit'
      });
    } else if (parseFloat(line.credit || 0) > 0) {
      anomalies.push({
        type: ANOMALIE_TYPES.PAIEMENT_SANS_FACTURE,
        commentaire: COMMENTAIRES.PAIEMENT_CREDIT,
        montant: line.credit,
        sens: 'credit'
      });
    }
  } else if (typeRegle === 'VENTE') {
    if (parseFloat(line.credit || 0) > 0) {
      anomalies.push({
        type: ANOMALIE_TYPES.FACTURE_3MOIS_NON_REGLEE,
        commentaire: COMMENTAIRES.FACTURE_3MOIS_CREDIT,
        montant: line.credit,
        sens: 'credit',
        jours_retard: line.jours_retard
      });
    } else if (parseFloat(line.debit || 0) > 0) {
      anomalies.push({
        type: ANOMALIE_TYPES.FACTURE_3MOIS_NON_REGLEE,
        commentaire: COMMENTAIRES.FACTURE_3MOIS_DEBIT,
        montant: line.debit,
        sens: 'debit',
        jours_retard: line.jours_retard
      });
    }
  } else if (typeRegle === 'AJUSTEMENT') {
    anomalies.push({
      type: ANOMALIE_TYPES.AJUSTEMENT_NON_TRAITE,
      commentaire: COMMENTAIRES.AJUSTEMENT_NON_TRAITE,
      montant: parseFloat(line.debit || 0) > 0 ? line.debit : line.credit,
      sens: parseFloat(line.debit || 0) > 0 ? 'debit' : 'credit'
    });
  } else if (typeRegle === 'RAN') {
    // Règle 4: Solde suspens
    anomalies.push({
      type: ANOMALIE_TYPES.SOLDE_SUSPENS,
      commentaire: COMMENTAIRES.SOLDE_SUSPENS,
      montant: parseFloat(line.debit || 0) > 0 ? line.debit : line.credit,
      sens: parseFloat(line.debit || 0) > 0 ? 'debit' : 'credit'
    });
  }
  
  return anomalies;
};

/**
 * Exécuter l'analyse des clients
 */
exports.executerAnalyse = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { date_debut, date_fin, id_periode } = req.query;
    

    // Validation des paramètres
    if (!date_debut || !date_fin) {
      return res.status(400).json({
        state: false,
        message: 'Les dates de début et fin sont requises'
      });
    }

    // Nettoyer les anciennes données
    await cleanupOldData(id_compte, id_dossier, id_exercice, id_periode || null);

    // ========== RÈGLE 1: Paiement sans facture (BANQUE sans lettrage) ==========
    const ecrituresBanque = await getClientEcritures(
      id_compte, 
      id_dossier, 
      id_exercice, 
      date_debut, 
      date_fin
    );

    // ========== RÈGLE 2: Facture +3 mois non réglée ==========
    const ecrituresVENTE = await getFactures3MoisNonReglees(
      id_dossier, 
      id_exercice, 
      date_debut, 
      date_fin,
      date_fin  // date de contrôle = date fin période
    );

    // ========== RÈGLE 3: Ajustements non traités ==========
    const ecrituresAjustement = await getAjustementsNonTraites(
      id_dossier, 
      id_exercice, 
      date_debut, 
      date_fin
    );

    // ========== RÈGLE 4: Soldes suspens (RAN sans lettrage) ==========
    const ecrituresRan = await getSoldesSuspens(
      id_dossier, 
      id_exercice, 
      date_debut, 
      date_fin
    );

    // Analyser chaque ligne et stocker les résultats
    const lignesAvecAnomalies = [];
    let paiementSansFactureCount = 0;
    let facture3MoisCount = 0;
    let ajustementCount = 0;
    let soldeSuspensCount = 0;

    // Traiter les lignes BANQUE
    for (const line of ecrituresBanque) {      
      const anomalies = analyzeLine(line, 'BANQUE');
      
      if (anomalies.length > 0) {
        await processAnomalieLine(line, anomalies, id_compte, id_dossier, id_exercice, id_periode, lignesAvecAnomalies);
        paiementSansFactureCount++;
      }
    }

    // Traiter les lignes VENTE >90j
    for (const line of ecrituresVENTE) {      
      const anomalies = analyzeLine(line, 'VENTE');
            
      if (anomalies.length > 0) {
        await processAnomalieLine(line, anomalies, id_compte, id_dossier, id_exercice, id_periode, lignesAvecAnomalies);
        facture3MoisCount++;
      }
    }

    // Traiter les lignes AJUSTEMENT
    for (const line of ecrituresAjustement) {      
      const anomalies = analyzeLine(line, 'AJUSTEMENT');
            
      if (anomalies.length > 0) {
        await processAnomalieLine(line, anomalies, id_compte, id_dossier, id_exercice, id_periode, lignesAvecAnomalies);
        ajustementCount++;
      }
    }

    // Traiter les lignes RAN
    for (const line of ecrituresRan) {      
      const anomalies = analyzeLine(line, 'RAN');
            
      if (anomalies.length > 0) {
        await processAnomalieLine(line, anomalies, id_compte, id_dossier, id_exercice, id_periode, lignesAvecAnomalies);
        soldeSuspensCount++;
      }
    }

    // Grouper par compte pour le résultat
    const groupedByCompte = {};
    for (const item of lignesAvecAnomalies) {
      if (!groupedByCompte[item.compte]) {
        groupedByCompte[item.compte] = {
          compte: item.compte,
          lignes: [],
          total_anomalies: 0
        };
      }
      groupedByCompte[item.compte].lignes.push(item);
      groupedByCompte[item.compte].total_anomalies += item.anomalies.length;
    }

    res.json({
      state: true,
      message: `Analyse terminée. ${lignesAvecAnomalies.length} lignes avec anomalies trouvées.`,
      resume: {
        total_lignes: lignesAvecAnomalies.length,
        total_comptes: Object.keys(groupedByCompte).length,
        paiement_sans_facture: paiementSansFactureCount,
        facture_3mois: facture3MoisCount,
        ajustement_non_traite: ajustementCount,
        solde_suspens: soldeSuspensCount
      },
      resultats: Object.values(groupedByCompte)
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse client:', error);
    res.status(500).json({
      state: false,
      message: 'Erreur lors de l\'analyse client',
      error: error.message
    });
  }
};

/**
 * Traiter une ligne avec anomalies (insertion en base)
 */
const processAnomalieLine = async (line, anomalies, id_compte, id_dossier, id_exercice, id_periode, lignesAvecAnomalies) => {
  const compte = line.compteaux;
  
  // Insérer la ligne dans analyse_client_lignes
  const insertLigneQuery = `
    INSERT INTO analyse_client_lignes (
      id_compte, id_dossier, id_exercice, id_periode, id_ligne,
      compte, code_journal, type_journal, date_ecriture, piece,
      libelle, debit, credit, lettrage, "createdAt", "updatedAt"
    ) VALUES (
      ${id_compte}, ${id_dossier}, ${id_exercice}, ${id_periode || 'NULL'}, ${line.id},
      '${compte.replace(/'/g, "''")}', 
      '${(line.code_journal || '').replace(/'/g, "''")}',
      '${(line.type_journal || '').replace(/'/g, "''")}',
      '${line.dateecriture}',
      '${(line.piece || '').replace(/'/g, "''")}',
      '${(line.libelle || '').replace(/'/g, "''")}',
      ${line.debit || 0},
      ${line.credit || 0},
      '${(line.lettrage || '').replace(/'/g, "''")}',
      NOW(), NOW()
    )
    RETURNING id
  `;
  
  await db.sequelize.query(insertLigneQuery, { 
    type: db.Sequelize.QueryTypes.INSERT 
  });

  // Insérer les anomalies (vérifie d'abord si existe)
  for (const anomalie of anomalies) {
    const checkExistingQuery = `
      SELECT id, valider, commentaire_validation 
      FROM analyse_client_anomalies 
      WHERE id_dossier = ${id_dossier} 
        AND id_exercice = ${id_exercice} 
        AND COALESCE(id_periode, 0) = COALESCE(${id_periode || 'NULL'}, 0)
        AND id_ligne = ${line.id} 
        AND type_anomalie = '${anomalie.type}'
    `;
    
    const existing = await db.sequelize.query(checkExistingQuery, { 
      type: db.Sequelize.QueryTypes.SELECT 
    });
    
    if (existing.length === 0) {
      const insertQuery = `
        INSERT INTO analyse_client_anomalies (
          id_dossier, id_ligne, compte, id_periode, id_exercice,
          type_anomalie, commentaire, valider, "createdAt", "updatedAt"
        ) VALUES (
          ${id_dossier}, ${line.id}, '${compte.replace(/'/g, "''")}',
          ${id_periode || 'NULL'}, ${id_exercice},
          '${anomalie.type}',
          '${anomalie.commentaire.replace(/'/g, "''")}',
          false, NOW(), NOW()
        )
        RETURNING id
      `;
      const result = await db.sequelize.query(insertQuery, { type: db.Sequelize.QueryTypes.INSERT });
      anomalie.id = result[0][0].id;
    } else if (!existing[0].valider) {
      const updateQuery = `
        UPDATE analyse_client_anomalies 
        SET commentaire = '${anomalie.commentaire.replace(/'/g, "''")}',
            "updatedAt" = NOW()
        WHERE id = ${existing[0].id}
      `;
      await db.sequelize.query(updateQuery);
      anomalie.id = existing[0].id;
    } else {
      // Anomalie validée - préserver les données existantes
      anomalie.id = existing[0].id;
      anomalie.valider = existing[0].valider;
      anomalie.commentaire_validation = existing[0].commentaire_validation;
    }
  }

  lignesAvecAnomalies.push({
    id_ligne: line.id,
    compte,
    date_ecriture: line.dateecriture,
    piece: line.piece,
    libelle: line.libelle,
    debit: line.debit,
    credit: line.credit,
    lettrage: line.lettrage,
    code_journal: line.code_journal,
    type_journal: line.type_journal,
    anomalies
  });
};

/**
 * Récupérer les résultats d'analyse (lignes avec anomalies groupées par compte)
 */
exports.getResultats = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode } = req.query;

    const whereLignes = {
      id_compte,
      id_dossier,
      id_exercice,
      ...(id_periode ? { id_periode } : {})
    };

    // Récupérer les lignes avec leurs anomalies
    const lignes = await db.analyseClientLignes.findAll({
      where: whereLignes,
      include: [{
        model: db.analyseClientAnomalies,
        as: 'anomalies',
        required: false,
        attributes: ['id', 'type_anomalie', 'commentaire', 'commentaire_validation', 'valider']
      }],
      order: [['compte', 'ASC'], ['date_ecriture', 'ASC']]
    });

    // Grouper par compte
    const groupedByCompte = {};
    for (const ligne of lignes) {
      const compte = ligne.compte;
      if (!groupedByCompte[compte]) {
        groupedByCompte[compte] = {
          compte,
          nom_compte: '',
          lignes: []
        };
      }
      
      groupedByCompte[compte].lignes.push({
        id: ligne.id,
        id_ligne_originale: ligne.id_ligne,
        date_ecriture: ligne.date_ecriture,
        piece: ligne.piece,
        libelle: ligne.libelle,
        debit: ligne.debit,
        credit: ligne.credit,
        lettrage: ligne.lettrage,
        code_journal: ligne.code_journal,
        type_journal: ligne.type_journal,
        anomalies: (ligne.anomalies || []).map(a => ({
          id: a.id,
          type: a.type_anomalie,
          commentaire: a.commentaire,
          commentaire_validation: a.commentaire_validation,
          valider: a.valider
        }))
      });
    }

    res.json({
      state: true,
      resultats: Object.values(groupedByCompte)
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({
      state: false,
      message: 'Erreur lors de la récupération des résultats',
      error: error.message
    });
  }
};

/**
 * Valider une anomalie
 */
exports.validerAnomalie = async (req, res) => {
  try {
    const { id } = req.params;
    const { valider, commentaire_validation } = req.body;

    const anomalie = await db.analyseClientAnomalies.findByPk(id);
    if (!anomalie) {
      return res.status(404).json({
        state: false,
        message: 'Anomalie non trouvée'
      });
    }

    await anomalie.update({
      valider: valider !== undefined ? valider : anomalie.valider,
      commentaire_validation: commentaire_validation || anomalie.commentaire_validation
    });

    res.json({
      state: true,
      message: 'Anomalie mise à jour avec succès',
      anomalie
    });

  } catch (error) {
    console.error('Erreur lors de la validation de l\'anomalie:', error);
    res.status(500).json({
      state: false,
      message: 'Erreur lors de la validation',
      error: error.message
    });
  }
};

/**
 * Supprimer les résultats d'analyse
 */
exports.supprimerAnalyse = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode } = req.query;

    await cleanupOldData(id_compte, id_dossier, id_exercice, id_periode || null);

    res.json({
      state: true,
      message: 'Analyse supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'analyse:', error);
    res.status(500).json({
      state: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};
