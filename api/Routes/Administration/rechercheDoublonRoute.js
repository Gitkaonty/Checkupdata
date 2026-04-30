const router = require('express').Router();
const rechercheDoublonController = require('../../Controllers/administration/rechercheDoublonController');

// POST - Valider un groupe de doublons (ROUTE SPÉCIFIQUE EN PREMIER)
router.post('/validerGroupeDoublon/:id_compte/:id_dossier/:id_exercice/:id_doublon', rechercheDoublonController.validerGroupeDoublon);

// GET - Récupérer les statistiques des doublons
router.get('/:id_compte/:id_dossier/:id_exercice/stats', rechercheDoublonController.getStats);

// POST - Lancer la recherche de doublons (ROUTE GÉNÉRIQUE APRÈS)
router.post('/:id_compte/:id_dossier/:id_exercice', rechercheDoublonController.rechercherDoublons);

// GET - Récupérer les résultats existants
router.get('/:id_dossier/:id_exercice', rechercheDoublonController.getResultats);

// DELETE - Supprimer les résultats
router.delete('/:id_dossier/:id_exercice', rechercheDoublonController.supprimerResultats);

module.exports = router;
