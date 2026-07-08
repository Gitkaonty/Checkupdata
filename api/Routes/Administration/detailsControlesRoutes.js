const express = require('express');
const router = express.Router();
const detailsControlesExportController = require('../../Controllers/administration/detailsControlesExportController');
const verifyJWT = require('../../Middlewares/verifyJWT');

router.use(verifyJWT);

// Export global de TOUS les contrôles en un seul document.
// POST : le corps peut contenir { synthese } (synthèse des anomalies calculée
// côté client, rendue en 1re page). GET reste supporté (sans synthèse).
router.post('/:id_compte/:id_dossier/:id_exercice/export/global/pdf', detailsControlesExportController.exportGlobalPdf);
router.post('/:id_compte/:id_dossier/:id_exercice/export/global/excel', detailsControlesExportController.exportGlobalExcel);
router.get('/:id_compte/:id_dossier/:id_exercice/export/global/pdf', detailsControlesExportController.exportGlobalPdf);
router.get('/:id_compte/:id_dossier/:id_exercice/export/global/excel', detailsControlesExportController.exportGlobalExcel);

module.exports = router;
