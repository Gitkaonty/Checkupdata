const db = require("../../Models");
const { Sequelize } = require("sequelize");
require('dotenv').config();

const dossierPlanComptable = db.dossierplancomptable;
const dossierPlanComptableCopy = db.dossierplancomptable;
const dossierpcdetailcptchg = db.dossierpcdetailcptchg;
const dossierpcdetailcpttva = db.dossierpcdetailcpttva;
const dossiers = db.dossiers;
const localites = db.localites;
const consolidationDossier = db.consolidationDossier;
const exercices = db.exercices;

const { Op } = require("sequelize");

dossierPlanComptable.belongsTo(dossierPlanComptableCopy, { as: 'BaseAux', foreignKey: 'baseaux_id', targetKey: 'id' });

const recupPc = async (req, res) => {
  try {
    const { fileId, compteId } = req.body;

    if (!fileId || !compteId) {
      return res.status(400).json({ state: false, msg: "Paramètres manquants" });
    }

    // const rows = await db.sequelize.query(`
    //     SELECT
    //         pc.*,
    //         base.compte AS "baseCompte",
    //         d.dossier AS "dossier"
    //     FROM DOSSIERPLANCOMPTABLES pc

    //     LEFT JOIN DOSSIERPLANCOMPTABLES base
    //         ON base.id = pc.baseaux_id
    //         AND base.id_dossier = :fileId

    //     LEFT JOIN DOSSIERS d
    //         ON d.id = pc.id_dossier

    //     WHERE
    //         pc.id_dossier = :fileId
    //         AND pc.id_compte = :compteId

    //     ORDER BY pc.compte ASC
    // `, {
    //   replacements: { fileId, compteId },
    //   type: db.Sequelize.QueryTypes.SELECT
    // });

    const rows = await db.sequelize.query(`
        SELECT
          D.*,
          BASE.COMPTE AS "baseCompte",
          DOSSIER.DOSSIER AS "dossier",
          COALESCE(
            (
              SELECT
                JSON_AGG(JSON_BUILD_OBJECT('id', CHARGE.ID_COMPTECOMPTA, 'nom', CHARGE.COMPTE))
              FROM
                DOSSIERPLANCOMPTABLEDETAILCPTCHGS CHARGE
              WHERE
                CHARGE.ID_DETAIL = D.ID
            ),
            '[]'
          ) AS CHARGES,
          COALESCE(
            (
              SELECT
                JSON_AGG(JSON_BUILD_OBJECT('id', TVA.ID_COMPTECOMPTA, 'compte', TVA.COMPTE))
              FROM
                DOSSIERPLANCOMPTABLEDETAILCPTTVAS TVA
              WHERE
                TVA.ID_DETAIL = D.ID
            ),
            '[]'
          ) AS TVAS
        FROM
          DOSSIERPLANCOMPTABLES D
          LEFT JOIN DOSSIERPLANCOMPTABLES BASE ON BASE.ID = D.BASEAUX_ID
          AND BASE.ID_DOSSIER = :fileId
          LEFT JOIN DOSSIERS DOSSIER ON DOSSIER.ID = D.ID_DOSSIER
        WHERE
          D.ID_DOSSIER = :fileId
          AND D.ID_COMPTE = :compteId
        ORDER BY
          D.COMPTE ASC
    `, {
      replacements: { fileId, compteId },
      type: db.Sequelize.QueryTypes.SELECT
    });

    return res.json({
      state: true,
      liste: rows
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      state: false,
      msg: "Erreur serveur",
      error: error.message
    });
  }
};

// const updateCompteAux = async (id_numcpt, baseaux_id, nature) => {
//   if (nature === 'Aux' && baseaux_id) {
//     const compteCollectif = await dossierPlanComptable.findByPk(baseaux_id);
//     if (!compteCollectif) return
//     await dossierPlanComptable.update({
//       baseaux: compteCollectif.compte,
//       baseaux_id
//     }, {
//       where: {
//         id: id_numcpt
//       }
//     })
//   }
// }

const updateCompteAux = async (id_numcpt, baseaux_id, nature) => {
  if (nature === 'Aux' && baseaux_id) {
    const compteCollectif = await db.sequelize.query(
      `SELECT compte FROM dossierplancomptables WHERE id = :baseaux_id`,
      {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { baseaux_id }
      }
    );

    if (!compteCollectif.length) return;

    await db.sequelize.query(
      `UPDATE dossierplancomptables
       SET baseaux = :baseaux, baseaux_id = :baseaux_id
       WHERE id = :id_numcpt`,
      {
        replacements: {
          baseaux: compteCollectif[0].compte,
          baseaux_id,
          id_numcpt
        }
      }
    );
  }
};

const updateCompteNotAux = async (id_numcpt, compte) => {
  await db.sequelize.query(`
    UPDATE dossierplancomptables
    SET baseaux = :compte, baseaux_id = :id_numcpt
    WHERE id = :id_numcpt
  `,
    {
      replacements: {
        compte,
        id_numcpt
      }
    })

}

// const updateLibelleInJournal = async (
//   id,
//   id_compte,
//   id_dossier,
//   nature,
//   libelle
// ) => {

//   const exerciceData = await exercices.findAll({
//     where: {
//       id_dossier,
//       id_compte,
//       rang: { [Op.gte]: 0 }
//     },
//     raw: true
//   })

//   if (!exerciceData.length) return

//   const id_exercices = exerciceData.map(e => Number(e.id))

//   if (nature === 'Aux') {
//     await journals.update(
//       {
//         libelleaux: libelle
//       },
//       {
//         where: {
//           id_numcpt: id,
//           id_compte,
//           id_dossier,
//           id_exercice: { [Op.in]: id_exercices }
//         }
//       }
//     )
//     return
//   }

//   if (nature === 'General') {
//     await journals.update(
//       {
//         libellecompte: libelle,
//         libelleaux: libelle
//       },
//       {
//         where: {
//           id_numcptcentralise: id,
//           id_compte,
//           id_dossier,
//           id_exercice: { [Op.in]: id_exercices }
//         }
//       }
//     )
//     return
//   }

//   if (nature === 'Collectif') {
//     await journals.update(
//       {
//         libellecompte: libelle
//       },
//       {
//         where: {
//           id_numcptcentralise: id,
//           id_compte,
//           id_dossier,
//           id_exercice: { [Op.in]: id_exercices }
//         }
//       }
//     )
//   }
// }

const updateLibelleInJournal = async (id, id_compte, id_dossier, nature, libelle) => {
  // Récupérer les exercices valides
  const exerciceData = await exercices.findAll({
    where: {
      id_dossier,
      id_compte,
      rang: { [Op.gte]: 0 }
    },
    raw: true
  });

  if (!exerciceData.length) return;

  const id_exercices = exerciceData.map(e => Number(e.id));

  let setClause = '';
  let idField = '';

  switch (nature) {
    case 'Aux':
      setClause = `libelleaux = :libelle`;
      idField = 'id_numcpt';
      break;
    case 'General':
      setClause = `libellecompte = :libelle, libelleaux = :libelle`;
      idField = 'id_numcptcentralise';
      break;
    case 'Collectif':
      setClause = `libellecompte = :libelle`;
      idField = 'id_numcptcentralise';
      break;
    default:
      return;
  }

  const query = `
    UPDATE journals
    SET ${setClause}
    WHERE ${idField} = :id
      AND id_compte = :id_compte
      AND id_dossier = :id_dossier
      AND id_exercice IN (:id_exercices)
  `;

  await db.sequelize.query(query, {
    replacements: { id, id_compte, id_dossier, libelle, id_exercices }
  });
};

const AddCptToPc = async (req, res) => {
  try {
    const {
      action,
      itemId,
      idCompte,
      idDossier,
      compte,
      libelle,
      nature,
      baseCptCollectif,
      typeTier,
      nif,
      stat,
      adresse,
      motcle,
      cin,
      dateCin,
      autrePieceID,
      refPieceID,
      adresseSansNIF,
      nifRepresentant,
      adresseEtranger,
      pays,
      listeCptChg,
      listeCptTva,
      province,
      region,
      district,
      commune,
      typecomptabilite,
      compteautre,
      libelleautre,
    } = req.body;

    const DossierParam = await dossiers.findOne({
      where: {
        id: idDossier,
        id_compte: idCompte
      }
    });

    const longueurcptaux = DossierParam.longcompteaux;
    const longueurcptstd = DossierParam.longcomptestd;
    const autocompletion = DossierParam.autocompletion;

    if (action === "new") {
      let resData = {
        state: false,
        msg: ''
      };

      if (typeTier === "sans-nif") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;


          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id_compte: idCompte,
              id_dossier: idDossier,
              compte: compte
            }
          });

          if (findedID) {
            baseaux_id = findedID.id;
          }
        } else {
          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id: itemId
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            // compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const NewCptAdded = await dossierPlanComptable.create({
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelleautre: libelleautre,
          libelle: libelle,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          cin: cin,
          datecin: dateCin,
          autrepieceid: autrePieceID,
          refpieceid: refPieceID,
          adressesansnif: adresseSansNIF,
          motcle: motcle,
          baseaux_id: baseaux_id,

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        });

        if (NewCptAdded.id) {
          await NewCptAdded.update({ baseaux_id: NewCptAdded.id });
        }

        await updateCompteAux(NewCptAdded.id, baseCptCollectif, nature);

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Le nouveau compte a été enregistré avec succès";
      }

      if (typeTier === "avec-nif") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;

          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id_compte: idCompte,
              id_dossier: idDossier,
              compte: compte
            }
          });

          if (findedID) {
            baseaux_id = findedID.id;
          }
        } else {
          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id: itemId
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux0);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const NewCptAdded = await dossierPlanComptable.create({
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          nif: nif,
          statistique: stat,
          adresse: adresse,
          motcle: motcle,
          baseaux_id: baseaux_id,

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        });

        if (NewCptAdded.id) {
          await NewCptAdded.update({ baseaux_id: NewCptAdded.id });
        }
        await updateCompteAux(NewCptAdded.id, baseCptCollectif, nature);

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Le nouveau compte a été enregistré avec succès";
      }

      if (typeTier === "etranger") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;


          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id_compte: idCompte,
              id_dossier: idDossier,
              compte: compte
            }
          });

          if (findedID) {
            baseaux_id = findedID.id;
          }
        } else {
          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id: itemId
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const NewCptAdded = await dossierPlanComptable.create({
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          nifrepresentant: nifRepresentant,
          adresseetranger: adresseEtranger,
          pays: pays,
          motcle: motcle,
          baseaux_id: baseaux_id,

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        });

        if (NewCptAdded.id) {
          await NewCptAdded.update({ baseaux_id: NewCptAdded.id });
        }
        await updateCompteAux(NewCptAdded.id, baseCptCollectif, nature);

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Le nouveau compte a été enregistré avec succès";
      }

      if (typeTier === "general") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;

          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id_compte: idCompte,
              id_dossier: idDossier,
              compte: compte
            }
          });

          if (findedID) {
            baseaux_id = findedID.id;
          }
        } else {
          const findedID = await dossierPlanComptable.findOne({
            where:
            {
              id: itemId
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const NewCptAdded = await dossierPlanComptable.create({
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          pays: 'Madagascar',
          motcle: motcle,
          baseaux_id: baseaux_id,

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        });

        if (NewCptAdded.id) {
          await NewCptAdded.update({ baseaux_id: NewCptAdded.id });
        }
        await updateCompteAux(NewCptAdded.id, baseCptCollectif, nature);

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: NewCptAdded.id,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Le nouveau compte a été enregistré avec succès";
      }

      res.json(resData);

    } else {
      let resData = {
        state: false,
        msg: '',
        dataModified: {}
      };

      if (typeTier === "sans-nif") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;
          // baseaux_id = itemId;

          // const findedID = await dossierPlanComptable.findOne({
          //   where:
          //   {
          //     id_compte: idCompte,
          //     id_dossier: idDossier,
          //     compte: compte
          //   }
          // });

          // if (findedID) {
          //   baseaux_id = findedID.id;
          // }
        } else {
          // Pour les comptes auxiliaires, récupérer le compte de base
          const findedID = await dossierPlanComptable.findOne({
            where: {
              id: baseCptCollectif,
              id_compte: idCompte,
              id_dossier: idDossier
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            // compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const updateData = {
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          cin: cin,
          datecin: dateCin,
          autrepieceid: autrePieceID,
          refpieceid: refPieceID,
          adressesansnif: adresseSansNIF,
          motcle: motcle,
          ...(nature === 'Aux' && { baseaux_id: baseCptCollectif }),

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        };

        const NewCptAdded = await dossierPlanComptable.update(
          updateData,
          {
            where: {
              id: itemId,
            }
          }
        );

        await updateCompteAux(itemId, baseCptCollectif, nature);

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcptchg.destroy({ where: { id: item.id } });

            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcpttva.destroy({ where: { id: item.id } });

            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Les modifications ont été enregistrées avec succès";
      }

      if (typeTier === "avec-nif") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;
          // baseaux_id = itemId;

          // const findedID = await dossierPlanComptable.findOne({
          //   where:
          //   {
          //     id_compte: idCompte,
          //     id_dossier: idDossier,
          //     compte: compte
          //   }
          // });

          // if (findedID) {
          //   baseaux_id = findedID.id;
          // }
        } else {
          // Pour les comptes auxiliaires, récupérer le compte de base
          const findedID = await dossierPlanComptable.findOne({
            where: {
              id: baseCptCollectif,
              id_compte: idCompte,
              id_dossier: idDossier
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptdstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const updateData = {
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          nif: nif,
          statistique: stat,
          adresse: adresse,
          motcle: motcle,
          ...(nature === 'Aux' && { baseaux_id: baseCptCollectif }),

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        };

        console.log('[AddCptToPc] UPDATE avec-nif - itemId:', itemId, 'compte:', compteFormated);
        console.log('[AddCptToPc] UPDATE avec-nif - NIF:', nif, 'STAT:', stat, 'Adresse:', adresse);

        const NewCptAdded = await dossierPlanComptable.update(
          updateData,
          {
            where: { id: itemId }
          }
        );

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcptchg.destroy({ where: { id: item.id } });

            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcpttva.destroy({ where: { id: item.id } });

            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Les modifications ont été enregistrées avec succès";
      }

      if (typeTier === "etranger") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;
          // baseaux_id = itemId;

          // const findedID = await dossierPlanComptable.findOne({
          //   where:
          //   {
          //     id_compte: idCompte,
          //     id_dossier: idDossier,
          //     compte: compte
          //   }
          // });

          // if (findedID) {
          //   baseaux_id = findedID.id;
          // }
        } else {
          // Pour les comptes auxiliaires, récupérer le compte de base
          const findedID = await dossierPlanComptable.findOne({
            where: {
              id: baseCptCollectif,
              id_compte: idCompte,
              id_dossier: idDossier
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles métier
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const updateData = {
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          nifrepresentant: nifRepresentant,
          adresseetranger: adresseEtranger,
          pays: pays,
          motcle: motcle,
          ...(nature === 'Aux' && { baseaux_id: baseCptCollectif }),

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        };

        const NewCptAdded = await dossierPlanComptable.update(
          updateData,
          {
            where: { id: itemId }
          }
        );

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcptchg.destroy({ where: { id: item.id } });

            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcpttva.destroy({ where: { id: item.id } });

            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        resData.state = true;
        resData.msg = "Les modifications ont été enregistrées avec succès";
      }

      if (typeTier === "general") {
        let baseauxiliaire = '';
        let baseaux_id = 0;

        if (nature === 'General' || nature === 'Collectif') {
          baseauxiliaire = compte;
          // baseaux_id = itemId;

          // const findedID = await dossierPlanComptable.findOne({
          //   where:
          //   {
          //     id_compte: idCompte,
          //     id_dossier: idDossier,
          //     compte: compte
          //   }
          // });

          // if (findedID) {
          //   baseaux_id = findedID.id;
          // }
        } else {
          // Pour les comptes auxiliaires, récupérer le compte de base
          const findedID = await dossierPlanComptable.findOne({
            where: {
              id: baseCptCollectif,
              id_compte: idCompte,
              id_dossier: idDossier
            }
          });

          baseaux_id = baseCptCollectif;

          if (findedID) {
            baseauxiliaire = findedID.compte;
          }
        }

        let compteFormated = '';
        let compteFormattedAutre = '';
        let baseAux = '';

        // Formatage compte & baseaux selon les règles
        if (autocompletion) {
          if (nature === "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux) || '';
          } else {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          }
        } else {
          if (nature !== "Aux") {
            compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
            compteFormattedAutre = compteautre.toString().padEnd(longueurcptstc, "0").slice(0, longueurcptstd);
            baseAux = baseauxiliaire.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd) || '';
          } else {
            compteFormated = compte;
            compteFormattedAutre = compteautre;
            baseAux = baseauxiliaire;
          }
        }

        let cptChNb = 0;
        if (listeCptChg.length > 0) {
          cptChNb = listeCptChg.length;
        }

        let cptTvaNb = 0;
        if (listeCptTva.length > 0) {
          cptTvaNb = listeCptTva.length;
        }

        const updateData = {
          id_compte: idCompte,
          id_dossier: idDossier,
          compte: compteFormated,
          compteautre: compteFormattedAutre,
          libelle: libelle,
          libelleautre: libelleautre,
          nature: nature,
          baseaux: baseAux,
          cptcharge: cptChNb,
          cpttva: cptTvaNb,

          typetier: typeTier,
          pays: 'Madagascar',
          motcle: motcle,
          ...(nature === 'Aux' && { baseaux_id: baseCptCollectif }),

          province: province,
          region: region,
          district: district,
          commune: commune,
          typecomptabilite
        };

        const NewCptAdded = await dossierPlanComptable.update(
          updateData,
          {
            where: { id: itemId }
          }
        );

        //Enregistrer les compte de charges et TVA associés au compte
        if (listeCptChg.length > 0) {
          listeCptChg.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcptchg.destroy({ where: { id: item.id } });

            const saveCptCh = await dossierpcdetailcptchg.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }

        if (listeCptTva.length > 0) {
          listeCptTva.map(async (item) => {
            //supprimer l'ancienne ligne
            await dossierpcdetailcpttva.destroy({ where: { id: item.id } });

            const saveCptTva = await dossierpcdetailcpttva.create({
              id_compte: idCompte,
              id_dossier: idDossier,
              id_detail: itemId,
              compte: item.compte,
              libelle: item.libelle,
              id_comptecompta: item.idCpt
            });
          });
        }


        resData.state = true;
        resData.msg = "Les modifications ont été enregistrées avec succès";
      }
      const dpcUpdated = await dossierPlanComptable.findByPk(itemId);
      resData.dataModified = dpcUpdated;

      await updateLibelleInJournal(itemId, idCompte, idDossier, nature, libelle);

      res.json(resData);
    }
  } catch (error) {
    console.log(error);
  }
}

const keepListCptChgTvaAssoc = async (req, res) => {
  try {
    let resData = {
      state: false,
      msg: '',
      detailChg: [],
      detailTva: []
    }

    const itemId = req.params.itemId;
    const listeDetailModelCptChgData = await dossierpcdetailcptchg.findAll({
      where: {
        id_detail: itemId
      },
      order: [['compte', 'ASC']]
    });

    const listeDetailModelCptTvaData = await dossierpcdetailcpttva.findAll({
      where: {
        id_detail: itemId
      },
      order: [['compte', 'ASC']]
    });

    if (listeDetailModelCptChgData || listeDetailModelCptTvaData) {

      resData.state = true;
      resData.msg = '';
      resData.detailChg = listeDetailModelCptChgData;
      resData.detailTva = listeDetailModelCptTvaData;

    } else {
      resData.state = false;
      resData.msg = 'Une erreur est survenue lors de la récupération des données';
    }
    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
};

const deleteItemPc = async (req, res) => {
  try {
    let resData = {
      state: false,
      stateUndeletableCpt: false,
      msg: 'Une erreur est survenue lors du traitement.',
      msgUndeletableCpt: ''
    }

    let msgErrorDelete = '';
    let deletedCount = 0;
    let blockedCount = 0;
    const { listId, compteId, fileId } = req.body;
    console.log('req.body : ', req.body);

    const infosCpt = await dossierPlanComptable.findOne({
      where: { id: listId }
    });

    let cpt = '';
    if (infosCpt) {
      cpt = infosCpt.compte;
    }

    const cptInUse = await dossierPlanComptable.findAll({
      where: {
        id_compte: compteId,
        id_dossier: fileId,
        baseaux: cpt,
      }
    });

    const usageInJournals = await db.journals.count({
      where: {
        id_compte: compteId,
        id_dossier: fileId,
        id_numcpt: listId
      }
    });

    console.log('usageInJournals : ', usageInJournals);

    if (cptInUse.length > 1 || usageInJournals > 0) {
      resData.stateUndeletableCpt = true;
      blockedCount += 1;
      if (msgErrorDelete === '') {
        msgErrorDelete = `Impossible de supprimer le compte suivant car il est utilisé${cptInUse.length > 1 ? ' comme base des comptes auxiliaires' : ''}${usageInJournals > 0 ? ' dans des écritures' : ''}`;
      } else {
        msgErrorDelete = `${msgErrorDelete}, ${cpt}`;
      }

    } else {
      await dossierPlanComptable.destroy({ where: { id: listId } });
      deletedCount += 1;

      //supprimer si la ligne possède des comptes de charges ou TVA associés
      await dossierpcdetailcptchg.destroy({ where: { id_detail: listId } });
      await dossierpcdetailcpttva.destroy({ where: { id_detail: listId } });
    }

    resData.msg = msgErrorDelete;
    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const recupPcIdLibelle = async (req, res) => {
  try {
    const { id_dossier, id_compte } = req.params;

    const rows = await db.sequelize.query(`
        WITH dossier_info AS (
            SELECT id, consolidation, typecomptabilite
            FROM DOSSIERS
            WHERE id = :id_dossier
        ),

        dossiers_utilises AS (
            SELECT id FROM dossier_info

            UNION

            SELECT cd.id_dossier
            FROM COMPTEDOSSIERS cd
            JOIN dossier_info di
                ON di.consolidation = true
            WHERE cd.id_dossier = :id_dossier
              AND cd.user_id = :id_compte
        ),

        pc_data AS (
            SELECT
                pc.id,
                pc.id_dossier,
                pc.compte,
                pc.compteautre,
                pc.libelle,
                pc.libelleautre,
                base.libelle AS base_libelle,
                d.dossier,
                di.typecomptabilite
            FROM DOSSIERPLANCOMPTABLES pc
            JOIN dossiers_utilises du ON du.id = pc.id_dossier
            JOIN dossier_info di ON TRUE

            LEFT JOIN DOSSIERPLANCOMPTABLES base
                ON base.id = pc.baseaux_id
                AND base.id_dossier = pc.id_dossier
                AND base.id_compte = :id_compte

            LEFT JOIN DOSSIERS d
                ON d.id = pc.id_dossier

            WHERE
                pc.id_compte = :id_compte
                AND pc.nature <> 'Collectif'
                AND pc.typecomptabilite = di.typecomptabilite
        ),

        pc_final AS (
            SELECT
                id,
                id_dossier,
                dossier,

                CASE
                    WHEN typecomptabilite = 'Autres'
                        THEN COALESCE(libelleautre || ' (Autre)', libelle, 'Aucune libellé')
                    ELSE COALESCE(libelle, 'Aucune libellé')
                END AS final_libelle,

                CASE
                    WHEN typecomptabilite = 'Autres'
                        THEN COALESCE(compteautre, compte)
                    ELSE compte
                END AS final_compte,

                CASE
                    WHEN typecomptabilite = 'Autres'
                        THEN COALESCE(base_libelle || ' (Autre)', base_libelle, 'Aucune libellé')
                    ELSE COALESCE(base_libelle, 'Aucune libellé')
                END AS libelleaux
            FROM pc_data
        )

        SELECT DISTINCT ON (final_libelle, final_compte)
            id,
            id_dossier,
            dossier,
            final_libelle AS libelle,
            final_compte AS compte,
            libelleaux
        FROM pc_final
    `, {
      replacements: { id_dossier, id_compte },
      type: db.Sequelize.QueryTypes.SELECT
    });

    rows.sort((a, b) => {
      const regex = /^(\d+)(.*)$/;
      const matchA = (a.compte || "").match(regex);
      const matchB = (b.compte || "").match(regex);

      const numA = matchA ? parseInt(matchA[1], 10) : 0;
      const numB = matchB ? parseInt(matchB[1], 10) : 0;

      if (numA !== numB) return numA - numB;

      const strA = matchA ? matchA[2] : "";
      const strB = matchB ? matchB[2] : "";

      return strA.localeCompare(strB);
    });

    return res.json({
      state: rows.length > 0,
      msg: rows.length ? "Données reçues avec succès !" : "Aucune donnée trouvée",
      liste: rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      state: false,
      msg: "Erreur serveur",
      error: error.message
    });
  }
};

const recupPcIdLibelleForJournal = async (req, res) => {
  try {
    const { id_dossier, id_compte } = req.params;

    const dossierData = await dossiers.findByPk(id_dossier);
    const typeComptabilite = dossierData?.typecomptabilite || 'Français';

    const listepc = await dossierPlanComptable.findAll({
      where: {
        id_dossier: id_dossier,
        id_compte,
        libelle: { [Sequelize.Op.ne]: 'Collectif' },
      },
      include: [
        {
          model: dossierPlanComptable,
          as: 'BaseAux',
          attributes: ['compte'],
          required: false,
          where: {
            id_dossier: id_dossier,
            id_compte
          }
        },
        {
          model: dossiers,
          attributes: ['dossier'],
        }
      ],
      order: [['compte', 'ASC']],
      attributes: ['libelle', 'id', 'id_dossier', 'compteautre', 'libelleautre']
    });

    const mappedListe = listepc.map(item => ({
      id: item.id,
      libelle: typeComptabilite === 'Autres' ? item?.libelleautre ? item?.libelleautre + ' (Autre)' : item?.libelle || 'Aucune libellé' : item?.libelle || 'Aucune libellé',
      compte: typeComptabilite === 'Autres' ? item?.compteautre ? item?.compteautre : item?.BaseAux?.compte || null : item?.BaseAux?.compte || null,
      id_dossier: Number(item?.id_dossier) || null,
      dossier: item?.dossier.dossier || null,
    }));

    const uniqueListe = [];
    const seen = new Set();
    for (const item of mappedListe) {
      const key = `${item.libelle}-${item.compte}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueListe.push(item);
      }
    }

    return res.json({
      state: uniqueListe.length > 0,
      msg: uniqueListe.length > 0 ? "Données reçues avec succès !" : "Aucune donnée trouvée",
      liste: uniqueListe
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      state: false,
      msg: "Erreur serveur",
      error: error.message
    });
  }
}

const recupPcClasseSix = async (req, res) => {
  try {
    const { id_dossier, id_compte } = req.params;

    const listepc = await dossierPlanComptable.findAll({
      where: {
        id_dossier: id_dossier,
        id_compte: id_compte,
        libelle: { [Sequelize.Op.ne]: 'Collectif' },
        compte: { [Sequelize.Op.like]: '6%' }
      },
      include: [
        {
          model: dossierPlanComptable,
          as: 'BaseAux',
          attributes: ['compte'],
          required: false,
          where: {
            id_dossier: id_dossier,
            id_compte: id_compte
          }
        }
      ],
      order: [['compte', 'ASC']],
      attributes: ['libelle', 'id']
    });

    const mappedListe = listepc.map(item => ({
      id: item.id,
      libelle: item.libelle,
      compte: item.BaseAux?.compte || null
    }));

    const uniqueListe = [];
    const seen = new Set();

    for (const item of mappedListe) {
      const key = `${item.libelle}-${item.compte}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueListe.push(item);
      }
    }

    const resData = {
      state: true,
      msg: "Donnée reçues avec succes !",
      liste: uniqueListe
    };

    if (listepc) {
      resData.state = true;
      resData.msg = "Donnée reçues avec succes !"
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const recupPcCompteIsi = async (req, res) => {
  try {
    const { id_dossier, id_compte } = req.params;
    const { compteisi } = req.query;

    if (!id_compte) {
      return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
    }
    if (!id_dossier) {
      return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
    }
    if (!compteisi) {
      return res.status(400).json({ state: false, message: 'Compte isi non trouvé' });
    }

    const listepc = await dossierPlanComptable.findAll({
      where: {
        id_dossier: id_dossier,
        id_compte: id_compte,
        libelle: { [Sequelize.Op.ne]: 'Collectif' },
        compte: { [Sequelize.Op.like]: `${compteisi}%` }
      },
      include: [
        {
          model: dossierPlanComptable,
          as: 'BaseAux',
          attributes: ['compte'],
          required: false,
          where: {
            id_dossier: id_dossier,
            id_compte: id_compte
          }
        }
      ],
      order: [['compte', 'ASC']],
      attributes: ['libelle', 'id']
    });

    const mappedListe = listepc.map(item => ({
      id: item.id,
      libelle: item.libelle,
      compte: item.BaseAux?.compte || null
    }));

    const uniqueListe = [];
    const seen = new Set();

    for (const item of mappedListe) {
      const key = `${item.libelle}-${item.compte}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueListe.push(item);
      }
    }

    const resData = {
      state: true,
      msg: "Donnée reçues avec succes !",
      liste: uniqueListe
    };

    if (listepc) {
      resData.state = true;
      resData.msg = "Donnée reçues avec succes !"
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getProvinces = async (req, res) => {
  try {
    const provinces = await localites.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('province')), 'province']],
      order: [[Sequelize.col('province'), 'ASC']],
      raw: true
    });
    res.json(provinces.map(p => p.province));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRegions = async (req, res) => {
  try {
    const { province } = req.params;
    const regions = await localites.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('region')), 'region']],
      order: [[Sequelize.col('region'), 'ASC']],
      where: { province },
      raw: true
    });
    res.json(regions.map(r => r.region));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDistricts = async (req, res) => {
  try {
    const { province, region } = req.params;

    const districts = await localites.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('district')), 'district']],
      where: { province, region },
      order: [[Sequelize.col('district'), 'ASC']],
      raw: true
    });

    res.json(districts.map(d => d.district));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCommunes = async (req, res) => {
  try {
    const { province, region, district } = req.params;

    const communes = await localites.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('commune')), 'commune']],
      where: { province, region, district },
      order: [[Sequelize.col('commune'), 'ASC']],
      raw: true
    });

    res.json(communes.map(c => c.commune));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const recupPcConsolidation = async (req, res) => {
  try {
    const { fileId, compteId } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue',
      liste: []
    }

    let id_dossiers_a_utiliser = [Number(fileId)];

    const consolidationDossierData = await consolidationDossier.findAll({
      where: {
        id_dossier: fileId,
        id_compte: compteId
      }
    });

    if (!consolidationDossierData.length) {
      return res.json({
        state: true,
        msg: "Consolidation de dossier vide",
        liste: []
      });
    }

    id_dossiers_a_utiliser = [...new Set(
      consolidationDossierData.map(val => Number(val.id_dossier_autre))
    )];

    const listepc = (await dossierPlanComptable.findAll({
      where:
      {
        id_dossier: id_dossiers_a_utiliser,
        id_compte: compteId
      },
      include: [
        {
          model: dossierPlanComptable,
          as: 'BaseAux',
          attributes: [
            ['compte', 'comptecentr']
          ],
          required: false,
          where: {
            id_dossier: id_dossiers_a_utiliser,
            id_compte: compteId
          }
        },
        { model: dossiers, attributes: ['dossier'] },
      ],
      // raw: true,
      order: [['compte', 'ASC']]
    })).map((val => {
      const data = val.toJSON();
      data.baseCompte = data?.BaseAux?.comptecentr;
      data.dossier = data?.dossier?.dossier;
      return data;
    }))

    if (listepc) {
      resData.state = true;
      resData.liste = listepc;
    } else {
      resData.state = false;
      resData.msg = "Une erreur est survenue au moment du traitement des données";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
};

const verifyCanUpdate = async (req, res) => {
  try {
    const { id_numcpt, id_compte, id_dossier } = req.body;
    const usageInJournals = await db.journals.count({
      where: {
        id_compte: Number(id_compte),
        id_dossier: Number(id_dossier),
        id_numcpt: Number(id_numcpt)
      }
    });
    if (usageInJournals > 0) {
      return res.json({ state: false, message: 'Vous ne pouvez pas modifier ce compte car ce compte est utilisé dans une écriture du journal' });
    }
    return res.json({ state: true });
  } catch (error) {
    console.log(error);
  }
}

const editPc = async (req, res) => {
  try {
    const { row } = req.body;
    console.log('row : ', row);
    let id_pc = row?.id;
    const id_dossier = row?.id_dossier;
    const id_compte = row?.id_compte;
    const nature = row?.nature;
    const compte = row?.compte;
    const compteautre = row?.compteautre || "";
    const isNew = row?.isNew || false;
    const baseaux_id = row?.baseaux_id || 0;

    const dossierData = await dossiers.findOne({
      where: {
        id: id_dossier,
        id_compte: id_compte
      }
    });

    const longueurcptaux = dossierData.longcompteaux;
    const longueurcptstd = dossierData.longcomptestd;
    const autocompletion = dossierData.autocompletion;

    let compteFormated = '';
    let compteFormattedAutre = '';

    if (autocompletion) {
      if (nature === "Aux") {
        compteFormated = compte.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
        compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
      } else {
        compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
        compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
      }
    } else {
      if (nature !== "Aux") {
        compteFormated = compte.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
        compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
      } else {
        compteFormated = compte;
        compteFormattedAutre = compteautre;
      }
    }

    if (isNew) {
      const { id, ...rest } = row;

      const createdData = await dossierPlanComptable.create(
        { ...rest, compte: compteFormated, baseaux_id },
      );

      id_pc = createdData?.id;

      if (row?.nature !== 'Aux') {
        await updateCompteNotAux(id_pc, row?.compte);
      }

    } else {
      await dossierPlanComptable.update(
        { ...row, compte: compteFormated, compteautre: compteFormattedAutre },
        { where: { id: id_pc } }
      );
    }

    const rows = await db.sequelize.query(`
        SELECT
            pc.*,
            base.compte AS "baseCompte",
            d.dossier AS "dossier"
        FROM DOSSIERPLANCOMPTABLES pc

        LEFT JOIN DOSSIERPLANCOMPTABLES base
            ON base.id = pc.baseaux_id

        LEFT JOIN DOSSIERS d
            ON d.id = pc.id_dossier

        WHERE
            pc.id = :id
    `, {
      replacements: { id: id_pc },
      type: db.Sequelize.QueryTypes.SELECT
    });

    return res.json({ state: true, message: 'Modifié avec succès', row: rows });
  } catch (error) {
    console.log(error);
  }
}

const editPcFromPopup = async (req, res) => {
  try {
    const { row } = req.body;
    const id = Number(row?.itemId);
    const compteautre = row?.compteautre || "";
    const id_dossier = row?.idDossier;
    const nature = row?.nature;

    const dossierData = await dossiers.findOne({
      where: {
        id: id_dossier
      }
    });

    const longueurcptaux = dossierData.longcompteaux;
    const longueurcptstd = dossierData.longcomptestd;
    const autocompletion = dossierData.autocompletion;

    let compteFormattedAutre = '';

    if (autocompletion) {
      if (nature === "Aux") {
        compteFormattedAutre = compteautre.toString().padEnd(longueurcptaux, "0").slice(0, longueurcptaux);
      } else {
        compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
      }
    } else {
      if (nature !== "Aux") {
        compteFormattedAutre = compteautre.toString().padEnd(longueurcptstd, "0").slice(0, longueurcptstd);
      } else {
        compteFormattedAutre = compteautre;
      }
    }

    await dossierPlanComptable.update(
      { ...row, compteautre: compteFormattedAutre },
      { where: { id } }
    );

    const rows = await db.sequelize.query(`
        SELECT
            pc.*,
            base.compte AS "baseCompte",
            d.dossier AS "dossier"
        FROM DOSSIERPLANCOMPTABLES pc

        LEFT JOIN DOSSIERPLANCOMPTABLES base
            ON base.id = pc.baseaux_id

        LEFT JOIN DOSSIERS d
            ON d.id = pc.id_dossier

        WHERE
            pc.id = :id
    `, {
      replacements: { id },
      type: db.Sequelize.QueryTypes.SELECT
    });

    return res.json({ state: true, message: 'Modifié avec succès', row: rows });

  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  recupPc,
  AddCptToPc,
  keepListCptChgTvaAssoc,
  deleteItemPc,
  recupPcIdLibelle,
  recupPcClasseSix,
  recupPcCompteIsi,
  getProvinces,
  getRegions,
  getDistricts,
  getCommunes,
  recupPcConsolidation,
  recupPcIdLibelleForJournal,
  verifyCanUpdate,
  editPc,
  editPcFromPopup
};
