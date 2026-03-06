const db = require("../../Models");
require('dotenv').config();
const Sequelize = require('sequelize');

const exercice = db.exercices;
const etats = db.etats;
const compterubriques = db.compterubriques;
const situations = db.situations;
const dossiers = db.dossiers;
const rubriques = db.rubriques;

const getListeExercice = async (req, res) => {
  try {
    const fileId = Number(req.params.id);

    let resData = {
      state: false,
      msg: '',
      list: []
    };

    const list = await db.sequelize.query(
      `
      SELECT *
      FROM exercices
      WHERE id_dossier = :fileId
      ORDER BY date_fin DESC
      `,
      {
        replacements: { fileId },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    if (list && list.length > 0) {
      resData.state = true;
      resData.list = list;
    } else {
      resData.msg = 'Aucun exercice trouvé.';
    }

    return res.json(resData);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      state: false,
      msg: 'Erreur serveur.'
    });
  }
};

const getListeSituation = async (req, res) => {
  try {
    const exerciceId = req.params.id;

    let resData = {
      state: false,
      msg: '',
      list: []
    }

    const list = await situations.findAll({
      where: {
        id_exercice: exerciceId
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

const copyMatriceQuerry = async (id_compte, id_dossier, id_exercice) => {
  const dossierRow = await dossiers.findByPk(id_dossier);
  const type = (dossierRow?.centrefisc === 'CFISC') ? 'CFISC' : 'DGE';

  await db.sequelize.transaction(async (t) => {

    // Copie Etat
    await db.sequelize.query(`
      INSERT INTO etats (
        id_compte,
        id_dossier,
        id_exercice,
        code,
        nom,
        ordre
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        code,
        nom,
        ordre
      FROM etatsmatrices
`, {
      replacements: {
        id_compte: id_compte,
        id_dossier: id_dossier,
        id_exercice
      }, transaction: t
    });

    // Copie Etat dans droit comm
    await db.sequelize.query(`
      INSERT INTO etatscomms (
        id_compte,
        id_dossier,
        id_exercice,
        code,
        nom,
        ordre
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        code,
        nom,
        ordre
      FROM etatscomatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Copie Etat dans droit comm plp
    await db.sequelize.query(`
      INSERT INTO etatsplps (
        id_compte,
        id_dossier,
        id_exercice,
        code_cn,
        nature_produit,
        unite_quantite,
        commercant_quantite,
        commercant_valeur,
        producteur_quantite,
        producteur_valeur
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        code_cn,
        nature_produit,
        unite_quantite,
        commercant_quantite,
        commercant_valeur,
        producteur_quantite,
        producteur_valeur
      FROM etatsplpmatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Matrice rubrique dans E-Bilan
    await db.sequelize.query(`
      INSERT INTO rubriques (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        subtable,
        id_rubrique,
        nature,
        note,
        ordre,
        niveau,
        senscalcul
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        subtable,
        id_rubrique,
        nature,
        note,
        ordre,
        niveau,
        senscalcul
      FROM rubriquesmatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Matrice compte rubriques dans E-Bilan
    await db.sequelize.query(`
      INSERT INTO compterubriques (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        compte,
        nature,
        senscalcul,
        condition,
        equation,
        par_default,
        active,
        exercice
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        compte,
        nature,
        senscalcul,
        condition,
        equation,
        par_default,
        active,
        exercice
      FROM compterubriquesmatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Matrice rubriques externes 
    await db.sequelize.query(`
      INSERT INTO rubriquesexternes (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        type,
        ordre,
        subtable,
        par_default,
        active
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        type,
        ordre,
        subtable,
        true,
        true
      FROM rubriquesexternesmatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Matrice rubriques externes analytique
    await db.sequelize.query(`
      INSERT INTO rubriquesexternesanalytiques (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        type,
        ordre,
        subtable,
        par_default,
        active,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        type,
        ordre,
        subtable,
        true,
        true,
        NOW(),
        NOW()
      FROM rubriquesexternesmatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Matrice compte rubriques etat financier
    await db.sequelize.query(`
      INSERT INTO compterubriqueexternes (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        tableau,
        compte,
        nature,
        senscalcul,
        condition,
        equation,
        par_default,
        active
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        tableau,
        compte,
        nature,
        senscalcul,
        condition,
        equation,
        true,
        true
      FROM compterubriqueexternesmatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Etat etat financier
    await db.sequelize.query(`
      INSERT INTO etatsetatfinanciers (
        id_compte,
        id_dossier,
        id_exercice,
        code,
        nom,
        ordre,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        code,
        nom,
        ordre,
        NOW(),
        NOW()
      FROM etatsetatfinanciermatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Etat etat financier analytique
    await db.sequelize.query(`
      INSERT INTO etatsetatfinancieranalytiques (
        id_compte,
        id_dossier,
        id_exercice,
        code,
        nom,
        ordre,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        code,
        nom,
        ordre,
        NOW(),
        NOW()
      FROM etatsetatfinanciermatrices
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Copie de matrice pour les 3 evcp
    await db.sequelize.query(`
      INSERT INTO liasseevcps (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'EVCP'
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    await db.sequelize.query(`
      INSERT INTO rubriquesexternesevcps (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        libelle,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        libelle,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'EVCP'
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    await db.sequelize.query(`
      INSERT INTO rubriquesexternesevcps (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        libelle,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        libelle,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'EVCP'
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    await db.sequelize.query(`
      INSERT INTO rubriquesexternesevcpanalytiques (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        libelle,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        ordre,
        niveau,
        libelle,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'EVCP'
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Copie de matrice dans le tableau DRF
    await db.sequelize.query(`
      INSERT INTO liassedrfs (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        signe,
        ordre,
        niveau,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        note,
        nature,
        senscalcul,
        ordre,
        niveau,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'DRF'
`, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice
      }, transaction: t
    });

    // Copie de matrice dans le tableau DP
    await db.sequelize.query(`
      INSERT INTO liassedps (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        nature_prov,
        ordre,
        niveau,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        nature,
        ordre,
        niveau,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'DP'
  `, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice: id_exercice
      },
      transaction: t
    });

    // Copie de matrice dans le tableau SAD
    await db.sequelize.query(`
      INSERT INTO liassesads (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        nature,
        ordre,
        niveau,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        nature,
        ordre,
        niveau,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'SAD'
  `, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice: id_exercice
      },
      transaction: t
    });

    // Copie de la matrice dans le tableau SDR
    await db.sequelize.query(`
      INSERT INTO liassesdrs (
        id_compte,
        id_dossier,
        id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        nature,
        ordre,
        niveau,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_etat,
        id_rubrique,
        libelle,
        nature,
        ordre,
        niveau,
        NOW(),
        NOW()
      FROM rubriquesmatrices
      WHERE id_etat = 'SDR'
  `, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice: id_exercice
      },
      transaction: t
    });

    // Copie du formulaire TVA annexe 
    await db.sequelize.query(`
      INSERT INTO formulaire_tva_annexes (
        id_compte,
        id_dossier,
        id_exercice,
        id_code,
        libelle,
        montant,
        "createdAt",
        "updatedAt"
      )
      SELECT
        :id_compte,
        :id_dossier,
        :id_exercice,
        id_code,
        libelle,
        0,
        NOW(),
        NOW()
      FROM formulaire_tva_annexes_matrices
    `, {
      replacements: {
        id_compte,
        id_dossier,
        id_exercice,
        type
      },
      transaction: t
    });

  })
}

const copydata = async (id_compte, id_dossier, createExercice, action) => {
  await copyMatriceQuerry(id_compte, id_dossier, createExercice?.id);
}

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
  getListeAnnee
};