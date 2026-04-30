const express = require('express');
const router = express.Router();
const ecrituresSuspenseController = require('../../Controllers/administration/ecrituresSuspenseController');
const verifyJWT = require('../../Middlewares/verifyJWT');

router.use(verifyJWT);

router.get('/:id_compte/:id_dossier/:id_exercice', ecrituresSuspenseController.getLignes);

module.exports = router;
