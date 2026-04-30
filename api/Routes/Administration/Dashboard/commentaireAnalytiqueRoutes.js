const express = require('express');
const router = express.Router();
const commentaireAnalytiqueController = require('../../../Controllers/dashboard/commentaireAnalytiqueController');
const verifyJWT = require('../../../Middlewares/verifyJWT');
const verifyPermission = require('../../../Middlewares/verifyPermission');

// Ajouter ou mettre à jour un commentaire
router.post('/addOrUpdate', verifyJWT, verifyPermission('ADD', 'EDIT'), commentaireAnalytiqueController.addOrUpdateCommentaire);

// Récupérer un commentaire par compte
router.get('/get/:id_compte/:id_exercice/:id_dossier/:compte', commentaireAnalytiqueController.getCommentairesByCompte);

module.exports = router;