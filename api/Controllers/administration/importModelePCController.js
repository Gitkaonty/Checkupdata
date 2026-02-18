const db = require("../../Models");
require('dotenv').config();
const { sequelize } = require('../../Models');
const { withSSEProgress } = require('../../Middlewares/sseProgressMiddleware');

const modelePlanComptable = db.modelePlanComptable;
const modeleplancomptabledetail = db.modeleplancomptabledetail;

const testModelePcName = async (req, res) => {
  try {
    const { compteId, modeleName } = req.body;

    let resData = {
      state: false,
      msg: '',
      list: []
    }

    const updatedList = await modelePlanComptable.findAll({
      where:
      {
        id_compte: compteId,
        nom: modeleName
      },
      raw: true,
    });

    if (updatedList.length > 0) {
      resData.state = true;
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const convertScientificToString = (value) => {
  if (!value || value === '') return '';

  const str = String(value);

  if (str.includes('E') || str.includes('e')) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      return num.toFixed(0);
    }
  }

  return str;
};

const importModelePc = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idCompte, nomModele, modelePcData } = req.body;

    if (!Array.isArray(modelePcData) || modelePcData.length === 0) {
      return res.json({
        state: false,
        msg: "Aucune donnée à importer",
        list: [],
        nbrligne: 0
      });
    }

    const modeleName = await modelePlanComptable.create(
      {
        id_compte: idCompte,
        nom: nomModele,
        par_default: false
      },
      { transaction }
    );

    const rowsToInsert = modelePcData.map(item => {
      let dateCin = null;

      if (item.datecin && typeof item.datecin === "string" && item.datecin.includes("/")) {
        const [day, month, year] = item.datecin.split("/");
        dateCin = new Date(`${year}-${month}-${day}`);
      }

      return {
        id_compte: idCompte,
        id_modeleplancomptable: modeleName.id,
        compte: item.compte?.trim(),
        libelle: item.libelle?.trim(),
        compteautre: item?.comptecorrespondance?.trim(),
        libelleautre: item.libelleautre?.trim(),
        nature: item.nature,
        baseaux: item.baseaux,
        typetier: item.typetier,
        cptcharge: 0,
        cpttva: 0,
        nif: convertScientificToString(item.nif),
        statistique: convertScientificToString(item.statistique),
        adresse: item.adresse,
        motcle: "",
        cin: convertScientificToString(item.cin),
        datecin: dateCin,
        autrepieceid: item.autrepieceidentite,
        refpieceid: item.refpieceidentite,
        adressesansnif: item.adressesansnif,
        nifrepresentant: convertScientificToString(item.nifrepresentant),
        adresseetranger: convertScientificToString(item.adresseetranger),
        pays: item.pays?.trim() || "Madagascar",
        province: item.province || "",
        region: item.region || "",
        district: item.district || "",
        commune: item.commune || ""
      };
    });

    await modeleplancomptabledetail.bulkCreate(rowsToInsert, { transaction });

    await sequelize.query(
      `
      UPDATE modeleplancomptabledetails A
      SET baseaux_id = B.id
      FROM modeleplancomptabledetails B
      WHERE A.baseaux = B.compte
        AND A.id_compte = :idCompte
        AND A.id_modeleplancomptable = :modeleId
        AND B.id_compte = :idCompte
        AND B.id_modeleplancomptable = :modeleId
      `,
      {
        replacements: {
          idCompte,
          modeleId: modeleName.id
        },
        transaction
      }
    );

    await transaction.commit();

    return res.json({
      state: true,
      msg: `${rowsToInsert.length} lignes ont été importées avec succès`,
      list: [],
      nbrligne: rowsToInsert.length
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur import modèle PC :", error);

    return res.status(500).json({
      state: false,
      msg: "Erreur lors de l'import du modèle",
      error: error.message
    });
  }
};

// Version avec progression SSE en temps réel
const importModelePcWithProgressLogic = async (req, res, progress) => {
  const transaction = await sequelize.transaction();

  try {
    const { idCompte, nomModele, modelePcData } = req.body;

    if (!Array.isArray(modelePcData) || modelePcData.length === 0) {
      progress.error("Aucune donnée à importer");
      return;
    }

    const totalLines = modelePcData.length;
    progress.update(0, totalLines, 'Démarrage...', 0);

    // Étape 1: Créer le modèle (5%)
    progress.step('Création du modèle de plan comptable...', 5);

    const modeleName = await modelePlanComptable.create(
      {
        id_compte: idCompte,
        nom: nomModele,
        par_default: false
      },
      { transaction }
    );

    // Étape 2: Préparer les données (10%)
    progress.step('Préparation des données...', 10);

    const rowsToInsert = modelePcData.map(item => {
      let dateCin = null;

      if (item.datecin && typeof item.datecin === "string" && item.datecin.includes("/")) {
        const [day, month, year] = item.datecin.split("/");
        dateCin = new Date(`${year}-${month}-${day}`);
      }

      return {
        id_compte: idCompte,
        id_modeleplancomptable: modeleName.id,
        compte: item.compte?.trim(),
        libelle: item.libelle?.trim(),
        compteautre: item?.comptecorrespondance?.trim(),
        libelleautre: item.libelleautre?.trim(),
        nature: item.nature,
        baseaux: item.baseaux,
        typetier: item.typetier,
        cptcharge: 0,
        cpttva: 0,
        nif: convertScientificToString(item.nif),
        statistique: convertScientificToString(item.statistique),
        adresse: item.adresse,
        motcle: "",
        cin: convertScientificToString(item.cin),
        datecin: dateCin,
        autrepieceid: item.autrepieceidentite,
        refpieceid: item.refpieceidentite,
        adressesansnif: item.adressesansnif,
        nifrepresentant: convertScientificToString(item.nifrepresentant),
        adresseetranger: convertScientificToString(item.adresseetranger),
        pays: item.pays?.trim() || "Madagascar",
        province: item.province || "",
        region: item.region || "",
        district: item.district || "",
        commune: item.commune || ""
      };
    });

    // Étape 3: Insérer les données par lots (10% à 80%)
    await progress.processBatch(
      rowsToInsert,
      async (batch) => {
        await modeleplancomptabledetail.bulkCreate(batch, { transaction });
      },
      10,
      80,
      'Importation en cours...'
    );

    // Étape 4: Mise à jour des relations (85%)
    progress.step('Mise à jour des relations...', 85);

    await sequelize.query(
      `
      UPDATE modeleplancomptabledetails A
      SET baseaux_id = B.id
      FROM modeleplancomptabledetails B
      WHERE A.baseaux = B.compte
        AND A.id_compte = :idCompte
        AND A.id_modeleplancomptable = :modeleId
        AND B.id_compte = :idCompte
        AND B.id_modeleplancomptable = :modeleId
      `,
      {
        replacements: {
          idCompte,
          modeleId: modeleName.id
        },
        transaction
      }
    );

    // Étape 5: Finalisation (95%)
    progress.step('Finalisation...', 95);

    await transaction.commit();

    // Succès
    progress.complete(
      `${rowsToInsert.length} lignes ont été importées avec succès`,
      { nbrligne: rowsToInsert.length }
    );

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur import modèle PC :", error);
    progress.error("Erreur lors de l'import du modèle", error);
  }
};

// Wrapper SSE
const importModelePcWithProgress = withSSEProgress(importModelePcWithProgressLogic, {
  batchSize: 50
});

module.exports = {
  testModelePcName,
  importModelePc,
  importModelePcWithProgress
};