const db = require("../../Models");
const recupExerciceN1 = require('../../Middlewares/Standard/recupExerciceN1');

function getMonthsBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
        months.push({
            label: current.toLocaleString('fr-FR', { month: 'short' }),
            month: current.getMonth(),
            year: current.getFullYear(),
        });
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}

const round2 = (value) => Math.round(value * 100) / 100;

function calculateChiffreAffaire(data, months) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('70')
    );

    const monthlyTotals = months.map(({ month, year }) => {
        const entries = mappedData.filter(entry => {
            const date = new Date(entry.dateecriture);
            return date.getMonth() === month && date.getFullYear() === year;
        });

        const total = entries.reduce((acc, entry) => {
            const debit = parseFloat(entry.debit) || 0;
            const credit = parseFloat(entry.credit) || 0;
            return acc + (credit - debit);
        }, 0);

        return round2(total);
    });

    let runningTotal = 0;
    const cumulativeTotals = monthlyTotals.map(total => {
        runningTotal += total;
        return round2(runningTotal);
    });

    return cumulativeTotals;
}

function calculateMargeBrute(data, months) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('60')
    );

    const monthlyTotals = months.map(({ month, year }) => {
        const entries = mappedData.filter(entry => {
            const date = new Date(entry.dateecriture);
            return date.getMonth() === month && date.getFullYear() === year;
        });

        const total = entries.reduce((acc, entry) => {
            const debit = parseFloat(entry.debit) || 0;
            const credit = parseFloat(entry.credit) || 0;
            return acc + (credit - debit);
        }, 0);

        return round2(total);
    });

    let runningTotal = 0;
    const cumulativeTotals = monthlyTotals.map(total => {
        runningTotal += total;
        return round2(runningTotal);
    });

    return cumulativeTotals;
}

function calculateTresorerieBanque(data, months) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('512')
    );

    const monthlyTotals = months.map(({ month, year }) => {
        const entries = mappedData.filter(entry => {
            const date = new Date(entry.dateecriture);
            return date.getMonth() === month && date.getFullYear() === year;
        });

        const total = entries.reduce((acc, entry) => {
            const debit = parseFloat(entry.debit) || 0;
            const credit = parseFloat(entry.credit) || 0;
            return acc + (debit - credit);
        }, 0);

        return round2(total);
    });

    let runningTotal = 0;
    const cumulativeTotals = monthlyTotals.map(total => {
        runningTotal += total;
        return round2(runningTotal);
    });

    return cumulativeTotals;
}

function calculateTresorerieCaisse(data, months) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('53')
    );

    const monthlyTotals = months.map(({ month, year }) => {
        const entries = mappedData.filter(entry => {
            const date = new Date(entry.dateecriture);
            return date.getMonth() === month && date.getFullYear() === year;
        });

        const total = entries.reduce((acc, entry) => {
            const debit = parseFloat(entry.debit) || 0;
            const credit = parseFloat(entry.credit) || 0;
            return acc + (debit - credit);
        }, 0);

        return round2(total);
    });

    let runningTotal = 0;
    const cumulativeTotals = monthlyTotals.map(total => {
        runningTotal += total;
        return round2(runningTotal);
    });

    return cumulativeTotals;
}

function calculateResultat(data) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('7') || item.compte.toString().startsWith('6')
    );

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (credit - debit);
    }, 0);

    return round2(total);
}

function calculateResultatChiffreAffaire(data) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('70')
    );

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (credit - debit);
    }, 0);

    return round2(total);
}

function calculateResultatDepensesAchats(data) {
    const mappedData = data.filter(
        item => item.compte && item.journal &&
            item.compte.toString().startsWith('61')
            || item.compte.toString().startsWith('62')
            || item.compte.toString().startsWith('63')
    );

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (debit - credit);
    }, 0);

    return round2(total);
}

function calculateResultatDepensesSalariales(data) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('64') || item.compte.toString().startsWith('65')
    );

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (debit - credit);
    }, 0);

    return round2(total);
}

function calculateResultatTresoreriesBanques(data) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('512')
    );

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (debit - credit);
    }, 0);

    return round2(total);
}

function calculateResultatTresoreriesCaisses(data) {
    const mappedData = data.filter(
        item => item.compte && item.compte.toString().startsWith('53')
    );

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (debit - credit);
    }, 0);

    return round2(total);
}

const safeVariation = (a, b) => {
    if (b === 0) return a === 0 ? 0 : 100 * Math.sign(a);
    return ((a - b) / Math.abs(b)) * 100;
};

const getEvolution = (currentVar, previousVar) => {
    if (currentVar === previousVar) return 'stable';

    const currentAbs = Math.abs(currentVar);
    const previousAbs = Math.abs(previousVar);

    if (currentVar >= 0 && previousVar >= 0) {
        return currentVar > previousVar ? 'augmentation' : 'diminution';
    }

    if (currentVar <= 0 && previousVar <= 0) {
        return currentAbs < previousAbs ? 'augmentation' : 'diminution';
    }

    if (currentVar < 0 && previousVar >= 0) {
        return 'diminution';
    }

    if (currentVar >= 0 && previousVar < 0) {
        return 'augmentation';
    }

    return 'stable';
};

const getJournalData = async (id_compte, id_dossier, id_exercice) => {

    const rows = await db.sequelize.query(`
        SELECT 
            j.compteaux AS compte,
            j.debit, 
            j.credit,
            j.dateecriture,
            cj.code
        FROM journals j
        LEFT JOIN CODEJOURNALS cj ON cj.ID = J.ID_JOURNAL
        WHERE
            j.id_compte = :id_compte
            AND j.id_dossier = :id_dossier
            AND j.id_exercice = :id_exercice
            AND cj.id_compte = :id_compte
            AND cj.id_dossier = :id_dossier
        ORDER BY j.dateecriture ASC
    `, {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id_compte, id_dossier, id_exercice }
    })
    return rows;
}

const getJournalsAnalytiqueData = async (id_compte, id_dossier, id_exercice, id_axe, id_section) => {
    const rows = await db.sequelize.query(`
        SELECT
            J.COMPTEAUX AS COMPTE,
            SUM(A.DEBIT) AS DEBIT,
            SUM(A.CREDIT) AS CREDIT,
            MAX(J.DATEECRITURE) AS DATEECRITURE,
            MAX(CJ.CODE) AS CODE
        FROM
            ANALYTIQUES A
            LEFT JOIN JOURNALS J ON J.ID = A.ID_LIGNE_ECRITURE
            LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
        WHERE
            A.ID_COMPTE = :id_compte
            AND A.ID_DOSSIER = :id_dossier
            AND A.ID_EXERCICE = :id_exercice
            AND A.ID_AXE = :id_axe
            AND A.ID_SECTION IN (:id_section)
            AND J.ID_COMPTE = :id_compte
            AND J.ID_DOSSIER = :id_dossier
            AND J.ID_EXERCICE = :id_exercice
            AND CJ.ID_COMPTE = :id_compte
            AND CJ.ID_DOSSIER = :id_dossier
        GROUP BY
            J.COMPTEAUX
        ORDER BY
            MAX(J.DATEECRITURE) ASC
    `, {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id_compte, id_dossier, id_exercice, id_axe, id_section }
    })

    return rows;
}

const getJournalsEnAttente = async (id_compte, id_dossier, id_exercice, avecAnalytique, id_axe, id_section) => {
    let rows = null;
    if (avecAnalytique) {
        rows = await db.sequelize.query(`
            SELECT
            J.COMPTEAUX AS COMPTE,
            SUM(A.DEBIT) AS DEBIT,
            SUM(A.CREDIT) AS CREDIT,
            MAX(J.DATEECRITURE) AS DATEECRITURE,
            MAX(CJ.CODE) AS codejournal,
            MAX(J.LIBELLE) AS libelle
        FROM
            ANALYTIQUES A
            LEFT JOIN JOURNALS J ON J.ID = A.ID_LIGNE_ECRITURE
            LEFT JOIN CODEJOURNALS CJ ON CJ.ID = J.ID_JOURNAL
        WHERE
            A.ID_COMPTE = :id_compte
            AND A.ID_DOSSIER = :id_dossier
            AND A.ID_EXERCICE = :id_exercice
            AND A.ID_AXE = :id_axe
            AND A.ID_SECTION IN (:id_section)
            AND J.ID_COMPTE = :id_compte
            AND J.ID_DOSSIER = :id_dossier
            AND J.ID_EXERCICE = :id_exercice
            AND CJ.ID_COMPTE = :id_compte
            AND CJ.ID_DOSSIER = :id_dossier
            AND J.COMPTEAUX LIKE '4%'
        GROUP BY
            J.COMPTEAUX
        ORDER BY
            MAX(J.DATEECRITURE) ASC
        `, {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice, id_axe, id_section }
        })
    } else {
        rows = await db.sequelize.query(`
            SELECT 
                j.compteaux AS compte,
                j.dateecriture,
                cj.code AS codejournal,
                j.libelle,
                j.debit,
                j.credit
            FROM JOURNALS j
            LEFT JOIN CODEJOURNALS cj ON cj.ID = J.ID_JOURNAL
            WHERE 
                j.id_dossier = :id_dossier
                AND j.id_exercice = :id_exercice
                AND j.id_compte = :id_compte
                AND cj.id_compte = :id_compte
                AND cj.id_compte = :id_compte
                AND j.compteaux like '47%'
            ORDER BY 
                j.dateecriture ASC
    `, {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { id_compte, id_dossier, id_exercice }
        })
    }
    return rows;
}

const getExerciceById = async (id) => {
    const rows = await db.sequelize.query(`
        SELECT 
            ex.date_debut,
            ex.date_fin
        FROM exercices ex
        WHERE 
            id = :id
    `, {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id }
    });
    return rows;
}

exports.getAllInfo = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice, avecAnalytique, id_axe, id_sections } = req.body;

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        const exerciceNData = await getExerciceById(id_exercice);
        if (!exerciceNData) {
            return res.status(404).json({ state: false, message: "Exercice non trouvé" });
        }

        const moisN = getMonthsBetween(exerciceNData[0]?.date_debut, exerciceNData[0]?.date_fin);

        const moisNMapped = moisN.map(val => val.label + val.year);

        const mappedDataN = await getJournalData(id_compte, id_dossier, id_exercice);
        let mappedDataAnalytiqueN = [];
        if (avecAnalytique) {
            mappedDataAnalytiqueN = await getJournalsAnalytiqueData(id_compte, id_dossier, id_exercice, id_axe, id_sections)
        }
        const mappedDataConditionN = avecAnalytique ? mappedDataAnalytiqueN : mappedDataN;

        // === Exercice N ===
        const chiffreAffaireN = calculateChiffreAffaire(mappedDataConditionN, moisN);
        const margeBruteN = calculateMargeBrute(mappedDataConditionN, moisN);
        const margeBruteTotalN = chiffreAffaireN.map((val, i) => round2(val + margeBruteN[i]));
        const tresorerieBanqueN = calculateTresorerieBanque(mappedDataN, moisN);
        const tresorerieCaisseN = calculateTresorerieCaisse(mappedDataN, moisN);

        const resultatN = calculateResultat(mappedDataConditionN);
        const resultatChiffreAffaireN = calculateResultatChiffreAffaire(mappedDataConditionN);
        const resultatDepenseAchatN = calculateResultatDepensesAchats(mappedDataConditionN);
        const resultatDepenseSalarialeN = calculateResultatDepensesSalariales(mappedDataConditionN);
        const resultatTresorerieBanqueN = calculateResultatTresoreriesBanques(mappedDataN);
        const resultatTresorerieCaisseN = calculateResultatTresoreriesCaisses(mappedDataN);

        // === Exercice N-1 ===
        const { id_exerciceN1 } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

        let chiffreAffaireN1 = [],
            margeBruteN1 = [],
            margeBruteTotalN1 = [],
            tresorerieBanqueN1 = [],
            tresorerieCaisseN1 = [],
            moisN1 = [],
            moisN1Mapped = [],

            resultatN1 = 0,
            variationResultatN = 0,
            variationResultatN1 = 0,
            evolutionResultatN = '',

            resultatChiffreAffaireN1 = 0,
            variationChiffreAffaireN = 0,
            variationChiffreAffaireN1 = 0,
            evolutionChiffreAffaireN = '',

            resultatDepenseAchatN1 = 0,
            variationDepenseAchatN = 0,
            variationDepenseAchatN1 = 0,
            evolutionDepenseAchatN = '',

            resultatDepenseSalarialeN1 = 0,
            variationDepenseSalarialeN = 0,
            variationDepenseSalarialeN1 = 0,
            evolutionDepenseSalarialeN = '',

            resultatTresorerieBanqueN1 = 0,
            variationTresorerieBanqueN = 0,
            variationTresorerieBanqueN1 = 0,
            evolutionTresorerieBanqueN = '',

            resultatTresorerieCaisseN1 = 0,
            variationTresorerieCaisseN = 0,
            variationTresorerieCaisseN1 = 0,
            evolutionTresorerieCaisseN = ''

        if (id_exerciceN1) {
            const exerciceN1Data = await getExerciceById(id_exerciceN1);
            const startYearN1 = new Date(exerciceN1Data[0]?.date_debut).getFullYear();

            const moisN1Aligned = moisN.map(({ month, label }, idx) => {
                const totalMonth = month;
                return {
                    label,
                    month: totalMonth,
                    year: startYearN1 + (month < moisN[0].month ? 1 : 0)
                };
            });

            // console.log('moisN1Aligned : ', moisN1Aligned);

            // moisN1 = getMonthsBetween(exerciceN1Data[0]?.date_debut, exerciceN1Data[0]?.date_fin);

            // moisN1Mapped = moisN1.map(val => val.label + ' ' + val.year);

            const mappedDataN1 = await getJournalData(id_compte, id_dossier, id_exerciceN1);
            let mappedDataAnalytiqueN1 = [];
            if (avecAnalytique) {
                mappedDataAnalytiqueN1 = await getJournalsAnalytiqueData(id_compte, id_dossier, id_exerciceN1, id_axe, id_sections);
            }
            const mappedDataConditionN1 = avecAnalytique ? mappedDataAnalytiqueN1 : mappedDataN1;

            chiffreAffaireN1 = calculateChiffreAffaire(mappedDataConditionN1, moisN1Aligned);

            margeBruteN1 = calculateMargeBrute(mappedDataConditionN1, moisN1Aligned);
            margeBruteTotalN1 = chiffreAffaireN1.map((val, i) => round2(val + margeBruteN1[i]));
            tresorerieBanqueN1 = calculateTresorerieBanque(mappedDataN1, moisN1Aligned);
            tresorerieCaisseN1 = calculateTresorerieCaisse(mappedDataN1, moisN1Aligned);

            resultatN1 = calculateResultat(mappedDataConditionN1);

            resultatChiffreAffaireN1 = calculateResultatChiffreAffaire(mappedDataConditionN1);
            resultatDepenseAchatN1 = calculateResultatDepensesAchats(mappedDataConditionN1);
            resultatDepenseSalarialeN1 = calculateResultatDepensesSalariales(mappedDataConditionN1);
            resultatTresorerieBanqueN1 = calculateResultatTresoreriesBanques(mappedDataN1);
            resultatTresorerieCaisseN1 = calculateResultatTresoreriesCaisses(mappedDataN1);
        }
        // Resultat
        variationResultatN = safeVariation(resultatN, resultatN1);
        evolutionResultatN = getEvolution(variationResultatN, variationResultatN1);

        // Chiffre d'affaires
        variationChiffreAffaireN = safeVariation(resultatChiffreAffaireN, resultatChiffreAffaireN1);
        evolutionChiffreAffaireN = getEvolution(variationChiffreAffaireN, variationChiffreAffaireN1);

        // Depenses achat
        variationDepenseAchatN = safeVariation(resultatDepenseAchatN, resultatDepenseAchatN1);
        evolutionDepenseAchatN = getEvolution(variationDepenseAchatN, variationDepenseAchatN1);

        // Depenses salariales
        variationDepenseSalarialeN = safeVariation(resultatDepenseSalarialeN, resultatDepenseSalarialeN1);
        evolutionDepenseSalarialeN = getEvolution(variationDepenseSalarialeN, variationDepenseSalarialeN1);

        // Tresorerie banque
        variationTresorerieBanqueN = safeVariation(resultatTresorerieBanqueN, resultatTresorerieBanqueN1);
        evolutionTresorerieBanqueN = getEvolution(variationTresorerieBanqueN, variationTresorerieBanqueN1);

        // Tresorerie caisse
        variationTresorerieCaisseN = safeVariation(resultatTresorerieCaisseN, resultatTresorerieCaisseN1);
        evolutionTresorerieCaisseN = getEvolution(variationTresorerieCaisseN, variationTresorerieCaisseN1);

        // console.log('moisNMapped : ', moisNMapped);
        // console.log('moisN1Mapped : ', moisN1Mapped);

        return res.json({

            chiffreAffaireN,
            chiffreAffaireN1,
            margeBruteTotalN,
            margeBruteTotalN1,
            tresorerieBanqueN,
            tresorerieBanqueN1,
            tresorerieCaisseN,
            tresorerieCaisseN1,

            resultatChiffreAffaireN,
            resultatChiffreAffaireN1,
            variationChiffreAffaireN,
            evolutionChiffreAffaireN,

            resultatDepenseAchatN,
            resultatDepenseAchatN1,
            variationDepenseAchatN,
            evolutionDepenseAchatN,

            resultatDepenseSalarialeN,
            resultatDepenseSalarialeN1,
            variationDepenseSalarialeN,
            evolutionDepenseSalarialeN,

            resultatTresorerieBanqueN,
            resultatTresorerieBanqueN1,
            variationTresorerieBanqueN,
            evolutionTresorerieBanqueN,

            resultatTresorerieCaisseN,
            resultatTresorerieCaisseN1,
            variationTresorerieCaisseN,
            evolutionTresorerieCaisseN,

            resultatN,
            resultatN1,
            variationResultatN,
            evolutionResultatN,

            moisNMapped,

            state: true,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.getListeJournalEnAttente = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice, avecAnalytique, id_axe, id_sections } = req.body;
        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        const rows = await getJournalsEnAttente(id_compte, id_dossier, id_exercice, avecAnalytique, id_axe, id_sections);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}