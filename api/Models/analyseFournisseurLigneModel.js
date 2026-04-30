const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnalyseFournisseurLigne = sequelize.define('AnalyseFournisseurLigne', {
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
    code_journal: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type_journal: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    date_ecriture: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    piece: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    libelle: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    debit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    credit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    lettrage: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'analyse_fournisseur_lignes',
    timestamps: true,
  });

  AnalyseFournisseurLigne.associate = (models) => {
    AnalyseFournisseurLigne.belongsTo(models.journals, {
      foreignKey: 'id_ligne',
      as: 'journal'
    });
    AnalyseFournisseurLigne.hasMany(models.AnalyseFournisseurAnomalie, {
      foreignKey: 'id_ligne',
      as: 'anomalies'
    });
  };

  return AnalyseFournisseurLigne;
};
