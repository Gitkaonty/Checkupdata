const db = require("../../Models");
const { Op } = require("sequelize");

const dossier = db.dossiers;
const portefeuille = db.portefeuille;
const compteDossiers = db.compteDossiers;
const comptePortefeuilles = db.comptePortefeuilles;

// dombancaires.belongsTo(pays, { as: 'tablepays', foreignKey: 'pays', targetKey: 'code' });

const recupListDossier = async (req, res) => {
  try {
    const { userId } = req.query;
    const { compteId } = req.params;

    let resData = {
      state: false,
      msg: '',
      fileList: []
    };

    if (!dossier) {
      return res.status(500).json({
        state: false,
        msg: "Modèle 'dossiers' non initialisé",
      });
    }

    const hasFilteringModels = Boolean(comptePortefeuilles && compteDossiers && portefeuille);

    if (!hasFilteringModels) {
      const list = await dossier.findAll({
        where: {
          id_compte: compteId,
        },
        attributes: ['id', 'id_compte', 'id_portefeuille', 'id_user', 'dossier', 'responsable', 'nbrpart', 'avecmotdepasse', 'motdepasse', 'seuil_revu_analytique', 'createdAt', 'updatedAt']
      });

      // Ajouter les noms des portefeuilles
      let finalList = list || [];
      if (portefeuille && Array.isArray(list)) {
        finalList = await Promise.all(
          list.map(async (d) => {
            try {
              const nomsPortefeuilles = await portefeuille.findAll({
                where: {
                  id: d.id_portefeuille
                },
                attributes: ['nom']
              });
              const nomsString = nomsPortefeuilles.map(p => p.nom).join(', ');
              return {
                ...d.dataValues,
                portefeuille: nomsString || 'N/A'
              };
            } catch (err) {
              return {
                ...d.dataValues,
                portefeuille: 'N/A'
              };
            }
          })
        );
      }

      resData.state = true;
      resData.fileList = finalList;
      return res.json(resData);
    }

    const userPortefeuille = await comptePortefeuilles.findAll({
      where: {
        user_id: userId
      }
    })

    const compteDossier = await compteDossiers.findAll({
      where: {
        user_id: userId
      }
    })

    const id_dossier = [... new Set(compteDossier.map(val => Number(val.id_dossier)))];
    const id_portefeuille = [...new Set(userPortefeuille.map(val => Number(val.id_portefeuille)))];

    const list = await dossier.findAll({
      where: {
        id_compte: compteId,
        [Op.or]: [
          {
            id_portefeuille: {
              [Op.overlap]: id_portefeuille
            }
          },
          {
            id: {
              [Op.in]: id_dossier
            }
          }
        ]
      },
      attributes: ['id', 'id_compte', 'id_portefeuille', 'id_user', 'dossier', 'responsable', 'nbrpart', 'avecmotdepasse', 'motdepasse', 'seuil_revu_analytique', 'createdAt', 'updatedAt']
    });

    if (list) {
      const dossiersAvecPortefeuille = await Promise.all(
        list.map(async d => {
          const nomsPortefeuilles = await portefeuille.findAll({
            where: {
              id: d.id_portefeuille
            },
            attributes: ['nom']
          });

          const nomsString = nomsPortefeuilles.map(p => p.nom).join(', ');

          return {
            ...d.dataValues,
            portefeuille: nomsString
          };
        })
      );

      resData.state = true;
      resData.fileList = dossiersAvecPortefeuille;
    }

    return res.json(resData);

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      state: false,
      msg: 'Erreur serveur',
      error: error.message
    });
  }
};

const getAllDossierByCompte = async (req, res) => {
  try {
    const { compteId } = req.params;

    let resData = {
      state: false,
      msg: '',
      fileList: []
    };

    const list = await dossier.findAll({
      where: {
        id_compte: compteId
      },
      attributes: ['id', 'dossier']
    })

    if (list) {
      resData.state = true;
      resData.fileList = list;
    }

    return res.json(resData);

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      state: false,
      msg: 'Erreur serveur',
      error: error.message
    });
  }
}

const getCompteDossier = async (req, res) => {
  try {
    const { userId } = req.params;
    let resData = {
      state: false,
      msg: '',
      fileList: []
    };
    const list = (await compteDossiers.findAll({
      where: {
        user_id: userId
      },
      include: [
        { model: dossier, attributes: ['dossier'] }
      ]
    })).map(val => {
      const data = val.toJSON();
      data.dossier = val?.dossier?.dossier || '';
      data.id_dossier = Number(val?.id_dossier);
      data.user_id = Number(val?.user_id);
      return data;
    })
    if (list) {
      resData.state = true;
      resData.fileList = list;
    }
    return res.json(resData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      state: false,
      msg: 'Erreur serveur',
      error: error.message
    });
  }
}

const createNewFile = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
    }

    const {
      action,
      idCompte,
      nomdossier,
      responsable,
      portefeuille,
    } = req.body;

    if (action === 'new') {
      const newFile = await dossier.create({
        id_compte: idCompte,
        id_portefeuille: portefeuille,
        dossier: nomdossier,
        responsable: responsable,
      });

      if (newFile) {
        resData.state = true;
        resData.msg = 'Création du nouveau dossier terminée avec succès';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors de la création du nouveau dossier';
      }

      return res.json(resData);
    }
  } catch (error) {
    console.log(error);
  }
}

// Fonction supprimée - plus utilisée
// const updatebaseAuxID = async (idCompte, id_dossier, id_modelePC) => { ... }

const deleteCreatedFile = async (req, res) => {
  try {
    const { id_dossier } = req.body;
    let resData = {
      state: false,
      msg: '',
    }

    const deleteState = await dossier.destroy({
      where: { id: id_dossier }
    });

    // Suppression simplifiée - seulement le dossier principal
    // await dossierplancomptable.destroy({
    //   where: { id_dossier: id_dossier }
    // });

    if (deleteState) {
      resData.state = true;
      resData.msg = 'Suppression du dossier effectuée avec succès';
    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors de la suppression du dossier';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const informationsFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    let resData = {
      state: false,
      msg: '',
      fileInfos: [],
      associe: [],
      domBank: [],
    }

    if (fileId > 0) {
      const list = await dossier.findAll({
        where: {
          id: fileId
        }
      });

      const listAssocie = await dossierassocies.findAll({
        where:
        {
          id_dossier: fileId,
          enactivite: true
        }
      });

      const listDomBank = await dombancaires.findAll({
        where:
        {
          id_dossier: fileId,
          enactivite: true
        },
        include: [
          {
            model: pays,
            as: 'tablepays',
            attributes: [
              ['nompays', 'nompays']
            ],
            required: true,
          },
        ],
        raw: true,
      });

      if (list.length > 0) {
        resData.state = true;
        resData.fileInfos = list;
        resData.associe = listAssocie;
        resData.domBank = listDomBank;
      } else {
        resData.state = false;
        resData.msg = 'une erreur est survenue lors du traitement.';
      }
    } else {
      resData.state = false;
      resData.msg = "ce dossier n'existe pas.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  } finally {
    // Add finally block to ensure cleanup
  }
}

const updateCentrefisc = async (req, res) => {
  try {
    const id = req.params.id || req.body?.id_dossier;
    const { centrefisc } = req.body || {};
    const allowed = ['DGE', 'CFISC'];

    if (!id) {
      return res.status(400).json({ state: false, msg: 'id du dossier manquant' });
    }
    if (!allowed.includes(centrefisc)) {
      return res.status(400).json({ state: false, msg: "centrefisc invalide: doit être 'DGE' ou 'CFISC'" });
    }

    const updateState = await dossier.update({ centrefisc }, { where: { id } });

    if (updateState[0] > 0) {
      return res.json({ state: true, msg: 'Mise à jour du centre fiscal effectuée avec succès', centrefisc });
    }
    return res.status(404).json({ state: false, msg: 'Dossier introuvable' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur' });
  }
}

const checkAccessDossier = async (req, res) => {
  try {
    const dossierId = Number(req.params.id);
    const userId = Number(req.user.userId);

    const userPortefeuilleData = (await comptePortefeuilles.findAll({
      where: {
        user_id: userId
      }
    })).map(val => {
      const data = val.toJSON();
      data.id = Number(val.id);
      data.id_portefeuille = Number(val.id_portefeuille);
      data.user_id = Number(val.user_id);
      return data;
    })

    const userPortefeuilleIds = userPortefeuilleData.map(p =>
      Number(p.id_portefeuille)
    );

    const dossierData = await dossier.findByPk(dossierId, {
      attributes: ['id_portefeuille', 'avecmotdepasse'],
    });

    if (!dossierData) {
      return res.status(200).json({ state: false });
    }

    if (dossierData.avecmotdepasse) {
      // Mot de passe requis mais simplifié - accès refusé
      return res.status(200).json({ state: false });
    }

    const dossierPortefeuilleIds = (dossierData.id_portefeuille || []).map(Number);

    const hasAccess = userPortefeuilleIds.some(id =>
      dossierPortefeuilleIds.includes(id)
    );

    if (!hasAccess) {
      return res.status(200).json({ state: false });
    }

    return res.status(200).json({ state: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ state: false, message: 'Erreur serveur' });
  }
};

const verifyFilePassword = async (req, res) => {
  try {
    const { motDePasse, id_dossier, user_id } = req.body;
    if (!user_id) {
      return res.json({ state: false, message: 'Utilisateur non trouvé' });
    }
    if (!id_dossier) {
      return res.json({ state: false, message: 'Aucun dossier sélectionné' });
    }
    if (!motDePasse) {
      return res.json({ state: false, message: 'Le mot de passe est vide' });
    }
    const id = Number(id_dossier);
    const dossierData = await dossier.findByPk(id);
    if (!dossierData) {
      return res.json({ state: false, message: 'Aucun dossier trouvé' });
    }
    const motDePasseDossier = dossierData.motdepasse;
    if (motDePasseDossier === motDePasse) {
      // Mot de passe correct - accès accordé (simplifié)
      return res.json({ state: true, message: 'Accès accordé' });
    } else {
      return res.json({ state: false, message: 'Mot de passe incorrect' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ state: false, message: 'Erreur serveur' });
  }
}

const deleteDossierPasswordAccess = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.json({ state: false, message: 'Utilisateur non trouvé' });
    }
    await dossierPasswordAccess.destroy({
      where: { user_id }
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ state: false, message: 'Erreur serveur' });
  }
}

module.exports = {
  recupListDossier,
  createNewFile,
  deleteCreatedFile,
  informationsFile,
  updateCentrefisc,
  checkAccessDossier,
  getAllDossierByCompte,
  getCompteDossier,
  verifyFilePassword
};