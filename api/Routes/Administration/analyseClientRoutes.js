const express = require('express');
const router = express.Router();
const analyseClientController = require('../../Controllers/administration/analyseClientController');
const verifyJWT = require('../../Middlewares/verifyJWT');

// Middleware d'authentification
router.use(verifyJWT);

// Route pour exécuter l'analyse des clients
router.post('/:id_compte/:id_dossier/:id_exercice/analyser', analyseClientController.executerAnalyse);

// Route pour récupérer les résultats d'analyse
router.get('/:id_compte/:id_dossier/:id_exercice/resultats', analyseClientController.getResultats);

// Route pour valider une anomalie
router.patch('/:id_compte/:id_dossier/:id_exercice/anomalies/:id', analyseClientController.validerAnomalie);

// Route pour supprimer les résultats d'analyse
router.delete('/:id_compte/:id_dossier/:id_exercice', analyseClientController.supprimerAnalyse);

module.exports = router;
