const express = require('express');
const paramCAController = require('../../Controllers/Parametres/paramCAnalitique');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

// Récupérer la liste des axes
router.get('/getAxes/:id_compte/:id_dossier', paramCAController.getAxes);

// Récupérer la liste des section par id_axe
router.post('/getSectionsByAxeIds/:id_compte/:id_dossier', paramCAController.getSectionsByAxeIds);

// Ajouter une axe
router.post('/addAxe', paramCAController.addAxe);

// Ajouter une section
router.post('/addSection', paramCAController.addSection);

// Ajouter ou modifier une axe
router.post('/addOrUpdateAxes', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCAController.addOrUpdateAxes);

// Ajouter ou modifier une section
router.post('/addOrUpdateSections', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCAController.addOrUpdateSections);

// Supprimer les axes selectionnées
router.post('/deleteAxes', verifyJWT, verifyPermission('DELETE'), paramCAController.deleteAxes);

// Supprimer les sections selectionnés
router.post('/deleteSections', verifyJWT, verifyPermission('DELETE'), paramCAController.deleteSections);

// Récupération sections et axes
router.get('/getListAxeSection/:id_compte/:id_dossier', paramCAController.getListAxeSection);

// Récupération répartition Ca
router.get('/getRepartitionCA/:id_journal', paramCAController.getRepartitionCA);

// Import des sections analytiques
router.post('/importSections', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCAController.importSections);
router.post('/importSectionsWithProgress', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCAController.importSectionsWithProgress);

module.exports = router;