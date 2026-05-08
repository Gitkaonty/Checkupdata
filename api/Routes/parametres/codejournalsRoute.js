const express = require('express');
const paramCodeJournauxController = require('../../Controllers/parametres/paramCodeJournauxController');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

// Récupérer la liste des codes journaux
router.get('/liste/:id', paramCodeJournauxController.getListeCodeJournaux);
router.get('/listeCodeJournaux/:id', paramCodeJournauxController.getListeCodeJournaux);

// Ajouter ou modifier un code journal
router.post('/add', verifyJWT, verifyPermission('ADD', 'EDIT'), paramCodeJournauxController.addCodeJournal);

// Supprimer un code journal
router.post('/delete', verifyJWT, verifyPermission('DELETE'), paramCodeJournauxController.codeJournauxDelete);

// Importer des codes journaux via fichier CSV
router.post('/import', verifyJWT, paramCodeJournauxController.importCodeJournaux);

module.exports = router;
