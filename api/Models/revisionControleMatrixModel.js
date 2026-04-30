const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RevisionControleMatrix = sequelize.define('RevisionControleMatrix', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_controle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    tableName: 'revisions_controles_matrices',
    timestamps: true,
    indexes: [
      { fields: ['id_controle'] },
      { fields: ['Type'] },
    ],
  });

  return RevisionControleMatrix;
};
