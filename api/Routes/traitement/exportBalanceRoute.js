const express = require('express');
const exportBalanceController = require('../../Controllers/traitement/exportBalanceController');

const router = express.Router();

//création des comptes qui n'existent pas encore avant import journal
router.post('/recupBalance', exportBalanceController.recupBalance);

// Récupération de la balance depuis le journal
router.post('/recupBalanceFromJournal', exportBalanceController.recupBalanceFromJournal);

// Récupération de la balance analytique
router.post('/recupBalanceAnalytiqueFromJournal', exportBalanceController.recupBalanceAnalytiqueFromJournal);

// Récupération balance analytique
router.post('/recupBalanceCa', exportBalanceController.recupBalanceCa);

// Actualisation de la balance
router.post('/actualizeBalance', exportBalanceController.actualizeBalance);

// export PDF/Excel balance
router.post('/pdf', exportBalanceController.exportPdf);
router.post('/excel', exportBalanceController.exportExcel);

module.exports = router;