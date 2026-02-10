'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('controlematrices', [
      {
        declaration: 'EBILAN',
        etat_id: 'BILAN',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Bilan déséquilibré pour l\'exercice N (total actif différent du total passif).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'BILAN',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Bilan déséquilibré pour l\'exercice N-1 (total actif différent du total passif).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'CRN',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Résultat net différent de celui du Bilan pour la colonne exercice N.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'CRN',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Résultat net différent de celui du Bilan pour la colonne exercice N-1.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'CRF',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Résultat net différent de celui du tableau CRN pour la colonne exercice N.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'CRF',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Résultat net différent de celui du tableau CRN pour la colonne exercice N-1.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'TFTD',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'La variation de trésorerie ne s\'équilibre pas pour l\'exercice N.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'TFTD',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'La variation de trésorerie ne s\'équilibre pas pour l\'exercice N-1.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'TFTI',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'La variation de trésorerie ne s\'équilibre pas pour l\'exercice N.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'TFTI',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'La variation de trésorerie ne s\'équilibre pas pour l\'exercice N-1.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EVCP',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total de la colonne Capital social est différent de celui du bilan passif (Capital émis/…).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EVCP',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total de la colonne Capital primes et réserves est différent de celui du bilan passif (Primes et réserves…).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EVCP',
        control_id: '3',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total de la colonne Ecart d\'évaluation est différent de celui du bilan passif (Ecar d\'eval… et Ecart d\'équiv...).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EVCP',
        control_id: '4',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total de la colonne Résultat est différent de celui du bilan passif (Résultat net...).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EVCP',
        control_id: '5',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total de la colonne Report à nouveau est différent de celui du bilan passif (Autres capitaux propres...).',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EVCP',
        control_id: '6',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total global du tableau est différent du total capitaux propres du bilan passif.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DRF',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total de l\'impôt sur les revenus dû est différent du total Impôts exigibles sur résultats du formulaire CRN.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DRF',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du chiffre d\'affaires est différent de celui du formulaire CRN.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DRF',
        control_id: '3',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du résultat net est différent de celui du formulaire CRN.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'BHIAPC',
        control_id: '1',
        typecontrol: 'CTRLJNL',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du tableau est différent du solde des comptes du journal paramétrés pour ce tableau.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'MP',
        control_id: '1',
        typecontrol: 'CTRLJNL',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du montant HT est différent du solde des comptes 70 du journal comptable.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DA',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du Goodwill est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DA',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations corporelles est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DA',
        control_id: '3',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations incorporelles est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DA',
        control_id: '4',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations en cours est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DA',
        control_id: '5',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations financière est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'DA',
        control_id: '6',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total brut des Immobilisations est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EIAFNC',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations corporelles est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EIAFNC',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations incorporelles est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EIAFNC',
        control_id: '3',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations en cours est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'EIAFNC',
        control_id: '4',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total Immobilisations financière est différent de celui du bilan.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'SAD',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le solde imputable sur exercice ultérieur est différent du solde des amortissements différés restant à imputer du formulaire DRF.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'SDR',
        control_id: '1',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le résultat fiscal avant imputation des déficits est différent de celui du formulaire DRF.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'SDR',
        control_id: '2',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total des déficits antérieur imputable est différent de celui du formulaire DRF.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'SDR',
        control_id: '3',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total des déficits antérieur imputé est différent de celui du formulaire DRF.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'SDR',
        control_id: '4',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du résultat fiscal après imputation des déficits est différent de celui du formulaire DRF.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        declaration: 'EBILAN',
        etat_id: 'SDR',
        control_id: '5',
        typecontrol: 'COMPARAISON',
        typecomparaison: 'EGAL',
        nbrgroup: 2,
        comments: 'Le total du déficit restant à reporter est différent de celui du formulaire DRF.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('controlematrices', null, {});
  }
};
