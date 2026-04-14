const db = require("../../Models");
const { QueryTypes } = require('sequelize');
const membre = db.membres;
const paiement = db.paiements;

// Charger la liste pour le DataGrid
exports.findAllPaiements = async (req, res) => {
    const ex_id = req.query.exerciceId;

    try {
        const data = await paiement.findAll({
            where: { exercice_id: ex_id },
            include: [{
                model: membre,
                as: 'membre', // Assure-toi que l'association est définie dans ton index models
                attributes: ['matricule', 'nom', 'prenom']
            }],
            order: [['date_paiement', 'DESC']]
        });

        // On formate un peu pour que le DataGrid reçoive des lignes simples
        const rows = data.map(p => ({
            id: p.id,
            matricule: p.membre?.matricule,
            nom: p.membre?.nom,
            prenom: p.membre?.prenom,
            anouveau: parseFloat(p.anouveau),
            cotisation: parseFloat(p.cotis_annee),
            autre: parseFloat(p.autre_appel),
            // Le total est calculé ici pour le front
            total: parseFloat(p.anouveau) + parseFloat(p.cotis_annee) + parseFloat(p.autre_appel),
            date: p.date_paiement,
            mode: p.mode_reglement,
            reference: p.reference,
            created_at: p.createdAt || p.created_at,
            valide: p.valide
        }));

        res.send(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Enregistrer un nouveau paiement
exports.createPaiement = async (req, res) => {
    try {
        const { 
            membreId, 
            exerciceId, 
            date, 
            payeAnouveau, 
            payeCotisation, 
            payeAutre, 
            mode, 
            reference 
        } = req.body;

        const nouveauPaiement = await paiement.create({
            membre_id: membreId,
            exercice_id: exerciceId,
            date_paiement: date,
            anouveau: payeAnouveau || 0,
            cotis_annee: payeCotisation || 0,
            autre_appel: payeAutre || 0,
            mode_reglement: mode,
            reference: reference,
            valide:false
        });

        res.status(201).send(nouveauPaiement);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Erreur lors de la création du paiement."
        });
    }
};

// Validation d'un paiement
exports.validate = async (req, res) => {
    try {
        await paiement.update({ valide: true }, { where: { id: req.params.id } });
        res.send({ message: "Paiement validé avec succès." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Suppression d'un paiement
exports.delete = async (req, res) => {
    try {
        await paiement.destroy({ where: { id: req.params.id } });
        res.send({ message: "Paiement supprimé." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.unvalidate = async (req, res) => {
    try {
        const id = req.params.id;
        await paiement.update({ valide: false }, { where: { id: id } });
        res.send({ message: "Paiement dévalidé." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};