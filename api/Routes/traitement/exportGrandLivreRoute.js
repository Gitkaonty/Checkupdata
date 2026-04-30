const express = require('express');
const exportGrandLivreController = require('../../Controllers/traitement/exportGrandLivreController');

const router = express.Router();

router.post('/pdf', exportGrandLivreController.exportPdf);
router.post('/excel', exportGrandLivreController.exportExcel);
router.get('/listeCompteAux/:compteId/:fileId/:exerciceId', exportGrandLivreController.getListeCompteAux);

module.exports = router;
