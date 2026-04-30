const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnalyseClientAnomalie = sequelize.define('AnalyseClientAnomalie', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_dossier: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_ligne: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'journals',
        key: 'id'
      }
    },
    compte: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    id_periode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_exercice: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type_anomalie: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type d\'anomalie: paiement_sans_facture, facture_3mois, ajustement_non_traite, solde_suspens'
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    valider: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    commentaire_validation: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'analyse_client_anomalies',
    timestamps: true,
  });

  AnalyseClientAnomalie.associate = (models) => {
    AnalyseClientAnomalie.belongsTo(models.Journal, {
      foreignKey: 'id_ligne',
      as: 'journal'
    });
  };

  return AnalyseClientAnomalie;
};