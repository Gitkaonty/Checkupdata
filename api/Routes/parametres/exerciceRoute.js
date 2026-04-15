const express = require('express');
const router = express.Router();
const exerciceController = require('../../Controllers/parametres/exerciceController');
const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');
//récupérer la liste de dossiers associé l'user et à son compte
router.get('/listeExercice/:id', exerciceController.getListeExercice);

//récupérer la liste de situations associés à l'exercice
router.get('/listeSituation/:id', exerciceController.getListeSituation);

//création du premier exercice
router.post('/createFirstExercice', verifyJWT, verifyPermission('ADD'), exerciceController.createFirstExercice);

//création de l'exercice suivant
router.post('/createNextExercice', verifyJWT, verifyPermission('ADD'), exerciceController.createNextExercice);

//création de l'exercice précédent
router.post('/createPreviewExercice', verifyJWT, verifyPermission('ADD'), exerciceController.createPreviewExercice);

//verrouiller un exercice
router.post('/verrouillerExercice', exerciceController.verrouillerExercice);

//deverrouiller un exercice
router.post('/deverrouillerExercice', exerciceController.deverrouillerExercice);

//supprimer un exercice
router.post('/deleteExercice', verifyJWT, verifyPermission('DELETE'), exerciceController.deleteExercice);

//récupérer une exercice par son identifiant
router.get('/listeExerciceById/:id', exerciceController.getListeExerciceById);

//récupérer la liste des années
router.get('/getListeAnnee/:id_compte/:id_dossier', exerciceController.getListeAnnee);

// === ROUTES POUR LES PERIODES ===
//récupérer la liste des périodes d'un exercice
router.get('/listePeriodes/:id_exercice', exerciceController.getListePeriodes);

//créer une période
router.post('/createPeriode', verifyJWT, verifyPermission('ADD'), exerciceController.createPeriode);

//modifier une période
router.post('/updatePeriode', verifyJWT, verifyPermission('UPDATE'), exerciceController.updatePeriode);

//supprimer une période
router.post('/deletePeriode', verifyJWT, verifyPermission('DELETE'), exerciceController.deletePeriode);

module.exports = router;