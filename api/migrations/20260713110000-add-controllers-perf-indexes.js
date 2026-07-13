'use strict';

const INDEXES = [
  ['jrn_cde_comptegen', 'journals', '("id_compte","id_dossier","id_exercice","comptegen")'],
  ['jrn_cde_ecriture', 'journals', '("id_compte","id_dossier","id_exercice","id_ecriture")'],
  ['balances_cde', 'balances', '("id_compte","id_dossier","id_exercice")'],
  ['balanceimportees_cde', 'balanceimportees', '("id_compte","id_dossier","id_exercice")'],
  ['dpc_dossier_compte_cpt', 'dossierplancomptables', '("id_dossier","id_compte","compte")'],
  ['codejournals_dossier_compte_code', 'codejournals', '("id_dossier","id_compte","code")'],
  ['dossier_revision_key', 'dossier_revision', '("id_compte","id_dossier","id_exercice","id_periode","id_code")'],
  ['dossier_revision_synthese_key', 'dossier_revision_synthese', '("id_compte","id_dossier","id_exercice","id_periode","cycle")'],
  ['dossier_revision_commentaire_key', 'dossier_revision_commentaire', '("id_compte","id_dossier","id_exercice","id_periode","cycle")'],
  ['dossier_revision_analytique_key', 'dossier_revision_analytique', '("id_compte","id_dossier","id_exercice","id_jnl","id_periode")'],
  ['analytiques_ligne', 'analytiques', '("id_ligne_ecriture")'],
  ['recherche_doublons_key', 'recherche_doublons', '("id_dossier","id_exercice","id_periode","id_doublon")'],
  ['commentaireanalytiques_key', 'commentaireanalytiques', '("id_compte","id_dossier","id_exercice","id_periode","compte")'],
  ['exercices_dossier_compte', 'exercices', '("id_dossier","id_compte")'],
  ['tca_cdei_controle', 'table_controle_anomalies', '("id_compte","id_dossier","id_exercice","id_controle")'],
];

module.exports = {
  async up(queryInterface) {
    for (const [name, table, cols] of INDEXES) {
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS ${name} ON "${table}" ${cols}`
      );
    }
  },
  async down(queryInterface) {
    for (const [name] of INDEXES) {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${name}`);
    }
  },
};
