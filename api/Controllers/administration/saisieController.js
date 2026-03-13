const db = require("../../Models");
require('dotenv').config();

const devises = db.devises;
const journals = db.journals;
const dossierplancomptable = db.dossierplancomptable;
const codejournals = db.codejournals;
const rapprochements = db.rapprochements;
const analytiques = db.analytiques;
const dossiers = db.dossiers;
const detailsimmo = db.detailsimmo;
const sequelize = db.sequelize;
const { Op } = require('sequelize');

const previewImmoMiddleware = require('../../Middlewares/Immobilisation/PreviewImmo');
const previewImmoLineaireMiddleware = previewImmoMiddleware.previewImmoLineaireMiddleware;
const previewImmoDegressifMiddleware = previewImmoMiddleware.previewImmoDegressifMiddleware;

const saveImmoMiddleware = require('../../Middlewares/Immobilisation/SaveImmo');
const saveImmoLineaireMiddleware = saveImmoMiddleware.saveImmoLineaireMiddleware;
const saveImmoDegressifMiddleware = saveImmoMiddleware.saveImmoDegressifMiddleware;

const fs = require('fs');
const path = require('path');

const updateDetailImmo = require('../../Middlewares/Immobilisation/updateDetailImmo');
const updateMontantImmo = updateDetailImmo.updateMontantImmo;
const updateMontantImmoHorsExercice = updateDetailImmo.updateMontantImmoHorsExercice;

const recupExerciceN1 = require('../../Middlewares/Standard/recupExerciceN1');

// Fonction pour plurieliser un mot
function pluralize(count, word) {
    return count > 1 ? word + 's' : word;
}

// --- Rapprochements: PC 512 éligibles par exercice ---
exports.listEligiblePc512 = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        if (!fileId || !compteId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }
        // Lister tous les comptes 512 du plan comptable du dossier et du compte (pas de filtre exercice)
        const sql = `
            SELECT pc.*
            FROM dossierplancomptables pc
            WHERE pc.id_dossier = :fileId
              AND pc.id_compte = :compteId
              AND pc.compte LIKE '512%'
            ORDER BY pc.compte ASC
        `;
        const rows = await db.sequelize.query(sql, {
            replacements: { fileId, compteId },
            type: db.Sequelize.QueryTypes.SELECT,
        });
        return res.json({ state: true, list: rows || [] });
    } catch (err) {
        console.error('[RAPPRO][PCS] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Ecritures: marquer/démarquer comme rapprochée en masse ---
exports.updateEcrituresRapprochement = async (req, res) => {
    try {
        const { ids, fileId, compteId, exerciceId, rapprocher, dateRapprochement } = req.body || {};
        if (!Array.isArray(ids) || ids.length === 0 || !fileId || !compteId || !exerciceId || typeof rapprocher !== 'boolean') {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants ou invalides' });
        }
        const payload = {
            rapprocher: !!rapprocher,
            // store as 'YYYY-MM-DD' to avoid TZ shift
            date_rapprochement: !!rapprocher ? (dateRapprochement ? String(dateRapprochement).substring(0, 10) : null) : null,
            modifierpar: Number(compteId) || 0,
        };
        if (rapprocher && !payload.date_rapprochement) {
            return res.status(400).json({ state: false, msg: 'dateRapprochement requis quand rapprocher = true' });
        }
        const [affected] = await journals.update(payload, {
            where: {
                id: ids,
                id_compte: Number(compteId),
                id_dossier: Number(fileId),
                id_exercice: Number(exerciceId),
            }
        });
        return res.json({ state: true, updated: affected });
    } catch (err) {
        console.error('[RAPPRO][MARK] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Rapprochements: calcul des soldes pour une ligne sélectionnée ---
exports.computeSoldesRapprochement = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const pcId = Number(req.query?.pcId);
        const rapproId = Number(req.query?.rapproId);
        const endDateParam = req.query?.endDate; // requis pour la ligne sélectionnée
        const soldeBancaireParam = req.query?.soldeBancaire; // optionnel
        const compte = req.query?.compte;
        if (!fileId || !compteId || !exerciceId || !pcId || !endDateParam || !rapproId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }
        const exo = await db.exercices.findByPk(exerciceId);
        if (!exo) return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        const dateDebut = exo.date_debut ? String(exo.date_debut).substring(0, 10) : null;
        const dateFin = endDateParam ? String(endDateParam).substring(0, 10) : null;
        if (!dateDebut || !dateFin) return res.status(400).json({ state: false, msg: 'Dates invalides' });
        try {
            console.debug('[RAPPRO][COMPUTE][INPUT]', { fileId, compteId, exerciceId, pcId, rapproId, endDateParam, dateDebut, dateFin, soldeBancaireParam });
        } catch { }

        const rapprochementData = await rapprochements.findByPk(rapproId);
        if (!rapprochementData) {
            return res.status(500).json({ state: false, msg: 'Rapprochement non trouvé' });
        }
        const dateFinRappro = rapprochementData?.date_fin;

        const sqlAggBase = `
            FROM journals j
            JOIN codejournals cj ON cj.id = j.id_journal
            JOIN dossierplancomptables pc ON pc.id = :pcId
            JOIN dossierplancomptables c ON c.id = j.id_numcpt
            WHERE j.id_compte = :compteId
              AND j.id_dossier = :fileId
              AND j.id_exercice = :exerciceId
              AND cj.compteassocie = pc.compte
              AND j.dateecriture BETWEEN :dateDebut AND :dateFin
              AND c.compte <> pc.compte
        `;

        // Total de TOUTES les écritures (pour solde_comptable)
        // sous-ensemble identique au grid: NON rapprochées
        // + rapprochées dont la date_rapprochement = dateFin sélectionnée

        const sqlAll = `
            SELECT 
                COALESCE(SUM(j.credit),0) AS sum_credit, 
                COALESCE(SUM(j.debit),0) AS sum_debit 
            FROM journals j
            JOIN codejournals cj ON cj.id = j.id_journal
            WHERE j.id_compte = :compteId
            AND j.id_dossier = :fileId
            AND j.id_exercice = :exerciceId
            AND cj.compteassocie = :compte
            AND j.compteaux <> :compte
            AND j.dateecriture BETWEEN :dateDebut AND :dateFin
            AND (
                j.rapprocher IS NOT TRUE
                OR (j.rapprocher = TRUE AND j.date_rapprochement = :dateFin)
            )
        `;

        // Total des écritures NON rapprochées uniquement (rapprocher = false)
        const sqlNonRapp = `
            SELECT 
                COALESCE(SUM(j.credit),0) AS sum_credit, 
                COALESCE(SUM(j.debit),0) AS sum_debit 
                ${sqlAggBase}
                AND (CASE WHEN j.rapprocher THEN 1 ELSE 0 END) = 0
        `;

        const [totAll] = await db.sequelize.query(sqlAll, {
            replacements: { fileId, compteId, exerciceId, pcId, dateDebut, dateFin, dateFinRappro, compte },
            type: db.Sequelize.QueryTypes.SELECT,
        });
        const [totNonRapp] = await db.sequelize.query(sqlNonRapp, {
            replacements: { fileId, compteId, exerciceId, pcId, dateDebut, dateFin },
            type: db.Sequelize.QueryTypes.SELECT,
        });

        // Utiliser la même convention que le grid: Débit - Crédit
        const totalAll = (Number(totAll.sum_credit) || 0) - (Number(totAll.sum_debit) || 0);

        // console.log('totalAll : ', totalAll);
        const totalNonRapp = (Number(totNonRapp.sum_debit) || 0) - (Number(totNonRapp.sum_credit) || 0);

        // solde comptable = total Débit - Crédit sur TOUTES les écritures
        const solde_comptable = totalAll;
        // solde lignes non rapprochées = total Débit - Crédit sur les lignes NON rapprochées uniquement
        const solde_non_rapproche = totalNonRapp;

        const solde_bancaire = soldeBancaireParam !== undefined && soldeBancaireParam !== null ? Number(soldeBancaireParam) : null;
        const ecart = typeof solde_bancaire === 'number' && !isNaN(solde_bancaire)
            ? (solde_comptable - solde_bancaire - solde_non_rapproche)
            : null;

        const payload = { state: true, solde_comptable, solde_non_rapproche, solde_bancaire, ecart };
        try {
            console.debug('[RAPPRO][COMPUTE][RESULT]', { totals: { totAll, totNonRapp, totalAll, totalNonRapp }, payload });
        } catch { }

        // Persister immédiatement les soldes sur la ligne de rapprochement concernée
        try {
            await rapprochements.update(
                {
                    solde_comptable,
                    solde_non_rapproche,
                    // on met à jour solde_bancaire seulement s'il est fourni
                    ...(typeof solde_bancaire === 'number' && !isNaN(solde_bancaire) ? { solde_bancaire } : {}),
                    ecart,
                },
                {
                    where: {
                        id: rapproId,
                        id_dossier: fileId,
                        id_compte: compteId,
                        id_exercice: exerciceId,
                        pc_id: pcId,
                    },
                }
            );
        } catch (errUpdate) {
            console.error('[RAPPRO][COMPUTE][UPDATE_RAPPRO] error:', errUpdate);
        }

        return res.json(payload);

    } catch (err) {
        console.error('[RAPPRO][COMPUTE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Rapprochements: liste des rapprochements pour un PC ---
exports.listRapprochements = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const pcId = Number(req.query?.pcId);
        if (!fileId || !compteId || !exerciceId || !pcId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }
        const rows = await rapprochements.findAll({
            where: {
                id_dossier: fileId,
                id_compte: compteId,
                id_exercice: exerciceId,
                pc_id: pcId,
            },
            order: [['date_debut', 'ASC'], ['id', 'ASC']]
        });
        return res.json({ state: true, list: rows || [] });
    } catch (err) {
        console.error('[RAPPRO][LIST] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Rapprochements: créer ---
exports.createRapprochement = async (req, res) => {
    try {
        const {
            fileId, compteId, exerciceId, pcId,
            date_debut, date_fin,
            solde_comptable = 0, solde_bancaire = 0, solde_non_rapproche = 0,
        } = req.body || {};
        if (!fileId || !compteId || !exerciceId || !pcId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }
        const row = await rapprochements.create({
            id_dossier: Number(fileId),
            id_compte: Number(compteId),
            id_exercice: Number(exerciceId),
            pc_id: Number(pcId),
            // Store as provided date-only strings to avoid timezone issues
            date_debut: date_debut ? String(date_debut).substring(0, 10) : null,
            date_fin: date_fin ? String(date_fin).substring(0, 10) : null,
            solde_comptable: Number(solde_comptable) || 0,
            solde_bancaire: Number(solde_bancaire) || 0,
            solde_non_rapproche: Number(solde_non_rapproche) || 0,
        });
        return res.json({ state: true, id: row.id });
    } catch (err) {
        console.error('[RAPPRO][CREATE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Rapprochements: modifier ---
exports.updateRapprochement = async (req, res) => {
    try {
        const id = Number(req.params?.id);
        const {
            fileId, compteId, exerciceId, pcId,
            date_debut, date_fin,
            solde_comptable = 0, solde_bancaire = 0, solde_non_rapproche = 0,
        } = req.body || {};
        if (!id || !fileId || !compteId || !exerciceId || !pcId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }
        const [affected] = await rapprochements.update({
            date_debut: date_debut ? String(date_debut).substring(0, 10) : null,
            date_fin: date_fin ? String(date_fin).substring(0, 10) : null,
            solde_comptable: Number(solde_comptable) || 0,
            solde_bancaire: Number(solde_bancaire) || 0,
            solde_non_rapproche: Number(solde_non_rapproche) || 0,
        }, {
            where: {
                id,
                id_dossier: Number(fileId),
                id_compte: Number(compteId),
                id_exercice: Number(exerciceId),
                pc_id: Number(pcId),
            }
        });
        if (affected === 0) return res.status(404).json({ state: false, msg: 'Introuvable' });
        return res.json({ state: true, id });
    } catch (err) {
        console.error('[RAPPRO][UPDATE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Rapprochements: supprimer ---
exports.deleteRapprochement = async (req, res) => {
    try {
        const id = Number(req.params?.id);
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        if (!id || !fileId || !compteId || !exerciceId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const rapprochementData = await rapprochements.findByPk(id);
        if (!rapprochementData) {
            return res.status(500).json({ state: false, msg: 'Rapprochement non trouvé' });
        }

        const dateFinRapprochement = rapprochementData.date_fin;

        await journals.update({
            rapprocher: false,
            // date_rapprochement: null
        }, {
            where: {
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId,
                rapprocher: true,
                date_rapprochement: dateFinRapprochement
            }
        })

        const affected = await rapprochements.destroy({ where: { id, id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId } });
        if (!affected) return res.status(404).json({ state: false, msg: 'Introuvable' });
        return res.json({ state: true, id });
    } catch (err) {
        console.error('[RAPPRO][DELETE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Ecritures pour rapprochement: liste des écritures filtrées ---
exports.listEcrituresForRapprochement = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const pcId = Number(req.query?.pcId);
        const endDateParam = req.query?.endDate; // optionnel, sinon on prend fin d'exercice
        const compte = req.query?.compte;
        if (!fileId || !compteId || !exerciceId || !pcId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }
        // Récupérer début/fin d'exercice
        const exo = await db.exercices.findByPk(exerciceId);
        if (!exo) return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        const dateDebut = exo.date_debut;
        const dateFin = endDateParam ? new Date(endDateParam) : exo.date_fin;

        // SQL: journaux du code journal associé au compte 512 sélectionné, dates incluses, et compte different du 512 sélectionné
        // const sql = `
        //     SELECT j.*, c.compte AS compte_ecriture, cj.code AS code_journal
        //     FROM journals j
        //     JOIN codejournals cj ON cj.id = j.id_journal
        //     JOIN dossierplancomptables pc ON pc.id = :pcId
        //     JOIN dossierplancomptables c ON c.id = j.id_numcpt
        //     WHERE j.id_compte = :compteId
        //       AND j.id_dossier = :fileId
        //       AND j.id_exercice = :exerciceId
        //       AND cj.compteassocie = pc.compte
        //       AND j.dateecriture BETWEEN :dateDebut AND :dateFin
        //       AND c.compte <> pc.compte
        //     ORDER BY j.dateecriture ASC, j.id ASC
        // `;

        // const sql = `
        // SELECT 
        //     j.*,
        //     j.compteaux AS compte_ecriture,
        //     cj.code AS code_journal
        // FROM journals j
        // JOIN codejournals cj ON cj.id = j.id_journal
        // WHERE j.id_compte = :compteId
        // AND j.id_dossier = :fileId
        // AND j.id_exercice = :exerciceId
        // AND cj.compteassocie = :compte
        // AND j.compteaux <> :compte
        // AND j.dateecriture BETWEEN :dateDebut AND :dateFin
        // AND (
        //     j.rapprocher IS NOT TRUE
        //     OR (j.rapprocher = TRUE AND j.date_rapprochement = :dateFin)
        // )
        // ORDER BY j.dateecriture ASC, j.id ASC
        // `;

        const sql = `
            SELECT 
                j.*,
                j.compteaux AS compte_ecriture,
                cj.code AS code_journal
            FROM journals j
            JOIN codejournals cj ON cj.id = j.id_journal
            WHERE j.id_compte = :compteId
            AND j.id_dossier = :fileId
            AND j.id_exercice = :exerciceId
            AND cj.compteassocie = :compte
            AND j.compteaux <> :compte
            AND j.dateecriture BETWEEN :dateDebut AND :dateFin
            ORDER BY j.dateecriture ASC, j.id ASC
        `;

        const rows = await db.sequelize.query(sql, {
            replacements: { fileId, compteId, exerciceId, pcId, dateDebut, compte, dateFin },
            type: db.Sequelize.QueryTypes.SELECT,
        });
        // console.log('rows : ', rows);
        return res.json({ state: true, list: rows || [] });
    } catch (err) {
        console.error('[RAPPRO][ECRITURES] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: comptes de classe 2 (hors 28 et 29) ---
exports.listImmobilisationsPc2 = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        if (!fileId || !compteId || !exerciceId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const sql = `
            WITH journal_agg AS (
                SELECT
                    j.compteaux,
                    SUM(j.debit) AS total_debit,
                    SUM(j.credit) AS total_credit,
                    SUM(CASE WHEN cj.type = 'RAN' THEN j.credit - j.debit ELSE 0 END) AS amort_ant,
                    SUM(CASE WHEN cj.type <> 'RAN' OR cj.type IS NULL THEN j.credit - j.debit ELSE 0 END) AS dotation
                FROM journals j
                LEFT JOIN codejournals cj ON cj.id = j.id_journal
                WHERE j.id_compte = :compteId
                AND j.id_dossier = :fileId
                AND j.id_exercice = :exerciceId
                GROUP BY j.compteaux
            ),

            pc AS (
                SELECT
                    MIN(id) AS pc_id,
                    compte,
                    MIN(libelle) AS libelle,
                    id_compte,
                    id_dossier
                FROM dossierplancomptables
                WHERE id_dossier = :fileId
                AND id_compte = :compteId
                AND compte LIKE '2%'
                AND compte NOT LIKE '28%'
                AND compte NOT LIKE '29%'
                GROUP BY compte, id_compte, id_dossier
            )

        SELECT
            pc.pc_id AS id,
            pc.compte,
            pc.libelle AS libelle,
            pc_amort.compte AS compte_amort,
            pc_amort.id AS id_amort,

            COALESCE(j_immo.total_debit, 0) AS mvtdebit,
            COALESCE(j_immo.total_credit, 0) AS mvtcredit,
            COALESCE(j_immo.total_debit, 0) - COALESCE(j_immo.total_credit, 0) AS solde,

            COALESCE(j_amort.amort_ant, 0) AS amort_ant,
            COALESCE(j_amort.dotation, 0) AS dotation,

            (COALESCE(j_immo.total_debit,0) - COALESCE(j_immo.total_credit,0)
            - COALESCE(j_amort.amort_ant,0)
            - COALESCE(j_amort.dotation,0)) AS valeur_nette,

            (COALESCE(j_immo.total_debit,0) - COALESCE(j_immo.total_credit,0)
            - COALESCE(j_amort.amort_ant,0)
            - COALESCE(j_amort.dotation,0)) AS vnc_immo,

            CASE WHEN COALESCE(j_immo.total_debit,0) + COALESCE(j_immo.total_credit,0) > 0 THEN true ELSE false END AS hasmovement

        FROM pc
        LEFT JOIN dossierplancomptables pc_amort
            ON pc_amort.id_compte = pc.id_compte
        AND pc_amort.id_dossier = pc.id_dossier
        AND pc_amort.compte = CONCAT(
                SUBSTRING(pc.compte, 1, 1),
                '8',
                SUBSTRING(pc.compte, 2, CHAR_LENGTH(pc.compte) - 2)
            )
        LEFT JOIN journal_agg j_immo
            ON j_immo.compteaux = pc.compte
        LEFT JOIN journal_agg j_amort
            ON j_amort.compteaux = pc_amort.compte
        ORDER BY pc.compte ASC;

        `;

        const rows = await db.sequelize.query(sql, {
            replacements: { fileId, compteId, exerciceId },
            type: db.Sequelize.QueryTypes.SELECT,
        });
        return res.json({ state: true, list: rows || [] });
    } catch (err) {
        console.error('[IMMO][PCS] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: lignes d'amortissement par immobilisation (details_immo_lignes) ---
exports.listDetailsImmoLignes = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const detailImmoId = Number(req.query?.detailId);

        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const exerciceData = await db.exercices.findByPk(exerciceId);
        if (!exerciceData) {
            return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        }

        const dateDebutExercice = exerciceData.date_debut;
        const dateFinExercice = exerciceData.date_fin;

        await updateMontantImmo(
            compteId,
            fileId,
            exerciceId,
            detailImmoId,
            dateDebutExercice,
            dateFinExercice
        );

        const rows = await db.detailsImmoLignes.findAll({
            where: {
                id_dossier: fileId,
                id_compte: compteId,
                id_exercice: exerciceId,
                id_detail_immo: detailImmoId,
            },
            order: [['id', 'ASC']],
        });

        return res.json({ state: true, list: rows || [] });

    } catch (err) {
        console.error('[IMMO][LIGNES] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: génération écritures comptables (journal Imau) ---
exports.generateImmoEcritures = async (req, res) => {
    console.log('[IMMO][ECRITURES][GENERATE] Fonction appelée avec:', req.body);
    try {
        const fileId = Number(req.body?.fileId);
        const compteId = Number(req.body?.compteId);
        const exerciceId = Number(req.body?.exerciceId);
        const detailedByMonth = Boolean(req.body?.detailedByMonth);

        if (!fileId || !compteId || !exerciceId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        // Le mode détaillé par mois est maintenant implémenté

        const [exo, dossier] = await Promise.all([
            db.exercices.findByPk(exerciceId),
            db.dossiers.findByPk(fileId),
        ]);
        if (!exo) return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        if (!dossier) return res.status(404).json({ state: false, msg: 'Dossier introuvable' });

        const longeurCompte = dossier?.longcomptestd || dossier?.longcompteaux;

        const exoFin = exo.date_fin ? new Date(exo.date_fin) : null;
        if (!exoFin || isNaN(exoFin.getTime())) {
            return res.status(400).json({ state: false, msg: 'date_fin exercice invalide' });
        }

        const toYMD = (d) => {
            const x = new Date(d);
            if (isNaN(x.getTime())) return null;
            return x.toISOString().substring(0, 10);
        };
        const exoFinYMD = toYMD(exoFin);

        // 1) Assurer l'existence du code journal Imau
        let imau = await db.codejournals.findOne({
            where: { id_compte: compteId, id_dossier: fileId, code: 'Imau' },
        });
        if (!imau) {
            imau = await db.codejournals.create({
                id_compte: compteId,
                id_dossier: fileId,
                code: 'Imau',
                libelle: 'amortissement',
                type: 'OD',
            });
        }

        // 2) Suppression des anciennes écritures Imau (sécurité)
        await db.journals.destroy({
            where: {
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId,
                id_journal: imau.id,
            }
        });

        // 3) Charger les immobilisations (details_immo) + lignes amort (details_immo_lignes)
        console.log('[IMMO][DEBUG] Requête details_immo:', {
            where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId }
        });
        console.log('[IMMO][DEBUG] Requête details_immo_lignes:', {
            where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId }
        });

        // ON N'A PLUS BESOIN DE detailsImmoLignes
        const [details, lignes] = await Promise.all([
            // Utiliser SQL avec JOIN pour récupérer le libellé du compte directement
            db.sequelize.query(`
                SELECT 
                    d.*,
                    pc.compte as compte_immo,
                    pc.libelle as libelle_compte_immo
                FROM details_immo d
                LEFT JOIN dossierplancomptables pc ON d.pc_id = pc.id
                WHERE d.id_dossier = :fileId
                  AND d.id_compte = :compteId
                  AND d.id_exercice = :exerciceId
                ORDER BY d.id ASC
            `, {
                replacements: { fileId, compteId, exerciceId },
                type: db.Sequelize.QueryTypes.SELECT,
            }).then(result => {
                console.log('[IMMO][DEBUG] Résultat details_immo avec JOIN:', result);
                if (result && result.length > 0) {
                    console.log('[IMMO][DEBUG] Champs disponibles:', Object.keys(result[0]));
                }
                return result;
            }),
            db.detailsImmoLignes.findAll({
                where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId },
                order: [['id', 'ASC']],
                raw: true,
            }),
        ]);

        console.log('[IMMO][DEBUG] Données chargées:', {
            nbDetails: details?.length || 0,
            nbLignes: lignes?.length || 0,
            detailedByMonth
        });

        const detailsById = new Map((details || []).map(d => [Number(d.id), d]));
        const lignesByDetailId = new Map();
        for (const l of (details || [])) {
            const did = Number(l.id);
            if (!lignesByDetailId.has(did)) lignesByDetailId.set(did, []);
            lignesByDetailId.get(did).push(l);
        }

        console.log('[IMMO][DEBUG] Lignes groupées par détail:',
            Array.from(lignesByDetailId.entries()).map(([id, lignes]) => ({
                detailId: id,
                nbLignes: lignes.length,
                premierMontant: lignes[0]?.dotation_periode_comp
            }))
        );

        // Solution de secours : si pas de détails mais des lignes, créer des détails factices
        if (detailsById.size === 0 && lignesByDetailId.size > 0) {
            console.log('[IMMO][DEBUG] Utilisation de la solution de secours - création de détails factices');

            // Récupérer les IDs des immobilisations depuis les lignes
            const detailImmoIds = Array.from(lignesByDetailId.keys());
            console.log('[IMMO][DEBUG] IDs des immobilisations à récupérer:', detailImmoIds);

            // Charger les immobilisations depuis details_immo (sans filtre exercice, dossier, compte)
            const missingDetails = await db.sequelize.query(`
                SELECT 
                    d.*,
                    pc.compte as compte_immo,
                    pc.libelle as libelle_compte_immo
                FROM details_immo d
                LEFT JOIN dossierplancomptables pc ON d.pc_id = pc.id
                WHERE d.id IN (:detailIds)
                ORDER BY d.id ASC
            `, {
                replacements: { detailIds: detailImmoIds },
                type: db.Sequelize.QueryTypes.SELECT,
            });

            console.log('[IMMO][DEBUG] Requête SQL exécutée (sans filtre dossier/compte):', {
                detailIds: detailImmoIds
            });
            console.log('[IMMO][DEBUG] Immobilisations récupérées:', missingDetails.length);
            if (missingDetails.length > 0) {
                console.log('[IMMO][DEBUG] Première immobilisation:', {
                    id: missingDetails[0].id,
                    id_dossier: missingDetails[0].id_dossier,
                    id_compte: missingDetails[0].id_compte,
                    id_exercice: missingDetails[0].id_exercice,
                    code: missingDetails[0].code,
                    pc_id: missingDetails[0].pc_id,
                    compte_immo: missingDetails[0].compte_immo,
                    libelle_compte_immo: missingDetails[0].libelle_compte_immo
                });
            } else {
                console.log('[IMMO][DEBUG] AUCUNE immobilisation trouvée avec id=29 - elle n\'existe pas dans details_immo');
            }

            // Ajouter les immobilisations récupérées à la map
            for (const detail of missingDetails) {
                detailsById.set(Number(detail.id), detail);
                console.log('[IMMO][DEBUG] Immobilisation ajoutée:', {
                    id: detail.id,
                    code: detail.code,
                    pc_id: detail.pc_id,
                    compte_immo: detail.compte_immo,
                    libelle_compte_immo: detail.libelle_compte_immo
                });
            }

            // Si certaines immobilisations n'ont toujours pas été trouvées, créer des détails factices
            for (const [detailId, lignes] of lignesByDetailId.entries()) {
                if (!detailsById.has(detailId)) {
                    console.log('[IMMO][DEBUG] Immobilisation non trouvée, création factice pour ID:', detailId);
                    const premiereLigne = lignes[0] || {};
                    detailsById.set(detailId, {
                        id: detailId,
                        code: `IMMO${detailId}`,
                        compte_amortissement: premiereLigne.compte_amortissement || '281000',
                        pc_id: null,
                        compte_immo: null,
                        libelle_compte_immo: null,
                        intitule: null,
                    });
                }
            }

            console.log('[IMMO][DEBUG] Détails finaux créés:', detailsById.size);
        }

        // 4) Helpers plan comptable
        const ensureCompte = async (compteNum, libelle) => {
            const compte = String(compteNum || '').trim();
            if (!compte) return null;
            const compteFormatted = compte.toString().padEnd(longeurCompte, "0").slice(0, longeurCompte)

            let row = await db.dossierplancomptable.findOne({
                where: { id_compte: compteId, id_dossier: fileId, compte: compteFormatted },
            });
            if (!row) {
                // Créer le compte avec le libellé fourni
                row = await db.dossierplancomptable.create({
                    id_compte: compteId,
                    id_dossier: fileId,
                    compte: compteFormatted,
                    libelle: libelle || `Compte ${compteFormatted}`,
                    nature: 'General',
                    typetier: 'general',
                    baseaux: compteFormatted,
                    pays: 'Madagascar',
                });
                await db.sequelize.query(
                    `UPDATE dossierplancomptables SET baseaux_id = id WHERE id = :id`,
                    { replacements: { id: row.id }, type: db.Sequelize.QueryTypes.UPDATE }
                );
                console.log(`[IMMO][ECRITURES][GENERATE] Compte créé: ${compteFormatted} - ${libelle}`);
            } else if (libelle && (!row.libelle || row.libelle.trim() === '' || row.libelle === `Compte ${compteFormatted}`)) {
                // Mettre à jour le libellé si le compte existe mais n'a pas de libellé ou a un libellé générique
                await db.dossierplancomptable.update(
                    { libelle: libelle },
                    { where: { id: row.id } }
                );
                row.libelle = libelle; // Mettre à jour l'objet local
                console.log(`[IMMO][ECRITURES][GENERATE] Libellé du compte mis à jour: ${compteFormatted} - ${libelle}`);
            }
            return row;
        };

        await Promise.all([
            ensureCompte('68111', 'Dotations amort. immobilisations incorporelles'),
            ensureCompte('68112', 'Dotations amort. immobilisations corporelles'),
            ensureCompte('68113', 'Dotations amort. immobilisations financières'),
        ]);

        // 5) Créer écritures selon le mode
        const inserted = [];
        let createdEcritures = 0;
        let createdLignes = 0;

        // Variables communes pour les calculs
        const baseJours = Number(dossier.immo_amort_base_jours) || 360;

        if (detailedByMonth) {
            // Mode détaillé par mois : une écriture par mois par immobilisation avec proratisation
            for (const [detailId, detail] of detailsById.entries()) {
                const compteAmort = String(detail?.compte_amortissement || '').trim();
                if (!compteAmort) continue;

                // Récupérer les données de l'immobilisation
                const montantHT = Number(detail?.montant_ht || detail?.montant) || 0;
                const dotation = Number(detail?.dotation_periode_comp) || 0;
                const dureeMois = Number(detail?.duree_amort_mois) || 0;
                const dateMiseService = detail?.date_mise_service ? new Date(detail.date_mise_service) : null;

                console.log('[IMMO][DEBUG][MONTHLY] Données immobilisation:', {
                    detailId,
                    montantHT,
                    dureeMois,
                    dateMiseService: dateMiseService?.toISOString(),
                    compteAmort
                });

                if (!dateMiseService || isNaN(dateMiseService.getTime()) || dotation <= 0 || dureeMois <= 0) {
                    console.log('[IMMO][DEBUG][MONTHLY] Immobilisation ignorée:', {
                        detailId,
                        raison: !dateMiseService ? 'pas de date' : isNaN(dateMiseService.getTime()) ? 'date invalide' : dotation <= 0 ? 'montant invalide' : 'durée invalide'
                    });
                    continue;
                }

                // Détermination compte 681xx selon compte_amortissement
                let compteCharge = null;
                if (compteAmort.startsWith('280')) compteCharge = '68111';
                else if (compteAmort.startsWith('281')) compteCharge = '68112';
                else if (compteAmort.startsWith('286')) compteCharge = '68113';
                else if (compteAmort.startsWith('28')) compteCharge = '68112';
                else compteCharge = '68112';

                const [rowCharge, rowAmort] = await Promise.all([
                    ensureCompte(compteCharge, 'Dotations amort. immobilisations corporelles'),
                    ensureCompte(compteAmort, `Amortissement ${detail?.intitule || detail?.code || compteAmort}`),
                ]);
                if (!rowCharge || !rowAmort) continue;

                const libelleCompteImmo = detail?.libelle_compte_immo || detail?.intitule || detail?.code || '';

                // Calculer la dotation mensuelle et journalière
                const dotationMensuelle = dotation / dureeMois;
                const dotationJournaliere = baseJours === 360 ? (dotationMensuelle / 30) : (dotationMensuelle / 30.4167); // Moyenne pour 365j

                // Calculer les écritures mois par mois
                let currentDate = new Date(dateMiseService);
                let cumulAmort = 0;
                let monthIndex = 0;

                const finAmort = new Date(dateMiseService);
                finAmort.setMonth(finAmort.getMonth() + dureeMois);

                while (
                    cumulAmort < dotation &&
                    monthIndex < dureeMois &&
                    currentDate < exoFin
                ) {
                    let dateFinMois = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        0
                    );

                    if (dateFinMois > exoFin) dateFinMois = new Date(exoFin);
                    if (dateFinMois > finAmort) dateFinMois = new Date(finAmort);

                    let montantDotation = dotation;

                    // Ajustement du dernier mois pour ne pas dépasser le montant total
                    // if (cumulAmort + montantDotation > montantHT) {
                    //     montantDotation = Math.round((montantHT - cumulAmort) * 100) / 100;
                    // }

                    if (montantDotation > 0) {
                        const idEcriture = String(Date.now() + Math.floor(Math.random() * 1000));
                        const libelle = `Dot amort ${libelleCompteImmo}`.trim();

                        const common = {
                            id_compte: compteId,
                            id_dossier: fileId,
                            id_exercice: exerciceId,
                            id_ecriture: idEcriture,
                            datesaisie: new Date(),
                            dateecriture: dateFinMois,
                            id_journal: imau.id,
                            piece: null,
                            piecedate: null,
                            libelle: libelle || 'Dot amort',
                            devise: 'MGA',
                            id_immob: detailId,
                        };

                        // CHARGE
                        const dossier_pc_charge = await dossierplancomptable.findByPk(rowCharge.id);

                        if (!dossier_pc_charge) throw new Error("Compte introuvable");

                        const libelleAuxCharge = dossier_pc_charge.libelle;
                        const compteAuxCharge = dossier_pc_charge.compte;

                        let libelleGenCharge = '';
                        let compteGenCharge = '';
                        let id_numcptcentralise_charge = null;

                        if (dossier_pc_charge.baseaux_id) {
                            const cpt = await dossierplancomptable.findByPk(dossier_pc_charge.baseaux_id);
                            libelleGenCharge = cpt?.libelle || '';
                            compteGenCharge = cpt?.compte || '';
                            id_numcptcentralise_charge = cpt?.id || null;
                        }

                        // AMORT
                        const dossier_pc_amort = await dossierplancomptable.findByPk(rowAmort.id);

                        if (!dossier_pc_amort) throw new Error("Compte introuvable");

                        const libelleAuxAmort = dossier_pc_amort.libelle;
                        const compteAuxAmort = dossier_pc_amort.compte;

                        let libelleGenAmort = '';
                        let compteGenAmort = '';
                        let id_numcptcentralise_amort = null;

                        if (dossier_pc_amort.baseaux_id) {
                            const cpt = await dossierplancomptable.findByPk(dossier_pc_amort.baseaux_id);
                            libelleGenAmort = cpt?.libelle || '';
                            compteGenAmort = cpt?.compte || '';
                            id_numcptcentralise_amort = cpt?.id || null;
                        }

                        const [lDebit, lCredit] = await Promise.all([
                            db.journals.create({
                                ...common,
                                id_numcpt: rowCharge.id,
                                id_numcptcentralise: id_numcptcentralise_charge,
                                debit: montantDotation,
                                credit: 0,
                                comptegen: compteGenCharge,
                                compteaux: compteAuxCharge,
                                libellecompte: libelleGenCharge,
                                libelleaux: libelleAuxCharge
                            }),

                            db.journals.create({
                                ...common,
                                id_numcpt: rowAmort.id,
                                id_numcptcentralise: id_numcptcentralise_amort,
                                debit: 0,
                                credit: montantDotation,
                                comptegen: compteGenAmort,
                                compteaux: compteAuxAmort,
                                libellecompte: libelleGenAmort,
                                libelleaux: libelleAuxAmort
                            })
                        ]);

                        inserted.push(lDebit, lCredit);
                        createdEcritures += 1;
                        createdLignes += 2;

                        cumulAmort += montantDotation;
                    }

                    currentDate.setMonth(currentDate.getMonth() + 1);
                    currentDate.setDate(1);
                    monthIndex++;
                }

                console.log('[IMMO][DEBUG][MONTHLY] Fin boucle:', {
                    detailId,
                    cumulAmort,
                    monthIndex,
                    currentDate: currentDate.toISOString(),
                    createdEcritures
                });
            }
        } else {
            // Mode simple : une écriture par compte classe 2
            const groupedByCompte = new Map();

            for (const [detailId, schedule] of lignesByDetailId.entries()) {
                const detail = detailsById.get(detailId);
                if (!detail) continue;

                // 🔹 Utiliser uniquement les dotations sauvegardées
                const montant = schedule.reduce((sum, ligne) => {
                    return sum + (Number(ligne.dotation_periode_comp) || 0);
                }, 0);

                if (montant <= 0) continue;

                const compteAmort = String(detail?.compte_amortissement || '').trim();
                const compteImmo = String(detail?.compte_immo || '').trim();
                const libelleCompteImmo =
                    detail?.libelle_compte_immo ||
                    detail?.intitule ||
                    detail?.code ||
                    '';

                if (!compteAmort || !compteImmo) continue;

                const groupKey = `${compteImmo}|${compteAmort}`;

                if (!groupedByCompte.has(groupKey)) {
                    groupedByCompte.set(groupKey, {
                        immo_id: detailId,
                        compteImmo,
                        compteAmort,
                        libelleCompteImmo,
                        montantTotal: 0,
                    });
                }

                groupedByCompte.get(groupKey).montantTotal += montant;
            }

            // 🔹 Création des écritures
            for (const [, group] of groupedByCompte.entries()) {
                const {
                    immo_id,
                    compteImmo,
                    compteAmort,
                    libelleCompteImmo,
                    montantTotal,
                } = group;

                if (montantTotal <= 0) continue;

                // Détermination du compte de charge
                let compteCharge = '68112';
                if (compteAmort.startsWith('280')) compteCharge = '68111';
                else if (compteAmort.startsWith('286')) compteCharge = '68113';

                const [rowCharge, rowAmort] = await Promise.all([
                    ensureCompte(
                        compteCharge,
                        'Dotations amort. immobilisations corporelles'
                    ),
                    ensureCompte(
                        compteAmort,
                        `Amortissement ${libelleCompteImmo}`
                    ),
                ]);

                if (!rowCharge || !rowAmort) continue;

                const idEcriture = String(Date.now() + Math.floor(Math.random() * 1000));
                const libelle = `Dot amort ${libelleCompteImmo}`.trim();

                const common = {
                    id_compte: compteId,
                    id_dossier: fileId,
                    id_exercice: exerciceId,
                    id_ecriture: idEcriture,
                    datesaisie: new Date(),
                    dateecriture: exoFin,
                    id_journal: imau.id,
                    piece: null,
                    piecedate: null,
                    libelle: libelle || 'Dot amort',
                    devise: 'MGA',
                    id_immob: immo_id,
                };

                // CHARGE
                const dossier_pc_charge = await dossierplancomptable.findByPk(rowCharge.id);

                if (!dossier_pc_charge) throw new Error("Compte introuvable");

                const libelleAuxCharge = dossier_pc_charge.libelle;
                const compteAuxCharge = dossier_pc_charge.compte;

                let libelleGenCharge = '';
                let compteGenCharge = '';
                let id_numcptcentralise_charge = null;

                if (dossier_pc_charge.baseaux_id) {
                    const cpt = await dossierplancomptable.findByPk(dossier_pc_charge.baseaux_id);
                    libelleGenCharge = cpt?.libelle || '';
                    compteGenCharge = cpt?.compte || '';
                    id_numcptcentralise_charge = cpt?.id || null;
                }

                // AMORT
                const dossier_pc_amort = await dossierplancomptable.findByPk(rowAmort.id);

                if (!dossier_pc_amort) throw new Error("Compte introuvable");

                const libelleAuxAmort = dossier_pc_amort.libelle;
                const compteAuxAmort = dossier_pc_amort.compte;

                let libelleGenAmort = '';
                let compteGenAmort = '';
                let id_numcptcentralise_amort = null;

                if (dossier_pc_amort.baseaux_id) {
                    const cpt = await dossierplancomptable.findByPk(dossier_pc_amort.baseaux_id);
                    libelleGenAmort = cpt?.libelle || '';
                    compteGenAmort = cpt?.compte || '';
                    id_numcptcentralise_amort = cpt?.id || null;
                }


                const [lDebit, lCredit] = await Promise.all([
                    db.journals.create({
                        ...common,
                        id_numcpt: rowCharge.id,
                        id_numcptcentralise: id_numcptcentralise_charge,
                        debit: montantTotal,
                        credit: 0,
                        comptegen: compteGenCharge,
                        compteaux: compteAuxCharge,
                        libellecompte: libelleGenCharge,
                        libelleaux: libelleAuxCharge
                    }),
                    db.journals.create({
                        ...common,
                        id_numcpt: rowAmort.id,
                        debit: 0,
                        credit: montantTotal,
                        comptegen: compteGenAmort,
                        compteaux: compteAuxAmort,
                        libellecompte: libelleGenAmort,
                        libelleaux: libelleAuxAmort,
                        id_numcptcentralise: id_numcptcentralise_amort
                    }),
                ]);

                inserted.push(lDebit, lCredit);
                createdEcritures += 1;
                createdLignes += 2;
            }
        }

        return res.json({
            state: true,
            msg: 'Écritures générées',
            created_ecritures: createdEcritures,
            created_lignes: createdLignes,
        });
    } catch (err) {
        console.error('[IMMO][ECRITURES][GENERATE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: annulation écritures comptables (journal Imau) ---
exports.cancelImmoEcritures = async (req, res) => {
    try {
        const fileId = Number(req.body?.fileId);
        const compteId = Number(req.body?.compteId);
        const exerciceId = Number(req.body?.exerciceId);

        if (!fileId || !compteId || !exerciceId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const imau = await db.codejournals.findOne({
            where: { id_compte: compteId, id_dossier: fileId, code: 'Imau' },
        });

        if (!imau) {
            return res.json({ state: true, msg: 'Aucune écriture à supprimer', deleted_lignes: 0 });
        }

        const deleted = await db.journals.destroy({
            where: {
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId,
                id_journal: imau.id,
            }
        });

        return res.json({ state: true, msg: 'Écritures supprimées', deleted_lignes: Number(deleted) || 0 });
    } catch (err) {
        console.error('[IMMO][ECRITURES][CANCEL] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: aperçu calcul amortissement linéaire (sans sauvegarde) ---

exports.previewImmoLineaire = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const detailImmoId = Number(req.query?.detailId);

        const previewLin = await previewImmoLineaireMiddleware(fileId, compteId, exerciceId, detailImmoId);

        return res.json({
            state: true,
            previewLin
        });

    } catch (err) {
        console.error('[IMMO][LINEAIRE][PREVIEW] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: aperçu calcul amortissement degressif (sans sauvegarde) ---
exports.previewImmoDegressif = async (req, res) => {
    try {
        // 1. Récupération des paramètres depuis la requête
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const detailImmoId = Number(req.query?.detailId);

        const previewDeg = await previewImmoDegressifMiddleware(fileId, compteId, exerciceId, detailImmoId);

        return res.json({
            state: true,
            previewDeg
        });

    } catch (err) {
        console.error('[IMMO][DEGRESSIF][PREVIEW] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: sauvegarde des lignes pré-calculées depuis preview ---
exports.saveImmoLineaire = async (req, res) => {
    try {
        const fileId = Number(req.body?.fileId ?? req.query?.fileId);
        const compteId = Number(req.body?.compteId ?? req.query?.compteId);
        const exerciceId = Number(req.body?.exerciceId ?? req.query?.exerciceId);
        const detailImmoId = Number(req.body?.detailId ?? req.query?.detailId);

        // Récupérer les lignes pré-calculées depuis le frontend
        const { lignes } = req.body || {};

        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        if (!lignes || !Array.isArray(lignes)) {
            return res.status(400).json({ state: false, msg: 'Lignes calculées manquantes - utilisez d\'abord previewImmoLineaire' });
        }

        const exerciceData = await db.exercices.findByPk(exerciceId);
        if (!exerciceData) {
            return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        }

        const dateDebutExercice = exerciceData.date_debut;
        const dateFinExercice = exerciceData.date_fin;

        // Préparer les lignes pour l'insertion (utiliser les lignes pré-calculées)
        const out = lignes.map((ligne) => ({
            id_dossier: fileId,
            id_compte: compteId,
            id_exercice: exerciceId,
            id_detail_immo: detailImmoId,
            rang: ligne.rang,
            date_mise_service: ligne.date_mise_service,
            date_fin_exercice: ligne.date_fin_exercice,
            annee_nombre: ligne.annee_nombre,
            montant_immo_ht: ligne.montant_immo_ht,
            vnc: ligne.vnc,
            amort_ant_comp: ligne.amort_ant_comp,
            dotation_periode_comp: ligne.dotation_periode_comp,
            cumul_amort_comp: ligne.cumul_amort_comp,
            amort_ant_fisc: ligne.amort_ant_fisc,
            dotation_periode_fisc: ligne.dotation_periode_fisc,
            cumul_amort_fisc: ligne.cumul_amort_fisc,
            dot_derogatoire: ligne.dot_derogatoire || 0,
        }));

        await db.detailsImmoLignes.destroy({
            where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, id_detail_immo: detailImmoId },
        });
        if (out.length > 0) await db.detailsImmoLignes.bulkCreate(out);


        await updateMontantImmo(
            compteId,
            fileId,
            exerciceId,
            detailImmoId,
            dateDebutExercice,
            dateFinExercice
        );

        return res.json({ state: true, saved: out.length });
    } catch (err) {
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

// --- Immobilisations: sauvegarde des lignes dégressives pré-calculées depuis preview ---
exports.saveImmoDegressif = async (req, res) => {
    try {
        const fileId = Number(req.body?.fileId ?? req.query?.fileId);
        const compteId = Number(req.body?.compteId ?? req.query?.compteId);
        const exerciceId = Number(req.body?.exerciceId ?? req.query?.exerciceId);
        const detailImmoId = Number(req.body?.detailId ?? req.query?.detailId);

        // Récupérer les lignes pré-calculées depuis le frontend
        const { lignes } = req.body || {};

        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        if (!lignes || !Array.isArray(lignes)) {
            // Fallback : essayer de traiter comme un amortissement linéaire
            try {
                // Charger les données nécessaires pour le calcul linéaire
                const [dossier, exo, detail] = await Promise.all([
                    db.dossiers.findByPk(fileId),
                    db.exercices.findByPk(exerciceId),
                    db.detailsimmo.findByPk(detailImmoId),
                ]);

                if (!dossier || !exo || !detail) {
                    return res.status(404).json({ state: false, msg: 'Données introuvables' });
                }

                // Calcul linéaire simple
                const baseJours = Number(dossier.immo_amort_base_jours) || 360;
                const montantHT = Number(detail.montant_ht) || Number(detail.montant) || 0;
                const dateMiseService = detail.date_mise_service ? new Date(detail.date_mise_service) : null;
                const exoFin = exo.date_fin ? new Date(exo.date_fin) : null;
                const dureeComp = Math.max(1, Math.floor(Number(detail.duree_amort_mois) || 0));

                if (montantHT <= 0) {
                    return res.status(400).json({ state: false, msg: 'montant HT invalide' });
                }

                const dotMensComp = montantHT / dureeComp;
                const dotAnnComp = dotMensComp * 12;

                const out = [];
                let debut = new Date(dateMiseService);
                let index = 1;
                let cumulComp = 0;
                let vncComp = montantHT;

                while (vncComp > 0 && index <= 50) {
                    const fin = index === 1 ? (exoFin || new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate() - 1)) : new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate() - 1);
                    const nbJours = Math.floor((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
                    const anneeNombre = nbJours / baseJours;
                    const dotComp = Math.min(vncComp, Math.round(dotAnnComp * anneeNombre * 100) / 100);

                    cumulComp += dotComp;
                    vncComp = montantHT - cumulComp;

                    out.push({
                        id_dossier: fileId,
                        id_compte: compteId,
                        id_exercice: exerciceId,
                        id_detail_immo: detailImmoId,
                        rang: index,
                        date_mise_service: debut.toISOString().substring(0, 10),
                        date_fin_exercice: fin.toISOString().substring(0, 10),
                        annee_nombre: Math.round(anneeNombre * 100) / 100,
                        montant_immo_ht: montantHT,
                        vnc: Math.max(0, vncComp),
                        amort_ant_comp: Math.round((cumulComp - dotComp) * 100) / 100,
                        dotation_periode_comp: dotComp,
                        cumul_amort_comp: cumulComp,
                        amort_ant_fisc: 0,
                        dotation_periode_fisc: 0,
                        cumul_amort_fisc: 0,
                        dot_derogatoire: 0,
                    });

                    debut = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
                    index++;
                }

                await db.detailsImmoLignes.destroy({
                    where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, id_detail_immo: detailImmoId },
                });
                if (out.length > 0) await db.detailsImmoLignes.bulkCreate(out);

                return res.json({ state: true, saved: out.length, fallback: 'linear' });

            } catch (fallbackError) {
                return res.status(400).json({
                    state: false,
                    msg: 'Lignes calculées manquantes - utilisez d\'abord previewImmoDegressif ou corrigez le frontend pour utiliser saveImmoLineaire'
                });
            }
        }

        // Préparer les lignes pour l'insertion (utiliser les lignes pré-calculées)
        const out = lignes.map((ligne) => ({
            id_dossier: fileId,
            id_compte: compteId,
            id_exercice: exerciceId,
            id_detail_immo: detailImmoId,
            rang: ligne.rang,
            date_mise_service: ligne.date_mise_service,
            date_fin_exercice: ligne.date_fin_exercice,
            annee_nombre: ligne.annee_nombre,
            montant_immo_ht: ligne.montant_immo_ht,
            vnc: ligne.vnc,
            amort_ant_comp: ligne.amort_ant_comp,
            dotation_periode_comp: ligne.dotation_periode_comp,
            cumul_amort_comp: ligne.cumul_amort_comp,
            amort_ant_fisc: ligne.amort_ant_fisc,
            dotation_periode_fisc: ligne.dotation_periode_fisc,
            cumul_amort_fisc: ligne.cumul_amort_fisc,
            dot_derogatoire: ligne.dot_derogatoire || 0,
        }));
        await db.detailsImmoLignes.destroy({
            where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, id_detail_immo: detailImmoId },
        });
        if (out.length > 0) await db.detailsImmoLignes.bulkCreate(out);

        await updateMontantImmo(compteId, fileId, exerciceId, detailImmoId);

        return res.json({ state: true, saved: out.length });
    } catch (err) {
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

exports.getAllDevises = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' })
        }
        const devisesData = await devises.findAll({ where: { compte_id: id } });
        if (!devisesData) {
            return res.status(404).json({ state: false, message: 'Devise non trouvé' })
        }
        return res.status(200).json({ state: true, list: devisesData });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err });
    }
};

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const getDateSaisieNow = (id) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${dd}${mm}${yyyy}${hh}${min}${ss}${id}`;
};

exports.modificationJournal = async (req, res) => {
    try {
        const jsonData = JSON.parse(req.body.data);
        const file = req.file;
        const conserverFichier = jsonData.conserverFichier === true;

        if (!jsonData) {
            return res.status(400).json({ message: "Données ou fichier manquant" });
        }

        const id_compte = Number(jsonData.id_compte);
        const id_dossier = Number(jsonData.id_dossier);
        const id_exercice = Number(jsonData.id_exercice);
        const id_journal = Number(jsonData.valSelectCodeJnl);
        const id_devise = Number(jsonData.id_devise);

        const codeJournal = await codejournals.findByPk(id_journal);
        if (!codeJournal) {
            return res.status(404).json({ message: "Code journal introuvable" });
        }

        const typeCodeJournal = codeJournal.type;
        const mois = jsonData.valSelectMois;
        const annee = jsonData.valSelectAnnee;
        const currency = jsonData.currency;
        const devise = jsonData.choixDevise === 'MGA' ? jsonData.choixDevise : currency;
        const tableRows = jsonData.tableRows;
        const listCa = jsonData.listCa;
        const taux = jsonData.taux;
        const deletedIds = jsonData.deletedIds || [];
        const num_facture = jsonData.num_facture;

        let fichierCheminRelatif = null;

        if (file) {
            const dossierRelatif = path.join(
                "public",
                "ScanEcriture",
                id_compte.toString(),
                id_dossier.toString(),
                id_exercice.toString(),
                typeCodeJournal
            );

            const dossierAbsolu = path.resolve(dossierRelatif);
            fs.mkdirSync(dossierAbsolu, { recursive: true });

            const nomFichier = `journal_${Date.now()}${path.extname(file.originalname)}`;
            const cheminComplet = path.join(dossierAbsolu, nomFichier);

            fs.renameSync(file.path, cheminComplet);

            fichierCheminRelatif = path.join(dossierRelatif, nomFichier).replace(/\\/g, '/');
        }

        let ajout = 0;
        let modification = 0;

        let idEcritureCommun = null;
        for (const row of tableRows) {
            if (row.id && Number(row.id) > 0) {
                const journalExistant = await journals.findByPk(row.id);
                idEcritureCommun = journalExistant.id_ecriture;
                break;
            }
        }

        for (const row of tableRows) {
            const dossierPc = await dossierplancomptable.findByPk(row.compte);
            const libellecompte = dossierPc?.libelle;
            const compteaux = dossierPc?.compte;
            const comptebaseaux = dossierPc?.baseaux_id;

            let id_numcptcentralise = null;
            let libelleaux = '';
            let comptegen = null;
            if (comptebaseaux) {
                const cpt = await dossierplancomptable.findByPk(comptebaseaux);
                id_numcptcentralise = cpt?.id || null;
                comptegen = cpt?.compte;
                libelleaux = cpt?.libelle;
            }

            const dateecriture = new Date(
                annee,
                mois - 1,
                row.jour + 1
            );

            if (!isValidDate(dateecriture)) {
                throw new Error(`Date invalide pour la ligne ${JSON.stringify(row)}`);
            }

            const journalData = {
                id_temporaire: row.id,
                id_compte,
                id_dossier,
                id_exercice,
                id_numcpt: row.compte,
                id_journal,
                id_devise,
                num_facture,
                taux,
                devise,
                modifierpar: id_compte,
                debit: row.debit === "" ? 0 : row.debit,
                credit: row.credit === "" ? 0 : row.credit,
                num_facture: row.num_facture,
                montant_devise: row.montant_devise || 0,
                dateecriture: dateecriture,
                datesaisie: new Date(),
                id_numcptcentralise,
                libelle: row.libelle || '',
                piece: row.piece || '',
                piecedate: row.piecedate || null,
                id_ecriture: idEcritureCommun,
                fichier: null,
                comptegen: comptegen,
                compteaux: compteaux,
                libellecompte: libellecompte,
                libelleaux: libelleaux
            };

            const journalExistant = await journals.findByPk(row.id);
            if (row.id && Number(row.id) > 0) {
                if (!journalExistant) continue;

                if (file) {
                    if (journalExistant.fichier) {
                        const ancienChemin = path.resolve(process.cwd(), journalExistant.fichier);
                        if (fs.existsSync(ancienChemin)) fs.unlinkSync(ancienChemin);
                    }
                    journalData.fichier = fichierCheminRelatif;

                } else if (conserverFichier && journalExistant.fichier) {
                    journalData.fichier = journalExistant.fichier;

                } else if (!conserverFichier && journalExistant.fichier) {
                    const ancienChemin = path.resolve(process.cwd(), journalExistant.fichier);
                    if (fs.existsSync(ancienChemin)) fs.unlinkSync(ancienChemin);
                    journalData.fichier = null;

                } else {
                    journalData.fichier = null;
                }

                await journals.update(journalData, { where: { id: row.id } });
                modification++;

                const relevantCa = listCa?.filter(item => item.id_ligne_ecriture === row.id) || [];

                for (const item of relevantCa) {
                    const whereClause = {
                        id_ligne_ecriture: row.id,
                        id_axe: item.id_axe,
                        id_section: item.id_section
                    };

                    const [affectedRows] = await analytiques.update(
                        {
                            debit: item.debit || 0,
                            credit: item.credit || 0,
                            pourcentage: item.pourcentage || 0
                        },
                        { where: whereClause }
                    );

                    if (affectedRows === 0) {
                        await analytiques.create({
                            id_compte,
                            id_dossier,
                            id_exercice,
                            ...whereClause,
                            debit: item.debit || 0,
                            credit: item.credit || 0,
                            pourcentage: item.pourcentage || 0
                        });
                    }
                }
            }
            else {
                journalData.fichier = fichierCheminRelatif || null;

                const createdJournal = await journals.create(journalData);

                const journalId = createdJournal.id;

                const relevantCa = listCa?.filter(item => item.id_ligne_ecriture === row.id_temporaire) || [];

                if (relevantCa.length > 0) {
                    const listCaRows = relevantCa.map(item => ({
                        id_compte,
                        id_dossier,
                        id_exercice,
                        id_ligne_ecriture: journalId,
                        id_axe: item.id_axe,
                        id_section: item.id_section,
                        debit: item.debit || 0,
                        credit: item.credit || 0,
                        pourcentage: item.pourcentage || 0

                    }));

                    await analytiques.bulkCreate(listCaRows);
                }
                ajout++;
            }
        }

        if (deletedIds.length > 0) {
            await journals.destroy({ where: { id: deletedIds } });
        }

        return res.json({
            message: `${modification} ${pluralize(modification, 'ligne')} ${pluralize(modification, 'modifiée')}, ${ajout} ${pluralize(ajout, 'ajoutée')}, ${deletedIds.length} ${pluralize(deletedIds.length, 'supprimée')}`,
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ state: false, message: error.message });
    }
};

exports.getJournal = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;

        if (!id_dossier) return res.status(400).json({ state: false, message: 'Dossier non trouvé' });
        if (!id_exercice) return res.status(400).json({ state: false, message: 'Exercice non trouvé' });
        if (!id_compte) return res.status(400).json({ state: false, message: 'Compte non trouvé' });

        const query = `
            WITH last_ecritures AS (
                SELECT id_ecriture
                FROM journals
                WHERE id_compte = :id_compte
                AND id_dossier = :id_dossier
                AND id_exercice = :id_exercice
                GROUP BY id_ecriture
                ORDER BY MAX(id) DESC
                LIMIT 100
            )

            SELECT
                j.*,
                cj.type AS journal,
                d.dossier
            FROM journals j
            LEFT JOIN codejournals cj ON cj.id = j.id_journal
            LEFT JOIN dossiers d ON d.id = j.id_dossier
            WHERE
                j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND j.id_ecriture IN (SELECT id_ecriture FROM last_ecritures)
            ORDER BY
                CASE 
                    WHEN cj.type = 'RAN' THEN 0
                    ELSE 1
                END,
                j."createdAt" DESC
        `;

        const journalData = await db.sequelize.query(query, {
            replacements: { id_compte, id_dossier, id_exercice },
            type: db.Sequelize.QueryTypes.SELECT
        });

        return res.json(journalData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

exports.getAllJournal = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;

        if (!id_dossier) return res.status(400).json({ state: false, message: 'Dossier non trouvé' });
        if (!id_exercice) return res.status(400).json({ state: false, message: 'Exercice non trouvé' });
        if (!id_compte) return res.status(400).json({ state: false, message: 'Compte non trouvé' });

        const query = `
            WITH base_dossier AS (
                SELECT
                    d.id AS id_dossier,
                    d.consolidation,
                    e.date_debut,
                    e.date_fin
                FROM dossiers d
                JOIN exercices e ON e.id = :id_exercice
                WHERE 
                    d.id = :id_dossier
            ),
            dossiers_utiles AS (
                SELECT :id_dossier::int AS id_dossier
                UNION
                SELECT cd.id_dossier_autre
                FROM consolidationdossiers cd
                JOIN 
                    base_dossier bd ON bd.consolidation = true
                WHERE
                    cd.id_dossier = :id_dossier
                    AND cd.id_compte = :id_compte
            ),
            exercices_utiles AS (
                SELECT e.id
                FROM exercices e
                JOIN base_dossier bd ON true
                WHERE 
                    e.id_compte = :id_compte
                    AND e.id_dossier IN (SELECT id_dossier FROM dossiers_utiles)
                    AND e.date_debut <= bd.date_fin
                    AND e.date_fin >= bd.date_debut
            )
            SELECT
                j.*,
                cj.type AS journal,
                d.dossier AS dossier
            FROM journals j
            JOIN dossiers d ON d.id = j.id_dossier
            JOIN codejournals cj ON cj.id = j.id_journal
            WHERE 
                j.id_compte = :id_compte
                AND j.id_dossier IN (SELECT id_dossier FROM dossiers_utiles)
                AND j.id_exercice IN (SELECT id FROM exercices_utiles)
            ORDER BY 
                CASE 
                    WHEN cj.type = 'RAN' THEN 0
                    ELSE 1
                END,
                j.id_ecriture ASC
            `;

        const result = await db.sequelize.query(query, {
            replacements: {
                id_compte,
                id_dossier,
                id_exercice
            },
            type: db.Sequelize.QueryTypes.SELECT
        });

        return res.json(result);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            state: false,
            msg: 'Erreur serveur',
            error: error.message
        });
    }
};

exports.getJournalFiltered = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, journal, compte, piece, libelle, debut, fin } = req.body;

        if (!id_dossier) return res.status(400).json({ state: false, message: 'Dossier non trouvé' });
        if (!id_exercice) return res.status(400).json({ state: false, message: 'Exercice non trouvé' });
        if (!id_compte) return res.status(400).json({ state: false, message: 'Compte non trouvé' });

        const query = `
            WITH base_dossier AS (
                SELECT
                    d.id AS id_dossier,
                    d.consolidation,
                    e.date_debut,
                    e.date_fin
                FROM dossiers d
                JOIN exercices e ON e.id = :id_exercice
                WHERE d.id = :id_dossier
            ),

            dossiers_utiles AS (
                SELECT :id_dossier::int AS id_dossier
                UNION
                SELECT cd.id_dossier_autre
                FROM consolidationdossiers cd
                JOIN base_dossier bd ON bd.consolidation = true
                WHERE cd.id_dossier = :id_dossier
                AND cd.id_compte = :id_compte
            ),

            exercices_utiles AS (
                SELECT e.id
                FROM exercices e
                JOIN base_dossier bd ON true
                WHERE e.id_compte = :id_compte
                AND e.id_dossier IN (SELECT id_dossier FROM dossiers_utiles)
                AND e.date_debut <= bd.date_fin
                AND e.date_fin >= bd.date_debut
            ),

            journals_filtres AS (
                SELECT DISTINCT j.id_ecriture
                FROM journals j
                JOIN codejournals cj ON cj.id = j.id_journal
                JOIN base_dossier bd ON true
                WHERE j.id_compte = :id_compte
                AND j.id_dossier IN (SELECT id_dossier FROM dossiers_utiles)
                AND j.id_exercice IN (SELECT id FROM exercices_utiles)

                AND (:piece IS NULL OR j.piece ILIKE '%' || :piece || '%')
                AND (:libelle IS NULL OR j.libelle ILIKE '%' || :libelle || '%')
                AND (:compteaux IS NULL OR j.compteaux = :compteaux)
                AND (:journal IS NULL OR cj.code = :journal)

                AND (
                        (:debut IS NOT NULL AND :fin IS NOT NULL AND j.dateecriture BETWEEN :debut AND :fin)
                    OR (:debut IS NOT NULL AND :fin IS NULL AND j.dateecriture >= :debut)
                    OR (:debut IS NULL AND :fin IS NOT NULL AND j.dateecriture <= :fin)
                    OR (
                            :debut IS NULL AND :fin IS NULL
                            AND bd.consolidation = true
                            AND j.dateecriture BETWEEN bd.date_debut AND bd.date_fin
                        )
                    OR (:debut IS NULL AND :fin IS NULL AND bd.consolidation = false)
                )
            )
            SELECT
                j.*,
                cj.type AS journal,
                d.dossier
            FROM journals j
            JOIN journals_filtres jf ON jf.id_ecriture = j.id_ecriture
            JOIN codejournals cj ON cj.id = j.id_journal
            JOIN dossiers d ON d.id = j.id_dossier
            WHERE j.id_compte = :id_compte
            AND j.id_dossier IN (SELECT id_dossier FROM dossiers_utiles)
            AND j.id_exercice IN (SELECT id FROM exercices_utiles)
            ORDER BY j."createdAt" DESC
        `;

        const result = await db.sequelize.query(query, {
            replacements: {
                id_compte,
                id_dossier,
                id_exercice,
                journal: journal?.code || null,
                compteaux: compte?.compte || null,
                piece: piece || null,
                libelle: libelle || null,
                debut: debut || null,
                fin: fin || null
            },
            type: db.Sequelize.QueryTypes.SELECT
        });

        return res.json({ state: true, list: result });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
    }
};

function nextLettrage(current) {
    if (!current) return 'A';

    const chars = current.toUpperCase().split('');
    let i = chars.length - 1;

    while (i >= 0) {
        if (chars[i] !== 'Z') {
            chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
            for (let j = i + 1; j < chars.length; j++) {
                chars[j] = 'A';
            }
            return chars.join('');
        }
        i--;
    }
    return 'A'.repeat(current.length + 1);
}

exports.addLettrage = async (req, res) => {
    try {
        const { data, id_compte, id_dossier, id_exercice } = req.body;

        if (!data || !Array.isArray(data) || data.length === 0 || !id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Données manquantes ou invalides' });
        }

        const dernierLettrage = await journals.max('lettrage', {
            where: {
                id_compte,
                id_dossier,
                id_exercice,
            }
        });

        const nouveauLettrage = nextLettrage(dernierLettrage);

        await journals.update(
            { lettrage: nouveauLettrage },
            {
                where: {
                    id: data,
                }
            }
        );

        const list = await journals.findAll({
            where: { id: data }
        })

        return res.status(200).json({
            state: true,
            message: `Lettrage "${nouveauLettrage}" ajouté avec succès à ${data.length} lignes`,
            lettrage: nouveauLettrage,
            list
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur serveur",
            error: error.message
        });
    }
};

exports.deleteLettrage = async (req, res) => {
    try {
        const { data, id_compte, id_dossier, id_exercice } = req.body;

        if (!data || !Array.isArray(data) || data.length === 0 || !id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Données manquantes ou invalides' });
        }

        const [affectedRows] = await journals.update(
            { lettrage: null },
            {
                where: {
                    id: data,
                }
            }
        );

        const list = await journals.findAll({
            where: { id: data }
        })

        return res.status(200).json({
            state: true,
            message: `Lettrage supprimé avec succès sur ${Number(affectedRows) || 0} ${pluralize(Number(affectedRows), 'ligne')}`,
            affected: Number(affectedRows) || 0,
            lettrage: null,
            list
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur serveur",
            error: error.message
        });
    }
};

exports.deleteJournal = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ state: false, msg: "Aucun ID fourni" });
        }

        // Vérifier si les écritures appartiennent à un journal de type RAN
        const journalsToDelete = await journals.findAll({
            where: { id: ids },
            include: [{
                model: codejournals,
                attributes: ['type']
            }]
        });

        const hasRanType = journalsToDelete.some(j => j.codejournal?.type === 'RAN');
        if (hasRanType) {
            return res.status(403).json({
                state: false,
                msg: "Impossible de supprimer des écritures de type RAN (Report à nouveau)"
            });
        }

        const journal = await journals.findOne({
            where: { id: ids[0] }
        });

        if (journal?.fichier) {
            const filePath = path.resolve(process.cwd(), journal.fichier);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                } else {
                    console.warn("Fichier introuvable :", filePath);
                }
            } catch (err) {
                console.warn("Erreur suppression fichier :", err.message);
            }
        }

        const result = await journals.destroy({
            where: {
                id: ids
            }
        });

        return res.json({
            state: result > 0,
            msg: result > 0 ? "Lignes supprimées avec succès" : "Aucune ligne supprimée"
        });

    } catch (error) {
        console.error("Erreur deleteJournal :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la suppression des écritures. Veuillez réessayer.",
            error: error.message
        });
    }
};

const getImmo = async () => {
    const querry = `
        SELECT * FROM details_immo
    `

    const rows = await db.sequelize.query(querry, { type: db.Sequelize.QueryTypes.SELECT });
    return rows;
}

// -------------------- IMMOBILISATIONS: details_immo CRUD --------------------
exports.listDetailsImmo = async (req, res) => {
    try {
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        const pcId = req.query?.pcId ? Number(req.query.pcId) : null;

        if (!fileId || !exerciceId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const exerciceData = await db.exercices.findByPk(exerciceId);
        if (!exerciceData) {
            return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        }

        const dateDebutExercice = exerciceData.date_debut;
        const dateFinExercice = exerciceData.date_fin;

        const autresExercices = await db.exercices.findAll({
            attributes: ['id'],
            where: {
                id_dossier: fileId,
                id_compte: compteId,
                id: { [Op.ne]: exerciceId }
            }
        });

        const autresExerciceIds = autresExercices.map(e => e.id);
        if (!autresExerciceIds.length) autresExerciceIds.push(0);

        const whereCompte = pcId
            ? 'AND d.pc_id = :pcId'
            : (compteId ? 'AND d.id_compte = :compteId' : '');

        const rows = await db.sequelize.query(`
                SELECT d.id, d.id_exercice
                FROM details_immo d
                WHERE d.id_dossier = :fileId
                ${whereCompte}
                AND (
                    d.id_exercice = :exerciceId
                    OR (
                        d.id_exercice IN (:autresExerciceIds)
                        AND d.date_acquisition < :dateDebutExercice
                    )
                )
            `, {
            replacements: {
                fileId,
                compteId,
                exerciceId,
                pcId,
                autresExerciceIds,
                dateDebutExercice
            },
            type: db.Sequelize.QueryTypes.SELECT,
        });

        const chunkSize = 20;

        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);

            await Promise.all(
                chunk.map(r =>
                    updateMontantImmo(
                        compteId,
                        fileId,
                        r.id_exercice,
                        r.id,
                        dateDebutExercice,
                        dateFinExercice
                    )
                )
            );
        }

        const rowsFinal = await db.sequelize.query(`
            SELECT d.*
            FROM details_immo d
            WHERE d.id_dossier = :fileId
                ${whereCompte}
                AND (
                    d.id_exercice = :exerciceId
                    OR (
                        d.id_exercice IN (:autresExerciceIds)
                        AND d.date_acquisition < :dateDebutExercice
                    )
                )
            ORDER BY d.date_acquisition ASC
            `, {
            replacements: {
                fileId,
                compteId,
                pcId,
                exerciceId,
                autresExerciceIds,
                dateDebutExercice
            },
            type: db.Sequelize.QueryTypes.SELECT,
        });

        return res.json({ state: true, list: rowsFinal });

    } catch (err) {
        console.error('[IMMO][DETAILS][LIST] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

exports.createDetailsImmo = async (req, res) => {
    try {
        const {
            fileId, compteId, exerciceId, pcId, amort_avant_reprise,
            code, intitule, lien_ecriture_id, fournisseur,
            date_acquisition, date_mise_service, duree_amort_mois, type_amort,
            montant, taux_tva, montant_tva, montant_ht,
            reprise_immobilisation, date_reprise,
            reprise_immobilisation_comp, date_reprise_comp,
            reprise_immobilisation_fisc, date_reprise_fisc,
            // legacy (back-compat)
            amort_ant, dotation_periode, amort_exceptionnel, total_amortissement, derogatoire,
            // new comptable suffix
            amort_ant_comp, dotation_periode_comp, amort_exceptionnel_comp, total_amortissement_comp, derogatoire_comp,
            // new fiscale suffix
            amort_ant_fisc, dotation_periode_fisc, amort_exceptionnel_fisc, total_amortissement_fisc, derogatoire_fisc,
            duree_amort_mois_fisc, type_amort_fisc,
            compte_amortissement, vnc, date_sortie, prix_vente,
            pc_id_amort,
            etat, ligneTab, isCompDegTab, isFiscDegTab
        } = req.body || {};

        if (!fileId || !compteId || !exerciceId || !pcId || !code) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const exo = await db.exercices.findByPk(Number(exerciceId));
        if (!exo) {
            return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        }
        const exoDebut = exo.date_debut ? new Date(exo.date_debut) : null;
        const exoFin = exo.date_fin ? new Date(exo.date_fin) : null;

        if (exoDebut && !isNaN(exoDebut.getTime()) && exoFin && !isNaN(exoFin.getTime())) {
            const dAcq = date_acquisition ? new Date(String(date_acquisition).substring(0, 10)) : null;
            const dMs = date_mise_service ? new Date(String(date_mise_service).substring(0, 10)) : null;
            const dRepriseLegacy = date_reprise ? new Date(String(date_reprise).substring(0, 10)) : null;
            const dRepriseComp = date_reprise_comp ? new Date(String(date_reprise_comp).substring(0, 10)) : null;
            const dRepriseFisc = date_reprise_fisc ? new Date(String(date_reprise_fisc).substring(0, 10)) : null;

            if (dAcq && !isNaN(dAcq.getTime()) && dAcq < exoDebut) {
                return res.status(400).json({ state: false, msg: "Date d'acquisition avant la date de début de l'exercice" });
            }
            if (dMs && !isNaN(dMs.getTime()) && dMs < exoDebut) {
                return res.status(400).json({ state: false, msg: "Date de mise en service avant la date de début de l'exercice" });
            }

            if (dRepriseLegacy && !isNaN(dRepriseLegacy.getTime()) && (dRepriseLegacy < exoDebut || dRepriseLegacy > exoFin)) {
                return res.status(400).json({ state: false, msg: "Date de reprise hors période de l'exercice" });
            }
            if (dRepriseComp && !isNaN(dRepriseComp.getTime()) && (dRepriseComp < exoDebut || dRepriseComp > exoFin)) {
                return res.status(400).json({ state: false, msg: "Date de reprise comptable hors période de l'exercice" });
            }
            if (dRepriseFisc && !isNaN(dRepriseFisc.getTime()) && (dRepriseFisc < exoDebut || dRepriseFisc > exoFin)) {
                return res.status(400).json({ state: false, msg: "Date de reprise fiscale hors période de l'exercice" });
            }
        }

        // Validate that amortisation account is provided (front derives one from compte)
        if (!compte_amortissement || String(compte_amortissement).trim() === '') {
            return res.status(400).json({ state: false, msg: "Veuillez ajouter un compte d'amort" });
        }

        const insertSql = `
            INSERT INTO details_immo (
                id_dossier, id_compte, id_exercice, pc_id, pc_id_amort, etat, amort_avant_reprise,
                code, intitule, lien_ecriture_id, fournisseur,
                date_acquisition, date_mise_service, duree_amort_mois, type_amort,
                montant, taux_tva, montant_tva, montant_ht,
                compte_amortissement, vnc, date_sortie, prix_vente,
                reprise_immobilisation, date_reprise,
                reprise_immobilisation_comp, date_reprise_comp,
                reprise_immobilisation_fisc, date_reprise_fisc,
                amort_ant_comp, dotation_periode_comp, amort_exceptionnel_comp, total_amortissement_comp, derogatoire_comp,
                amort_ant_fisc, dotation_periode_fisc, amort_exceptionnel_fisc, total_amortissement_fisc, derogatoire_fisc,
                duree_amort_mois_fisc, type_amort_fisc,
                created_at, updated_at
            ) VALUES (
                :fileId, :compteId, :exerciceId, :pcId, :pc_id_amort, :etat, :amort_avant_reprise,
                :code, :intitule, :lien_ecriture_id, :fournisseur,
                :date_acquisition, :date_mise_service, :duree_amort_mois, :type_amort,
                :montant, :taux_tva, :montant_tva, :montant_ht,
                :compte_amortissement, :vnc, :date_sortie, :prix_vente,
                :reprise_immobilisation, :date_reprise,
                :reprise_immobilisation_comp, :date_reprise_comp,
                :reprise_immobilisation_fisc, :date_reprise_fisc,
                :amort_ant_comp, :dotation_periode_comp, :amort_exceptionnel_comp, :total_amortissement_comp, :derogatoire_comp,
                :amort_ant_fisc, :dotation_periode_fisc, :amort_exceptionnel_fisc, :total_amortissement_fisc, :derogatoire_fisc,
                :duree_amort_mois_fisc, :type_amort_fisc,
                NOW(), NOW()
            ) RETURNING id;
        `;
        const [ret] = await db.sequelize.query(insertSql, {
            replacements: {
                fileId: Number(fileId), compteId: Number(compteId), exerciceId: Number(exerciceId), pcId: Number(pcId), pc_id_amort: Number(pc_id_amort), etat,
                code: String(code), intitule: intitule ?? null, lien_ecriture_id: lien_ecriture_id ?? null, fournisseur: fournisseur ?? null,
                date_acquisition: date_acquisition ? String(date_acquisition).substring(0, 10) : null,
                date_mise_service: date_mise_service ? String(date_mise_service).substring(0, 10) : null,
                duree_amort_mois: duree_amort_mois ?? null, type_amort: type_amort ?? null,
                montant: Number(montant) || 0, taux_tva: taux_tva ?? null, montant_tva: montant_tva ?? null, montant_ht: montant_ht ?? null,
                compte_amortissement: compte_amortissement ?? null,
                vnc: Number(vnc) || 0,
                date_sortie: date_sortie ? String(date_sortie).substring(0, 10) : null, prix_vente: prix_vente ?? null,
                reprise_immobilisation: Number(reprise_immobilisation) === 1 || reprise_immobilisation === true,
                date_reprise: date_reprise ? String(date_reprise).substring(0, 10) : null,
                reprise_immobilisation_comp: Number(reprise_immobilisation_comp) === 1 || reprise_immobilisation_comp === true,
                date_reprise_comp: date_reprise_comp ? String(date_reprise_comp).substring(0, 10) : null,
                reprise_immobilisation_fisc: Number(reprise_immobilisation_fisc) === 1 || reprise_immobilisation_fisc === true,
                date_reprise_fisc: date_reprise_fisc ? String(date_reprise_fisc).substring(0, 10) : null,
                amort_ant_comp: Number(amort_ant_comp) || 0,
                dotation_periode_comp: Number(dotation_periode_comp) || 0,
                amort_exceptionnel_comp: Number(amort_exceptionnel_comp) || 0,
                total_amortissement_comp: Number(total_amortissement_comp) || 0,
                derogatoire_comp: Number(derogatoire_comp) || 0,
                amort_ant_fisc: Number(amort_ant_fisc) || 0,
                dotation_periode_fisc: Number(dotation_periode_fisc) || 0,
                amort_exceptionnel_fisc: Number(amort_exceptionnel_fisc) || 0,
                total_amortissement_fisc: Number(total_amortissement_fisc) || 0,
                derogatoire_fisc: Number(derogatoire_fisc) || 0,
                duree_amort_mois_fisc: duree_amort_mois_fisc ?? null,
                type_amort_fisc: type_amort_fisc ?? null,
                amort_avant_reprise: Number(amort_avant_reprise)
            },
            type: db.Sequelize.QueryTypes.SELECT,
        });

        const insertedId = Array.isArray(ret) ? ret[0]?.id : ret?.id;
        if (insertedId && lien_ecriture_id) {
            const [jrow] = await db.sequelize.query(
                `SELECT id_ecriture FROM public.journals WHERE id = :ligne AND id_dossier = :file AND id_exercice = :exo LIMIT 1`,
                { replacements: { ligne: Number(lien_ecriture_id), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.SELECT }
            );
            if (jrow?.id_ecriture) {
                await db.sequelize.query(
                    `UPDATE public.journals SET id_immob = :immobId WHERE id_ecriture = :idec AND id_dossier = :file AND id_exercice = :exo`,
                    { replacements: { immobId: Number(insertedId), idec: String(jrow.id_ecriture), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.UPDATE }
                );
            } else {
                await db.sequelize.query(
                    `UPDATE public.journals SET id_immob = :immobId WHERE id = :ligne AND id_dossier = :file AND id_exercice = :exo`,
                    { replacements: { immobId: Number(insertedId), ligne: Number(lien_ecriture_id), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.UPDATE }
                );
            }
        } else if (insertedId && !lien_ecriture_id) {
            await db.sequelize.query(
                `UPDATE public.journals SET id_immob = 0 WHERE id_dossier = :file AND id_exercice = :exo AND id_immob = :immobId`,
                { replacements: { immobId: Number(insertedId), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.UPDATE }
            );
        }

        const querry = `
            SELECT * FROM details_immo where id = :insertedId
        `

        const detailRow = await db.sequelize.query(querry, { replacements: { insertedId }, type: db.Sequelize.QueryTypes.SELECT });

        const normalizeNoAccent = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const isCompDeg = normalizeNoAccent(detailRow[0]?.type_amort).includes('degr');
        const isFiscDeg = normalizeNoAccent(detailRow[0]?.type_amort_fisc).includes('degr');

        const previewLin = await previewImmoLineaireMiddleware(fileId, compteId, exerciceId, insertedId);
        const previewDeg = await previewImmoDegressifMiddleware(fileId, compteId, exerciceId, insertedId);

        const lin = previewLin || {};
        const deg = previewDeg || {};

        // Sélectionner la source par onglet (préférer dégressif si disponible)
        const degComp = Array.isArray(deg.list_comp) ? deg.list_comp : [];
        const degFisc = Array.isArray(deg.list_fisc) ? deg.list_fisc : [];
        const linComp = Array.isArray(lin.list_comp) ? lin.list_comp : [];
        const linFisc = Array.isArray(lin.list_fisc) ? lin.list_fisc : [];

        const compUsesDeg = (isCompDeg && degComp.length > 0);
        const fiscUsesDeg = (isFiscDeg && degFisc.length > 0);

        const rawComp = compUsesDeg ? degComp : linComp;
        const rawFisc = fiscUsesDeg ? degFisc : linFisc;
        const meta = compUsesDeg ? (deg.meta || lin.meta || {}) : (lin.meta || deg.meta || {});

        const montantHt = Number(meta?.montant_ht) || 0;
        const repriseComp = meta?.reprise_comp || meta?.reprise;
        const repriseFisc = meta?.reprise_fisc;
        const montantImmoHtComp = repriseComp ? Math.max(0, montantHt - (Number(repriseComp?.amort_ant) || 0)) : montantHt;
        const montantImmoHtFisc = repriseFisc ? Math.max(0, montantHt - (Number(repriseFisc?.amort_ant) || 0)) : montantHt;

        const normComp = rawComp.map((r) => ({
            rang: r.rang,
            date_mise_service: r.date_mise_service ?? r.date_debut ?? r.debut ?? null,
            date_fin_exercice: r.date_fin_exercice ?? r.date_fin ?? r.fin ?? null,
            nb_jours: r.nb_jours ?? r.nbJours ?? null,
            annee_nombre: r.annee_nombre ?? r.anneeNombre ?? null,
            montant_immo_ht: r.montant_immo_ht ?? montantImmoHtComp,
            amort_ant_comp: r.amort_ant_comp ?? r.dot_ant ?? 0,
            dotation_periode_comp: r.dotation_periode_comp ?? r.dotation_annuelle ?? 0,
            cumul_amort_comp: r.cumul_amort_comp ?? r.cumul_amort ?? 0,
            vnc: r.vnc ?? r.vnc_comp ?? null,
            amort_ant_fisc: 0,
            dotation_periode_fisc: 0,
            cumul_amort_fisc: 0,
            dot_derogatoire: r.dot_derogatoire ?? 0,
        }));

        const normFisc = rawFisc.map((r) => ({
            rang: r.rang,
            date_mise_service: r.date_mise_service ?? r.date_debut ?? r.debut ?? null,
            date_fin_exercice: r.date_fin_exercice ?? r.date_fin ?? r.fin ?? null,
            nb_jours: r.nb_jours ?? r.nbJours ?? null,
            annee_nombre: r.annee_nombre ?? r.anneeNombre ?? null,
            montant_immo_ht: r.montant_immo_ht ?? montantImmoHtFisc,
            amort_ant_comp: 0,
            dotation_periode_comp: 0,
            cumul_amort_comp: 0,
            vnc: r.vnc ?? Math.max(0, (meta.montant_ht ?? 0) - (r.cumul_amort_fisc ?? r.cumul_amort ?? 0)),
            amort_ant_fisc: r.amort_ant_fisc ?? r.dot_ant ?? 0,
            dotation_periode_fisc: r.dotation_periode_fisc ?? r.dotation_annuelle ?? 0,
            cumul_amort_fisc: r.cumul_amort_fisc ?? r.cumul_amort ?? 0,
            dot_derogatoire: r.dot_derogatoire ?? 0,
        }));

        const lignesAEnvoyer = ligneTab === 'fisc'
            ? (normFisc)
            : (normComp);

        const useDeg = ligneTab === 'comp' ? isCompDegTab : isFiscDegTab;

        useDeg ? await saveImmoDegressifMiddleware(fileId, compteId, exerciceId, insertedId, lignesAEnvoyer) : await saveImmoLineaireMiddleware(fileId, compteId, exerciceId, insertedId, lignesAEnvoyer);

        await updateMontantImmo(
            compteId,
            fileId,
            exerciceId,
            insertedId,
            exoDebut,
            exoFin
        );

        return res.json({ state: true, id: insertedId || null });
    } catch (err) {
        console.error('[IMMO][DETAILS][UPDATE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

exports.updateDetailsImmo = async (req, res) => {
    try {
        const id = Number(req.params?.id);
        const {
            fileId, compteId, exerciceId, pcId, amort_avant_reprise,
            code, intitule, lien_ecriture_id, fournisseur,
            date_acquisition, date_mise_service, duree_amort_mois, type_amort,
            montant, taux_tva, montant_tva, montant_ht,
            reprise_immobilisation, date_reprise,
            reprise_immobilisation_comp, date_reprise_comp,
            reprise_immobilisation_fisc, date_reprise_fisc,
            // new comptable suffix
            amort_ant_comp, dotation_periode_comp, amort_exceptionnel_comp, total_amortissement_comp, derogatoire_comp,
            // new fiscale suffix
            amort_ant_fisc, dotation_periode_fisc, amort_exceptionnel_fisc, total_amortissement_fisc, derogatoire_fisc,
            duree_amort_mois_fisc, type_amort_fisc,
            compte_amortissement, vnc, date_sortie, prix_vente, etat, ligneTab, isCompDegTab, isFiscDegTab
        } = req.body || {};
        if (!id || !fileId || !compteId || !exerciceId || !pcId || !code) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        const exo = await db.exercices.findByPk(Number(exerciceId));
        if (!exo) {
            return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        }
        const exoDebut = exo.date_debut ? new Date(exo.date_debut) : null;
        const exoFin = exo.date_fin ? new Date(exo.date_fin) : null;

        if (exoDebut && !isNaN(exoDebut.getTime()) && exoFin && !isNaN(exoFin.getTime())) {
            const dAcq = date_acquisition ? new Date(String(date_acquisition).substring(0, 10)) : null;
            const dMs = date_mise_service ? new Date(String(date_mise_service).substring(0, 10)) : null;
            const dRepriseLegacy = date_reprise ? new Date(String(date_reprise).substring(0, 10)) : null;
            const dRepriseComp = date_reprise_comp ? new Date(String(date_reprise_comp).substring(0, 10)) : null;
            const dRepriseFisc = date_reprise_fisc ? new Date(String(date_reprise_fisc).substring(0, 10)) : null;

            if (dAcq && !isNaN(dAcq.getTime()) && dAcq < exoDebut) {
                return res.status(400).json({ state: false, msg: "Date d'acquisition avant la date de début de l'exercice" });
            }
            if (dMs && !isNaN(dMs.getTime()) && dMs < exoDebut) {
                return res.status(400).json({ state: false, msg: "Date de mise en service avant la date de début de l'exercice" });
            }

            if (dRepriseLegacy && !isNaN(dRepriseLegacy.getTime()) && (dRepriseLegacy < exoDebut || dRepriseLegacy > exoFin)) {
                return res.status(400).json({ state: false, msg: "Date de reprise hors période de l'exercice" });
            }
            if (dRepriseComp && !isNaN(dRepriseComp.getTime()) && (dRepriseComp < exoDebut || dRepriseComp > exoFin)) {
                return res.status(400).json({ state: false, msg: "Date de reprise comptable hors période de l'exercice" });
            }
            if (dRepriseFisc && !isNaN(dRepriseFisc.getTime()) && (dRepriseFisc < exoDebut || dRepriseFisc > exoFin)) {
                return res.status(400).json({ state: false, msg: "Date de reprise fiscale hors période de l'exercice" });
            }
        }

        const updateSql = `
            UPDATE details_immo SET
                pc_id = :pcId,
                code = :code,
                intitule = :intitule,
                lien_ecriture_id = :lien_ecriture_id,
                fournisseur = :fournisseur,
                date_acquisition = :date_acquisition,
                date_mise_service = :date_mise_service,
                duree_amort_mois = :duree_amort_mois,
                type_amort = :type_amort,
                montant = :montant,
                taux_tva = :taux_tva,
                montant_tva = :montant_tva,
                montant_ht = :montant_ht,
                compte_amortissement = :compte_amortissement,
                vnc = :vnc,
                date_sortie = :date_sortie,
                prix_vente = :prix_vente,
                reprise_immobilisation = :reprise_immobilisation,
                date_reprise = :date_reprise,
                reprise_immobilisation_comp = :reprise_immobilisation_comp,
                date_reprise_comp = :date_reprise_comp,
                reprise_immobilisation_fisc = :reprise_immobilisation_fisc,
                date_reprise_fisc = :date_reprise_fisc,
                amort_ant_comp = :amort_ant_comp,
                dotation_periode_comp = :dotation_periode_comp,
                amort_exceptionnel_comp = :amort_exceptionnel_comp,
                total_amortissement_comp = :total_amortissement_comp,
                derogatoire_comp = :derogatoire_comp,
                amort_ant_fisc = :amort_ant_fisc,
                dotation_periode_fisc = :dotation_periode_fisc,
                amort_exceptionnel_fisc = :amort_exceptionnel_fisc,
                total_amortissement_fisc = :total_amortissement_fisc,
                derogatoire_fisc = :derogatoire_fisc,
                duree_amort_mois_fisc = :duree_amort_mois_fisc, 
                type_amort_fisc = :type_amort_fisc,
                updated_at = NOW(),
                etat = :etat,
                amort_avant_reprise = :amort_avant_reprise
            WHERE id = :id AND id_dossier = :fileId AND id_compte = :compteId AND id_exercice = :exerciceId
        `;

        await db.sequelize.query(updateSql, {
            replacements: {
                id: Number(id), fileId: Number(fileId), compteId: Number(compteId), exerciceId: Number(exerciceId), pcId: Number(pcId), amort_avant_reprise: Number(amort_avant_reprise),
                code: String(code), intitule: intitule ?? null, lien_ecriture_id: lien_ecriture_id ?? null, fournisseur: fournisseur ?? null,
                date_acquisition: date_acquisition ? String(date_acquisition).substring(0, 10) : null,
                date_mise_service: date_mise_service ? String(date_mise_service).substring(0, 10) : null,
                duree_amort_mois: duree_amort_mois ?? null, type_amort: type_amort ?? null,
                montant: Number(montant) || 0, taux_tva: taux_tva ?? null, montant_tva: montant_tva ?? null, montant_ht: montant_ht ?? null,
                compte_amortissement: compte_amortissement ?? null,
                vnc: Number(vnc) || 0,
                date_sortie: date_sortie ? String(date_sortie).substring(0, 10) : null, prix_vente: prix_vente ?? null,
                reprise_immobilisation: Number(reprise_immobilisation) === 1 || reprise_immobilisation === true,
                date_reprise: date_reprise ? String(date_reprise).substring(0, 10) : null,
                reprise_immobilisation_comp: Number(reprise_immobilisation_comp) === 1 || reprise_immobilisation_comp === true,
                date_reprise_comp: date_reprise_comp ? String(date_reprise_comp).substring(0, 10) : null,
                reprise_immobilisation_fisc: Number(reprise_immobilisation_fisc) === 1 || reprise_immobilisation_fisc === true,
                date_reprise_fisc: date_reprise_fisc ? String(date_reprise_fisc).substring(0, 10) : null,
                amort_ant_comp: Number(amort_ant_comp) || 0,
                dotation_periode_comp: Number(dotation_periode_comp) || 0,
                amort_exceptionnel_comp: Number(amort_exceptionnel_comp) || 0,
                total_amortissement_comp: Number(total_amortissement_comp) || 0,
                derogatoire_comp: Number(derogatoire_comp) || 0,
                amort_ant_fisc: Number(amort_ant_fisc) || 0,
                dotation_periode_fisc: Number(dotation_periode_fisc) || 0,
                amort_exceptionnel_fisc: Number(amort_exceptionnel_fisc) || 0,
                total_amortissement_fisc: Number(total_amortissement_fisc) || 0,
                derogatoire_fisc: Number(derogatoire_fisc) || 0,
                duree_amort_mois_fisc: duree_amort_mois_fisc ?? null,
                type_amort_fisc: type_amort_fisc ?? null,
                etat
            },
            type: db.Sequelize.QueryTypes.UPDATE,
        });

        if (id && lien_ecriture_id) {
            const [jrow] = await db.sequelize.query(
                `SELECT id_ecriture FROM public.journals WHERE id = :ligne AND id_dossier = :file AND id_exercice = :exo LIMIT 1`,
                { replacements: { ligne: Number(lien_ecriture_id), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.SELECT }
            );
            if (jrow?.id_ecriture) {
                await db.sequelize.query(
                    `UPDATE public.journals SET id_immob = :immobId WHERE id_ecriture = :idec AND id_dossier = :file AND id_exercice = :exo`,
                    { replacements: { immobId: Number(id), idec: String(jrow.id_ecriture), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.UPDATE }
                );
            } else {
                await db.sequelize.query(
                    `UPDATE public.journals SET id_immob = :immobId WHERE id = :ligne AND id_dossier = :file AND id_exercice = :exo`,
                    { replacements: { immobId: Number(id), ligne: Number(lien_ecriture_id), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.UPDATE }
                );
            }
        } else if (id && !lien_ecriture_id) {
            await db.sequelize.query(
                `UPDATE public.journals SET id_immob = 0 WHERE id_dossier = :file AND id_exercice = :exo AND id_immob = :immobId`,
                { replacements: { immobId: Number(id), file: Number(fileId), exo: Number(exerciceId) }, type: db.Sequelize.QueryTypes.UPDATE }
            );
        }

        const querry = `
            SELECT * FROM details_immo where id = :id
        `

        const detailRow = await db.sequelize.query(querry, { replacements: { id }, type: db.Sequelize.QueryTypes.SELECT });

        const normalizeNoAccent = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const isCompDeg = normalizeNoAccent(detailRow[0]?.type_amort).includes('degr');
        const isFiscDeg = normalizeNoAccent(detailRow[0]?.type_amort_fisc).includes('degr');

        const previewLin = await previewImmoLineaireMiddleware(fileId, compteId, exerciceId, id);
        const previewDeg = await previewImmoDegressifMiddleware(fileId, compteId, exerciceId, id);

        const lin = previewLin || {};
        const deg = previewDeg || {};

        const degComp = Array.isArray(deg.list_comp) ? deg.list_comp : [];
        const degFisc = Array.isArray(deg.list_fisc) ? deg.list_fisc : [];
        const linComp = Array.isArray(lin.list_comp) ? lin.list_comp : [];
        const linFisc = Array.isArray(lin.list_fisc) ? lin.list_fisc : [];

        const compUsesDeg = (isCompDeg && degComp.length > 0);
        const fiscUsesDeg = (isFiscDeg && degFisc.length > 0);

        const rawComp = compUsesDeg ? degComp : linComp;
        const rawFisc = fiscUsesDeg ? degFisc : linFisc;
        const meta = compUsesDeg ? (deg.meta || lin.meta || {}) : (lin.meta || deg.meta || {});

        const montantHt = Number(meta?.montant_ht) || 0;
        const repriseComp = meta?.reprise_comp || meta?.reprise;
        const repriseFisc = meta?.reprise_fisc;
        const montantImmoHtComp = repriseComp ? Math.max(0, montantHt - (Number(repriseComp?.amort_ant) || 0)) : montantHt;
        const montantImmoHtFisc = repriseFisc ? Math.max(0, montantHt - (Number(repriseFisc?.amort_ant) || 0)) : montantHt;

        const normComp = rawComp.map((r) => ({
            rang: r.rang,
            date_mise_service: r.date_mise_service ?? r.date_debut ?? r.debut ?? null,
            date_fin_exercice: r.date_fin_exercice ?? r.date_fin ?? r.fin ?? null,
            nb_jours: r.nb_jours ?? r.nbJours ?? null,
            annee_nombre: r.annee_nombre ?? r.anneeNombre ?? null,
            montant_immo_ht: r.montant_immo_ht ?? montantImmoHtComp,
            amort_ant_comp: r.amort_ant_comp ?? r.dot_ant ?? 0,
            dotation_periode_comp: r.dotation_periode_comp ?? r.dotation_annuelle ?? 0,
            cumul_amort_comp: r.cumul_amort_comp ?? r.cumul_amort ?? 0,
            vnc: r.vnc ?? r.vnc_comp ?? null,
            amort_ant_fisc: 0,
            dotation_periode_fisc: 0,
            cumul_amort_fisc: 0,
            dot_derogatoire: r.dot_derogatoire ?? 0,
        }));

        const normFisc = rawFisc.map((r) => ({
            rang: r.rang,
            date_mise_service: r.date_mise_service ?? r.date_debut ?? r.debut ?? null,
            date_fin_exercice: r.date_fin_exercice ?? r.date_fin ?? r.fin ?? null,
            nb_jours: r.nb_jours ?? r.nbJours ?? null,
            annee_nombre: r.annee_nombre ?? r.anneeNombre ?? null,
            montant_immo_ht: r.montant_immo_ht ?? montantImmoHtFisc,
            amort_ant_comp: 0,
            dotation_periode_comp: 0,
            cumul_amort_comp: 0,
            vnc: r.vnc ?? Math.max(0, (meta.montant_ht ?? 0) - (r.cumul_amort_fisc ?? r.cumul_amort ?? 0)),
            amort_ant_fisc: r.amort_ant_fisc ?? r.dot_ant ?? 0,
            dotation_periode_fisc: r.dotation_periode_fisc ?? r.dotation_annuelle ?? 0,
            cumul_amort_fisc: r.cumul_amort_fisc ?? r.cumul_amort ?? 0,
            dot_derogatoire: r.dot_derogatoire ?? 0,
        }));

        const lignesAEnvoyer = ligneTab === 'fisc'
            ? (normFisc)
            : (normComp);

        // console.log('ligneTab : ', ligneTab);
        // console.log('isCompDegTab : ', isCompDegTab);
        // console.log('isFiscDegTab : ', isFiscDegTab);

        const useDeg = ligneTab === 'comp' ? isCompDegTab : isFiscDegTab;
        // console.log('lignesAEnvoyer : ', lignesAEnvoyer);

        // console.log('useDeg : ', useDeg);

        useDeg ? await saveImmoDegressifMiddleware(fileId, compteId, exerciceId, id, lignesAEnvoyer) : await saveImmoLineaireMiddleware(fileId, compteId, exerciceId, id, lignesAEnvoyer);

        await updateMontantImmo(
            compteId,
            fileId,
            exerciceId,
            id,
            exoDebut,
            exoFin
        );

        return res.json({ state: true, id });
    } catch (err) {
        console.error('[IMMO][DETAILS][UPDATE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

exports.deleteDetailsImmo = async (req, res) => {
    try {
        const id = Number(req.params?.id);
        const fileId = Number(req.query?.fileId);
        const compteId = Number(req.query?.compteId);
        const exerciceId = Number(req.query?.exerciceId);
        if (!id || !fileId || !exerciceId) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        // Utiliser pc_id si compteId est fourni (car c'est l'ID du plan comptable)
        // Sinon utiliser id_compte
        const whereClause = compteId
            ? 'AND pc_id = :compteId'
            : 'AND id_compte = :compteId';

        const sql = `DELETE FROM details_immo WHERE id = :id AND id_dossier = :fileId AND id_exercice = :exerciceId ${whereClause}`;
        const result = await db.sequelize.query(sql, {
            replacements: { id, fileId, compteId, exerciceId },
            type: db.Sequelize.QueryTypes.DELETE,
        });
        console.log('[IMMO][DETAILS][DELETE] Suppression effectuée:', { id, fileId, compteId, exerciceId, result });
        return res.json({ state: true, id });
    } catch (err) {
        console.error('[IMMO][DETAILS][DELETE] error:', err);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
};

exports.importImmobilisations = async (req, res) => {
    try {
        const { data, id_dossier, id_compte, id_exercice } = req.body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ state: false, msg: 'Aucune donnée à importer' });
        }
        if (!id_dossier || !id_compte || !id_exercice) {
            return res.status(400).json({ state: false, msg: 'Paramètres manquants' });
        }

        // Récupérer les dates de l'exercice sélectionné
        const exercice = await db.exercices.findByPk(Number(id_exercice));
        if (!exercice) {
            return res.status(404).json({ state: false, msg: 'Exercice introuvable' });
        }
        const dateDebutExercice = exercice.date_debut ? new Date(exercice.date_debut) : null;
        const dateFinExercice = exercice.date_fin ? new Date(exercice.date_fin) : null;

        // Récupérer tous les exercices du dossier pour vérifier l'existence d'exercices futurs
        const tousLesExercices = await db.sequelize.query(
            `SELECT id, date_debut, date_fin FROM exercices WHERE id_dossier = :id_dossier ORDER BY date_debut ASC`,
            {
                replacements: { id_dossier: Number(id_dossier) },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const anomalies = [];
        const immobilisationsToInsert = [];

        // Récupérer le plan comptable pour valider les comptes
        const planComptable = await db.sequelize.query(
            `SELECT id, compte FROM dossierplancomptables WHERE id_dossier = :id_dossier AND id_compte = :id_compte`,
            {
                replacements: { id_dossier: Number(id_dossier), id_compte: Number(id_compte) },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const pcMap = new Map();
        planComptable.forEach(pc => {
            pcMap.set(pc.compte.trim(), pc.id);
        });

        // Valider et préparer les données
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const ligneNum = i + 1;

            // Validation des champs obligatoires
            if (!row.numero_compte || row.numero_compte.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le numéro de compte est obligatoire`);
                continue;
            }
            if (!row.code || row.code.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le code est obligatoire`);
                continue;
            }
            if (!row.intitule || row.intitule.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: L'intitulé est obligatoire`);
                continue;
            }
            if (!row.date_acquisition || row.date_acquisition.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La date d'acquisition est obligatoire`);
                continue;
            }
            if (!row.duree_amort || row.duree_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La durée d'amortissement est obligatoire`);
                continue;
            }
            if (!row.type_amort || row.type_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le type d'amortissement est obligatoire`);
                continue;
            }
            if (!row.montant_ht || row.montant_ht.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le montant HT est obligatoire`);
                continue;
            }

            // Trouver l'exercice correspondant à la date d'acquisition
            const dateAcq = new Date(row.date_acquisition.trim());
            if (isNaN(dateAcq.getTime())) {
                anomalies.push(`Ligne ${ligneNum}: La date d'acquisition est invalide`);
                continue;
            }

            // Chercher l'exercice qui contient cette date
            const exerciceCorrespondant = tousLesExercices.find(exo => {
                const debut = exo.date_debut ? new Date(exo.date_debut) : null;
                const fin = exo.date_fin ? new Date(exo.date_fin) : null;
                return debut && fin && dateAcq >= debut && dateAcq <= fin;
            });

            if (!exerciceCorrespondant) {
                // Aucun exercice trouvé pour cette date
                const annee = dateAcq.getFullYear();
                const dateStr = `${dateAcq.getDate().toString().padStart(2, '0')}/${(dateAcq.getMonth() + 1).toString().padStart(2, '0')}/${annee}`;
                anomalies.push(`Ligne ${ligneNum}: Veuillez créer d'abord l'exercice ${annee} pour importer cette immobilisation (date d'acquisition: ${dateStr})`);
                continue;
            }

            // Utiliser l'exercice trouvé pour cette immobilisation
            const exerciceIdPourCetteLigne = exerciceCorrespondant.id;
            const dateDebutExerciceTrouve = exerciceCorrespondant.date_debut ? new Date(exerciceCorrespondant.date_debut) : null;
            const dateFinExerciceTrouve = exerciceCorrespondant.date_fin ? new Date(exerciceCorrespondant.date_fin) : null;

            // Vérifier que le compte existe dans le plan comptable
            const numeroCompte = row.numero_compte ? row.numero_compte.trim() : '';
            if (!numeroCompte) {
                anomalies.push(`Ligne ${ligneNum}: Le numéro de compte est vide`);
                continue;
            }
            const pc_id = pcMap.get(numeroCompte);
            if (!pc_id) {
                anomalies.push(`Ligne ${ligneNum}: Le compte "${numeroCompte}" n'existe pas dans le plan comptable`);
                continue;
            }

            // Calculer le compte d'amortissement (ajouter 8 après le premier chiffre et enlever le dernier)
            const deriveCompteAmort = (compte) => {
                if (!compte) return '';
                const s = String(compte);
                if (s.length < 3) return s;
                return s[0] + '8' + s.substring(1, s.length - 1);
            };

            const compte_amortissement = deriveCompteAmort(numeroCompte);

            // Déterminer si c'est une reprise en fonction de la position de la date d'acquisition
            let isReprise = false;
            let dateReprise = null;
            let amortAnt = 0;

            // Vérifier d'abord la position de la date d'acquisition par rapport à l'exercice
            if (dateDebutExercice) {
                const dateAcq = new Date(row.date_acquisition.trim());

                if (!isNaN(dateAcq.getTime()) && dateAcq < dateDebutExercice) {
                    // Date d'acquisition AVANT le début de l'exercice → REPRISE
                    isReprise = true;

                    // Si date_reprise est fournie dans le CSV, on l'utilise
                    if (row.date_reprise && row.date_reprise.trim() !== '') {
                        dateReprise = row.date_reprise.trim();

                        // amort_ant est obligatoire si date_reprise est fournie
                        if (!row.amort_ant || row.amort_ant.trim() === '') {
                            anomalies.push(`Ligne ${ligneNum}: L'amortissement antérieur est obligatoire pour une reprise`);
                            continue;
                        }
                        amortAnt = Number(row.amort_ant.replace(/,/g, '.'));
                    } else {
                        // Sinon, reprise automatique avec date_reprise = date début exercice trouvé
                        const year = dateDebutExerciceTrouve.getFullYear();
                        const month = String(dateDebutExerciceTrouve.getMonth() + 1).padStart(2, '0');
                        const day = String(dateDebutExerciceTrouve.getDate()).padStart(2, '0');
                        dateReprise = `${year}-${month}-${day}`;

                        // Utiliser amort_ant du CSV s'il est fourni, sinon 0
                        amortAnt = (row.amort_ant && row.amort_ant.trim() !== '')
                            ? Number(row.amort_ant.replace(/,/g, '.'))
                            : 0;
                    }
                }
            }

            // Préparer l'objet à insérer avec l'exercice trouvé automatiquement
            const immobData = {
                id_dossier: Number(id_dossier),
                id_compte: Number(id_compte),
                id_exercice: exerciceIdPourCetteLigne, // Utiliser l'exercice trouvé automatiquement
                pc_id: pc_id,
                code: row.code.trim(),
                intitule: row.intitule.trim(),
                fournisseur: row.fournisseur ? row.fournisseur.trim() : null,
                date_acquisition: row.date_acquisition.trim(),
                date_mise_service: row.date_acquisition.trim(), // Même date que l'acquisition
                duree_amort_mois: Number(row.duree_amort),
                type_amort: row.type_amort.trim(),
                montant_ht: Number(row.montant_ht.replace(/,/g, '.')),
                compte_amortissement: compte_amortissement,
                reprise_immobilisation: isReprise,
                date_reprise: dateReprise,
                reprise_immobilisation_comp: isReprise,
                date_reprise_comp: dateReprise,
                reprise_immobilisation_fisc: isReprise,
                date_reprise_fisc: dateReprise,
                amort_ant_comp: amortAnt,
                amort_ant_fisc: amortAnt,
                date_sortie: row.date_sortie && row.date_sortie.trim() !== '' ? row.date_sortie.trim() : null,
                duree_amort_mois_fisc: Number(row.duree_amort),
                type_amort_fisc: row.type_amort.trim(),
            };

            immobilisationsToInsert.push(immobData);
        }

        // Si des anomalies, retourner les erreurs
        if (anomalies.length > 0) {
            return res.json({
                state: false,
                msg: `${anomalies.length} anomalie(s) détectée(s)`,
                anomalies: anomalies
            });
        }

        // Insérer les immobilisations
        let insertedCount = 0;
        for (const immobData of immobilisationsToInsert) {
            await db.sequelize.query(
                `INSERT INTO details_immo (
                    id_dossier, id_compte, id_exercice, pc_id, code, intitule, fournisseur,
                    date_acquisition, date_mise_service, duree_amort_mois, type_amort, montant_ht,
                    compte_amortissement, reprise_immobilisation, date_reprise,
                    reprise_immobilisation_comp, date_reprise_comp, reprise_immobilisation_fisc, date_reprise_fisc,
                    amort_ant_comp, amort_ant_fisc, date_sortie, duree_amort_mois_fisc, type_amort_fisc,
                    created_at, updated_at
                ) VALUES (
                    :id_dossier, :id_compte, :id_exercice, :pc_id, :code, :intitule, :fournisseur,
                    :date_acquisition, :date_mise_service, :duree_amort_mois, :type_amort, :montant_ht,
                    :compte_amortissement, :reprise_immobilisation, :date_reprise,
                    :reprise_immobilisation_comp, :date_reprise_comp, :reprise_immobilisation_fisc, :date_reprise_fisc,
                    :amort_ant_comp, :amort_ant_fisc, :date_sortie, :duree_amort_mois_fisc, :type_amort_fisc,
                    NOW(), NOW()
                )`,
                {
                    replacements: immobData,
                    type: db.Sequelize.QueryTypes.INSERT
                }
            );
            insertedCount++;
        }

        return res.json({
            state: true,
            msg: `${insertedCount} immobilisation(s) importée(s) avec succès`
        });

    } catch (err) {
        console.error('[IMMO][IMPORT] error:', err);
        return res.status(500).json({
            state: false,
            msg: 'Erreur serveur lors de l\'import',
            error: err.message
        });
    }
};

exports.addJournal = async (req, res) => {
    try {
        const jsonData = JSON.parse(req.body.data);
        const file = req.file;

        if (!jsonData) {
            return res.status(400).json({ message: "Données ou fichier manquant" });
        }

        const id_compte = Number(jsonData.id_compte);
        const id_dossier = Number(jsonData.id_dossier);
        const id_exercice = Number(jsonData.id_exercice);
        const id_journal = Number(jsonData.valSelectCodeJnl);
        const id_devise = Number(jsonData.id_devise);

        const codeJournal = await codejournals.findByPk(id_journal);
        if (!codeJournal) {
            return res.status(404).json({ message: "Code journal introuvable" });
        }

        const typeCodeJournal = codeJournal.type;

        const mois = jsonData.valSelectMois;
        const annee = jsonData.valSelectAnnee;
        const currency = jsonData.currency;
        const devise = jsonData.choixDevise === 'MGA' ? jsonData.choixDevise : currency;
        const tableRows = jsonData.tableRows;
        const listCa = jsonData.listCa;
        const taux = jsonData.taux;

        let fichierCheminRelatif = null;

        if (file) {
            const dossierRelatif = path.join(
                "public",
                "ScanEcriture",
                id_compte.toString(),
                id_dossier.toString(),
                id_exercice.toString(),
                typeCodeJournal
            );

            const dossierAbsolu = path.resolve(dossierRelatif);
            fs.mkdirSync(dossierAbsolu, { recursive: true });

            const nomFichier = `journal_${Date.now()}${path.extname(file.originalname)}`;
            const cheminComplet = path.join(dossierAbsolu, nomFichier);

            fs.renameSync(file.path, cheminComplet);

            fichierCheminRelatif = path.join(dossierRelatif, nomFichier).replace(/\\/g, '/');
        }

        const idEcritureCommun = getDateSaisieNow(id_compte);

        const newTableRows = await Promise.all(tableRows.map(async (row) => {
            const dossierPc = await dossierplancomptable.findByPk(row.compte);
            const libellecompte = dossierPc?.libelle;
            const compteaux = dossierPc?.compte;
            const comptebaseaux = dossierPc?.baseaux_id;

            let id_numcptcentralise = null;
            let libelleaux = '';
            let comptegen = null;
            if (comptebaseaux) {
                const cpt = await dossierplancomptable.findByPk(comptebaseaux);
                id_numcptcentralise = cpt?.id || null;
                comptegen = cpt?.compte;
                libelleaux = cpt?.libelle;
            }

            const dateecriture = new Date(
                annee,
                mois - 1,
                row.jour + 1
            );

            if (!isValidDate(dateecriture)) {
                throw new Error(`Date invalide pour la ligne ${JSON.stringify(row)}`);
            }

            return {
                id_temporaire: row.id,
                id_compte,
                id_dossier,
                id_exercice,
                id_numcpt: row.compte,
                id_journal,
                id_devise,
                taux,
                devise,
                saisiepar: id_compte,
                id_ecriture: idEcritureCommun,
                debit: row.debit === "" ? 0 : row.debit,
                num_facture: row.num_facture,
                credit: row.credit === "" ? 0 : row.credit,
                montant_devise: row.montant_devise || 0,
                dateecriture: dateecriture,
                datesaisie: new Date(),

                id_numcptcentralise,
                libelle: row.libelle || '',
                piece: row.piece || '',
                piecedate: row.piecedate || null,
                fichier: fichierCheminRelatif,
                comptegen: comptegen,
                compteaux: compteaux,
                libellecompte: libellecompte,
                libelleaux: libelleaux
            };
        }));

        let count = 0;
        for (const row of newTableRows) {
            const createdJournal = await journals.create({ ...row });
            count++;

            const journalId = createdJournal.id;

            const relevantCa = listCa?.filter(item => item.id_ligne_ecriture === row.id_temporaire) || [];

            if (relevantCa.length > 0) {
                const listCaRows = relevantCa.map(item => ({
                    id_compte,
                    id_dossier,
                    id_exercice,
                    id_ligne_ecriture: journalId,
                    id_axe: item.id_axe,
                    id_section: item.id_section,
                    debit: item.debit || 0,
                    credit: item.credit || 0,
                    pourcentage: item.pourcentage || 0
                }));

                await analytiques.bulkCreate(listCaRows);
            }
        }

        return res.json({
            message: `${count} ${pluralize(count, 'ligne')} ${pluralize(count, 'ajoutée')} avec succès`,
            data: newTableRows,
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ state: false, message: error.message });
    }
};

exports.addEcriture = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            id_dossier,
            id_exercice,
            id_compte,
            id_plan_comptable,
            id_contre_partie,
            solde,
            selectedIds
        } = req.body;

        const dernierLettrage = await journals.max('lettrage', {
            where: {
                id_compte,
                id_dossier,
                id_exercice,
            }
        });

        const nouveauLettrage = nextLettrage(dernierLettrage);

        const id_ecriture = getDateSaisieNow(id_compte);
        const isCrediteur = solde < 0;

        let debit_pc = 0, credit_pc = 0, debit_cp = 0, credit_cp = 0;
        let id_journal = null;
        let id_devise = null;

        const dossierPc_pc = await dossierplancomptable.findByPk(id_plan_comptable);
        const compteAux_pc = dossierPc_pc?.compte;
        const libelleAux_pc = dossierPc_pc?.libelle;

        const dossierPc_cp = await dossierplancomptable.findByPk(id_contre_partie);
        const compteAux_cp = dossierPc_cp?.compte;
        const libelleAux_cp = dossierPc_cp?.libelle;

        if (!dossierPc_pc || !dossierPc_cp) {
            throw new Error("Compte introuvable");
        }

        const comptebaseaux_pc = dossierPc_pc?.baseaux_id;
        let libelleGen_pc = '';
        let compteGen_pc = '';

        const comptebaseaux_cp = dossierPc_cp?.baseaux_id;
        let libelleGen_cp = '';
        let compteGen_cp = '';

        let id_numcptcentralise_pc = null;
        if (comptebaseaux_pc) {
            const cpt = await dossierplancomptable.findByPk(comptebaseaux_pc);
            libelleGen_pc = cpt?.libelle;
            compteGen_pc = cpt?.compte;
            id_numcptcentralise_pc = cpt?.id || null;
        }

        let id_numcptcentralise_cp = null;
        if (comptebaseaux_cp) {
            const cpt = await dossierplancomptable.findByPk(comptebaseaux_cp);
            libelleGen_cp = cpt?.libelle;
            compteGen_cp = cpt?.compte;
            id_numcptcentralise_cp = cpt?.id || null;
        }

        const libelle = `Ecart de lettrage du compte ${dossierPc_pc?.compte}`;

        let codeOD = await codejournals.findOne({
            where: { id_dossier, id_compte, code: 'OD' },
            transaction
        });

        if (!codeOD) {
            codeOD = await codejournals.create({
                id_compte,
                id_dossier,
                code: 'OD',
                libelle: 'Opérations diverses',
                type: 'OD'
            }, { transaction });
        }

        id_journal = codeOD.id;

        let devise = await devises.findOne({
            where: { id_dossier, id_compte, par_defaut: true },
            transaction
        });

        if (!devise) {
            devise = await devises.findOne({
                where: { id_dossier, id_compte, code: 'MGA' },
                transaction
            });

            if (!devise) {
                devise = await devises.create({
                    id_compte,
                    id_dossier,
                    code: 'MGA',
                    libelle: 'Madagascar',
                    par_defaut: true
                }, { transaction });
            }
        }

        id_devise = devise.id;

        const montant = Math.abs(solde);

        if (isCrediteur) {
            debit_pc = montant;
            credit_cp = montant;
        } else {
            credit_pc = montant;
            debit_cp = montant;
        }

        await journals.update({
            lettrage: nouveauLettrage
        }, {
            where: {
                id: { [Op.in]: selectedIds }
            }
        }, { transaction })

        await journals.create({
            id_compte,
            id_dossier,
            id_exercice,
            id_numcpt: id_plan_comptable,
            id_ecriture,
            id_journal,
            id_devise,
            debit: debit_pc,
            credit: credit_pc,
            libelle,
            dateecriture: new Date(),
            saisiepar: id_compte,
            devise: 'MGA',
            id_numcptcentralise: id_numcptcentralise_pc,
            comptegen: compteGen_pc,
            compteaux: compteAux_pc,
            libelleaux: libelleAux_pc,
            libellecompte: libelleGen_pc,
            lettrage: nouveauLettrage,
            datesaisie: new Date(),
        }, { transaction });

        await journals.create({
            id_compte,
            id_dossier,
            id_exercice,
            id_numcpt: id_contre_partie,
            id_ecriture,
            id_journal,
            id_devise,
            debit: debit_cp,
            credit: credit_cp,
            libelle,
            dateecriture: new Date(),
            saisiepar: id_compte,
            devise: 'MGA',
            id_numcptcentralise: id_numcptcentralise_cp,
            comptegen: compteGen_cp,
            compteaux: compteAux_cp,
            libelleaux: libelleAux_cp,
            libellecompte: libelleGen_cp,
            lettrage: nouveauLettrage,
            datesaisie: new Date(),
        }, { transaction });

        await transaction.commit();

        return res.status(200).json({
            state: true,
            message: "Écriture comptable générée avec succès"
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(400).json({
            state: false,
            message: error.message
        });
    }
};

exports.reaffecterLigne = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const {
            id_numcpt_nouveau,
            selectedRows
        } = req.body;

        if (!id_numcpt_nouveau) return res.json({ state: false, message: 'Numéro de compte non trouvé' });
        if (!Array.isArray(selectedRows) || selectedRows.length === 0) {
            return res.json({ state: false, message: 'Aucune ligne sélectionnée' });
        }

        const dossier_pc = await dossierplancomptable.findByPk(id_numcpt_nouveau, { transaction });

        if (!dossier_pc) throw new Error("Compte introuvable");

        const libelleAux = dossier_pc.libelle;
        const compteAux = dossier_pc.compte;

        let libelleGen = '';
        let compteGen = '';
        let id_numcptcentralise = null;

        if (dossier_pc.baseaux_id) {
            const cpt = await dossierplancomptable.findByPk(dossier_pc.baseaux_id, { transaction });
            libelleGen = cpt?.libelle || '';
            compteGen = cpt?.compte || '';
            id_numcptcentralise = cpt?.id || null;
        }

        for (const row of selectedRows) {
            await journals.update(
                {
                    id_numcpt: id_numcpt_nouveau,
                    id_numcptcentralise: id_numcptcentralise,
                    comptegen: compteGen,
                    compteaux: compteAux,
                    libellecompte: libelleGen,
                    libelleaux: libelleAux
                },
                {
                    where: { id: row.id },
                    transaction
                }
            );
        }

        await transaction.commit();

        return res.json({
            state: true,
            message: "Réaffectation effectuée avec succès"
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(400).json({
            state: false,
            message: error.message
        });
    }
};

// Version SSE pour importImmobilisations
const { withSSEProgress } = require('../../Middlewares/sseProgressMiddleware');
const e = require("express");

const importImmobilisationsWithProgressLogic = async (req, res, progress) => {
    try {
        const { data, id_dossier, id_compte, id_exercice } = req.body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            progress.error('Aucune donnée à importer');
            return;
        }

        const totalLines = data.length;
        progress.update(0, totalLines, 'Démarrage...', 0);

        progress.step('Récupération des données de référence...', 5);

        const exercice = await db.exercices.findByPk(Number(id_exercice));
        if (!exercice) {
            progress.error('Exercice introuvable');
            return;
        }

        const tousLesExercices = await db.sequelize.query(
            `SELECT id, date_debut, date_fin FROM exercices WHERE id_dossier = :id_dossier ORDER BY date_debut ASC`,
            {
                replacements: { id_dossier: Number(id_dossier) },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const planComptable = await db.sequelize.query(
            `SELECT id, compte FROM dossierplancomptables WHERE id_dossier = :id_dossier AND id_compte = :id_compte`,
            {
                replacements: { id_dossier: Number(id_dossier), id_compte: Number(id_compte) },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const pcMap = new Map();
        planComptable.forEach(pc => {
            pcMap.set(pc.compte.trim(), pc.id);
        });

        progress.step('Validation des données...', 10);

        const anomalies = [];
        const immobilisationsToInsert = [];
        const deriveCompteAmort = (compte) => {
            if (!compte) return '';
            const s = String(compte);
            if (s.length < 3) return s;
            return s[0] + '8' + s.substring(1, s.length - 1);
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const ligneNum = i + 1;

            // Validation des champs obligatoires
            if (!row.numero_compte || row.numero_compte.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le numéro de compte est obligatoire`);
                continue;
            }
            if (!row.code || row.code.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le code est obligatoire`);
                continue;
            }
            if (!row.intitule || row.intitule.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: L'intitulé est obligatoire`);
                continue;
            }
            if (!row.date_acquisition || row.date_acquisition.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La date d'acquisition est obligatoire`);
                continue;
            }
            if (!row.duree_amort || row.duree_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La durée d'amortissement est obligatoire`);
                continue;
            }
            if (!row.type_amort || row.type_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le type d'amortissement est obligatoire`);
                continue;
            }
            if (!row.montant_ht || row.montant_ht.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le montant HT est obligatoire`);
                continue;
            }

            const dateAcq = new Date(row.date_acquisition.trim());
            if (isNaN(dateAcq.getTime())) {
                anomalies.push(`Ligne ${ligneNum}: La date d'acquisition est invalide`);
                continue;
            }

            const exerciceCorrespondant = tousLesExercices.find(exo => {
                const debut = exo.date_debut ? new Date(exo.date_debut) : null;
                const fin = exo.date_fin ? new Date(exo.date_fin) : null;
                return debut && fin && dateAcq >= debut && dateAcq <= fin;
            });

            if (!exerciceCorrespondant) {
                const annee = dateAcq.getFullYear();
                const dateStr = `${dateAcq.getDate().toString().padStart(2, '0')}/${(dateAcq.getMonth() + 1).toString().padStart(2, '0')}/${annee}`;
                anomalies.push(`Ligne ${ligneNum}: Veuillez créer d'abord l'exercice ${annee} pour importer cette immobilisation (date d'acquisition: ${dateStr})`);
                continue;
            }

            const numeroCompte = row.numero_compte.trim();
            const pc_id = pcMap.get(numeroCompte);
            if (!pc_id) {
                anomalies.push(`Ligne ${ligneNum}: Le compte ${numeroCompte} n'existe pas dans le plan comptable`);
                continue;
            }

            const compte_amortissement = deriveCompteAmort(numeroCompte);
            const dateSortie = (row.date_sortie && row.date_sortie.trim() !== '') ? row.date_sortie.trim() : null;

            const amort_avant_reprise =
                (Number(row.amort_ant) || 0) +
                (Number(row.dotation) || 0);
            const montant_ht = Number(row.montant_ht) - amort_avant_reprise;

            immobilisationsToInsert.push({
                id_dossier: Number(id_dossier),
                id_compte: Number(id_compte),
                id_exercice: exerciceCorrespondant.id,
                pc_id: pc_id,
                code: row.code.trim(),
                intitule: row.intitule.trim(),
                fournisseur: row.fournisseur ? row.fournisseur.trim() : '',
                date_acquisition: row.date_acquisition.trim(),
                duree_amort: parseInt(row.duree_amort.trim(), 10) || 0,
                type_amort: row.type_amort.trim(),
                amort_avant_reprise: parseFloat(amort_avant_reprise) || 0,
                montant_ht: parseFloat(montant_ht) || 0,
                compte_amortissement: compte_amortissement,
                date_reprise: row.date_reprise || null,
                amort_ant: 0,
                date_sortie: dateSortie,
                reprise_immobilisation_comp: amort_avant_reprise !== 0 ? true : false
            });
        }

        if (anomalies.length > 0) {
            progress.error(`${anomalies.length} anomalie(s) détectée(s):\n${anomalies.join('\n')}`);
            return;
        }

        if (immobilisationsToInsert.length === 0) {
            progress.error('Aucune immobilisation valide à importer');
            return;
        }

        await progress.processBatch(
            immobilisationsToInsert,
            async (batch) => {
                await detailsimmo.bulkCreate(batch);
            },
            10,
            90,
            'Importation des immobilisations...'
        );

        progress.step('Finalisation...', 95);

        progress.complete(
            `${immobilisationsToInsert.length} immobilisations ont été importées avec succès`,
            { nbrligne: immobilisationsToInsert.length }
        );

    } catch (error) {
        console.error("Erreur import immobilisations :", error);
        progress.error("Erreur lors de l'import des immobilisations", error);
    }
};

exports.importImmobilisationsWithProgress = withSSEProgress(importImmobilisationsWithProgressLogic, {
    batchSize: 50
});

// exports.updateMontantImmo = async (req, res) => {
//     try {
//         const { id_dossier, id_exercice, id_compte, id_details_immo } = req.body;
//         const data = await updateMontantImmo(id_compte, id_dossier, id_exercice, id_details_immo);
//         return res.json({ data });
//     } catch (error) {
//         console.error("Erreur deleteJournal :", error);
//         return res.status(500).json({
//             state: false,
//             msg: "Une erreur est survenue lors de la suppression des écritures. Veuillez réessayer.",
//             error: error.message
//         });
//     }
// }

exports.getCodeJournalsCompteAssocie = async (req, res) => {
    try {
        const { id_dossier, id_compte } = req.body;
        const codeJournalsData = await codejournals.findAll({
            where: {
                id_dossier,
                id_compte
            },
            raw: true
        })

        const codeJournalsCompteAssocie = codeJournalsData
            .map(val => val.compteassocie)
            .filter(compte => compte && compte.trim() !== "");

        return res.json(codeJournalsCompteAssocie);
    } catch (error) {
        console.error("Erreur deleteJournal :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la suppression des écritures. Veuillez réessayer.",
            error: error.message
        });
    }
}

exports.getJournalsAvecImmo = async (req, res) => {
    try {
        const { id } = req.body;
        const rows = await db.sequelize.query(`
            SELECT 
            j.dateecriture, j.compteaux, j.libelle, c.code, j.piece, j.debit, j.credit
            FROM journals j
            LEFT JOIN codejournals c on j.id_journal = c.id
            WHERE
                j.id = :id
                AND j.id_immob IS NOT NULL
                AND j.id_immob <> 0
        `, {
            replacements: { id },
            type: db.Sequelize.QueryTypes.SELECT,
        })
        return res.json(rows);
    } catch (error) {
        console.error("Erreur deleteJournal :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la suppression des écritures. Veuillez réessayer.",
            error: error.message
        });
    }
}

const ensureCompte = async (compteId, fileId, compteNum, libelle, longeurCompte) => {
    const compte = String(compteNum || '').trim();
    if (!compte) return null;

    const compteFormatted = compte.padEnd(longeurCompte, "0").slice(0, longeurCompte);

    let rows = await db.sequelize.query(
        `SELECT * FROM dossierplancomptables 
         WHERE id_compte = :id_compte 
           AND id_dossier = :id_dossier 
           AND compte = :compte`,
        {
            replacements: { id_compte: compteId, id_dossier: fileId, compte: compteFormatted },
            type: db.Sequelize.QueryTypes.SELECT
        }
    );

    let row = rows[0];

    if (!row) {
        const result = await db.sequelize.query(
            `INSERT INTO dossierplancomptables 
                (id_compte, id_dossier, compte, libelle, nature, typetier, baseaux, pays)
             VALUES
                (:id_compte, :id_dossier, :compte, :libelle, 'General', 'general', :baseaux, 'Madagascar')
             RETURNING *`,
            {
                replacements: {
                    id_compte: compteId,
                    id_dossier: fileId,
                    compte: compteFormatted,
                    libelle: libelle || `Compte ${compteFormatted}`,
                    baseaux: compteFormatted
                },
                type: db.Sequelize.QueryTypes.INSERT
            }
        );

        row = result[0][0];

        await db.sequelize.query(
            `UPDATE dossierplancomptables SET baseaux_id = id WHERE id = :id`,
            { replacements: { id: row.id }, type: db.Sequelize.QueryTypes.UPDATE }
        );
    } else if (libelle && (!row.libelle || row.libelle.trim() === '' || row.libelle === `Compte ${compteFormatted}`)) {
        await db.sequelize.query(
            `UPDATE dossierplancomptables SET libelle = :libelle WHERE id = :id`,
            { replacements: { libelle, id: row.id }, type: db.Sequelize.QueryTypes.UPDATE }
        );
        row.libelle = libelle;
    }

    return row;
};

// const queryCopyJournalDetaille = `
//     WITH BASE AS (
//         SELECT *
//         FROM JOURNALS
//         WHERE COMPTEGEN ~ '^[1-5]'
//         AND ID_COMPTE = :id_compte
//         AND ID_DOSSIER = :id_dossier
//         AND ID_EXERCICE = :id_exerciceN1
//         AND LETTRAGE IS NULL
//     ),

//     AGG AS (
//         SELECT
//             ID_COMPTE,
//             ID_DOSSIER,
//             MIN(COMPTEGEN) AS COMPTEGEN,
//             COMPTEAUX,
//             MIN(DATESAISIE) AS DATESAISIE,
//             MIN(DATEECRITURE) AS DATEECRITURE,
//             MIN(ID_ECRITURE) AS ID_ECRITURE,
//             MIN(ID_NUMCPT) AS ID_NUMCPT,
//             MIN(ID_NUMCPTCENTRALISE) AS ID_NUMCPTCENTRALISE,
//             MIN(PIECE) AS PIECE,
//             SUM(DEBIT) AS DEBIT,
//             SUM(CREDIT) AS CREDIT,
//             MIN(LIBELLECOMPTE) AS LIBELLECOMPTE,
//             MIN(LIBELLEAUX) AS LIBELLEAUX,
//             MIN(PIECEDATE) AS PIECEDATE,
//             MIN(LETTRAGEDATE) AS LETTRAGEDATE,
//             MIN(TAUX) AS TAUX,
//             MIN(LETTRAGE) AS LETTRAGE,
//             MIN(DEVISE) AS DEVISE,
//             SUM(MONTANT_DEVISE) AS MONTANT_DEVISE,
//             MIN(NUM_FACTURE) AS NUM_FACTURE,
//             SUM(DECLISIMOIS) AS DECLISIMOIS,
//             SUM(DECLISIANNEE) AS DECLISIANNEE,
//             BOOL_OR(DECLISI) AS DECLISI,
//             SUM(DECLTVAMOIS) AS DECLTVAMOIS,
//             SUM(DECLTVAANNEE) AS DECLTVAANNEE,
//             BOOL_OR(DECLTVA) AS DECLTVA,
//             BOOL_OR(RAPPROCHER) AS RAPPROCHER,
//             MIN(DATE_RAPPROCHEMENT) AS DATE_RAPPROCHEMENT,
//             MIN(ID_IMMOB) AS ID_IMMOB
//         FROM BASE
//         GROUP BY
//             ID_COMPTE,
//             ID_DOSSIER,
//             COMPTEAUX,
//             ID_ECRITURE
//     ),

//     SPLIT AS (
//         SELECT
//             *,
//             DEBIT AS SPLIT_DEBIT,
//             0 AS SPLIT_CREDIT
//         FROM AGG
//         WHERE DEBIT <> 0

//         UNION ALL

//         SELECT
//             *,
//             0 AS SPLIT_DEBIT,
//             CREDIT AS SPLIT_CREDIT
//         FROM AGG
//         WHERE CREDIT <> 0
//     ),

//     TOTAUX AS (
//         SELECT
//             SUM(SPLIT_DEBIT) AS TOTAL_DEBIT,
//             SUM(SPLIT_CREDIT) AS TOTAL_CREDIT
//         FROM SPLIT
//     )

//     INSERT INTO journals (
//         id_compte, id_dossier, id_exercice, id_ecriture,
//         datesaisie, dateecriture, id_journal, id_numcpt, id_numcptcentralise,
//         piece, libelle, debit, credit, devise, lettrage, saisiepar, modifierpar,
//         piecedate, lettragedate, fichier, id_devise, taux, montant_devise,
//         num_facture, declisimois, declisiannee, declisi, decltvamois, decltvaannee,
//         decltva, rapprocher, date_rapprochement, id_immob,
//         comptegen, compteaux, libelleaux, libellecompte, vraiedate, id_ecriture_n1
//     )

//     SELECT
//         ID_COMPTE, ID_DOSSIER, :id_exercice, :id_ecriture,
//         NOW(), :dateecriture::date, :id_journal,
//         ID_NUMCPT, ID_NUMCPTCENTRALISE,
//         PIECE, 'A nouveau ' || LIBELLECOMPTE,
//         SPLIT_DEBIT,
//         SPLIT_CREDIT,
//         :devise, LETTRAGE,
//         ID_COMPTE, ID_COMPTE,
//         PIECEDATE, LETTRAGEDATE, NULL,
//         :id_devise,
//         TAUX, MONTANT_DEVISE,
//         NUM_FACTURE, DECLISIMOIS, DECLISIANNEE, DECLISI,
//         DECLTVAMOIS, DECLTVAANNEE, DECLTVA,
//         RAPPROCHER, DATE_RAPPROCHEMENT, ID_IMMOB,
//         COMPTEGEN, COMPTEAUX, LIBELLEAUX, LIBELLECOMPTE,
//         DATEECRITURE,
//         ID_ECRITURE
//     FROM SPLIT

//     UNION ALL

//     SELECT
//         B.ID_COMPTE, B.ID_DOSSIER, :id_exercice, :id_ecriture,
//         NOW(), :dateecriture::date, :id_journal,
//         :id_numcpt, :id_numcpt,
//         '', :libelleJournal,
//         CASE WHEN T.TOTAL_DEBIT < T.TOTAL_CREDIT THEN T.TOTAL_CREDIT - T.TOTAL_DEBIT ELSE 0 END,
//         CASE WHEN T.TOTAL_DEBIT > T.TOTAL_CREDIT THEN T.TOTAL_DEBIT - T.TOTAL_CREDIT ELSE 0 END,
//         :devise, NULL,
//         B.ID_COMPTE, B.ID_COMPTE,
//         B.PIECEDATE, B.LETTRAGEDATE, NULL,
//         :id_devise, 0, 0,
//         NULL, 0, 0, FALSE, 0, 0,
//         FALSE, FALSE, NULL, 0,
//         :compte, :compte, :libelle, :libelle,
//         :dateecriture::date, NULL
//     FROM TOTAUX T
//     CROSS JOIN (SELECT * FROM BASE LIMIT 1) B
//     WHERE T.TOTAL_DEBIT <> T.TOTAL_CREDIT
// `;

// const queryCopyJournalNonDetaille = `
//     WITH BASE AS (
//         SELECT *
//         FROM JOURNALS
//         WHERE COMPTEGEN ~ '^[1-5]'
//         AND ID_COMPTE = :id_compte
//         AND ID_DOSSIER = :id_dossier
//         AND ID_EXERCICE = :id_exerciceN1
//         AND LETTRAGE IS NULL
//     ),

//     AGG AS (
//         SELECT
//             ID_COMPTE,
//             ID_DOSSIER,
//             COMPTEGEN,
//             COMPTEAUX,
//             MIN(DATESAISIE) AS DATESAISIE,
//             MIN(ID_ECRITURE) AS ID_ECRITURE,
//             MIN(DATEECRITURE) AS DATEECRITURE,
//             MIN(ID_NUMCPT) AS ID_NUMCPT,
//             MIN(ID_NUMCPTCENTRALISE) AS ID_NUMCPTCENTRALISE,
//             MIN(PIECE) AS PIECE,
//             SUM(DEBIT) AS DEBIT,
//             SUM(CREDIT) AS CREDIT,
//             MIN(LIBELLECOMPTE) AS LIBELLECOMPTE,
//             MIN(LIBELLEAUX) AS LIBELLEAUX,
//             MIN(PIECEDATE) AS PIECEDATE,
//             MIN(LETTRAGEDATE) AS LETTRAGEDATE,
//             MIN(TAUX) AS TAUX,
//             MIN(LETTRAGE) AS LETTRAGE,
//             MIN(DEVISE) AS DEVISE,
//             SUM(MONTANT_DEVISE) AS MONTANT_DEVISE,
//             MIN(NUM_FACTURE) AS NUM_FACTURE,
//             SUM(DECLISIMOIS) AS DECLISIMOIS,
//             SUM(DECLISIANNEE) AS DECLISIANNEE,
//             BOOL_OR(DECLISI) AS DECLISI,
//             SUM(DECLTVAMOIS) AS DECLTVAMOIS,
//             SUM(DECLTVAANNEE) AS DECLTVAANNEE,
//             BOOL_OR(DECLTVA) AS DECLTVA,
//             BOOL_OR(RAPPROCHER) AS RAPPROCHER,
//             MIN(DATE_RAPPROCHEMENT) AS DATE_RAPPROCHEMENT,
//             MIN(ID_IMMOB) AS ID_IMMOB
//         FROM BASE
//         GROUP BY
//             ID_COMPTE,
//             ID_DOSSIER,
//             COMPTEGEN,
//             COMPTEAUX
//     ),

//     SPLIT AS (
//         SELECT
//             *,
//             DEBIT AS SPLIT_DEBIT,
//             0 AS SPLIT_CREDIT
//         FROM AGG
//         WHERE DEBIT <> 0

//         UNION ALL

//         SELECT
//             *,
//             0 AS SPLIT_DEBIT,
//             CREDIT AS SPLIT_CREDIT
//         FROM AGG
//         WHERE CREDIT <> 0
//     ),

//     TOTAUX AS (
//         SELECT
//             SUM(SPLIT_DEBIT) AS TOTAL_DEBIT,
//             SUM(SPLIT_CREDIT) AS TOTAL_CREDIT
//         FROM SPLIT
//     )

//     INSERT INTO journals (
//         id_compte, id_dossier, id_exercice, id_ecriture,
//         datesaisie, dateecriture, id_journal, id_numcpt, id_numcptcentralise,
//         piece, libelle, debit, credit, devise, lettrage, saisiepar, modifierpar,
//         piecedate, lettragedate, fichier, id_devise, taux, montant_devise,
//         num_facture, declisimois, declisiannee, declisi, decltvamois, decltvaannee,
//         decltva, rapprocher, date_rapprochement, id_immob,
//         comptegen, compteaux, libelleaux, libellecompte, vraiedate, id_ecriture_n1
//     )

//     SELECT
//         ID_COMPTE, ID_DOSSIER, :id_exercice, :id_ecriture,
//         NOW(), :dateecriture::date, :id_journal,
//         ID_NUMCPT, ID_NUMCPTCENTRALISE,
//         PIECE, 'A nouveau ' || LIBELLECOMPTE,
//         SPLIT_DEBIT,
//         SPLIT_CREDIT,
//         :devise, LETTRAGE,
//         ID_COMPTE, ID_COMPTE,
//         PIECEDATE, LETTRAGEDATE, NULL,
//         :id_devise,
//         TAUX, MONTANT_DEVISE,
//         NUM_FACTURE, DECLISIMOIS, DECLISIANNEE, DECLISI,
//         DECLTVAMOIS, DECLTVAANNEE, DECLTVA,
//         RAPPROCHER, DATE_RAPPROCHEMENT, ID_IMMOB,
//         COMPTEGEN, COMPTEAUX, LIBELLEAUX, LIBELLECOMPTE,
//         DATEECRITURE,
//         ID_ECRITURE
//     FROM SPLIT

//     UNION ALL

//     SELECT
//         B.ID_COMPTE, B.ID_DOSSIER, :id_exercice, :id_ecriture,
//         NOW(), :dateecriture::date, :id_journal,
//         :id_numcpt, :id_numcpt,
//         '', :libelleJournal,
//         CASE WHEN T.TOTAL_DEBIT < T.TOTAL_CREDIT THEN T.TOTAL_CREDIT - T.TOTAL_DEBIT ELSE 0 END,
//         CASE WHEN T.TOTAL_DEBIT > T.TOTAL_CREDIT THEN T.TOTAL_DEBIT - T.TOTAL_CREDIT ELSE 0 END,
//         :devise, NULL,
//         B.ID_COMPTE, B.ID_COMPTE,
//         B.PIECEDATE, B.LETTRAGEDATE, NULL,
//         :id_devise, 0, 0,
//         NULL, 0, 0, FALSE, 0, 0,
//         FALSE, FALSE, NULL, 0,
//         :compte, :compte, :libelle, :libelle,
//         :dateecriture::date, NULL
//     FROM TOTAUX T
//     CROSS JOIN (SELECT * FROM BASE LIMIT 1) B
//     WHERE T.TOTAL_DEBIT <> T.TOTAL_CREDIT
// `;

const queryCopyJournalDetaille = `
    WITH BASE AS (
        SELECT *
        FROM JOURNALS
        WHERE COMPTEGEN ~ '^[1-5]'
        AND ID_COMPTE = :id_compte
        AND ID_DOSSIER = :id_dossier
        AND ID_EXERCICE = :id_exerciceN1
        AND LETTRAGE IS NULL
    ),

    TOTAUX AS (
        SELECT
            SUM(DEBIT) AS TOTAL_DEBIT,
            SUM(CREDIT) AS TOTAL_CREDIT
        FROM BASE
    )

    INSERT INTO journals (
        id_compte, id_dossier, id_exercice, id_ecriture,
        datesaisie, dateecriture, id_journal, id_numcpt, id_numcptcentralise,
        piece, libelle, debit, credit, devise, lettrage, saisiepar, modifierpar,
        piecedate, lettragedate, fichier, id_devise, taux, montant_devise,
        num_facture, declisimois, declisiannee, declisi, decltvamois, decltvaannee,
        decltva, rapprocher, date_rapprochement, id_immob,
        comptegen, compteaux, libelleaux, libellecompte, vraiedate, id_ecriture_n1
    )

    SELECT
        B.ID_COMPTE, B.ID_DOSSIER, :id_exercice, :id_ecriture,
        NOW(), :dateecriture::date, :id_journal,
        B.ID_NUMCPT, B.ID_NUMCPTCENTRALISE,
        B.PIECE,
        'A nouveau ' || B.LIBELLEAUX,
        B.DEBIT,
        B.CREDIT,
        :devise,
        B.LETTRAGE,
        B.ID_COMPTE,
        B.ID_COMPTE,
        B.PIECEDATE,
        B.LETTRAGEDATE,
        NULL,
        :id_devise,
        B.TAUX,
        B.MONTANT_DEVISE,
        B.NUM_FACTURE,
        B.DECLISIMOIS,
        B.DECLISIANNEE,
        B.DECLISI,
        B.DECLTVAMOIS,
        B.DECLTVAANNEE,
        B.DECLTVA,
        B.RAPPROCHER,
        B.DATE_RAPPROCHEMENT,
        B.ID_IMMOB,
        B.COMPTEGEN,
        B.COMPTEAUX,
        B.LIBELLEAUX,
        B.LIBELLECOMPTE,
        B.DATEECRITURE,
        B.ID_ECRITURE
    FROM BASE B

    UNION ALL

    SELECT
        B.ID_COMPTE, B.ID_DOSSIER, :id_exercice, :id_ecriture,
        NOW(), :dateecriture::date, :id_journal,
        :id_numcpt, :id_numcpt,
        '', :libelleJournal,
        CASE WHEN T.TOTAL_DEBIT < T.TOTAL_CREDIT THEN T.TOTAL_CREDIT - T.TOTAL_DEBIT ELSE 0 END,
        CASE WHEN T.TOTAL_DEBIT > T.TOTAL_CREDIT THEN T.TOTAL_DEBIT - T.TOTAL_CREDIT ELSE 0 END,
        :devise, NULL,
        B.ID_COMPTE, B.ID_COMPTE,
        NULL, NULL, NULL,
        :id_devise, 0, 0,
        NULL, 0, 0, FALSE,
        0, 0, FALSE,
        FALSE, NULL, 0,
        :compte, :compte, :libelle, :libelle,
        :dateecriture::date,
        NULL
    FROM TOTAUX T
    CROSS JOIN (SELECT * FROM BASE LIMIT 1) B
    WHERE T.TOTAL_DEBIT <> T.TOTAL_CREDIT
`;

const queryCopyJournalNonDetaille = `
    WITH BASE AS (
        SELECT *
        FROM JOURNALS
        WHERE COMPTEGEN ~ '^[1-5]'
            AND ID_COMPTE = :id_compte
            AND ID_DOSSIER = :id_dossier
            AND ID_EXERCICE = :id_exerciceN1
            AND LETTRAGE IS NULL
    ),

    AGG AS (
        SELECT
            ID_COMPTE,
            ID_DOSSIER,
            COMPTEGEN,
            COMPTEAUX,
            MIN(LIBELLEAUX) AS LIBELLEAUX,
            MIN(LIBELLECOMPTE) AS LIBELLECOMPTE,
            MIN(ID_NUMCPT) AS ID_NUMCPT,
            MIN(ID_NUMCPTCENTRALISE) AS ID_NUMCPTCENTRALISE,
            MIN(PIECE) AS PIECE,
            SUM(DEBIT) AS DEBIT,
            SUM(CREDIT) AS CREDIT
        FROM BASE
        GROUP BY
            ID_COMPTE,
            ID_DOSSIER,
            COMPTEGEN,
            COMPTEAUX
    ),

    TOTAUX AS (
        SELECT
            SUM(DEBIT) AS TOTAL_DEBIT,
            SUM(CREDIT) AS TOTAL_CREDIT
        FROM AGG
    )

    INSERT INTO journals (
        id_compte, id_dossier, id_exercice, id_ecriture,
        datesaisie, dateecriture, id_journal,
        id_numcpt, id_numcptcentralise,
        piece, libelle, debit, credit,
        devise, lettrage, saisiepar, modifierpar,
        id_devise,
        comptegen, compteaux, libelleaux, libellecompte,
        vraiedate
    )

    SELECT
        A.ID_COMPTE,
        A.ID_DOSSIER,
        :id_exercice,
        :id_ecriture,
        NOW(),
        :dateecriture::date,
        :id_journal,
        A.ID_NUMCPT,
        A.ID_NUMCPTCENTRALISE,
        A.PIECE,
        'A nouveau ' || A.LIBELLEAUX,
        A.DEBIT,
        0,
        :devise,
        NULL,
        A.ID_COMPTE,
        A.ID_COMPTE,
        :id_devise,
        A.COMPTEGEN,
        A.COMPTEAUX,
        A.LIBELLEAUX,
        A.LIBELLECOMPTE,
        :dateecriture::date
    FROM AGG A
    WHERE A.DEBIT <> 0

    UNION ALL

    SELECT
        A.ID_COMPTE,
        A.ID_DOSSIER,
        :id_exercice,
        :id_ecriture,
        NOW(),
        :dateecriture::date,
        :id_journal,
        A.ID_NUMCPT,
        A.ID_NUMCPTCENTRALISE,
        A.PIECE,
        'A nouveau ' || A.LIBELLEAUX,
        0,
        A.CREDIT,
        :devise,
        NULL,
        A.ID_COMPTE,
        A.ID_COMPTE,
        :id_devise,
        A.COMPTEGEN,
        A.COMPTEAUX,
        A.LIBELLEAUX,
        A.LIBELLECOMPTE,
        :dateecriture::date
    FROM AGG A
    WHERE A.CREDIT <> 0

    UNION ALL

    SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        :id_ecriture,
        NOW(),
        :dateecriture::date,
        :id_journal,
        :id_numcpt,
        :id_numcpt,
        '',
        :libelleJournal,
        CASE 
            WHEN T.TOTAL_DEBIT < T.TOTAL_CREDIT 
            THEN T.TOTAL_CREDIT - T.TOTAL_DEBIT 
            ELSE 0 
        END,
        CASE 
            WHEN T.TOTAL_DEBIT > T.TOTAL_CREDIT 
            THEN T.TOTAL_DEBIT - T.TOTAL_CREDIT 
            ELSE 0 
        END,
        :devise,
        NULL,
        :id_compte,
        :id_compte,
        :id_devise,
        :compte,
        :compte,
        :libelle,
        :libelle,
        :dateecriture::date
    FROM TOTAUX T
    WHERE T.TOTAL_DEBIT <> T.TOTAL_CREDIT
`;

const getCompteInfos = async (id_compte, id_dossier, longeurCompte, resultat) => {
    let compteInfo;
    let libelle;
    let debit, credit;
    const montant = Math.abs(resultat);
    if (resultat > 0) {
        const [compte_120] = await Promise.all([
            ensureCompte(id_compte, id_dossier, '120', 'Compte A-nouveau', longeurCompte),
        ]);
        compteInfo = compte_120;
        libelle = 'Résultat bénéficiaire';
        debit = 0;
        credit = montant;
    } else {
        const [compte_129] = await Promise.all([
            ensureCompte(id_compte, id_dossier, '129', 'Compte A-nouveau', longeurCompte),
        ]);
        compteInfo = compte_129;
        libelle = 'Résultat bénéficiaire';
        debit = montant;
        credit = 0;
    }
    return { compteInfo, libelle, debit, credit };
}

exports.genererRan = async (req, res) => {
    try {
        const { id_dossier, id_exercice, id_compte, isDetailled, longeurCompte, dateDebut, idRan, defaultDeviseData } = req.body;

        if (!id_compte) {
            return res.json({ state: false, message: 'Le compte utilisateur est obligatoire' });
        }
        if (!id_exercice) {
            return res.json({ state: false, message: 'L\'éxercice est obligatoire' });
        }
        if (!id_dossier) {
            return res.json({ state: false, message: 'Le dossier est obligatoier' });
        }

        const texte = isDetailled ? 'détaillées' : 'non détaillées';
        let nombreGenere = 0;

        const {
            id_exerciceN1,
        } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

        if (!id_exerciceN1) {
            return res.json({ state: false, message: 'Aucune exercice N-1 trouvée' });
        }

        let createdData = [];

        const querryRan = `
            DELETE FROM journals j
            USING codejournals c
            WHERE 
                j.id_journal = c.id
                AND j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND c.type = 'RAN'
        `;

        await db.sequelize.transaction(async (t) => {
            await db.sequelize.query(querryRan, {
                replacements: { id_dossier, id_exercice, id_compte },
                type: db.Sequelize.QueryTypes.DELETE,
                transaction: t
            });
            const id_ecriture = getDateSaisieNow(id_compte);
            const dateecriture = new Date(dateDebut);
            const devise = defaultDeviseData?.code;
            const id_devise = Number(defaultDeviseData?.id);

            const resultatQuery = `
                    SELECT
                        ROUND((SUM(CREDIT) - SUM(DEBIT))::numeric, 2) AS RESULTAT
                    FROM
                        JOURNALS
                    WHERE
                        COMPTEAUX ~ '^[67]'
                        AND id_dossier = :id_dossier
                        AND id_compte = :id_compte
                        AND id_exercice = :id_exerciceN1
                `;

            const libelleJournal = `Résultat en instance d'afféctation ${dateecriture.getFullYear()}`;

            const resultatData = await db.sequelize.query(resultatQuery, {
                replacements: { id_dossier, id_exerciceN1, id_compte },
                type: db.Sequelize.QueryTypes.SELECT,
                transaction: t
            });

            if (!resultatData || resultatData.length === 0 || resultatData[0].resultat === null) {
                return res.json({ state: false, message: 'Aucune écriture trouvée' });
            }

            const resultat = Number(resultatData[0].resultat);

            if (isDetailled) {

                if (resultat !== 0) {

                    const { compteInfo } = await getCompteInfos(id_compte, id_dossier, longeurCompte, resultat);

                    const id_numcpt = compteInfo?.id;
                    const compte = compteInfo?.compte;
                    const libelleCompte = compteInfo?.libelle;

                    const rows = await db.sequelize.query(queryCopyJournalDetaille + " RETURNING *", {
                        replacements: { id_dossier, id_exerciceN1, id_exercice, id_compte, id_ecriture, dateecriture, id_journal: idRan, devise, id_devise, id_numcpt, compte, libelle: libelleCompte, dateecriture, libelleJournal },
                        transaction: t
                    });

                    createdData = rows;

                    nombreGenere = rows[0].length;

                    const insertedRows = rows[0];

                    if (!insertedRows.length) {
                        return res.json({ state: false, message: 'Aucune écriture à reporter pour le RAN' })
                    }

                    // await db.sequelize.query(`
                    //     INSERT INTO journals (
                    //         id_compte, 
                    //         id_dossier,
                    //         id_exercice, 
                    //         id_ecriture,
                    //         id_numcpt, 
                    //         id_numcptcentralise,
                    //         id_journal,
                    //         dateecriture,
                    //         datesaisie,
                    //         libelle,
                    //         debit, 
                    //         credit,
                    //         devise, 
                    //         id_devise, 
                    //         saisiepar, 
                    //         modifierpar, 
                    //         comptegen,
                    //         compteaux, 
                    //         libelleaux, 
                    //         libellecompte, 
                    //         vraiedate,
                    //         id_immob,
                    //         declisimois,
                    //         declisiannee, 
                    //         declisi, 
                    //         decltvamois,
                    //         decltvaannee,
                    //         decltva,
                    //         rapprocher
                    //     )
                    //     VALUES (
                    //         :id_compte,
                    //         :id_dossier,
                    //         :id_exercice,
                    //         :id_ecriture,
                    //         :id_numcpt,
                    //         :id_numcpt,
                    //         :idRan,
                    //         :dateecriture,
                    //         NOW(),
                    //         :libelle,
                    //         :debit,
                    //         :credit,
                    //         :devise,
                    //         :id_devise,
                    //         :id_compte,
                    //         :id_compte,
                    //         :compte,
                    //         :compte,
                    //         :libelleCompte,
                    //         :libelleCompte,
                    //         :dateecriture,
                    //         0,
                    //         0,
                    //         0,
                    //         false,
                    //         0,
                    //         0,
                    //         false,
                    //         false
                    //     )
                    // `, {
                    //     replacements: {
                    //         id_compte,
                    //         id_dossier,
                    //         id_exercice,
                    //         id_ecriture,
                    //         id_numcpt,
                    //         idRan,
                    //         dateecriture,
                    //         libelle,
                    //         debit,
                    //         credit,
                    //         compte,
                    //         libelleCompte,
                    //         devise,
                    //         id_devise
                    //     },
                    //     type: db.Sequelize.QueryTypes.INSERT,
                    //     transaction: t
                    // });
                } else {
                    return res.json({ state: false, message: 'Le résultat est égal à 0 et la génération automatique a été interrompue' });
                }
            } else {
                if (resultat !== 0) {

                    const { compteInfo } = await getCompteInfos(id_compte, id_dossier, longeurCompte, resultat);

                    const id_numcpt = Number(compteInfo?.id);
                    const libelleCompte = compteInfo?.libelle;
                    const compte = compteInfo?.compte;

                    const rows = await db.sequelize.query(queryCopyJournalNonDetaille + ' RETURNING *', {
                        replacements: { id_dossier, id_exerciceN1, id_exercice, id_compte, id_ecriture, dateecriture, id_journal: idRan, devise, id_devise, id_numcpt, compte, libelle: libelleCompte, dateecriture, libelleJournal },
                        transaction: t
                    })

                    createdData = rows;

                    nombreGenere = rows[0].length;

                } else {
                    return res.json({ state: false, message: 'Le résultat est égal à 0 et la génération automatique a été interrompue' })
                }
            }
        });

        const entries = createdData[0];

        const totals = entries.reduce(
            (acc, item) => {
                acc.totalDebit += item.debit || 0;
                acc.totalCredit += item.credit || 0;
                return acc;
            },
            { totalDebit: 0, totalCredit: 0 }
        );

        console.log('Total Débit :', totals.totalDebit);
        console.log('Total Crédit :', totals.totalCredit);

        return res.json({ state: true, message: `${nombreGenere} 'A-nouveaux ${texte}' ${pluralize(nombreGenere, 'générée')} avec succès` });
    } catch (error) {
        console.error("Erreur deleteJournal :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la suppression des écritures. Veuillez réessayer.",
            error: error.message
        });
    }
}

const queryRan = `
    SELECT id FROM
    codejournals
    WHERE
        id_compte = :id_compte
        AND id_dossier = :id_dossier
        AND TYPE = 'RAN'
`;

exports.deleteJournalRan = async (req, res) => {
    try {
        const { id_dossier, id_exercice, id_compte } = req.body;
        const notLine = 'Aucune ligne de journal A-nouveaux à supprimer';
        let nbSupprimes = 0;

        await db.sequelize.transaction(async (t) => {
            const idRanData = await db.sequelize.query(queryRan, {
                replacements: { id_dossier, id_compte },
                type: db.Sequelize.QueryTypes.SELECT,
                transaction: t
            });
            const idMapped = idRanData.map(val => Number(val.id));

            if (idMapped.length === 0) return res.json({ state: false, message: 'Aucune code journal à nouveaux trouvé' });

            const lettragesData = await db.sequelize.query(
                `
                    SELECT DISTINCT lettrage 
                    FROM JOURNALS 
                    WHERE id_journal IN (:ids) 
                        AND lettrage IS NOT NULL
                        AND id_dossier = :id_dossier
                        AND id_exercice = :id_exercice
                        AND id_compte = :id_compte
                `,
                { replacements: { ids: idMapped, id_dossier, id_exercice, id_compte }, type: db.Sequelize.QueryTypes.SELECT, transaction: t }
            );

            const lettrages = lettragesData.map(l => l.lettrage);

            if (lettrages.length > 0) {
                await db.sequelize.query(
                    `
                        UPDATE JOURNALS 
                        SET lettrage = NULL
                        WHERE lettrage IN (:lettrages) 
                            AND id_journal NOT IN (:ids)
                            AND id_dossier = :id_dossier
                            AND id_exercice = :id_exercice
                            AND id_compte = :id_compte
                    `,
                    { replacements: { lettrages, ids: idMapped, id_dossier, id_exercice, id_compte }, type: db.Sequelize.QueryTypes.UPDATE, transaction: t }
                );
            }

            const [deletedRows] = await db.sequelize.query(
                `
                    DELETE FROM JOURNALS 
                    WHERE id_ecriture IN (
                        SELECT ID_ECRITURE
                        FROM JOURNALS J
                        INNER JOIN CODEJOURNALS C ON C.ID = J.ID_JOURNAL
                        WHERE J.ID_DOSSIER = :id_dossier
                        AND J.ID_COMPTE = :id_compte
                        AND J.ID_EXERCICE = :id_exercice
                        AND C.TYPE = 'RAN'
                    )
                    AND id_dossier = :id_dossier
                    AND id_exercice = :id_exercice
                    AND id_compte = :id_compte
                    RETURNING id_ecriture;
                `,
                {
                    replacements: { id_dossier, id_exercice, id_compte },
                    type: db.Sequelize.QueryTypes.RAW,
                    transaction: t
                }
            );

            nbSupprimes = deletedRows.length;
        });

        return res.json({ state: true, message: nbSupprimes === 0 ? notLine : `${nbSupprimes} A-nouveaux ${pluralize(nbSupprimes, 'supprimées')} avec succès` });

    } catch (error) {
        console.error("Erreur deleteJournal :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la suppression des écritures. Veuillez réessayer.",
            error: error.message
        });
    }
};

exports.getCompteConsultation = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, filtrageCompte } = req.body;

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({
                state: false,
                msg: "id_compte, id_dossier et id_exercice sont obligatoires"
            });
        }

        let havingCondition = '';
        if (filtrageCompte === "1") {
            havingCondition = `HAVING SUM(j.debit) <> 0 OR SUM(j.credit) <> 0`;
        } else if (filtrageCompte === "2") {
            havingCondition = `HAVING ABS(SUM(j.debit) - SUM(j.credit)) < 0.01`;
        } else if (filtrageCompte === "3") {
            havingCondition = `HAVING ABS(SUM(j.debit) - SUM(j.credit)) >= 0.01`;
        }

        const query = `
            SELECT 
                c.id,
                c.compte,
                c.libelle,
                d.dossier
            FROM dossierplancomptables c
            LEFT JOIN dossiers d
                ON d.id = c.id_dossier
            LEFT JOIN journals j
                ON j.compteaux = c.compte
                AND j.id_compte = :id_compte
                AND j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
            WHERE c.id_compte = :id_compte
              AND c.id_dossier = :id_dossier
            GROUP BY c.id, c.compte, c.libelle, d.dossier
            ${havingCondition}
            ORDER BY c.compte
        `;

        const comptes = await db.sequelize.query(query, {
            replacements: { id_compte, id_dossier, id_exercice },
            type: db.Sequelize.QueryTypes.SELECT
        });

        comptes.sort((a, b) => {
            const regex = /^(\d+)(.*)$/;
            const matchA = (a.compte || "").match(regex);
            const matchB = (b.compte || "").match(regex);

            const numA = matchA ? parseInt(matchA[1], 10) : 0;
            const numB = matchB ? parseInt(matchB[1], 10) : 0;

            if (numA !== numB) return numA - numB;

            const strA = matchA ? matchA[2] : "";
            const strB = matchB ? matchB[2] : "";

            return strA.localeCompare(strB);
        });

        return res.json({ state: true, comptes });

    } catch (error) {
        console.error("Erreur getCompteConsultation :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la récupération des comptes. Veuillez réessayer.",
            error: error.message
        });
    }
};

exports.getJournalsConsultation = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, valSelectedCompte } = req.body;
        if (!id_compte || !id_dossier || !id_exercice || !valSelectedCompte) {
            return res.status(400).json({
                state: false,
                msg: "Compte, dossier, exercice et numéro de compte sont obligatoires"
            });
        }

        const queryJournals = `
            SELECT 
                j.id,
                d.dossier,
                j.id_immob,
                j.id_ecriture,
                j.id_dossier,
                j.dateecriture,
                j.id_journal,
                cj.type AS journal,
                j.piece, 
                j.libelle,
                j.fichier,
                j.debit, 
                j.credit, 
                j.lettrage
            FROM journals j
            LEFT JOIN codejournals cj
                ON j.id_journal = cj.id
            LEFT JOIN dossiers d
                ON j.id_dossier = d.id
            WHERE 
                j.id_dossier = :id_dossier
                AND j.id_compte = :id_compte
                AND j.id_exercice = :id_exercice
                AND j.id_numcpt = :valSelectedCompte
        `;

        const data = await db.sequelize.query(queryJournals, {
            replacements: { id_compte, id_dossier, id_exercice, valSelectedCompte },
            type: db.Sequelize.QueryTypes.SELECT
        });

        return res.json(data);

    } catch (error) {
        console.error("Erreur getCompteConsultation :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la récupération des comptes. Veuillez réessayer.",
            error: error.message
        });
    }
}

exports.getJournalsEcriture = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, id_ecriture } = req.body;
        if (!id_compte) {
            return res.json({ state: false, message: 'Le compte utilisateur est obligatoire' });
        }
        if (!id_exercice) {
            return res.json({ state: false, message: 'L\'éxercice est obligatoire' });
        }
        if (!id_dossier) {
            return res.json({ state: false, message: 'Le dossier est obligatoier' });
        }
        if (!id_ecriture) {
            return res.json({ state: false, message: 'L\'écriture est obligatoire' });
        }

        const queryEcritures = `
            SELECT * FROM journals
            WHERE 
                id_dossier = :id_dossier
                AND id_exercice = :id_exercice
                AND id_compte = :id_compte
                AND id_ecriture = :id_ecriture         
        `;

        const rows = await db.sequelize.query(queryEcritures, {
            replacements: {
                id_dossier,
                id_compte,
                id_exercice,
                id_ecriture
            },
            type: db.Sequelize.QueryTypes.SELECT
        });

        return res.json({ state: true, rows });

    } catch (error) {
        console.error("Erreur getCompteConsultation :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la récupération des comptes. Veuillez réessayer.",
            error: error.message
        });
    }
}

exports.controleLettrageDesequilibre = async (req, res) => {
    try {
        const { id_dossier, id_exercice, id_compte } = req.body;

        if (!id_compte) {
            return res.json({ state: false, message: 'Le compte utilisateur est obligatoire' });
        }
        if (!id_exercice) {
            return res.json({ state: false, message: 'L\'éxercice est obligatoire' });
        }
        if (!id_dossier) {
            return res.json({ state: false, message: 'Le dossier est obligatoier' });
        }

        const {
            id_exerciceN1,
        } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

        if (!id_exerciceN1) {
            return res.json(({ state: false, noExercice: true, message: 'Exercice antérieur non trouvé' }));
        }

        const queryLettrageNonEquilibre = `
            SELECT
                MAX(J.id) AS id,
                J.LETTRAGE,
                J.COMPTEAUX AS COMPTE,
                SUM(J.DEBIT) AS TOTAL_DEBIT,
                SUM(J.CREDIT) AS TOTAL_CREDIT,
                SUM(J.DEBIT) - SUM(J.CREDIT) AS SOLDE
            FROM JOURNALS J
            WHERE
                J.ID_DOSSIER = :id_dossier
                AND J.ID_EXERCICE = :id_exerciceN1
                AND J.ID_COMPTE = :id_compte
                AND COALESCE(J.LETTRAGE, '') <> ''
            GROUP BY
                J.LETTRAGE,
                J.COMPTEAUX
            HAVING
                SUM(J.DEBIT) <> SUM(J.CREDIT)
            ORDER BY
                J.LETTRAGE
        `;

        const data = await db.sequelize.query(queryLettrageNonEquilibre, {
            replacements: {
                id_compte,
                id_dossier,
                id_exerciceN1
            },
            type: db.sequelize.QueryTypes.SELECT
        })

        if (data.length > 0) {
            return res.json({ state: false, data })
        }

        return res.json({ state: true })

    } catch (error) {
        console.error("Erreur getCompteConsultation :", error);
        return res.status(500).json({
            state: false,
            msg: "Une erreur est survenue lors de la récupération des comptes. Veuillez réessayer.",
            error: error.message
        });
    }
}