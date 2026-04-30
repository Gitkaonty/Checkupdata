const express = require('express');
const router = express.Router();
const deviseController = require('../../../Controllers/parametres/devises/deviseController');

const verifyJWT = require('../../../Middlewares/verifyJWT');
const verifyPermission = require('../../../Middlewares/verifyPermission');

router.get('/compte/:id_compte/:id_dossier', deviseController.getAllDevises); // id = id du compte

router.get('/:id', deviseController.getDeviseById);

router.post('/', verifyJWT, verifyPermission('ADD', 'EDIT'), deviseController.createDevise);

router.put('/:id', deviseController.updateDevise);

router.delete('/:id', verifyJWT, verifyPermission('DELETE'), deviseController.deleteDevise);

module.exports = router;
