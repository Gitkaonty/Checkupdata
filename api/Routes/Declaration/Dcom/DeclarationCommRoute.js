const express = require('express');
const router = express.Router();

const verifyJWT = require('../../../Middlewares/verifyJWT');
const verifyPermission = require('../../../Middlewares/verifyPermission');

const droitCommController = require('../../../Controllers/Declaration/Dcom/DeclarationCommController');

// Ajout declaration comm du type a
router.post('/addDroitCommA', verifyJWT, verifyPermission('ADD'), droitCommController.addDroitCommA);

// Ajout declaration comm type b
router.post('/addDroitCommB', verifyJWT, verifyPermission('ADD'), droitCommController.addDroitCommB);

// Suppression de tout declaration by type
router.delete('/deleteAllCommByType', verifyJWT, verifyPermission('DELETE'), droitCommController.deleteAllCommByType);

// Suppression d'une declaration par type
router.delete('/deleteOneCommByType', verifyJWT, verifyPermission('DELETE'), droitCommController.deleteOneCommByType);

// Recupérer declaration comm par type
router.get('/getDroitCommGlobal/:id_compte/:id_dossier/:id_exercice', droitCommController.getDroitCommGlobal);

// Recupérer declaration plp
router.get('/getListePlp/:id_compte/:id_dossier/:id_exercice', droitCommController.getListePlp);

// Modification déclaration comm du type a
router.put('/updateDroitCommA/:id', verifyJWT, verifyPermission('EDIT'), droitCommController.updateDroitCommA);

// Modification déclaration comm du type b
router.put('/updateDroitCommB/:id', verifyJWT, verifyPermission('EDIT'), droitCommController.updateDroitCommB);

// Modification déclaration comm pour plp
router.put('/updateDroitCommPlp/:id', verifyJWT, verifyPermission('EDIT'), droitCommController.updateDroitCommPlp);

// Récupération des vérouillages du table
router.get('/getVerrouillageComm/:id_compte/:id_dossier/:id_exercice', droitCommController.getVerrouillageComm);

// Update valide state
router.post('/verrouillerTableComm', droitCommController.verrouillerTableComm);

//Import droit comm de type a
router.post('/importdroitCommA', droitCommController.importdroitCommA);
router.post('/importdroitCommB', droitCommController.importdroitCommB);
router.post('/importdroitCommAWithProgress', droitCommController.importdroitCommAWithProgress);
router.post('/importdroitCommBWithProgress', droitCommController.importdroitCommBWithProgress);

// Génération automatique d'une tableau de droit de communication
router.post('/generateDCommAuto', droitCommController.generateDCommAuto);

// Exportation en PDF
router.get('/exportToPDF/:id_compte/:id_dossier/:id_exercice/:id_etat', droitCommController.exportToPDF);

// Exportation en EXCEL
router.get('/exportToExcel/:id_compte/:id_dossier/:id_exercice/:id_etat', droitCommController.exportToExcel)

module.exports = router;