const express = require('express');
const importBalanceController = require('../../Controllers/traitement/importBalanceController');

const router = express.Router();

//création des comptes qui n'existent pas encore avant import journal
router.post('/createNotExistingCompte', importBalanceController.createNotExistingCompte);

//import de la balance (version classique)
router.post('/importBalance', importBalanceController.importBalance);

//import de la balance avec progression en temps réel (SSE)
router.post('/importBalanceWithProgress', importBalanceController.importBalanceWithProgress);

module.exports = router;