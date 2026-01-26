const db = require("../../../Models");
require('dotenv').config();
const { Op } = require('sequelize');
const functionAddOrModifyRow = require('../../../Middlewares/Ebilan/declEbilanAddOrModifyFunction');
const declEbilanRefreshFunction = require('../../../Middlewares/Ebilan/declEbilanRefreshFunction');
const declEbilanDeleteFunction = require('../../../Middlewares/Ebilan/declEbilanDeleteFunction');
const declEbilanGeneratePDF = require('../../../Middlewares/Ebilan/declEbilanGeneratePDF');
const declEbilanGenerateExcel = require('../../../Middlewares/Ebilan/declEbilanGenerateExcel');
const declEbilanGenerateXml = require('../../../Middlewares/Ebilan/declEbillanGenerateXml');
const recupTableau = require('../../../Middlewares/Ebilan/recupTableau');
const functionControles = require('../../../Middlewares/Ebilan/controles');
const fonctionUpdateBalanceSold = require('../../../Middlewares/UpdateSolde/updateBalanceSold');

const { withSSEProgress } = require('../../../Middlewares/sseProgressMiddleware');

const { create } = require('xmlbuilder2');

const PdfPrinter = require('pdfmake');
const { PDFDocument } = require('pdf-lib');

const ExcelJS = require('exceljs');

const compterubriques = db.compterubriques;
const etats = db.etats;
const ajustements = db.ajustements;
const controles = db.controles;
const dossiers = db.dossiers;
const exercices = db.exercices;
const userscomptes = db.userscomptes;
const journals = db.journals;
const dossierplancomptable = db.dossierplancomptable;
const codejournals = db.codejournals;

const rubriques = db.rubriques;
const rubriquesmatrices = db.rubriquesmatrices;
rubriques.belongsTo(rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });

const liassebhiapcs = db.liassebhiapcs;
const liassemps = db.liassemps;
const liassedas = db.liassedas;
const liasseeiafncs = db.liasseeiafncs;
const liasseses = db.liasseses;
const liassedps = db.liassedps;

// Fonction pour la génération de PDF
const generateBilanContent = declEbilanGeneratePDF.generateBilanContent;
const generateBilanActifContent = declEbilanGeneratePDF.generateBilanActifContent;
const generateBilanPassifContent = declEbilanGeneratePDF.generateBilanPassifContent;
const generateCrnContent = declEbilanGeneratePDF.generateCrnContent;
const generateCrfContent = declEbilanGeneratePDF.generateCrfContent;
const generateTftdContent = declEbilanGeneratePDF.generateTftdContent;
const generateTftiContent = declEbilanGeneratePDF.generateTftiContent;
const generateEvcpContent = declEbilanGeneratePDF.generateEvcpContent;
const generateDrfContent = declEbilanGeneratePDF.generateDrfContent;
const generateBhiapcContent = declEbilanGeneratePDF.generateBhiapcContent;
const generateMpContent = declEbilanGeneratePDF.generateMpContent;
const generateDaContent = declEbilanGeneratePDF.generateDaContent;
const generateDpContent = declEbilanGeneratePDF.generateDpContent;
const generateEiafncContent = declEbilanGeneratePDF.generateEiafncContent;
const generateSadContent = declEbilanGeneratePDF.generateSadContent;
const generateSdrContent = declEbilanGeneratePDF.generateSdrContent;
const generateSeContent = declEbilanGeneratePDF.generateSeContent;
const generateNeContent = declEbilanGeneratePDF.generateNeContent;

// Fonction pour la génération en Excel
const exportBilanToExcel = declEbilanGenerateExcel.exportBilanToExcel;
const exportCrnToExcel = declEbilanGenerateExcel.exportCrnToExcel;
const exportCrfToExcel = declEbilanGenerateExcel.exportCrfToExcel;
const exportTftdToExcel = declEbilanGenerateExcel.exportTftdToExcel;
const exportTftiToExcel = declEbilanGenerateExcel.exportTftiToExcel;
const exportEvcpToExcel = declEbilanGenerateExcel.exportEvcpToExcel;
const exportDrfToExcel = declEbilanGenerateExcel.exportDrfToExcel;
const exportBhiapcToExcel = declEbilanGenerateExcel.exportBhiapcToExcel;
const exportMpToExcel = declEbilanGenerateExcel.exportMpToExcel;
const exportDaToExcel = declEbilanGenerateExcel.exportDaToExcel;
const exportDpToExcel = declEbilanGenerateExcel.exportDpToExcel;
const exportEiafncToExcel = declEbilanGenerateExcel.exportEiafncToExcel;
const exportSadToExcel = declEbilanGenerateExcel.exportSadToExcel;
const exportSdrToExcel = declEbilanGenerateExcel.exportSdrToExcel;
const exportSeToExcel = declEbilanGenerateExcel.exportSeToExcel;
const exportNeToExcel = declEbilanGenerateExcel.exportNeToExcel;

// Fonction pour la génération en xml
// Ligne fixe
const exportActifToXml = declEbilanGenerateXml.exportActifToXml;
const exportPassifToXml = declEbilanGenerateXml.exportPassifToXml;
const exportCrnToXml = declEbilanGenerateXml.exportCrnToXml;
const exportCrfToXml = declEbilanGenerateXml.exportCrfToXml;
const exportTftdToXml = declEbilanGenerateXml.exportTftdToXml;
const exportTftiToXml = declEbilanGenerateXml.exportTftiToXml;
const exportEvcpToXml = declEbilanGenerateXml.exportEvcpToXml;
const exportDrfToXml = declEbilanGenerateXml.exportDrfToXml;
const exportBhiapcbToXml = declEbilanGenerateXml.exportBhiapcbToXml;
const exportMpa2ToXml = declEbilanGenerateXml.exportMpa2ToXml;
const exportMpb2ToXml = declEbilanGenerateXml.exportMpb2ToXml;
const exportDaToXml = declEbilanGenerateXml.exportDaToXml;
const exportDpa1ToXml = declEbilanGenerateXml.exportDpa1ToXml;
const exportSdrToXml = declEbilanGenerateXml.exportSdrToXml;
const exportSadToXml = declEbilanGenerateXml.exportSadToXml;

// Ligne variable
const exportCapToXml = declEbilanGenerateXml.exportCapToXml;
const exportDbToXml = declEbilanGenerateXml.exportDbToXml;
const exportBhiapcaToXml = declEbilanGenerateXml.exportBhiapcaToXml;
const exportMpa1ToXml = declEbilanGenerateXml.exportMpa1ToXml;
const exportMpb1ToXml = declEbilanGenerateXml.exportMpb1ToXml;
const exportDa1ToXml = declEbilanGenerateXml.exportDa1ToXml;
const exportDpa2ToXml = declEbilanGenerateXml.exportDpa2ToXml;
const exportEiafncaToXml = declEbilanGenerateXml.exportEiafncaToXml;
const exportSeToXml = declEbilanGenerateXml.exportSeToXml;

// Formattage du date pour l'exercice
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [annee, mois, jour] = dateStr.split('-');
  return `${jour.padStart(2, '0')}-${mois.padStart(2, '0')}-${annee}`;
};

// Fonction pour plurieliser un mot
function pluralize(count, word) {
  return count > 1 ? word + 's' : word;
}

const infosVerrouillage = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
    }

    const infosListe = await etats.findAll({
      where:
      {
        id_compte: compteId,
        id_dossier: fileId,
        id_exercice: exerciceId
      }
    });

    if (infosListe) {
      resData.state = true;
      resData.liste = infosListe;
      resData.msg = 'traitement terminé avec succès.';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const verrouillerTableau = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableau, verr } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
    }

    const infosUpdate = await etats.update(
      {
        valide: verr
      },
      {
        where:
        {
          id_compte: compteId,
          id_dossier: fileId,
          id_exercice: exerciceId,
          code: tableau,
        }
      }
    );

    if (infosUpdate) {
      resData.state = true;
      resData.msg = 'traitement terminé avec succès.';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeRubriqueGlobal = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId } = req.body;

    let resData = {
      state: false,
      msg: '...',
      bilanActif: [],
      bilanPassif: [],
      crn: [],
      crf: [],
      tftd: [],
      tfti: [],
      evcp: [],
      drf: [],
      bhiapc: [],
      mp: [],
      da: [],
      dp: [],
      eiafnc: [],
      sad: [],
      sdr: [],
      se: [],
      ne: [],
      etatglobal: [],
      detailAnomBilan: [],
      detailAnomCrn: [],
      detailAnomCrf: [],
      detailAnomTfti: [],
      detailAnomTftd: [],
      detailAnomEvcp: [],
      detailAnomDrf: [],
      detailAnomBhiapc: [],
      detailAnomMp: [],
      detailAnomDa: [],
      detailAnomDp: [],
      detailAnomEiafnc: [],
      detailAnomSad: [],
      detailAnomSdr: [],
      detailAnomSe: [],
    }

    resData.bilanActif = await recupTableau.recupBILAN_ACTIF(compteId, fileId, exerciceId);
    resData.bilanPassif = await recupTableau.recupBILAN_PASSIF(compteId, fileId, exerciceId);
    resData.crn = await recupTableau.recupCRN(compteId, fileId, exerciceId);
    resData.crf = await recupTableau.recupCRF(compteId, fileId, exerciceId);
    resData.tftd = await recupTableau.recupTFTD(compteId, fileId, exerciceId);
    resData.tfti = await recupTableau.recupTFTI(compteId, fileId, exerciceId);
    resData.evcp = await recupTableau.recupEVCP(compteId, fileId, exerciceId);
    resData.drf = await recupTableau.recupDRF(compteId, fileId, exerciceId);
    resData.bhiapc = await recupTableau.recupBHIAPC(compteId, fileId, exerciceId);
    resData.mp = await recupTableau.recupMP(compteId, fileId, exerciceId);
    resData.da = await recupTableau.recupDA(compteId, fileId, exerciceId);
    resData.dp = await recupTableau.recupDP(compteId, fileId, exerciceId);
    resData.eiafnc = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);
    resData.sad = await recupTableau.recupSAD(compteId, fileId, exerciceId);
    resData.sdr = await recupTableau.recupSDR(compteId, fileId, exerciceId);
    resData.se = await recupTableau.recupSE(compteId, fileId, exerciceId);
    resData.ne = await recupTableau.recupNE(compteId, fileId, exerciceId);
    resData.bilanActif = await recupTableau.recupBILAN_ACTIF(compteId, fileId, exerciceId);
    resData.bilanPassif = await recupTableau.recupBILAN_PASSIF(compteId, fileId, exerciceId);
    resData.crn = await recupTableau.recupCRN(compteId, fileId, exerciceId);
    resData.crf = await recupTableau.recupCRF(compteId, fileId, exerciceId);
    resData.tftd = await recupTableau.recupTFTD(compteId, fileId, exerciceId);
    resData.tfti = await recupTableau.recupTFTI(compteId, fileId, exerciceId);
    resData.evcp = await recupTableau.recupEVCP(compteId, fileId, exerciceId);
    resData.drf = await recupTableau.recupDRF(compteId, fileId, exerciceId);
    resData.bhiapc = await recupTableau.recupBHIAPC(compteId, fileId, exerciceId);
    resData.mp = await recupTableau.recupMP(compteId, fileId, exerciceId);
    resData.da = await recupTableau.recupDA(compteId, fileId, exerciceId);
    resData.dp = await recupTableau.recupDP(compteId, fileId, exerciceId);
    resData.eiafnc = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);
    resData.sad = await recupTableau.recupSAD(compteId, fileId, exerciceId);
    resData.sdr = await recupTableau.recupSDR(compteId, fileId, exerciceId);
    resData.se = await recupTableau.recupSE(compteId, fileId, exerciceId);
    resData.ne = await recupTableau.recupNE(compteId, fileId, exerciceId);

    //récupération nombre anomalies et détails anomalies
    resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
    resData.detailAnomBilan = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'BILAN');
    resData.detailAnomCrn = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'CRN');
    resData.detailAnomCrf = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'CRF');
    resData.detailAnomTftd = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'TFTD');
    resData.detailAnomTfti = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'TFTI');
    resData.detailAnomEvcp = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'EVCP');
    resData.detailAnomDrf = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'DRF');
    resData.detailAnomBhiapc = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'BHIAPC');
    resData.detailAnomMp = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'MP');
    resData.detailAnomDa = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'DA');
    resData.detailAnomDp = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'DP');
    resData.detailAnomEiafnc = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'EIAFNC');
    resData.detailAnomSad = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'SAD');
    resData.detailAnomSdr = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'SDR');
    resData.detailAnomSe = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, 'SE');

    resData.state = true;
    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const getListeOneTable = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableau } = req.body;

    let resData = {
      state: false,
      msg: '',
      list1: [],
      list2: [],
    }

    resData.list1 = await recupTableau.recupBILAN_ACTIF(compteId, fileId, exerciceId);
    resData.list2 = await recupTableau.recupBILAN_PASSIF(compteId, fileId, exerciceId);

    resData.state = true;
    res.status(200).json(resData);

  } catch (error) {
    console.error('ERREUR getListeOneTable:', error);
    res.status(500).json({ state: false, error: error.message });
  }

}

const getListeCompteRubrique = async (req, res) => {
  try {
    let { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId } = req.body;

    compteId = Number(compteId);
    fileId = Number(fileId);
    exerciceId = Number(exerciceId);

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
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

const activateCalcul = async (req, res) => {
  try {
    let { compteId, fileId, exerciceId, tableau, refreshTotal } = req.body;

    compteId = Number(compteId);
    fileId = Number(fileId);
    exerciceId = Number(exerciceId);

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      list1: [],
      list2: [],
      etatglobal: [],
      detailAnom: []
    }

    try {
      await fonctionUpdateBalanceSold.updateSold(compteId, fileId, exerciceId, [], true);

    } catch (err) {
      throw new Error(`Erreur lors de la mise à jour des soldes ou des rubriques : ${err.message}`);
    }

    if (tableau === 'BILAN') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshBILAN(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupBILAN_ACTIF(compteId, fileId, exerciceId);
        resData.list2 = await recupTableau.recupBILAN_PASSIF(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'CRN') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshCRN(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupCRN(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'CRF') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshCRF(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupCRF(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'TFTD') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshTFTD(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupTFTD(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'TFTI') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshTFTI(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupTFTI(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'EVCP') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshEVCP(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupEVCP(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'DRF') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshDRF(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupDRF(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'DP') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshDP(compteId, fileId, exerciceId, refreshTotal);

      if (stateRefresh) {
        resData.list1 = await recupTableau.recupDP(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'SAD') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshSAD(compteId, fileId, exerciceId, refreshTotal);
      if (stateRefresh) {
        resData.list1 = await recupTableau.recupSAD(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    } else if (tableau === 'SDR') {
      const { stateRefresh } = await declEbilanRefreshFunction.refreshSDR(compteId, fileId, exerciceId, refreshTotal);
      if (stateRefresh) {
        resData.list1 = await recupTableau.recupSDR(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableau);

        resData.state = true;
        resData.msg = `Mise à jour des calculs du tableau ${tableau} terminées avec succès.`
      }
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const addmodifyTableau = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableau, formData } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: []
    }

    let tableSource = db;

    if (tableau === 'BHIAPC') {
      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowBHIAPC(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupBHIAPC(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupBHIAPC(compteId, fileId, exerciceId);
      }
    } else if (tableau === 'MP') {

      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowMP(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupMP(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupMP(compteId, fileId, exerciceId);
      }

    } else if (tableau === 'DA') {

      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowDA(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupDA(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupDA(compteId, fileId, exerciceId);
      }
    } else if (tableau === 'DP') {

      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowDP(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupDP(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupDP(compteId, fileId, exerciceId);
      }
    } else if (tableau === 'EIAFNC') {

      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowEIAFNC(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);
      }
    } else if (tableau === 'SAD') {
      tableSource = db.liassesads;
    } else if (tableau === 'SDR') {
      tableSource = db.liassesdrs;
    } else if (tableau === 'SE') {

      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowSE(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupSE(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupSE(compteId, fileId, exerciceId);
      }

    } else if (tableau === 'NE') {

      const { stateModify, stateAdd } = await functionAddOrModifyRow.addOrmodifyRowNE(compteId, fileId, exerciceId, formData);

      if (stateModify) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";
        resData.liste = await recupTableau.recupNE(compteId, fileId, exerciceId);
      }

      if (stateAdd) {
        resData.state = true;
        resData.msg = "Ajout de nouvelle ligne effectué avec succès.";
        resData.liste = await recupTableau.recupNE(compteId, fileId, exerciceId);
      }
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deleteTableOneRow = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, infoRowToDelete } = req.body;

    const actionBhiapc = infoRowToDelete.action;
    const nifBhiapc = infoRowToDelete.nif;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
      etatglobal: [],
      detailAnom: []
    }

    let tableSource = db;

    if (infoRowToDelete.tableau === 'BHIAPC') {
      tableSource = db.liassebhiapcs;
    } else if (infoRowToDelete.tableau === 'MP') {
      tableSource = db.liassemps;
    } else if (infoRowToDelete.tableau === 'DA') {
      tableSource = db.liassedas;
    } else if (infoRowToDelete.tableau === 'DP') {
      tableSource = db.liassedps;
    } else if (infoRowToDelete.tableau === 'EIAFNC') {
      tableSource = db.liasseeiafncs;
    } else if (infoRowToDelete.tableau === 'SAD') {
      tableSource = db.liassesads;
    } else if (infoRowToDelete.tableau === 'SDR') {
      tableSource = db.liassesdrs;
    } else if (infoRowToDelete.tableau === 'SE') {
      tableSource = db.liasseses;
    } else if (infoRowToDelete.tableau === 'NE') {
      tableSource = db.liassenotes;
    }

    let deletedRow = null;
    if (infoRowToDelete.tableau === 'BHIAPC') {
      if (actionBhiapc === 'group') {
        deletedRow = await tableSource.destroy({
          where:
          {
            nif: nifBhiapc,
            id_compte: compteId,
            id_dossier: fileId,
            id_exercice: exerciceId,
          }
        });
      } else {
        deletedRow = await tableSource.destroy({
          where:
          {
            id: infoRowToDelete.id,
            id_compte: compteId,
            id_dossier: fileId,
            id_exercice: exerciceId,
          }
        });
      }
    } else {
      deletedRow = await tableSource.destroy({
        where:
        {
          id: infoRowToDelete.id,
          id_compte: compteId,
          id_dossier: fileId,
          id_exercice: exerciceId,
        }
      });
    }

    if (deletedRow) {
      if (infoRowToDelete.tableau === 'BHIAPC') {
        resData.liste = await recupTableau.recupBHIAPC(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', infoRowToDelete.tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, infoRowToDelete.tableau);

      } else if (infoRowToDelete.tableau === 'MP') {
        resData.liste = await recupTableau.recupMP(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', infoRowToDelete.tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, infoRowToDelete.tableau);

      } else if (infoRowToDelete.tableau === 'DA') {
        resData.liste = await recupTableau.recupDA(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', infoRowToDelete.tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, infoRowToDelete.tableau);

      } else if (infoRowToDelete.tableau === 'DP') {
        resData.liste = await recupTableau.recupDP(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', infoRowToDelete.tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, infoRowToDelete.tableau);

      } else if (infoRowToDelete.tableau === 'EIAFNC') {
        resData.liste = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', infoRowToDelete.tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, infoRowToDelete.tableau);

      } else if (infoRowToDelete.tableau === 'SAD') {

      } else if (infoRowToDelete.tableau === 'SDR') {

      } else if (infoRowToDelete.tableau === 'SE') {
        resData.liste = await recupTableau.recupSE(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', infoRowToDelete.tableau, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, infoRowToDelete.tableau);

      } else if (infoRowToDelete.tableau === 'NE') {
        resData.liste = await recupTableau.recupNE(compteId, fileId, exerciceId);
      }

      resData.state = true;
      resData.msg = "Suppression de la ligne effectuée avec succès.";
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const deleteTableAllRow = async (req, res) => {
  try {
    const { compteId, fileId, exerciceId, tableauToDeleteAllRow } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
      etatglobal: [],
      detailAnom: []
    }

    let tableSource = db;

    if (tableauToDeleteAllRow === 'BHIAPC') {
      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowBHIAPC(compteId, fileId, exerciceId);

      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupBHIAPC(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }

    } else if (tableauToDeleteAllRow === 'MP') {
      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowMP(compteId, fileId, exerciceId);
      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupMP(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }

    } else if (tableauToDeleteAllRow === 'DA') {
      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowDA(compteId, fileId, exerciceId);

      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupDA(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }

    } else if (tableauToDeleteAllRow === 'DP') {

      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowDP(compteId, fileId, exerciceId);
      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupDP(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }

    } else if (tableauToDeleteAllRow === 'EIAFNC') {

      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowEIAFNC(compteId, fileId, exerciceId);

      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }
    } else if (tableauToDeleteAllRow === 'EIAFNC') {

      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowEIAFNC(compteId, fileId, exerciceId);
      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupEIAFNC(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }

    } else if (tableauToDeleteAllRow === 'SAD') {
      tableSource = db.liassesads;
    } else if (tableauToDeleteAllRow === 'SDR') {
      tableSource = db.liassesdrs;
    } else if (tableauToDeleteAllRow === 'SE') {

      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowSE(compteId, fileId, exerciceId);
      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupSE(compteId, fileId, exerciceId);

        const etatControl = await functionControles.controletableau('EBILAN', tableauToDeleteAllRow, compteId, fileId, exerciceId);
        resData.etatglobal = await recupTableau.recupETAT(compteId, fileId, exerciceId);
        resData.detailAnom = await recupTableau.recupETATDETAIL(compteId, fileId, exerciceId, tableauToDeleteAllRow);
      }

    } else if (tableauToDeleteAllRow === 'NE') {

      const stateDeleting = await declEbilanDeleteFunction.deleteAllRowNE(compteId, fileId, exerciceId);
      if (stateDeleting) {
        resData.state = true;
        resData.msg = "Suppression de toute les lignes du tableau effectuée avec succès.";
        resData.liste = await recupTableau.recupNE(compteId, fileId, exerciceId);
      }
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const listeAjustement = async (req, res) => {
  try {
    const { compteId, dossierId, exerciceId, etatId, rubriqueId, nature } = req.query;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
      etatglobal: [],
      detailAnom: []
    }

    const liste = await ajustements.findAll({
      where:
      {
        id_compte: compteId,
        id_dossier: dossierId,
        id_exercice: exerciceId,
        id_etat: etatId,
        id_rubrique: rubriqueId,
        nature: nature
      }
    });

    if (liste) {
      resData.state = true;
      resData.liste = liste;
      resData.msg = 'traitement terminé avec succès.';
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const addModifyAjustement = async (req, res) => {
  try {
    const { id,
      state,
      id_compte,
      id_dossier,
      id_exercice,
      id_rubrique,
      id_etat,
      nature,
      motif,
      montant } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
      etatglobal: [],
      detailAnom: []
    }

    const testIfExist = await ajustements.findAll({
      where:
      {
        id: id,
        id_compte: id_compte,
        id_dossier: id_dossier,
        id_exercice: id_exercice,
        id_etat: id_etat,
        id_rubrique: id_rubrique,
        nature: nature
      }
    });

    if (testIfExist.length === 0) {
      const addAjust = await ajustements.create({
        id_compte: id_compte,
        id_dossier: id_dossier,
        id_exercice: id_exercice,
        id_etat: id_etat,
        id_rubrique: id_rubrique,
        nature: nature,
        motif: motif,
        montant: montant
      });

      if (addAjust) {
        resData.state = true;
        resData.msg = "Traitement effectué avec succès.";

        const etatControl = await functionControles.controletableau('EBILAN', id_etat, id_compte, id_dossier, id_exercice);
        resData.etatglobal = await recupTableau.recupETAT(id_compte, id_dossier, id_exercice);
        resData.detailAnom = await recupTableau.recupETATDETAIL(id_compte, id_dossier, id_exercice, id_etat);
      } else {
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données";
      }
    } else {
      const ModifyAjust = await ajustements.update(
        {
          motif: motif,
          montant: montant
        },
        {
          where:
          {
            id: id,
            id_compte: id_compte,
            id_dossier: id_dossier,
            id_exercice: id_exercice,
            id_etat: id_etat,
            id_rubrique: id_rubrique,
            nature: nature
          }
        }
      );

      if (ModifyAjust) {
        resData.state = true;
        resData.msg = "Modification effectuée avec succès.";

        const etatControl = await functionControles.controletableau('EBILAN', id_etat, id_compte, id_dossier, id_exercice);
        resData.etatglobal = await recupTableau.recupETAT(id_compte, id_dossier, id_exercice);
        resData.detailAnom = await recupTableau.recupETATDETAIL(id_compte, id_dossier, id_exercice, id_etat);
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

const deleteAjustement = async (req, res) => {
  try {
    const { idCompte, idDossier, idExercice, idEtat, idRubrique, nature, idToDelete } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
    }

    const stateDeleting = await ajustements.destroy({
      where:
      {
        id: idToDelete,
        id_compte: idCompte,
        id_dossier: idDossier,
        id_exercice: idExercice,
        id_etat: idEtat,
        id_rubrique: idRubrique,
        nature: nature
      }
    });

    if (stateDeleting) {
      resData.state = true;
      resData.msg = "Suppression de la ligne effectuée avec succès.";

      const etatControl = await functionControles.controletableau('EBILAN', idEtat, idCompte, idDossier, idExercice);
      resData.etatglobal = await recupTableau.recupETAT(idCompte, idDossier, idExercice);
      resData.detailAnom = await recupTableau.recupETATDETAIL(idCompte, idDossier, idExercice, idEtat);
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

const savemodifAnom = async (req, res) => {
  try {
    const id = req.params.id;
    const { id_compte, id_dossier, id_exercice, valide, comments, etat_id } = req.body;

    let resData = {
      state: false,
      msg: 'une erreur est survenue lors du traitement.',
      liste: [],
    }

    if (await controles.update(
      {
        comments: comments,
        valide: valide
      },
      {
        where:
        {
          id: id,
        }
      }
    )) {
      // Recompute anomalies_valides for this table (all controles validated?)
      const remaining = await controles.count({
        where: {
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          declaration: 'EBILAN',
          etat_id: etat_id,
          valide: { [Op.ne]: true }
        }
      });
      const allOk = remaining === 0;
      await etats.update({ anomalies_valides: allOk }, {
        where: {
          id_compte: id_compte,
          id_dossier: id_dossier,
          id_exercice: id_exercice,
          code: etat_id
        }
      });

      resData.liste = await recupTableau.recupETATDETAIL(id_compte, id_dossier, id_exercice, etat_id);
      resData.state = true;
      resData.msg = 'Sauvegardes des modifications terminés avec succès.'
    }

    return res.json(resData);
  } catch (error) {
    console.log(error);
  }
}

// Fonction pour récupérer les entêtes du PDF
const infoBlock = (dossier, exercice) => ([
  { text: `Dossier : ${dossier?.dossier}`, style: 'subTitle', margin: [0, 0, 0, 5] },
  { text: `Periode du : ${formatDate(exercice.date_debut)} au ${formatDate(exercice.date_fin)}`, style: 'subTitleExo', margin: [0, 0, 0, 10] }
]);

const exportToPDF = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, id_etat } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !id_etat) {
      return res.status(400).json({ msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    const printer = new PdfPrinter(fonts);

    let docDefinition = {}

    if (id_etat === "BILAN") {
      const { buildTable, bilanActif, bilanPassif } = await generateBilanContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Bilan actif', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(bilanActif, 'actif'),
          { text: '', pageBreak: 'before' },
          { text: 'Bilan passif', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(bilanPassif, 'passif')
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "CRN") {
      const { buildTable, crn } = await generateCrnContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Compte de résultat par nature', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(crn)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "CRF") {
      const { buildTable, crf } = await generateCrfContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Compte de résultat par fonction', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(crf)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "TFTD") {
      const { buildTable, tftd } = await generateTftdContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Tableau de flux de trésoreries méthode directe', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(tftd)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "TFTI") {
      const { buildTable, tfti } = await generateTftiContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Tableau de flux de trésoreries méthode indirecte', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(tfti)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "EVCP") {
      const { buildTable, evcp } = await generateEvcpContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        content: [
          { text: 'Etat de variation des capitaux propres', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(evcp)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "DRF") {
      const { buildTable, drf } = await generateDrfContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Détermination du résultat fiscal', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(drf)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "BHIAPC") {
      const { buildTable, bhiapc } = await generateBhiapcContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Etat des bénéficiaires d\'honoraires,d\'intérêts ou d\'arrérages portés en charge', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(bhiapc)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "MP") {
      const { buildTable, mp } = await generateMpContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        content: [
          { text: 'Marché public', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(mp)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "DA") {
      const { buildTable, da } = await generateDaContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        pageOrientation: 'landscape',
        content: [
          { text: 'Détails amortissements', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(da)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "DP") {
      const { buildTable, dp } = await generateDpContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        // pageOrientation: 'landscape',
        content: [
          { text: 'Détails provisions', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(dp)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "EIAFNC") {
      const { buildTable, eiafnc } = await generateEiafncContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        // pageOrientation: 'landscape',
        content: [
          { text: 'Evolution des immobilisations et actifs financiers non courants', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(eiafnc)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "SAD") {
      const { buildTable, sad } = await generateSadContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        pageOrientation: 'landscape',
        content: [
          { text: 'Suivi des amortissements différés', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(sad)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "SDR") {
      const { buildTable, sdr } = await generateSdrContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        pageOrientation: 'landscape',
        content: [
          { text: 'Suivi des déficits reportables', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(sdr)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "SE") {
      const { buildTable, se } = await generateSeContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        pageOrientation: 'landscape',
        content: [
          { text: 'Suivi des emprunts', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(se)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    } else if (id_etat === "NE") {
      const { buildTable, ne } = await generateNeContent(id_compte, id_dossier, id_exercice);
      docDefinition = {
        // pageOrientation: 'landscape',
        content: [
          { text: 'Notes explicatives', style: 'title' },
          infoBlock(dossier, exercice),
          ...buildTable(ne)
        ],
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };
    }

    else {
      return res.status(400).json({ msg: "Type d'état invalide" });
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${id_etat}.pdf"`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur génération PDF' });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, id_etat } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !id_etat) {
      return res.status(400).json({ msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const compte = await userscomptes.findByPk(id_compte);

    const workbook = new ExcelJS.Workbook();

    if (id_etat === "BILAN") {
      await exportBilanToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "CRN") {
      await exportCrnToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "CRF") {
      await exportCrfToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "TFTD") {
      await exportTftdToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "TFTI") {
      await exportTftiToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "EVCP") {
      await exportEvcpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "DRF") {
      await exportDrfToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "BHIAPC") {
      await exportBhiapcToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "MP") {
      await exportMpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "DA") {
      await exportDaToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "DP") {
      await exportDpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "EIAFNC") {
      await exportEiafncToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "SAD") {
      await exportSadToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "SDR") {
      await exportSdrToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "SE") {
      await exportSeToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else if (id_etat === "NE") {
      await exportNeToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    } else {
      return res.json({ message: "Paramètre introuvable" })
    }
    workbook.views = [
      { activeTab: 0 }
    ];
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${id_etat}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur génération Excel' });
  }
}

const exportAllToExcel = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice } = req.params;
    if (!id_dossier || !id_compte || !id_exercice) {
      return res.status(400).json({ msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const compte = await userscomptes.findByPk(id_compte);

    const workbook = new ExcelJS.Workbook();

    await exportBilanToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportCrnToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportCrfToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportTftdToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportTftiToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportEvcpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportDrfToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportBhiapcToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportMpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportDaToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportDpToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportEiafncToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportSadToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportSdrToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportSeToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));
    await exportNeToExcel(id_compte, id_dossier, id_exercice, workbook, dossier?.dossier, compte?.nom, formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));

    workbook.views = [
      { activeTab: 0 }
    ];
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=EBILAN.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur génération Excel' });
  }
}

const generatePdfBuffer = (printer, docDefinition) => {
  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', err => reject(err));

    pdfDoc.end();
  });
};

const exportAllToPDF = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice } = req.params;
    if (!id_dossier || !id_compte || !id_exercice) {
      return res.status(400).json({ msg: 'Paramètres manquants' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    const exercice = await exercices.findByPk(id_exercice);
    const compte = await userscomptes.findByPk(id_compte);

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    const printer = new PdfPrinter(fonts);

    const sections = [
      { generator: generateBilanActifContent, title: 'Bilan Actif', landscape: false },
      { generator: generateBilanPassifContent, title: 'Bilan Passif', landscape: false },
      { generator: generateCrnContent, title: 'Compte de résultat par nature', landscape: false },
      { generator: generateCrfContent, title: 'Compte de résultat par fonction', landscape: false },
      { generator: generateTftdContent, title: 'Tableau de flux de trésoreries méthode directe', landscape: false },
      { generator: generateTftiContent, title: 'Tableau de flux de trésoreries méthode indirecte', landscape: false },
      { generator: generateEvcpContent, title: 'Etat de variation des capitaux propres', landscape: true },
      { generator: generateDrfContent, title: 'Détermination du résultat fiscal', landscape: false },
      { generator: generateBhiapcContent, title: 'Etat des bénéficiaires d\'honoraires, d\'intérêts ou d\'arrérages portés en charge', landscape: false },
      { generator: generateMpContent, title: 'Marché public', landscape: false },
      { generator: generateDaContent, title: 'Détails amortissements', landscape: true },
      { generator: generateDpContent, title: 'Détails provisions', landscape: false },
      { generator: generateEiafncContent, title: 'Evolution des immobilisations et actifs financiers non courants', landscape: false },
      { generator: generateSadContent, title: 'Suivi des amortissements différés', landscape: true },
      { generator: generateSdrContent, title: 'Suivi des déficits reportables', landscape: true },
      { generator: generateSeContent, title: 'Suivi des emprunts', landscape: true },
      { generator: generateNeContent, title: 'Notes explicatives', landscape: false },
    ];

    const pdfBuffers = [];

    for (let i = 0; i < sections.length; i++) {
      const { generator, title, landscape } = sections[i];
      const { buildTable, ...data } = await generator(id_compte, id_dossier, id_exercice);
      const tableData = Object.values(data).find(v => Array.isArray(v)) || [];

      const content = [
        {
          text: title,
          style: 'title',
          // pageBreak: i === 0 ? undefined : 'before'
        },
        infoBlock(dossier, exercice),
        ...(buildTable && tableData.length > 0 ? buildTable(tableData) : [{ text: 'Aucune donnée', italics: true }])
      ];

      const docDefinition = {
        content,
        pageOrientation: landscape ? 'landscape' : 'portrait',
        styles: {
          title: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitle: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subTitleExo: { fontSize: 9 },
          tableHeader: { bold: true, fillColor: '#1A5276', color: 'white', margin: [0, 2, 0, 2] }
        },
        defaultStyle: { font: 'Helvetica', fontSize: 7 }
      };

      const buffer = await generatePdfBuffer(printer, docDefinition);
      pdfBuffers.push(buffer);
    }

    // Fusion des PDF avec pdf-lib
    const mergedPdf = await PDFDocument.create();
    for (const buffer of pdfBuffers) {
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    const finalPdfBytes = await mergedPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="BILAN.pdf"`);
    res.send(Buffer.from(finalPdfBytes));

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur génération PDF' });
  }
}

const importBhiapc = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ state: false, message: "Données manquantes ou invalides" });
    }

    const batchSize = 500;
    let lineAdded = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await liassebhiapcs.bulkCreate(batch);
      lineAdded += batch.length;
    }

    return res.status(200).json({
      state: true,
      nbrligne: lineAdded,
      message: `${lineAdded} ${lineAdded > 1 ? 'lignes ajoutées' : 'ligne ajoutée'} avec succès`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout', state: false });
  }
}

const importMp = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ state: false, message: "Données manquantes ou invalides" });
    }

    const batchSize = 500;
    let lineAdded = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await liassemps.bulkCreate(batch);
      lineAdded += batch.length;
    }

    return res.status(200).json({
      state: true,
      nbrligne: lineAdded,
      message: `${lineAdded} ${lineAdded > 1 ? 'lignes ajoutées' : 'ligne ajoutée'} avec succès`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout', state: false });
  }
}

const importDa = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ state: false, message: "Données manquantes ou invalides" });
    }

    const batchSize = 500;
    let lineAdded = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await liassedas.bulkCreate(batch);
      lineAdded += batch.length;
    }

    return res.status(200).json({
      state: true,
      nbrligne: lineAdded,
      message: `${lineAdded} ${lineAdded > 1 ? 'lignes ajoutées' : 'ligne ajoutée'} avec succès`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout', state: false });
  }
}

const importEiafnc = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ state: false, message: "Données manquantes ou invalides" });
    }

    const batchSize = 500;
    let lineAdded = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await liasseeiafncs.bulkCreate(batch);
      lineAdded += batch.length;
    }

    return res.status(200).json({
      state: true,
      nbrligne: lineAdded,
      message: `${lineAdded} ${lineAdded > 1 ? 'lignes ajoutées' : 'ligne ajoutée'} avec succès`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout', state: false });
  }
}

const importSe = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ state: false, message: "Données manquantes ou invalides" });
    }

    const batchSize = 500;
    let lineAdded = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await liasseses.bulkCreate(batch);
      lineAdded += batch.length;
    }

    return res.status(200).json({
      state: true,
      nbrligne: lineAdded,
      message: `${lineAdded} ${lineAdded > 1 ? 'lignes ajoutées' : 'ligne ajoutée'} avec succès`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout', state: false });
  }
}

const combineByCompte = (data) => {
  const grouped = data.reduce((acc, item) => {
    if (!item.compte) return acc;
    if (!acc[item.compte]) {
      acc[item.compte] = { ...item };
    } else {
      acc[item.compte].montant_charge += item.montant_charge;
      acc[item.compte].montant_beneficiaire += item.montant_beneficiaire;
    }
    return acc;
  }, {});

  return Object.values(grouped).filter(item => item.montant_charge !== 0);
};

const generateBhiapcAuto = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.body;

    if (!id_compte) {
      return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
    }
    if (!id_dossier) {
      return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
    }
    if (!id_exercice) {
      return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
    }

    await liassebhiapcs.destroy({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
      }
    });

    const rubriqueCompteBhiapc = await compterubriques.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        id_etat: 'BHIAPC',
        nature: 'BRUT',
        id_rubrique: 1,
        active: true
      }
    });

    if (!rubriqueCompteBhiapc || rubriqueCompteBhiapc.length === 0) {
      return res.status(400).json({ state: false, message: 'Aucune compte trouvé' });
    }

    const comptes = rubriqueCompteBhiapc.map(val => val.compte);
    const uniqueComptes = [...new Set(comptes)];
    // const processedEcritures = new Set();

    for (const comptesRubriqueBhiapc of uniqueComptes) {

      const journalData = await journals.findAll({
        where: {
          id_compte,
          id_dossier,
          id_exercice,
        },
        include: [
          {
            model: dossierplancomptable,
            attributes: ['compte'],
            required: true,
            where: { compte: { [Op.like]: `${comptesRubriqueBhiapc}%` } }
          },
          {
            model: codejournals,
            attributes: ['code', 'type', 'nif', 'adresse', 'libelle']
          }
        ],
        order: [['dateecriture', 'ASC']]
      });

      const journalEcriture = [...new Set(journalData.map(val => val.id_ecriture))];

      for (const id_ecriture of journalEcriture) {

        // if (processedEcritures.has(id_ecriture)) {
        //   continue;
        // }
        // processedEcritures.add(id_ecriture);

        const journalCode = await journals.findAll({
          where: { id_ecriture },
          include: [
            {
              model: dossierplancomptable,
              attributes: ['compte', 'id', 'typetier', 'cin', 'autrepieceid', 'statistique', 'adresse', 'nif', 'nifrepresentant', 'libelle', 'adresseetranger']
            },
            {
              model: codejournals,
              attributes: ['code', 'type', 'nif', 'adresse', 'libelle']
            }
          ],
        });

        const journalCodeMappedData = await Promise.all(
          journalCode.map(async (entry) => {
            const j = entry.toJSON();
            const dpc = j.dossierplancomptable;
            const cj = j.codejournal;

            const compte_centralise = await dossierplancomptable.findByPk(entry.id_numcptcentralise);

            return {
              ...j,
              compte: dpc?.compte || null,
              journal: cj?.code || null,
              typeCodeJournal: cj?.type || null,
              compte_centralise: compte_centralise?.compte || null,
              nifCodeJournal: cj?.nif || null,
              adresseCodeJournal: cj?.adresse || null,
              libelleCodeJournal: cj?.libelle || null
            };
          })
        );

        if (journalCodeMappedData.length > 0) {
          const codeJournalType = journalCodeMappedData[0].typeCodeJournal;

          if (codeJournalType) {

            switch (codeJournalType) {

              case 'ACHAT': {
                const journalAchats = journalCodeMappedData.filter(
                  item => item.compte_centralise && item.compte_centralise.toString().startsWith('401')
                );

                if (!journalAchats.length) break;

                for (const journalAchatData of journalAchats) {
                  const dossierPlanComptableData =
                    await dossierplancomptable.findByPk(journalAchatData.id_numcpt);

                  if (!dossierPlanComptableData) continue;

                  const valeurDC =
                    (journalAchatData.debit || 0) - (journalAchatData.credit || 0);

                  switch (dossierPlanComptableData.typetier) {
                    case 'avec-nif':
                      await liassebhiapcs.create({
                        id_compte,
                        id_dossier,
                        id_exercice,
                        nif: dossierPlanComptableData.nif,
                        raison_sociale: dossierPlanComptableData.statistique,
                        adresse: dossierPlanComptableData.adresse,
                        montant_charge: valeurDC,
                        id_etat: 'BHIAPC',
                        montatant_beneficiaire: valeurDC
                      });
                      break;

                    case 'etranger':
                      await liassebhiapcs.create({
                        id_compte,
                        id_dossier,
                        id_exercice,
                        nif: dossierPlanComptableData.nifrepresentant,
                        raison_sociale: dossierPlanComptableData.libelle,
                        adresse: dossierPlanComptableData.adresseetranger,
                        montant_charge: valeurDC,
                        id_etat: 'BHIAPC',
                        montatant_beneficiaire: valeurDC
                      });
                      break;

                    case 'sans-nif':
                      await liassebhiapcs.create({
                        id_compte,
                        id_dossier,
                        id_exercice,
                        raison_sociale: dossierPlanComptableData.cin || dossierPlanComptableData.autrepieceid,
                        adresse: dossierPlanComptableData.adresse,
                        montant_charge: valeurDC,
                        id_etat: 'BHIAPC',
                        montatant_beneficiaire: valeurDC
                      });
                      break;

                    case 'general':
                      await liassebhiapcs.create({
                        id_compte,
                        id_dossier,
                        id_exercice,
                        nif: dossierPlanComptableData.nif,
                        raison_sociale: dossierPlanComptableData.cin || dossierPlanComptableData.libelle,
                        adresse: dossierPlanComptableData.adresse,
                        montant_charge: valeurDC,
                        id_etat: 'BHIAPC',
                        montatant_beneficiaire: valeurDC
                      });
                      break;
                  }
                }
                break;
              }

              case 'OD':
              case 'CAISSE':
              case 'RAN':
              case 'VENTE': {
                const journalOthersData = journalCodeMappedData.filter(
                  item => item.compte && item.compte.toString().startsWith(compteData.compte)
                )
                if (!journalOthersData.length) break;
                for (const journalOthers of journalOthersData) {

                  const valeurDC =
                    (journalOthers.debit || 0) - (journalOthers.credit || 0);

                  await liassebhiapcs.create({
                    id_compte,
                    id_dossier,
                    id_exercice,
                    montant_charge: valeurDC,
                    montatant_beneficiaire: valeurDC,
                    id_etat: 'BHIAPC',
                    // nif: '-',
                    // adresse: 'test',
                    // raison_sociale: 'test'
                  });
                }
                break;
              }

              case 'BANQUE': {
                const journalBanqueData = journalCodeMappedData.filter(
                  item => item.compte &&
                    (item.compte.toString().startsWith('66') ||
                      item.compte.toString().startsWith('622'))
                );
                if (!journalBanqueData.length) break;

                for (const j of journalBanqueData) {

                  const valeurDC = (j.debit || 0) - (j.credit || 0);

                  await liassebhiapcs.create({
                    id_compte,
                    id_dossier,
                    id_exercice,
                    nif: j.nifCodeJournal,
                    raison_sociale: j.libelleCodeJournal,
                    adresse: j.adresseCodeJournal,
                    montant_charge: valeurDC,
                    id_etat: 'BHIAPC',
                    montatant_beneficiaire: valeurDC
                  });
                }

                break;
              }

            }
          }
        }
      }
    }

    return res.status(200).json({
      state: true,
      message: `BHIAPC généré avec succès`,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
  }
};

// Fonction de calcul
const calculateSolde = (sens, data) => {
  if (!data || data.length === 0) return 0;

  let total = 0;

  if (sens === 'D-C') {
    total = data.reduce((sum, l) => {
      const debit = parseFloat(l.debit) || 0;
      const credit = parseFloat(l.credit) || 0;
      return sum + (debit - credit);
    }, 0);
  } else if (sens === 'C-D') {
    total = data.reduce((sum, l) => {
      const debit = parseFloat(l.debit) || 0;
      const credit = parseFloat(l.credit) || 0;
      return sum + (credit - debit);
    }, 0);
  }

  return parseFloat(total.toFixed(2));
};

const generateDpAuto = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.body;

    if (!id_compte) {
      return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
    }
    if (!id_dossier) {
      return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
    }
    if (!id_exercice) {
      return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });
    }

    const currentExercice = await exercices.findByPk(id_exercice);

    if (!currentExercice) {
      return res.status(401).json({ message: 'Exercice actuel non trouvé', state: false });
    }

    const currentDebutExerciceN = currentExercice.date_debut;

    if (!currentDebutExerciceN) {
      return res.status(401).json({ message: 'Date de début d\'exercice non trouvée', state: false });
    }

    const dateDebut = new Date(currentDebutExerciceN);
    dateDebut.setDate(dateDebut.getDate() - 1);
    const dateFinN1Formatted = dateDebut.toISOString().split('T')[0];

    const n1Exercice = await exercices.findOne({
      where: {
        id_compte,
        id_dossier,
        date_fin: { [Op.eq]: new Date(dateFinN1Formatted) }
      }
    });
    const id_exerciceN1 = n1Exercice?.id || null;

    const listeRubrique = await rubriques.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        id_etat: "DP",
        nature: { [Op.notIn]: ['TOTAL', 'TITRE'] },
      },
      include: [
        {
          model: rubriquesmatrices,
          attributes: ['libelle'],
          required: false,
          where: { id_etat: "DP" }
        },
      ],
      raw: true,
      order: [['ordre', 'ASC']]
    });

    // return res.json(listeRubrique);

    if (listeRubrique.length === 0) {
      return res.status(404).json({ message: 'Liste des rubriques vide', state: false });
    }

    const idsRubrique = [...new Set(listeRubrique.map(item => item.id_rubrique))];

    // return res.json(idsRubrique);

    const listeCompteRubrique = await compterubriques.findAll({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        id_etat: 'DP',
        nature: 'BRUT',
        id_rubrique: idsRubrique,
        active: true
      },
      raw: true,
      order: [['compte', 'ASC']]
    });

    if (listeCompteRubrique.length === 0) {
      return res.status(404).json({ message: 'Liste des comptes rubriques vide', state: false });
    }

    // return res.json(listeCompteRubrique);

    const rubriqueTotals = {};

    await Promise.all(listeCompteRubrique.map(async (val) => {
      const { id_rubrique, senscalcul, compte, condition } = val;

      if (!rubriqueTotals[id_rubrique]) {
        rubriqueTotals[id_rubrique] = { totalMotantPl: 0, totalMontantAUG: 0, totalMontaDIM: 0 };
      }

      const journalData = await journals.findAll({
        where: { id_compte, id_dossier, id_exercice },
        include: [
          {
            model: dossierplancomptable,
            attributes: ['compte'],
            required: !!compte,
            where: compte ? { compte: { [Op.like]: `${compte}%` } } : undefined
          }
        ],
        order: [['dateecriture', 'ASC']]
      });

      // return res.json(journalData);

      const journalDataN1 = id_exerciceN1
        ? await journals.findAll({
          where: { id_compte, id_dossier, id_exercice: id_exerciceN1 },
          include: [
            {
              model: dossierplancomptable,
              attributes: ['compte'],
              required: !!compte,
              where: compte ? { compte: { [Op.like]: `${compte}%` } } : undefined
            }
          ],
          order: [['dateecriture', 'ASC']]
        })
        : [];

      if (condition === "PL") {
        rubriqueTotals[id_rubrique].totalMotantPl = calculateSolde(senscalcul, journalDataN1);
      }
      if (condition === "AUG") {
        rubriqueTotals[id_rubrique].totalMontantAUG = calculateSolde(senscalcul, journalData);
      }
      if (condition === "DIM") {
        rubriqueTotals[id_rubrique].totalMontaDIM = calculateSolde(senscalcul, journalData);
      }
    }));

    const rubriqueCount = Object.keys(rubriqueTotals).length;

    for (const [id_rubrique, totals] of Object.entries(rubriqueTotals)) {
      const { totalMotantPl, totalMontantAUG, totalMontaDIM } = totals;

      await liassedps.update(
        {
          montant_debut_ex: totalMotantPl,
          augm_dot_ex: totalMontantAUG,
          dim_repr_ex: totalMontaDIM,
          montant_fin: totalMotantPl + totalMontantAUG - totalMontaDIM
        },
        { where: { id_compte, id_dossier, id_exercice, id_rubrique } }
      );
    }

    return res.status(200).json({
      state: true,
      message: `${rubriqueCount} DP ${pluralize(rubriqueCount, 'modifié')} avec succès`
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur",
      state: false,
      error: error.message
    });
  }
};

const exportAllToXml = async (req, res) => {
  try {
    const { id_dossier, id_exercice, id_compte } = req.params;
    if (!id_dossier || !id_exercice || !id_compte) {
      return res.status(400).json({ state: false, message: 'Données manquantes' });
    }

    const dossier = await dossiers.findByPk(id_dossier);
    if (!dossier) {
      return res.status(400).json({ state: false, message: 'Dossier non trouvé' });
    }

    const exercice = await exercices.findByPk(id_exercice);
    if (!exercice) {
      return res.status(400).json({ state: false, message: 'Exercice non trouvé' });
    }

    let anneeExercice = '';
    const date_fin = new Date(exercice?.date_fin).getFullYear();
    const date_debut = new Date(exercice?.date_debut).getFullYear();

    if (date_fin === date_debut) {
      anneeExercice = date_fin;
    } else {
      anneeExercice = `${date_debut} - ${date_fin}`;
    }

    // Création du XML
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('EDI');

    // Informations générales
    const infos = root.ele('informations');
    infos.ele('type').txt('PCG');
    infos.ele('nif').txt(dossier?.nif);
    infos.ele('exercice').txt(anneeExercice);

    // Ligne fixe
    const tableauxFixe = root.ele('champsTableauxFixes');
    await exportActifToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportPassifToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportCrnToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportCrfToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportTftdToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportTftiToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportEvcpToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportDrfToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportBhiapcbToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportMpa2ToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportMpb2ToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportDaToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportDpa1ToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportSdrToXml(tableauxFixe, id_dossier, id_compte, id_exercice);
    await exportSadToXml(tableauxFixe, id_dossier, id_compte, id_exercice);

    // Ligne variable
    const tableauxVariable = root.ele('champsTableauxVariables');
    await exportCapToXml(tableauxVariable, id_dossier);
    await exportDbToXml(tableauxVariable, id_dossier);
    await exportBhiapcaToXml(tableauxVariable, id_dossier, id_compte, id_exercice);
    await exportMpa1ToXml(tableauxVariable, id_dossier, id_compte, id_exercice);
    await exportMpb1ToXml(tableauxVariable, id_dossier, id_compte, id_exercice);
    await exportDa1ToXml(tableauxVariable, id_dossier, id_compte, id_exercice);
    await exportDpa2ToXml(tableauxVariable, id_dossier, id_compte, id_exercice);
    await exportEiafncaToXml(tableauxVariable, id_dossier, id_compte, id_exercice);
    await exportSeToXml(tableauxVariable, id_dossier, id_compte, id_exercice);

    const xmlString = root.end({ prettyPrint: true, headless: true });

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Content-Disposition', `attachment; filename=Ebilan${anneeExercice}.xml`);
    res.send(xmlString);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur",
      state: false,
      error: error.message
    });
  }
}
// Overview des anomalies par tableau (jointure etats/controles)
const overview = async (req, res) => {
  try {
    const { compteId, dossierId, exerciceId } = req.params;
    const codes = ['BILAN', 'CRN', 'CRF', 'TFTD', 'TFTI', 'EVCP', 'DRF', 'BHIAPC', 'MP', 'DA', 'DP', 'EIAFNC', 'SAD', 'SDR', 'SE'];

    const etatsRows = await etats.findAll({
      where: {
        id_compte: Number(compteId),
        id_dossier: Number(dossierId),
        id_exercice: Number(exerciceId)
      },
      raw: true,
    });

    const map = new Map(etatsRows.map(e => [String(e.code || '').toUpperCase(), e]));
    const payload = codes.map(code => {
      const key = String(code).toUpperCase();
      // 1) exact match
      let e = map.get(key);
      // 2) fallback: first row whose code starts with the label (e.g., BILAN -> BILAN_ACTIF/PASSIF)
      if (!e) {
        e = etatsRows.find(r => String(r.code || '').toUpperCase().startsWith(key));
      }
      return {
        tableau: code,
        nbrAnomalies: Number(e?.nbranomalie || 0),
        status: e?.valide ? 'Validée' : 'Non validée',
        anomaliesValidee: typeof e?.anomalies_valides === 'boolean' ? !!e.anomalies_valides : (Number(e?.nbranomalie || 0) === 0),
        nom: e?.nom || null,
      };
    });

    return res.json({ state: true, list: payload });
  } catch (error) {
    return res.status(500).json({ state: false, message: 'overview error', error: error.message });
  }
};

// Détails d'anomalies pour un tableau (liste des controles)
const details = async (req, res) => {
  try {
    const { compteId, dossierId, exerciceId, tableau } = req.params;
    const rows = await controles.findAll({
      where: {
        id_compte: Number(compteId),
        id_dossier: Number(dossierId),
        id_exercice: Number(exerciceId),
        declaration: 'EBILAN',
        etat_id: tableau,
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    const count = rows.reduce((n, r) => n + (r.nbranomalie || 0), 0);
    const list = rows.map(r => ({ id: r.id, control_id: r.control_id, anomalie: r.anomalie, valide: !!r.valide, comments: r.comments || '' }));
    return res.json({ state: true, list, count });
  } catch (error) {
    return res.status(500).json({ state: false, message: 'details error', error: error.message });
  }
};

// Met à jour le statut de validation d'un état (etats.valide)
const setEtatValide = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice, code, valide } = req.body || {};
    if (!id_compte || !id_dossier || !id_exercice || !code || typeof valide !== 'boolean') {
      return res.status(400).json({ state: false, message: 'Paramètres manquants ou invalides' });
    }

    const [count] = await etats.update(
      { valide: !!valide },
      {
        where: {
          id_compte: Number(id_compte),
          id_dossier: Number(id_dossier),
          id_exercice: Number(id_exercice),
          code: String(code)
        }
      }
    );

    if (count === 0) {
      return res.status(404).json({ state: false, message: 'Etat non trouvé' });
    }

    return res.json({ state: true, message: 'Statut mis à jour', data: { code, valide: !!valide } });
  } catch (error) {
    return res.status(500).json({ state: false, message: 'setEtatValide error', error: error.message });
  }
};

const importEbilanWithProgressLogic = (tableModel, label) => {
  return async (req, res, progress) => {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data) || data.length === 0) {
        progress.error("Données manquantes ou invalides");
        return;
      }

      const totalLines = data.length;
      progress.update(0, totalLines, `Démarrage import ${label}...`, 0);

      await progress.processBatch(
        data,
        async (batch) => {
          await tableModel.bulkCreate(batch);
          return null;
        },
        10,
        95,
        `Import ${label} en cours...`
      );

      progress.complete(
        `${totalLines} ${totalLines > 1 ? 'lignes ajoutées' : 'ligne ajoutée'} avec succès`,
        { nbrligne: totalLines }
      );
    } catch (error) {
      console.error(error);
      progress.error(`Erreur lors de l'import ${label}`, error);
    }
  };
};

const importBhiapcWithProgress = withSSEProgress(importEbilanWithProgressLogic(liassebhiapcs, 'BHIAPC'), {
  batchSize: 500
});

const importMpWithProgress = withSSEProgress(importEbilanWithProgressLogic(liassemps, 'MP'), {
  batchSize: 500
});

const importDaWithProgress = withSSEProgress(importEbilanWithProgressLogic(liassedas, 'DA'), {
  batchSize: 500
});

const importEiafncWithProgress = withSSEProgress(importEbilanWithProgressLogic(liasseeiafncs, 'EIAFNC'), {
  batchSize: 500
});

const importSeWithProgress = withSSEProgress(importEbilanWithProgressLogic(liasseses, 'SE'), {
  batchSize: 500
});

module.exports = {
  overview,
  details,
  setEtatValide,
  infosVerrouillage,
  verrouillerTableau,
  getListeRubriqueGlobal,
  //getListeRubriqueIndividual,
  getListeOneTable,
  getListeCompteRubrique,
  activateCalcul,
  addmodifyTableau,
  deleteTableOneRow,
  deleteTableAllRow,
  addModifyAjustement,
  listeAjustement,
  deleteAjustement,
  savemodifAnom,
  exportToPDF,
  exportToExcel,
  exportAllToExcel,
  exportAllToPDF,
  importBhiapc,
  importBhiapcWithProgress,
  importMp,
  importMpWithProgress,
  importDa,
  importDaWithProgress,
  importEiafnc,
  importEiafncWithProgress,
  importSe,
  importSeWithProgress,
  generateBhiapcAuto,
  generateDpAuto,
  exportAllToXml
};