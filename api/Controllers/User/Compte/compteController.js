require('dotenv').config();
const db = require("../../../Models");

const userscomptes = db.userscomptes;
const users = db.users;
const abonnements = db.abonnements;
const paiements = db.paiements;

exports.getAllComptes = async (req, res) => {
    try {
        const comptes = await userscomptes.findAll({})
        if (!comptes) {
            return res.status(409).json({ message: 'Comptes non trouvés', state: false })
        }
        return res.status(200).json({ message: "Comptes reçues aves succès", state: true, list: comptes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.addCompte = async (req, res) => {
    try {
        const { nom, email, raison_sociale, numero_telephone, type_abonnement, nif, stat } = req.body;
        if (!nom || !email || !raison_sociale || !numero_telephone || !type_abonnement || !nif || !stat) {
            return res.status(409).json({ message: 'Données non reçues', state: false })
        }

        // Vérification des doublons
        const duplicate = await userscomptes.findOne({
            where: { email }
        });

        if (duplicate) {
            return res.status(409).json({
                message: 'Cet email existe déjà. Veuillez saisir un nouvel email',
                state: false
            });
        }

        await userscomptes.create({
            nom,
            email,
            raison_sociale,
            numero_telephone,
            type_abonnement,
            nif,
            stat
        })
        return res.status(200).json({ message: "Compte ajouté avec succès", state: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.deleteSelectedCompte = async (req, res) => {
    try {
        const { compteIds } = req.body;

        if (!Array.isArray(compteIds)) {
            return res.status(409).json({ message: 'Ids des comptes non trouvé', state: false });
        }

        const result = await userscomptes.destroy({
            where: {
                id: compteIds
            }
        })

        await users.destroy({
            where: {
                compte_id: compteIds
            }
        })

        return res.status(200).json({
            state: true,
            message: `${result} compte(s) supprimé(s) avec succès`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.getAllAbonnement = async (req, res) => {
    try {
        const abonnement = await abonnements.findAll(
            {
                include: [
                    {
                        model: userscomptes,
                        attributes: ['nom'],
                        as: 'userscompte',
                        required: true,
                    }
                ],
                order: [['id', 'ASC']]
            },
        );

        const today = new Date();

        const mappedData = await Promise.all(
            abonnement.map(async (abonnement) => {
                const { userscompte, ...rest } = abonnement.toJSON();

                const isExpired = new Date(abonnement.date_fin) < today;

                if (abonnement.expire !== isExpired) {
                    await abonnements.update(
                        { expire: isExpired },
                        { where: { id: abonnement.id } }
                    );
                }

                return {
                    ...rest,
                    nom: userscompte?.nom || null,
                    expire: isExpired,
                };
            })
        );

        if (!mappedData) {
            return res.status(409).json({ message: 'Abonnements non trouvés', state: false })
        }
        return res.status(200).json({ message: "Abonnements reçues aves succès", state: true, list: mappedData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.getAllPaiement = async (req, res) => {
    try {
        const paiement = await paiements.findAll(
            {
                include: [
                    {
                        model: userscomptes,
                        attributes: ['nom'],
                        as: 'userscompte',
                        required: true,
                    }
                ],
                order: [['id', 'ASC']]
            },
        );

        const mappedData = await Promise.all(
            paiement.map(async (journal) => {
                const { userscompte, ...rest } = journal.toJSON();
                return {
                    ...rest,
                    nom: userscompte?.nom || null,
                };
            }));

        if (!mappedData) {
            return res.status(409).json({ message: 'Paiements non trouvés', state: false })
        }
        return res.status(200).json({ message: "Paiements reçues aves succès", state: true, list: mappedData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.addAbonnement = async (req, res) => {
    try {
        const { compte_id, date_debut, date_fin } = req.body;
        if (!compte_id || !date_debut || !date_fin) {
            return res.status(409).json({ message: 'Données non reçues', state: false });
        }
        await abonnements.create(req.body);
        return res.status(200).json({ message: "Abonnement ajouté avec succès", state: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.addPaiement = async (req, res) => {
    try {
        const { compte_id, compte, date_paiement, montant_paye, mode_paiement, periode_date_debut, periode_date_fin } = req.body;
        if (!compte_id || !compte || !date_paiement || !montant_paye || !mode_paiement || !periode_date_debut || !periode_date_fin) {
            return res.status(409).json({ message: 'Données non reçues', state: false });
        }
        await paiements.create(req.body);
        return res.status(200).json({ message: "Paiements ajouté avec succès", state: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.deleteSelectedAbonnement = async (req, res) => {
    try {
        const { abonnementIds } = req.body;
        if (!Array.isArray(abonnementIds)) {
            return res.status(409).json({ message: 'Ids des abonnements non trouvé', state: false })
        }
        const abonnementDeleted = await abonnements.destroy({
            where: {
                id: abonnementIds
            }
        })
        return res.status(200).json({ message: `${abonnementDeleted} ${pluralize(abonnementDeleted, 'abonnement')} ${pluralize(abonnementDeleted, 'supprimé')} avec succès`, state: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.deleteSelectedPaiement = async (req, res) => {
    try {
        const { paiementIds } = req.body;
        if (!Array.isArray(paiementIds)) {
            return res.status(409).json({ message: 'Ids des paiemnents non trouvé', state: false })
        }
        const paiementDeleted = await paiements.destroy({
            where: {
                id: paiementIds
            }
        })
        return res.status(200).json({ message: `${paiementDeleted} ${pluralize(paiementDeleted, 'abonnement')} ${pluralize(paiementDeleted, 'supprimé')} avec succès`, state: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}