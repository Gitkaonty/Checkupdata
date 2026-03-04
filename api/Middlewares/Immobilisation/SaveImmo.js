const db = require("../../Models");
require('dotenv').config();

exports.saveImmoLineaireMiddleware = async (fileId, compteId, exerciceId, detailImmoId, lignes) => {
    try {
        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return console.log({ state: false, msg: 'Paramètres manquants' });
        }

        if (!lignes || !Array.isArray(lignes)) {
            return console.log({ state: false, msg: 'Lignes calculées manquantes - utilisez d\'abord previewImmoLineaire' });
        }

        // Préparer les lignes pour l'insertion (utiliser les lignes pré-calculées)
        const out = lignes.map((ligne) => ({
            id_dossier: fileId,
            id_compte: compteId,
            id_exercice: exerciceId,
            id_detail_immo: detailImmoId,
            rang: ligne.rang,
            date_mise_service: ligne.date_mise_service,
            date_fin_exercice: ligne.date_fin_exercice,
            annee_nombre: ligne.annee_nombre,
            montant_immo_ht: ligne.montant_immo_ht,
            vnc: ligne.vnc,
            amort_ant_comp: ligne.amort_ant_comp,
            dotation_periode_comp: ligne.dotation_periode_comp,
            cumul_amort_comp: ligne.cumul_amort_comp,
            amort_ant_fisc: ligne.amort_ant_fisc,
            dotation_periode_fisc: ligne.dotation_periode_fisc,
            cumul_amort_fisc: ligne.cumul_amort_fisc,
            dot_derogatoire: ligne.dot_derogatoire || 0,
        }));

        await db.detailsImmoLignes.destroy({
            where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, id_detail_immo: detailImmoId },
        });
        if (out.length > 0) await db.detailsImmoLignes.bulkCreate(out);
    } catch (err) {
        console.error('[IMMO][SAVE][LINEAIRE] error:', err);
        return console.log({ state: false, msg: 'Erreur serveur' });
    }
};

exports.saveImmoDegressifMiddleware = async (fileId, compteId, exerciceId, detailImmoId, lignes) => {
    try {
        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return console.log({ state: false, msg: 'Paramètres manquants' });
        }

        if (!lignes || !Array.isArray(lignes)) {
            try {
                const [rows] = await db.sequelize.query(`
                            SELECT
                                d.*,
                                e.date_debut,
                                e.date_fin,
                                dos.immo_amort_base_jours
                            FROM details_immo d
                            LEFT JOIN exercices e
                                ON e.id = d.id_exercice
                                AND e.id_dossier = d.id_dossier
                            LEFT JOIN dossiers dos
                                ON dos.id = d.id_dossier
                            WHERE
                                d.id = :detailImmoId
                                AND d.id_dossier = :fileId
                                AND d.id_compte = :compteId
                        `, {
                    replacements: { fileId, compteId, detailImmoId },
                    type: db.Sequelize.QueryTypes.SELECT
                });

                const detail = rows;

                // Calcul linéaire simple
                const baseJours = Number(detail.immo_amort_base_jours) || 360;
                const montantHT = Number(detail.montant_ht) || Number(detail.montant) || 0;
                const dateMiseService = detail.date_mise_service ? new Date(detail.date_mise_service) : null;
                const exoFin = detail.date_fin ? new Date(detail.date_fin) : null;
                const dureeComp = Math.max(1, Math.floor(Number(detail.duree_amort_mois) || 0));

                if (montantHT <= 0) {
                    return console.log({ state: false, msg: 'montant HT invalide' });
                }

                const dotMensComp = montantHT / dureeComp;
                const dotAnnComp = dotMensComp * 12;

                const out = [];
                let debut = new Date(dateMiseService);
                let index = 1;
                let cumulComp = 0;
                let vncComp = montantHT;

                while (vncComp > 0 && index <= 50) {
                    const fin = index === 1 ? (exoFin || new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate() - 1)) : new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate() - 1);
                    const nbJours = Math.floor((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
                    const anneeNombre = nbJours / baseJours;
                    const dotComp = Math.min(vncComp, Math.round(dotAnnComp * anneeNombre * 100) / 100);

                    cumulComp += dotComp;
                    vncComp = montantHT - cumulComp;

                    out.push({
                        id_dossier: fileId,
                        id_compte: compteId,
                        id_exercice: exerciceId,
                        id_detail_immo: detailImmoId,
                        rang: index,
                        date_mise_service: debut.toISOString().substring(0, 10),
                        date_fin_exercice: fin.toISOString().substring(0, 10),
                        annee_nombre: Math.round(anneeNombre * 100) / 100,
                        montant_immo_ht: montantHT,
                        vnc: Math.max(0, vncComp),
                        amort_ant_comp: Math.round((cumulComp - dotComp) * 100) / 100,
                        dotation_periode_comp: dotComp,
                        cumul_amort_comp: cumulComp,
                        amort_ant_fisc: 0,
                        dotation_periode_fisc: 0,
                        cumul_amort_fisc: 0,
                        dot_derogatoire: 0,
                    });

                    debut = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
                    index++;
                }

                await db.detailsImmoLignes.destroy({
                    where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, id_detail_immo: detailImmoId },
                });
                if (out.length > 0) await db.detailsImmoLignes.bulkCreate(out);
                return console.log({ state: true, saved: out.length, fallback: 'linear' });

            } catch (fallbackError) {
                console.error('[IMMO][SAVE] Erreur fallback:', fallbackError);
                return console.log({
                    state: false,
                    msg: 'Lignes calculées manquantes - utilisez d\'abord previewImmoDegressif ou corrigez le frontend pour utiliser saveImmoLineaire'
                });
            }
        }

        // Préparer les lignes pour l'insertion (utiliser les lignes pré-calculées)
        const out = lignes.map((ligne) => ({
            id_dossier: fileId,
            id_compte: compteId,
            id_exercice: exerciceId,
            id_detail_immo: detailImmoId,
            rang: ligne.rang,
            date_mise_service: ligne.date_mise_service,
            date_fin_exercice: ligne.date_fin_exercice,
            annee_nombre: ligne.annee_nombre,
            montant_immo_ht: ligne.montant_immo_ht,
            vnc: ligne.vnc,
            amort_ant_comp: ligne.amort_ant_comp,
            dotation_periode_comp: ligne.dotation_periode_comp,
            cumul_amort_comp: ligne.cumul_amort_comp,
            amort_ant_fisc: ligne.amort_ant_fisc,
            dotation_periode_fisc: ligne.dotation_periode_fisc,
            cumul_amort_fisc: ligne.cumul_amort_fisc,
            dot_derogatoire: ligne.dot_derogatoire || 0,
        }));

        await db.detailsImmoLignes.destroy({
            where: { id_dossier: fileId, id_compte: compteId, id_exercice: exerciceId, id_detail_immo: detailImmoId },
        });
        if (out.length > 0) await db.detailsImmoLignes.bulkCreate(out);
    } catch (err) {
        console.error('[IMMO][DEGRESSIF][SAVE] error:', err);
        return console.log({ state: false, msg: 'Erreur serveur' });
    }
};