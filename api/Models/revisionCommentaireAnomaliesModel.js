const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RevisionCommentaireAnomalies = sequelize.define('RevisionCommentaireAnomalies', {
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
    id_periode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_controle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_jnl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_anomalie: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    valide: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'revision_commentaire_anomalies',
    timestamps: true,
  });

  return RevisionCommentaireAnomalies;
};
