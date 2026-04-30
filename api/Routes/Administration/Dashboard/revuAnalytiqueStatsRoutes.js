const express = require('express');
const router = express.Router();
const controller = require('../../../Controllers/dashboard/revuAnalytiqueStatsController');
const verifyPermission = require('../../../Middlewares/verifyPermission');
const verifyJWT = require('../../../Middlewares/verifyJWT');

// Routes pour les statistiques de revue analytique
router.post('/getOrCreate', verifyJWT, verifyPermission('ADD', 'EDIT'), controller.getOrCreateStats);
router.post('/incrementAnomaly', verifyJWT, verifyPermission('ADD', 'EDIT'), controller.incrementAnomaly);
router.post('/decrementAnomaly', verifyJWT, verifyPermission('ADD', 'EDIT'), controller.decrementAnomaly);
router.post('/validateAnomaly', verifyJWT, verifyPermission('ADD', 'EDIT'), controller.validateAnomaly);
router.get('/totals', controller.getTotals);
router.get('/details', controller.getDetailsByCompte);

module.exports = router;
