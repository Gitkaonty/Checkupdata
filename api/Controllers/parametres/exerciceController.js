const db = require("../../Models");
require('dotenv').config();
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

const exercice = db.exercices;
const revisionControleMatrix = db.revisionControleMatrix;
const revisionControle = db.revisionControle;

const dossiers = db.dossiers;
const periodes = db.periodes;

const getListeExercice = async (req, res) => {
  try {
    const fileId = req.params.id;

    let resData = {
      state: false,
      msg: '',
      list: []
    }

    const list = await exercice.findAll({
      where: {
        id_dossier: fileId
      },
      raw: true,
      order: [['date_fin', 'DESC']]
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
    console.log(error);
  }
}

const getListeSituation = async (req, res) => {
  try {
    return res.json({
      state: true,
      msg: 'Liste des situations non disponible (feature non implémentée sur ce back).',
      list: [],
    });
  } catch (error) {
    console.log(error);
  }
}

const copydata = async (id_compte, id_dossier, createExercice, action) => {
  console.log(`Exercice créé avec succès - ID: ${createExercice.id}, Action: ${action}`);

  if (!revisionControleMatrix || !revisionControle) {
    return;
  }

  const listeControleMatrix = await revisionControleMatrix.findAll({
    where: { Valider: true },
  });

  const controlesCopiesIds = [];
  for (const item of listeControleMatrix) {
    await revisionControle.create({
      id_compte: id_compte,
      id_dossier: id_dossier,
      id_exercice: createExercice.id,
      id_controle: item.id_controle,
      Type: item.Type,
      compte: item.compte,
      test: item.test,
      description: item.description,
      anomalies: item.anomalies,
      details: item.details,
      Valider: item.Valider,
      Commentaire: item.Commentaire,
      Affichage: item.Affichage,
      paramUn: item.paramUn,
    });
    controlesCopiesIds.push(item.id);
  }

  if (controlesCopiesIds.length > 0) {
    await revisionControleMatrix.update(
      { Valider: false },
      { where: { id: controlesCopiesIds } }
    );
  }
};

const createFirstExercice = async (req, res) => {
  try {
    const { id_compte, id_dossier, date_debut, date_fin } = req.body;

    let resData = {
      state: false,
      msg: '',
      fileInfos: []
    }

    const createExercice = await exercice.create({
      id_compte: id_compte,
      id_dossier: id_dossier,
      date_debut: date_debut,
      date_fin: date_fin,
      libelle_rang: 'N',
      rang: 0,
      cloture: false
    });

    //copier Etats, les rubriques et les comptes rubriques
    await copydata(id_compte, id_dossier, createExercice, 'FIRST');

    if (createExercice) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const createNextExercice = async (req, res) => {
  try {
    const { compteId, fileId } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const lastExercice = await exercice.findOne({
      where: { id_compte: compteId, id_dossier: fileId },
      order: [['date_fin', 'DESC']]
    });

    if (lastExercice) {
      const date_debutNext = new Date(lastExercice.date_fin);
      const date_finNext = new Date(lastExercice.date_fin);

      date_debutNext.setDate(date_debutNext.getDate() + 1);
      date_finNext.setMonth(date_finNext.getMonth() + 12);

      const rang = lastExercice.rang + 1;

      let libelle_rang = '';
      if (rang === 0) {
        libelle_rang = 'N';
      } else if (rang > 0) {
        libelle_rang = `N+${rang}`;
      } else {
        libelle_rang = `N${rang}`;
      }

      const createExerciceNext = await exercice.create({
        id_compte: compteId,
        id_dossier: fileId,
        date_debut: date_debutNext,
        date_fin: date_finNext,
        libelle_rang: libelle_rang,
        rang: rang,
        cloture: false
      });

      //copier Etats, les rubriques et les comptes rubriques
      await copydata(compteId, fileId, createExerciceNext, 'NEXT');

      if (createExerciceNext) {
        resData.state = true;
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

const createPreviewExercice = async (req, res) => {
  try {
    const { compteId, fileId } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const LastExercice = await exercice.findOne({
      where: { id_compte: compteId, id_dossier: fileId },
      order: [['date_debut', 'ASC']]
    });

    if (LastExercice) {
      const date_debutPreview = new Date(LastExercice.date_debut);
      const date_finPreview = new Date(LastExercice.date_debut);

      date_debutPreview.setMonth(date_debutPreview.getMonth() - 12);
      date_finPreview.setDate(date_finPreview.getDate() - 1);

      const rang = LastExercice.rang - 1;

      let libelle_rang = '';
      if (rang === 0) {
        libelle_rang = 'N';
      } else if (rang > 0) {
        libelle_rang = `N+${rang}`;
      } else {
        libelle_rang = `N${rang}`;
      }

      const createExercicePreview = await exercice.create({
        id_compte: compteId,
        id_dossier: fileId,
        date_debut: date_debutPreview,
        date_fin: date_finPreview,
        libelle_rang: libelle_rang,
        rang: rang,
        cloture: true
      });

      //copier Etats, les rubriques et les comptes rubriques
      await copydata(compteId, fileId, createExercicePreview, 'PREV');

      if (createExercicePreview) {
        resData.state = true;
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

const verrouillerExercice = async (req, res) => {
  try {
    const { id_exercice, fileId } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const VerrExercice = await exercice.update(
      { cloture: true },
      { where: { id: id_exercice } }
    );

    const updateRang = await exercice.update(
      { rang: Sequelize.literal('rang - 1') },
      { where: { id_dossier: fileId } }
    );

    if (updateRang) {
      const listeEx = await exercice.findAll({
        where: { id_dossier: fileId }
      });

      if (listeEx) {
        await listeEx.map(async (item) => {
          let libelle_rang = '';
          if (item.rang === 0) {
            libelle_rang = 'N';
          } else if (item.rang > 0) {
            libelle_rang = `N+${item.rang}`;
          } else {
            libelle_rang = `N${item.rang}`;
          }

          await exercice.update(
            { libelle_rang: libelle_rang },
            { where: { id: item.id } }
          );
        });
      }
    }

    if (VerrExercice) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deverrouillerExercice = async (req, res) => {
  try {
    const { id_exercice, fileId } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deverrExercice = await exercice.update(
      { cloture: false },
      { where: { id: id_exercice } }
    );

    const updateRang = await exercice.update(
      { rang: Sequelize.literal('rang + 1') },
      { where: { id_dossier: fileId } }
    );

    if (updateRang) {
      const listeEx = await exercice.findAll({
        where: { id_dossier: fileId }
      });

      if (listeEx) {
        await listeEx.map(async (item) => {
          let libelle_rang = '';
          if (item.rang === 0) {
            libelle_rang = 'N';
          } else if (item.rang > 0) {
            libelle_rang = `N+${item.rang}`;
          } else {
            libelle_rang = `N${item.rang}`;
          }

          await exercice.update(
            { libelle_rang: libelle_rang },
            { where: { id: item.id } }
          );
        });
      }
    }

    if (deverrExercice) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deleteExercice = async (req, res) => {
  try {
    const { id_exerciceToDelete, fileId, rang } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deletedExercice = await exercice.destroy({
      where: { id: id_exerciceToDelete, id_dossier: fileId }
    });

    //supprimer les data paramétrages
    await etats.destroy({
      where: { id_exercice: id_exerciceToDelete, id_dossier: fileId }
    });

    await rubriques.destroy({
      where: { id_exercice: id_exerciceToDelete, id_dossier: fileId }
    });

    await compterubriques.destroy({
      where: { id_exercice: id_exerciceToDelete, id_dossier: fileId }
    });

    if (rang === 0) {
      await exercice.update(
        { rang: Sequelize.literal('rang - 1') },
        { where: { id_dossier: fileId } }
      );

      const listeEx = await exercice.findAll({
        where: { id_dossier: fileId }
      });

      if (listeEx) {
        await listeEx.map(async (item) => {
          let libelle_rang = '';
          if (item.rang === 0) {
            libelle_rang = 'N';
          } else if (item.rang > 0) {
            libelle_rang = `N+${item.rang}`;
          } else {
            libelle_rang = `N${item.rang}`;
          }

          await exercice.update(
            { libelle_rang: libelle_rang },
            { where: { id: item.id } }
          );
        });
      }
    }

    if (deletedExercice) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeExerciceById = async (req, res) => {
  try {
    const fileId = req.params.id;

    let resData = {
      state: false,
      msg: '',
      list: []
    }

    const list = await exercice.findByPk(fileId)

    if (list) {
      resData.state = true;
      resData.list = list;
    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors du traitement.';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeAnnee = async (req, res) => {
  try {
    const { id_dossier, id_compte } = req.params;

    let resData = {
      state: false,
      msg: '',
      list: []
    };

    if (!id_dossier || !id_compte) {
      resData.msg = 'Compte et dossier non trouvé';
      return res.json(resData);
    }

    const list = await exercice.findAll({
      where: { id_dossier, id_compte },
      attributes: ['date_debut', 'date_fin'],
      order: [['date_debut', 'ASC']]
    });

    if (list.length > 0) {
      const years = [];

      list.forEach(e => {
        const startYear = new Date(e.date_debut).getFullYear();
        const endYear = new Date(e.date_fin).getFullYear();

        for (let y = startYear; y <= endYear; y++) {
          years.push(y);
        }
      });

      const uniqueYears = [...new Set(years)].sort((a, b) => a - b);

      resData.state = true;
      resData.list = uniqueYears;
    } else {
      resData.msg = 'Aucun exercice trouvé';
    }

    return res.json(resData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

// === FONCTIONS POUR LES PERIODES ===

const getListePeriodes = async (req, res) => {
  try {
    const id_exercice = req.params.id_exercice;

    let resData = {
      state: false,
      msg: '',
      list: []
    };

    const list = await periodes.findAll({
      where: { id_exercice },
      order: [['date_debut', 'ASC']]
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
    console.log(error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
}

const createPeriode = async (req, res) => {
  try {
    const { id_exercice, id_compte, id_dossier, libelle, date_debut, date_fin } = req.body;

    let resData = {
      state: false,
      msg: '',
      fileInfos: []
    };

    // Vérifier que les dates sont dans l'exercice
    const exerciceParent = await exercice.findByPk(id_exercice);
    if (!exerciceParent) {
      resData.msg = 'Exercice non trouvé';
      return res.json(resData);
    }

    const debutPeriode = new Date(date_debut);
    const finPeriode = new Date(date_fin);
    const debutExercice = new Date(exerciceParent.date_debut);
    const finExercice = new Date(exerciceParent.date_fin);

    if (debutPeriode < debutExercice || finPeriode > finExercice) {
      resData.msg = 'Les dates de la période doivent être comprises entre les dates de l\'exercice';
      return res.json(resData);
    }

    // Récupérer les périodes existantes pour calculer le rang
    const periodesExistantes = await periodes.findAll({
      where: { id_exercice }
    });

    const createPeriode = await periodes.create({
      id_exercice,
      id_compte,
      id_dossier,
      libelle,
      date_debut,
      date_fin,
      rang: periodesExistantes.length + 1
    });

    if (createPeriode) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
}

const updatePeriode = async (req, res) => {
  try {
    const { id_periode, libelle, date_debut, date_fin } = req.body;

    let resData = {
      state: false,
      msg: '',
      fileInfos: []
    };

    // Récupérer la période
    const periode = await periodes.findByPk(id_periode);
    if (!periode) {
      resData.msg = 'Période non trouvée';
      return res.json(resData);
    }

    // Vérifier que les dates sont dans l'exercice
    const exerciceParent = await exercice.findByPk(periode.id_exercice);
    const debutPeriode = new Date(date_debut);
    const finPeriode = new Date(date_fin);
    const debutExercice = new Date(exerciceParent.date_debut);
    const finExercice = new Date(exerciceParent.date_fin);

    if (debutPeriode < debutExercice || finPeriode > finExercice) {
      resData.msg = 'Les dates de la période doivent être comprises entre les dates de l\'exercice';
      return res.json(resData);
    }

    const updated = await periodes.update({
      libelle,
      date_debut,
      date_fin
    }, {
      where: { id: id_periode }
    });

    if (updated) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
}

const deletePeriode = async (req, res) => {
  try {
    const { id_periode } = req.body;

    let resData = {
      state: false,
      msg: '',
      fileInfos: []
    };

    // Supprimer en cascade toutes les données liées à cette période
    const analyseClientAnomalie = db.analyseClientAnomalies;
    const commentaireAnalytiqueMensuelle = db.commentaireAnalytiqueMensuelle;
    const dossierRevisionCommentaire = db.dossierRevisionCommentaire;
    const dossierRevision = db.dossierRevision;
    const dossierRevisionSynthese = db.dossierRevisionSynthese;
    const rechercheDoublon = db.rechercheDoublons;
    const revisionCommentaireAnomalies = db.revisionCommentaireAnomalies;
    const revisionAnalytiqueResultat = db.revisionAnalytiqueResultats;
    const tableControleAnomalies = db.tableControleAnomalies;
    const revuAnalytique = db.revuAnalytique;
    const dossierRevisionAnalytique = db.dossierRevisionAnalytique;
    const commentaireAnalytique = db.commentaireAnalytique;
    const analyseFournisseurLigne = db.analyseFournisseurLignes;
    const analyseFournisseurAnomalie = db.analyseFournisseurAnomalies;
    const analyseClientLigne = db.analyseClientLignes;

    // Supprimer les données liées
    if (analyseClientAnomalie) await analyseClientAnomalie.destroy({ where: { id_periode } });
    if (commentaireAnalytiqueMensuelle) await commentaireAnalytiqueMensuelle.destroy({ where: { id_periode } });
    if (dossierRevisionCommentaire) await dossierRevisionCommentaire.destroy({ where: { id_periode } });
    if (dossierRevision) await dossierRevision.destroy({ where: { id_periode } });
    if (dossierRevisionSynthese) await dossierRevisionSynthese.destroy({ where: { id_periode } });
    if (rechercheDoublon) await rechercheDoublon.destroy({ where: { id_periode } });
    if (revisionCommentaireAnomalies) await revisionCommentaireAnomalies.destroy({ where: { id_periode } });
    if (revisionAnalytiqueResultat) await revisionAnalytiqueResultat.destroy({ where: { id_periode } });
    if (tableControleAnomalies) await tableControleAnomalies.destroy({ where: { id_periode } });
    if (revuAnalytique) await revuAnalytique.destroy({ where: { id_periode } });
    if (dossierRevisionAnalytique) await dossierRevisionAnalytique.destroy({ where: { id_periode } });
    if (commentaireAnalytique) await commentaireAnalytique.destroy({ where: { id_periode } });
    if (analyseFournisseurLigne) await analyseFournisseurLigne.destroy({ where: { id_periode } });
    if (analyseFournisseurAnomalie) await analyseFournisseurAnomalie.destroy({ where: { id_periode } });
    if (analyseClientLigne) await analyseClientLigne.destroy({ where: { id_periode } });

    // Supprimer la période
    const deleted = await periodes.destroy({
      where: { id: id_periode }
    });

    if (deleted) {
      resData.state = true;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
}

module.exports = {
  getListeExercice,
  createFirstExercice,
  createNextExercice,
  createPreviewExercice,
  verrouillerExercice,
  deverrouillerExercice,
  deleteExercice,
  getListeSituation,
  getListeExerciceById,
  getListeAnnee,
  getListePeriodes,
  createPeriode,
  updatePeriode,
  deletePeriode
};