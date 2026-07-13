const db = require('../../Models');
const { Op } = require('sequelize');


// Récupérer les anomalies depuis table_controle_anomalies pour un contrôle donné (par id_controle code)
exports.getAnomaliesByControle = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, id_controle } = req.params;
    const { date_debut, date_fin } = req.query;

    // console.log('\n========================================');
    // console.log('🚀 GET ANOMALIES BY CONTROLE APPELÉ');
    // console.log('========================================');
    // console.log('Params:', { id_compte, id_dossier, id_exercice, id_controle, date_debut, date_fin });

    let dateFilter = {};
    let idPeriode = null;

    // Si id_periode est fourni explicitement, l'utiliser directement
    if (req.query.id_periode) {
      idPeriode = parseInt(req.query.id_periode, 10);
      // console.log('id_periode fourni explicitement:', idPeriode);
    } else if (date_debut && date_fin) {
      // Sinon, chercher la période par dates (fallback)
      dateFilter = {
        dateecriture: {
          [Op.gte]: date_debut,
          [Op.lte]: date_fin
        }
      };
      // console.log('Filtre date appliqué:', dateFilter);

      // Déterminer la période correspondante - chercher la période exacte
      const periode = await db.periodes.findOne({
        where: {
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          date_debut: { [Op.lte]: date_debut },
          date_fin: { [Op.gte]: date_fin }
        },
        order: [['date_debut', 'ASC']]
      });

      if (periode) {
        idPeriode = periode.id;
        // console.log('Période EXACTE trouvée:', idPeriode);
      } else {
        // Fallback: chercher une période qui chevauche
        const periodeChevauche = await db.periodes.findOne({
          where: {
            id_compte: id_compte,
            id_dossier: id_dossier,
            id_exercice: id_exercice,
            date_debut: { [Op.lte]: date_fin },
            date_fin: { [Op.gte]: date_debut }
          },
          order: [['date_debut', 'ASC']]
        });

        if (periodeChevauche) {
          idPeriode = periodeChevauche.id;
          // console.log('Période CHEVAUCHE trouvée:', idPeriode);
        }
      }
    }

    // Récupérer le contrôle pour connaître son Affichage
    const controle = await db.revisionControle.findOne({
      where: {
        id_compte: id_compte,
        id_dossier: id_dossier,
        id_exercice: id_exercice,
        id_controle: id_controle
      }
    });

    let affichage = controle?.Affichage || 'ligne';
    if (controle?.Type === 'ATYPIQUE') {
      affichage = 'ligne';
    }

    // Récupérer les anomalies pour ce contrôle avec leurs commentaires depuis la nouvelle table
    // IMPORTANT: Convertir les paramètres en nombres car ils arrivent comme des strings
    const idCompteNum = parseInt(id_compte, 10);
    const idDossierNum = parseInt(id_dossier, 10);
    const idExerciceNum = parseInt(id_exercice, 10);

    // Construire la requête avec filtre de période si disponible
    let periodeFilter = '';
    if (idPeriode !== null) {
      periodeFilter = `AND a.id_periode = ${idPeriode}`;
    }

    const anomaliesRaw = await db.sequelize.query(`
      SELECT 
        a.id,
        a.id_compte,
        a.id_dossier,
        a.id_exercice,
        a.id_jnl,
        a.id_num_compte,
        a."codeCtrl",
        a.id_controle,
        a.message,
        a.id_periode,
        a."createdAt",
        a."updatedAt",
        c.valide as commentaire_valide,
        c.commentaire as commentaire_text,
        c.id_periode as commentaire_periode
        FROM table_controle_anomalies a
      LEFT JOIN revision_commentaire_anomalies c 
        ON a.id_controle = c.id_controle 
        AND a.id_jnl = c.id_jnl
        AND a.id_periode = c.id_periode 
        AND a.id_compte = c.id_compte 
        AND a.id_dossier = c.id_dossier 
        AND a.id_exercice = c.id_exercice
      WHERE a.id_compte = ${idCompteNum}
        AND a.id_dossier = ${idDossierNum}
        AND a.id_exercice = ${idExerciceNum}
        AND a.id_controle = '${id_controle}'
        ${periodeFilter}
      ORDER BY a.id ASC
    `, { type: db.Sequelize.QueryTypes.SELECT });

    // DEBUG: Afficher les résultats bruts de la requête SQL
    // console.log('DEBUG SQL RAW RESULTS:', anomaliesRaw.map(r => ({
    //   id: r.id,
    //   commentaire_valide: r.commentaire_valide,
    //   commentaire_text: r.commentaire_text,
    //   commentaire_periode: r.commentaire_periode
    // })));

    // Transformer les résultats pour avoir la structure attendue par le frontend
    const anomalies = anomaliesRaw.map(row => {
      const result = {
        id: row.id,
        id_compte: row.id_compte,
        id_dossier: row.id_dossier,
        id_exercice: row.id_exercice,
        id_jnl: row.id_jnl,
        id_num_compte: row.id_num_compte,
        codeCtrl: row.codeCtrl,
        id_controle: row.id_controle,
        message: row.message,
        id_periode: row.id_periode,  // ← CORRIGÉ : utiliser a.id_periode
        valide: row.commentaire_valide !== null ? row.commentaire_valide : false,
        commentaire: row.commentaire_text || '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
      // console.log(`DEBUG getAnomaliesByControle - Anomalie ${row.id}: id_periode=${result.id_periode}, valide=${result.valide}, commentaire="${result.commentaire}"`);
      return result;
    });

    // Récupérer les lignes de journal selon le mode
    const idJnlKeys = [...new Set(anomalies.map(a => a.id_jnl).filter(Boolean))];

    let journalLines = [];
    let comptesList = []; // Pour SENS_SOLDE (comptes concernés, pas les IDs de lignes)

    // console.log(`getAnomaliesByControle - Type: ${controle?.Type}, anomalies count: ${anomalies.length}, idJnlKeys:`, idJnlKeys);

    // Type spécial: id_jnl = ID de ligne journal individuelle (nouveau comportement)
    // Utilisé par SENS_SOLDE, SENS_ECRITURE, IMMO_CHARGE avec anomalies individuelles par ligne
    if (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE') {
      // Nouveau comportement: id_jnl = ID de ligne journal individuelle
      // On récupère les lignes par leur ID
      const lineIds = idJnlKeys
        .map(v => parseInt(v, 10))
        .filter(v => Number.isFinite(v));

      if (lineIds.length > 0) {
        const whereClause = {
          id: { [Op.in]: lineIds },
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          ...dateFilter
        };
        // console.log('getAnomaliesByControle ligne mode (individuel) - where:', whereClause);
        const lines = await db.journals.findAll({
          where: whereClause,
          order: [['dateecriture', 'ASC'], ['id', 'ASC']],
          raw: true
        });
        journalLines = lines;
        // console.log(`getAnomaliesByControle - ${lines.length} lignes individuelles trouvées`);

        // Extraire la liste des comptes pour l'affichage
        comptesList = [...new Set(lines.map(l => l.comptegen).filter(Boolean))];
      }
    } else if (controle?.Type === 'UTIL_CPT_TVA') {
      // Pour UTIL_CPT_TVA, id_jnl = id_ecriture (l'ID de l'écriture complète)
      // Récupérer toutes les lignes des écritures concernées
      if (idJnlKeys.length > 0) {
        const whereClause = {
          id_ecriture: { [Op.in]: idJnlKeys },
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          ...dateFilter
        };
        // console.log('getAnomaliesByControle UTIL_CPT_TVA - where:', whereClause);
        const lines = await db.journals.findAll({
          where: whereClause,
          order: [['dateecriture', 'ASC'], ['id', 'ASC']],
          raw: true
        });
        journalLines = lines;
        // console.log(`getAnomaliesByControle UTIL_CPT_TVA - ${lines.length} lignes trouvées pour écritures:`, idJnlKeys);
      }
    } else if (affichage === 'ecriture') {
      // Mode ecriture: id_jnl = id_ecriture (string)
      const whereClause = {
        id_ecriture: { [Op.in]: idJnlKeys },
        id_compte: id_compte,
        id_dossier: id_dossier,
        id_exercice: id_exercice,
        ...dateFilter
      };
      // console.log('getAnomaliesByControle ecriture mode - where:', whereClause);
      const lines = await db.journals.findAll({
        where: whereClause,
        order: [['dateecriture', 'ASC'], ['id', 'ASC']],
        raw: true
      });
      journalLines = lines;
    } else {
      // Mode ligne: id_jnl = journals.id (converti en int pour la requête)
      const ids = idJnlKeys
        .map(v => parseInt(v, 10))
        .filter(v => Number.isFinite(v));

      if (ids.length > 0) {
        const whereClause = {
          id: { [Op.in]: ids },
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          ...dateFilter
        };
        // console.log('getAnomaliesByControle ligne mode - where:', whereClause);
        const lines = await db.journals.findAll({
          where: whereClause,
          raw: true
        });
        journalLines = lines;
      }
    }

    // Joindre les lignes aux anomalies
    const payload = anomalies.map(a => {
      let lines = [];
      if (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE') {
        // Pour ces types, id_jnl = ID de ligne journal individuelle
        // On filtre par ID de ligne
        lines = journalLines.filter(l => String(l.id) === String(a.id_jnl));
      } else if (controle?.Type === 'UTIL_CPT_TVA') {
        // Pour UTIL_CPT_TVA, id_jnl = id_ecriture, on filtre par id_ecriture
        lines = journalLines.filter(l => String(l.id_ecriture) === String(a.id_jnl));
      } else if (affichage === 'ecriture') {
        lines = journalLines.filter(l => String(l.id_ecriture) === String(a.id_jnl));
      } else {
        lines = journalLines.filter(l => String(l.id) === String(a.id_jnl));
      }

      if (controle?.Type === 'ATYPIQUE') {
        // console.log(`DEBUG ATYPIQUE PAYLOAD - id_jnl=${a.id_jnl}, journalLines total=${journalLines.length}, lines filtrées=${lines.length}`);
      }

      // Pour SENS_SOLDE, SENS_ECRITURE, IMMO_CHARGE: compteNum = compte de la ligne
      const compteNum = (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE')
        ? (lines[0]?.comptegen || a.id_jnl)
        : null;

      return {
        ...a,
        affichage,
        journalLines: lines,
        compteNum: compteNum
      };
    });

    // if (controle?.Type === 'ATYPIQUE') {
    //   //console.log('DEBUG ATYPIQUE FINAL - payload:', payload.map(p => ({ id: p.id, id_jnl: p.id_jnl, journalLinesCount: p.journalLines?.length })));
    // }

    // console.log('DEBUG FINAL RESPONSE - First anomaly:', payload[0] ? {
    //   id: payload[0].id,
    //   valide: payload[0].valide,
    //   commentaire: payload[0].commentaire,
    //   id_controle: payload[0].id_controle,
    //   id_jnl: payload[0].id_jnl
    // } : 'No anomalies');

    // console.log('DEBUG FINAL RESPONSE - Complete response:', {
    //   state: true,
    //   anomalies: payload,
    //   controle: controle ? controle.toJSON() : null,
    //   affichage,
    //   comptesList: (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE') ? comptesList : null,
    //   count: payload.length
    // });

    res.json({
      state: true,
      anomalies: payload,
      controle: controle ? controle.toJSON() : null,
      affichage,
      comptesList: (controle?.Type === 'SENS_SOLDE' || controle?.Type === 'SENS_ECRITURE' || controle?.Type === 'IMMO_CHARGE') ? comptesList : null,
      count: payload.length
    });
  } catch (error) {
    console.error('Error in getAnomaliesByControle:', error);
    res.status(500).json({
      state: false,
      message: 'Erreur lors de la recupération des anomalies',
      error: error.message
    });
  }
};

// Mettre à jour une anomalie par clé (id_controle + id_jnl) (valider/annuler/commenter/id_periode)
exports.updateAnomalyByKey = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_controle, id_jnl, valide, commentaire, id_periode } = req.body;

    if (!id_controle || !id_jnl) {
      return res.status(400).json({
        state: false,
        message: 'id_controle et id_jnl sont obligatoires'
      });
    }

    // sécuriser types
    const idCompteNum = parseInt(id_compte, 10);
    const idDossierNum = parseInt(id_dossier, 10);
    const idExerciceNum = parseInt(id_exercice, 10);

    // 🔍 récupérer les anomalies liées
    const anomalies = await db.tableControleAnomalies.findAll({
      where: {
        id_compte: idCompteNum,
        id_dossier: idDossierNum,
        id_exercice: idExerciceNum,
        id_controle,
        id_jnl
      }
    });

    if (!anomalies.length) {
      return res.status(404).json({
        state: false,
        message: 'Aucune anomalie trouvée pour cette combinaison'
      });
    }

    // 📅 gérer id_periode
    let finalPeriodeId = id_periode;

    if (!finalPeriodeId) {
      const periode = await db.periodes.findOne({
        where: {
          id_compte: idCompteNum,
          id_dossier: idDossierNum,
          id_exercice: idExerciceNum
        },
        order: [['date_debut', 'ASC']]
      });

      finalPeriodeId = periode?.id || null;
    }

    // 🧾 valeurs finales
    const finalValide = typeof valide === 'boolean' ? valide : false;

    // 🔁 UPSERT (clé = id_controle + id_jnl + id_periode)
    const existing = await db.sequelize.query(`
      SELECT id, commentaire FROM revision_commentaire_anomalies
      WHERE id_compte = ${idCompteNum}
        AND id_dossier = ${idDossierNum}
        AND id_exercice = ${idExerciceNum}
        AND id_controle = '${id_controle}'
        AND id_jnl = '${id_jnl}'
        AND id_periode ${finalPeriodeId ? `= ${finalPeriodeId}` : 'IS NULL'}
    `, { type: db.Sequelize.QueryTypes.SELECT });

    // Déterminer le commentaire final : utiliser celui envoyé, sinon conserver l'existant
    let finalCommentaire;
    if (commentaire !== undefined && commentaire !== null) {
      finalCommentaire = String(commentaire).replace(/'/g, "''");
    } else if (existing.length > 0 && existing[0].commentaire) {
      finalCommentaire = existing[0].commentaire.replace(/'/g, "''");
    } else {
      finalCommentaire = '';
    }

    if (existing.length > 0) {
      // UPDATE
      await db.sequelize.query(`
        UPDATE revision_commentaire_anomalies
        SET valide = ${finalValide},
            commentaire = '${finalCommentaire}',
            id_periode = ${finalPeriodeId || 'NULL'},
            "updatedAt" = NOW()
        WHERE id_compte = ${idCompteNum}
          AND id_dossier = ${idDossierNum}
          AND id_exercice = ${idExerciceNum}
          AND id_controle = '${id_controle}'
          AND id_jnl = '${id_jnl}'
          AND id_periode ${finalPeriodeId ? `= ${finalPeriodeId}` : 'IS NULL'}
      `);
    } else {
      // INSERT
      await db.sequelize.query(`
        INSERT INTO revision_commentaire_anomalies (
          id_compte, id_dossier, id_exercice,
          id_periode, id_controle, id_jnl,
          valide, commentaire, "createdAt", "updatedAt"
        ) VALUES (
          ${idCompteNum}, ${idDossierNum}, ${idExerciceNum},
          ${finalPeriodeId || 'NULL'},
          '${id_controle}', '${id_jnl}',
          ${finalValide}, '${finalCommentaire}',
          NOW(), NOW()
        )
      `);
    }

    // 🔢 update compteur contrôle (on garde ton SQL existant)
    await db.sequelize.query(`
      UPDATE table_revisions_controles
      SET anomalies = (
        SELECT COUNT(*)
        FROM table_controle_anomalies a
        LEFT JOIN revision_commentaire_anomalies c
          ON c.id_controle = a.id_controle
          AND c.id_jnl = a.id_jnl
          AND a.id_compte = c.id_compte
          AND a.id_dossier = c.id_dossier
          AND a.id_exercice = c.id_exercice
        WHERE a.id_compte = ${idCompteNum}
          AND a.id_dossier = ${idDossierNum}
          AND a.id_exercice = ${idExerciceNum}
          AND a.id_controle = '${id_controle}'
          AND COALESCE(c.valide, false) = false
      )
      WHERE id_compte = ${idCompteNum}
        AND id_dossier = ${idDossierNum}
        AND id_exercice = ${idExerciceNum}
        AND id_controle = '${id_controle}'
    `);

    return res.json({
      state: true,
      message: 'Anomalies mises à jour',
      updatedCount: anomalies.length
    });

  } catch (error) {
    console.error('❌ ERROR updateAnomalyByKey:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Valider/commenter une ligne par controle (pour SENS_SOLDE, SENS_ECRITURE qui n'ont pas d'id_anomalie individuel)
exports.validateLineAnomaly = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, id_controle } = req.params;
    const { id_jnl, valide, commentaire, id_periode } = req.body;

    // console.log('=== VALIDATE LINE ANOMALY ===');
    // console.log('Params:', { id_compte, id_dossier, id_exercice, id_controle });
    // console.log('Body:', { id_jnl, valide, commentaire, id_periode });

    if (!id_jnl) {
      return res.status(400).json({
        state: false,
        message: 'id_jnl est requis dans le body'
      });
    }

    // Chercher l'anomalie par id_controle + id_jnl
    const anomaly = await db.tableControleAnomalies.findOne({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        id_controle,
        id_jnl
      }
    });

    if (!anomaly) {
      // console.log('Anomalie non trouvée pour:', { id_controle, id_jnl });
      return res.status(404).json({
        state: false,
        message: 'Anomalie non trouvée pour ce contrôle et cette ligne'
      });
    }

    // Appeler updateAnomalyByKey avec id_controle + id_jnl
    req.body.id_controle = id_controle;
    req.body.id_jnl = id_jnl;
    return exports.updateAnomalyByKey(req, res);

  } catch (error) {
    console.error('Error in validateLineAnomaly:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur lors de la validation de la ligne',
      error: error.message
    });
  }
};

// Récupère les statistiques des anomalies de contrôle
exports.getStats = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { id_periode } = req.query;

    // Total par type de contrôle (les totaux globaux en sont dérivés → 1 seule requête)
    const detailsQuery = `
      WITH base AS (
        SELECT
          a."codeCtrl" AS code_ctrl,
          a.id_controle,
          a.id_num_compte,
          a.id_jnl,
          COALESCE(c.valide, false) AS valide,
          CASE
            WHEN a."codeCtrl" IN ('SENS_ECRITURE', 'SENS_SOLDE') THEN CONCAT(a."codeCtrl", '::COMPTE::', COALESCE(a.id_num_compte, ''))
            WHEN a."codeCtrl" IN ('UTIL_CPT_TVA') THEN CONCAT(a."codeCtrl", '::ECRITURE::', COALESCE(a.id_jnl, ''))
            WHEN a."codeCtrl" IN ('ATYPIQUE', 'IMMO_CHARGE') THEN CONCAT(a."codeCtrl", '::LIGNE::', a.id::text)
            ELSE CONCAT(a."codeCtrl", '::LIGNE::', a.id::text)
          END AS group_key
        FROM table_controle_anomalies a
        LEFT JOIN revision_commentaire_anomalies c
          ON c.id_controle = a.id_controle
          AND c.id_jnl = a.id_jnl
          AND a.id_compte = c.id_compte
          AND a.id_dossier = c.id_dossier
          AND a.id_exercice = c.id_exercice
          AND ((a.id_periode IS NULL AND c.id_periode IS NULL) OR (a.id_periode = c.id_periode))
        WHERE a.id_compte = :id_compte
          AND a.id_dossier = :id_dossier
          AND a.id_exercice = :id_exercice
          ${id_periode ? 'AND a.id_periode = :id_periode' : ''}
      ), grouped AS (
        SELECT
          code_ctrl,
          group_key,
          BOOL_AND(valide = true) AS group_valide
        FROM base
        GROUP BY code_ctrl, group_key
      )
      SELECT
        code_ctrl AS type,
        COUNT(*) AS total_groups,
        SUM(CASE WHEN group_valide = false THEN 1 ELSE 0 END) AS remaining_groups
      FROM grouped
      GROUP BY code_ctrl
      ORDER BY code_ctrl
    `;

    const detailsByType = await db.sequelize.query(detailsQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: {
        id_compte,
        id_dossier,
        id_exercice,
        ...(id_periode ? { id_periode } : {})
      }
    });

    // Totaux globaux dérivés du détail (les group_key incluent le type → uniques)
    const totalAnomalies = detailsByType.reduce((s, r) => s + parseInt(r.total_groups || 0, 10), 0);
    const remaining = detailsByType.reduce((s, r) => s + parseInt(r.remaining_groups || 0, 10), 0);
    const valideAnomalies = Math.max(totalAnomalies - remaining, 0);

    return res.status(200).json({
      state: true,
      data: {
        total_anomalies: totalAnomalies,
        total: totalAnomalies,
        valide: valideAnomalies,
        restantes: remaining,
        nonValide: remaining,
        details: detailsByType
      }
    });

  } catch (error) {
    console.error('Erreur stats anomalies contrôle:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
