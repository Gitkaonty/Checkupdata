const express = require('express');
const router = express.Router();
const analyseFournisseurController = require('../../Controllers/administration/analyseFournisseurController');
const verifyJWT = require('../../Middlewares/verifyJWT');

// Middleware d'authentification
router.use(verifyJWT);

// Route pour exécuter l'analyse des fournisseurs
router.post('/:id_compte/:id_dossier/:id_exercice/analyser', analyseFournisseurController.executerAnalyse);

// Route pour récupérer les résultats d'analyse
router.get('/:id_compte/:id_dossier/:id_exercice/resultats', analyseFournisseurController.getResultats);

// Route pour récupérer les statistiques des anomalies (fournisseurs + clients)
router.get('/:id_compte/:id_dossier/:id_exercice/stats', analyseFournisseurController.getStats);

// Route pour valider une anomalie
router.patch('/:id_compte/:id_dossier/:id_exercice/anomalies/:id', analyseFournisseurController.validerAnomalie);

// Route pour supprimer les résultats d'analyse
router.delete('/:id_compte/:id_dossier/:id_exercice', analyseFournisseurController.supprimerAnalyse);

module.exports = router;
