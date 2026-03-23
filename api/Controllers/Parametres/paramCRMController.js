const bcrypt = require("bcrypt");
const db = require("../../Models");
const { sequelize } = require('../../Models');
require('dotenv').config();

const dossiers = db.dossiers;
const dossierassocies = db.dossierassocies;
const dossierfiliales = db.dossierfiliales;
const dossierDomBank = db.dombancaires;
const pays = db.pays;
const dossierplancomptable = db.dossierplancomptable;
const devises = db.devises;

const updateParDefautDevise = async (id_devise, id_dossier, id_compte) => {
  await sequelize.transaction(async (t) => {
    await devises.update({ par_defaut: false }, {
      where: { id_compte, id_dossier },
      transaction: t
    });

    await devises.update({ par_defaut: true }, {
      where: { id: id_devise },
      transaction: t
    });
  });
}

const getListePays = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      list: []
    }

    const list = await pays.findAll({});

    if (list) {
      resData.state = true;
      resData.list = list.map((pays) => pays.get({ plain: true }));
    } else {
      resData.state = false;
      resData.msg = 'une erreur est survenue lors du traitement.';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getInfosCRM = async (req, res) => {
  try {
    const fileId = Number(req.params.id);
    const compteId = Number(req.params.compteId);

    let resData = {
      state: false,
      msg: 'Une erreur est survenue lors du traitement.',
      list: []
    }

    const list = await dossiers.findOne({
      where: {
        id: fileId
      },
    });

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

const modifyingInfos = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
    }

    const {
      action,
      itemId,
      idCompte,
      idDossier,
      nomdossier,
      raisonsociale,
      denomination,
      nif,
      stat,
      rcs,
      responsable,
      expertcomptable,
      cac,
      forme,
      activite,
      detailsactivite,
      adresse,
      email,
      telephone,
      plancomptable,
      longueurcptstd,
      longueurcptaux,
      autocompletion,
      avecanalytique,
      tauxir,
      pourcentageca,
      montantmin,
      assujettitva,
      montantcapital,
      nbrpart,
      valeurpart,
      listeAssocies,
      listeFiliales,
      compteisi,
      immo_amort_base_jours,
      portefeuille,
      typecomptabilite,
      devisepardefaut,
      consolidation,
      pays,
      avecMotDePasse,
      motDePasse,
      province,
      region,
      district,
      commune,
      centrefisc
    } = req.body;

    // return console.log('req.body : ', req.body);

    const modify = await dossiers.update(
      {
        id_compte: idCompte,
        id_portefeuille: portefeuille,
        dossier: nomdossier,
        nif: nif,
        stat: stat,
        responsable: responsable,
        expertcomptable: expertcomptable,
        cac: cac,
        raisonsociale: raisonsociale,
        denomination: denomination,
        formejuridique: forme,
        activite: activite,
        detailactivite: detailsactivite,
        adresse: adresse,
        email: email,
        telephone: telephone,
        longcomptestd: longueurcptstd,
        longcompteaux: longueurcptaux,
        autocompletion: autocompletion,
        avecanalytique: avecanalytique,
        tauxir: tauxir,
        pourcentageca: pourcentageca,
        montantmin: montantmin,
        assujettitva: assujettitva,
        capital: montantcapital || 0,
        nbrpart: nbrpart || 0,
        valeurpart: valeurpart || 0,
        id_plancomptable: plancomptable,
        rcs: rcs,
        compteisi: compteisi,
        immo_amort_base_jours: Number(immo_amort_base_jours) || 365,
        typecomptabilite: typecomptabilite,
        consolidation,
        pays,
        motdepasse: motDePasse,
        avecmotdepasse: avecMotDePasse,
        province,
        region,
        district,
        commune,
        centrefisc
      },
      {
        where: { id: idDossier }
      }
    );

    // await users.update(
    //   {
    //     id_portefeuille: Sequelize.fn('array_append', Sequelize.col('id_portefeuille'), 2)
    //   },
    //   {
    //     where: { id: idCompte }
    //   }
    // );

    await updateParDefautDevise(devisepardefaut, idDossier, idCompte);

    if (modify) {
      resData.state = true;
      resData.msg = 'Modification effectuée avec succès.';
    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors de la création du nouveau dossier';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeAssocie = async (req, res) => {
  try {
    let resData = {
      state: false,
      liste: [],
      msg: '',
    }

    const fileId = req.params.id;
    const list = await dossierassocies.findAll({
      where: {
        id_dossier: fileId
      },
    });

    if (list) {
      resData.state = true;
      resData.liste = list
    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors de la création du nouveau dossier';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeFiliale = async (req, res) => {
  try {
    let resData = {
      state: false,
      liste: [],
      msg: '',
    }

    const fileId = req.params.id;
    const list = await dossierfiliales.findAll({
      where: {
        id_dossier: fileId
      },
    });

    if (list) {
      resData.state = true;
      resData.liste = list
    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors de la création du nouveau dossier';
    }
    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeDomBank = async (req, res) => {
  try {
    let resData = {
      state: false,
      liste: [],
      msg: '',
    }

    const fileId = req.params.id;
    const list = await dossierDomBank.findAll({
      where: {
        id_dossier: fileId
      },
    });

    if (list) {
      resData.state = true;
      resData.liste = list
    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors de la création du nouveau dossier';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const associe = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
    }

    const {
      idCompte,
      idDossier,
      idAssocie,
      type,
      nom,
      adresse,
      dateentree,
      datesortie,
      nbrpart
      ,
      enactivite
    } = req.body;

    const testExist = await dossierassocies.findAll({
      where: { id: idAssocie }
    });

    if (testExist.length === 0) {
      const saveNewItem = await dossierassocies.create({
        id_dossier: idDossier,
        id_compte: idCompte,
        type: type,
        nom: nom,
        adresse: adresse,
        dateentree: dateentree,
        datesortie: datesortie,
        nbrpart: nbrpart
        ,
        enactivite: enactivite
      });

      if (saveNewItem) {
        resData.state = true;
        resData.msg = 'Nouvel associé enregistré avec succès.';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors du traitement des données.';
      }
    } else {
      const saveModif = await dossierassocies.update({
        id_dossier: idDossier,
        id_compte: idCompte,
        type: type,
        nom: nom,
        adresse: adresse,
        dateentree: dateentree,
        datesortie: datesortie,
        nbrpart: nbrpart
        ,
        enactivite: enactivite
      },
        {
          where: { id: idAssocie }
        }
      );

      if (saveModif) {
        resData.state = true;
        resData.msg = 'Modifications enregistrées avec succès.';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors du traitement des données.';
      }
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const filiale = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
    }

    const {
      idCompte,
      idDossier,
      idFiliale,
      nom,
      dateentree,
      datesortie,
      nbrpart,
      enactivite
    } = req.body;

    const testExist = await dossierfiliales.findAll({
      where: { id: idFiliale }
    });

    if (testExist.length === 0) {
      const saveNewItem = await dossierfiliales.create({
        id_dossier: idDossier,
        id_compte: idCompte,
        nom: nom,
        dateentree: dateentree,
        datesortie: datesortie,
        nbrpart: nbrpart,
        enactivite: enactivite
      });

      if (saveNewItem) {
        resData.state = true;
        resData.msg = 'Nouvel associé enregistré avec succès.';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors du traitement des données.';
      }
    } else {
      const saveModif = await dossierfiliales.update({
        id_dossier: idDossier,
        id_compte: idCompte,
        nom: nom,
        dateentree: dateentree,
        datesortie: datesortie,
        nbrpart: nbrpart,
        enactivite: enactivite
      },
        {
          where: { id: idFiliale }
        }
      );

      if (saveModif) {
        resData.state = true;
        resData.msg = 'Modifications enregistrées avec succès.';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors du traitement des données.';
      }
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const domBank = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
    }

    const {
      idCompte,
      idDossier,
      idDomBank,
      banque,
      numcompte,
      devise,
      pays,
      enactivite
    } = req.body;

    const testExist = await dossierDomBank.findAll({
      where: { id: idDomBank }
    });

    if (testExist.length === 0) {
      const saveNewItem = await dossierDomBank.create({
        id_dossier: idDossier,
        id_compte: idCompte,
        banque: banque,
        numcompte: numcompte,
        devise: devise,
        pays: pays,
        enactivite: enactivite
      });

      if (saveNewItem) {
        resData.state = true;
        resData.msg = 'Nouvelle domiciliation bancaire enregistrée avec succès.';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors du traitement des données.';
      }
    } else {
      const saveModif = await dossierDomBank.update({
        id_dossier: idDossier,
        id_compte: idCompte,
        banque: banque,
        numcompte: numcompte,
        devise: devise,
        pays: pays,
        enactivite: enactivite
      },
        {
          where: { id: idDomBank }
        }
      );

      if (saveModif) {
        resData.state = true;
        resData.msg = 'Modifications enregistrées avec succès.';
      } else {
        resData.state = false;
        resData.msg = 'Une erreur est survenue lors du traitement des données.';
      }
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deleteAssocie = async (req, res) => {
  try {
    const { fileId, compteId, idToDelete } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deldAssocie = await dossierassocies.destroy({
      where: {
        id: idToDelete,
        // id_dossier: fileId,
        // id_compte: compteId
      }
    });

    if (deldAssocie) {
      resData.state = true;
      resData.msg = "Associé supprimé avec succès.";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deleteFiliale = async (req, res) => {
  try {
    const { fileId, compteId, idToDelete } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deldFiliale = await dossierfiliales.destroy({
      where: {
        id: idToDelete,
        // id_dossier: fileId,
        // id_compte: compteId
      }
    });

    if (deldFiliale) {
      resData.state = true;
      resData.msg = "Filiale supprimée avec succès.";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deleteDomBank = async (req, res) => {
  try {
    const { fileId, compteId, idToDelete } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      fileInfos: []
    }

    const deldDomBank = await dossierDomBank.destroy({
      where: {
        id: idToDelete,
        // id_dossier: fileId,
        // id_compte: compteId
      }
    });

    if (deldDomBank) {
      resData.state = true;
      resData.msg = "Suppression du domiciliation bancaire terminée avec succès.";
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const updateAccountsLength = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
      updatedCount: 0
    }

    const {
      fileId,
      compteId,
      oldLongueurStd,
      newLongueurStd,
      oldLongueurAux,
      newLongueurAux,
      autocompletion
    } = req.body;

    console.log('Mise à jour longueur comptes:', {
      fileId,
      compteId,
      oldLongueurStd,
      newLongueurStd,
      oldLongueurAux,
      newLongueurAux,
      autocompletion
    });

    // Récupérer tous les comptes du dossier
    const comptes = await dossierplancomptable.findAll({
      where: {
        id_dossier: fileId,
        id_compte: compteId
      }
    });

    console.log(`Nombre de comptes trouvés: ${comptes.length}`);
    if (comptes.length > 0) {
      console.log('Échantillon des premiers comptes:', comptes.slice(0, 3).map(c => ({
        id: c.id,
        compte: c.compte,
        libelle: c.libelle,
        nature: c.nature,
        baseaux: c.baseaux
      })));
    }

    let updatedCount = 0;

    // Traiter chaque compte
    for (const compte of comptes) {
      const currentCompte = compte.compte;
      if (!currentCompte) {
        console.log(`Compte ignoré (numéro vide): id=${compte.id}, libelle=${compte.libelle}`);
        continue;
      }

      let newCompte = currentCompte;
      let shouldUpdate = false;

      // Déterminer si c'est un compte standard ou auxiliaire
      const isCompteStandard = compte.nature === 'General' || compte.nature === 'Collectif';

      const isCompteAuxiliaire = !isCompteStandard && currentCompte && (
        compte.nature === 'Aux' ||
        compte.nature === 'auxiliaire' ||
        (compte.baseaux && compte.baseaux !== currentCompte)
      );

      console.log(`Traitement compte ${currentCompte}: nature=${compte.nature}, isAuxiliaire=${isCompteAuxiliaire}, baseaux="${compte.baseaux}", baseaux_id=${compte.baseaux_id}, longueur=${currentCompte.length}`);

      if (isCompteAuxiliaire && oldLongueurAux !== newLongueurAux) {
        console.log(`Compte auxiliaire ${currentCompte}: ${oldLongueurAux} -> ${newLongueurAux}, autocompletion=${autocompletion}`);
        // Traitement des comptes auxiliaires
        if (newLongueurAux > currentCompte.length) {
          // Cas 1: Nombre de caractères inférieur à celui modifié dans CRM
          if (autocompletion) {
            // Ajouter des zéros à droite si autocomplétion activée
            const zerosToAdd = newLongueurAux - currentCompte.length;
            newCompte = currentCompte + '0'.repeat(zerosToAdd);
            shouldUpdate = true;
            console.log(`Autocomplétion: ajout de ${zerosToAdd} zéros: ${currentCompte} -> ${newCompte}`);
          } else {
            // Laisser le compte tel quel si autocomplétion désactivée
            console.log(`Autocomplétion désactivée: compte ${currentCompte} laissé tel quel`);
          }
        } else if (newLongueurAux < currentCompte.length) {
          // Cas 2: Nombre de caractères supérieur à celui modifié dans CRM
          // Toujours tronquer pour avoir le nombre exact de caractères
          newCompte = currentCompte.substring(0, newLongueurAux);
          shouldUpdate = true;
          console.log(`Troncature: ${currentCompte} -> ${newCompte}`);
        }
      } else if (!isCompteAuxiliaire && oldLongueurStd !== newLongueurStd) {
        console.log(`Compte standard ${currentCompte}: ${oldLongueurStd} -> ${newLongueurStd}`);
        // Traitement des comptes standard
        if (newLongueurStd > currentCompte.length) {
          // Ajouter des zéros à droite
          const zerosToAdd = newLongueurStd - currentCompte.length;
          newCompte = currentCompte + '0'.repeat(zerosToAdd);
          shouldUpdate = true;
          console.log(`Ajout de ${zerosToAdd} zéros: ${currentCompte} -> ${newCompte}`);
        } else if (newLongueurStd < currentCompte.length) {
          // Tronquer le compte
          newCompte = currentCompte.substring(0, newLongueurStd);
          shouldUpdate = true;
          console.log(`Troncature: ${currentCompte} -> ${newCompte}`);
        }
      } else {
        console.log(`Compte ${currentCompte} ignoré: pas de changement nécessaire`);
      }

      // Mettre à jour le compte si nécessaire
      if (shouldUpdate && newCompte !== currentCompte) {
        const updateData = { compte: newCompte };

        // Pour les comptes standard, mettre à jour aussi la centralisation (baseaux)
        if (!isCompteAuxiliaire) {
          updateData.baseaux = newCompte;
          console.log(`Mise à jour centralisation: baseaux = ${newCompte}`);
        }

        await dossierplancomptable.update(
          updateData,
          { where: { id: compte.id } }
        );
        updatedCount++;
        console.log(`Compte mis à jour: ${currentCompte} -> ${newCompte}`);
      }
    }

    resData.state = true;
    resData.msg = `Mise à jour terminée. ${updatedCount} comptes modifiés.`;
    resData.updatedCount = updatedCount;

    return res.json(resData);
  } catch (error) {
    console.log('Erreur updateAccountsLength:', error);
    return res.json({
      state: false,
      msg: 'Erreur lors de la mise à jour des comptes',
      updatedCount: 0
    });
  }
}

const padCompte = (val, longueur) => {
  if (val === null || val === undefined) return null;

  const s = String(val).trim();
  if (s === "" || s === "0") return null;

  return s.padEnd(longueur, "0").slice(0, longueur);
};

const updateAccountsLengthInJournals = async (req, res) => {
  try {
    const { fileId, compteId, newLongueurStd, newLongueurAux, autoCompletion } = req.body;

    const rows = await sequelize.query(
      `
      SELECT
        j.id,
        j.comptegen,
        j.compteaux,
        dpc_collectif.nature AS nature_collectif,
        dpc_aux.nature       AS nature_aux
      FROM journals j
      LEFT JOIN dossierplancomptables dpc_collectif ON dpc_collectif.id = j.id_numcptcentralise
      LEFT JOIN dossierplancomptables dpc_aux       ON dpc_aux.id       = j.id_numcpt
      WHERE j.id_dossier = :fileId
        AND j.id_compte  = :compteId
      `,
      {
        replacements: { fileId, compteId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    for (const row of rows) {
      let newCompteGen = padCompte(row.comptegen, newLongueurStd);

      let newCompteAux = row.compteaux;

      if (row.compteaux) {
        if (row.nature_aux === 'Aux') {
          if (autoCompletion === true) {
            newCompteAux = padCompte(row.compteaux, newLongueurAux);
          }
        } else {
          newCompteAux = padCompte(row.compteaux, newLongueurStd);
        }
      }

      await sequelize.query(
        `
    UPDATE journals
    SET
      comptegen = :newCompteGen,
      compteaux = :newCompteAux
    WHERE id = :id
    `,
        {
          replacements: {
            id: row.id,
            newCompteGen,
            newCompteAux
          }
        }
      );
    }

    return res.json({
      state: true,
      message: 'Mise à jour des comptes terminée dans le journal',
      total: rows.length
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      state: false,
      message: error.message
    });
  }
};

const updateAccountsLengthInPlanComptable = async (req, res) => {
  try {
    const {
      fileId,
      newLongueurStd,
      newLongueurAux,
      autoCompletion
    } = req.body;

    const rows = await sequelize.query(
      `
      SELECT
        dpc.id,
        dpc.compte,
        dpc.nature,
        dpc.baseaux,
        dpc.baseaux_id,

        dpc_base.nature AS baseaux_nature

      FROM dossierplancomptables dpc

      LEFT JOIN dossierplancomptables dpc_base
        ON dpc_base.id = dpc.baseaux_id

      WHERE dpc.id_dossier = :fileId
      `,
      {
        replacements: { fileId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    let updated = 0;

    for (const row of rows) {

      let newCompte = row.compte;
      let newBaseaux = row.baseaux;

      if (row.nature === 'General' || row.nature === 'Collectif') {
        newCompte = padCompte(row.compte, newLongueurStd);
      }

      if (row.nature === 'Aux') {
        if (autoCompletion !== true) continue;

        newCompte = padCompte(row.compte, newLongueurAux);
      }

      if (row.baseaux_id && row.baseaux_nature) {
        if (
          row.baseaux_nature === 'Collectif' ||
          row.baseaux_nature === 'General'
        ) {
          newBaseaux = padCompte(row.baseaux, newLongueurStd);
        }
      }

      if (
        newCompte === row.compte &&
        newBaseaux === row.baseaux
      ) {
        continue;
      }

      await sequelize.query(
        `
        UPDATE dossierplancomptables
        SET
          compte  = :newCompte,
          baseaux = :newBaseaux
        WHERE id = :id
        `,
        {
          replacements: {
            id: row.id,
            newCompte,
            newBaseaux
          }
        }
      );

      updated++;
    }

    return res.json({
      state: true,
      message: "Plan comptable mis à jour (compte + baseaux)",
      total: rows.length,
      updated
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      state: false,
      message: error.message
    });
  }
};

module.exports = {
  getInfosCRM,
  modifyingInfos,
  getListeAssocie,
  getListeFiliale,
  getListeDomBank,
  associe,
  filiale,
  domBank,
  deleteAssocie,
  deleteFiliale,
  deleteDomBank,
  getListePays,
  updateAccountsLength,
  updateAccountsLengthInJournals,
  updateAccountsLengthInPlanComptable
};