const express = require('express');
const router = express.Router();
const commentaireAnalytiqueMensuelleController = require('../../Controllers/dashboard/commentaireAnalytiqueMensuelleController');
const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

router.post('/addOrUpdate', verifyJWT, verifyPermission('ADD', 'EDIT'), commentaireAnalytiqueMensuelleController.addOrUpdateCommentaireMensuelle);
router.get('/get/:id_compte/:id_exercice/:id_dossier/:compte', commentaireAnalytiqueMensuelleController.getCommentaireMensuelleByCompte);

module.exports = router;
