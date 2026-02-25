require('dotenv').config();
const db = require('../../../Models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const path = require('path');
const { exportIrsaTableExcel } = require('../../../Middlewares/irsa/DeclIrsaGenerateExcel');
const { generateIrsaContent } = require('../../../Middlewares/irsa/DeclIrsaGeneratePdf');
const { generateIrsaXml } = require('../../../Middlewares/irsa/DeclIrsaGenerateXml');
const PdfPrinter = require('pdfmake');

const fs = require('fs');

const logoPath = path.join(__dirname, `../../../public/logo/${process.env.LOGO_EXPORT}`);

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoImage = `data:image/png;base64,${logoBase64}`;

exports.getAll = async (req, res) => {
  try {
    const { id_compte, id_dossier, id_exercice } = req.params;
    // On récupère toutes les IRSA sans join, uniquement les champs plats
    const list = await db.irsa.findAll({
      where: {
        id_compte: Number(id_compte),
        id_dossier: Number(id_dossier),
        id_exercice: Number(id_exercice)
      }
    });
    return res.json({ state: true, list });
  } catch (error) {
    console.error('Erreur lors de la récupération IRSA:', error);
    return res.json({ state: false, msg: 'Erreur lors de la récupération', error: error.message, stack: error.stack });
  }
};

// Un seul IRSA
exports.getOne = async (req, res) => {
  try {
    // Simplifié pour éviter des références de modèles non importés
    const irsa = await db.irsa.findByPk(req.params.id);
    if (!irsa) return res.status(404).json({ state: false, msg: 'Déclaration IRSA non trouvée' });
    res.json({ state: true, data: irsa });
  } catch (error) {
    res.status(500).json({ state: false, msg: 'Erreur serveur', error });
  }
};

// Ajout IRSA
exports.create = async (req, res) => {
  try {
    console.log('--- Reçu à l\'API:', req.body);

    let { personnelId, mois, annee } = req.body;
    const matricule = req.body.matricule ? String(req.body.matricule).trim() : '';
    // Résoudre par matricule si pas de personnelId
    if (!personnelId && matricule) {
      const where = { matricule };
      if (req.body.id_compte) where.id_compte = req.body.id_compte;
      if (req.body.id_dossier) where.id_dossier = req.body.id_dossier;
      const p = await db.personnels.findOne({ where });
      if (!p) return res.status(404).json({ state: false, msg: `Personnel introuvable pour matricule ${matricule}` });
      personnelId = p.id;
      req.body.personnelId = personnelId;
    }
    if (!personnelId || !mois || !annee) {
      return res.status(400).json({ state: false, msg: 'personnelId ou matricule, mois, annee requis' });
    }

    // Vérification stricte anti-doublon
    const exists = await db.irsa.findOne({ where: { personnelId, mois, annee } });
    if (exists) {
      return res.status(409).json({ state: false, msg: 'Déjà existant pour ce personnel/mois/année', id: exists.id });
    }

    // Récupère les infos du personnel pour snapshot
    const personnel = await db.personnels.findByPk(personnelId);
    const irsa = await db.irsa.create({
      personnelId: req.body.personnelId,
      matricule: (personnel && personnel.matricule) || req.body.matricule || null,
      nom: personnel ? personnel.nom : null,
      prenom: personnel ? personnel.prenom : null,
      cnaps: personnel ? (personnel.numero_cnaps || personnel.cnaps) : null,
      cin: personnel ? (personnel.cin_ou_carte_resident || personnel.cin) : null,
      fonction: personnel ? (personnel.fonction || (personnel.id_fonction ? personnel.id_fonction : null)) : null,
      dateEntree: personnel ? personnel.date_entree : null,
      dateSortie: personnel ? personnel.date_sortie : null,
      indemniteImposable: req.body.indemniteImposable || 0,
      indemniteNonImposable: req.body.indemniteNonImposable || 0,
      avantageImposable: req.body.avantageImposable || 0,
      avantageExonere: req.body.avantageExonere || 0,
      salaireBase: req.body.salaireBase || 0,
      heuresSupp: req.body.heuresSupp || 0,
      primeGratification: req.body.primeGratification || 0,
      autres: req.body.autres || 0,
      salaireBrut: req.body.salaireBrut || 0,
      cnapsRetenu: req.body.cnapsRetenu || 0,
      ostie: req.body.ostie || 0,
      salaireNet: req.body.salaireNet || 0,
      autreDeduction: req.body.autreDeduction || 0,
      montantImposable: req.body.montantImposable || 0,
      impotCorrespondant: req.body.impotCorrespondant || 0,
      reductionChargeFamille: req.body.reductionChargeFamille || 0,
      impotDu: req.body.impotDu || 0,
      mois: req.body.mois,
      annee: req.body.annee,
      id_compte: req.body.id_compte,
      id_exercice: req.body.id_exercice,
      id_dossier: req.body.id_dossier,
    })

    return res.json({ state: true, msg: 'Déclaration IRSA ajoutée', data: irsa });
  } catch (error) {
    console.error('Erreur create IRSA:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }

};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const irsa = await Irsa.findByPk(id);
    if (!irsa) return res.status(404).json({ state: false, msg: 'IRSA non trouvée' });

    await irsa.update(req.body);

    return res.json({ state: true, msg: 'Déclaration IRSA mise à jour', data: irsa });
  } catch (error) {
    console.error('Erreur update IRSA:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

exports.generateIrsaBatchSnapshot = async (req, res) => {
  try {
    const { paies } = req.body;
    if (!Array.isArray(paies) || paies.length === 0) {
      return res.status(400).json({ state: false, msg: 'Aucune fiche de paie fournie.' });
    }
    const created = [];
    for (const paie of paies) {
      let personnelId = Number(paie.personnelId || 0);
      const mois = Number(paie.mois);
      const annee = Number(paie.annee);
      // Résoudre par matricule si pas d'ID
      if (!personnelId && paie.matricule) {
        const where = { matricule: String(paie.matricule).trim() };
        if (paie.id_compte) where.id_compte = paie.id_compte;
        if (paie.id_dossier) where.id_dossier = paie.id_dossier;
        const p = await db.personnels.findOne({ where });
        if (p) personnelId = p.id;
      }
      if (!personnelId || !mois || !annee) continue;
      // Vérification stricte anti-doublon
      const exists = await db.irsa.findOne({ where: { personnelId, mois, annee } });
      if (exists) continue;
      // Snapshot du personnel
      const personnel = await db.personnels.findByPk(personnelId);
      const irsaData = {
        personnelId,
        matricule: (personnel && personnel.matricule) || (paie.matricule ? String(paie.matricule).trim() : null),
        nom: personnel ? personnel.nom : null,
        prenom: personnel ? personnel.prenom : null,
        cnaps: personnel ? (personnel.numero_cnaps || personnel.cnaps) : null,
        cin: personnel ? (personnel.cin_ou_carte_resident || personnel.cin) : null,
        fonction: personnel ? (personnel.fonction || (personnel.id_fonction ? personnel.id_fonction : null)) : null,
        dateEntree: personnel ? personnel.date_entree : null,
        dateSortie: personnel ? personnel.date_sortie : null,
        indemniteImposable: paie.indemnites || 0,
        indemniteNonImposable: paie.indemniteNonImposable || 0,
        avantageImposable: paie.totalAvantageNature || 0,
        avantageExonere: paie.avantageExonere || 0,
        salaireBase: paie.salaireBase || 0,
        heuresSupp: paie.heuresSup || 0,
        primeGratification: paie.prime || 0,
        autres: paie.remunerationFerieDimanche || 0,
        salaireBrut: paie.totalSalaireBrut || 0,
        cnapsRetenu: paie.cnapsEmployeur || 0,
        ostie: paie.ostieEmployeur || 0,
        salaireNet: paie.baseImposable || 0,
        autreDeduction: paie.autreDeduction || 0,
        montantImposable: paie.montantImposable || 0,
        impotCorrespondant: paie.impotCorrespondant || 0,
        reductionChargeFamille: paie.deductionEnfants || 0,
        // Calcul IRSA selon barème sur salaireNet
        impotDu: (() => {
          const salaireNet = paie.baseImposable || 0;
          let calcul = 0;
          if (salaireNet <= 400000) {
            calcul = (salaireNet - 350000) * 0.05;
          } else if (salaireNet <= 500000) {
            calcul = 2500 + (salaireNet - 400000) * 0.10;
          } else if (salaireNet <= 600000) {
            calcul = 12500 + (salaireNet - 500000) * 0.15;
          } else if (salaireNet > 600000) {
            calcul = 27500 + (salaireNet - 600000) * 0.20;
          }
          // Appliquer la déduction enfants si présente
          const deductionEnfants = Number(paie.deductionEnfants) || 0;
          const calc = calcul - deductionEnfants;
          return calc <= 3000 ? 3000 : calc;
        })(),
        mois,
        annee,
        id_compte: paie.id_compte,
        id_dossier: paie.id_dossier,
        id_exercice: paie.id_exercice,
      };
      const irsa = await db.irsa.create(irsaData);
      created.push(irsa);
    }
    return res.json({ state: true, msg: 'Déclarations IRSA générées', list: created });
  } catch (error) {
    console.error('[IRSA][BATCH][ERROR] Erreur batch IRSA:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const irsa = await db.irsa.findByPk(id);
    if (!irsa) return res.status(404).json({ state: false, msg: 'IRSA non trouvée' });

    await irsa.destroy();

    return res.json({ state: true, msg: 'Déclaration IRSA supprimée' });
  } catch (error) {
    console.error('Erreur delete IRSA:', error);
    return res.status(500).json({ state: false, msg: 'Erreur serveur', error: error.message });
  }

};

exports.exportIrsaTablePdf = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;

    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ msg: 'Paramètres manquants', state: false });
    }

    const dossier = await db.dossiers.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);

    if (!dossier || !exercice || !compte) {
      return res.status(400).json({ msg: 'Dossier, exercice ou compte non trouvé', state: false });
    }

    // Générer le contenu IRSA
    const { buildTable, irsaData } = await generateIrsaContent(id_compte, id_dossier, id_exercice, mois, annee);

    if (irsaData.length === 0) {
      return res.status(404).json({
        msg: `Aucun document IRSA ne correspond aux termes de recherche spécifiés`,
        state: false
      });
    }

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    // Définition du document PDF
    const docDefinition = {
      pageSize: 'A2',
      pageOrientation: 'landscape',
      pageMargins: [10, 60, 5, 60],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 7
      },
      content: [
        // Titre
        {
          text: 'DÉCLARATION IRSA',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        // Sous-titre
        {
          text: `Dossier : ${dossier?.dossier || ''}`,
          style: 'subheader',
          lineHeight: 1.5,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },

        {
          text: `Mois et année : ${moisNoms[mois - 1]} ${annee}`,
          style: 'subheaderExo',
          lineHeight: 1.3,
          margin: [0, 0, 0, 8]
        },
        {
          text: `Période du : ${formatDate(exercice?.date_debut)} au ${formatDate(exercice?.date_fin)}`,
          style: 'subheaderExo',
          lineHeight: 1.3,
          margin: [0, 0, 0, 8]
        },

        // Tableau IRSA
        {
          ...buildTable(irsaData, {
            headerStyle: 'tableHeader',
            font: 'Helvetica'
          })[0],
          // 🔹 ajoute du padding pour les cellules du tableau (y compris l’en-tête)
          layout: {
            ...(
              buildTable(irsaData, {
                headerStyle: 'tableHeader',
                font: 'Helvetica'
              })[0].layout || {}
            ),
            hLineWidth: () => 0, // pas de ligne horizontale
            vLineWidth: () => 0, // pas de ligne verticale
            paddingTop: () => 4,
            paddingBottom: () => 4
          }
        }
      ],
      background: function (currentPage, pageSize) {
        if (currentPage === 1) {
          return [
            {
              image: logoImage,
              width: 50,
              absolutePosition: { x: 10, y: 10 }
            }
          ];
        }
        return [];
      },
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          font: 'Helvetica'
        },
        subheader: {
          fontSize: 14,
          bold: true,
          font: 'Helvetica'
        },
        subheaderExo: {
          fontSize: 10,
          bold: true,
          font: 'Helvetica'
        },
        tableHeader: {
          bold: true,
          fontSize: 6,
          color: 'white',
          fillColor: '#1A5276',
          alignment: 'center',
          font: 'Helvetica',
          margin: [0, 5, 0, 5], // 🔹 ajoute de la hauteur aux en-têtes
          lineHeight: 1.4       // 🔹 augmente légèrement l’espacement du texte
        },
        totalRow: {
          bold: true,
          fillColor: '#89A8B2',
          alignment: 'right',
          font: 'Helvetica'
        }
      }
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=IRSA_${mois}_${annee}.pdf`);

    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('Erreur export PDF IRSA:', error);
    return res.status(500).json({
      state: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

exports.exportIrsaTableExcel = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ msg: 'Paramètres manquants', state: false });
    }

    const dossier = await db.dossiers.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);

    if (!dossier) {
      return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
    }
    if (!exercice) {
      return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
    }
    if (!compte) {
      return res.status(400).json({ msg: 'Compte non trouvé', state: false });
    }

    // Vérifier s'il y a des données IRSA
    const irsaCount = await db.irsa.count({
      where: {
        id_compte,
        id_dossier,
        id_exercice,
        mois: Number(mois),
        annee: Number(annee)
      }
    });

    if (irsaCount === 0) {
      return res.status(404).json({
        msg: `Aucun document ne correspond aux termes de recherche spécifiés (id_compte: ${id_compte}, id_dossier: ${id_dossier}, id_exercice: ${id_exercice}, mois: ${mois}, annee: ${annee})`,
        state: false
      });
    }

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const workbook = new ExcelJS.Workbook();

    await exportIrsaTableExcel(id_compte, id_dossier, id_exercice, mois, annee, workbook, dossier?.dossier, compte?.nom, moisNoms[mois - 1], formatDate(exercice?.date_debut), formatDate(exercice?.date_fin));

    workbook.views = [
      { activeTab: 0 }
    ];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=IRSA_${mois}_${annee}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    return res.status(500).json({
      state: false,
      message: "Erreur serveur", error: error.message
    });
  }
}

exports.exportIrsaXml = async (req, res) => {
  try {
    const { id_dossier, id_compte, id_exercice, mois, annee } = req.params;
    if (!id_dossier || !id_compte || !id_exercice || !mois || !annee) {
      return res.status(400).json({ msg: 'Paramètres manquants', state: false });
    }

    const dossier = await db.dossiers.findByPk(id_dossier);
    const exercice = await db.exercices.findByPk(id_exercice);
    const compte = await db.userscomptes.findByPk(id_compte);

    if (!dossier) return res.status(400).json({ msg: 'Dossier non trouvé', state: false });
    if (!exercice) return res.status(400).json({ msg: 'Exercice non trouvé', state: false });
    if (!compte) return res.status(400).json({ msg: 'Compte non trouvé', state: false });

    const nif = String(dossier?.nif || '').trim();
    if (!nif) return res.status(400).json({ state: false, msg: 'Veuillez renseigner le NIF dans les informations du dossier.' });

    const xml = await generateIrsaXml(id_compte, id_dossier, id_exercice, mois, annee, nif);

    const fname = `irsa_${String(mois).padStart(2, '0')}-${annee}.xml`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    return res.end(xml);
  } catch (err) {
    console.error('[IRSA][EXPORT_XML] error:', err);
    return res.status(500).json({ state: false, msg: 'Erreur lors de la génération du XML' });
  }
};