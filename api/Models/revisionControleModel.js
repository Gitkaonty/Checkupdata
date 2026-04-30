const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RevisionControle = sequelize.define('RevisionControle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_compte: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_dossier: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_exercice: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_revision: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    id_controle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    compte: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    test: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    anomalies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Valider: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    Commentaire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Affichage: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'ligne',
      validate: {
        isIn: [['ligne', 'ecriture']],
      },
    },
    paramUn: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'paramUn',
    },
  }, {
    tableName: 'table_revisions_controles',
    timestamps: true,
    indexes: [
      { fields: ['id_compte'] },
      { fields: ['id_dossier'] },
      { fields: ['id_exercice'] },
      { fields: ['id_controle'] },
      { fields: ['Type'] },
    ],
  });

  return RevisionControle;
};
