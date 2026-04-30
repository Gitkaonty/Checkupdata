const express = require('express');
const paramCAController = require('../../Controllers/parametres/paramCAnalytiqueController');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

// Récupérer la liste des axes
router.get('/axes/:id_compte/:id_dossier', paramCAController.getAxes);

// Récupérer la liste des sections par id_axe
router.post('/sections/:id_compte/:id_dossier', paramCAController.getSectionsByAxeIds);

// Ajouter ou modifier un axe
router.post('/axes/addOrUpdate', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCAController.addOrUpdateAxes);

// Ajouter ou modifier une section
router.post('/sections/addOrUpdate', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCAController.addOrUpdateSections);

// Supprimer un axe
router.post('/axes/delete', verifyJWT, verifyPermission('DELETE'), paramCAController.deleteAxes);

// Supprimer une section
router.post('/sections/delete', verifyJWT, verifyPermission('DELETE'), paramCAController.deleteSections);

// Récupérer toutes les sections avec axes
router.get('/list/:id_compte/:id_dossier', paramCAController.getListAxeSection);

// Alias pour compatibilité avec anciennes URLs
router.get('/list/getListAxeSection/:id_compte/:id_dossier', paramCAController.getListAxeSection);

module.exports = router;
