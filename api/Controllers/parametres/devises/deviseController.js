const { devises } = require('../../../Models');
const db = require('../../../Models');

// Liste toutes les devises
exports.getAllDevises = async (req, res) => {
  try {
    const { id_compte, id_dossier } = req.params;
    const devisesList = await devises.findAll({ where: { id_compte: id_compte, id_dossier: id_dossier } });
    res.json(devisesList);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};

// Récupère une devise par id
exports.getDeviseById = async (req, res) => {
  try {
    const devise = await devises.findByPk(req.params.id);
    if (!devise) return res.status(404).json({ message: 'Devise non trouvée' });
    res.json(devise);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Ajout d'une devise
exports.createDevise = async (req, res) => {
  try {
    const { code, libelle, fileId, compteId, idDevise } = req.body;

    let resData = {
      state: false,
      msg: 'Une erreur est survenue au moment du traitement.',
    }

    if (!fileId || !compteId || !code || !libelle || !idDevise) {
      return res.json({ state: false, msg: 'Champs obligatoires manquants' });
    }

    const id_compte = parseInt(compteId);
    const id_dossier = parseInt(fileId);
    const id = parseInt(idDevise);

    if (isNaN(id) || isNaN(id_compte) || isNaN(id_dossier)) {
      return res.status(400).json({
        state: false,
        message: "id_compte ou id_dossier invalide"
      });
    }

    const testIfExist = await devises.findAll({
      where: {
        id,
        id_compte,
        id_dossier,
      }
    })

    if (testIfExist.length === 0) {
      const deviseAdded = await devises.create({
        id_compte,
        id_dossier,
        code,
        libelle
      })
      if (deviseAdded) {
        resData.state = true;
        resData.msg = "Nouvelle ligne sauvegardée avec succès.";
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    } else {
      const deviseUpdated = await devises.update({
        code,
        libelle
      }, {
        where: { id }
      });
      if (deviseUpdated) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    }
    return res.json(resData);

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.json({ state: false, msg: 'Ce code existe déjà dans ce dossier.' });
    }
    return res.status(500).json({ state: false, msg: error.message });
  }
};

// Modification d'une devise
exports.updateDevise = async (req, res) => {
  try {
    const id = req.params.id;
    const { code, libelle } = req.body;
    const [nbUpdated] = await devises.update(
      { code, libelle },
      { where: { id } }
    );
    if (nbUpdated) {
      return res.json({ state: true, msg: 'Devise modifiée' });
    } else {
      return res.json({ state: false, msg: 'Aucune devise trouvée à modifier' });
    }
  } catch (error) {
    return res.json({ state: false, msg: 'Erreur lors de la modification' });
  }
};

// Suppression d'une devise
exports.deleteDevise = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Retrouver la devise pour récupérer id_compte et id_dossier
    const devise = await devises.findByPk(id);
    if (!devise) {
      return res.json({ state: false, msg: 'Aucune devise trouvée à supprimer' });
    }

    const id_compte = parseInt(devise.id_compte);
    const id_dossier = parseInt(devise.id_dossier);

    // Vérifier l'utilisation dans les journaux (sans filtrer par exercice)
    const usageCount = await db.journals.count({
      where: {
        id_devise: id,
        id_compte: id_compte,
        id_dossier: id_dossier,
      }
    });

    if (usageCount > 0) {
      return res.json({
        state: false,
        msg: `Impossible de supprimer cette devise car elle est utilisée dans des écritures.`
      });
    }

    // Supprimer si non utilisées
    const nbDeleted = await devises.destroy({ where: { id } });
    if (nbDeleted) {
      return res.json({ state: true, msg: 'Devise supprimée' });
    } else {
      return res.json({ state: false, msg: 'Aucune devise trouvée à supprimer' });
    }
  } catch (error) {
    return res.json({ state: false, msg: 'Erreur lors de la suppression' });
  }
};