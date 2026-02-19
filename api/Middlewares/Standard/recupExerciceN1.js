const db = require("../../Models");
require('dotenv').config();
const { Op } = require('sequelize');

const exercices = db.exercices;

const recupInfos = async (id_compte, id_dossier, id_exerciceN) => {
    try {
        const currentExercice = await exercices.findByPk(id_exerciceN);

        const currentDebutExerciceN = currentExercice?.date_debut;

        if (!currentDebutExerciceN) {
            return { id_exerciceN1: null };
        }

        // Calcul date N-1
        const dateDebut = new Date(currentDebutExerciceN);
        dateDebut.setDate(dateDebut.getDate() - 1);

        const dateFinN1Formatted = dateDebut.toISOString().split('T')[0];

        // Chercher l'exercice N-1
        const n1Exercice = await exercices.findOne({
            where: {
                id_compte: Number(id_compte),
                id_dossier: Number(id_dossier),
                date_fin: { [Op.eq]: new Date(dateFinN1Formatted) }
            }
        });

        const id_exerciceN1 = n1Exercice?.id || null;

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