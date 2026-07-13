'use strict';

/**
 * Index de performance pour le contrôle global des comptes (executeAll).
 * Cible les filtres/regroupements les plus fréquents :
 *  - journals : LIKE de préfixe sur comptegen/compteaux + filtre (compte/dossier/exercice, date)
 *  - table_controle_anomalies : delete/stats/join par (compte,dossier,exercice,periode) et (id_controle,id_jnl)
 *  - revision_commentaire_anomalies : join des commentaires
 *  - table_revisions_controles : delete/update par (compte,dossier,exercice,periode)
 * Idempotent (IF NOT EXISTS / IF EXISTS).
 */
const STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS journals_comptegen_pattern ON journals USING btree (comptegen varchar_pattern_ops)`,
  `CREATE INDEX IF NOT EXISTS journals_compteaux_pattern ON journals USING btree (compteaux varchar_pattern_ops)`,
  `CREATE INDEX IF NOT EXISTS journals_cde_date ON journals (id_compte, id_dossier, id_exercice, dateecriture)`,
  `CREATE INDEX IF NOT EXISTS tca_cdei_periode ON table_controle_anomalies (id_compte, id_dossier, id_exercice, id_periode)`,
  `CREATE INDEX IF NOT EXISTS tca_controle_jnl ON table_controle_anomalies (id_controle, id_jnl)`,
  `CREATE INDEX IF NOT EXISTS rca_cdei_periode ON revision_commentaire_anomalies (id_compte, id_dossier, id_exercice, id_periode)`,
  `CREATE INDEX IF NOT EXISTS rca_controle_jnl ON revision_commentaire_anomalies (id_controle, id_jnl)`,
  `CREATE INDEX IF NOT EXISTS trc_cdei_periode ON table_revisions_controles (id_compte, id_dossier, id_exercice, id_periode)`,
];

const INDEX_NAMES = [
  'journals_comptegen_pattern',
  'journals_compteaux_pattern',
  'journals_cde_date',
  'tca_cdei_periode',
  'tca_controle_jnl',
  'rca_cdei_periode',
  'rca_controle_jnl',
  'trc_cdei_periode',
];

module.exports = {
  async up(queryInterface) {
    for (const sql of STATEMENTS) {
      await queryInterface.sequelize.query(sql);
    }
  },
  async down(queryInterface) {
    for (const name of INDEX_NAMES) {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${name}`);
    }
  },
};
