const db = require("../../Models");
require('dotenv').config();

const exercices = db.exercices;

const recupInfos = async (id_compte, id_dossier, id_exerciceN) => {
    try {
        const currentExercice = await exercices.findByPk(id_exerciceN);

        const currentDebutExerciceN = currentExercice?.date_debut;

        if (!currentDebutExerciceN) {
            return { id_exerciceN1: null };
        }

        const dateDebut = new Date(currentDebutExerciceN);
        dateDebut.setDate(dateDebut.getDate() - 1);

        const dateFinN1Formatted = dateDebut.toISOString().split('T')[0];

        const rows = await db.sequelize.query(`
            SELECT id
            FROM exercices
            WHERE
                id_compte = :id_compte
                AND id_dossier = :id_dossier
                AND date_fin = :date_fin
        `, {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, date_fin: new Date(dateFinN1Formatted) }
        })

        const id_exerciceN1 = rows[0]?.id || null;

        return { id_exerciceN1 }

    } catch (error) {
        console.log(error);

        return {
            id_exerciceN1: 0,
            date_debutN1: null,
            date_finN1: null,
            libelleExerciceN1: '',
            rangN1: '',
            clotureN1: null
        };
    }
}

module.exports = { recupInfos }