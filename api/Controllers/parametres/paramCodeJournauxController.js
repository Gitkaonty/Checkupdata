const db = require("../../Models");
const Sequelize = require('sequelize');

const codejournals = db.codejournals;

const getListeCodeJournaux = async (req, res) => {
    try {
        const id_dossier = req.params.id;

        let resData = {
            state: false,
            msg: 'une erreur est survenue lors du traitement.',
            list: []
        }

        const list = await codejournals.findAll({
            where: {
                id_dossier
            },
            order: [['code', 'DESC']]
        });

        if (list) {
            resData.state = true;
            resData.list = list;
        } else {
            resData.state = false;
            resData.msg = 'une erreur est survenue lors du traitement.';
        }

        return res.json(resData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
}

const addCodeJournal = async (req, res) => {
    try {
        const { idCompte, idDossier, idCode, code, libelle, type, compteassocie } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue au moment du traitement.',
        }

        const testIfExist = await codejournals.findAll({
            where: { id: idCode, id_dossier: idDossier }
        });

        if (testIfExist.length === 0) {
            // Vérifier doublon à la création
            const duplicateCreate = await codejournals.findOne({
                where: { id_dossier: idDossier, code: code }
            });
            if (duplicateCreate) {
                resData.state = false;
                resData.msg = "Ce code journal existe déjà.";
                return res.json(resData);
            }
            const addCode = await codejournals.create({
                id_compte: idCompte,
                id_dossier: idDossier,
                code: code,
                libelle: libelle,
                type: type,
                compteassocie: compteassocie
            });

            if (addCode) {
                resData.state = true;
                resData.msg = "Code journal sauvegardé avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        } else {
            // Vérifier doublon à la mise à jour (exclure l'enregistrement courant)
            const duplicateUpdate = await codejournals.findOne({
                where: {
                    id_dossier: idDossier,
                    code: code,
                    id: { [Sequelize.Op.ne]: idCode }
                }
            });
            if (duplicateUpdate) {
                resData.state = false;
                resData.msg = "Ce code journal existe déjà.";
                return res.json(resData);
            }
            const ModifyCode = await codejournals.update(
                {
                    id_compte: idCompte,
                    id_dossier: idDossier,
                    code: code,
                    libelle: libelle,
                    type: type,
                    compteassocie: compteassocie
                },
                {
                    where: { id: idCode }
                }
            );

            if (ModifyCode) {
                resData.state = true;
                resData.msg = "Modification effectuée avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        }

        return res.json(resData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
}

const codeJournauxDelete = async (req, res) => {
    try {
        const { fileId, compteId, idToDelete } = req.body;
        const fileIdNum = Number(fileId);
        const compteIdNum = Number(compteId);
        const idToDeleteNum = Number(idToDelete);

        let resData = {
            state: false,
            msg: 'une erreur est survenue',
        }

        let deletedCodeJournal = await codejournals.destroy({
            where: {
                id: idToDeleteNum,
                id_dossier: fileIdNum,
                id_compte: compteIdNum
            }
        });

        if (!deletedCodeJournal) {
            deletedCodeJournal = await codejournals.destroy({
                where: {
                    id: idToDeleteNum,
                    id_dossier: fileIdNum,
                }
            });
        }

        if (deletedCodeJournal) {
            resData.state = true;
            resData.msg = "Code journal supprimé avec succès.";
        } else {
            resData.state = false;
            resData.msg = "Une erreur est survenue au moment du traitement des données.";
        }

        return res.json(resData);
    } catch (error) {
        console.error('[codeJournauxDelete] Error', error);
        return res.status(500).json({ state: false, msg: 'Erreur serveur' });
    }
}

module.exports = {
    getListeCodeJournaux,
    addCodeJournal,
    codeJournauxDelete
};
