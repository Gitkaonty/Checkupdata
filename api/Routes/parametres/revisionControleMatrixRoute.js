const express = require('express');
const router = express.Router();
const revisionControleMatrixController = require('../../Controllers/parametres/revisionControleMatrixController');
const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

// Récupérer toutes les matrices de contrôle
router.get('/', revisionControleMatrixController.getControleMatrices);

// Ajouter ou mettre à jour une matrice de contrôle
router.post('/', verifyJWT, verifyPermission('ADD'), revisionControleMatrixController.addOrUpdateControleMatrix);

// Mettre à jour la validation d'une matrice de contrôle
router.put('/:id/validation', verifyJWT, verifyPermission('UPDATE'), revisionControleMatrixController.updateValidation);

// Supprimer une matrice de contrôle
router.delete('/:id', verifyJWT, verifyPermission('DELETE'), revisionControleMatrixController.deleteControleMatrix);

module.exports = router;