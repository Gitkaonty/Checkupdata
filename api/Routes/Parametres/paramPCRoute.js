const express = require('express');
const paramPCController = require('../../Controllers/Parametres/paramPCController');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

//récupérer le tableau du plan comptable
router.post('/pc', paramPCController.recupPc);
router.get('/PcIdLibelle/:id_compte/:id_dossier', paramPCController.recupPcIdLibelle);

// Récupérer la liste des plan comptable pour les actions de journals
router.get('/recupPcIdLibelleForJournal/:id_compte/:id_dossier', paramPCController.recupPcIdLibelleForJournal);

//Afficher les détails du modèl sélectionné
router.post('/AddCpt', verifyJWT, verifyPermission('ADD', 'EDIT'), paramPCController.AddCptToPc);

//Récupérer la liste des comptes de charges et TVA associé à la ligne sélectionné du plan comptable du modèl
router.get('/keepListCptChgTvaAssoc/:itemId', paramPCController.keepListCptChgTvaAssoc);

//supprimer un compte dans le tableau du plan comptable
router.post('/deleteItemPc', verifyJWT, verifyPermission('DELETE'), paramPCController.deleteItemPc);

//Récupérer les comptes de classe 6
router.get('/recupPcClasseSix/:id_compte/:id_dossier', paramPCController.recupPcClasseSix);

//Récupérer les comptes de classe du commpte isi
router.get('/recupPcCompteIsi/:id_compte/:id_dossier', paramPCController.recupPcCompteIsi);

// Récupérer les provinces
router.get('/getProvinces', paramPCController.getProvinces);

// Récupérer les régions
router.get('/getRegions/:province', paramPCController.getRegions);

// Récupérer les districts
router.get('/getDistricts/:province/:region', paramPCController.getDistricts);

// Récupérer les communes
router.get('/getCommunes/:province/:region/:district', paramPCController.getCommunes);

// Récupération des dossier plan comptable avec les consolidation des dossier
router.post('/recupPcConsolidation', paramPCController.recupPcConsolidation);

// Vérifier qu'on peut modifier une compte
router.post('/verifyCanUpdate', paramPCController.verifyCanUpdate);

// Sauvegarde des modifications de comptes
router.post('/editPc', paramPCController.editPc);

// Sauvegarde des modification depuis le popup
router.post('/editPcFromPopup', paramPCController.editPcFromPopup);

module.exports = router;