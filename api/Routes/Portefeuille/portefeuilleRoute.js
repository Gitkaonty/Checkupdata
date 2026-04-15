const express = require('express');
const router = express.Router();

const portefeuilleController = require('../../Controllers/parametres/Portefeuille/portefeuilleController');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

// Récupération de toutes les portefeuille
router.get('/getAllPortefeuille/:id_compte', portefeuilleController.getAllPortefeuille);

// Ajout ou modification d'une portefeuille
router.post('/addOrUpdatePortefeuille', verifyJWT, verifyPermission('ADD', 'EDIT'), portefeuilleController.addOrUpdatePortefeuille);

// Suppréssion d'une portefeuille
router.delete('/deletePortefeuille/:id', verifyJWT, verifyPermission('DELETE'), portefeuilleController.deletePortefeuille);

module.exports = router;