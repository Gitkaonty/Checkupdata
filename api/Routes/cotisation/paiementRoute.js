const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const paiementController = require("../../Controllers/cotisation/paiementController");

// Créer un nouveau paiement
router.post("/", verifyJWT, paiementController.createPaiement);

// Récupérer tous les paiements (filtrés par exercice via query param)
// Exemple: /api/paiements?exerciceId=1
router.get("/", verifyJWT, paiementController.findAllPaiements);

router.put("/:id/validate", paiementController.validate);
router.put("/:id/unvalidate", paiementController.unvalidate);
router.delete("/:id", paiementController.delete);

module.exports = router;