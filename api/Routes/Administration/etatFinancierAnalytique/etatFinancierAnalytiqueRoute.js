const express = require('express');
const router = express.Router();

const verifyJWT = require('../../../Middlewares/verifyJWT');
const verifyPermission = require('../../../Middlewares/verifyPermission');

const etatFinancierControllerAnalytique = require('../../../Controllers/administration/etatFinancierAnalytique/etatFinancierAnalytiqueController');

// Récupération des états financier global
router.post('/getEtatFinancierAnalytiqueGlobal/:id_compte/:id_dossier/:id_exercice', etatFinancierControllerAnalytique.getEtatFinancierAnalytiqueGlobal);

// Génération automatique d'une tableau
router.post('/generateTableEtatFinancierAnalytique', etatFinancierControllerAnalytique.generateTableEtatFinancierAnalytique);

// Ajout ou modification d'une ajustement externe
router.post('/addModifyAjustementExterneAnalytique', verifyJWT, verifyPermission('ADD', 'EDIT'), etatFinancierControllerAnalytique.addModifyAjustementExterneAnalytique);

// Récupération ajustement externe
router.get('/getAjustementExterneAnalytique', etatFinancierControllerAnalytique.getAjustementExterneAnalytique);

// Suppréssion ajustement externe
router.delete('/deleteAjustementExterneAnalytique/:id', verifyJWT, verifyPermission('DELETE'), etatFinancierControllerAnalytique.deleteAjustementExterneAnalytique);

// Exportation en pdf
router.get('/exportEtatFinancierAnalytiqueToPdf/:id_compte/:id_dossier/:id_exercice/:id_etat/:id_axe/:id_section', etatFinancierControllerAnalytique.exportEtatFinancierAnalytiqueToPdf);

// Exportation en excel
router.get('/exportEtatFinancierAnalytiqueToExcel/:id_compte/:id_dossier/:id_exercice/:id_etat/:id_axe/:id_section', etatFinancierControllerAnalytique.exportEtatFinancierAnalytiqueToExcel);

// Exporter tout en excel
router.get('/exportAllEtatFinancierAnalytiqueToExcel/:id_compte/:id_dossier/:id_exercice/:id_axe/:id_section', etatFinancierControllerAnalytique.exportAllEtatFinancierAnalytiqueToExcel);

// Exporter tout en PDF
router.get('/exportAllEtatFinancierAnalytiqueToPdf/:id_compte/:id_dossier/:id_exercice/:id_axe/:id_section', etatFinancierControllerAnalytique.exportAllEtatFinancierAnalytiqueToPdf);

// Récupération des états du tableau états financiers
router.post('/getVerouillageEtatFinancierAnalytique', etatFinancierControllerAnalytique.getVerouillageEtatFinancierAnalytique);

// Vérouiller une tableau états financier
router.post('/lockEtatFinancierAnalytique', etatFinancierControllerAnalytique.lockEtatFinancierAnalytique);

// Récupération état financier analytique 2
router.post('/getEtatFinancierAnalytique', etatFinancierControllerAnalytique.getEtatFinancierAnalytique);

// Récupération de la détail des lignes dans l'état financier analytique
router.post('/getEtatFinancierAnalytiqueDetail', etatFinancierControllerAnalytique.getEtatFinancierAnalytiqueDetail);

module.exports = router;