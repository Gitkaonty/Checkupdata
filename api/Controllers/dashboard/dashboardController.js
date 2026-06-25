const db = require("../../Models");
const { journals, exercices, dossierplancomptables: DossierPlan, codejournals } = db;
const { Op } = require("sequelize");
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
    const mappedData = data.filter((item) => {
        const compteStr = item?.compte !== null && item?.compte !== undefined ? String(item.compte) : '';
        return compteStr.startsWith('7') || compteStr.startsWith('6');
    });

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
    const mappedData = data.filter((item) => {
        if (!item?.journal) return false;
        const compteStr = item?.compte !== null && item?.compte !== undefined ? String(item.compte) : '';
        return (
            compteStr.startsWith('61') ||
            compteStr.startsWith('62') ||
            compteStr.startsWith('63')
        );
    });

    const total = mappedData.reduce((acc, entry) => {
        const debit = parseFloat(entry.debit) || 0;
        const credit = parseFloat(entry.credit) || 0;
        return acc + (debit - credit);
    }, 0);

    return round2(total);
}

function calculateResultatDepensesSalariales(data) {
    const mappedData = data.filter((item) => {
        const compteStr = item?.compte !== null && item?.compte !== undefined ? String(item.compte) : '';
        return compteStr.startsWith('64') || compteStr.startsWith('65');
    });

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

// Charge uniquement les colonnes nécessaires aux calculs (compte, journal, date, débit, crédit),
// en SQL brut → pas d'hydratation ORM ni de .toJSON() sur 40k+ lignes. dateecriture est formatée
// en 'YYYY-MM-DD' pour un comportement identique aux calculs existants (new Date(...)).
const getJournalData = async (id_compte, id_dossier, id_exercice, date_debut = null, date_fin = null) => {
    const replacements = { id_compte, id_dossier, id_exercice };
    let dateFilter = '';
    if (date_debut && date_fin) {
        dateFilter = ' AND J.dateecriture BETWEEN :date_debut AND :date_fin';
        replacements.date_debut = date_debut;
        replacements.date_fin = date_fin;
    }

    const rows = await db.sequelize.query(
        `SELECT
            PC.compte AS compte,
            CJ.code AS journal,
            to_char(J.dateecriture, 'YYYY-MM-DD') AS dateecriture,
            J.debit,
            J.credit
         FROM journals J
         INNER JOIN dossierplancomptables PC ON PC.id = J.id_numcpt
         LEFT JOIN codejournals CJ ON CJ.id = J.id_journal
         WHERE J.id_compte = :id_compte
           AND J.id_dossier = :id_dossier
           AND J.id_exercice = :id_exercice${dateFilter}
         ORDER BY J.dateecriture ASC`,
        { replacements, type: db.sequelize.QueryTypes.SELECT }
    );

    return rows;
}

exports.getAllInfo = async (req, res) => {
    try {
        const { id_compte, id_dossier, id_exercice } = req.params;
        const { date_debut, date_fin, id_periode } = req.query; // Dates et id de periode si selectionnee

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        const exerciceNData = await exercices.findByPk(id_exercice);
        if (!exerciceNData) {
            return res.status(404).json({ state: false, message: "Exercice non trouvé" });
        }

        // Utiliser les dates de periode si fournies, sinon utiliser les dates de l'exercice
        const periodeDebut = date_debut || exerciceNData?.date_debut;
        const periodeFin = date_fin || exerciceNData?.date_fin;

        const moisN = getMonthsBetween(periodeDebut, periodeFin);

        const moisNMapped = moisN.map(val => val?.label + val?.year);
        // Chargement léger (SQL brut, colonnes utiles uniquement) avec filtre de période si applicable
        const mappedData = await getJournalData(id_compte, id_dossier, id_exercice, date_debut, date_fin);

        // === Exercice N ===
        const chiffreAffaireN = calculateChiffreAffaire(mappedData, moisN);
        const margeBruteN = calculateMargeBrute(mappedData, moisN);
        const margeBruteTotalN = chiffreAffaireN.map((val, i) => round2(val + margeBruteN[i]));
        const tresorerieBanqueN = calculateTresorerieBanque(mappedData, moisN);
        const tresorerieCaisseN = calculateTresorerieCaisse(mappedData, moisN);

        const resultatN = calculateResultat(mappedData);
        const resultatChiffreAffaireN = calculateResultatChiffreAffaire(mappedData);
        const resultatDepenseAchatN = calculateResultatDepensesAchats(mappedData);
        const resultatDepenseSalarialeN = calculateResultatDepensesSalariales(mappedData);
        const resultatTresorerieBanqueN = calculateResultatTresoreriesBanques(mappedData);
        const resultatTresorerieCaisseN = calculateResultatTresoreriesCaisses(mappedData);

        // === Exercice N-1 ===
        const { id_exerciceN1 } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exercice);

        // Calcul du facteur de proratisation
        let facteurProrata = 1;
        let nbrMoisPeriodeN = null;
        let nbrMoisTotalN1 = null;

        if (id_exerciceN1) {
            const exerciceN1DataForProrata = await exercices.findByPk(id_exerciceN1);
            if (exerciceN1DataForProrata && exerciceN1DataForProrata.date_debut && exerciceN1DataForProrata.date_fin) {
                // Nombre de mois total de l'exercice N-1
                const debutN1 = new Date(exerciceN1DataForProrata.date_debut);
                const finN1 = new Date(exerciceN1DataForProrata.date_fin);
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
        }

        let chiffreAffaireN1 = [],
            margeBruteN1 = [],
            margeBruteTotalN1 = [],
            tresorerieBanqueN1 = [],
            tresorerieCaisseN1 = [],
            moisN1 = [],
            moisN1Mapped = [],

            resultatN1 = 0,
            resultatN2 = 0,
            resultatN3 = 0,
            variationResultatN = 0,
            variationResultatN1 = 0,
            variationResultatN2 = 0,
            evolutionResultatN = '',
            evolutionResultatN1 = '',

            resultatChiffreAffaireN1 = 0,
            resultatChiffreAffaireN2 = 0,
            resultatChiffreAffaireN3 = 0,
            variationChiffreAffaireN = 0,
            variationChiffreAffaireN1 = 0,
            variationChiffreAffaireN2 = 0,
            evolutionChiffreAffaireN = '',
            evolutionChiffreAffaireN1 = '',

            resultatDepenseAchatN1 = 0,
            resultatDepenseAchatN2 = 0,
            resultatDepenseAchatN3 = 0,
            variationDepenseAchatN = 0,
            variationDepenseAchatN1 = 0,
            variationDepenseAchatN2 = 0,
            evolutionDepenseAchatN = '',
            evolutionDepenseAchatN1 = '',

            resultatDepenseSalarialeN1 = 0,
            resultatDepenseSalarialeN2 = 0,
            resultatDepenseSalarialeN3 = 0,
            variationDepenseSalarialeN = 0,
            variationDepenseSalarialeN1 = 0,
            variationDepenseSalarialeN2 = 0,
            evolutionDepenseSalarialeN = '',
            evolutionDepenseSalarialeN1 = '',

            resultatTresorerieBanqueN1 = 0,
            resultatTresorerieBanqueN2 = 0,
            resultatTresorerieBanqueN3 = 0,
            variationTresorerieBanqueN = 0,
            variationTresorerieBanqueN1 = 0,
            variationTresorerieBanqueN2 = 0,
            evolutionTresorerieBanqueN = '',
            evolutionTresorerieBanqueN1 = '',

            resultatTresorerieCaisseN1 = 0,
            resultatTresorerieCaisseN2 = 0,
            resultatTresorerieCaisseN3 = 0,
            variationTresorerieCaisseN = 0,
            variationTresorerieCaisseN1 = 0,
            variationTresorerieCaisseN2 = 0,
            evolutionTresorerieCaisseN = '',
            evolutionTresorerieCaisseN1 = ''

        let id_exerciceN2 = null;
        let id_exerciceN3 = null;

        if (id_exerciceN1) {

            const exerciceN1Data = await exercices.findByPk(id_exerciceN1);

            const startYearN1 = new Date(exerciceN1Data?.date_debut).getFullYear();

            const moisN1Aligned = moisN.map(({ month, label }, idx) => {
                const totalMonth = month;
                return {
                    label,
                    month: totalMonth,
                    year: startYearN1 + (month < moisN[0].month ? 1 : 0)
                };
            });

            moisN1 = getMonthsBetween(exerciceN1Data?.date_debut, exerciceN1Data?.date_fin);

            moisN1Mapped = moisN1.map(val => val?.label + val?.year);

            const mappedDataN1 = await getJournalData(id_compte, id_dossier, id_exerciceN1);

            const { id_exerciceN1: id_exerciceN2Temp } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exerciceN1);
            id_exerciceN2 = id_exerciceN2Temp || null;

            chiffreAffaireN1 = calculateChiffreAffaire(mappedDataN1, moisN1Aligned);
            margeBruteN1 = calculateMargeBrute(mappedDataN1, moisN1Aligned);
            margeBruteTotalN1 = chiffreAffaireN1.map((val, i) => round2(val + margeBruteN1[i]));
            tresorerieBanqueN1 = calculateTresorerieBanque(mappedDataN1, moisN1Aligned);
            tresorerieCaisseN1 = calculateTresorerieCaisse(mappedDataN1, moisN1Aligned);

            resultatN1 = round2(calculateResultat(mappedDataN1) * facteurProrata);

            resultatChiffreAffaireN1 = round2(calculateResultatChiffreAffaire(mappedDataN1) * facteurProrata);
            resultatDepenseAchatN1 = round2(calculateResultatDepensesAchats(mappedDataN1) * facteurProrata);
            resultatDepenseSalarialeN1 = round2(calculateResultatDepensesSalariales(mappedDataN1) * facteurProrata);
            resultatTresorerieBanqueN1 = round2(calculateResultatTresoreriesBanques(mappedDataN1) * facteurProrata);
            resultatTresorerieCaisseN1 = round2(calculateResultatTresoreriesCaisses(mappedDataN1) * facteurProrata);

        }

        if (id_exerciceN2) {

            const { id_exerciceN1: id_exerciceN3Temp } = await recupExerciceN1.recupInfos(id_compte, id_dossier, id_exerciceN2);
            id_exerciceN3 = id_exerciceN3Temp || null;

            const mappedDataN2 = await getJournalData(id_compte, id_dossier, id_exerciceN2);

            resultatN2 = calculateResultat(mappedDataN2);
            resultatChiffreAffaireN2 = calculateResultatChiffreAffaire(mappedDataN2);
            resultatDepenseAchatN2 = calculateResultatDepensesAchats(mappedDataN2);
            resultatDepenseSalarialeN2 = calculateResultatDepensesSalariales(mappedDataN2);
            resultatTresorerieBanqueN2 = calculateResultatTresoreriesBanques(mappedDataN2);
            resultatTresorerieCaisseN2 = calculateResultatTresoreriesCaisses(mappedDataN2);
        }

        if (id_exerciceN3) {

            const mappedDataN3 = await getJournalData(id_compte, id_dossier, id_exerciceN3);

            resultatN3 = calculateResultat(mappedDataN3);
            resultatChiffreAffaireN3 = calculateResultatChiffreAffaire(mappedDataN3);
            resultatDepenseAchatN3 = calculateResultatDepensesAchats(mappedDataN3);
            resultatDepenseSalarialeN3 = calculateResultatDepensesSalariales(mappedDataN3);
            resultatTresorerieBanqueN3 = calculateResultatTresoreriesBanques(mappedDataN3);
            resultatTresorerieCaisseN3 = calculateResultatTresoreriesCaisses(mappedDataN3);
        }

        // Resultat
        variationResultatN = safeVariation(resultatN, resultatN1);
        variationResultatN1 = safeVariation(resultatN1, resultatN2);
        variationResultatN2 = safeVariation(resultatN2, resultatN3);

        evolutionResultatN = getEvolution(variationResultatN, variationResultatN1);
        evolutionResultatN1 = getEvolution(variationResultatN1, variationResultatN2);

        // Chiffre d'affaires
        variationChiffreAffaireN = safeVariation(resultatChiffreAffaireN, resultatChiffreAffaireN1);
        variationChiffreAffaireN1 = safeVariation(resultatChiffreAffaireN1, resultatChiffreAffaireN2);
        variationChiffreAffaireN2 = safeVariation(resultatChiffreAffaireN2, resultatChiffreAffaireN3);

        evolutionChiffreAffaireN = getEvolution(variationChiffreAffaireN, variationChiffreAffaireN1);
        evolutionChiffreAffaireN1 = getEvolution(variationChiffreAffaireN1, variationChiffreAffaireN2);

        // Depenses achat
        variationDepenseAchatN = safeVariation(resultatDepenseAchatN, resultatDepenseAchatN1);
        variationDepenseAchatN1 = safeVariation(resultatDepenseAchatN1, resultatDepenseAchatN2)
        variationDepenseAchatN2 = safeVariation(resultatDepenseAchatN2, resultatDepenseAchatN3);

        evolutionDepenseAchatN = getEvolution(variationDepenseAchatN, variationDepenseAchatN1);
        evolutionDepenseAchatN1 = getEvolution(variationDepenseAchatN1, variationDepenseAchatN2);

        // Depenses salariales
        variationDepenseSalarialeN = safeVariation(resultatDepenseSalarialeN, resultatDepenseSalarialeN1);
        variationDepenseSalarialeN1 = safeVariation(resultatDepenseSalarialeN1, resultatDepenseSalarialeN2);
        variationDepenseSalarialeN2 = safeVariation(resultatDepenseSalarialeN2, resultatDepenseSalarialeN3);

        evolutionDepenseSalarialeN = getEvolution(variationDepenseSalarialeN, variationDepenseSalarialeN1);
        evolutionDepenseSalarialeN1 = getEvolution(variationDepenseSalarialeN1, variationDepenseSalarialeN2);

        // Tresorerie banque
        variationTresorerieBanqueN = safeVariation(resultatTresorerieBanqueN, resultatTresorerieBanqueN1);
        variationTresorerieBanqueN1 = safeVariation(resultatTresorerieBanqueN1, resultatTresorerieBanqueN2);
        variationTresorerieBanqueN2 = safeVariation(resultatTresorerieBanqueN2, resultatTresorerieBanqueN3);

        evolutionTresorerieBanqueN = getEvolution(variationTresorerieBanqueN, variationTresorerieBanqueN1);
        evolutionTresorerieBanqueN1 = getEvolution(variationTresorerieBanqueN1, variationTresorerieBanqueN2);

        // Tresorerie caisse
        variationTresorerieCaisseN = safeVariation(resultatTresorerieCaisseN, resultatTresorerieCaisseN1);
        variationTresorerieCaisseN1 = safeVariation(resultatTresorerieCaisseN1, resultatTresorerieCaisseN2);
        variationTresorerieCaisseN2 = safeVariation(resultatTresorerieCaisseN2, resultatTresorerieCaisseN3);

        evolutionTresorerieCaisseN = getEvolution(variationTresorerieCaisseN, variationTresorerieCaisseN1);
        evolutionTresorerieCaisseN1 = getEvolution(variationTresorerieCaisseN1, variationTresorerieCaisseN2);

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
            variationChiffreAffaireN1,
            evolutionChiffreAffaireN,
            evolutionChiffreAffaireN1,

            resultatDepenseAchatN,
            resultatDepenseAchatN1,
            variationDepenseAchatN,
            variationDepenseAchatN1,
            evolutionDepenseAchatN,
            evolutionDepenseAchatN1,

            resultatDepenseSalarialeN,
            resultatDepenseSalarialeN1,
            variationDepenseSalarialeN,
            variationDepenseSalarialeN1,
            evolutionDepenseSalarialeN,
            evolutionDepenseSalarialeN1,

            resultatTresorerieBanqueN,
            resultatTresorerieBanqueN1,
            variationTresorerieBanqueN,
            variationTresorerieBanqueN1,
            evolutionTresorerieBanqueN,
            evolutionTresorerieBanqueN1,

            resultatTresorerieCaisseN,
            resultatTresorerieCaisseN1,
            variationTresorerieCaisseN,
            variationTresorerieCaisseN1,
            evolutionTresorerieCaisseN,
            evolutionTresorerieCaisseN1,

            resultatN,
            resultatN1,
            variationResultatN,
            variationResultatN1,
            evolutionResultatN,
            evolutionResultatN1,

            moisN: moisNMapped,
            moisN1: moisN1Mapped,

            state: true,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.getListeJournalEnAttente = async (req, res) => {
    try {
        const { id_dossier, id_compte, id_exercice } = req.params;
        const { date_debut, date_fin } = req.query; // Dates de periode si selectionnee

        if (!id_compte || !id_dossier || !id_exercice) {
            return res.status(400).json({ state: false, message: 'Paramètres manquants' });
        }

        // Construire la clause where avec filtre de periode si applicable
        const whereClause = {
            id_dossier,
            id_compte,
            id_exercice,
        };
        if (date_debut && date_fin) {
            whereClause.dateecriture = {
                [Op.between]: [new Date(date_debut), new Date(date_fin)]
            };
        }

        const journaleEnAttente = await journals.findAll({
            where: whereClause,
            include: [
                {
                    model: DossierPlan,
                    attributes: ['compte'],
                    where: {
                        id_dossier,
                        id_compte,
                        compte: { [Op.like]: `47%` },
                    },
                    required: true
                },
                {
                    model: codejournals,
                    attributes: ['code']
                }
            ],
            order: [['dateecriture', 'ASC']]
        })

        const journalMapped = journaleEnAttente.map((j) => {
            const { dossierplancomptable, codejournal, ...rest } = j.toJSON();
            return {
                ...rest,
                compte: dossierplancomptable?.compte,
                codejournal: codejournal?.code
            }
        })

        return res.status(200).json(journalMapped);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}