//importing modules
const express = require('express');
const homeController = require('../../Controllers/Home/homeController');
const verifyJWT = require('../../Middlewares/verifyJWT');
const router = express.Router();

const verifyPermission = require('../../Middlewares/verifyPermission');

//login route
router.get('/file/:compteId', homeController.recupListDossier);

//création d'un nouveau dossier
router.post('/newFile', verifyJWT, verifyPermission('ADD'), homeController.createNewFile);

//suppression d'un nouveau dossier
router.post('/deleteFile', verifyJWT, verifyPermission('DELETE'), homeController.deleteCreatedFile);

//récupérer les informations sur le dossier
router.get('/FileInfos/:id', homeController.informationsFile);

// mettre à jour le centre fiscal du dossier
router.put('/FileCentrefisc/:id', homeController.updateCentrefisc);

// Vérification d'accès à une dossier
router.get('/checkAccessDossier/:id', verifyJWT, homeController.checkAccessDossier);

// Récupération de toutes les dossier liés au compte
router.get('/getAllDossierByCompte/:compteId', homeController.getAllDossierByCompte);

// Récupération des dossiers qu'une compte a accès
router.get('/getCompteDossier/:userId', homeController.getCompteDossier);

// Vérification du mot de passe du dossier
router.post('/verifyFilePassword', homeController.verifyFilePassword);

// Suppréssion de password access dossier par utilisateur
router.post('/deleteDossierPasswordAccess', homeController.deleteDossierPasswordAccess);

module.exports = router;