const db = require("../../Models");
const { QueryTypes } = require('sequelize');

// Requête SQL pour la situation des membres (commune aux calculs)
const querySituation = `
    SELECT 
        m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
        u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe
    FROM membresidentites m
    LEFT JOIN membres_updates u ON u.id = (
        SELECT id FROM membres_updates 
        WHERE membre_id = m.id AND date_modification <= :dateFin
        ORDER BY date_modification DESC, id DESC LIMIT 1
    )
    ORDER BY m.nom ASC
`;

// 1. RÉCUPÉRER LES APPELS EXISTANTS
exports.getAppelsByExercice = async (req, res) => {
    const { exerciceId } = req.params;
    try {
        // Récupération directe de la table sans aucune jointure
        const appels = await db.appels.findAll({
            where: { exercice_id: exerciceId },
            include: [{
                model: db.membres,
                as: 'membre', // Doit correspondre à l'alias défini dans l'association
                attributes: ['matricule', 'nom', 'prenom'] // On ne récupère que le nécessaire
            }],
            order: [['id', 'ASC']]
        });

        // On renvoie les données telles quelles (ou presque) au DataGrid
        const formatted = appels.map(a => {
        // 1. On récupère l'objet membre extrait par la jointure
        // Sequelize le met souvent dans dataValues ou directement sur 'a'
        const infoMembre = a.membre || {}; 

        return {
            // --- DONNÉES À LA RACINE (pour le DataGrid) ---
            id: a.id,
            exercice_id: a.exercice_id,
            membre_id: a.membre_id,
            
            // On va chercher dans l'objet joint et on le remonte à la racine
            matricule: infoMembre.matricule || 'N/A',
            nom: infoMembre.nom || 'Inconnu',
            prenom: infoMembre.prenom || '',
            
            // Données de situation (pour l'instant null d'après ton log)
            section: a.section || '-',
            statut: a.statut || '-',
            titre: a.titre || '-',
            associe: a.associe,
            montant: parseFloat(a.montant_du) || 0,
            total_ajustement: parseFloat(a.total_ajustement) || 0,
            appelnet: parseFloat(a.appelnet) || 0,
            regime: a.regime,
            valide: a.valide
        };
    });

        res.json(formatted);
    } catch (error) {
        console.error("ERREUR GET APPELS:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. GÉNÉRER ET ENREGISTRER (Remplace generateAppelsBrouillon)
exports.generateAppelsBrouillon = async (req, res) => {
    const { exerciceId } = req.body;
    const transaction = await db.sequelize.transaction();
    try {
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) throw new Error("Exercice non trouvé");

        // Supprimer les brouillons existants pour cet exercice
        await db.appels.destroy({ where: { exercice_id: exerciceId }, transaction });

        const querySituationAppel = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin AND membre_active = 'Oui'
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            ORDER BY m.nom ASC
        `;

        const members = await db.sequelize.query(querySituationAppel, {
            replacements: { dateFin: exercice.date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        // On récupère les sommes groupées par membre
        const ajustementsGroupes = await db.ajustementappels.findAll({
            attributes: [
                'membre_id',
                [db.sequelize.fn('SUM', db.sequelize.col('montant_ajustement')), 'total_somme']
            ],
            where: { exercice_id: exerciceId },
            group: ['membre_id'],
            raw: true // Pour obtenir un objet JS simple
        });

        const grille = await db.grille_tarifaires.findAll({
            where: { exercice_id: exerciceId }
        });
        const dateDebutEx = new Date(exercice.date_debut);
        const dateFinEx = new Date(exercice.date_fin);

        const records = members.map(m => {
            let montant = 0;
            let regime = 0; 
            let aMin = 0;
            let aMax = 0;

            if (m.section === "Société Expert") {
                const nbr = m.nombre_associe || 0;
                const tarifMatch = grille.find(t => 
                    t.section === "Société Expert" && nbr >= t.nbr_associes_min && nbr <= t.nbr_associes_max
                );

                montant = tarifMatch ? tarifMatch.montant : 0;
                // On garde trace des bornes de la grille pour cette société
                aMin = tarifMatch ? tarifMatch.associe_min : 0;
                aMax = tarifMatch ? tarifMatch.associe_max : 0;
                regime = 0;
            } else {
                const dateAdhesion = new Date(m.date_adhesion);
                if (dateAdhesion >= dateDebutEx && dateAdhesion <= dateFinEx) regime = 1;
                const tarifMatch = grille.find(t => 
                    t.section === m.section && t.titre === m.titre && t.statut === m.statut && t.regime === regime
                );
                montant = tarifMatch ? tarifMatch.montant : 0;
            }

            // On cherche si notre membre actuel a un total dans les ajustements récupérés
            const ligneAjust = ajustementsGroupes.find(a => a.membre_id === m.id);
            const totalAjustement = ligneAjust ? parseFloat(ligneAjust.total_somme) : 0;
            const appelNet = parseFloat(montant) + totalAjustement;

            // --- Retourne l'objet complet pour l'insertion ---
            return {
                exercice_id: exerciceId,
                membre_id: m.id,
                
                // Champs de situation figés au moment du calcul
                section: m.section,
                titre: m.titre,
                statut: m.statut,
                associe: m.nombre_associe,
                montant_du: montant,
                total_ajustement: totalAjustement,
                appelnet: appelNet,
                regime: regime,
                valide: false,
                etat: 'En attente'
            };
        });

        await db.appels.bulkCreate(records, { transaction });
        await transaction.commit();
        res.json({ message: "Génération réussie" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Erreur génération :", error);
        res.status(500).json({ message: error.message });
    }
};

// Exemple de logique Back (cotisation.controller.js)
exports.generateAppelsManuels = async (req, res) => {
    const { exerciceId, section, titre, statut, membre } = req.body;
    const transaction = await db.sequelize.transaction();

    try {
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) throw new Error("Exercice non trouvé");

        const querySituationAppel = `
            SELECT 
                m.id, m.matricule, m.nom, m.prenom, m.date_adhesion,
                u.membre_active, u.situation, u.section, u.statut, u.titre, u.nombre_associe
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin AND membre_active = 'Oui'
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            ORDER BY m.nom ASC
        `;

        // 1. Récupérer la situation de tous les membres
        const allMembers = await db.sequelize.query(querySituationAppel, {
            replacements: { dateFin: exercice.date_fin },
            type: db.sequelize.QueryTypes.SELECT
        });

        // 2. Appliquer les filtres
        const filteredMembers = allMembers.filter(m => {
            const matchSection = section === 'Toutes' || m.section === section;
            const matchTitre = titre === 'Toutes' || m.titre === titre;
            const matchStatut = statut === 'Toutes' || m.statut === statut;
            const matchMembre = membre === 'Tous' || m.id === parseInt(membre);
            return matchSection && matchTitre && matchStatut && matchMembre;
        });

        if (filteredMembers.length === 0) {
            throw new Error("Aucun membre ne correspond à ces filtres");
        }

        // 3. Identifier ceux qui ont déjà un appel
        const memberIds = filteredMembers.map(m => m.id);
        const existingAppels = await db.appels.findAll({
            where: { 
                exercice_id: exerciceId,
                membre_id: memberIds 
            },
            attributes: ['membre_id'],
            raw: true
        });

        const existingMemberIds = existingAppels.map(a => a.membre_id);

        // 4. Filtrer pour ne garder QUE ceux qui n'existent pas encore
        const membersToCreate = filteredMembers.filter(m => !existingMemberIds.includes(m.id));

        // Si tout le monde existe déjà, on informe l'utilisateur proprement (pas une erreur brute)
        if (membersToCreate.length === 0) {
            await transaction.rollback();
            return res.json({ 
                success: true, 
                message: "Tous les membres sélectionnés possèdent déjà un appel. Aucune modification n'a été faite." 
            });
        }

        // On récupère les sommes groupées par membre
        const ajustementsGroupes = await db.ajustementappels.findAll({
            attributes: [
                'membre_id',
                [db.sequelize.fn('SUM', db.sequelize.col('montant_ajustement')), 'total_somme']
            ],
            where: { exercice_id: exerciceId },
            group: ['membre_id'],
            raw: true // Pour obtenir un objet JS simple
        });

        const grille = await db.grille_tarifaires.findAll({
            where: { exercice_id: exerciceId }
        });
        const dateDebutEx = new Date(exercice.date_debut);
        const dateFinEx = new Date(exercice.date_fin);

        // 5. Préparer les nouveaux enregistrements
        const records = membersToCreate.map(m => {
            let montant = 0;
            let regime = 0; 

            if (m.section === "Société Expert") {
                const nbr = m.nombre_associe || 0;
                const tarifMatch = grille.find(t => 
                    t.section === "Société Expert" && nbr >= t.nbr_associes_min && nbr <= t.nbr_associes_max
                );

                montant = tarifMatch ? tarifMatch.montant : 0;
            } else {
                const dateAdhesion = new Date(m.date_adhesion);
                if (dateAdhesion >= dateDebutEx && dateAdhesion <= dateFinEx) regime = 1;
                const tarifMatch = grille.find(t => 
                    t.section === m.section && t.titre === m.titre && t.statut === m.statut && t.regime === regime
                );
                montant = tarifMatch ? tarifMatch.montant : 0;
            }

            // On cherche si notre membre actuel a un total dans les ajustements récupérés
            const ligneAjust = ajustementsGroupes.find(a => a.membre_id === m.id);
            const totalAjustement = ligneAjust ? parseFloat(ligneAjust.total_somme) : 0;
            const appelNet = montant + totalAjustement;

            return {
                exercice_id: exerciceId,
                membre_id: m.id,
                section: m.section,
                titre: m.titre,
                statut: m.statut,
                associe: m.nombre_associe,
                montant_du: montant,
                total_ajustement: totalAjustement,
                appelnet: appelNet,
                regime: regime,
                valide: false,
                etat: 'En attente'
            };
        });

        // 6. Insertion
        await db.appels.bulkCreate(records, { transaction });
        await transaction.commit();
        
        // Message de succès détaillé
        let msg = `${records.length} nouvel/nouveaux appel(s) généré(s).`;
        if (existingMemberIds.length > 0) {
            msg += ` (${existingMemberIds.length} membres déjà présents ont été ignorés).`;
        }

        res.json({ message: msg });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Erreur génération manuelle :", error);
        res.status(500).json({ message: error.message });
    }
};

// 3. VALIDER LES APPELS (non utilisé)
exports.validerAppels = async (req, res) => {
    const { ids } = req.body; // Un tableau d'IDs [1, 2, 3...]
    try {
        await db.appels.update({ valide: true }, { where: { id: ids } });
        res.json({ message: "Appels validés" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. VALIDER LES APPELS
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { valide, type } = req.body;
    
    if(type === 'appels'){
        await db.appels.update({ valide }, { where: { id } });
        res.sendStatus(200);
    }else{
        await db.ajustementappels.update({ valide }, { where: { id } });
        res.sendStatus(200);
    }
    
  } catch (err) {
    res.status(500).json(err);
  }
};

// 3. VALIDER PLUSIEURS APPELS
exports.validerPlusieurs = async (req, res) => {
  const { ids } = req.body; // [1, 2, 5, ...]
  try {
    await db.appels.update(
      { valide: true }, 
      { where: { id: ids } } // Sequelize gère nativement le tableau d'IDs ici
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Supprimer un appel spécifique par son ID
exports.deleteAppel = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await db.appels.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(200).json({ message: "Appel supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Appel non trouvé" });
        }
    } catch (error) {
        console.error("Erreur suppression appel:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};




//===================================================================================================================
//CODE POUR APPEL
//===================================================================================================================



// Génération des ajustements avec montant forfaitaire et filtres
exports.generateAjustements = async (req, res) => {
    const { exerciceId, montant, section, titre, statut, membre } = req.body;
    const transaction = await db.sequelize.transaction();

    try {
        // 1. Récupérer l'exercice pour avoir la date de fin
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) {
            return res.status(404).json({ message: "Exercice non trouvé" });
        }

        // Supprimer les brouillons existants pour cet exercice
        //await db.ajustementappels.destroy({ where: { exercice_id: exerciceId } });

        // 2. Exécuter ta requête SQL brute de situation
        // On utilise QueryTypes.SELECT pour avoir un tableau d'objets propre
        const situationMembres = await db.sequelize.query(`
            SELECT 
                m.id, m.matricule, m.nom, m.prenom,
                u.section, u.statut, u.titre
            FROM membresidentites m
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            ORDER BY m.nom ASC
        `, {
            replacements: { dateFin: exercice.date_fin },
            type: QueryTypes.SELECT
        });

        // 3. Filtrage JS (Simple et efficace)
        const membresFiltrés = situationMembres.filter(m => {
            const matchSection = section === "Toutes" || m.section === section;
            const matchTitre = titre === "Toutes" || m.titre === titre;
            const matchStatut = statut === "Toutes" || m.statut === statut;
            const matchMembre = membre === "Tous" || m.id === membre;
            return matchSection && matchTitre && matchStatut && matchMembre;
        });

        if (membresFiltrés.length === 0) {
            return res.status(400).json({ message: "Aucun membre ne correspond aux filtres." });
        }

        // 4. Préparer les objets pour l'insertion
        const dataAInserer = membresFiltrés.map(m => ({
            exercice_id: exerciceId, // vérifie si c'est exerciceId ou exercice_id dans ta base
            membre_id: m.id,
            // matricule: m.matricule,
            // nom: m.nom,
            // prenom: m.prenom,
            motif: m.motif || "n/a",
            section: m.section || "n/a",
            statut: m.statut || "n/a",
            titre: m.titre || "n/a",
            montant_ajustement: parseFloat(montant),
            valide: false,
            type_ajustement: "AJUSTEMENT",
            // createdAt: new Date(),
            // updatedAt: new Date()
        }));

        // 5. Insertion en masse avec Sequelize
        await db.ajustementappels.bulkCreate(dataAInserer);

        res.json({ 
            message: `${membresFiltrés.length} ajustements générés.` 
        });

    } catch (error) {
        console.error("Erreur Backend:", error);
        res.status(500).json({ message: "Erreur serveur lors de la génération." });
    }
};

exports.getAjustementsByExercice = async (req, res) => {
    const { exerciceId } = req.params; // Récupéré depuis l'URL /ajustements/:exerciceId

    try {
        // 1. On récupère d'abord l'exercice pour avoir la date de fin (pour la situation)
        const exercice = await db.exercices.findByPk(exerciceId);
        if (!exercice) return res.status(404).json({ message: "Exercice non trouvé" });

        // 2. On exécute la requête SQL pour récupérer les ajustements combinés aux infos membres
        // On joint 'ajustementappels' avec ta logique de situation
        const ajustements = await db.sequelize.query(`
            SELECT 
                a.id, a.exercice_id, a.membre_id, a.montant_ajustement, a.valide, a.type_ajustement,
                m.matricule, m.nom, m.prenom,
                u.section, u.statut, u.titre
            FROM ajustementappels a
            INNER JOIN membresidentites m ON a.membre_id = m.id
            LEFT JOIN membres_updates u ON u.id = (
                SELECT id FROM membres_updates 
                WHERE membre_id = m.id AND date_modification <= :dateFin
                ORDER BY date_modification DESC, id DESC LIMIT 1
            )
            WHERE a.exercice_id = :exerciceId
            ORDER BY m.nom ASC
        `, {
            replacements: { 
                dateFin: exercice.date_fin,
                exerciceId: exerciceId 
            },
            type: QueryTypes.SELECT
        });

        // 3. Renvoi des données au Front (DataGrid)
        res.json(ajustements);

    } catch (error) {
        console.error("Erreur récupération ajustements:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des données." });
    }
};

// 3. VALIDER PLUSIEURS APPELS
exports.validerPlusieursAjustements = async (req, res) => {
  const { ids } = req.body; // [1, 2, 5, ...]
  try {
    await db.ajustementappels.update(
      { valide: true }, 
      { where: { id: ids } } // Sequelize gère nativement le tableau d'IDs ici
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Supprimer un appel spécifique par son ID
exports.deleteAjustement = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await db.ajustementappels.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(200).json({ message: "Ajustement supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Ajustement non trouvé" });
        }
    } catch (error) {
        console.error("Erreur suppression Ajustement:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};