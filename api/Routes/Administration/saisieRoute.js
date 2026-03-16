const express = require('express');
const saisieController = require('../../Controllers/administration/saisieController');
const exportRapprochementsController = require('../../Controllers/administration/exportRapprochementsController');
const path = require('path');

const verifyJWT = require('../../Middlewares/verifyJWT');
const verifyPermission = require('../../Middlewares/verifyPermission');

const router = express.Router();

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', 'public');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, name + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage });

//Récuperer liste devises
//router.post('/recupBalance', exportBalanceController.recupBalance);
router.get('/recupDevise/:id', saisieController.getAllDevises);

router.post('/ajoutJournal', verifyJWT, verifyPermission('ADD'), upload.single('file'), saisieController.addJournal);

router.post('/modificationJournal', verifyJWT, verifyPermission('EDIT'), upload.single('file'), saisieController.modificationJournal);

router.delete('/deleteJournal', verifyJWT, verifyPermission('DELETE'), saisieController.deleteJournal);

// Rapprochements bancaires
router.get('/rapprochements', saisieController.listRapprochements);
router.get('/rapprochements/pcs', saisieController.listEligiblePc512);
router.get('/rapprochements/ecritures', saisieController.listEcrituresForRapprochement);
router.post('/rapprochements/ecritures/mark', saisieController.updateEcrituresRapprochement);
router.get('/rapprochements/soldes', saisieController.computeSoldesRapprochement);
router.post('/rapprochements', saisieController.createRapprochement);
router.put('/rapprochements/:id', saisieController.updateRapprochement);
router.delete('/rapprochements/:id', saisieController.deleteRapprochement);

// Immobilisations: liste des comptes de classe 2 (hors 28, 29)
router.get('/immobilisations/pcs', saisieController.listImmobilisationsPc2);

// Immobilisations: détails (details_immo)
// GET list for a selected PC (pcId is the plan comptable id), filtered by fileId, compteId, exerciceId
router.get('/immobilisations/details', saisieController.listDetailsImmo);
// CREATE a detail row
router.post('/immobilisations/details', saisieController.createDetailsImmo);
// UPDATE a detail row by id
router.put('/immobilisations/details/:id', saisieController.updateDetailsImmo);
// DELETE a detail row by id
router.delete('/immobilisations/details/:id', saisieController.deleteDetailsImmo);

// Immobilisations: lignes d'amortissement par immobilisation
router.get('/immobilisations/details/lignes', saisieController.listDetailsImmoLignes);
router.get('/immobilisations/details/lineaire/preview', saisieController.previewImmoLineaire);
router.get('/immobilisations/details/degresif/preview', saisieController.previewImmoDegressif);
router.post('/immobilisations/details/lineaire/save', saisieController.saveImmoLineaire);
router.post('/immobilisations/details/degresif/save', saisieController.saveImmoDegressif);

// Récupération du plan d'amortissement
router.post('/immobilisations/details/getPlanAmort', saisieController.getPlanAmort);

// Immobilisations: génération écritures comptables (journal Imau)
router.post('/immobilisations/ecritures/generate', saisieController.generateImmoEcritures);

// Immobilisations: annuler écritures comptables (journal Imau)
router.post('/immobilisations/ecritures/cancel', saisieController.cancelImmoEcritures);

// Immobilisations: import CSV
router.post('/importImmobilisations', verifyJWT, verifyPermission('ADD'), saisieController.importImmobilisations);

// Immobilisations: import CSV avec progression en temps réel (SSE)
router.post('/importImmobilisationsWithProgress', saisieController.importImmobilisationsWithProgress);

// Rapprochements exports
router.get('/rapprochements/export/pdf', exportRapprochementsController.exportPdf);
router.get('/rapprochements/export/excel', exportRapprochementsController.exportExcel);

// Récupération de journal avec 10 lignes d'écriture
router.get('/getJournal/:id_compte/:id_dossier/:id_exercice', saisieController.getJournal);

// Récupération de toutes les journal
router.get('/getAllJournal/:id_compte/:id_dossier/:id_exercice', saisieController.getAllJournal);

// Récupération de journal filtré
router.post('/getJournalFiltered', verifyJWT, verifyPermission('VIEW'), saisieController.getJournalFiltered);

router.post('/addLettrage', verifyJWT, verifyPermission('ADD'), saisieController.addLettrage);

router.put('/deleteLettrage', verifyJWT, verifyPermission('DELETE'), saisieController.deleteLettrage);

// Léttrage avec écart
router.post('/addEcriture', saisieController.addEcriture);

// Réaffection des lignes
router.post('/reaffecterLigne', saisieController.reaffecterLigne);

// Modification montant immo
// router.post('/updateMontantImmo', saisieController.updateMontantImmo);

// Récupération des comptes associés dans le code journals
router.post('/getCodeJournalsCompteAssocie', saisieController.getCodeJournalsCompteAssocie);

// Récupérer les lignes dans le journal avec une id_immob
router.post('/getJournalsAvecImmo', saisieController.getJournalsAvecImmo);

// Générer des écritures à nouveaux
router.post('/genererRan', saisieController.genererRan);

// Suppréssion des journaux RAN
router.post('/deleteJournalRan', saisieController.deleteJournalRan);

// Récupération des comptes pour la consultation
router.post('/getCompteConsultation', saisieController.getCompteConsultation);

// Récupération des journaux dans la consultation
router.post('/getJournalsConsultation', saisieController.getJournalsConsultation);

// Récupération des lignes dans une écritures dans le journal
router.post('/getJournalsEcriture', saisieController.getJournalsEcriture);

// Récupération des infos des comptes dans le journal qui ont des lettrage déséquilibré
router.post('/controleLettrageDesequilibre', saisieController.controleLettrageDesequilibre);

module.exports = router;