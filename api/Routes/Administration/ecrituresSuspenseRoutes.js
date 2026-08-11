const express = require('express');
const router = express.Router();
const ecrituresSuspenseController = require('../../Controllers/administration/ecrituresSuspenseController');
const verifyJWT = require('../../Middlewares/verifyJWT');

router.use(verifyJWT);

router.get('/:id_compte/:id_dossier/:id_exercice', ecrituresSuspenseController.getLignes);

// Stats (dashboard) : nombre d'écritures en suspens
router.get('/:id_compte/:id_dossier/:id_exercice/stats', ecrituresSuspenseController.getStats);

// Routes pour l'export
router.get('/:id_compte/:id_dossier/:id_exercice/export/pdf', ecrituresSuspenseController.exportPdf);
router.get('/:id_compte/:id_dossier/:id_exercice/export/excel', ecrituresSuspenseController.exportExcel);

module.exports = router;
