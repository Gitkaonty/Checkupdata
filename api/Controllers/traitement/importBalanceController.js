const bcrypt = require("bcrypt");
const db = require("../../Models");
require('dotenv').config();
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const { withSSEProgress } = require('../../Middlewares/sseProgressMiddleware');

const journals = db.journals;
const codejournals = db.codejournals;
const dossierPlanComptable = db.dossierplancomptables;
const balanceimportees = db.balanceimportees;

const createNotExistingCompte = async (req, res)  => {
  try{
    const { compteId, fileId, compteToCreate } = req.body; 

    let resData = {
      state: false,
      msg: '',
      list: []
    }

    let valid = false;
    
    //création des comptes généraux
    if(compteToCreate.length > 0){
      await compteToCreate.map(item => {
        dossierPlanComptable.create({
          id_compte: compteId,
          id_dossier: fileId,
          compte: item.compte,
          libelle: item.libelle,
          nature: "General",
          typetier: "sans-nif",
        });
      })
      valid = true;
    }else{
      valid = true;
    }

    //récuperer la liste à jour des codes journaux
    const updatedList = await dossierPlanComptable.findAll({
      where: 
        {
          id_compte: compteId,
          id_dossier: fileId
        },
        raw:true,
      });

    if(valid){
      resData.state = true;
      resData.list = updatedList;
    }else{
      resData.state = false;
      resData.list = updatedList;
    }

    return res.json(resData);
  }catch (error){
  }
}

const importBalance = async (req, res)  => {
  try{
    const { compteId, userId, fileId, selectedPeriodeId, balanceData } = req.body; 

    let resData = {
      state: false,
      msg: '',
      list: [],
      nbrligne: 0
    }

    let importSuccess = 1;

    await balanceimportees.destroy({
      where: 
        {
          id_compte: compteId,
          id_dossier: fileId,
          id_exercice: selectedPeriodeId,
        }
    });

    if(balanceData.length > 0){
      for(let item of balanceData){
        //transformation de débit en double précision si c'est null ou vide
        let mvtdebit = 0;
        if(item.mvtdebit !== null && item.mvtdebit !==""){
          mvtdebit = item.mvtdebit.replace(',','.')
        }

        let mvtcredit = 0;
        if(item.mvtcredit !== null && item.mvtcredit !==""){
          mvtcredit = item.mvtcredit.replace(',','.')
        }

        let soldedebit = 0;
        if(item.soldedebit !== null && item.soldedebit !==""){
          soldedebit = item.soldedebit.replace(',','.')
        }

        let soldecredit = 0;
        if(item.soldecredit !== null && item.soldecredit !==""){
          soldecredit = item.soldecredit.replace(',','.')
        }

        //import du journal dans la table journal
        try{
          await balanceimportees.create({
            id_compte: compteId,
            id_dossier: fileId,
            id_exercice: selectedPeriodeId,
            compte: item.compte,
            libelle: item.libelle,
            mvtdebit: mvtdebit,
            mvtcredit: mvtcredit,
            soldedebit: soldedebit,
            soldecredit: soldecredit,
          });

          importSuccess = importSuccess*1;
        }catch (error){
          importSuccess = importSuccess*0;
          resData.msg = error;
        }
      };
    }else{
      resData.msg = `${balanceData.length} lignes ont été importées avec succès`;
      resData.nbrligne = balanceData.length;
      resData.state = true;
    }

    if(importSuccess === 1){
      resData.msg = `${balanceData.length} lignes ont été importées avec succès`;
      resData.nbrligne = balanceData.length;
      resData.state = true;
    }else{
      resData.state = false;
    }
    
    return res.json(resData);
  }catch (error){
  }
}

// Version avec progression SSE en temps réel
const importBalanceWithProgressLogic = async (req, res, progress) => {
  try {
    const { compteId, userId, fileId, selectedPeriodeId, balanceData } = req.body;

    if (!Array.isArray(balanceData) || balanceData.length === 0) {
      progress.error("Aucune donnée à importer");
      return;
    }

    const totalLines = balanceData.length;
    progress.update(0, totalLines, 'Démarrage...', 0);

    // Étape 1: Suppression des données existantes (5%)
    progress.step('Suppression des données existantes...', 5);
    
    await balanceimportees.destroy({
      where: {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: selectedPeriodeId,
      }
    });

    // Étape 2: Préparation des données (10%)
    progress.step('Préparation des données...', 10);

    const preparedData = balanceData.map(item => {
      let mvtdebit = 0;
      if (item.mvtdebit !== null && item.mvtdebit !== "") {
        mvtdebit = item.mvtdebit.replace(',', '.');
      }

      let mvtcredit = 0;
      if (item.mvtcredit !== null && item.mvtcredit !== "") {
        mvtcredit = item.mvtcredit.replace(',', '.');
      }

      let soldedebit = 0;
      if (item.soldedebit !== null && item.soldedebit !== "") {
        soldedebit = item.soldedebit.replace(',', '.');
      }

      let soldecredit = 0;
      if (item.soldecredit !== null && item.soldecredit !== "") {
        soldecredit = item.soldecredit.replace(',', '.');
      }

      return {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: selectedPeriodeId,
        compte: item.compte,
        libelle: item.libelle,
        mvtdebit: mvtdebit,
        mvtcredit: mvtcredit,
        soldedebit: soldedebit,
        soldecredit: soldecredit,
      };
    });

    // Étape 3: Import par lots (10% à 90%)
    await progress.processBatch(
      preparedData,
      async (batch) => {
        await balanceimportees.bulkCreate(batch);
      },
      10,
      90,
      'Importation en cours...'
    );

    // Étape 4: Finalisation (95%)
    progress.step('Finalisation...', 95);

    // Succès
    progress.complete(
      `${totalLines} lignes ont été importées avec succès`,
      { nbrligne: totalLines }
    );

  } catch (error) {
    console.error("Erreur import balance :", error);
    progress.error("Erreur lors de l'import de la balance", error);
  }
};

// Wrapper SSE
const importBalanceWithProgress = withSSEProgress(importBalanceWithProgressLogic, {
  batchSize: 50
});

module.exports = {
  createNotExistingCompte,
  importBalance,
  importBalanceWithProgress
};