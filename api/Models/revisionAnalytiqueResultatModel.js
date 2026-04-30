module.exports = (sequelize, DataTypes) => {
  const RevisionAnalytiqueResultat = sequelize.define('RevisionAnalytiqueResultat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_compte: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'userscomptes',
        key: 'id'
      }
    },
    id_dossier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dossiers',
        key: 'id'
      }
    },
    id_exercice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exercices',
        key: 'id'
      }
    },
    id_periode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'periodes',
        key: 'id'
      }
    },
    id_jnl: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'journals',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    compte: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    libelle: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    debit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    credit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    total_analytiques: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    }
  }, {
    tableName: 'revision_analytique_resultats',
    timestamps: true
  });

  return RevisionAnalytiqueResultat;
};
