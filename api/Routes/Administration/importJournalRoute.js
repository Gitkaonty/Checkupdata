const express = require('express');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const importJournalController = require('../../Controllers/administration/importJournalController');

const router = express.Router();

//création des codes journaux qui n'existent pas encore avant import journal
router.post('/createNotExistingCodeJournal', importJournalController.createNotExistingCodeJournal);

//création des comptes qui n'existent pas encore avant import journal
router.post('/createNotExistingCompte', importJournalController.createNotExistingCompte);

//import du journal excel csv ou FEC (version classique)
router.post('/importJournal', importJournalController.importJournal);

//import du journal avec progression en temps réel (SSE)
router.post('/importJournalWithProgress', importJournalController.importJournalWithProgress);

// Récupération de la liste des journals importés
router.post('/recupListeImporte', upload.single("file"), importJournalController.recupListeImporte);

// Tester si il y a une code journal à nouveau
router.post('/testIfRanExist', importJournalController.testIfRanExist);

// Récupération des codes journaux reports à nouveau
router.post('/getAllCodeRan',importJournalController.getAllCodeRan);

module.exports = router;