const db = require('../../Models');

exports.getControleMatrices = async (req, res) => {
  try {
    const matrices = await db.revisionControleMatrix.findAll({
      order: [['id_controle', 'ASC']],
    });

    return res.json({
      state: true,
      matrices,
    });
  } catch (error) {
    console.error('Error fetching controle matrices:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur lors de la récupération des matrices de contrôles',
    });
  }
};

exports.addOrUpdateControleMatrix = async (req, res) => {
  try {
    const {
      id_controle,
      Type,
      compte,
      test,
      description,
      anomalies,
      details,
      Valider,
      Commentaire,
      Affichage,
      paramUn,
    } = req.body;

    if (!id_controle || !Type || !compte || !test || !description) {
      return res.status(400).json({
        state: false,
        message: 'Les champs id_controle, Type, compte, test et description sont obligatoires',
      });
    }

    const cleanedData = {
      id_controle: id_controle.toString().trim().substring(0, 255),
      Type: Type.toString().trim().substring(0, 255),
      compte: compte.toString().trim().substring(0, 255),
      test: test.toString().trim(),
      description: description.toString().trim(),
      anomalies: anomalies ? anomalies.toString().trim() : null,
      details: details ? details.toString().trim() : null,
      Valider: Boolean(Valider),
      Commentaire: Commentaire ? Commentaire.toString().trim() : null,
      Affichage: Affichage ? Affichage.toString().trim() : undefined,
      paramUn: paramUn === null || paramUn === undefined || paramUn === '' ? null : parseInt(paramUn, 10),
    };

    if (cleanedData.Affichage === undefined) {
      delete cleanedData.Affichage;
    }

    const [matrix, created] = await db.revisionControleMatrix.findOrCreate({
      where: { id_controle: cleanedData.id_controle },
      defaults: cleanedData,
    });

    if (!created) {
      await matrix.update(cleanedData);
    }

    if (cleanedData.paramUn !== null && cleanedData.paramUn !== undefined) {
      await db.revisionControle.update(
        { paramUn: cleanedData.paramUn },
        { where: { id_controle: cleanedData.id_controle } }
      );
    }

    return res.json({
      state: true,
      message: created ? 'Matrice de contrôle créée avec succès' : 'Matrice de contrôle mise à jour avec succès',
      matrix,
    });
  } catch (error) {
    console.error('Error saving controle matrix:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur lors de la sauvegarde de la matrice de contrôle',
    });
  }
};

exports.updateValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { Valider, Commentaire } = req.body;

    const matrix = await db.revisionControleMatrix.findByPk(id);
    if (!matrix) {
      return res.status(404).json({
        state: false,
        message: 'Matrice de contrôle non trouvée',
      });
    }

    await matrix.update({
      Valider: Boolean(Valider),
      Commentaire: Commentaire ? Commentaire.toString().trim() : matrix.Commentaire,
    });

    return res.json({
      state: true,
      message: 'Validation mise à jour avec succès',
      matrix,
    });
  } catch (error) {
    console.error('Error updating validation:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur lors de la mise à jour de la validation',
    });
  }
};

exports.deleteControleMatrix = async (req, res) => {
  try {
    const { id } = req.params;

    const matrix = await db.revisionControleMatrix.findByPk(id);
    if (!matrix) {
      return res.status(404).json({
        state: false,
        message: 'Matrice de contrôle non trouvée',
      });
    }

    await matrix.destroy();

    return res.json({
      state: true,
      message: 'Matrice de contrôle supprimée avec succès',
    });
  } catch (error) {
    console.error('Error deleting controle matrix:', error);
    return res.status(500).json({
      state: false,
      message: 'Erreur lors de la suppression de la matrice de contrôle',
    });
  }
};
