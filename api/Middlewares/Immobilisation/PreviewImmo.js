const db = require("../../Models");
require('dotenv').config();

exports.previewImmoLineaireMiddleware = async (fileId, compteId, exerciceId, detailImmoId) => {
    try {

        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return console.log({ state: false, msg: 'Paramètres manquants' });
        }

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

        // -----------------------------
        // PARAMÈTRES DE BASE
        // -----------------------------
        const baseJours = Number(detail.immo_amort_base_jours) || 360;
        const montantHT = Number(detail.montant_ht) || Number(detail.montant) || 0;
        const dateMS = new Date(detail.date_mise_service);
        const exoDebut = detail.date_debut ? new Date(detail.date_debut) : null;
        const exoFin = detail.date_fin ? new Date(detail.date_fin) : null;
        const etat = detail?.etat;

        const dureeCompInitiale = Math.max(1, Number(detail.duree_amort_mois) || 0);
        const dureeFisc = Math.max(0, Math.floor(Number(detail.duree_amort_mois_fisc) || 0));

        // -----------------------------
        // DONNÉES DE REPRISE (séparées comptable / fiscal)
        // -----------------------------
        const repriseActiveComp = Number(
            detail.reprise_immobilisation_comp ?? false
        ) === 1;
        const dateRepriseComp = (detail.date_reprise_comp || detail.date_reprise)
            ? new Date(detail.date_reprise_comp || detail.date_reprise)
            : null;
        const amortAntComp = Number(detail.amort_ant_comp) || 0;
        const amortAntFisc = Number(detail.amort_ant_fisc) || 0;

        if (exoDebut && !isNaN(exoDebut.getTime()) && exoFin && !isNaN(exoFin.getTime())) {
            if (repriseActiveComp && dateRepriseComp && !isNaN(dateRepriseComp.getTime()) && (dateRepriseComp < exoDebut || dateRepriseComp > exoFin)) {
                return console.log({ state: false, msg: "Date de reprise hors période de l'exercice" });
            }
        }

        // -----------------------------
        // OUTILS
        // -----------------------------
        const addMonths = (d, m) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + m); return nd; };
        const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; };
        const minDate = (a, b) => (a <= b ? a : b);
        const toYMD = d => d.toISOString().substring(0, 10);
        const clamp = v => Math.round((v + 0.0000001) * 100) / 100;

        const nbJoursBetween = (debut, fin) => {
            if (baseJours === 360) {
                const dStart = Math.min(debut.getDate(), 30);
                const dEnd = Math.min(fin.getDate(), 30);
                const monthsDiff = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
                if (monthsDiff === 0) return Math.max(1, dEnd - dStart + 1);
                return (30 - dStart + 1) + Math.max(0, monthsDiff - 1) * 30 + dEnd;
            }
            return Math.floor((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
        };

        // -----------------------------
        // AMORTISSEMENT COMPTABLE
        // -----------------------------
        let dateDepartAmortComp = new Date(dateMS);
        let dureeAmortCompEffective = dureeCompInitiale;
        let cumulInitialComp = 0;

        // Gestion reprise comptable
        if (repriseActiveComp && dateRepriseComp && amortAntComp > 0) {
            const finTheo = addDays(addMonths(dateMS, dureeCompInitiale), -1);
            if (dateRepriseComp <= finTheo) {
                const joursRestants = nbJoursBetween(dateRepriseComp, finTheo);
                dureeAmortCompEffective = clamp((joursRestants / baseJours) * 12);
                dateDepartAmortComp = new Date(dateRepriseComp);
                cumulInitialComp = amortAntComp;
            }
        }

        // Détermination de la date de fin d'amortissement
        let finAmortComp = addDays(addMonths(dateDepartAmortComp, dureeAmortCompEffective), -1);

        let dateSortieValide = null;

        if (
            etat !== 'enService' &&
            detail?.date_sortie &&
            !isNaN(new Date(detail.date_sortie).getTime())
        ) {
            dateSortieValide = new Date(detail.date_sortie);
        }

        // Calcul des taux et bases
        const tauxAnnuelComp = 12 / dureeAmortCompEffective;
        // const baseRestanteComp = clamp(montantHT - cumulInitialComp);
        const baseRestanteComp = clamp(montantHT);

        const compLines = [];
        let debutC = new Date(dateDepartAmortComp);
        let indexC = 1;
        let cumulC = cumulInitialComp;
        let vncC = clamp(montantHT - cumulInitialComp);
        let safetyC = 0;

        // Boucle d'amortissement annuelle
        while (vncC > 0 && safetyC < 1000) {
            if (debutC > finAmortComp) break;

            // Détermination de la date de fin de période
            let fin = indexC === 1
                ? (exoFin && exoFin < finAmortComp ? exoFin : finAmortComp)
                : addDays(addMonths(debutC, 12), -1);

            if (fin > finAmortComp) fin = finAmortComp;

            if (fin < debutC) {
                fin = minDate(addDays(addMonths(debutC, 1), -1), finAmortComp);
                if (fin < debutC) break;
            }

            if (dateSortieValide && fin > dateSortieValide) {
                fin = dateSortieValide;
            }

            // Calcul du nombre de jours et dotation
            const nbJours = nbJoursBetween(debutC, fin);
            if (!isFinite(nbJours) || nbJours <= 0) break;

            const anneeNombre = clamp(nbJours / baseJours);
            const dotTheorique = clamp(baseRestanteComp * tauxAnnuelComp * anneeNombre);

            let dot;
            if (fin >= finAmortComp || vncC - dotTheorique < 1) {
                dot = vncC;
            } else {
                dot = Math.min(vncC, dotTheorique);
            }

            // Création de la ligne comptable
            compLines.push({
                rang: indexC,
                date_debut: toYMD(debutC),
                date_fin: toYMD(fin),
                nb_jours: nbJours,
                annee_nombre: anneeNombre,
                dotation_mensuelle: clamp(baseRestanteComp / dureeCompInitiale),
                dot_ant: clamp(cumulC),
                dotation_annuelle: dot,
                cumul_amort: clamp(cumulC + dot),
                vnc: clamp(vncC - dot),
            });

            if (dateSortieValide && fin >= dateSortieValide) {
                break;
            }

            // Mise à jour des variables pour le cycle suivant
            cumulC += dot;
            vncC -= dot;
            debutC = addDays(fin, 1);
            indexC++;
            safetyC++;
        }

        // -----------------------------
        // AMORTISSEMENT FISCAL (avec reprise séparée)
        // -----------------------------
        let fiscLines = [];
        let dureeFiscEffectiveOut = null;
        let finAmortFiscOut = null;

        if (dureeFisc > 0) {
            let debutF = new Date(dateMS);
            let dureeFiscEffective = dureeFisc;
            let cumulInitialFisc = 0;

            // Ajustement si reprise comptable active
            if (repriseActiveComp && dateRepriseComp && amortAntFisc > 0) {
                const finTheoF = addDays(addMonths(dateMS, dureeFisc), -1);
                if (dateRepriseComp <= finTheoF) {
                    const joursRestantsF = nbJoursBetween(dateRepriseComp, finTheoF);
                    dureeFiscEffective = clamp((joursRestantsF / baseJours) * 12);
                    debutF = new Date(dateRepriseComp);
                    cumulInitialFisc = amortAntFisc;
                }
            }

            const tauxAnnuelFisc = 12 / dureeFiscEffective;
            const baseRestanteFisc = clamp(montantHT);

            // Date de fin fiscale théorique
            let finAmortFisc = addDays(addMonths(debutF, dureeFiscEffective), -1);

            dureeFiscEffectiveOut = dureeFiscEffective;
            finAmortFiscOut = finAmortFisc;

            let indexF = 1;
            let cumulF = cumulInitialFisc;
            let vncF = clamp(montantHT - cumulInitialFisc);
            let safetyF = 0;

            while (vncF > 0 && safetyF < 1000) {
                if (debutF > finAmortFisc) break;

                let fin = indexF === 1
                    ? (exoFin && exoFin < finAmortFisc ? exoFin : finAmortFisc)
                    : addDays(addMonths(debutF, 12), -1);

                if (fin > finAmortFisc) fin = finAmortFisc;

                if (fin < debutF) {
                    fin = minDate(addDays(addMonths(debutF, 1), -1), finAmortFisc);
                    if (fin < debutF) break;
                }

                if (dateSortieValide && fin > dateSortieValide) {
                    fin = dateSortieValide;
                }

                const nbJours = nbJoursBetween(debutF, fin);
                if (!isFinite(nbJours) || nbJours <= 0) break;

                const anneeNombre = clamp(nbJours / baseJours);
                const dotTheorique = clamp(baseRestanteFisc * tauxAnnuelFisc * anneeNombre);

                let dot;
                if (fin >= finAmortFisc || vncF - dotTheorique < 1) {
                    dot = vncF;
                } else {
                    dot = Math.min(vncF, dotTheorique);
                }

                fiscLines.push({
                    rang: indexF,
                    date_debut: toYMD(debutF),
                    date_fin: toYMD(fin),
                    nb_jours: nbJours,
                    annee_nombre: anneeNombre,
                    dotation_mensuelle: clamp(baseRestanteFisc / dureeFisc),
                    dot_ant: clamp(cumulF),
                    dotation_annuelle: dot,
                    cumul_amort: clamp(cumulF + dot),
                    vnc: clamp(vncF - dot),
                });

                if (dateSortieValide && fin >= dateSortieValide) {
                    break;
                }

                cumulF += dot;
                vncF -= dot;
                debutF = addDays(fin, 1);
                indexF++;
                safetyF++;
            }
        }

        // -----------------------------
        // RÉPONSE
        // -----------------------------

        return {
            meta: {
                base_jours: baseJours,
                montant_ht: montantHT,
                date_mise_service: toYMD(dateMS),
                // Back-compat: reprise = reprise comptable
                reprise: repriseActiveComp && dateRepriseComp ? {
                    date_reprise: toYMD(dateRepriseComp),
                    amort_ant: amortAntComp,
                    duree_restante_mois: dureeAmortCompEffective
                } : null,
                reprise_comp: repriseActiveComp && dateRepriseComp ? {
                    date_reprise: toYMD(dateRepriseComp),
                    amort_ant: amortAntComp,
                    duree_restante_mois: dureeAmortCompEffective
                } : null,
                reprise_fisc: repriseActiveComp && dateRepriseComp ? {
                    date_reprise: toYMD(dateRepriseComp),
                    amort_ant: amortAntFisc,
                    duree_restante_mois: dureeFiscEffectiveOut
                } : null,
                fin_amort_comp: toYMD(finAmortComp),
                fin_amort_fisc: finAmortFiscOut ? toYMD(finAmortFiscOut) : null,
            },
            list_comp: compLines,
            list_fisc: fiscLines,
        }

    } catch (err) {
        console.error('[IMMO][LINEAIRE][PREVIEW] error:', err);
        return console.log({ state: false, msg: 'Erreur serveur' });
    }
};

exports.previewImmoDegressifMiddleware = async (fileId, compteId, exerciceId, detailImmoId) => {
    try {
        if (!fileId || !compteId || !exerciceId || !detailImmoId) {
            return console.log({ state: false, msg: 'Paramètres manquants' });
        }

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

        // 3. Initialisation des variables principales
        const baseJours = Number(detail.immo_amort_base_jours) || 360; // base de calcul (par défaut 360 jours)
        const montantHT = Number(detail.montant_ht) || Number(detail.montant) || 0; // valeur de l'immobilisation
        const dateMS = detail.date_mise_service ? new Date(detail.date_mise_service) : null;
        const etat = detail?.etat;

        if (!dateMS || isNaN(dateMS.getTime())) return console.log({ state: false, msg: 'date_mise_service invalide' });
        if (montantHT <= 0) return console.log({ state: false, msg: 'montant HT invalide' });

        const exoDebut = detail.date_debut ? new Date(detail.date_debut) : null;
        const exoFin = detail.date_fin ? new Date(detail.date_fin) : null;

        const repriseActiveComp = Number(
            detail.reprise_immobilisation_comp ?? detail.reprise_immobilisation
        ) === 1;
        const dateRepriseComp = (detail.date_reprise_comp || detail.date_reprise)
            ? new Date(detail.date_reprise_comp || detail.date_reprise)
            : null;
        const amortAntComp = Number(detail.amort_ant_comp) || 0;

        // const repriseActiveFisc = Number(
        //     detail.reprise_immobilisation_fisc ?? detail.reprise_immobilisation
        // ) === 1;
        // const dateRepriseFisc = (detail.date_reprise_fisc || detail.date_reprise)
        //     ? new Date(detail.date_reprise_fisc || detail.date_reprise)
        //     : null;
        const amortAntFisc = Number(detail.amort_ant_fisc) || 0;

        if (exoDebut && !isNaN(exoDebut.getTime()) && exoFin && !isNaN(exoFin.getTime())) {
            if (repriseActiveComp && dateRepriseComp && !isNaN(dateRepriseComp.getTime()) && (dateRepriseComp < exoDebut || dateRepriseComp > exoFin)) {
                return console.log({ state: false, msg: "Date de reprise hors période de l'exercice" });
            }
            // if (repriseActiveFisc && dateRepriseFisc && !isNaN(dateRepriseFisc.getTime()) && (dateRepriseFisc < exoDebut || dateRepriseFisc > exoFin)) {
            //     return console.log({ state: false, msg: "Date de reprise fiscale hors période de l'exercice" });
            // }
        }

        // 4. Durée d'amortissement en mois et en années
        const dureeMois = Math.max(1, Number(detail.duree_amort_mois) || 0);
        const dureeAnnees = Math.ceil(dureeMois / 12);

        // 5. Détermination du coefficient dégressif selon la durée
        let coef = 0;
        if (dureeAnnees >= 1 && dureeAnnees <= 4) coef = 1.25;
        else if (dureeAnnees >= 5 && dureeAnnees <= 6) coef = 1.75;
        else if (dureeAnnees > 6) coef = 2.25;

        // 6. Calcul des taux annuels linéaire et dégressif
        const tauxLinAnnuel = 1 / dureeAnnees;
        const tauxDegAnnuel = tauxLinAnnuel * coef;

        let dateSortieValide = null;

        if (
            etat !== 'enService' &&
            detail?.date_sortie &&
            !isNaN(new Date(detail.date_sortie).getTime())
        ) {
            dateSortieValide = new Date(detail.date_sortie);
        }

        // 7. Fonctions utilitaires
        const addMonths = (d, m) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + m); return nd; }; // ajoute des mois à une date
        const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }; // ajoute des jours à une date
        const minDate = (a, b) => (a <= b ? a : b); // retourne la date la plus petite
        const toYMD = d => d.toISOString().substring(0, 10); // format YYYY-MM-DD
        const clamp = v => Math.round((v + 0.0000001) * 100) / 100; // arrondi à 2 décimales (optionnel)

        const nbJoursBetween = (debut, fin) => {
            if (baseJours === 360) {
                const dStart = Math.min(debut.getDate(), 30);
                const dEnd = Math.min(fin.getDate(), 30);
                const monthsDiff = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
                if (monthsDiff === 0) return Math.max(1, dEnd - dStart + 1);
                return (30 - dStart + 1) + Math.max(0, monthsDiff - 1) * 30 + dEnd;
            }
            return Math.floor((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
        };

        const computeRepriseParams = (dureeMoisX, repriseActiveX, dateRepriseX, amortAntX) => {
            const dureeM = Math.max(1, Number(dureeMoisX) || 0);

            // const finTheoX = (etat !== "enService" && detail.date_sortie)
            //     ? new Date(detail.date_sortie)
            //     : addDays(addMonths(dateMS, dureeM), -1);

            const finTheoX = addDays(addMonths(dateMS, dureeM), -1);

            let dateDepartX = new Date(dateMS);
            let dureeMEffective = dureeM;
            let cumulInitialX = 0;

            if (repriseActiveX && dateRepriseX && amortAntX > 0 && dateRepriseX <= finTheoX) {
                const joursRestantsX = nbJoursBetween(dateRepriseX, finTheoX);
                dureeMEffective = clamp((joursRestantsX / baseJours) * 12);
                dateDepartX = new Date(dateRepriseX);
                cumulInitialX = amortAntX;
            }

            let finAmortX = addDays(addMonths(dateDepartX, dureeMEffective), -1);
            // if (etat !== "enService" && detail.date_sortie && finAmortX > new Date(detail.date_sortie)) {
            //     finAmortX = new Date(detail.date_sortie);
            // }

            // const baseRestanteX = clamp(montantHT - cumulInitialX);
            const baseRestanteX = clamp(montantHT);

            return {
                dureeM,
                finTheoX,
                dateDepartX,
                dureeMEffective,
                cumulInitialX,
                finAmortX,
                baseRestanteX
            };
        };

        // 8. Constructeur générique d'un tableau dégressif avec bascule linéaire
        const buildDegSchedule = (dureeMoisX, repriseActiveX, dateRepriseX, amortAntX, labelX) => {
            const rp = computeRepriseParams(dureeMoisX, repriseActiveX, dateRepriseX, amortAntX);
            const dureeA = Math.ceil(rp.dureeMEffective / 12);

            let coefX = 0;
            if (dureeA >= 1 && dureeA <= 4) coefX = 1.25;
            else if (dureeA >= 5 && dureeA <= 6) coefX = 1.75;
            else if (dureeA > 6) coefX = 2.25;

            const tauxLinX = 1 / dureeA;
            const tauxDegX = tauxLinX * coefX;
            const exoFin = detail.date_fin ? new Date(detail.date_fin) : null;

            const linesX = [];
            let vncX = clamp(montantHT - rp.cumulInitialX);
            let cumulX = clamp(rp.cumulInitialX);
            let debutX = new Date(rp.dateDepartX);
            let anneeCumuleeX = 0;
            let indexX = 1;
            let safetyX = 0;
            let modeX = 'degressif';
            let didSwitchLogX = false;

            while (vncX > 0 && safetyX < 1000) {
                if (debutX > rp.finAmortX) break;

                let finX = indexX === 1
                    ? (exoFin && exoFin < rp.finAmortX ? exoFin : rp.finAmortX)
                    : addDays(addMonths(debutX, 12), -1);
                if (finX > rp.finAmortX) finX = rp.finAmortX;

                if (finX < debutX) {
                    finX = minDate(addDays(addMonths(debutX, 1), -1), rp.finAmortX);
                    if (finX < debutX) break;
                }

                if (dateSortieValide && finX > dateSortieValide) {
                    finX = dateSortieValide;
                }

                const isLastX = finX.getTime() === rp.finAmortX.getTime();
                const nbJoursX = nbJoursBetween(debutX, finX);
                if (!isFinite(nbJoursX) || nbJoursX <= 0) break;
                const prorataX = nbJoursX / baseJours;

                const dureeRestanteX = Math.max(1e-9, dureeA - anneeCumuleeX);
                const dotDegAnnX = vncX * tauxDegX;
                const dotLinRestAnnX = vncX / dureeRestanteX;
                if (modeX === 'degressif' && dotLinRestAnnX > dotDegAnnX) {
                    if (!didSwitchLogX) {
                        console.log('[IMMO][DEGRESSIF][SWITCH->LINEAIRE]', {
                            tab: labelX,
                            rang: indexX,
                            date_debut: toYMD(debutX),
                            date_fin_prevue: toYMD(finX),
                            vnc: clamp(vncX),
                            duree_restante_annees: clamp(dureeRestanteX),
                            dot_deg_annuel: clamp(dotDegAnnX),
                            dot_lin_rest_annuel: clamp(dotLinRestAnnX),
                        });
                        didSwitchLogX = true;
                    }
                    modeX = 'lineaire';
                }

                let dotPeriodeX = modeX === 'degressif'
                    ? (vncX * tauxDegX * prorataX)
                    : (dotLinRestAnnX * prorataX);

                if (isLastX || vncX - dotPeriodeX < 0.01) {
                    dotPeriodeX = vncX;
                }

                dotPeriodeX = clamp(dotPeriodeX);
                const antX = clamp(cumulX);
                cumulX = clamp(cumulX + dotPeriodeX);
                vncX = clamp(montantHT - cumulX);

                linesX.push({
                    rang: indexX,
                    date_debut: toYMD(debutX),
                    date_fin: toYMD(finX),
                    nb_jours: nbJoursX,
                    annee_nombre: clamp(prorataX),
                    mode_utilise: modeX,
                    dot_ant: antX,
                    dotation_annuelle: dotPeriodeX,
                    cumul_amort: cumulX,
                    vnc: vncX,
                });

                if (dateSortieValide && finX >= dateSortieValide) {
                    break;
                }

                anneeCumuleeX += prorataX;
                if (vncX <= 0) break;
                debutX = addDays(finX, 1);
                indexX++;
                safetyX++;
            }

            return {
                coef: coefX,
                duree_mois: rp.dureeMEffective,
                duree_annees: dureeA,
                taux_lin_annuel: tauxLinX,
                taux_deg_annuel: tauxDegX,
                lines: linesX,
                finAmort: rp.finAmortX,
                reprise: repriseActiveX && dateRepriseX && rp.cumulInitialX > 0 ? {
                    date_reprise: toYMD(dateRepriseX),
                    amort_ant: rp.cumulInitialX,
                    duree_restante_mois: rp.dureeMEffective,
                } : null,
            };
        };

        // 9. Constructeur linéaire (prorata jours, 30/360 pris en compte)
        const buildLinSchedule = (dureeMoisX, repriseActiveX, dateRepriseX, amortAntX) => {
            const rp = computeRepriseParams(dureeMoisX, repriseActiveX, dateRepriseX, amortAntX);
            const dureeA = Math.ceil(rp.dureeMEffective / 12);
            const tauxLinX = 1 / dureeA;
            const exoFin = detail.date_fin ? new Date(detail.date_fin) : null;

            const linesX = [];
            let vncX = clamp(montantHT - rp.cumulInitialX);
            let cumulX = clamp(rp.cumulInitialX);
            let debutX = new Date(rp.dateDepartX);
            let indexX = 1;
            let safetyX = 0;

            while (vncX > 0 && safetyX < 1000) {
                if (debutX > rp.finAmortX) break;

                let finX = indexX === 1
                    ? (exoFin && exoFin < rp.finAmortX ? exoFin : rp.finAmortX)
                    : addDays(addMonths(debutX, 12), -1);
                if (finX > rp.finAmortX) finX = rp.finAmortX;
                if (finX < debutX) {
                    finX = minDate(addDays(addMonths(debutX, 1), -1), rp.finAmortX);
                    if (finX < debutX) break;
                }

                if (dateSortieValide && finX > dateSortieValide) {
                    finX = dateSortieValide;
                }

                const nbJoursX = nbJoursBetween(debutX, finX);
                if (!isFinite(nbJoursX) || nbJoursX <= 0) break;
                const prorataX = nbJoursX / baseJours;

                let dotPeriodeX = rp.baseRestanteX * tauxLinX * prorataX;
                if (finX.getTime() === rp.finAmortX.getTime() || vncX - dotPeriodeX < 0.01) {
                    dotPeriodeX = vncX;
                }

                dotPeriodeX = clamp(dotPeriodeX);
                const antX = clamp(cumulX);
                cumulX = clamp(cumulX + dotPeriodeX);
                vncX = clamp(montantHT - cumulX);

                linesX.push({
                    rang: indexX,
                    date_debut: toYMD(debutX),
                    date_fin: toYMD(finX),
                    nb_jours: nbJoursX,
                    annee_nombre: clamp(prorataX),
                    mode_utilise: 'lineaire',
                    dot_ant: antX,
                    dotation_annuelle: dotPeriodeX,
                    cumul_amort: cumulX,
                    vnc: vncX,
                });

                if (dateSortieValide && finX >= dateSortieValide) {
                    break;
                }

                if (vncX <= 0) break;
                debutX = addDays(finX, 1);
                indexX++;
                safetyX++;
            }

            return {
                coef: 0,
                duree_mois: rp.dureeMEffective,
                duree_annees: dureeA,
                taux_lin_annuel: tauxLinX,
                taux_deg_annuel: 0,
                lines: linesX,
                finAmort: rp.finAmortX,
                reprise: repriseActiveX && dateRepriseX && rp.cumulInitialX > 0 ? {
                    date_reprise: toYMD(dateRepriseX),
                    amort_ant: rp.cumulInitialX,
                    duree_restante_mois: rp.dureeMEffective,
                } : null,
            };
        };

        const normalizeNoAccent = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const typeComp = normalizeNoAccent(detail?.type_amort);
        const typeFisc = normalizeNoAccent(detail?.type_amort_fisc);

        const dureeMoisComp = Math.max(1, Number(detail.duree_amort_mois) || 0);
        const compIsDeg = typeComp.includes('degr');
        const resComp = compIsDeg
            ? buildDegSchedule(dureeMoisComp, repriseActiveComp, dateRepriseComp, amortAntComp, 'comptable')
            : buildLinSchedule(dureeMoisComp, repriseActiveComp, dateRepriseComp, amortAntComp);

        const dureeMoisFisc = Math.max(0, Math.floor(Number(detail.duree_amort_mois_fisc) || 0));
        const hasFisc = dureeMoisFisc > 0;
        const fiscIsDeg = typeFisc.includes('degr');
        const resFisc = hasFisc
            ? (fiscIsDeg
                ? buildDegSchedule(dureeMoisFisc, repriseActiveComp, dateRepriseComp, amortAntFisc, 'fiscal')
                : buildLinSchedule(dureeMoisFisc, repriseActiveComp, dateRepriseComp, amortAntFisc))
            : null;

        return {
            meta: {
                base_jours: baseJours,
                montant_ht: montantHT,
                date_mise_service: toYMD(dateMS),
                // Back-compat: reprise = reprise comptable
                reprise: resComp.reprise,
                reprise_comp: resComp.reprise,
                reprise_fisc: resFisc ? resFisc.reprise : null,
                comp: {
                    coef_degressif: resComp.coef,
                    duree_mois: resComp.duree_mois,
                    duree_annees: resComp.duree_annees,
                    taux_lin_annuel: resComp.taux_lin_annuel,
                    taux_deg_annuel: resComp.taux_deg_annuel,
                    fin_amort_prevue: toYMD(resComp.finAmort),
                },
                fisc: hasFisc ? {
                    coef_degressif: resFisc.coef,
                    duree_mois: resFisc.duree_mois,
                    duree_annees: resFisc.duree_annees,
                    taux_lin_annuel: resFisc.taux_lin_annuel,
                    taux_deg_annuel: resFisc.taux_deg_annuel,
                    fin_amort_prevue: toYMD(resFisc.finAmort),
                } : null,
            },
            list_comp: resComp.lines,
            list_fisc: hasFisc ? resFisc.lines : [],
        }

    } catch (err) {
        console.error('[IMMO][DEGRESSIF][PREVIEW] error:', err);
        return console.log({ state: false, msg: 'Erreur serveur' });
    }
}