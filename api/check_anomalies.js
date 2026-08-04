const db = require('./Models');

db.sequelize.query('SELECT id_controle, anomalies, "Type" FROM table_revisions_controles WHERE id_compte = 1 AND id_dossier = 7 AND id_exercice = 8 LIMIT 10', { type: db.Sequelize.QueryTypes.SELECT })
  .then(rows => {
    rows.forEach(row => {
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
