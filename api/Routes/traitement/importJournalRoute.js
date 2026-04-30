const express = require('express');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const importJournalController = require('../../Controllers/traitement/importJournalController');

const router = express.Router();

router.post('/testIfRanExist', importJournalController.testIfRanExist);
router.post('/getAllCodeRan', importJournalController.getAllCodeRan);

router.post('/createNotExistingCodeJournal', importJournalController.createNotExistingCodeJournal);
router.post('/createNotExistingCompte', importJournalController.createNotExistingCompte);

router.post('/importJournalWithProgress', importJournalController.importJournalWithProgress);
router.post('/recupListeImporte', upload.single("file"), importJournalController.recupListeImporte);

module.exports = router;