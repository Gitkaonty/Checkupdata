const db = require("../../Models");
const { Op } = require("sequelize");

const revuAnalytiqueModel = db.revuAnalytique;

// Obtenir ou créer les stats d'une revue analytique
exports.getOrCreateStats = async (req, res) => {
    try {
        const { id_compte, id_exercice, id_dossier, id_periode, compte, type_revue } = req.body;

        if (!id_compte || !id_exercice || !id_dossier || !compte || !type_revue) {
            return res.status(400).json({
                state: false,
                message: "Champs obligatoires manquants"
            });
        }

        const whereClause = {
            id_compte,
            id_exercice,
            id_dossier,
            compte,
            type_revue
        };

        if (id_periode) {
            whereClause.id_periode = id_periode;
        }

        if (!revuAnalytiqueModel) {
            return res.status(500).json({
                state: false,
                message: "Modèle revuAnalytique non initialisé",
            });
        }

        let revu = await revuAnalytiqueModel.findOne({ where: whereClause });

        if (!revu) {
            revu = await revuAnalytiqueModel.create({
                id_compte,
                id_exercice,
                id_dossier,
                id_periode: id_periode || null,
                compte,
                type_revue,
                nbr_anomalies: 0,
                anomalies_valides: 0
            });
        }

        return res.json({
            state: true,
            data: revu
        });
    } catch (error) {
        console.error('Erreur dans getOrCreateStats:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// Incrémenter le nombre d'anomalies
exports.incrementAnomaly = async (req, res) => {
    try {
        const { id_compte, id_exercice, id_dossier, id_periode, compte, type_revue } = req.body;

        if (!id_compte || !id_exercice || !id_dossier || !compte || !type_revue) {
            return res.status(400).json({
                state: false,
                message: "Champs obligatoires manquants"
            });
        }

        const whereClause = {
            id_compte,
            id_exercice,
            id_dossier,
            compte,
            type_revue
        };

        if (id_periode) {
            whereClause.id_periode = id_periode;
        }

        if (!revuAnalytiqueModel) {
            return res.status(500).json({
                state: false,
                message: "Modèle revuAnalytique non initialisé",
            });
        }

        let revu = await revuAnalytiqueModel.findOne({ where: whereClause });

        if (!revu) {
            revu = await revuAnalytiqueModel.create({
                id_compte,
                id_exercice,
                id_dossier,
                id_periode: id_periode || null,
                compte,
                type_revue,
                nbr_anomalies: 1,
                anomalies_valides: 0
            });
        } else {
            await revu.increment('nbr_anomalies', { by: 1 });
            revu = await revu.reload();
        }

        return res.json({
            state: true,
            data: revu,
            message: "Anomalie ajoutée"
        });
    } catch (error) {
        console.error('Erreur dans incrementAnomaly:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// Décrémenter le nombre d'anomalies
exports.decrementAnomaly = async (req, res) => {
    try {
        const { id_compte, id_exercice, id_dossier, id_periode, compte, type_revue } = req.body;

        if (!id_compte || !id_exercice || !id_dossier || !compte || !type_revue) {
            return res.status(400).json({
                state: false,
                message: "Champs obligatoires manquants"
            });
        }

        const whereClause = {
            id_compte,
            id_exercice,
            id_dossier,
            compte,
            type_revue
        };

        if (id_periode) {
            whereClause.id_periode = id_periode;
        }

        if (!revuAnalytiqueModel) {
            return res.status(500).json({
                state: false,
                message: "Modèle revuAnalytique non initialisé",
            });
        }

        const revu = await revuAnalytiqueModel.findOne({ where: whereClause });

        if (revu && revu.nbr_anomalies > 0) {
            await revu.decrement('nbr_anomalies', { by: 1 });
            await revu.reload();
        }

        return res.json({
            state: true,
            data: revu,
            message: "Anomalie supprimée"
        });
    } catch (error) {
        console.error('Erreur dans decrementAnomaly:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// Valider une anomalie
exports.validateAnomaly = async (req, res) => {
    try {
        const { id_compte, id_exercice, id_dossier, id_periode, compte, type_revue, validated } = req.body;

        if (!id_compte || !id_exercice || !id_dossier || !compte || !type_revue) {
            return res.status(400).json({
                state: false,
                message: "Champs obligatoires manquants"
            });
        }

        const whereClause = {
            id_compte,
            id_exercice,
            id_dossier,
            compte,
            type_revue
        };

        // Filtrer par id_periode si fourni (pour toutes les revues)
        if (id_periode) {
            whereClause.id_periode = id_periode;
        } else {
            whereClause.id_periode = null;
        }

        const revuAnalytiqueModel = db.revuAnalytique;
        if (!revuAnalytiqueModel) {
            return res.status(500).json({
                state: false,
                message: "Modèle revuAnalytique non initialisé",
            });
        }

        let revu = await revuAnalytiqueModel.findOne({ where: whereClause });

        if (!revu) {
            // Créer l'entrée si elle n'existe pas (au lieu de retourner 404)
            revu = await revuAnalytiqueModel.create({
                id_compte,
                id_exercice,
                id_dossier,
                id_periode: id_periode || null,
                compte,
                type_revue,
                nbr_anomalies: 0,
                anomalies_valides: validated ? 1 : 0
            });
        } else {
            // Mettre à jour l'entrée existante
            if (validated) {
                await revu.increment('anomalies_valides', { by: 1 });
            } else {
                await revu.decrement('anomalies_valides', { by: 1 });
            }
            revu = await revu.reload();
        }

        return res.json({
            state: true,
            data: revu,
            message: validated ? "Anomalie validée" : "Validation annulée"
        });
    } catch (error) {
        console.error('Erreur dans validateAnomaly:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// Obtenir les totaux pour la synthèse
exports.getTotals = async (req, res) => {
    try {
        const { id_compte, id_exercice, id_dossier, id_periode, type_revue, date_debut, date_fin } = req.query;

        const idCompteNum = Number(id_compte);
        const idExerciceNum = Number(id_exercice);
        const idDossierNum = Number(id_dossier);
        const idPeriodeNum = id_periode !== undefined && id_periode !== null && id_periode !== '' ? Number(id_periode) : null;

        if (!id_compte || !id_exercice || !id_dossier || !type_revue) {
            return res.status(400).json({
                state: false,
                message: "Paramètres manquants"
            });
        }

        if (!Number.isFinite(idCompteNum) || !Number.isFinite(idExerciceNum) || !Number.isFinite(idDossierNum)) {
            return res.status(400).json({
                state: false,
                message: "Paramètres invalides"
            });
        }

        // Requête SQL directe pour gérer correctement les NULL
        let wherePeriode = '';
        let joinWithPeriodes = '';

        // Pour analytiqueNN1 (N/N-1), ne pas filtrer par période car c'est une revue d'exercice complet
        // Pour analytiqueMensuelle, appliquer le filtre par période si fourni
        if (type_revue === 'analytiqueNN1') {
            // N/N-1 ne filtre pas par période - c'est toujours l'exercice complet
            wherePeriode = '';
        } else if (idPeriodeNum !== null && Number.isFinite(idPeriodeNum)) {
            wherePeriode = `AND ra.id_periode = ${idPeriodeNum}`;
        } else {
            wherePeriode = `AND ra.id_periode IS NULL`;
        }

        // Si des dates sont fournies et ce n'est pas N/N-1, ajouter une jointure avec les périodes
        if (date_debut && date_fin && type_revue !== 'analytiqueNN1') {
            joinWithPeriodes = `
                INNER JOIN periodes p ON ra.id_periode = p.id
                AND p.date_debut >= '${date_debut}'
                AND p.date_fin <= '${date_fin}'
            `;
            if (idPeriodeNum !== null && Number.isFinite(idPeriodeNum)) {
                wherePeriode = `AND ra.id_periode = ${idPeriodeNum}`;
            }
        }

        const query = `
            SELECT 
                ${type_revue === 'analytiqueNN1'
                ? `COUNT(DISTINCT CASE WHEN ra.anomalies_valides > 0 OR ra.nbr_anomalies > 0 THEN ra.compte END) as total_anomalies,`
                : `COALESCE(SUM(ra.nbr_anomalies), 0) as total_anomalies,`
            }
                COALESCE(SUM(ra.anomalies_valides), 0) as total_valides,
                COUNT(DISTINCT ra.compte) as nombre_comptes
            FROM revu_analytique ra
            ${joinWithPeriodes}
            WHERE ra.id_compte = ${idCompteNum}
            AND ra.id_exercice = ${idExerciceNum}
            AND ra.id_dossier = ${idDossierNum}
            AND ra.type_revue = '${type_revue}'
            ${wherePeriode}
        `;

        const results = await db.sequelize.query(query, {
            type: db.Sequelize.QueryTypes.SELECT,
            raw: true
        });

        const result = results[0] || {
            total_anomalies: 0,
            total_valides: 0,
            nombre_comptes: 0
        };

        const totalAnomalies = parseInt(result.total_anomalies) || 0;
        const totalValides = parseInt(result.total_valides) || 0;
        const restantes = totalAnomalies - totalValides;

        return res.json({
            state: true,
            data: {
                total_anomalies: totalAnomalies,
                total_valides: totalValides,
                restantes: restantes,
                nombre_comptes: parseInt(result.nombre_comptes) || 0
            }
        });
    } catch (error) {
        console.error('Erreur dans getTotals:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// Obtenir les détails par compte
exports.getDetailsByCompte = async (req, res) => {
    try {
        const { id_compte, id_exercice, id_dossier, id_periode, type_revue } = req.query;

        const idCompteNum = Number(id_compte);
        const idExerciceNum = Number(id_exercice);
        const idDossierNum = Number(id_dossier);
        const idPeriodeNum = id_periode !== undefined && id_periode !== null && id_periode !== '' ? Number(id_periode) : null;

        if (!id_compte || !id_exercice || !id_dossier || !type_revue) {
            return res.status(400).json({
                state: false,
                message: "Paramètres manquants"
            });
        }

        if (!Number.isFinite(idCompteNum) || !Number.isFinite(idExerciceNum) || !Number.isFinite(idDossierNum)) {
            return res.status(400).json({
                state: false,
                message: "Paramètres invalides"
            });
        }

        const whereClause = {
            id_compte: idCompteNum,
            id_exercice: idExerciceNum,
            id_dossier: idDossierNum,
            type_revue
        };

        if (idPeriodeNum !== null && Number.isFinite(idPeriodeNum)) {
            whereClause.id_periode = idPeriodeNum;
        }

        if (!revuAnalytiqueModel) {
            return res.status(500).json({
                state: false,
                message: "Modèle revuAnalytique non initialisé",
            });
        }

        const details = await revuAnalytiqueModel.findAll({
            where: whereClause,
            order: [['compte', 'ASC']]
        });

        return res.json({
            state: true,
            data: details
        });
    } catch (error) {
        console.error('Erreur dans getDetailsByCompte:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};
