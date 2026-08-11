const express = require('express');
const router = express.Router();
const caisseCreditriceController = require('../../Controllers/administration/caisseCreditriceController');
const verifyJWT = require('../../Middlewares/verifyJWT');

router.use(verifyJWT);

// Données détaillées (lignes où la caisse 53x est créditrice)
router.get('/:id_compte/:id_dossier/:id_exercice', caisseCreditriceController.getCaisseCreditrice);

// Stats (dashboard)
router.get('/:id_compte/:id_dossier/:id_exercice/stats', caisseCreditriceController.getStats);

module.exports = router;
