const db = require('./Models');

db.sequelize.query('SELECT id_controle, anomalies, "Type" FROM table_revisions_controles WHERE id_compte = 1 AND id_dossier = 7 AND id_exercice = 8 LIMIT 10', { type: db.Sequelize.QueryTypes.SELECT })
  .then(rows => {
    console.log('Contenu de la table:');
    rows.forEach(row => {
      console.log(`id_controle: ${row.id_controle}, anomalies: ${row.anomalies} (type: ${typeof row.anomalies}), Type: ${row.Type}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
