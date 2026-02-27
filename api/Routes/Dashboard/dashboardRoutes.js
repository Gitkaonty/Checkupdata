const express = require('express');
const router = express.Router();
const dashboardController = require('../../Controllers/Dashboard/dashboardController');

// Récupération
router.post('/getAllInfo', dashboardController.getAllInfo);

// Récupérarion compte en attente
router.post('/getListeJournalEnAttente', dashboardController.getListeJournalEnAttente);

module.exports = router;