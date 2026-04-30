const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TableControleAnomalies = sequelize.define('TableControleAnomalies', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_compte: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_dossier: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_exercice: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_jnl: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    codeCtrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    id_controle: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    valide: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_periode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'table_controle_anomalies',
    timestamps: true,
  });

  return TableControleAnomalies;
};
