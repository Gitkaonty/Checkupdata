const express = require('express');
const router = express.Router();

const verifyJWT = require('../../../Middlewares/verifyJWT');
const verifyPermission = require('../../../Middlewares/verifyPermission');

const etatFinancierController = require('../../../Controllers/administration/etatFinancier/etatFinancierController');

// Récupération des états financier global
router.get('/getEtatFinancierGlobal/:id_compte/:id_dossier/:id_exercice', etatFinancierController.getEtatFinancierGlobal);

// Génération automatique d'une tableau
router.post('/generateTableEtatFinancier', etatFinancierController.generateTableEtatFinancier);

// Ajout ou modification d'une ajustement externe
router.post('/addModifyAjustementExterne', verifyJWT, verifyPermission('ADD', 'EDIT'), etatFinancierController.addModifyAjustementExterne);

// Récupération ajustement externe
router.get('/getAjustementExterne', etatFinancierController.getAjustementExterne);

// Suppréssion ajustement externe
router.delete('/deleteAjustementExterne/:id', verifyJWT, verifyPermission('DELETE'), etatFinancierController.deleteAjustementExterne);

// Exportation en pdf
router.get('/exportEtatFinancierToPdf/:id_compte/:id_dossier/:id_exercice/:id_periode/:id_etat', etatFinancierController.exportEtatFinancierToPdf);

// Exportation en excel
router.get('/exportEtatFinancierToExcel/:id_compte/:id_dossier/:id_exercice/:id_periode/:id_etat', etatFinancierController.exportEtatFinancierToExcel);

// Exporter tout en excel
router.get('/exportAllEtatFinancierToExcel/:id_compte/:id_dossier/:id_exercice', etatFinancierController.exportAllEtatFinancierToExcel);

// Exporter tout en PDF
router.get('/exportAllEtatFinancierToPdf/:id_compte/:id_dossier/:id_exercice', etatFinancierController.exportAllEtatFinancierToPdf);

// Récupération des états du tableau états financiers
router.post('/getVerouillageEtatFinancier', etatFinancierController.getVerouillageEtatFinancier);

// Vérouiller une tableau états financier
router.post('/lockEtatFinancier', etatFinancierController.lockEtatFinancier);

// Récupération état financier 2
router.post('/getEtatFinancier', etatFinancierController.getEtatFinancier);

// Récupération de la détail des lignes
router.post('/getEtatFinancierDetail', etatFinancierController.getEtatFinancierDetail);

// Récupération du tableau SIG
router.post('/getSig', etatFinancierController.getSig);

module.exports = router;