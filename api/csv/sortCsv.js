const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, './compte_rubrique_externe');
const outputFile = path.join(__dirname, 'compte_rubrique_externe_sorted.csv');

// Lire le fichier CSV
const data = fs.readFileSync(inputFile, 'utf8');

// Séparer les lignes et filtrer les vides
const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

// Transformer chaque ligne en tableau
const rows = lines.map(line => line.split(','));

// Trier selon la première colonne (en nombre)
rows.sort((a, b) => Number(a[0]) - Number(b[0]));

// Recomposer le CSV
const sortedCsv = rows.map(row => row.join(',')).join('\n');

// Écrire le fichier trié
fs.writeFileSync(outputFile, sortedCsv, 'utf8');

