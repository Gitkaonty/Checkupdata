const express = require('express');
const paramCRMController = require('../../Controllers/Parametres/paramCRMController');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

//récupérer la liste de dossiers associé l'user et à son compte
router.get('/infoscrm/:id/:compteId', paramCRMController.getInfosCRM);

//Sauvegarde des mofifications
router.post('/modifying', verifyJWT, verifyPermission('EDIT'), paramCRMController.modifyingInfos);

//récupérer la liste des associés
router.get('/listeAssocie/:id', paramCRMController.getListeAssocie);

//récupérer la liste des filiales
router.get('/listeFiliale/:id', paramCRMController.getListeFiliale);

//récupérer la liste des domicialiations bancaires
router.get('/listeDomBank/:id', paramCRMController.getListeDomBank);

//Enregistrer un nouvel associe + sauvegarder les modifications sur un associe
router.post('/associe', verifyJWT, verifyPermission('EDIT'), paramCRMController.associe);

//Enregistrer une nouvelle filiales + sauvegarder les modifications sur une filiales
router.post('/filiale', verifyJWT, verifyPermission('EDIT'), paramCRMController.filiale);

//Enregistrer une nouvelle Dom bancaire + sauvegarder les modifications sur une dom bancaires
router.post('/domBank', verifyJWT, verifyPermission('EDIT'), paramCRMController.domBank);

//supprimer un associer 
router.post('/associeDelete', verifyJWT, verifyPermission('EDIT'), paramCRMController.deleteAssocie);

router.post('/filialeDelete', verifyJWT, verifyPermission('EDIT'), paramCRMController.deleteFiliale);

//supprimer une dom bancaire
router.post('/domBankDelete', verifyJWT, verifyPermission('EDIT'), paramCRMController.deleteDomBank);

//récupérer la liste des pays 
router.get('/getListePays', paramCRMController.getListePays);

//Mettre à jour la longueur de tous les comptes existants
router.post('/updateAccountsLength', paramCRMController.updateAccountsLength);

// Mis à jour des longueurs des compte dans le journal
router.post('/updateAccountsLengthInJournals', paramCRMController.updateAccountsLengthInJournals);

// Mis à jour des longueurs ds compte dans le dossiier plan comptable V2
router.post('/updateAccountsLengthInPlanComptable', paramCRMController.updateAccountsLengthInPlanComptable);

module.exports = router;