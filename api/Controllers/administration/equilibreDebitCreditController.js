const db = require('../../Models');
const { Op } = require('sequelize');

// Tolérance d'arrondi : en deçà, on considère l'écart comme nul (bruit de calcul flottant).
const TOL = 0.005;

const computeEquilibre = async (id_compte, id_dossier, id_exercice, date_debut, date_fin) => {
  const dateFilter = (date_debut && date_fin)
    ? 'AND dateecriture BETWEEN :date_debut AND :date_fin'
    : '';

  const query = `
    WITH par_ecriture AS (
      SELECT id_ecriture,
             SUM(COALESCE(debit,0))  AS td,
             SUM(COALESCE(credit,0)) AS tc,
             SUM(COALESCE(debit,0)) - SUM(COALESCE(credit,0)) AS ecart
      FROM journals
      WHERE id_compte  = :id_compte
        AND id_dossier = :id_dossier
        AND id_exercice = :id_exercice
        ${dateFilter}
      GROUP BY id_ecriture
    )
    SELECT * FROM (
      SELECT 'GLOBAL' AS type,
             NULL::text AS id_ecriture,
             COALESCE(SUM(td),0)    AS total_debit,
             COALESCE(SUM(tc),0)    AS total_credit,
             COALESCE(SUM(ecart),0) AS ecart
      FROM par_ecriture
      UNION ALL
      SELECT 'ECRITURE' AS type,
             id_ecriture::text,
             td, tc, ecart
      FROM par_ecriture
      WHERE ABS(ecart) > :tol
    ) u
    ORDER BY u.type, ABS(u.ecart) DESC
  `;

  const replacements = {
    id_compte: parseInt(id_compte, 10),
    id_dossier: parseInt(id_dossier, 10),
    id_exercice: parseInt(id_exercice, 10),
    tol: TOL,
  };
  if (date_debut && date_fin) {
    replacements.date_debut = date_debut;
    replacements.date_fin = date_fin;
  }

  const rows = await db.sequelize.query(query, {
    replacements,
    type: db.Sequelize.QueryTypes.SELECT,
  });

  const globalRow = rows.find((r) => r.type === 'GLOBAL') || { total_debit: 0, total_credit: 0, ecart: 0 };
  const ecartGlobal = Number(globalRow.ecart) || 0;

  const ecritures = rows
    .filter((r) => r.type === 'ECRITURE')
    .map((r) => ({
      id_ecriture: r.id_ecriture,
      total_debit: Number(r.total_debit) || 0,
      total_credit: Number(r.total_credit) || 0,
      ecart: Number(r.ecart) || 0,
    }));

  return {
    global: {
      total_debit: Number(globalRow.total_debit) || 0,
      total_credit: Number(globalRow.total_credit) || 0,
      ecart: ecartGlobal,
      equilibre: Math.abs(ecartGlobal) <= TOL,
    },
    ecritures,
  };
};

// Données complètes (global + liste des écritures déséquilibrées) — pour l'affichage détaillé.
exports.getEquilibre = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { date_debut, date_fin } = req.query;

    if (!id_compte || !id_dossier || !id_exercice) {
      return res.status(400).json({ state: false, message: 'Paramètres manquants' });
    }

    const result = await computeEquilibre(id_compte, id_dossier, id_exercice, date_debut, date_fin);

    // Lignes détaillées (toutes les colonnes) des écritures déséquilibrées.
    let lignes = [];
    const ecritureIds = result.ecritures
      .map((e) => e.id_ecriture)
      .filter((v) => v !== null && v !== undefined && v !== '');
    if (ecritureIds.length > 0) {
      const whereClause = {
        id_compte: parseInt(id_compte, 10),
        id_dossier: parseInt(id_dossier, 10),
        id_exercice: parseInt(id_exercice, 10),
        id_ecriture: { [Op.in]: ecritureIds },
      };
      if (date_debut && date_fin) {
        whereClause.dateecriture = { [Op.between]: [date_debut, date_fin] };
      }
      lignes = await db.journals.findAll({
        where: whereClause,
        attributes: ['id', 'id_ecriture', 'dateecriture', 'comptegen', 'compteaux', 'piece', 'libelle', 'debit', 'credit', 'lettrage'],
        order: [['id_ecriture', 'ASC'], ['id', 'ASC']],
        raw: true,
      });
    }

    return res.status(200).json({ state: true, data: { ...result, lignes }, count: result.ecritures.length });
  } catch (error) {
    console.error('[EQUILIBRE_DC] error:', error);
    return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
  }
};

// Stats pour le dashboard : nombre d'anomalies = écritures déséquilibrées (+ déséquilibre global résiduel).
exports.getStats = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    const { date_debut, date_fin } = req.query;

    const { global, ecritures } = await computeEquilibre(id_compte, id_dossier, id_exercice, date_debut, date_fin);

    // Une écriture fautive = une anomalie. Cas limite : global déséquilibré alors qu'aucune
    // écriture ne dépasse la tolérance (accumulation de micro-écarts) -> on compte 1 anomalie globale.
    const nb = ecritures.length + ((!global.equilibre && ecritures.length === 0) ? 1 : 0);

    return res.json({
      state: true,
      data: {
        total_anomalies: nb,
        total: nb,
        restantes: nb,
        nonValide: nb,
        nbEcrituresDesequilibrees: ecritures.length,
        global_ecart: global.ecart,
        global_equilibre: global.equilibre,
      },
    });
  } catch (error) {
    console.error('[EQUILIBRE_DC] stats error:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};
