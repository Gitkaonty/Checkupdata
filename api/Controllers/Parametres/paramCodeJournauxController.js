const bcrypt = require("bcrypt");
const db = require("../../Models");
require('dotenv').config();
const Sequelize = require('sequelize');

const codejournals = db.codejournals;
const Dossier = db.dossiers;
const journals = db.journals;
const dossierplancomptable = db.dossierplancomptable;

const getListeCodeJournaux = async (req, res) => {
  try {
    const id_dossier = req.params.id;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      list: []
    }

    const list = await codejournals.findAll({
      where: {
        id_dossier
      },
      order: [['code', 'DESC']]
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

const addCodeJournal = async (req, res) => {
  try {
    const { idCompte, idDossier, idCode, code, libelle, type, compteassocie, nif, stat, adresse } = req.body;

    let resData = {
      state: false,
      msg: 'Une erreur est survenue au moment du traitement.',
    }

    const testIfExist = await codejournals.findAll({
      where: { id: idCode, id_dossier: idDossier }
    });

    if (testIfExist.length === 0) {
      // Vérifier doublon à la création
      const duplicateCreate = await codejournals.findOne({
        where: { id_dossier: idDossier, code: code }
      });
      if (duplicateCreate) {
        resData.state = false;
        resData.msg = "Ce code journal existe déjà.";
        return res.json(resData);
      }
      const addCode = await codejournals.create({
        id_compte: idCompte,
        id_dossier: idDossier,
        code: code,
        libelle: libelle,
        type: type,
        compteassocie: compteassocie,
        nif: nif,
        stat: stat,
        adresse: adresse
      });

      if (addCode) {
        resData.state = true;
        resData.msg = "Code journal sauvegardé avec succès.";
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    } else {
      // Vérifier doublon à la mise à jour (exclure l'enregistrement courant)
      const duplicateUpdate = await codejournals.findOne({
        where: {
          id_dossier: idDossier,
          code: code,
          id: { [Sequelize.Op.ne]: idCode }
        }
      });
      if (duplicateUpdate) {
        resData.state = false;
        resData.msg = "Ce code journal existe déjà.";
        return res.json(resData);
      }
      const ModifyCode = await codejournals.update(
        {
          id_compte: idCompte,
          id_dossier: idDossier,
          code: code,
          libelle: libelle,
          type: type,
          compteassocie: compteassocie,
          nif: nif,
          stat: stat,
          adresse: adresse
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

const codeJournauxDelete = async (req, res) => {
  try {
    const { fileId, compteId, idToDelete } = req.body;
    const fileIdNum = Number(fileId);
    const compteIdNum = Number(compteId);
    const idToDeleteNum = Number(idToDelete);

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    // console.log('[codeJournauxDelete] Input parsed', { fileIdNum, compteIdNum, idToDeleteNum });

    // Vérifier l'utilisation dans la table journals (sans filtrer par exercice)
    const usageCount = await journals.count({
      where: {
        id_compte: compteIdNum,
        id_dossier: fileIdNum,
        id_journal: idToDeleteNum
      }
    });

    // console.log('[codeJournauxDelete] Journals usageCount', usageCount);

    if (usageCount > 0) {
      resData.state = false;
      resData.msg = "Impossible de supprimer ce code journal: il est utilisé dans des écritures.";
      // console.log('[codeJournauxDelete] Deletion blocked due to usage');
      return res.json(resData);
    }

    // console.log('[codeJournauxDelete] Attempt destroy (id,id_dossier,id_compte)');
    let deletedCodeJournal = await codejournals.destroy({
      where: {
        id: idToDeleteNum,
        id_dossier: fileIdNum,
        id_compte: compteIdNum
      }
    });
    // console.log('[codeJournauxDelete] First destroy affected rows', deletedCodeJournal);
    // on retente la suppression en se basant sur (id, id_dossier) uniquement.
    if (!deletedCodeJournal) {
      // console.log('[codeJournauxDelete] Fallback destroy (id,id_dossier)');
      deletedCodeJournal = await codejournals.destroy({
        where: {
          id: idToDeleteNum,
          id_dossier: fileIdNum,
        }
      });
      // console.log('[codeJournauxDelete] Fallback destroy affected rows', deletedCodeJournal);
    }

    if (deletedCodeJournal) {
      resData.state = true;
      resData.msg = "Code journal supprimé avec succès.";
      // console.log('[codeJournauxDelete] Deletion success');
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
      // console.warn('[codeJournauxDelete] No rows deleted');
    }

    return res.json(resData);
  } catch (error) {
    console.error('[codeJournauxDelete] Error', error);
  }
}

const importCodeJournaux = async (req, res) => {
  try {
    const { idCompte, idDossier, codeJournauxData, ecraser } = req.body;

    let resData = {
      state: false,
      msg: 'Une erreur est survenue au moment du traitement.',
      anomalies: []
    }

    const validTypes = ['ACHAT', 'BANQUE', 'CAISSE', 'OD', 'RAN', 'VENTE'];
    let anomalies = [];
    let validData = [];

    if (ecraser) {
      const existingCodes = await codejournals.findAll({
        where: {
          id_compte: idCompte,
          id_dossier: idDossier
        }
      });

      for (const code of existingCodes) {
        const usageCount = await journals.count({
          where: {
            id_compte: idCompte,
            id_dossier: idDossier,
            id_journal: code.id
          }
        });

        if (usageCount === 0) {
          await codejournals.destroy({
            where: {
              id: code.id,
              id_compte: idCompte,
              id_dossier: idDossier
            }
          });
        }
      }
    }

    const existingCodes = await codejournals.findAll({
      where: { id_dossier: idDossier },
      attributes: ['code']
    });
    const existingCodesSet = new Set(existingCodes.map(c => c.code.trim().toUpperCase()));

    // Récupérer tous les comptes du plan comptable pour validation
    const planComptable = await dossierplancomptable.findAll({
      where: { id_dossier: idDossier },
      attributes: ['id', 'compte', 'nif', 'statistique', 'adresse']
    });
    console.log('[importCodeJournaux] Plan comptable count:', planComptable.length);
    const planComptableMap = new Map();
    planComptable.forEach(pc => {
      if (!pc.compte) {
        console.log('[importCodeJournaux] Compte null trouvé, ignoré');
        return;
      }
      const compteKey = pc.compte.trim().toUpperCase();
      const compteData = {
        id: pc.id,
        nif: pc.nif || '',
        stat: pc.statistique || '',
        adresse: pc.adresse || ''
      };
      planComptableMap.set(compteKey, compteData);
      // Log quelques exemples pour déboguer
      if (compteKey.startsWith('512') || compteKey.startsWith('52')) {
        console.log('[importCodeJournaux] Compte 512xxx ou 52xxx:', compteKey, compteData);
      }
    });

    for (let i = 0; i < codeJournauxData.length; i++) {
      const row = codeJournauxData[i];
      const lineNum = i + 1;
      let hasError = false;
      let compteInfo = null;

      if (!row.code || row.code.trim() === '') {
        anomalies.push(`Ligne ${lineNum}: Le code journal est obligatoire.`);
        hasError = true;
      }

      if (!row.libelle || row.libelle.trim() === '') {
        anomalies.push(`Ligne ${lineNum}: Le libellé est obligatoire.`);
        hasError = true;
      }

      if (!row.type || row.type.trim() === '') {
        anomalies.push(`Ligne ${lineNum}: Le type est obligatoire.`);
        hasError = true;
      } else {
        const typeUpper = row.type.toUpperCase();
        if (!validTypes.includes(typeUpper)) {
          anomalies.push(`Ligne ${lineNum}: Le type "${row.type}" n'existe pas dans le modèle. Types valides: ${validTypes.join(', ')}`);
          hasError = true;
        } else {
          if (typeUpper === 'BANQUE' || typeUpper === 'CAISSE') {
            if (!row.compteassocie || row.compteassocie.trim() === '') {
              anomalies.push(`Ligne ${lineNum}: Le compte associé est obligatoire pour le type ${typeUpper}.`);
              hasError = true;
            } else {
              // Vérifier si le compte existe dans le plan comptable
              const compteKey = row.compteassocie.trim().toUpperCase();
              console.log(`[importCodeJournaux] Ligne ${lineNum}: Recherche compte "${compteKey}"`);
              if (planComptableMap.has(compteKey)) {
                compteInfo = planComptableMap.get(compteKey);
                console.log(`[importCodeJournaux] Ligne ${lineNum}: Compte trouvé:`, compteInfo);
              } else {
                console.log(`[importCodeJournaux] Ligne ${lineNum}: Compte "${compteKey}" NON TROUVÉ`);
                anomalies.push(`Ligne ${lineNum}: Le compte associé "${row.compteassocie}" n'existe pas dans le plan comptable.`);
                hasError = true;
              }
            }
          }
        }
      }

      if (row.code && existingCodesSet.has(row.code.trim().toUpperCase())) {
        anomalies.push(`Ligne ${lineNum}: Le code journal "${row.code}" existe déjà dans la base de données.`);
        hasError = true;
      }

      if (!hasError) {
        // Si compteInfo existe, utiliser les informations du plan comptable
        const nifValue = compteInfo ? compteInfo.nif : (row.nif ? row.nif.trim() : '');
        const statValue = compteInfo ? compteInfo.stat : (row.stat ? row.stat.trim() : '');
        const adresseValue = compteInfo ? compteInfo.adresse : (row.adresse ? row.adresse.trim() : '');

        validData.push({
          id_compte: idCompte,
          id_dossier: idDossier,
          code: row.code.trim(),
          libelle: row.libelle.trim(),
          type: row.type.toUpperCase(),
          compteassocie: row.compteassocie ? row.compteassocie.trim() : '',
          nif: nifValue,
          stat: statValue,
          adresse: adresseValue
        });
      }
    }

    if (anomalies.length > 0) {
      resData.state = false;
      resData.msg = `${anomalies.length} anomalie(s) détectée(s). Veuillez corriger les erreurs.`;
      resData.anomalies = anomalies;
      return res.json(resData);
    }

    if (validData.length === 0) {
      resData.state = false;
      resData.msg = "Aucune donnée valide à importer.";
      return res.json(resData);
    }

    const imported = await codejournals.bulkCreate(validData);

    if (imported) {
      resData.state = true;
      resData.msg = `${imported.length} code(s) journal(aux) importé(s) avec succès.`;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue lors de l'import.";
    }

    return res.json(resData);
  } catch (error) {
    console.error('[importCodeJournaux] Error', error);
    return res.json({
      state: false,
      msg: 'Une erreur est survenue lors du traitement.',
      anomalies: []
    });
  }
}

module.exports = {
  getListeCodeJournaux,
  addCodeJournal,
  codeJournauxDelete,
  importCodeJournaux
};