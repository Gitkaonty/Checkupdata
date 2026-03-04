const db = require("../../Models");
require('dotenv').config();
const { Op } = require('sequelize');

const rubriques = db.rubriques;
const rubriquesmatrices = db.rubriquesmatrices;
const compterubriques = db.compterubriques;
const compterubriquematrices = db.compterubriquematrices;

rubriques.belongsTo(rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
//rubriquesmatrices.hasMany(rubriques, { foreignKey: 'id_rubrique' });

const getListeRubrique = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableau, onglet } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: []
    }

    const liste = await rubriques.findAll({
      where: {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: exerciceId,
        id_etat: tableau,
        subtable: onglet,
        nature: { [Op.notIn]: ['TOTAL', 'TITRE'] },
      },
      include: [
        {
          model: rubriquesmatrices,
          attributes: [
            ['libelle', 'libelle']
          ],
          required: false,
          where: {
            id_etat: tableau,
          }
        },
      ],
      raw: true,
      order: [['ordre', 'ASC']]
    });

    if (liste) {
      resData.state = true;
      resData.liste = liste;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeCompteRubrique = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId } = req.body;

    let resData = {
      state: false,
      msg: 'Données récupérées avec succès',
      liste: []
    }

    if (rubriqueId) {
      const liste = await compterubriques.findAll({
        where: {
          id_compte: compteId,
          id_dossier: fileId,
          id_exercice: exerciceId,
          id_etat: tableau,
          nature: choixPoste,
          id_rubrique: rubriqueId
        },
        raw: true,
        order: [['compte', 'ASC']]
      });

      if (liste) {
        resData.state = true;
        resData.liste = liste;
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    } else {
      resData.state = true;
      resData.liste = [];
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const mappingCompteAdd = async (req, res) => {
  try {
    const { idParam, compteId, fileId, exerciceId, etatId, rubriqueId, nature, compte, senscalcul, condition, equation, par_default, active } = req.body;

    let resData = {
      state: false,
      msg: 'Une erreur est survenue au moment du traitement.',
    }

    const testIfExist = await compterubriques.findAll({
      where: {
        id: idParam,
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: exerciceId
      }
    });

    if (testIfExist.length === 0) {
      const addParam = await compterubriques.create({
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: exerciceId,
        id_etat: etatId,
        id_rubrique: rubriqueId,
        compte: compte,
        nature: nature,
        senscalcul: senscalcul,
        condition: condition,
        equation: equation,
        par_default: par_default,
        active: active
      });

      if (addParam) {
        resData.state = true;
        resData.msg = "Nouvelle ligne sauvegardée avec succès.";
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    } else {
      const ModifyParam = await compterubriques.update(
        {
          id_compte: compteId,
          id_dossier: fileId,
          id_exercice: exerciceId,
          id_etat: etatId,
          id_rubrique: rubriqueId,
          compte: compte,
          nature: nature,
          senscalcul: senscalcul,
          condition: condition,
          equation: equation,
          par_default: par_default,
          active: active
        },
        {
          where: { id: idParam }
        }
      );

      if (ModifyParam) {
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

const mappingCompteDelete = async (req, res) => {
  try {
    const { fileId, compteId, exerciceId, idToDelete } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deletedMappingCompte = await compterubriques.destroy({
      where: {
        id: idToDelete,
        id_dossier: fileId,
        id_compte: compteId,
        id_exercice: exerciceId
      }
    });

    if (deletedMappingCompte) {
      resData.state = true;
      resData.msg = "Paramétrage supprimé avec succès.";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const restaureDefaultParameter = async (req, res) => {
  try {
    const { fileId, compteId, exerciceId, tableau } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const restaureDefaultParams1 = await compterubriques.update(
      {
        active: false
      },
      {
        where: {
          id_dossier: fileId,
          id_compte: compteId,
          id_exercice: exerciceId,
          id_etat: tableau,
          par_default: false
        }
      }
    );

    const restaureDefaultParams2 = await compterubriques.update(
      {
        active: true
      },
      {
        where: {
          id_dossier: fileId,
          id_compte: compteId,
          id_exercice: exerciceId,
          id_etat: tableau,
          par_default: true
        }
      }
    );

    if (restaureDefaultParams1 && restaureDefaultParams2) {
      resData.state = true;
      resData.msg = "Restauration paramétrages terminée avec succès";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const updateDefaultParameter = async (req, res) => {
  try {
    const { fileId, compteId, exerciceId, tableau } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    //supprimer les paramétrages en cours
    await compterubriques.destroy({
      where:
      {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: exerciceId,
        id_etat: tableau,
        par_default: true
      }
    });

    //récupérer la liste des paramétrages
    const listeCompteRubrique = await compterubriquematrices.findAll({
      where: {
        id_etat: tableau
      }
    });

    if (listeCompteRubrique.length > 0) {
      listeCompteRubrique.map(async (item) => {
        const copy = await compterubriques.create({
          id_compte: compteId,
          id_dossier: fileId,
          id_exercice: exerciceId,
          id_etat: item.id_etat,
          id_rubrique: item.id_rubrique,
          compte: item.compte,
          nature: item.nature,
          senscalcul: item.senscalcul,
          condition: item.condition,
          equation: item.equation,
          par_default: item.par_default,
          active: item.active,
          exercice: item.exercice,
        });
      });

      resData.state = true;
      resData.msg = "Mise à jour des paramétrages terminée avec succès";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeRubriqueDCom = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;

    let resData = {
      state: false,
      msg: 'Une erreur est survenue lors du traitement.',
      liste: []
    }

    const liste = await rubriques.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        id_etat: 'DCOM',
      },
      include: [
        {
          model: rubriquesmatrices,
          attributes: [
            ['libelle', 'libelle']
          ],
          required: false,
          where: {
            id_etat: 'DCOM',
          }
        },
      ],
      raw: true,
      order: [['ordre', 'ASC']]
    });

    if (liste && liste.length > 0) {
      resData.state = true;
      resData.msg = 'Données récupérées avec succès';
      resData.liste = liste;
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      state: false,
      msg: 'Erreur serveur',
      liste: []
    });
  }
}

module.exports = {
  getListeRubrique,
  getListeCompteRubrique,
  mappingCompteAdd,
  mappingCompteDelete,
  restaureDefaultParameter,
  updateDefaultParameter,
  getListeRubriqueDCom
};