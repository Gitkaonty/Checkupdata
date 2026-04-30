const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Revision = sequelize.define('Revision', {
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
    Type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    NbrAnomalies: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    Status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    Commentaire: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'revisions',
    timestamps: true,
  });

  Revision.associate = (models) => {
    Revision.hasMany(models.revisionControle, {
      foreignKey: 'id_revision',
      as: 'controles'
    });
  };

  return Revision;
};
