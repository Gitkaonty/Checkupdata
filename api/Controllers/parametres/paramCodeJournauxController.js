const db = require("../../Models");
const Sequelize = require('sequelize');

const codejournals = db.codejournals;
const dossierplancomptable = db.dossierplancomptables;

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
                resData.id = addCode.id; // Retourner l'ID créé
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

const importCodeJournaux = async (req, res) => {
    try {
        const { idCompte, idDossier, codeJournauxData } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            anomalies: []
        };

        if (!codeJournauxData || codeJournauxData.length === 0) {
            resData.msg = "Aucune donnée à importer.";
            return res.json(resData);
        }

        // Récupérer le plan comptable pour valider les comptes associés
        const planComptable = await dossierplancomptable.findAll({
            where: { id_dossier: idDossier },
            attributes: ['id', 'compte']
        });

        const planComptableMap = new Map();
        planComptable.forEach(pc => {
            if (!pc.compte) return;
            const compteKey = pc.compte.trim().toUpperCase();
            planComptableMap.set(compteKey, pc.id);
        });

        const codesToImport = [];
        const anomalies = [];
        let hasError = false;

        for (let i = 0; i < codeJournauxData.length; i++) {
            const row = codeJournauxData[i];
            const lineNum = i + 1;

            // Validation des champs requis
            if (!row.code || row.code.trim() === '') {
                anomalies.push(`Ligne ${lineNum}: Le code journal est requis.`);
                hasError = true;
                continue;
            }

            if (!row.libelle || row.libelle.trim() === '') {
                anomalies.push(`Ligne ${lineNum}: Le libellé est requis.`);
                hasError = true;
                continue;
            }

            if (!row.type || row.type.trim() === '') {
                anomalies.push(`Ligne ${lineNum}: Le type est requis.`);
                hasError = true;
                continue;
            }

            const expectedTypes = ["ACHAT", "BANQUE", "CAISSE", "OD", "RAN", "VENTE"];
            const normalizedType = row.type.trim().toUpperCase();
            if (!expectedTypes.includes(normalizedType)) {
                anomalies.push(`Ligne ${lineNum}: Type invalide. Types acceptés: ACHAT, BANQUE, CAISSE, OD, RAN, VENTE.`);
                hasError = true;
                continue;
            }

            // Validation du compte associé pour BANQUE et CAISSE
            let compteAssocieId = null;
            if (normalizedType === 'BANQUE' || normalizedType === 'CAISSE') {
                if (!row.compteassocie || row.compteassocie.trim() === '') {
                    anomalies.push(`Ligne ${lineNum}: Le compte associé est requis pour le type ${normalizedType}.`);
                    hasError = true;
                    continue;
                }

                const compteKey = row.compteassocie.trim().toUpperCase();
                if (planComptableMap.has(compteKey)) {
                    compteAssocieId = planComptableMap.get(compteKey);
                } else {
                    anomalies.push(`Ligne ${lineNum}: Le compte associé "${row.compteassocie}" n'existe pas dans le plan comptable.`);
                    hasError = true;
                    continue;
                }
            }

            // Vérifier les doublons
            const existingCode = await codejournals.findOne({
                where: {
                    id_dossier: idDossier,
                    code: row.code.trim().toUpperCase()
                }
            });

            if (existingCode) {
                anomalies.push(`Ligne ${lineNum}: Le code journal "${row.code}" existe déjà.`);
                hasError = true;
                continue;
            }

            codesToImport.push({
                id_compte: idCompte,
                id_dossier: idDossier,
                code: row.code.trim().toUpperCase(),
                libelle: row.libelle.trim(),
                type: normalizedType,
                compteassocie: compteAssocieId
            });
        }

        if (hasError) {
            resData.state = false;
            resData.msg = "Des erreurs ont été détectées lors de la validation.";
            resData.anomalies = anomalies;
            return res.json(resData);
        }

        // Importer les codes journaux
        await codejournals.bulkCreate(codesToImport);

        resData.state = true;
        resData.msg = `${codesToImport.length} code(s) journal(x) importé(s) avec succès.`;
        return res.json(resData);

    } catch (error) {
        console.error('[importCodeJournaux] Error', error);
        return res.json({
            state: false,
            msg: 'Une erreur est survenue lors du traitement.',
            anomalies: [error.message]
        });
    }
}

module.exports = {
    getListeCodeJournaux,
    addCodeJournal,
    codeJournauxDelete,
    importCodeJournaux
};
