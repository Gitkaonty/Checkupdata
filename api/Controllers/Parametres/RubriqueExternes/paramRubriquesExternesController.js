const db = require("../../../Models");
const { Sequelize, Op } = require("sequelize");
const rubriquesExternes = db.rubriquesExternes;
const compteRubriquesExternes = db.compteRubriquesExternes;
const compteRubriquesExternesMatrices = db.compteRubriquesExternesMatrices;

exports.getRubriquesExternes = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;

        if (!id_compte) return res.status(400).json({ state: false, message: 'Id_compte non trouvé' });
        if (!id_dossier) return res.status(400).json({ state: false, message: 'Id_dossier non trouvé' });
        if (!id_exercice) return res.status(400).json({ state: false, message: 'Id_exercice non trouvé' });

        const rubriquesExternesData = await db.sequelize.query(`
            SELECT 
                id,
                id_rubrique,
                id_compte,
                id_dossier,
                id_exercice,
                id_etat,
                libelle,
                type,
                ordre,
                active, 
                par_default
            FROM rubriquesexternes
            WHERE id_compte = :id_compte
                AND id_dossier = :id_dossier
                AND id_exercice = :id_exercice
            ORDER BY ordre ASC
    `, {
            replacements: { id_compte, id_dossier, id_exercice },
            type: db.sequelize.QueryTypes.SELECT
        });

        const regrouped = rubriquesExternesData.reduce((acc, r) => {
            const etat = r.id_etat;
            if (!acc[etat]) acc[etat] = [];
            acc[etat].push({
                ...r,
                id: Number(r.id),
                id_compte: Number(r.id_compte),
                id_dossier: Number(r.id_dossier),
                id_exercice: Number(r.id_exercice)
            });
            return acc;
        }, {
            BILAN_ACTIF: [],
            BILAN_PASSIF: [],
            CRN: [],
            CRF: [],
            TFTD: [],
            TFTI: [],
            SIG: []
        });

        return res.json({
            liste: regrouped,
            state: true,
            message: "Récupéré avec succès"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.addRubriquesExternes = async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) {
            return res.status(400).json({
                state: false,
                message: "Données manquant"
            });
        }
        const { id_rubrique, id_compte, id_dossier, id_exercice } = formData;
        const isExistingRubrique = await rubriquesExternes.findOne({
            where: {
                id_rubrique,
                id_compte,
                id_dossier,
                id_exercice
            }
        })
        if (isExistingRubrique) {
            return res.status(200).json({
                state: false,
                message: `Cette combinaison de rubrique, compte, dossier et exercice existe déjà`
            });
        }
        await rubriquesExternes.create(formData);
        return res.status(200).json({
            state: true,
            message: `Rubrique ajouté avec succès`
        });
    } catch (error) {
        console.error(error);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(200).json({
                state: false,
                message: 'Cette combinaison de rubrique, compte, dossier et exercice existe déjà'
            });
        }
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.updateRubriquesExternes = async (req, res) => {
    try {
        const { id } = req.params;
        const formData = req.body;
        const { ordre: newOrdre } = formData;

        if (!formData || !id) {
            return res.status(400).json({
                state: false,
                message: "Données manquantes"
            });
        }

        const rubrique = await rubriquesExternes.findByPk(id);

        if (!rubrique) {
            return res.status(404).json({
                state: false,
                message: "Rubrique Externe non trouvée"
            });
        }

        const oldOrdre = rubrique.ordre;
        if (newOrdre !== undefined && newOrdre !== oldOrdre) {
            if (oldOrdre < newOrdre) {
                const rubriques = await rubriquesExternes.findAll({
                    where: {
                        id_compte: rubrique.id_compte,
                        id_dossier: rubrique.id_dossier,
                        id_exercice: rubrique.id_exercice,
                        ordre: {
                            [Sequelize.Op.gte]: oldOrdre
                        }
                    },
                    order: [['ordre', 'ASC']]
                });

                await Promise.all(rubriques
                    .filter(r => r.id !== rubrique.id)
                    .map((r, i) => {
                        r.ordre = newOrdre + 1 + i;
                        return r.save();
                    })
                );
            } else {
                return res.status(200).json({
                    state: false,
                    message: "Veuillez saisir une ordre suppérieur à l'ancien",
                });
            }

            rubrique.ordre = newOrdre;
        }

        rubrique.ordre = newOrdre ?? rubrique.ordre;
        rubrique.libelle = formData.libelle ?? rubrique.libelle;
        rubrique.type = formData.type ?? rubrique.type;
        rubrique.id_rubrique = formData.id_rubrique ?? rubrique.id_rubrique;
        rubrique.id_compte = formData.id_compte ?? rubrique.id_compte;
        rubrique.id_etat = formData.id_etat ?? rubrique.id_etat;

        await rubrique.save()

        return res.status(200).json({
            state: true,
            message: "Rubrique mise à jour avec succès",
            data: rubrique
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.deleteRubriquesExternes = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                state: false,
                message: "Id manquante"
            });
        }
        const rubrique = await rubriquesExternes.findByPk(id);

        if (!rubrique) {
            return res.status(404).json({
                state: false,
                message: "Rubrique Externe non trouvée"
            });
        }

        const id_dossier = rubrique.id_dossier;
        const id_exercice = rubrique.id_exercice;
        const id_compte = rubrique.id_compte;
        const id_rubrique = rubrique.id_rubrique || "";

        await rubrique.destroy();
        await compteRubriquesExternes.destroy({
            where: {
                id_dossier,
                id_compte,
                id_exercice,
                id_rubrique
            }
        })
        return res.status(200).json({
            state: true,
            message: "Rubrique supprimé avec succès",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.addOrUpdateRubriqueExterne = async (req, res) => {
    try {
        const { compteId, exerciceId, fileId, idExterne, id_etat, id_rubrique, libelle, ordre, type, subtable, active, par_default } = req.body;
        const newOrdre = Number(ordre);

        let resData = {
            state: false,
            msg: 'Une erreur est survenue au moment du traitement.',
        }

        const testIfExist = await rubriquesExternes.findAll({
            where: {
                id: idExterne,
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId
            }
        });

        if (testIfExist.length === 0) {
            const isExistingRubrique = await rubriquesExternes.findOne({
                where: {
                    id_rubrique,
                    id_etat,
                    subtable,
                    id_compte: compteId,
                    id_dossier: fileId,
                    id_exercice: exerciceId
                }
            })

            if (isExistingRubrique) {
                return res.status(200).json({
                    state: false,
                    msg: `Cette Rubrique existe déjà dans ${id_etat}`
                });
            }
            const addRubriqueExterne = await rubriquesExternes.create({
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId,
                id_etat: id_etat,
                id_rubrique: id_rubrique,
                libelle: libelle,
                ordre: ordre,
                type: type,
                subtable: subtable,
                active: active,
                par_default: par_default
            });

            if (addRubriqueExterne) {
                resData.state = true;
                resData.msg = "Nouvelle ligne sauvegardée avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        } else {
            const rubrique = await rubriquesExternes.findByPk(idExterne);

            if (!rubrique) {
                return res.status(404).json({
                    state: false,
                    message: "Rubrique Externe non trouvée"
                });
            }

            const oldOrdre = rubrique.ordre;
            if (newOrdre !== undefined && newOrdre !== oldOrdre) {
                if (oldOrdre < newOrdre) {
                    const rubriques = await rubriquesExternes.findAll({
                        where: {
                            id_compte: rubrique.id_compte,
                            id_dossier: rubrique.id_dossier,
                            id_exercice: rubrique.id_exercice,
                            id_etat,
                            subtable,
                            ordre: {
                                [Sequelize.Op.gte]: oldOrdre
                            }
                        },
                        order: [['ordre', 'ASC']]
                    });

                    await Promise.all(rubriques
                        .filter(r => r.id !== rubrique.id)
                        .map((r, i) => {
                            r.ordre = newOrdre + 1 + i;
                            return r.save();
                        })
                    );
                } else {
                    const rubriques = await rubriquesExternes.findAll({
                        where: {
                            id_compte: rubrique.id_compte,
                            id_dossier: rubrique.id_dossier,
                            id_exercice: rubrique.id_exercice,
                            id_etat,
                            subtable,
                            ordre: {
                                [Sequelize.Op.lte]: oldOrdre,
                                [Sequelize.Op.gte]: newOrdre
                            }
                        },
                        order: [['ordre', 'DESC']]
                    });

                    for (let r of rubriques) {
                        if (r.id !== rubrique.id) {
                            r.ordre += 1;
                            await r.save();
                        }
                    }
                }

                rubrique.ordre = newOrdre;
            }

            rubrique.libelle = libelle;
            rubrique.type = type;
            rubrique.id_rubrique = id_rubrique;
            rubrique.id_etat = id_etat;
            rubrique.active = active;
            rubrique.par_default = par_default;

            const updatedRubriqueExterne = await rubrique.save();
            if (updatedRubriqueExterne) {
                resData.state = true;
                resData.msg = "Modification effectuée avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        }

        return res.json(resData);

    } catch (error) {
        console.error(error);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(200).json({
                state: false,
                message: 'Cette combinaison de rubrique, compte, dossier et exercice existe déjà'
            });
        }
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.getCompteRubriqueExterne = async (req, res) => {
    try {
        const { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId } = req.body;

        const resData = {
            state: false,
            msg: 'Données récupérées avec succès',
            liste: []
        };

        if (!rubriqueId) {
            resData.state = true;
            return res.json(resData);
        }

        const liste = await db.sequelize.query(`
            SELECT *
            FROM compterubriqueexternes
            WHERE id_compte = :compteId
                AND id_dossier = :fileId
                AND id_exercice = :exerciceId
                AND id_etat = :tableau
                AND nature = :choixPoste
                AND id_rubrique = :rubriqueId
            ORDER BY compte ASC
    `, {
            replacements: { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId },
            type: db.sequelize.QueryTypes.SELECT
        });

        resData.state = true;
        resData.liste = liste;

        return res.json(resData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.deleteCompteRubriqueExterne = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                state: false,
                message: "Id manquante"
            });
        }
        const compteRubrique = await compteRubriquesExternes.findByPk(id);
        if (!compteRubrique) {
            return res.status(404).json({
                state: false,
                message: "Rubrique externe non trouvée"
            });
        }
        await compteRubrique.destroy();
        return res.status(200).json({
            state: true,
            message: "Compte rubrique supprimé avec succès",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.addOrUpdateCompteRubriqueExterne = async (req, res) => {
    try {
        const { idParam, compteId, fileId, exerciceId, id_etat, tableau, rubriqueId, nature, compte, senscalcul, condition, equation, par_default, active } = req.body;

        let resData = {
            state: false,
            msg: 'Une erreur est survenue au moment du traitement.',
        }

        const testIfExist = await compteRubriquesExternes.findAll({
            where: {
                id: idParam,
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId,
                compte: compte,
            }
        });

        if (testIfExist.length === 0) {
            const addParam = await compteRubriquesExternes.create({
                id_compte: compteId,
                id_dossier: fileId,
                id_exercice: exerciceId,
                id_etat: id_etat,
                tableau: tableau,
                id_rubrique: rubriqueId,
                compte: compte,
                nature: nature,
                senscalcul: senscalcul,
                condition: condition,
                equation: equation,
                par_default: par_default,
                active: active
            });

            if (addParam) {
                resData.state = true;
                resData.msg = "Nouvelle ligne sauvegardée avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        } else {
            const ModifyParam = await compteRubriquesExternes.update(
                {
                    id_compte: compteId,
                    id_dossier: fileId,
                    id_exercice: exerciceId,
                    id_etat: id_etat,
                    tableau: tableau,
                    id_rubrique: rubriqueId,
                    compte: compte,
                    nature: nature,
                    senscalcul: senscalcul,
                    condition: condition,
                    equation: equation,
                    par_default: par_default,
                    active: active
                },
                {
                    where: { id: idParam }
                }
            );

            if (ModifyParam) {
                resData.state = true;
                resData.msg = "Modification effectuée avec succès.";
            } else {
                resData.state = false;
                resData.msg = "Une erreur est survenue au moment du traitement des données";
            }
        }
        return res.json(resData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.restaureDefaultParameter = async (req, res) => {
    const { id_dossier, id_compte, id_exercice, id_etat } = req.body;

    const resData = {
        state: false,
        msg: 'Une erreur est survenue',
    };

    try {
        await db.sequelize.transaction(async (t) => {
            await db.sequelize.query(`
                UPDATE compterubriqueexternes
                SET active = false
                WHERE id_dossier = :id_dossier
                    AND id_compte = :id_compte
                    AND id_exercice = :id_exercice
                    AND id_etat = :id_etat
                    AND par_default = false
            `, {
                replacements: { id_dossier, id_compte, id_exercice, id_etat },
                transaction: t
            });

            await db.sequelize.query(`
                UPDATE compterubriqueexternes
                SET active = true
                WHERE id_dossier = :id_dossier
                    AND id_compte = :id_compte
                    AND id_exercice = :id_exercice
                    AND id_etat = :id_etat
                    AND par_default = true
            `, {
                replacements: { id_dossier, id_compte, id_exercice, id_etat },
                transaction: t
            });
        });

        resData.state = true;
        resData.msg = "Restauration paramétrages terminée avec succès";
        return res.json(resData);

    } catch (error) {
        console.error(error);
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données.";
        return res.status(500).json(resData);
    }
};

exports.updateDefaultParameter = async (req, res) => {
    const { id_dossier, id_compte, id_exercice, id_etat } = req.body;

    const resData = {
        state: false,
        msg: 'Une erreur est survenue'
    };

    try {
        await db.sequelize.transaction(async (t) => {
            await db.sequelize.query(`
                DELETE FROM compterubriqueexternes
                WHERE id_compte = :id_compte
                    AND id_dossier = :id_dossier
                    AND id_exercice = :id_exercice
                    AND id_etat = :id_etat
                    AND par_default = true
      `, {
                replacements: { id_compte, id_dossier, id_exercice, id_etat },
                transaction: t
            });

            await db.sequelize.query(`
                INSERT INTO compterubriqueexternes (
                    id_compte,
                    id_dossier,
                    id_exercice,
                    id_etat,
                    id_rubrique,
                    tableau,
                    compte,
                    nature,
                    senscalcul,
                    condition,
                    equation,
                    par_default,
                    active,
                    "createdAt",
                    "updatedAt"
                )
                SELECT
                    :id_compte,
                    :id_dossier,
                    :id_exercice,
                    CASE WHEN :id_etat = 'BILAN' THEN id_etat ELSE :id_etat END,
                    id_rubrique,
                    tableau,
                    compte,
                    nature,
                    senscalcul,
                    condition,
                    equation,
                    true,
                    true,
                    NOW(),
                    NOW()
                FROM compterubriqueexternesmatrices
                WHERE (:id_etat != 'BILAN' AND id_etat = :id_etat)
                OR (:id_etat = 'BILAN' AND id_etat IN ('BILAN_ACTIF', 'BILAN_PASSIF'))
      `, {
                replacements: { id_compte, id_dossier, id_exercice, id_etat },
                transaction: t
            });
        });

        resData.state = true;
        resData.msg = "Mise à jour des paramétrages terminée avec succès";
        return res.json(resData);

    } catch (error) {
        console.error(error);
        resData.state = false;
        resData.msg = "Une erreur est survenue au moment du traitement des données.";
        return res.status(500).json(resData);
    }
};