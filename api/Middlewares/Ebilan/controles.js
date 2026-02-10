const db = require("../../Models");
require('dotenv').config();

const recupEbilan = require('../../Middlewares/Declaration/Ebilan/EblianMiddleware');
const getEbilanComplet = recupEbilan.getEbilanComplet;

const controles = db.controles;
const etats = db.etats;
const controlematrices = db.controlematrices;
const controlematricedetails = db.controlematricedetails;

const controletableau = async (declaration, tableau, id_compte, id_dossier, id_exercice) => {
    try {
        const liste = await controlematrices.findAll({
            where: { declaration, etat_id: tableau },
            raw: true,
            order: [['control_id', 'ASC']],
        });

        if (liste.length === 0) return;

        await controles.destroy({
            where: { id_compte, id_dossier, id_exercice, declaration, etat_id: tableau }
        });

        const data = await getEbilanComplet(id_compte, id_dossier, id_exercice, tableau);

        const tableauMap = {
            BILAN: [data.filter(d => d.id_etat === 'BILAN' && d.subtable === 1),
            data.filter(d => d.id_etat === 'BILAN' && d.subtable === 2)],
            CRN: data.filter(d => d.id_etat === 'CRN' && d.subtable === 0),
            CRF: data.filter(d => d.id_etat === 'CRF' && d.subtable === 0),
            TFTD: data.filter(d => d.id_etat === 'TFTD' && d.subtable === 0),
            TFTI: data.filter(d => d.id_etat === 'TFTI' && d.subtable === 0)
        };

        for (let item of liste) {
            const details = await controlematricedetails.findAll({
                where: { declaration, etat_id: tableau, control_id: item.control_id },
                raw: true,
                order: [['control_id', 'ASC']],
            });

            if (item.typecontrol !== 'COMPARAISON' || item.typecomparaison !== 'EGAL') continue;

            let total = 0;

            for (let det of details) {
                let soldtemp = 0;

                if (['BILAN', 'CRN', 'CRF', 'TFTD', 'TFTI'].includes(det.tableau)) {
                    let tab = det.tableau === 'BILAN'
                        ? tableauMap.BILAN[det.subtable === 1 ? 0 : 1]
                        : tableauMap[det.tableau];

                    const filtered = tab.filter(b => (b[det.colonnefiltre] == det.ligne) && (b.subtable == det.subtable || det.subtable >= 3));

                    soldtemp = filtered.reduce((sum, b) => {
                        let value = Number(b[det.colonnetotal] || 0);
                        if (det.operation === 'SOUS') value = -value;
                        return sum + value;
                    }, 0);

                } else {
                    const totaltemp = await db.sequelize.query(`
                        SELECT SUM(${det.colonnetotal}) as sold
                        FROM ${det.tablename} as tabA
                        WHERE tabA.id_compte = :id_compte
                          AND tabA.id_dossier = :id_dossier
                          AND tabA.id_exercice = :id_exercice
                          AND ${det.colonnefiltre} = :ligne
                          AND id_etat = :etat
                    `, {
                        replacements: {
                            id_compte, id_dossier, id_exercice,
                            ligne: det.ligne, etat: det.tableau, subtable: det.subtable
                        },
                        type: db.Sequelize.QueryTypes.SELECT
                    });

                    soldtemp = totaltemp[0]?.sold ?? 0;
                    if (det.operation === 'SOUS') soldtemp = -soldtemp;
                }

                total += soldtemp;
            }

            if (parseFloat(total.toFixed(2)) !== 0) {
                await controles.create({
                    id_compte, id_dossier, id_exercice,
                    declaration: item.declaration,
                    etat_id: item.etat_id,
                    control_id: item.control_id,
                    nbranomalie: 1,
                    anomalie: `${item.comments} Ecart de ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                });

                const totalAnom = await controles.sum('nbranomalie', {
                    where: { id_compte, id_dossier, id_exercice, etat_id: item.etat_id }
                });

                await etats.update(
                    { nbranomalie: totalAnom },
                    { where: { id_compte, id_dossier, id_exercice, code: item.etat_id } }
                );
            }
        }

    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    controletableau
};
