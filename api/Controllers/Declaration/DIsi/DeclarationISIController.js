require('dotenv').config();
const db = require("../../../Models");
const { Op } = require('sequelize');
const { create } = require('xmlbuilder2');

const fs = require('fs');
const path = require('path');

const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');

const journals = db.journals;
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const dossierplancomptableModel = db.dossierplancomptable;
const codejournals = db.codejournals;
const isis = db.isi;
const historiqueIsi = db.historiqueDeclaration;

const declISIGeneratePDF = require('../../../Middlewares/ISI/declISIGeneratePDF');
const declISIGenerateExcel = require('../../../Middlewares/ISI/declISIGenerateExcel');

const generateISIContent = declISIGeneratePDF.generateISIContent;
const exportISIToExcel = declISIGenerateExcel.exportISIToExcel;

const logoPath = path.join(__dirname, `../../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

// Fonction pour plurieliser un mot
function pluralize(count, word) {
    return count > 1 ? word + 's' : word;
}

// Formattage du date pour l'exercice
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [annee, mois, jour] = dateStr.split('-');
    return `${jour.padStart(2, '0')}-${mois.padStart(2, '0')}-${annee}`;
};

const moisNoms = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

// Fonction pour récupérer les entêtes du PDF
const infoBlock = (dossier, exercice, mois, annee) => ([
    { text: `Dossier : ${dossier?.dossier}`, style: 'subTitle', margin: [0, 0, 0, 5] },
    { text: `Mois et année : ${moisNoms[mois - 1]} ${annee}`, style: 'subTitleExo', margin: [0, 0, 0, 5] },
    { text: `Exercice du : ${formatDate(exercice.date_debut)} au ${formatDate(exercice.date_fin)}`, style: 'subTitleExo', margin: [0, 0, 0, 10] }
]);

exports.getJournalsISI = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { compteisi, declisimois, declisiannee } = req.query;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }

        let dateFilter = {};
        if (declisimois && declisiannee) {
            const mois = parseInt(declisimois, 10);
            const annee = parseInt(declisiannee, 10);

            const startDate = new Date(annee, mois - 1, 1);
            const endDate = new Date(annee, mois, 0);
            endDate.setHours(23, 59, 59, 999);
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);

            dateFilter = {
                dateecriture: {
                    [Op.between]: [startDate, endDate]
                }
            };
        }

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                ...dateFilter
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: compteisi ? true : false,
                    where: compteisi
                        ? { compte: { [Op.like]: `${compteisi}%` } }
                        : undefined
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [
                ['dateecriture', 'ASC']
            ]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    compte_cetralise: compte_centralise?.compte || null
                };
            }));

        return res.json({
            list: mappedData,
            state: true,
            message: "Récupéré avec succès"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.ajoutMoisAnnee = async (req, res) => {
    try {
        const { selectedDetailRows, declisimois, declisiannee, declisi, compteisi, id_compte, id_dossier, id_exercice } = req.body;

        if (!selectedDetailRows || !declisimois || !declisiannee || !compteisi || !id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Données manquantes' });
        }

        // Récupérer les journaux sélectionnés
        const journalData = await journals.findAll({
            where: { id: selectedDetailRows },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedAllJournalsData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();

                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                };
            })
        );

        const idEcritures = journalData.map(j => j.id_ecriture);

        // Récupérer toutes les écritures liées
        const allJournals = await journals.findAll({
            where: { id_ecriture: idEcritures },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'ASC']]
        });

        // Mapper pour enrichir avec compte et code
        const mappedAllJournals = await Promise.all(
            allJournals.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();

                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                };
            })
        );

        // Journaux sélectionnés qui commencent par compteisi → à modifier
        const filteredJournals = mappedAllJournals.filter(
            j => j.compte && j.compte.startsWith(compteisi)
        );

        const idEcrituresToUpdate = filteredJournals.map(j => j.id_ecriture);
        const uniqueIdEcrituresToUpdate = new Set(idEcrituresToUpdate);

        // Journaux sélectionnés qui NE commencent PAS par compteisi → à renvoyer
        const nonCompteIsiJournalsFiltered = mappedAllJournalsData.filter(
            j => !idEcrituresToUpdate.includes(j.id_ecriture)
        );

        // Si rien à modifier
        if (idEcrituresToUpdate.length === 0) {
            return res.status(200).json({
                state: true,
                message: "Compte ISI non trouvé",
                nonCompteIsiJournals: nonCompteIsiJournalsFiltered,
                nombreNonCompteIsiJournals: nonCompteIsiJournalsFiltered.length
            });
        }

        // Mise à jour des journaux qui commencent par compteisi
        await journals.update(
            { declisimois, declisiannee, declisi },
            { where: { id_ecriture: idEcrituresToUpdate, id_compte, id_dossier, id_exercice, } }
        );

        const count = uniqueIdEcrituresToUpdate.size;

        // Réponse finale
        return res.status(200).json({
            message: `${count} ${pluralize(count, "écriture")} ${pluralize(count, "modifiée")} avec succès`,
            nonCompteIsiJournals: nonCompteIsiJournalsFiltered,
            nombreNonCompteIsiJournals: nonCompteIsiJournalsFiltered.length,
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur serveur",
            state: false,
            error: error.message
        });
    }
};

exports.suppressionMoisAnnee = async (req, res) => {
    try {
        const { selectedDetailRows, declisi, declisimois, declisiannee, id_compte, id_dossier, id_exercice } = req.body;

        if (!selectedDetailRows || !declisimois || !declisiannee || !id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Ids non trouvé' });
        }

        const journalData = await journals.findAll({
            where: {
                id: selectedDetailRows
            }
        })

        const idEcrituresToUpdate = journalData.map(j => j.id_ecriture);
        const uniqueIdEcrituresToUpdate = new Set(idEcrituresToUpdate);

        if (idEcrituresToUpdate.length === 0) {
            return res.status(200).json({ state: false, message: "Aucun journal à mettre à jour." });
        }

        await journals.update(
            { declisimois: 0, declisiannee: 0, declisi },
            { where: { id_ecriture: idEcrituresToUpdate } }
        );

        await isis.destroy({
            where: {
                id_compte: id_compte,
                id_dossier: id_dossier,
                id_exercice: id_exercice,
                declisimois: declisimois,
                declisiannee: declisiannee,
                id_ecriture: idEcrituresToUpdate
            }
        })

        const count = uniqueIdEcrituresToUpdate.size;

        return res.status(200).json({
            message: `${count} ${pluralize(count, "écriture")} ${pluralize(count, "supprimée")} avec succès`,
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.generateIsiAuto = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, declisiannee, declisimois, compteisi } = req.body;

        if (!id_dossier || !id_compte || !id_exercice || !declisiannee || !declisimois || !compteisi) {
            return res.status(400).json({ state: false, message: 'Données manquantes' });
        }

        let dateFilter = {};
        if (declisimois && declisiannee) {
            const mois = parseInt(declisimois, 10);
            const annee = parseInt(declisiannee, 10);

            const startDate = new Date(annee, mois - 1, 1);
            const endDate = new Date(annee, mois, 0);
            endDate.setHours(23, 59, 59, 999);

            dateFilter = {
                dateecriture: {
                    [Op.between]: [startDate, endDate]
                }
            };
        }

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: declisimois,
                declisiannee: declisiannee,
                ...dateFilter
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [
                ['dateecriture', 'ASC']
            ]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();

                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null
                };
            })
        );

        const idEcritures = mappedData.map(j => j.id_ecriture);

        const allJournals = await journals.findAll({
            where: {
                id_ecriture: {
                    [Op.in]: idEcritures
                },
                declisimois: declisimois,
                declisiannee: declisiannee,
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedAllJournals = await Promise.all(
            allJournals.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();

                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    comptecentralisation: compte_centralise?.compte || null
                };
            })
        );

        const groupedByEcriture = mappedAllJournals.reduce((acc, journal) => {
            const id = journal.id_ecriture;
            if (!acc[id]) {
                acc[id] = { id_ecriture: id, nombre_journal: journal.length, journals: [] };
            }
            acc[id].journals.push(journal);
            return acc;
        }, {});

        const result = Object.values(groupedByEcriture).map(group => ({
            ...group,
            nombre_journal: group.journals.length
        }));

        return res.status(200).json({ message: 'Ok', nombre: result.length, result });

    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.getIsi = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }
        const dataIsi = await isis.findAll({
            where: {
                id_compte: Number(id_compte),
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice)
            },
            order: [['date_transaction', 'DESC']]
        })
        return res.status(200).json({
            state: true,
            list: dataIsi,
            message: `Données reçues`
        });
    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.getAllIsi = async (req, res) => {
    try {
        const allIsi = await isis.findAll({
            order: [['date_transaction', 'DESC']]
        });
        return res.status(200).json(allIsi)
    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.getAnnexeDeclaration = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { annee, mois } = req.query;
        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }

        const dataIsi = await isis.findAll({
            where: {
                id_compte: Number(id_compte),
                id_dossier: Number(id_dossier),
                id_exercice: Number(id_exercice),
                declisimois: mois,
                declisiannee: annee
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte']
                }
            ],
            order: [['id', 'ASC']]
        })

        const mappedData = await Promise.all(
            dataIsi.map(async (journal) => {
                const { dossierplancomptable, ...rest } = journal.toJSON();
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                };
            }));

        return res.status(200).json({
            state: true,
            list: mappedData,
            message: `Données reçues`
        });
    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.updateIsi = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        const isi = await isis.findByPk(id);
        if (!isi) {
            return res.status(400).json({ state: false, message: 'ISI non trouvé' });
        }
        const id_compte = Number(isi.id_compte);
        const id_dossier = Number(isi.id_dossier);
        const id_exercice = Number(isi.id_exercice);
        const id_numcpt = Number(isi.id_numcpt);
        const { montant_transaction, montant_isi, ...filteredData } = payload;

        // await isi.update(payload);
        await isis.update(filteredData, { where: { id_numcpt, id_dossier, id_compte, id_exercice } })
        return res.status(200).json({
            state: true,
            message: 'ISI mis à jour avec succès',
        });
    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.deleteSelectedIsi = async (req, res) => {
    try {
        const { isiIds } = req.body;

        if (!isiIds || !Array.isArray(isiIds)) {
            return res.status(400).json({
                state: false,
                message: "Aucune ligne sélectionnée à supprimer"
            });
        }

        const result = await isis.destroy({
            where: { id: isiIds }
        })

        return res.status(200).json({
            state: true,
            message: `${result} isi supprimé(s) avec succès`
        });

    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.getJournalsDeclIsi = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { mois, annee } = req.query;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: mois,
                declisiannee: annee,
                declisi: true,
            },
            include: [
                { model: dossierplancomptableModel, attributes: ['compte'], required: true },
                { model: codejournals, attributes: ['code'] }
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    compte_cetralise: compte_centralise?.compte || null
                };
            }));

        return res.json({
            list: mappedData,
            state: true,
            message: "Récupéré avec succès"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.getDetailSelectionLigne = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { mois, annee } = req.query;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }

        const debutMois = new Date(annee, mois - 1, 1);
        const finMois = new Date(annee, mois, 0, 23, 59, 59, 999);

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                [Op.or]: [
                    { declisi: false },
                    {
                        [Op.and]: [
                            { declisi: true },
                            { declisimois: mois },
                            { declisiannee: annee }
                        ]
                    }
                ],
                dateecriture: { [Op.between]: [debutMois, finMois] },
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'DESC']]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    compte_cetralise: compte_centralise?.compte || null
                };
            }));

        return res.json({
            list: mappedData,
            state: true,
            message: "Récupéré avec succès"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.generateIsiAutoDetail = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, declisiannee, declisimois, compteisi } = req.body;
        if (!id_dossier || !id_compte || !id_exercice || !declisiannee || !declisimois || !compteisi) {
            return res.status(400).json({ state: false, message: 'Données manquantes' });
        }

        await journals.update(
            {
                declisimois: 0,
                declisiannee: 0,
                declisi: false
            },
            {
                where: {
                    id_dossier: id_dossier,
                    id_compte: id_compte,
                    id_exercice: id_exercice,
                    declisi: true,
                    declisiannee: declisiannee,
                    declisimois: declisimois
                }
            }
        )

        let dateFilter = {};
        if (declisimois && declisiannee) {
            const mois = parseInt(declisimois, 10);
            const annee = parseInt(declisiannee, 10);

            const startDate = new Date(annee, mois - 1, 1);
            const endDate = new Date(annee, mois, 0);
            endDate.setHours(23, 59, 59, 999);

            dateFilter = {
                dateecriture: {
                    [Op.between]: [startDate, endDate]
                }
            };
        }

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: 0,
                declisiannee: 0,
                declisi: false,
                ...dateFilter
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: compteisi ? true : false,
                    where: compteisi
                        ? { compte: { [Op.like]: `${compteisi}%` } }
                        : undefined
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'ASC']]
        });

        // return res.json(journalData);

        if (!journalData) {
            return res.status(200).json({ message: `Aucune journal trouvé`, state: false });
        }

        const idEcritures = journalData.map(j => j.id_ecriture);

        const uniqueIdEcritures = [...new Set(idEcritures)];

        // return res.json(uniqueIdEcritures);

        const allJournals = await journals.findAll({
            where: {
                id_ecriture: uniqueIdEcritures
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'ASC']]
        });

        // return res.json(allJournals);

        const mappedAllJournals = await Promise.all(
            allJournals.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);

                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    comptecentralisation: compte_centralise?.compte || null
                };
            })
        );

        // return res.json(mappedAllJournals);

        const filteredJournals = mappedAllJournals.filter(j => j.compte && j.compte.startsWith("6"));

        // return res.json(filteredJournals);

        const idsEcritureToUpdate = filteredJournals.map(j => j.id_ecriture);

        const uniqueIdEcrituresToUpdate = new Set(idsEcritureToUpdate);

        // return res.json(uniqueIdEcrituresToUpdate);

        await journals.update(
            {
                declisiannee,
                declisimois,
                declisi: true
            },
            {
                where: {
                    id_ecriture: idsEcritureToUpdate
                }
            }
        );

        const count = uniqueIdEcrituresToUpdate.size;
        return res.status(200).json({
            message: `${count} ${pluralize(count, "écriture")} ${pluralize(count, "générée")} avec succès`,
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.reinitializeIsi = async (req, res) => {
    try {
        const { declisimois, declisiannee, id_compte, id_dossier, id_exercice } = req.body;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }

        if (!declisimois || !declisiannee) {
            return res.status(400).json({ state: false, message: 'Données manquantes' });
        }

        const journalsData = await journals.findAll({
            where: {
                id_compte: id_compte,
                id_dossier: id_dossier,
                id_exercice: id_exercice,
                declisimois: declisimois,
                declisiannee: declisiannee,
                declisi: true
            }
        })

        const idEcritures = journalsData.map(j => j.id_ecriture);
        const uniqueIdEcrituresToUpdate = new Set(idEcritures);

        if (journalsData.length === 0) {
            return res.status(200).json({ message: `Aucune ligne à réinitaliser`, state: true });
        }

        await journals.update(
            {
                declisimois: 0,
                declisiannee: 0,
                declisi: false
            }, {
            where: {
                id_ecriture: idEcritures
            }
        }
        )

        await isis.destroy({
            where: {
                id_ecriture: idEcritures
            }
        })

        const count = uniqueIdEcrituresToUpdate.size;
        return res.status(200).json({
            message: `${count} ${pluralize(count, "écriture")} ${pluralize(count, "réinitialisée")} avec succès`,
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.getJournalsDeclIsiClasseSix = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { mois, annee } = req.query;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: mois,
                declisiannee: annee,
                declisi: true,
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true,
                    where: { compte: { [Op.like]: `6%` } }
                },
                { model: codejournals, attributes: ['code'] }
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    compte_cetralise: compte_centralise?.compte || null
                };
            }));

        return res.json({
            list: mappedData,
            state: true,
            message: "Récupéré avec succès"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.getDetailEcritureAssocie = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { mois, annee, compteisi } = req.query;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }
        if (!mois) {
            return res.status(400).json({ state: false, message: 'Mois manquante' });
        }
        if (!annee) {
            return res.status(400).json({ state: false, message: 'Année manquante' });
        }
        if (!compteisi) {
            return res.status(400).json({ state: false, message: 'Compte Isi manquant' });
        }

        const debutMois = new Date(annee, mois - 1, 1);
        const finMois = new Date(annee, mois, 0, 23, 59, 59, 999);

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: mois,
                declisiannee: annee,
                declisi: true,
                dateecriture: { [Op.between]: [debutMois, finMois] },
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true,
                    where: { compte: { [Op.like]: `${compteisi}%` } }
                },
                { model: codejournals, attributes: ['code'] }
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    compte_cetralise: compte_centralise?.compte || null
                };
            }));

        return res.json({
            list: mappedData,
            state: true,
            message: "Récupéré avec succès"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.generateAnnexeDeclarationAuto = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, mois, annee, compteisi } = req.body;

        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }
        if (!mois) {
            return res.status(400).json({ state: false, message: 'Mois manquante' });
        }
        if (!annee) {
            return res.status(400).json({ state: false, message: 'Année manquante' });
        }
        if (!compteisi) {
            return res.status(400).json({ state: false, message: 'Compte Isi manquant' });
        }

        const debutMois = new Date(annee, mois - 1, 1);
        const finMois = new Date(annee, mois, 0, 23, 59, 59, 999);

        const journalData = await journals.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: mois,
                declisiannee: annee,
                declisi: true,
                dateecriture: { [Op.between]: [debutMois, finMois] },
            },
            include: [
                {
                    model: dossierplancomptableModel,
                    attributes: ['compte'],
                    required: true,
                },
                { model: codejournals, attributes: ['code'] }
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedData = await Promise.all(
            journalData.map(async (journal) => {
                const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
                const compte_centralise = await dossierplancomptableModel.findByPk(journal.id_numcptcentralise);
                return {
                    ...rest,
                    compte: dossierplancomptable?.compte || null,
                    journal: codejournal?.code || null,
                    compte_cetralise: compte_centralise?.compte || null
                };
            }));

        // return res.json(mappedData)

        const groupedData = Object.values(
            mappedData.reduce((acc, item) => {
                const compteStr = item.compte?.toString() || "";

                if (!(compteStr.startsWith(compteisi) || compteStr.startsWith("401"))) {
                    return acc;
                }

                if (!acc[item.id_ecriture]) {
                    acc[item.id_ecriture] = {
                        id_ecriture: item.id_ecriture,
                        dateecriture: item.dateecriture,
                        lignes: []
                    };
                }

                acc[item.id_ecriture].lignes.push({
                    compte: item.compte,
                    libelle: item.libelle,
                    debit: item.debit,
                    credit: item.credit,
                    id_numcpt: item.id_numcpt,
                    compte_centralise: item.compte_cetralise,
                    dateecriture: item.dateecriture
                });

                return acc;
            }, {})
        )
            .filter(ecriture =>
                ecriture.lignes.length > 0 &&
                ecriture.lignes.some(l => l.compte.startsWith("401")) &&
                ecriture.lignes.some(l => l.compte.startsWith(compteisi))
            );

        // return res.json(groupedData)

        const result = await Promise.all(
            groupedData.map(async (group) => {

                const montant_isi = group.lignes
                    .filter(l => l.compte.startsWith(compteisi))
                    .reduce((sum, l) => sum + ((l.credit || 0) - (l.debit || 0)), 0);

                const ligne401 = group.lignes.find(l => l.compte.startsWith("401"));
                const ligneIsi = group.lignes.find(l => l.compte.startsWith(compteisi));

                const dossierplanComptableData = ligne401
                    ? await dossierplancomptableModel.findByPk(ligne401.id_numcpt)
                    : null;

                const montant_transaction = group.lignes
                    .filter(l => l.compte.startsWith("401"))
                    .reduce((sum, l) => sum + ((l.credit || 0) - (l.debit || 0)), 0);

                const colonnesVides =
                    !dossierplanComptableData?.id
                    || !dossierplanComptableData?.nom
                    || !dossierplanComptableData?.province
                    || !dossierplanComptableData?.region
                    || !dossierplanComptableData?.district
                    || !dossierplanComptableData?.commune
                    || !dossierplanComptableData?.fokontany
                    || !dossierplanComptableData?.cin;

                return {
                    id_compte: id_compte,
                    id_dossier: id_dossier,
                    id_exercice: id_exercice,
                    id_numcpt: dossierplanComptableData?.id || null,
                    id_ecriture: group.id_ecriture,
                    declisimois: mois,
                    declisiannee: annee,
                    nom: dossierplanComptableData?.libelle || null,
                    province: dossierplanComptableData?.province || null,
                    region: dossierplanComptableData?.region || null,
                    district: dossierplanComptableData?.district || null,
                    commune: dossierplanComptableData?.commune || null,
                    fokontany: dossierplanComptableData?.fokontany || null,
                    cin: dossierplanComptableData?.cin || null,
                    date_transaction: ligneIsi.dateecriture,
                    montant_isi,
                    montant_transaction: montant_transaction === 0 ? montant_isi : montant_transaction,
                    anomalie: colonnesVides
                };
            })
        );

        // return res.json(result)

        const idsToInsert = result.map(r => r.id_ecriture);

        // Vérifier les ID existants avant l'insert
        const existingIds = new Set(
            (await isis.findAll({
                where: { id_ecriture: idsToInsert },
                attributes: ['id_ecriture']
            })).map(r => r.id_ecriture)
        );

        const isiRows = await isis.bulkCreate(result, {
            updateOnDuplicate: [
                'nom', 'province', 'region', 'district', 'commune', 'cin',
                'montant_isi', 'montant_transaction', 'date_transaction', 'anomalie'
            ],
            returning: true
        });

        const created = isiRows.filter(r => !existingIds.has(r.id_ecriture)).length;
        const updated = isiRows.length - created;

        let message = '';

        if (created === 0 && updated === 0) {
            message = "Aucune ISI à générer";
        } else if (created > 0 && updated === 0) {
            message = `${created} déclaration ISI ${pluralize(created, "créée")} avec succès`;
        } else if (updated > 0 && created === 0) {
            message = `${updated} déclaration ISI ${pluralize(updated, "modifiée")} avec succès`;
        } else {
            message = `${created} déclaration ISI ${pluralize(created, "créée")} et ${updated} déclaration ISI ${pluralize(updated, "modifiée")} avec succès`;
        }

        res.json({
            state: true,
            message,
            data: isiRows
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.deleteIsi = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        if (!id || !action) {
            return res.status(400).json({
                state: false,
                message: "Données manquantes"
            });
        }

        const isiData = await isis.findByPk(id);

        if (!isiData) {
            return res.status(400).json({
                state: false,
                message: "Aucune données trouvées"
            });
        }

        const id_compte = Number(isiData.id_compte);
        const id_dossier = Number(isiData.id_dossier);
        const id_exercice = Number(isiData.id_exercice);
        const id_numcpt = Number(isiData.id_numcpt);

        if (action === 'group') {
            await isis.destroy({
                where: { id_numcpt, id_dossier, id_compte, id_exercice }
            })
        } else {
            await isis.destroy({
                where: { id, id_dossier, id_compte, id_exercice }
            })
        }

        return res.status(200).json({
            state: true,
            message: `Isi supprimé avec succès`
        });

    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.exportISIToPDF = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
        if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
            return res.status(400).json({ msg: 'Paramètres manquants', state: false });
        }
        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);
        if (!dossier) {
            return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
        }
        if (!exercice) {
            return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
        }
        if (!compte) {
            return res.status(400).json({ msg: 'Compte non trouvé', state: false });
        }
        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        const printer = new PdfPrinter(fonts);

        const { buildTable, isi } = await generateISIContent(id_compte, id_dossier, id_exercice, mois, annee);
        const docDefinition = {
            pageOrientation: 'landscape',
            content: [
                { text: 'Déclaration ISI', style: 'title' },
                infoBlock(dossier, exercice, mois, annee),
                ...buildTable(isi)
            ],
            background: function (currentPage, pageSize) {
                if (currentPage === 1) {
                    return [
                        {
                            image: logoImage,
                            width: 50,
                            absolutePosition: { x: 10, y: 10 }
                        }
                    ];
                }
                return [];
            },
            styles: {
                title: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                subTitle: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                subTitleExo: { fontSize: 9 },
                tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
            },
            defaultStyle: { font: 'Helvetica', fontSize: 7 }
        }
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="ISI ${moisNoms[mois - 1]} ${annee}(PDF).pdf"`);
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.exportISIToExcel = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
        if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
            return res.status(400).json({ msg: 'Paramètres manquants', state: false });
        }

        const dossier = await dossiers.findByPk(id_dossier);
        const exercice = await exercices.findByPk(id_exercice);
        const compte = await userscomptes.findByPk(id_compte);

        if (!dossier) {
            return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
        }
        if (!exercice) {
            return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
        }
        if (!compte) {
            return res.status(400).json({ msg: 'Compte non trouvé', state: false });
        }

        const workbook = new ExcelJS.Workbook();

        await exportISIToExcel(id_compte, id_dossier, id_exercice, mois, annee, workbook, dossier?.dossier, compte?.nom, moisNoms[mois - 1], formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));

        workbook.views = [
            { activeTab: 0 }
        ];

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=ISI ${mois} ${annee}(Excel).xlsx`
        );
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur", error: error.message
        });
    }
}

exports.exportIsiXml = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;

        if (!id_dossier || !id_compte || !id_exercice || !annee || !mois) {
            return res.status(400).json({ state: false, message: 'Données manquantes' });
        }
        const dossier = await dossiers.findByPk(id_dossier);

        if (!dossier) {
            return res.status(400).json({ state: false, message: 'Dossier non trouvé' });
        }

        // Récupération des données depuis la base
        const isiData = await isis.findAll({
            where: {
                id_compte,
                id_dossier,
                id_exercice,
                declisimois: mois,
                declisiannee: annee
            }
        });

        // Création du XML
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('EDI');

        // Informations générales
        const infos = root.ele('informations');
        infos.ele('type').txt('ISI');
        infos.ele('ncc').txt(dossier?.nif);
        infos.ele('codeTaxe').txt("ISI");
        infos.ele('mois').txt(mois);
        infos.ele('exercice').txt(annee);

        // Tableau des données
        const tableaux = root.ele('tableaux');
        const tableau = tableaux.ele('tableau');
        const donnees = tableau.ele('donnees');

        isiData.forEach((row) => {
            const ligne = donnees.ele('ligne');

            const mapFields = {
                NOM_PRENOM: row.nom,
                CIN: row.cin,
                NATURE: row.nature_transaction,
                DETAILS: row.detail_transaction,
                DATE: new Date(row.date_transaction).toLocaleDateString('fr-FR'),
                MONTANT: row.montant_transaction,
                MONTANT_ISI: row.montant_isi,
                PROVINCE: row.province,
                REGION: row.region,
                DISTRICT: row.district,
                COMMUNE: row.commune,
                FOKONTANY: row.fokontany
            };

            Object.keys(mapFields).forEach((key) => {
                const champ = ligne.ele('champ');
                champ.ele('code').txt(key);
                champ.ele('valeur').txt(mapFields[key] ?? '');
            });
        });

        const exercice = await exercices.findByPk(id_exercice);

        if (!exercice) {
            return res.status(400).json({ state: false, message: 'Exercice non trouvé pour l\'ajout dans l\'historique' });
        }

        const exerciceDebut = exercice?.date_debut;
        const exerciceFin = exercice?.date_fin;

        await historiqueIsi.create({
            idCompte: id_compte,
            idDossier: id_dossier,
            declaration: 'ISI',
            designation: `ISI - du ${formatDate(exerciceDebut)} au ${formatDate(exerciceFin)} : declaration ${mois}/${annee}`,
            date_export: new Date().toISOString()
        })

        const xmlString = root.end({ prettyPrint: true, headless: true });

        res.setHeader('Content-Type', 'text/xml');
        res.setHeader('Content-Disposition', `attachment; filename=ISI_${annee}_${mois}.xml`);
        res.send(xmlString);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

exports.getHistoriqueIsi = async (req, res) => {
    try {
        const { id_compte, id_dossier } = req.params;
        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        const dataHistorique = await historiqueIsi.findAll({
            where: {
                idDossier: id_dossier,
                idCompte: id_compte,
                declaration: 'ISI'
            },
            include: [
                {
                    model: dossiers,
                    attributes: ['dossier'],
                    as: 'dossier',
                    required: true,
                },
                {
                    model: userscomptes,
                    attributes: ['nom'],
                    as: 'compte',
                    required: true,
                }
            ],
            order: [['date_export', 'DESC']]
        })
        const mappedData = await Promise.all(
            dataHistorique.map(async (historique) => {
                const { dossier, compte, ...rest } = historique.toJSON();
                return {
                    ...rest,
                    dossier: dossier?.dossier || null,
                    compte: compte?.nom || null,
                };
            }));

        if (!dataHistorique) {
            return res.status(400).json({ state: false, message: 'Aucune historique trouvé' });
        }
        return res.status(200).json({
            state: true,
            list: mappedData
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
}

exports.deleteAllISi = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { mois, annee } = req.query;
        if (!id_compte) {
            return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        }
        if (!id_dossier) {
            return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        }
        if (!id_exercice) {
            return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
        }
        if (!mois && !annee) {
            return res.status(400).json({ state: false, message: 'Le mois et l\'année sont obligatoire' });
        }
        const isi = await isis.destroy({
            where: {
                id_compte: id_compte,
                id_dossier: id_dossier,
                id_exercice: id_exercice,
                declisimois: mois,
                declisiannee: annee
            }
        })

        return res.status(201).json({ state: true, message: `${isi} supprimés aves succès` })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
}

exports.deleteSelectedHistoriqueIsi = async (req, res) => {
    try {
        const { selectedHistoriqueIds } = req.body;

        if (!selectedHistoriqueIds || !Array.isArray(selectedHistoriqueIds)) {
            return res.status(400).json({
                state: false,
                message: "Aucune ligne sélectionnée à supprimer"
            });
        }

        const result = await historiqueIsi.destroy({
            where: { id: selectedHistoriqueIds }
        });

        return res.status(200).json({
            state: true,
            message: `${result} ${pluralize(result, 'historique')} ${pluralize(result, 'supprimé')} avec succès`
        });

    } catch (error) {
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
}