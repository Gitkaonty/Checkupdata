require('dotenv').config();
const db = require("../../../Models");
const Sequelize = require('sequelize');

const users = db.users;
const portefeuille = db.portefeuille;
const dossiers = db.dossiers;

exports.getAllPortefeuille = async (req, res) => {
    try {
        const { id_compte } = req.params;
        const protefeuilles = await portefeuille.findAll({
            where: { id_compte },
            order: [['id', 'ASC']]
        });

        const portefeuillesMapped = protefeuilles.map(val => ({
            id: Number(val.id),
            nom: val.nom
        }));

        return res.status(200).json({
            message: "Portefeuilles reçus avec succès",
            state: true,
            list: portefeuillesMapped
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur serveur",
            state: false,
            error: error.message
        });
    }
}

exports.addOrUpdatePortefeuille = async (req, res) => {
    try {
        const { idPortefeuille, nom, id_compte } = req.body;
        if (!nom) return res.status(409).json({ message: 'Nom du portefeuille requis', state: false });

        let resData = {};

        if (!idPortefeuille) {
            await portefeuille.create({
                nom,
                id_compte
            });
            resData.state = true;
            resData.msg = "Nouvelle ligne sauvegardée avec succès.";
        } else {
            const id = Number(idPortefeuille);
            const existingPortefeuille = await portefeuille.findOne({ where: { id } });

            if (!existingPortefeuille) {
                await portefeuille.create({ nom, id_compte });
                resData.state = true;
                resData.msg = "Nouvelle ligne sauvegardée avec succès.";
            } else {
                const [updatedRows] = await portefeuille.update({ nom, id_compte }, { where: { id } });
                resData.state = updatedRows > 0;
                resData.msg = updatedRows > 0 ? "Modification effectuée avec succès." : "Aucune modification effectuée.";
            }
        }

        return res.json(resData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.deletePortefeuille = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (!id) {
            return res.status(409).json({ message: 'Portefeuille non trouvé', state: false });
        }

        await users.update(
            {
                id_portefeuille: Sequelize.literal(`array_remove(id_portefeuille, ${id})`)
            },
            {
                where: {
                    id_portefeuille: { [Sequelize.Op.contains]: [id] }
                }
            }
        );

        await dossiers.update(
            {
                id_portefeuille: Sequelize.literal(`array_remove(id_portefeuille, ${id})`)
            },
            {
                where: {
                    id_portefeuille: { [Sequelize.Op.contains]: [id] }
                }
            }
        );

        const result = await portefeuille.destroy({ where: { id } });

        if (result) {
            return res.status(200).json({
                state: true,
                message: `Portefeuille supprimé avec succès`
            });
        } else {
            return res.status(400).json({
                state: false,
                message: `Erreur lors de la suppression du portefeuille`
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};
