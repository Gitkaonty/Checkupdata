const router = require('express').Router();
const revisionAnalytiqueController = require('../../Controllers/administration/revisionAnalytiqueController');

// POST - Lancer le contrôle analytique
router.post('/:id_compte/:id_dossier/:id_exercice', revisionAnalytiqueController.controlerAnalytiques);

// GET - Récupérer les résultats existants
router.get('/:id_compte/:id_dossier/:id_exercice', revisionAnalytiqueController.getResultats);

// DELETE - Supprimer les résultats
router.delete('/:id_compte/:id_dossier/:id_exercice', revisionAnalytiqueController.supprimerResultats);

module.exports = router;
