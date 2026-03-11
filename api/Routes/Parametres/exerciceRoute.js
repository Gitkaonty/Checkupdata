const express = require('express');
const paramExerciceController = require('../../Controllers/Parametres/paramExerciceController');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

//récupérer la liste de dossiers associé l'user et à son compte
router.get('/listeExercice/:id/:compteId', paramExerciceController.getListeExercice);

//récupérer la liste de situations associés à l'exercice
router.get('/listeSituation/:id', paramExerciceController.getListeSituation);

//création du premier exercice
router.post('/createFirstExercice', verifyJWT, verifyPermission('ADD'), paramExerciceController.createFirstExercice);

//création de l'exercice suivant
router.post('/createNextExercice', verifyJWT, verifyPermission('ADD'), paramExerciceController.createNextExercice);

//création de l'exercice précédent
router.post('/createPreviewExercice', verifyJWT, verifyPermission('ADD'), paramExerciceController.createPreviewExercice);

//verrouiller un exercice
router.post('/verrouillerExercice', paramExerciceController.verrouillerExercice);

//deverrouiller un exercice
router.post('/deverrouillerExercice', paramExerciceController.deverrouillerExercice);

//supprimer un exercice
router.post('/deleteExercice', verifyJWT, verifyPermission('DELETE'), paramExerciceController.deleteExercice);

//récupérer une exercice par son identifiant
router.get('/listeExerciceById/:id', paramExerciceController.getListeExerciceById);

//récupérer la liste des années
router.get('/getListeAnnee/:id_compte/:id_dossier', paramExerciceController.getListeAnnee);

// Récupération de la liste des périodes
router.get('/getPeriodes/:id_exercice', paramExerciceController.getPeriodes);

// Ajout d'une période
router.post('/addPeriode', paramExerciceController.addPeriode);

// Suppréssion d'une période
router.delete('/deletePeriode/:id', paramExerciceController.deletePeriode);

module.exports = router;