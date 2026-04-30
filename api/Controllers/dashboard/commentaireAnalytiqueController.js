const db = require('../../Models');

// Ajouter ou modifier un commentaire
const addOrUpdateCommentaire = async (req, res) => {
    try {
        const commentaireAnalytique = db.commentaireAnalytique;
        if (!commentaireAnalytique) {
            return res.status(500).json({
                state: false,
                message: "Modèle commentaireAnalytique non initialisé",
            });
        }

        const { id_compte, id_exercice, id_dossier, id_periode, compte, commentaire, valide_anomalie } = req.body;

        if (!id_compte || !id_exercice || !id_dossier || !compte) {
            return res.status(400).json({
                state: false,
                message: "Champs obligatoires manquants"
            });
        }

        // Construire la clause where pour la recherche
        const whereClause = {
            id_compte,
            id_exercice,
            id_dossier,
            compte
        };

        // Pour analytiqueNN1 (N/N-1), ne pas filtrer par id_periode car c'est une revue d'exercice complet
        // Pour analytiqueMensuelle, utiliser id_periode si fourni
        if (id_periode !== undefined) {
            whereClause.id_periode = id_periode;
        }

        // Vérifier si un commentaire existe déjà pour ce compte
        const existingComment = await commentaireAnalytique.findOne({
            where: whereClause
        });

        let result;
        if (existingComment) {
            // Mettre à jour le commentaire existant
            result = await existingComment.update({
                commentaire: commentaire || '',
                valide_anomalie: valide_anomalie !== undefined ? valide_anomalie : false
            });
        } else {
            // Créer un nouveau commentaire
            result = await commentaireAnalytique.create({
                id_compte,
                id_exercice,
                id_dossier,
                id_periode: id_periode || null,
                compte,
                commentaire: commentaire || '',
                valide_anomalie: valide_anomalie !== undefined ? valide_anomalie : false
            });
        }

        return res.json({
            state: true,
            message: existingComment ? "Commentaire mis à jour" : "Commentaire ajouté",
            data: result
        });

    } catch (error) {
        console.error('Erreur dans addOrUpdateCommentaire:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// Récupérer les commentaires pour un compte
const getCommentairesByCompte = async (req, res) => {
    try {
        const commentaireAnalytique = db.commentaireAnalytique;
        if (!commentaireAnalytique) {
            return res.status(500).json({
                state: false,
                message: "Modèle commentaireAnalytique non initialisé ",
            });
        }

        const { id_compte, id_exercice, id_dossier, compte } = req.params;

        const commentaire = await commentaireAnalytique.findOne({
            where: {
                id_compte,
                id_exercice,
                id_dossier,
                compte
            }
        });

        return res.json({
            state: true,
            data: commentaire
        });

    } catch (error) {
        console.error('Erreur dans getCommentairesByCompte:', error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

module.exports = {
    addOrUpdateCommentaire,
    getCommentairesByCompte
};
