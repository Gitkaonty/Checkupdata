const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/dashboard/revuAnalytiqueController');
const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

// Routes pour la revue analytique N/N-1
router.get('/revuAnalytiqueNN1/:id_compte/:id_dossier/:id_exercice', verifyJWT, controller.getRevuAnalytiqueNN1);

module.exports = router;
