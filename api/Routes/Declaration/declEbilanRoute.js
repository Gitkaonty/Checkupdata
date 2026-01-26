const express = require('express');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const declEbilanController = require('../../Controllers/Declaration/Ebilan/declEbilanController');

const router = express.Router();

//récupérer liste des rubriques globale
router.post('/listeRubriqueGlobal', declEbilanController.getListeRubriqueGlobal);

//récupérer liste des rubriques getListeCompteRubrique
//router.post('/listeRubriqueIndividual', declEbilanController.getListeRubriqueIndividual);
router.post('/listeOneTable', declEbilanController.getListeOneTable);

//récupérer liste des comptes pour une rubrique sélectionnée 
router.post('/listeCompteRubrique', declEbilanController.getListeCompteRubrique);

//actualiser le calcul pour un tableau
router.post('/activateCalcul', declEbilanController.activateCalcul);

//ajouter ou modifier une ligne d'un tableau
router.post('/addmodifyTableau', verifyJWT, verifyPermission('ADD', 'EDIT'), declEbilanController.addmodifyTableau);

//supprimer une ligne d'un tableau
router.post('/deleteTableOneRow', verifyJWT, verifyPermission('DELETE'), declEbilanController.deleteTableOneRow);

//supprimer toutes les lignes d'un tableau
router.post('/deleteTableAllRow', verifyJWT, verifyPermission('DELETE'), declEbilanController.deleteTableAllRow);

//récupération des informations de vérrouillage des tableaux
router.post('/infosVerrouillage', declEbilanController.infosVerrouillage);

//vérouiller ou déverouiller un tableau
router.post('/verrouillerTableau', declEbilanController.verrouillerTableau);

//sauvegarder les ajouts ou modification des ajustements de rubriques
router.post('/addModifyAjust', verifyJWT, verifyPermission('ADD', 'EDIT'), declEbilanController.addModifyAjustement);

//récupérer la liste des ajustements après mise à jour de la table
router.get('/listeAjust', declEbilanController.listeAjustement);

//supprimer un ajustement 
router.post('/deleteAjust', verifyJWT, verifyPermission('DELETE'), declEbilanController.deleteAjustement);

//sauvegarder les modifications et commentaires sur les anomalies des tableaux
router.put('/savemodifAnom/:id', declEbilanController.savemodifAnom);

// mettre à jour le statut de validation d'un état (etats.valide)
router.put('/etat/valide', declEbilanController.setEtatValide);

// Exportation en pdf
router.get('/exportToPDF/:id_compte/:id_dossier/:id_exercice/:id_etat', declEbilanController.exportToPDF);

// Exportation en excel
router.get('/exportToExcel/:id_compte/:id_dossier/:id_exercice/:id_etat', declEbilanController.exportToExcel);

// Exporter tout en excel
router.get('/exportAllToExcel/:id_compte/:id_dossier/:id_exercice', declEbilanController.exportAllToExcel);

// Exporter tout en PDF
router.get('/exportAllToPDF/:id_compte/:id_dossier/:id_exercice', declEbilanController.exportAllToPDF);

// Import formulaire bhiapc
router.post('/importBhiapc', declEbilanController.importBhiapc);
router.post('/importBhiapcWithProgress', declEbilanController.importBhiapcWithProgress);

// Import formulaire mp
router.post('/importMp', declEbilanController.importMp);
router.post('/importMpWithProgress', declEbilanController.importMpWithProgress);

// Import formulaire da
router.post('/importDa', declEbilanController.importDa);
router.post('/importDaWithProgress', declEbilanController.importDaWithProgress);

// Import formulaire eiafnc
router.post('/importEiafnc', declEbilanController.importEiafnc);
router.post('/importEiafncWithProgress', declEbilanController.importEiafncWithProgress);

// Import formulaire se
router.post('/importSe', declEbilanController.importSe);
router.post('/importSeWithProgress', declEbilanController.importSeWithProgress);

// Génération automatique du tableau BHIAPC
router.post('/generateBhiapcAuto', declEbilanController.generateBhiapcAuto);

// Génération automatique du tableau DP
router.post('/generateDpAuto', declEbilanController.generateDpAuto);

// Génération global des tableaux bilan
router.get('/exportAllToXml/:id_compte/:id_dossier/:id_exercice', declEbilanController.exportAllToXml);

// Revision anomalies overview & details
router.get('/overview/:compteId/:dossierId/:exerciceId', declEbilanController.overview);
router.get('/controles/:compteId/:dossierId/:exerciceId/:tableau', declEbilanController.details);

module.exports = router;