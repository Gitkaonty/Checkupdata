const express = require('express');
const router = express.Router();
const equilibreDebitCreditController = require('../../Controllers/administration/equilibreDebitCreditController');
const verifyJWT = require('../../Middlewares/verifyJWT');

router.use(verifyJWT);

// Données détaillées (global + écritures déséquilibrées)
router.get('/:id_compte/:id_dossier/:id_exercice', equilibreDebitCreditController.getEquilibre);

// Stats (dashboard)
router.get('/:id_compte/:id_dossier/:id_exercice/stats', equilibreDebitCreditController.getStats);

module.exports = router;
