const db = require("../../Models");
const { journals, exercices } = db;
const { Op } = require("sequelize");
const recupExerciceN1 = require('../../Middlewares/Standard/recupExerciceN1');
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { applyKaontyStyle } = require('../../Middlewares/kaontyExcelStyle');

const round2 = (value) => Math.round(value * 100) / 100;

exports.getRevuAnalytiqueNN1 = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        let { date_debut, date_fin } = req.query; // Dates de periode si selectionnee
        const { id_periode } = req.query; // ID de periode alternative

        // Si id_periode est fourni mais pas les dates, récupérer les dates de la période
        if (id_periode && (!date_debut || !date_fin)) {
            const periode = await db.periodes.findOne({
                where: { id: id_periode }
            });
            if (periode) {
                date_debut = periode.date_debut;
                date_fin = periode.date_fin;
            } else {
                console.log('[DEBUG NN1] Période non trouvée pour id:', id_periode);
            }
        }

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        // Récupérer le seuil d'anomalie du dossier
        const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
        const seuilPourcent = dossier && dossier.seuil_revu_analytique ? dossier.seuil_revu_analytique : 30.0;
        const seuilDecimal = seuilPourcent / 100.0; // ex: 30.0 -> 0.3
        console.log('[revuAnalytiqueNN1] seuil dossier:', { id_dossier, seuilPourcent, seuilDecimal });

        // Récupérer l'exercice N
        const exerciceN = await exercices.findOne({
            where: { id: id_exercice }
        });
        if (!exerciceN) {
            return res.status(404).json({ state: false, message: "Exercice N non trouvé" });
        }

        // Récupérer l'exercice N-1
        const exerciceN1 = await exercices.findOne({
            where: {
                id_dossier,
                rang: exerciceN.rang - 1 // on utilise rang ici
            }
        });

        const id_exerciceN1 = exerciceN1 ? exerciceN1.id : null;
        // console.log('[revuAnalytiqueNN1] hasN1 =', !!exerciceN1, 'id_exerciceN1 =', id_exerciceN1);

        // Calcul du facteur de proratisation pour N-1
        let facteurProrata = 1; // Par défaut, pas de proratisation
        let nbrMoisPeriodeN = null;
        let nbrMoisTotalN1 = null;

        if (exerciceN1 && exerciceN1.date_debut && exerciceN1.date_fin) {
            // Nombre de mois total de l'exercice N-1
            const debutN1 = new Date(exerciceN1.date_debut);
            const finN1 = new Date(exerciceN1.date_fin);
            nbrMoisTotalN1 = (finN1.getFullYear() - debutN1.getFullYear()) * 12 +
                (finN1.getMonth() - debutN1.getMonth()) + 1;

            // Si une période est sélectionnée dans N, calculer sa durée en mois
            if (date_debut && date_fin) {
                const debutPeriode = new Date(date_debut);
                const finPeriode = new Date(date_fin);
                nbrMoisPeriodeN = (finPeriode.getFullYear() - debutPeriode.getFullYear()) * 12 +
                    (finPeriode.getMonth() - debutPeriode.getMonth()) + 1;

                // Calculer le facteur de proratisation
                if (nbrMoisTotalN1 > 0) {
                    facteurProrata = nbrMoisPeriodeN / nbrMoisTotalN1;
                }
            }
        }

        // console.log('[revuAnalytiqueNN1] prorata:', { nbrMoisPeriodeN, nbrMoisTotalN1, facteurProrata });

        // Requête SQL pour agréger les données des exercices N et N-1
        // Dans la requête SQL, on peut calculer directement var et var%
        let query;
        let replacements;

        // Condition de date pour N (filtre par periode si applicable)
        const dateConditionN = date_debut && date_fin
            ? `AND id_exercice = (SELECT id FROM exerciceN) AND dateecriture BETWEEN :date_debut AND :date_fin`
            : `AND id_exercice = (SELECT id FROM exerciceN)`;

        // Pour N-1, on prend tout l exercice complet (pas de filtre par date) car on applique le prorata
        const dateConditionN1 = `AND id_exercice = (SELECT id FROM exerciceN1)`;

 
            query = `
                WITH exos AS (
                    SELECT id, id_dossier, rang
                    FROM exercices
                    WHERE id_dossier = :id_dossier
                ),

                exerciceN AS (
                    SELECT id, rang
                    FROM exos
                    WHERE id = :id_exercice
                ),

                exerciceN1 AS (
                    SELECT id
                    FROM exos
                    WHERE rang = (SELECT rang - 1 FROM exerciceN)
                ),

                jn AS (
                    SELECT
                        NULLIF(TRIM(comptegen),'') AS compte_key,
                        MIN(libellecompte) AS libellecompte,
                        SUM(COALESCE(debit,0) - COALESCE(credit,0)) AS solde
                    FROM journals
                    WHERE id_compte = :id_compte
                    AND id_dossier = :id_dossier
                    AND id_exercice = (SELECT id FROM exerciceN)
                    ${date_debut && date_fin ? 'AND dateecriture BETWEEN :date_debut AND :date_fin' : ''}
                    AND comptegen IS NOT NULL
                    AND TRIM(comptegen) != ''
                    GROUP BY NULLIF(TRIM(comptegen),'')
                ),

                jn1 AS (
                    SELECT
                        NULLIF(TRIM(comptegen),'') AS compte_key,
                        MIN(libellecompte) AS libellecompte,
                        SUM(COALESCE(debit,0) - COALESCE(credit,0)) AS solde
                    FROM journals
                    WHERE id_compte = :id_compte
                    AND id_dossier = :id_dossier
                    AND id_exercice = (SELECT id FROM exerciceN1)
                    AND comptegen IS NOT NULL
                    AND TRIM(comptegen) != ''
                    GROUP BY NULLIF(TRIM(comptegen),'')
                )

                SELECT
                    COALESCE(jn.compte_key, jn1.compte_key) AS compte,
                    COALESCE(jn.libellecompte, jn1.libellecompte) AS libelle,
                    COALESCE(jn.solde,0) AS "soldeN",
                    COALESCE(jn1.solde * :facteurProrata,0) AS "soldeN1",
                    COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0) AS var,

                    CASE
                        WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 AND COALESCE(jn.solde,0) = 0 THEN 0
                        WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 AND COALESCE(jn.solde,0) != 0 THEN 100
                        ELSE ROUND(
                            (((COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0))
                            / NULLIF(jn1.solde * :facteurProrata,0)) * 100)::numeric
                        ,2)
                    END AS "varPourcent",

                    COALESCE(ca_periode.valide_anomalie, ca_null.valide_anomalie, false) AS "valide_anomalie",

                    CASE
                        WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 THEN false
                        WHEN ABS((COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0))
                                / NULLIF(jn1.solde * :facteurProrata,0)) >= :seuilDecimal THEN true
                        ELSE false
                    END AS anomalies,

                    COALESCE(ca_periode.commentaire, ca_null.commentaire, '') AS commentaire

                FROM jn
                FULL OUTER JOIN jn1 ON jn.compte_key = jn1.compte_key

                LEFT JOIN commentaireanalytiques ca_periode
                ON ca_periode.id_compte = :id_compte
                AND ca_periode.id_dossier = :id_dossier
                AND ca_periode.id_exercice = :id_exercice
                AND ca_periode.id_periode = :id_periode
                AND ca_periode.compte = COALESCE(jn.compte_key, jn1.compte_key)

                LEFT JOIN commentaireanalytiques ca_null
                ON ca_null.id_compte = :id_compte
                AND ca_null.id_dossier = :id_dossier
                AND ca_null.id_exercice = :id_exercice
                AND ca_null.id_periode IS NULL
                AND ca_null.compte = COALESCE(jn.compte_key, jn1.compte_key)
                AND ca_periode.id IS NULL

                ORDER BY compte;
            `;
            replacements = {
                id_compte,
                id_dossier,
                id_exercice,
                id_periode: id_periode || null,
                facteurProrata,
                seuilDecimal,
                ...(date_debut && { date_debut }),
                ...(date_fin && { date_fin })
            };
        

        // Exécuter la requête
        // console.log('[revuAnalytiqueNN1] params reçus:', { id_compte, id_dossier, id_exercice, id_exerciceN1 });
        const results = await db.sequelize.query(query, {
            replacements: replacements,
            type: db.Sequelize.QueryTypes.SELECT
        });

        // Totaux pour N
        const totals = await db.sequelize.query(
            `SELECT COUNT(*) as lignes, SUM(debit) as total_debit, SUM(credit) as total_credit
             FROM journals
             WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice`,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Comptes distincts pour N
        const comptesDistincts = await db.sequelize.query(
            `SELECT DISTINCT TRIM(comptegen) as compte
             FROM journals
             WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exercice
               AND comptegen IS NOT NULL AND TRIM(comptegen) != ''
             ORDER BY compte`,
            {
                replacements: { id_compte, id_dossier, id_exercice },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        if (id_exerciceN1) {
            const comptesDistinctsN1 = await db.sequelize.query(
                `SELECT DISTINCT TRIM(comptegen) as compte
                 FROM journals
                 WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = :id_exerciceN1
                   AND comptegen IS NOT NULL AND TRIM(comptegen) != ''
                 ORDER BY compte`,
                {
                    replacements: { id_compte, id_dossier, id_exerciceN1 },
                    type: db.Sequelize.QueryTypes.SELECT
                }
            );

            const setN = new Set((comptesDistincts || []).map(r => r.compte));
            const setN1 = new Set((comptesDistinctsN1 || []).map(r => r.compte));
            const onlyInN = Array.from(setN).filter(c => !setN1.has(c));
            const onlyInN1 = Array.from(setN1).filter(c => !setN.has(c));
        }

        // Formatter les résultats
        const formattedResults = results.map((row, index) => {
            let compteKey = row.compte ? String(row.compte).trim() : '';
            compteKey = compteKey.replace(/^"+|"+$/g, '');
            return {
                compte: compteKey,
                libelle: row.libelle || '',
                soldeN: round2(parseFloat(row.soldeN) || 0),
                soldeN1: row.soldeN1 !== null && row.soldeN1 !== undefined ? round2(parseFloat(row.soldeN1)) : null,
                var: round2(parseFloat(row.var) || 0),
                varPourcent: row.varPourcent !== null && row.varPourcent !== undefined ? round2(parseFloat(row.varPourcent)) : null,
                valide_anomalie: !!row.valide_anomalie,
                anomalies: !!row.anomalies,
                commentaire: row.commentaire || ''
            };
        });


        // Sauvegarder/Mettre à jour les anomalies dans revu_analytique pour la synthèse
        try {
            const anomaliesToSave = formattedResults.filter(r => r.anomalies);

            const revuAnalytiqueModel = db.revuAnalytique;
            if (!revuAnalytiqueModel) {
                console.error('[DEBUG NN1] Modèle revuAnalytique non initialisé');
            }

            for (const anomaly of anomaliesToSave) {
                // Vérifier si une entrée existe déjà
                const [existing] = await revuAnalytiqueModel.findOrCreate({
                    where: {
                        id_compte,
                        id_exercice,
                        id_dossier,
                        id_periode: id_periode || null,
                        compte: anomaly.compte,
                        type_revue: 'analytiqueNN1'
                    },
                    defaults: {
                        nbr_anomalies: 1,
                        anomalies_valides: anomaly.valide_anomalie ? 1 : 0
                    }
                });

                if (!existing.isNewRecord) {
                    // Mettre à jour si nécessaire
                    await existing.update({
                        nbr_anomalies: 1,
                        // Préserver les validations existantes
                        anomalies_valides: anomaly.valide_anomalie ? 1 : (existing.anomalies_valides || 0)
                    });
                }
            }

        } catch (saveError) {
            console.error('[DEBUG NN1] Erreur lors de la sauvegarde:', saveError.message);
            // Ne pas bloquer la réponse si la sauvegarde échoue
        }

        return res.json({
            data: formattedResults,
            state: true,
            message: 'Données récupérées avec succès'
        });
    } catch (error) {
        console.error('Erreur dans getRevuAnalytiqueNN1:', error);
        return res.status(500).json({
            message: "Erreur serveur",
            state: false,
            error: error.message
        });
    }
};

// Helpers for export
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const formatMontant = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ');
};

const tryReadLogo = () => {
    const candidatePaths = [
        process.env.REPORT_LOGO_PATH,
        path.join(process.cwd(), 'assets', 'logo.png'),
        path.join(__dirname, '..', '..', 'assets', 'logo.png'),
        path.join(__dirname, '..', '..', '..', 'front', 'kaonti', 'src', 'img', '30.png')
    ].filter(Boolean);
    for (const p of candidatePaths) {
        try {
            if (fs.existsSync(p)) {
                const buf = fs.readFileSync(p);
                return { dataUrl: `data:image/png;base64,${buf.toString('base64')}`, buffer: buf, extension: 'png' };
            }
        } catch (_) { }
    }
    return null;
};

// Helper to get data for export (reuses the main query logic)
const getRevuAnalytiqueData = async (id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin) => {
    const dossier = await db.dossiers.findOne({ where: { id: id_dossier } });
    const seuilPourcent = dossier && dossier.seuil_revu_analytique ? dossier.seuil_revu_analytique : 30.0;
    const seuilDecimal = seuilPourcent / 100.0;

    const exerciceN = await exercices.findOne({ where: { id: id_exercice } });
    if (!exerciceN) throw new Error("Exercice N non trouvé");

    const exerciceN1 = await exercices.findOne({
        where: { id_dossier, rang: exerciceN.rang - 1 }
    });

    let facteurProrata = 1;
    if (exerciceN1 && exerciceN1.date_debut && exerciceN1.date_fin && date_debut && date_fin) {
        const debutN1 = new Date(exerciceN1.date_debut);
        const finN1 = new Date(exerciceN1.date_fin);
        const nbrMoisTotalN1 = (finN1.getFullYear() - debutN1.getFullYear()) * 12 + (finN1.getMonth() - debutN1.getMonth()) + 1;
        const debutPeriode = new Date(date_debut);
        const finPeriode = new Date(date_fin);
        const nbrMoisPeriodeN = (finPeriode.getFullYear() - debutPeriode.getFullYear()) * 12 + (finPeriode.getMonth() - debutPeriode.getMonth()) + 1;
        if (nbrMoisTotalN1 > 0) facteurProrata = nbrMoisPeriodeN / nbrMoisTotalN1;
    }

    const query = `
        WITH exos AS (SELECT id, id_dossier, rang FROM exercices WHERE id_dossier = :id_dossier),
        exerciceN AS (SELECT id, rang FROM exos WHERE id = :id_exercice),
        exerciceN1 AS (SELECT id FROM exos WHERE rang = (SELECT rang - 1 FROM exerciceN)),
        jn AS (SELECT NULLIF(TRIM(comptegen),'') AS compte_key, MIN(libellecompte) AS libellecompte, SUM(COALESCE(debit,0) - COALESCE(credit,0)) AS solde
                FROM journals WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = (SELECT id FROM exerciceN)
                ${date_debut && date_fin ? 'AND dateecriture BETWEEN :date_debut AND :date_fin' : ''}
                AND comptegen IS NOT NULL AND TRIM(comptegen) != '' GROUP BY NULLIF(TRIM(comptegen),'')),
        jn1 AS (SELECT NULLIF(TRIM(comptegen),'') AS compte_key, MIN(libellecompte) AS libellecompte, SUM(COALESCE(debit,0) - COALESCE(credit,0)) AS solde
                FROM journals WHERE id_compte = :id_compte AND id_dossier = :id_dossier AND id_exercice = (SELECT id FROM exerciceN1)
                AND comptegen IS NOT NULL AND TRIM(comptegen) != '' GROUP BY NULLIF(TRIM(comptegen),''))
        SELECT COALESCE(jn.compte_key, jn1.compte_key) AS compte, COALESCE(jn.libellecompte, jn1.libellecompte) AS libelle,
        COALESCE(jn.solde,0) AS "soldeN", COALESCE(jn1.solde * :facteurProrata,0) AS "soldeN1",
        COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0) AS var,
        CASE WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 AND COALESCE(jn.solde,0) = 0 THEN 0
             WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 AND COALESCE(jn.solde,0) != 0 THEN 100
             ELSE ROUND((((COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0)) / NULLIF(jn1.solde * :facteurProrata,0)) * 100)::numeric, 2) END AS "varPourcent",
        COALESCE(ca_periode.valide_anomalie, ca_null.valide_anomalie, false) AS "valide_anomalie",
        CASE WHEN COALESCE(jn1.solde * :facteurProrata,0) = 0 THEN false
             WHEN ABS((COALESCE(jn.solde,0) - COALESCE(jn1.solde * :facteurProrata,0)) / NULLIF(jn1.solde * :facteurProrata,0)) >= :seuilDecimal THEN true ELSE false END AS anomalies,
        COALESCE(ca_periode.commentaire, ca_null.commentaire, '') AS commentaire
        FROM jn FULL OUTER JOIN jn1 ON jn.compte_key = jn1.compte_key
        LEFT JOIN commentaireanalytiques ca_periode ON ca_periode.id_compte = :id_compte AND ca_periode.id_dossier = :id_dossier AND ca_periode.id_exercice = :id_exercice AND ca_periode.id_periode = :id_periode AND ca_periode.compte = COALESCE(jn.compte_key, jn1.compte_key)
        LEFT JOIN commentaireanalytiques ca_null ON ca_null.id_compte = :id_compte AND ca_null.id_dossier = :id_dossier AND ca_null.id_exercice = :id_exercice AND ca_null.id_periode IS NULL AND ca_null.compte = COALESCE(jn.compte_key, jn1.compte_key) AND ca_periode.id IS NULL
        ORDER BY compte`;

    const results = await db.sequelize.query(query, {
        replacements: { id_compte, id_dossier, id_exercice, id_periode: id_periode || null, facteurProrata, seuilDecimal, ...(date_debut && { date_debut }), ...(date_fin && { date_fin }) },
        type: db.Sequelize.QueryTypes.SELECT
    });

    return {
        dossier,
        exerciceN,
        results: results.map(r => ({
            compte: r.compte ? String(r.compte).trim().replace(/^"+|"+$/g, '') : '',
            libelle: r.libelle || '',
            soldeN: round2(parseFloat(r.soldeN) || 0),
            soldeN1: r.soldeN1 !== null && r.soldeN1 !== undefined ? round2(parseFloat(r.soldeN1)) : null,
            var: round2(parseFloat(r.var) || 0),
            varPourcent: r.varPourcent !== null && r.varPourcent !== undefined ? round2(parseFloat(r.varPourcent)) : null,
            valide_anomalie: !!r.valide_anomalie,
            anomalies: !!r.anomalies,
            commentaire: r.commentaire || ''
        })),
        date_debut,
        date_fin
    };
};

// Expose la fonction interne de récupération des données pour réutilisation
exports.getExportData = getRevuAnalytiqueData;

// Construit la section PDF (uniquement le tableau de données) réutilisable par un export global
exports.buildPdfSection = (data, ctx = {}) => {
    const { results } = data;

    const tableBody = [['Compte', 'Libellé', 'Solde N', 'Solde N-1', 'Variation', 'Variation %', 'Anomalies', 'Validé', 'Commentaire'].map(h => ({ text: h, style: 'tableHeader', alignment: 'center' }))];

    results.forEach((r, i) => {
        const rowColor = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
        tableBody.push([
            { text: r.compte, style: 'cell' },
            { text: r.libelle, style: 'cell' },
            { text: formatMontant(r.soldeN), alignment: 'right', style: 'cell' },
            { text: formatMontant(r.soldeN1 || 0), alignment: 'right', style: 'cell' },
            { text: formatMontant(r.var), alignment: 'right', style: 'cell' },
            { text: r.varPourcent !== null ? `${r.varPourcent}%` : '-', alignment: 'right', style: 'cell' },
            { text: r.anomalies ? 'Oui' : 'Non', alignment: 'center', style: 'cell' },
            { text: r.valide_anomalie ? 'Oui' : 'Non', alignment: 'center', style: 'cell' },
            { text: r.commentaire, style: 'cell' }
        ].map(cell => ({ ...cell, fillColor: rowColor })));
    });

    const content = [
        { table: { headerRows: 1, widths: ['10%', '25%', '12%', '12%', '12%', '10%', '8%', '6%', '5%'], body: tableBody }, layout: { fillColor: (ri) => ri === 0 ? '#E8EEF7' : ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF', hLineColor: () => '#E0E0E0', vLineColor: () => '#E0E0E0', hLineWidth: () => 0.3, vLineWidth: () => 0.3, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } }
    ];

    const styles = {
        tableHeader: { bold: true, fontSize: 8, color: '#2C3E50' },
        cell: { fontSize: 7, color: '#2C3E50' }
    };

    return { content, styles };
};

// Ajoute l'onglet 'Revue Analytique' au workbook passé en paramètre
exports.addExcelSheets = (workbook, data, ctx = {}) => {
    const { dossier, exerciceN, results, date_debut: dd, date_fin: df } = data;
    const logo = ctx.logo || tryReadLogo();
    const periodeText = (dd && df) ? `${formatDate(dd)} au ${formatDate(df)}` : `${formatDate(exerciceN?.date_debut)} au ${formatDate(exerciceN?.date_fin)}`;

    const ws = workbook.addWorksheet('Revue Analytique');

    if (logo?.buffer) {
        const imageId = workbook.addImage({ buffer: logo.buffer, extension: logo.extension || 'png' });
        ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 140, height: 45 } });
    }

    ws.mergeCells('A2:I2');
    ws.getCell('A2').value = 'REVUE ANALYTIQUE N/N-1';
    ws.getCell('A2').font = { bold: true, size: 14 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:I3');
    ws.getCell('A3').value = `Dossier : ${dossier?.dossier || ''}`;
    ws.getCell('A3').font = { bold: true, size: 11 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.mergeCells('A4:I4');
    ws.getCell('A4').value = `Période : ${periodeText}`;
    ws.getCell('A4').font = { bold: true, size: 9 };
    ws.getCell('A4').alignment = { horizontal: 'center' };

    ws.columns = [{ width: 12 }, { width: 35 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 10 }, { width: 8 }, { width: 30 }];

    const headerRow = ws.getRow(7);
    headerRow.values = ['Compte', 'Libellé', 'Solde N', 'Solde N-1', 'Variation', 'Variation %', 'Anomalies', 'Validé', 'Commentaire'];
    headerRow.font = { bold: true, size: 10 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF7' } };
    headerRow.alignment = { horizontal: 'center' };

    results.forEach((r, i) => {
        const row = ws.getRow(8 + i);
        row.values = [r.compte, r.libelle, r.soldeN, r.soldeN1 || 0, r.var, r.varPourcent !== null ? `${r.varPourcent}%` : '-', r.anomalies ? 'Oui' : 'Non', r.valide_anomalie ? 'Oui' : 'Non', r.commentaire];
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).numFmt = '#,##0.00';
        row.alignment = { horizontal: 'left' };
        row.getCell(3).alignment = { horizontal: 'right' };
        row.getCell(4).alignment = { horizontal: 'right' };
        row.getCell(5).alignment = { horizontal: 'right' };
        row.getCell(6).alignment = { horizontal: 'right' };
        row.getCell(7).alignment = { horizontal: 'center' };
        row.getCell(8).alignment = { horizontal: 'center' };
    });

    return ws;
};

// Export PDF
exports.exportPdf = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode, date_debut, date_fin } = req.query;

        const data = await getRevuAnalytiqueData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);
        const { dossier, exerciceN, date_debut: dd, date_fin: df } = data;

        const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };
        const printer = new PdfPrinter(fonts);
        const logo = tryReadLogo();

        const periodeText = (dd && df) ? `${formatDate(dd)} au ${formatDate(df)}` : `${formatDate(exerciceN?.date_debut)} au ${formatDate(exerciceN?.date_fin)}`;

        const headerColumns = [];
        if (logo?.dataUrl) headerColumns.push({ image: logo.dataUrl, width: 90 });
        headerColumns.push({
            width: '*',
            stack: [
                { text: 'REVUE ANALYTIQUE N/N-1', style: 'header', alignment: 'center' },
                { text: `Dossier : ${dossier?.dossier || ''}`, style: 'subheader', alignment: 'center' },
                { text: `Période : ${periodeText}`, style: 'subheader2', alignment: 'center' }
            ]
        });

        const section = exports.buildPdfSection(data, { logo });

        const docDefinition = {
            pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [15, 15, 15, 25],
            defaultStyle: { font: 'Helvetica', fontSize: 8 },
            content: [
                { columns: headerColumns, columnGap: 10, margin: [0, 0, 0, 15] },
                ...section.content
            ],
            styles: {
                header: { fontSize: 16, bold: true, color: '#2C3E50' },
                subheader: { fontSize: 10, bold: true, color: '#34495E', margin: [0, 2, 0, 2] },
                subheader2: { fontSize: 9, color: '#566573' },
                ...section.styles
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Revue_Analytique_${id_dossier}_${id_exercice}.pdf`);
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Erreur export PDF revuAnalytique:', error);
        return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
    }
};

// Export Excel
exports.exportExcel = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { id_periode, date_debut, date_fin } = req.query;

        const data = await getRevuAnalytiqueData(id_compte, id_dossier, id_exercice, id_periode, date_debut, date_fin);

        const workbook = new ExcelJS.Workbook();
        exports.addExcelSheets(workbook, data);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Revue_Analytique_${id_dossier}_${id_exercice}.xlsx`);
        workbook.worksheets.forEach(ws => applyKaontyStyle(ws));
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export Excel revuAnalytique:', error);
        return res.status(500).json({ state: false, message: 'Erreur serveur', error: error.message });
    }
};