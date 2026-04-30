const db = require('../../Models');
const { Op, fn, col, where } = require('sequelize');

const journals = db.journals;
const codejournals = db.codejournals;

module.exports = {
    getLignes: async (req, res) => {
        try {
            const { id_compte, id_dossier, id_exercice } = req.params;
            const { date_debut, date_fin } = req.query;

            if (!id_compte || !id_dossier || !id_exercice) {
                return res.status(400).json({ state: false, message: 'Paramètres manquants' });
            }

            const whereClause = {
                id_compte: parseInt(id_compte),
                id_dossier: parseInt(id_dossier),
                id_exercice: parseInt(id_exercice),
                comptegen: { [Op.iLike]: '47%' }
            };

            if (date_debut || date_fin) {
                const andConditions = [];
                if (date_debut && date_fin) {
                    andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.between]: [date_debut, date_fin] }));
                } else if (date_debut) {
                    andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.gte]: date_debut }));
                } else if (date_fin) {
                    andConditions.push(where(fn('DATE', col('dateecriture')), { [Op.lte]: date_fin }));
                }

                if (andConditions.length) {
                    whereClause[Op.and] = andConditions;
                }
            }

            const result = await journals.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: codejournals,
                        attributes: ['code'],
                        required: false
                    }
                ],
                order: [['dateecriture', 'ASC'], ['id', 'ASC']],
                attributes: ['id', 'comptegen', 'piece', 'libelle', 'debit', 'credit', 'dateecriture'],
                raw: true,
                nest: true
            });

            const list = (result.rows || []).map((row) => ({
                id: row.id,
                compte: row.comptegen,
                journal: row.codejournal?.code ?? row.codejournals?.code ?? null,
                piece: row.piece,
                libelle: row.libelle,
                debit: row.debit,
                credit: row.credit,
                date_ecriture: row.dateecriture
            }));

            return res.status(200).json({
                state: true,
                data: list,
                count: result.count || 0
            });
        } catch (error) {
            console.error('[ECRITURES_SUSPENSE] error:', error);
            return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
        }
    }
};
