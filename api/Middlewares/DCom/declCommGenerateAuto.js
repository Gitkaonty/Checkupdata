const db = require('../../Models');
const { Op } = require('sequelize');
const journals = db.journals;
const dossierplancomptable = db.dossierplancomptable;
const droitcommas = db.droitcommas;
const droitcommbs = db.droitcommbs;
const codejournals = db.codejournals;

const calculateSolde = (sens, data) => {
    if (!data) return 0;

    let total = 0;

    if (Array.isArray(data)) {
        if (sens === 'D-C') {
            total = data.reduce((sum, l) => (sum + ((parseFloat(l.debit) || 0) - (parseFloat(l.credit) || 0))), 0);
        } else if (sens === 'C-D') {
            total = data.reduce((sum, l) => (sum + ((parseFloat(l.credit) || 0) - (parseFloat(l.debit) || 0))), 0);
        }
    } else { // data est un objet unique
        const debit = parseFloat(data.debit) || 0;
        const credit = parseFloat(data.credit) || 0;
        total = sens === 'D-C' ? debit - credit : credit - debit;
    }

    return parseFloat(total.toFixed(2));
};

const parseDate = (value) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

// Fonction pour plurieliser un mot
function pluralize(count, word) {
    return count > 1 ? word + 's' : word;
}

const generateDroitComm = async (res, nature, list, id_compte, id_dossier, id_exercice) => {
    try {
        const compteSensMapTemp = list.reduce((acc, val) => {
            if (!acc[val.compte]) {
                acc[val.compte] = new Set();
            }
            acc[val.compte].add(val.senscalcul);
            return acc;
        }, {});

        const compteSensMap = Object.fromEntries(
            Object.entries(compteSensMapTemp)
                .filter(([compte, sensSet]) => sensSet.size === 1)
                .map(([compte, sensSet]) => [compte, [...sensSet][0]])
        );

        const uniqueComptes = Object.keys(compteSensMap);

        const journalData = await journals.findAll({
            where: { id_compte, id_dossier, id_exercice },
            include: [
                {
                    model: dossierplancomptable,
                    attributes: ['compte'],
                    required: true
                },
            ],
            order: [['dateecriture', 'ASC']]
        });

        const mappedAllJournalsData = journalData.map(journal => {
            const { dossierplancomptable, ...rest } = journal.toJSON();
            return {
                ...rest,
                compte: dossierplancomptable?.compte || null,
            };
        });

        // return res.json(mappedAllJournalsData)

        const groupedData = Object.values(
            mappedAllJournalsData.reduce((acc, item) => {
                const compteStr = item.compte?.toString() || "";

                if (!acc[item.id_ecriture]) {
                    acc[item.id_ecriture] = {
                        id_ecriture: item.id_ecriture,
                        id_numcpt: item.id_numcpt,
                        dateecriture: item.dateecriture,
                        lignes: [],
                    };
                }

                const matchingCompte = uniqueComptes.find(c => compteStr.startsWith(c)) || (compteStr.startsWith("401") ? "401" : null);

                if (matchingCompte) {
                    acc[item.id_ecriture].lignes.push({
                        compte: item.compte,
                        libelle: item.libelle,
                        debit: item.debit,
                        credit: item.credit,
                        id_numcpt: item.id_numcpt,
                        dateecriture: item.dateecriture,
                        senscalcul: compteSensMap[matchingCompte] || null,
                    });
                }

                return acc;
            }, {})
        )
            .filter(ecriture => {
                const has401 = ecriture.lignes.some(l => l.compte.startsWith("401"));
                const hasUniqueCompte = ecriture.lignes.some(l =>
                    uniqueComptes.some(c => l.compte.startsWith(c))
                );
                return has401 && hasUniqueCompte;
            });

        // return res.json(groupedData)

        if (groupedData.length === 0) {
            return res.status(400).json({
                state: true,
                message: "Aucune données à générer automatiquement"
            });
        }

        const only401Lines = groupedData.map(ecriture => {
            const senscalcul = ecriture.lignes.find(l => !l.compte.startsWith("401"))?.senscalcul || null;

            const lignes401 = ecriture.lignes.filter(l => l.compte.startsWith("401"));

            return {
                id_ecriture: ecriture.id_ecriture,
                id_numcpt: ecriture.id_numcpt,
                dateecriture: ecriture.dateecriture,
                senscalcul,
                lignes: lignes401,
            };
        });

        // return res.json(only401Lines);

        const result = await Promise.all(
            only401Lines.map(async (group) => {
                const senscalcul = group.senscalcul || "D-C";
                const montant = calculateSolde(senscalcul, group.lignes);
                const dossierPlanComptableData = await dossierplancomptable.findByPk(group.lignes[0].id_numcpt);
                return {
                    id_compte,
                    id_dossier,
                    id_exercice,
                    id_ecriture: group.id_ecriture,
                    id_numcpt: dossierPlanComptableData?.id || null,
                    // date: group.dateecriture,
                    comptabilisees: montant,
                    // versees: comptabilisees,
                    montanth_tva: montant,
                    nif: dossierPlanComptableData?.nif || null,
                    nif_representaires: dossierPlanComptableData?.nifrepresentant || null,
                    num_stat: dossierPlanComptableData?.statistique || null,
                    cin: dossierPlanComptableData?.cin || null,
                    date_cin: dossierPlanComptableData?.datecin || null,
                    raison_sociale: dossierPlanComptableData?.libelle,
                    nom_commercial: dossierPlanComptableData?.libelle,
                    adresse: dossierPlanComptableData?.adresse || null,
                    fokontany: dossierPlanComptableData?.fokontany || null,
                    pays: dossierPlanComptableData?.pays || null,
                    ville: dossierPlanComptableData?.commune || null,
                    ex_province: dossierPlanComptableData?.province || null,
                    typeTier: 'avecNif',
                    type: nature
                }
            })
        )

        // return res.json(result);

        const mergedResult = Object.values(
            result.reduce((acc, item) => {
                if (!item.id_numcpt) return acc;

                if (!acc[item.id_numcpt]) {
                    acc[item.id_numcpt] = { ...item };
                } else {
                    acc[item.id_numcpt].comptabilisees += item.comptabilisees;
                    acc[item.id_numcpt].montanth_tva += item.montanth_tva;
                    // acc[item.id_numcpt].versees += item.versees;
                }

                return acc;
            }, {})
        );

        // return res.json(mergedResult);

        const mergedResultLenght = mergedResult.length;
        if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
            await droitcommas.bulkCreate(result, {
                returning: true
            })
        } else {
            await droitcommbs.bulkCreate(result, {
                returning: true
            })
        }

        return res.json({
            state: true,
            message: `${mergedResultLenght} ${nature} ${pluralize(mergedResultLenght, 'générée')} avec succès`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Une erreur est survenue" });
    }
};

// const generateDComAuto = async (res, nature, list, id_compte, id_dossier, id_exercice) => {
//     try {
//         // const processedEcritures = new Set();
//         for (const compteData of list) {
//             const journalData = await journals.findAll({
//                 where: {
//                     id_compte,
//                     id_dossier,
//                     id_exercice,
//                 },
//                 include: [
//                     {
//                         model: dossierplancomptable,
//                         attributes: ['compte'],
//                         required: true,
//                         where: { compte: { [Op.like]: `${compteData.compte}%` } }
//                     },
//                     {
//                         model: codejournals,
//                         attributes: ['code', 'type', 'nif', 'adresse', 'libelle']
//                     }
//                 ],
//                 order: [['dateecriture', 'ASC']]
//             });
//             // return res.json(journalData);

//             const journalEcriture = [...new Set(journalData.map(val => val.id_ecriture))];
//             for (const id_ecriture of journalEcriture) {
//                 const journalCode = await journals.findAll({
//                     where: {
//                         id_compte,
//                         id_dossier,
//                         id_exercice,
//                         id_ecriture
//                     },
//                     include: [
//                         {
//                             model: dossierplancomptable,
//                             attributes: ['compte', 'id', 'typetier', 'cin', 'autrepieceid', 'statistique', 'adresse', 'nif', 'nifrepresentant', 'libelle', 'adresseetranger']
//                         },
//                         {
//                             model: codejournals,
//                             attributes: ['code', 'type', 'nif', 'adresse', 'libelle', 'stat']
//                         }
//                     ],
//                 });

//                 const journalCodeMappedData = await Promise.all(
//                     journalCode.map(async (entry) => {
//                         const j = entry.toJSON();
//                         const dpc = j.dossierplancomptable;
//                         const cj = j.codejournal;

//                         const compte_centralise = await dossierplancomptable.findByPk(entry.id_numcptcentralise);

//                         return {
//                             ...j,
//                             compte: dpc?.compte || null,
//                             journal: cj?.code || null,
//                             typeCodeJournal: cj?.type || null,
//                             compte_centralise: compte_centralise?.compte || null,
//                             nifCodeJournal: cj?.nif || null,
//                             statCodeJournal: cj?.stat || null,
//                             adresseCodeJournal: cj?.adresse || null,
//                             libelleCodeJournal: cj?.libelle || null
//                         };
//                     })
//                 );

//                 if (journalCodeMappedData.length > 0) {
//                     const codeJournalType = journalCodeMappedData[0].typeCodeJournal;
//                     if (codeJournalType) {
//                         switch (codeJournalType) {
//                             case 'ACHAT': {
//                                 const journalAchats = journalCodeMappedData.filter(
//                                     item => item.compte_centralise && item.compte_centralise.toString().startsWith('401')
//                                 );
//                                 if (!journalAchats.length) continue;
//                                 for (const journalAchatData of journalAchats) {
//                                     const dossierPlanComptableData = await dossierplancomptable.findByPk(journalAchatData.id_numcpt);
//                                     if (dossierPlanComptableData) {
//                                         const solde = calculateSolde(compteData.senscalcul, journalAchatData);
//                                         switch (dossierPlanComptableData.typetier) {
//                                             case 'avec-nif': {
//                                                 const dataAvecNif = {
//                                                     id_compte,
//                                                     id_dossier,
//                                                     id_exercice,
//                                                     id_ecriture: journalAchatData.id_ecriture,
//                                                     id_numcpt: dossierPlanComptableData?.id || null,
//                                                     comptabilisees: solde,
//                                                     montanth_tva: solde,
//                                                     nif: dossierPlanComptableData?.nif || null,
//                                                     num_stat: dossierPlanComptableData?.statistique || null,
//                                                     raison_sociale: dossierPlanComptableData?.libelle,
//                                                     nom_commercial: dossierPlanComptableData?.libelle,
//                                                     adresse: dossierPlanComptableData?.adresse || null,
//                                                     fokontany: dossierPlanComptableData?.fokontany || null,
//                                                     ville: dossierPlanComptableData?.commune || null,
//                                                     ex_province: dossierPlanComptableData?.province || null,
//                                                     typeTier: 'avecNif',
//                                                     type: nature,
//                                                     date_cin: null
//                                                 }
//                                                 if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
//                                                     await droitcommas.create(dataAvecNif);
//                                                 } else {
//                                                     await droitcommbs.create(dataAvecNif);
//                                                 }
//                                                 break;
//                                             }
//                                             case 'etranger': {
//                                                 const dataEtranger = {
//                                                     id_compte,
//                                                     id_dossier,
//                                                     id_exercice,
//                                                     id_ecriture: journalAchatData.id_ecriture,
//                                                     id_numcpt: dossierPlanComptableData?.id || null,
//                                                     comptabilisees: solde,
//                                                     montanth_tva: solde,
//                                                     nif_representaires: dossierPlanComptableData?.nifrepresentant || null,
//                                                     adresse: dossierPlanComptableData?.adresseetranger || null,
//                                                     raison_sociale: dossierPlanComptableData?.libelle,
//                                                     nom_commercial: dossierPlanComptableData?.libelle,
//                                                     typeTier: 'prestataires',
//                                                     type: nature,
//                                                     date_cin: null
//                                                 }
//                                                 if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
//                                                     await droitcommas.create(dataEtranger);
//                                                 } else {
//                                                     await droitcommbs.create(dataEtranger);
//                                                 }
//                                                 break;
//                                             }
//                                             case 'sans-nif': {
//                                                 const dataSansNif = {
//                                                     id_compte,
//                                                     id_dossier,
//                                                     id_exercice,
//                                                     id_ecriture: journalAchatData.id_ecriture,
//                                                     id_numcpt: dossierPlanComptableData?.id || null,
//                                                     comptabilisees: solde,
//                                                     montanth_tva: solde,
//                                                     cin: dossierPlanComptableData?.cin || null,
//                                                     date_cin: parseDate(dossierPlanComptableData?.datecin),
//                                                     raison_sociale: dossierPlanComptableData?.libelle,
//                                                     nom_commercial: dossierPlanComptableData?.libelle,
//                                                     adresse: dossierPlanComptableData?.adresse || null,
//                                                     fokontany: dossierPlanComptableData?.fokontany || null,
//                                                     pays: dossierPlanComptableData?.pays || null,
//                                                     ville: dossierPlanComptableData?.commune || null,
//                                                     ex_province: dossierPlanComptableData?.province || null,
//                                                     typeTier: 'sansNif',
//                                                     type: nature
//                                                 }
//                                                 if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
//                                                     await droitcommas.create(dataSansNif);
//                                                 } else {
//                                                     await droitcommbs.create(dataSansNif);
//                                                 }
//                                                 break;
//                                             }
//                                             case 'general': {
//                                                 const dataAutre = {
//                                                     id_compte,
//                                                     id_dossier,
//                                                     id_exercice,
//                                                     id_ecriture: journalAchatData.id_ecriture,
//                                                     id_numcpt: dossierPlanComptableData?.id || null,
//                                                     comptabilisees: solde,
//                                                     montanth_tva: solde,
//                                                     typeTier: 'autres',
//                                                     type: nature,
//                                                     date_cin: null
//                                                 }
//                                                 if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
//                                                     await droitcommas.create(dataAutre);
//                                                 } else {
//                                                     await droitcommbs.create(dataAutre);
//                                                 }
//                                                 break;
//                                             }
//                                         }
//                                     }
//                                 }
//                                 break;
//                             }

//                             case 'OD':
//                             case 'CAISSE':
//                             case 'RAN':
//                             case 'VENTE': {
//                                 const journalOthers = journalCodeMappedData.filter(
//                                     item => item.compte && item.compte.toString().startsWith(compteData.compte)
//                                 )
//                                 if (!journalOthers.length) continue;
//                                 for (const journalOthersData of journalOthers) {
//                                     const dossierPlanComptableData = await dossierplancomptable.findByPk(journalOthersData.id_numcpt);
//                                     if (dossierPlanComptableData) {
//                                         const solde = calculateSolde(compteData.senscalcul, journalOthersData);
//                                         const dataAutre = {
//                                             id_compte,
//                                             id_dossier,
//                                             id_exercice,
//                                             id_ecriture: journalOthersData.id_ecriture,
//                                             id_numcpt: dossierPlanComptableData?.id || null,
//                                             comptabilisees: solde,
//                                             montanth_tva: solde,
//                                             typeTier: 'autres',
//                                             type: nature,
//                                             date_cin: null
//                                         }
//                                         if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
//                                             await droitcommas.create(dataAutre);
//                                         } else {
//                                             await droitcommbs.create(dataAutre);
//                                         }
//                                     }
//                                 }
//                                 break;
//                             }

//                             case 'BANQUE': {
//                                 const journalBanque = journalCodeMappedData.filter(
//                                     item => item.compte &&
//                                         (item.compte.toString().startsWith('66') ||
//                                             item.compte.toString().startsWith('622'))
//                                 )
//                                 if (!journalBanque.length) continue;
//                                 for (const journalBanqueData of journalBanque) {
//                                     const dossierPlanComptableData = await dossierplancomptable.findByPk(journalBanqueData.id_numcpt);
//                                     if (dossierPlanComptableData) {
//                                         const solde = calculateSolde(compteData.senscalcul, journalBanqueData);
//                                         const dataAvecNif = {
//                                             id_compte,
//                                             id_dossier,
//                                             id_exercice,
//                                             id_ecriture: journalBanqueData.id_ecriture,
//                                             id_numcpt: dossierPlanComptableData?.id || null,
//                                             comptabilisees: solde,
//                                             montanth_tva: solde,
//                                             nif: journalBanqueData?.nifCodeJournal || null,
//                                             num_stat: journalBanqueData?.statCodeJournal || null,
//                                             raison_sociale: journalBanqueData?.libelleCodeJournal,
//                                             nom_commercial: journalBanqueData?.libelleCodeJournal,
//                                             adresse: journalBanqueData?.adresseCodeJournal || null,
//                                             typeTier: 'avecNif',
//                                             type: nature,
//                                             date_cin: null
//                                         }
//                                         if (['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature)) {
//                                             await droitcommas.create(dataAvecNif);
//                                         } else {
//                                             await droitcommbs.create(dataAvecNif);
//                                         }
//                                     }
//                                 }
//                                 break;
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         return res.json({ message: `${nature} génerés avec succès`, state: true })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ state: false, message: "Erreur serveur", error: error.message });
//     }
// }

const generateDComAuto = async (res, nature, list, id_compte, id_dossier, id_exercice) => {
    try {

        const isTypeA = ['SVT', 'ADR', 'AC', 'AI', 'DEB'].includes(nature);
        const tableName = isTypeA ? 'droitcommas' : 'droitcommbs';

        const allComptes = list.map(c => c.compte);

        const journalData = await db.sequelize.query(
            `
            SELECT j.*,
                   cj.code,
                   cj.type AS type_codejournal,
                   cj.nif,
                   cj.adresse,
                   cj.libelle,
                   cj.stat,
                   dpc.typetier,
                   dpc.nif AS dpc_nif,
                   dpc.statistique,
                   dpc.adresse AS dpc_adresse,
                   dpc.libelle AS dpc_libelle,
                   dpc.fokontany,
                   dpc.commune,
                   dpc.province,
                   dpc.cin,
                   dpc.datecin,
                   dpc.pays,
                   dpc.nifrepresentant,
                   dpc.adresseetranger
            FROM journals j
            LEFT JOIN codejournals cj ON cj.id = j.id_journal
            LEFT JOIN dossierplancomptables dpc ON dpc.id = j.id_numcpt
            WHERE j.id_compte = :id_compte
            AND j.id_dossier = :id_dossier
            AND j.id_exercice = :id_exercice
            ORDER BY j.dateecriture ASC
            `,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const bulkData = [];

        for (const entry of journalData) {

            const matchCompte = list.find(c =>
                entry.compteaux?.startsWith(c.compte)
            );

            if (!matchCompte) continue;

            const solde = calculateSolde(matchCompte.senscalcul, entry);

            let dataInsert = {
                id_compte,
                id_dossier,
                id_exercice,
                id_numcpt: entry.id_numcpt,
                type: nature,
                date_cin: null
            };

            if (isTypeA) {
                dataInsert.comptabilisees = solde;
            } else {
                dataInsert.montanth_tva = solde;
            }

            switch (entry.type_codejournal) {

                case 'ACHAT':
                    if (!entry.comptegen?.startsWith('401')) continue;

                    if (entry.typetier === 'avec-nif') {
                        dataInsert = {
                            ...dataInsert,
                            nif: entry.dpc_nif,
                            num_stat: entry.statistique,
                            raison_sociale: entry.dpc_libelle,
                            nom_commercial: entry.dpc_libelle,
                            adresse: entry.dpc_adresse,
                            fokontany: entry.fokontany,
                            ville: entry.commune,
                            ex_province: entry.province,
                            typeTier: 'avecNif'
                        };
                    }
                    break;

                case 'BANQUE':
                    if (!entry.compteaux?.startsWith('66') &&
                        !entry.compteaux?.startsWith('622')) continue;

                    dataInsert = {
                        ...dataInsert,
                        nif: entry.nif,
                        num_stat: entry.stat,
                        raison_sociale: entry.libelle,
                        nom_commercial: entry.libelle,
                        adresse: entry.adresse,
                        typeTier: 'avecNif'
                    };
                    break;

                default:
                    dataInsert.typeTier = 'autres';
            }

            bulkData.push(dataInsert);
        }

        if (bulkData.length > 0) {
            await db.sequelize.getQueryInterface().bulkInsert(tableName, bulkData);
        }

        return res.json({
            message: `${nature} générés avec succès`,
            state: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            state: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

module.exports = {
    generateDroitComm,
    generateDComAuto
};