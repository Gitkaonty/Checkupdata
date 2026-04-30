const express = require('express');
const router = express.Router();
const revisionController = require('../../Controllers/revision/revisionController');
const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

// Routes pour les révisions
// Routes spécifiques AVANT les routes génériques
router.get('/cycles', verifyJWT, revisionController.getRevisionCycles);
router.get('/cycles/:cycle/items', verifyJWT, revisionController.getRevisionItemsByCycle);

// Routes génériques APRÈS
router.post('/', verifyJWT, verifyPermission('ADD', 'EDIT'), revisionController.addOrUpdateRevision);
router.get('/:id_compte/:id_dossier/:id_exercice', verifyJWT, revisionController.getRevisions);
router.put('/:id', verifyJWT, verifyPermission('ADD', 'EDIT'), revisionController.updateRevisionStatus);
router.delete('/:id', verifyJWT, verifyPermission('DELETE'), revisionController.deleteRevision);

module.exports = router;
