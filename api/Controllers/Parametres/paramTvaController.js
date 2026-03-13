const bcrypt = require("bcrypt");
const db = require("../../Models");
require('dotenv').config();
const Sequelize = require('sequelize');
const { Op } = Sequelize;

const listecodetvas = db.listecodetvas;
const paramtvas = db.paramtvas;
const dossierplancomptables = db.dossierplancomptable;
const Journals = db.journals;
const codejournals = db.codejournals;
const tva_annexes = db.etatsTvaAnnexes;

// Simple pluralize helper used for messages
function pluralize(count, singular) {
  if (typeof count !== 'number') return singular;
  return count > 1 ? `${singular}s` : singular;
}

paramtvas.belongsTo(dossierplancomptables, { foreignKey: 'id_cptcompta' });
dossierplancomptables.hasMany(paramtvas, { foreignKey: 'id_cptcompta' });

paramtvas.belongsTo(listecodetvas, { foreignKey: 'type' });
listecodetvas.hasMany(paramtvas, { foreignKey: 'type' });

const getListeCodeTva = async (req, res) => {
  try {

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      list: []
    }

    const listeCodeTva = await listecodetvas.findAll({
      order: [['code', 'ASC']]
    });

    if (listeCodeTva) {
      resData.state = true;
      resData.list = listeCodeTva;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const listeParamTva = async (req, res) => {
  try {
    const fileId = req.params.id;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      list: []
    }

    const listeParamTva = await paramtvas.findAll({
      where: {
        id_dossier: fileId
      },
      include: [
        {
          model: dossierplancomptables,
          attributes: [
            ['compte', 'compte'],
            ['libelle', 'libelle']
          ],
        },
        {
          model: listecodetvas,
          attributes: [
            ['code', 'code'],
            ['libelle', 'libelle']
          ],
        }
      ],
      raw: true
      //order: [['dossierplancomptable.compte', 'ASC']]
    });

    if (listeParamTva) {
      resData.state = true;
      resData.list = listeParamTva;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const paramTvaAdd = async (req, res) => {
  try {
    const { idCompte, idDossier, idCode, compte, libelle, code } = req.body;

    console.log('req.body : ', req.body);

    let resData = {
      state: false,
      msg: 'Une erreur est survenue au moment du traitement.',
    }

    const testIfExist = await paramtvas.findAll({
      where: { id: idCode, id_dossier: idDossier }
    });

    // return console.log('testIfExist : ', testIfExist);

    if (testIfExist.length === 0) {
      const addCode = await paramtvas.create({
        id_compte: idCompte,
        id_dossier: idDossier,
        id_cptcompta: compte,
        type: code,
      });

      if (addCode) {
        resData.state = true;
        resData.msg = "Paramétrage tva sauvegardé avec succès.";
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    } else {
      const ModifyCode = await paramtvas.update(
        {
          id_compte: idCompte,
          id_dossier: idDossier,
          id_cptcompta: compte,
          type: code,
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
    console.log(error);
  }
}

const paramTvaDelete = async (req, res) => {
  try {
    const { fileId, compteId, idToDelete } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deletedParamTva = await paramtvas.destroy({
      where: {
        id: idToDelete,
        id_dossier: fileId,
        id_compte: compteId
      }
    });

    if (deletedParamTva) {
      resData.state = true;
      resData.msg = "Paramétrage tva supprimé avec succès.";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

// GET /paramTva/journals/byCompte
// Query: id_numcpt, id_dossier, id_exercice, mois, annee
async function listJournalsByCompte(req, res) {
  try {
    const { id_numcpt, id_dossier, id_exercice, mois, annee } = req.query;
    const where = {};
    if (id_numcpt) where.id_numcpt = id_numcpt;
    if (id_dossier) where.id_dossier = id_dossier;
    if (id_exercice) where.id_exercice = id_exercice;
    if (mois) where.decltvamois = Number(mois);
    if (annee) where.decltvaannee = Number(annee);
    // where.id_immob = { [Op.notIn]: [0, null] };

    const rows = await Journals.findAll({
      where,
      include: [
        { model: db.dossierplancomptable, attributes: ['compte'] },
        { model: db.codejournals, attributes: ['code'] }
      ],
      order: [['dateecriture', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'dateecriture', 'id_journal', 'piece', 'libelle', 'debit', 'credit', 'decltvamois', 'decltvaannee', 'decltva', 'id_immob']
    });

    const mappedRows = rows.map(journal => {
      const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
      return {
        ...rest,
        id_immob: rest.id_immob ? Number(rest.id_immob) : null,
        compte: dossierplancomptable?.compte || null,
        journal: codejournal?.code || null
      };
    });

    return res.json({ state: true, list: mappedRows, msg: 'OK' });
  } catch (error) {
    console.log('[paramTva] listJournalsByCompte error', error);
    return res.json({ state: false, list: [], msg: 'Erreur serveur' });
  }
}

const createJournal = async (req, res) => {
  try {
    const { id_compte, id_numcpt, id_dossier, id_exercice, dateecriture, piece, libelle, debit, credit, mois, annee } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    if (!id_compte) {
      return res.json({ state: false, msg: 'Champ requis manquant: id_compte' });
    }

    const payload = {
      id_compte,
      id_numcpt: String(id_numcpt),
      id_dossier,
      id_exercice,
      dateecriture: dateecriture || new Date(),
      piece: piece ?? '',
      libelle: libelle ?? '',
      debit: Number(debit || 0),
      credit: Number(credit || 0),
      decltvamois: Number(mois || 0),
      decltvaannee: Number(annee || 0),
      decltva: typeof req.body?.decltva === 'boolean' ? req.body.decltva : false,
      devise: 'MGA',
    };

    const created = await Journals.create(payload);
    return res.json({ state: true, item: created, msg: 'Écriture ajoutée' });
  } catch (error) {
    console.log('[paramTva] createJournal error', error);
    return res.json({ state: false, msg: 'Erreur serveur lors de la création' });
  }
}

const ajoutMoisAnnee = async (req, res) => {
  try {
    const { selectedDetailRows, decltvamois, decltvaannee, id_compte, id_dossier, id_exercice } = req.body;
    console.log("aaaaaaaaa", req.body);
    if (!selectedDetailRows || !decltvamois || !decltvaannee) {
      return res.status(400).json({ state: false, message: 'Données manquantes' });
    }

    // Récupérer les journaux sélectionnés
    const journalData = await Journals.findAll({
      where: { id: selectedDetailRows, id_compte, id_dossier, id_exercice },
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte'],
          required: true
        },
        {
          model: codejournals,
          attributes: ['code', 'type']
        }
      ],
      order: [['dateecriture', 'ASC']]
    });

    const mappedAllJournalsData = await Promise.all(
      journalData.map(async (journal) => {
        const { dossierplancomptables, codejournal, ...rest } = journal.toJSON();

        return {
          ...rest,
          compte: dossierplancomptables?.compte || null,
          journalCode: codejournal?.code || null,
          journalType: codejournal?.type || null,
        };
      })
    );
    console.log('[AJOUT][PAYLOAD]', { selected: selectedDetailRows, decltvamois, decltvaannee });
    console.table(mappedAllJournalsData.map(x => ({
      id: x.id, journalCode: x.journalCode, journalType: x.journalType, compte: x.compte
    })));

    // Partitionner: Banque (code 'BQ' ou type 'BANQUE') traité par ID; le reste via logique TVA par id_ecriture
    const bankIds = mappedAllJournalsData
      .filter(j => j.journalCode === 'BQ' || j.journalType === 'BANQUE')
      .map(j => j.id);
    const nonBankIds = mappedAllJournalsData
      .filter(j => !(j.journalCode === 'BQ' || j.journalType === 'BANQUE'))
      .map(j => j.id);

    let totalUpdated = 0;

    if (bankIds.length > 0) {
      const [cnt] = await Journals.update(
        { decltvamois: Number(decltvamois), decltvaannee: Number(decltvaannee), decltva: true },
        { where: { id: { [Op.in]: bankIds.map(Number) }, id_compte: Number(id_compte), id_dossier: Number(id_dossier), id_exercice: Number(id_exercice) } }
      );
      totalUpdated += Number(cnt || 0);
    }
    console.log('[AJOUT][PARTITION]', { bankIds, nonBankIds });
    const idEcritures = (nonBankIds.length > 0
      ? journalData.filter(j => nonBankIds.includes(j.id)).map(j => j.id_ecriture)
      : []);
    // console.log("yvgbhunj,kl;",idEcritures);
    console.log('[AJOUT][UPDATED]', { totalUpdated });
    // Récupérer toutes les écritures liées
    const allJournals = await Journals.findAll({
      where: { id_ecriture: idEcritures, id_compte, id_dossier, id_exercice },
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte'],
          required: true
        },
        {
          model: codejournals,
          attributes: ['code', 'type']
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
    // console.log(mappedAllJournals);
    const filteredJournals = mappedAllJournals.filter(
      j =>
        j.compte &&
        (
          j.compte.startsWith("4456") ||
          // j.compte.startsWith("4455") ||
          j.compte.startsWith("4456") ||
          j.compte.startsWith("4457") ||
          j.compte.startsWith("4458")
        )
    );


    const idEcrituresToUpdate = filteredJournals.map(j => j.id_ecriture);
    const uniqueIdEcrituresToUpdate = new Set(idEcrituresToUpdate);

    // Journaux sélectionnés qui NE commencent PAS par compteisi → à renvoyer
    const nonCompteIsiJournalsFiltered = mappedAllJournalsData.filter(
      j => !idEcrituresToUpdate.includes(j.id_ecriture)
    );

    // Si rien à modifier
    if (idEcrituresToUpdate.length === 0) {
      // Si aucune écriture TVA à maj mais on a peut-être déjà mis à jour des lignes banque
      return res.status(200).json({
        state: true,
        message: `${totalUpdated} ${pluralize(totalUpdated, "écriture")} ${pluralize(totalUpdated, "modifiée")} avec succès`,
        count: totalUpdated
      });
    }

    // Mise à jour des journaux qui commencent par compte TVA
    const [cntNonBank] = await Journals.update(
      { decltvamois, decltvaannee, decltva: true },
      { where: { id_ecriture: idEcrituresToUpdate, id_compte, id_dossier, id_exercice } }
    );

    totalUpdated += Number(cntNonBank || 0);

    // Réponse finale (cas non Banque)
    return res.status(200).json({
      message: `${totalUpdated} ${pluralize(totalUpdated, "écriture")} ${pluralize(totalUpdated, "modifiée")} avec succès`,
      state: true,
      count: totalUpdated
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

const suppressionMoisAnnee = async (req, res) => {
  try {
    const { selectedDetailRows, decltva, decltvamois, decltvaannee, id_compte, id_dossier, id_exercice } = req.body;

    if (!selectedDetailRows || !decltvamois || !decltvaannee || !id_compte || !id_dossier || !id_exercice) {
      return res.status(400).json({ state: false, message: 'Ids non trouvé' });
    }

    const journalData = await Journals.findAll({
      where: {
        id: selectedDetailRows
      }
    })

    const idEcrituresToUpdate = journalData.map(j => j.id_ecriture);
    const uniqueIdEcrituresToUpdate = new Set(idEcrituresToUpdate);

    if (idEcrituresToUpdate.length === 0) {
      return res.status(200).json({ state: false, message: "Aucun journal à mettre à jour." });
    }

    await Journals.update(
      { decltva: false, decltvamois: 0, decltvaannee: 0 },
      { where: { id_ecriture: idEcrituresToUpdate } }
    );

    await tva_annexes.destroy({
      where: {
        id_compte: Number(id_compte),
        id_dossier: Number(id_dossier),
        id_exercice: Number(id_exercice),
        mois: Number(decltvamois),
        annee: Number(decltvaannee),
        id_ecriture: { [Op.in]: idEcrituresToUpdate }
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


// PUT /paramTva/journals/declflag
const updateJournalsDeclFlag = async (req, res) => {
  try {
    const { ids, flag } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ state: false, msg: "Liste d'IDs manquante" });
    }
    const f = flag === true || flag === false ? flag : Boolean(flag);
    const [count] = await Journals.update(
      { decltva: f },
      { where: { id: ids } }
    );
    return res.json({ state: true, msg: `Mise à jour ${count} écriture(s)` });
  } catch (error) {
    console.log('[paramTva] updateJournalsDeclFlag error', error);
    return res.json({ state: false, msg: 'Erreur serveur lors de la mise à jour' });
  }
}

const getJournalsSelectionLigne = async (req, res) => {
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

    const journalData = await Journals.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        [Op.or]: [
          { decltva: false },
          {
            [Op.and]: [
              { decltva: true },
              { decltvamois: mois },
              { decltvaannee: annee },
            ],
          },
        ],
      },
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte'],
          required: true,
        },
        {
          model: codejournals,
          attributes: ['code', 'type', 'nif', 'stat', 'adresse', 'libelle'],
          required: false,
        },
      ],
      order: [['dateecriture', 'ASC']],
    });

    const mappedData = await Promise.all(
      journalData.map(async (journal) => {
        const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
        const compte_centralise = await dossierplancomptables.findByPk(journal.id_numcptcentralise);
        return {
          ...rest,
          compte: dossierplancomptable?.compte || null,
          journal: codejournal?.code || null,
          journal_type: codejournal?.type || null,
          journal_nif: codejournal?.nif || null,
          journal_stat: codejournal?.stat || null,
          journal_adresse: codejournal?.adresse || null,
          journal_libelle: codejournal?.libelle || null,
          compte_cetralise: compte_centralise?.compte || null,
        };
      })
    );

    return res.json({
      list: mappedData,
      state: true,
      message: 'Récupéré avec succès',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
  }
};

// GET /declaration/tva/ecritureassociee/:id_compte/:id_dossier/:id_exercice
// Retourne les lignes TVA (4456/4457/4458) pour la période + infos tiers (classe 4 hors 445) sur la même écriture
const getJournalsDeclTvaClasseTva = async (req, res) => {
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
    if (!mois) {
      return res.status(400).json({ state: false, message: 'Mois manquante' });
    }
    if (!annee) {
      return res.status(400).json({ state: false, message: 'Année manquante' });
    }

    const journalData = await Journals.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        decltvamois: mois,
        decltvaannee: annee,
        decltva: true,
      },
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte'],
          required: true,
          where: {
            [Op.or]: [
              { compte: { [Op.like]: '4456%' } },
              { compte: { [Op.like]: '4457%' } },
              { compte: { [Op.like]: '4458%' } },
            ],
          },
        },
        { model: codejournals, attributes: ['code'], required: false },
      ],
      order: [['dateecriture', 'ASC']],
    });

    const mappedData = await Promise.all(
      journalData.map(async (journal) => {
        const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
        const compte_centralise = await dossierplancomptables.findByPk(journal.id_numcptcentralise);

        const tiersLine = await Journals.findOne({
          where: {
            id_compte,
            id_dossier,
            id_exercice,
            id_ecriture: journal.id_ecriture,
          },
          include: [
            {
              model: dossierplancomptables,
              required: true,
              attributes: ['compte', 'libelle', 'nif', 'statistique', 'adresse', 'adressesansnif', 'adresseetranger'],
              where: {
                [Op.and]: [
                  { compte: { [Op.like]: '4%' } },
                  { compte: { [Op.notLike]: '445%' } },
                ],
              },
            },
          ],
          order: [['id', 'ASC']],
        });

        const tiersPc = tiersLine?.dossierplancomptable ? tiersLine.dossierplancomptable : null;
        const tiersAdresse = tiersPc?.adresse || tiersPc?.adressesansnif || tiersPc?.adresseetranger || null;

        return {
          ...rest,
          compte: dossierplancomptable?.compte || null,
          journal: codejournal?.code || null,
          compte_cetralise: compte_centralise?.compte || null,
          tiers_compte: tiersPc?.compte || null,
          tiers_libelle: tiersPc?.libelle || null,
          tiers_id_numcpt: tiersLine?.id_numcpt || null,
          tiers_nif: tiersPc?.nif || null,
          tiers_stat: tiersPc?.statistique || null,
          tiers_adresse: tiersAdresse,
        };
      })
    );

    return res.json({
      list: mappedData,
      state: true,
      message: 'Récupéré avec succès',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
  }
};

const recupPcClasseSix = async (req, res) => {
  try {
    const { id_dossier, id_compte } = req.params;

    const listepc = await dossierplancomptables.findAll({
      where: {
        id_dossier: id_dossier,
        id_compte: id_compte,
        libelle: { [Sequelize.Op.ne]: 'Collectif' },
        [Op.or]: [
          { compte: { [Op.like]: '4456%' } },
          { compte: { [Op.like]: '4457%' } },
        ]
      },
      include: [
        {
          model: dossierplancomptables,
          as: 'BaseAux',
          attributes: ['compte'],
          required: false,
          where: {
            id_dossier: id_dossier,
            id_compte: id_compte
          }
        }
      ],
      order: [['compte', 'ASC']],
      attributes: ['libelle', 'id']
    });

    const mappedListe = listepc.map(item => ({
      id: item.id,
      libelle: item.libelle,
      compte: item.BaseAux?.compte || null
    }));

    const uniqueListe = [];
    const seen = new Set();

    for (const item of mappedListe) {
      const key = `${item.libelle}-${item.compte}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueListe.push(item);
      }
    }

    const resData = {
      state: true,
      msg: "Donnée reçues avec succes !",
      liste: uniqueListe
    };

    if (listepc) {
      resData.state = true;
      resData.msg = "Donnée reçues avec succes !"
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const reinitializeTva = async (req, res) => {
  try {
    const { decltvamois, decltvaannee, id_compte, id_dossier, id_exercice } = req.body;

    if (!id_compte) {
      return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
    }
    if (!id_dossier) {
      return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
    }
    if (!id_exercice) {
      return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
    }

    if (!decltvamois || !decltvaannee) {
      return res.status(400).json({ state: false, message: 'Données manquantes' });
    }

    const journalsData = await Journals.findAll({
      where: {
        id_compte: id_compte,
        id_dossier: id_dossier,
        id_exercice: id_exercice,
        decltvamois: decltvamois,
        decltvaannee: decltvaannee,
        decltva: true
      }
    })

    const idEcritures = journalsData.map(j => j.id_ecriture);
    const uniqueIdEcrituresToUpdate = new Set(idEcritures);

    if (journalsData.length === 0) {
      return res.status(200).json({ message: `Aucune ligne à réinitaliser`, state: true });
    }

    await Journals.update(
      {
        decltvamois: 0,
        decltvaannee: 0,
        decltva: false
      }, {
      where: {
        id_ecriture: idEcritures
      }
    }
    )

    // await isis.destroy({
    //     where: {
    //         id_ecriture: idEcritures
    //     }
    // })

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

const generateAnnexeDeclarationAuto = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, mois, annee } = req.body;

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

    const journalData = await Journals.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        decltvamois: mois,
        decltvaannee: annee,
        decltva: true,
      },
      attributes: ['id', 'id_ecriture', 'num_facture', 'dateecriture', 'libelle', 'debit', 'credit', 'decltvamois', 'decltvaannee', 'decltva', 'id_numcpt', 'id_numcptcentralise', 'id_compte', 'id_dossier', 'id_exercice'],
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte'],
          required: true,
        },
        {
          model: codejournals,
          attributes: ['code', 'type', 'nif', 'stat', 'adresse', 'libelle', 'taux_tva'],
          required: false
        }
      ],
      order: [['dateecriture', 'ASC']]
    });

    const idsEcritures = Array.from(new Set((journalData || []).map(j => j.id_ecriture)));
    if (idsEcritures.length === 0) {
      return res.json({ state: true, message: 'Aucune TVA à générer', data: [] });
    }

    const allJournals = await Journals.findAll({
      where: {
        id_ecriture: idsEcritures,
        id_compte,
        id_dossier,
        id_exercice
      },
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte', 'libelle'],
          required: true,
        },
        {
          model: codejournals,
          attributes: ['code', 'type', 'nif', 'stat', 'adresse', 'libelle', 'taux_tva'],
          required: false
        }
      ],
      order: [['dateecriture', 'ASC'], ['id', 'ASC']]
    });

    const mappedData = await Promise.all(
      allJournals.map(async (journal) => {
        const { dossierplancomptable, codejournal, ...rest } = journal.toJSON();
        const compte_centralise = await dossierplancomptables.findByPk(journal.id_numcptcentralise);
        return {
          ...rest,
          compte: dossierplancomptable?.compte || null,
          libelle_compte: dossierplancomptable?.libelle || null,
          journal: codejournal?.code || null,
          journal_type: codejournal?.type || null,
          journal_nif: codejournal?.nif || null,
          journal_stat: (codejournal?.stat ?? codejournal?.statistique) || null,
          journal_adresse: codejournal?.adresse || null,
          journal_libelle: codejournal?.libelle || null,
          journal_taux_tva: codejournal?.taux_tva ?? null,
          compte_cetralise: compte_centralise?.compte || null
        };
      })
    );

    const groupedData = Object.values(
      mappedData.reduce((acc, item) => {
        const compteStr = item.compte?.toString() || "";
        if (!(compteStr.startsWith("401") || compteStr.startsWith("411") || compteStr.startsWith("445") || compteStr.startsWith("512") || compteStr.startsWith("53"))) {
          return acc;
        }

        if (!acc[item.id_ecriture]) {
          acc[item.id_ecriture] = {
            id_ecriture: item.id_ecriture,
            num_facture: item.num_facture,
            dateecriture: item.dateecriture,
            libelle: item.libelle,
            journal: item.journal,
            journal_type: item.journal_type,
            journal_nif: item.journal_nif || null,
            journal_stat: item.journal_stat || null,
            journal_adresse: item.journal_adresse || null,
            journal_libelle: item.journal_libelle || null,
            journal_taux_tva: item.journal_taux_tva ?? null,
            lignes: []
          };
        }

        acc[item.id_ecriture].lignes.push({
          compte: item.compte,
          libelle: item.libelle,
          libelle_compte: item.libelle_compte,
          debit: item.debit,
          credit: item.credit,
          id_numcpt: item.id_numcpt,
          compte_centralise: item.compte_cetralise,
          dateecriture: item.dateecriture
        });

        return acc;
      }, {})
    );

    const paramRows = await paramtvas.findAll({ where: { id_dossier } });
    const codeRows = await listecodetvas.findAll();
    const mapCompteToType = new Map((paramRows || []).map(p => [Number(p.id_cptcompta), Number(p.type)]));
    const mapTypeToCodeNature = new Map((codeRows || []).map(c => [Number(c.id), { code: c.code, nature: c.nature }]));

    const isEmpty = (v) => {
      const s = String(v ?? '').trim();
      if (s === '') return true;
      const low = s.toLowerCase();
      return low === 'n/a' || low === 'na' || low === 'null' || low === 'undefined' || low === '-';
    };

    const safeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const net = (l) => safeNum(l?.debit) - safeNum(l?.credit);

    const computed = await Promise.all(
      groupedData.map(async (group) => {
        const lignes = Array.isArray(group.lignes) ? group.lignes : [];

        const ligne401 = lignes.find(l => (l.compte || '').toString().startsWith('401'));
        const ligne411 = lignes.find(l => (l.compte || '').toString().startsWith('411'));
        const ligne512 = lignes.find(l => (l.compte || '').toString().startsWith('512'));
        const ligne53 = lignes.find(l => (l.compte || '').toString().startsWith('53'));

        const lignesTiers = lignes.filter(l => {
          const c = (l.compte || '').toString();
          return c.startsWith('4') && !c.startsWith('445');
        });
        const ligneTiers = ligne411 || ligne401 || lignesTiers[0] || null;
        let dossierplanComptableTiers = null;
        if (ligneTiers?.id_numcpt) {
          dossierplanComptableTiers = await dossierplancomptables.findByPk(ligneTiers.id_numcpt);
        }

        const ligneTVA = lignes.find(l => (l.compte || '').toString().startsWith('4456'))
          || lignes.find(l => (l.compte || '').toString().startsWith('4457'))
          || lignes.find(l => (l.compte || '').toString().startsWith('4458'))
          || null;

        let dossierplanComptableData = null;
        if (ligneTVA?.id_numcpt) {
          dossierplanComptableData = await dossierplancomptables.findByPk(ligneTVA.id_numcpt);
        } else if (ligne401?.id_numcpt) {
          dossierplanComptableData = await dossierplancomptables.findByPk(ligne401.id_numcpt);
        } else if (ligne411?.id_numcpt) {
          dossierplanComptableData = await dossierplancomptables.findByPk(ligne411.id_numcpt);
        } else if (ligne512?.id_numcpt) {
          dossierplanComptableData = await dossierplancomptables.findByPk(ligne512.id_numcpt);
        } else if (ligne53?.id_numcpt) {
          dossierplanComptableData = await dossierplancomptables.findByPk(ligne53.id_numcpt);
        }

        const notesAlgo = [];

        let montant_ttc = 0;
        let montant_ht = 0;
        const montant_tva_d_minus_c = ligneTVA ? net(ligneTVA) : 0;
        const montant_tva_c_minus_d = ligneTVA ? (safeNum(ligneTVA.credit) - safeNum(ligneTVA.debit)) : 0;
        let montant_tva = montant_tva_d_minus_c;

        const tvaTypeId = ligneTVA?.id_numcpt ? mapCompteToType.get(Number(ligneTVA.id_numcpt)) : undefined;
        const tvaMeta = tvaTypeId ? mapTypeToCodeNature.get(Number(tvaTypeId)) : null;
        const code_tva = tvaMeta?.code || null;
        const nature_code_tva = (tvaMeta?.nature || '').toString().trim().toUpperCase();
        const isDeductibleCode = nature_code_tva === 'DED';
        const isCollecteeCode = nature_code_tva === 'CA' || nature_code_tva === 'COL' || nature_code_tva === 'COLLECTEE';

        const journalTypeUpper = String(group.journal_type || '').toUpperCase();

        if (isDeductibleCode) {
          if (journalTypeUpper === 'ACHAT') {
            if (ligne401) {
              montant_ttc = safeNum(ligne401.credit) - safeNum(ligne401.debit);
              montant_ht = montant_ttc - montant_tva;
            } else {
              montant_ht = 0;
              notesAlgo.push('ligne non associée à un tier');
            }
          } else if (['VENTE', 'CAISSE', 'OD', 'RAN'].includes(journalTypeUpper)) {
            montant_ht = 0;
            notesAlgo.push('ligne non associée à un tier');
          } else if (journalTypeUpper === 'BANQUE') {
            const tauxTVA = safeNum(group.journal_taux_tva);
            if (!tauxTVA) {
              montant_ht = 0;
              notesAlgo.push('taux de TVA non paramétré dans le tableau code journal pour les codes journaux de type BANQUE');
            } else {
              montant_ht = montant_tva / tauxTVA;
            }
          }
        } else if (isCollecteeCode) {
          montant_tva = montant_tva_c_minus_d;
          if (journalTypeUpper === 'VENTE') {
            if (ligne411) {
              montant_ttc = safeNum(ligne411.debit) - safeNum(ligne411.credit);
              montant_ht = montant_ttc - montant_tva;
            } else {
              montant_ht = 0;
              notesAlgo.push('ligne non associée à un tier');
            }
          } else if (['ACHAT', 'CAISSE', 'OD', 'RAN', 'BANQUE'].includes(journalTypeUpper)) {
            montant_ht = 0;
            notesAlgo.push('ligne non associée à un tier');
          }
        } else {
          // Nature non reconnue: conserver un comportement neutre
          montant_tva = montant_tva_d_minus_c;
        }

        const is4456 = lignes.some(l => (l.compte || '').toString().startsWith('4456'));
        const is4457 = lignes.some(l => (l.compte || '').toString().startsWith('4457'));
        const collecteDeductible = is4456 ? 'D' : (is4457 ? 'C' : null);

        const typeTierValue = (dossierplanComptableData?.typetier || '').toString().trim().toLowerCase();
        const localEtranger = typeTierValue === 'etranger' ? 'E' : 'L';

        const isBanque = journalTypeUpper === 'BANQUE' || Boolean(ligne512);
        const tier_nif = dossierplanComptableTiers?.nif || '';
        const tier_stat = dossierplanComptableTiers?.statistique || '';
        const tier_adresse = dossierplanComptableTiers?.adresse || dossierplanComptableTiers?.adressesansnif || dossierplanComptableTiers?.adresseetranger || '';
        const tier_rs = dossierplanComptableTiers?.libelle || '';

        const tva_nif = dossierplanComptableData?.nif || '';
        const tva_stat = dossierplanComptableData?.statistique || '';
        const tva_adresse = dossierplanComptableData?.adresse || dossierplanComptableData?.adressesansnif || dossierplanComptableData?.adresseetranger || '';
        const tva_rs = (dossierplanComptableData?.libelle || '') || (group.libelle || '');

        const src_nif = isBanque ? (group.journal_nif ?? tier_nif ?? tva_nif) : (tier_nif || tva_nif);
        const src_stat = isBanque ? (group.journal_stat ?? tier_stat ?? tva_stat) : (tier_stat || tva_stat);
        const src_adresse = isBanque ? (group.journal_adresse ?? tier_adresse ?? tva_adresse) : (tier_adresse || tva_adresse);
        const isAllowedRsType = ['ACHAT', 'VENTE', 'BANQUE'].includes(journalTypeUpper);
        const src_rs = isAllowedRsType
          ? (isBanque ? ((group.journal_libelle || tier_rs || tva_rs) || ' - ') : ((tier_rs || tva_rs) || ' - '))
          : '';

        const baseMissing = [];
        if (isEmpty(src_nif)) baseMissing.push('NIF vide');
        if (isEmpty(src_stat)) baseMissing.push('STAT vide');
        if (isAllowedRsType && isEmpty(src_rs)) baseMissing.push('Raison sociale vide');
        if (isEmpty(src_adresse)) baseMissing.push('Adresse vide');
        if (isEmpty(group.num_facture)) baseMissing.push('Référence facture vide');
        if (!group.dateecriture) baseMissing.push('Date facture vide');
        if (!code_tva) baseMissing.push('Code TVA introuvable pour le compte');

        const commentaire = [...notesAlgo, ...baseMissing].filter(Boolean).join(', ');
        const anomalies = (notesAlgo.length + baseMissing.length) > 0;

        const row = {
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          id_numcpt: (ligneTVA?.id_numcpt) || dossierplanComptableData?.id || null,
          id_ecriture: group.id_ecriture,

          collecte_deductible: collecteDeductible,
          local_etranger: localEtranger,
          nif: src_nif || ' - ',
          raison_sociale: isAllowedRsType ? (src_rs || ' - ') : '',
          stat: src_stat || ' - ',
          adresse: src_adresse || ' - ',
          montant_ht: montant_ht,
          montant_tva: montant_tva,
          montant_ttc: montant_ttc,
          reference_facture: group.num_facture || ' - ',
          date_facture: group.dateecriture,
          nature: dossierplanComptableData?.nature || ' - ',
          libelle_operation: '',
          date_paiement: group.dateecriture,
          mois: mois,
          annee: annee,
          observation: group.observation || ' - ',
          n_dau: group.n_dau || ' - ',
          ligne_formulaire: group.ligne_formulaire || ' - ',
          anomalies: anomalies,
          commentaire: commentaire || null,
          code_tva: code_tva,
          compte_512: ligne512?.compte || null,
          montant_512: ligne512 ? net(ligne512) : null,
        };

        const tierDebug = {
          id_ecriture: group.id_ecriture,
          journal_type: journalTypeUpper,
          tiers_compte: ligneTiers?.compte || null,
          tiers_libelle_ligne: ligneTiers?.libelle_compte || ligneTiers?.libelle || null,
          tiers_id_numcpt: ligneTiers?.id_numcpt || null,
          tiers_libelle_pc: dossierplanComptableTiers?.libelle ?? null,
          tiers_nif: dossierplanComptableTiers?.nif ?? null,
          tiers_stat: dossierplanComptableTiers?.statistique ?? null,
          tiers_adresse: (dossierplanComptableTiers?.adresse ?? dossierplanComptableTiers?.adressesansnif ?? dossierplanComptableTiers?.adresseetranger) ?? null,
          tiers_typetier: dossierplanComptableTiers?.typetier ?? null,
          tiers_pc: dossierplanComptableTiers ? dossierplanComptableTiers.toJSON() : null,
          tva_compte: ligneTVA?.compte || null,
          tva_id_numcpt: ligneTVA?.id_numcpt || null,
          montant_tva: montant_tva,
          montant_ht: montant_ht,
          montant_ttc: montant_ttc,
          anomalies: anomalies,
          commentaire: commentaire || null,
        };

        return { row, tierDebug };
      })
    );

    const result = computed.map(x => x.row);
    const tierDebugRows = computed.map(x => x.tierDebug);

    console.log('[ANNEXE][GEN] tiers info (debug)');
    console.table(
      tierDebugRows.map(r => ({
        id_ecriture: r.id_ecriture,
        journal_type: r.journal_type,
        tiers_compte: r.tiers_compte,
        tiers_libelle: r.tiers_libelle_pc || r.tiers_libelle_ligne,
        tiers_id_numcpt: r.tiers_id_numcpt,
        tiers_nif: r.tiers_nif,
        tiers_stat: r.tiers_stat,
        tiers_adresse: r.tiers_adresse,
        tva_compte: r.tva_compte,
        tva_id_numcpt: r.tva_id_numcpt,
        montant_tva: r.montant_tva,
        montant_ht: r.montant_ht,
        montant_ttc: r.montant_ttc,
        anomalies: r.anomalies,
      }))
    );
    // Si tu veux tout voir (objet complet), décommente la ligne ci-dessous
    // console.dir(tierDebugRows, { depth: null });

    const idsToInsert = result.map(r => r.id_ecriture);
    const existingIds = new Set(
      (await tva_annexes.findAll({
        where: { id_ecriture: idsToInsert },

        attributes: ['id_ecriture']
      })).map(r => r.id_ecriture)
    );

    const isiRows = await tva_annexes.bulkCreate(result, {
      updateOnDuplicate: [
        'montant_ht', 'montant_tva', 'montant_ttc', 'reference_facture', 'date_facture', 'nature', 'libelle_operation', 'date_paiement', 'observation', 'n_dau', 'ligne_formulaire', 'anomalies', 'commentaire', 'code_tva', 'nif', 'stat', 'adresse', 'raison_sociale'
      ],
      returning: true
    });

    const created = isiRows.filter(r => !existingIds.has(r.id_ecriture)).length;
    const updated = isiRows.length - created;
    let message = '';
    if (created === 0 && updated === 0) {
      message = 'Aucune TVA à générer';
    } else if (created > 0 && updated === 0) {
      message = `${created} TVA ${pluralize(created, 'créée')} avec succès`;
    } else if (updated > 0 && created === 0) {
      message = `${updated} TVA ${pluralize(updated, 'modifiée')} avec succès`;
    } else {
      message = `${created} TVA ${pluralize(created, 'créée')} et ${updated} TVA ${pluralize(updated, 'modifiée')} avec succès`;
    }

    return res.json({
      state: true,
      message,
      data: isiRows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
  }
}

const generateTvaAutoDetail = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, decltvaannee, decltvamois } = req.body;

    if (!id_dossier || !id_compte || !id_exercice || !decltvaannee || !decltvamois) {
      return res.status(400).json({ state: false, message: 'Données manquantes' });
    }

    await Journals.update(
      {
        decltvaannee: 0,
        decltvamois: 0,
        decltva: false
      },
      {
        where: {
          id_dossier: id_dossier,
          id_compte: id_compte,
          id_exercice: id_exercice,
          decltva: true,
          decltvaannee: decltvaannee,
          decltvamois: decltvamois
        }
      }
    )

    let dateFilter = {};

    if (decltvaannee && decltvamois) {
      const mois = parseInt(decltvamois, 10);
      const annee = parseInt(decltvaannee, 10);


      // const startDate = new Date(annee, mois - 3, 1);
      // console.log("nvsidvbusd",startDate);
      const startDate = new Date(annee, mois - 4, 1);
      const formatted = startDate.toLocaleDateString('sv-SE'); // format YYYY-MM-DD
      console.log("startDate", formatted);


      const endDate = new Date(annee, mois, 0);
      endDate.setHours(23, 59, 59, 999);
      const formattedEndDate = endDate.toLocaleDateString('sv-SE'); // format YYYY-MM-DD
      console.log("endDate", formattedEndDate);

      dateFilter = { dateecriture: { [Op.between]: [startDate, endDate] } };
    }

    const journalData = await Journals.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        decltvaannee: 0,
        decltvamois: 0,
        decltva: false,
        ...dateFilter
      },
      include: [
        {
          model: dossierplancomptables,
          attributes: ['compte'],
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

    // return res.json(idEcritures);

    const allJournals = await Journals.findAll({
      where: {
        id_ecriture: uniqueIdEcritures
      },
      include: [
        {
          model: dossierplancomptables,
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
        const compte_centralise = await dossierplancomptables.findByPk(journal.id_numcptcentralise);

        return {
          ...rest,
          compte: dossierplancomptable?.compte || null,
          journal: codejournal?.code || null,
          comptecentralisation: compte_centralise?.compte || null
        };
      })
    );

    // return res.json(mappedAllJournals);

    const filteredJournals = mappedAllJournals.filter(j => j.compte && (j.compte.startsWith("4456") || j.compte.startsWith("4457")));

    // return res.json(filteredJournals);

    const idsEcritureToUpdate = filteredJournals.map(j => j.id_ecriture);

    const uniqueIdEcrituresToUpdate = new Set(idsEcritureToUpdate);

    // return res.json(uniqueIdEcrituresToUpdate);

    await Journals.update(
      {
        decltvaannee,
        decltvamois,
        decltva: true
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
      state: true,
      count
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
  }
};

const getDetailEcritureAssocie = async (req, res) => {
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


    const journalData = await Journals.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        decltvamois: mois,
        decltvaannee: annee,
        decltva: true,
      },
      include: [
        {
          model: dossierplancomptables,
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
        const compte_centralise = await dossierplancomptables.findByPk(journal.id_numcptcentralise);
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


module.exports = {
  getListeCodeTva,
  listeParamTva,
  paramTvaAdd,
  paramTvaDelete,
  listJournalsByCompte,
  createJournal,
  updateJournalsDeclFlag,
  getJournalsSelectionLigne,
  recupPcClasseSix,
  getJournalsDeclTvaClasseTva,
  generateAnnexeDeclarationAuto,
  ajoutMoisAnnee,
  reinitializeTva,
  suppressionMoisAnnee,
  generateTvaAutoDetail,
  getDetailEcritureAssocie
};