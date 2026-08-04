const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, './compte_rubrique_externe_sorted.csv');
const outputFile = path.join(__dirname, '20251023-comptesrubriquesexternes-seeder.js');

// Lire le CSV
const data = fs.readFileSync(inputFile, 'utf8');

// Séparer et filtrer les lignes vides
const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

  const normalize = s => {
    if (s === undefined) return null;
    const trimmed = s.trim();
    // si champ était "" ou vide -> return null
    if (trimmed === '' ) return null;
    return trimmed;
  };

// Transformer en objets JS sans guillemets autour des clés
const entries = lines.map(line => {
  const [id, id_rubrique, id_etat, compte, nature, senscalcul, condition, equation, par_default, active, tableau] = line.split(',');

  return `{
    id_rubrique: ${Number(id_rubrique)},
    id_etat: '${id_etat}',
    tableau : '${tableau}',
    compte: '${compte}',
    nature: '${nature}',
    senscalcul: ${senscalcul === null ? null : `'${senscalcul}'`},
    condition: ${condition === null ? null : `'${condition}'`},
    equation: '${equation}',
    par_default : true,
    active : true,
    createdAt: new Date(),
    updatedAt: new Date()
  }`;
});

// Construire le contenu du fichier seeder
const seederContent = `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rubriquesexternes', [
      ${entries.join(',\n      ')}
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rubriquesexternes', null, {});
  }
};
`;

// Écrire le fichier seeder
fs.writeFileSync(outputFile, seederContent, 'utf8');


// const entries = lines.map(line => {
//   const [id, id_rubrique, id_etat, compte, nature, senscalcul, condition, equation, par_default, active, tableau] = line.split(',');

//   return `{
//     id_rubrique: ${Number(id_rubrique)},
//     id_etat: '${id_etat}',
//     tableau : '${tableau}',
//     compte: '${compte}',
//     nature: '${nature}',
//     senscalcul: '${senscalcul}',
//     condition: '${condition}',
//     equation: '${equation}',
//     par_default : true,
//     active : true,
//     createdAt: new Date(),
//     updatedAt: new Date()
//   }`;
// });
