const express = require('express');
const exportJournalController = require('../../Controllers/traitement/exportJournalController');

const router = express.Router();

// Export PDF du journal avec filtres
router.post('/pdf', exportJournalController.exportPdf);
router.post('/excel', exportJournalController.exportExcel);

module.exports = router;
