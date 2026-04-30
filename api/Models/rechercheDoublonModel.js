module.exports = (sequelize, DataTypes) => {
  const RechercheDoublon = sequelize.define('RechercheDoublon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      type: DataTypes.STRING,
      allowNull: true
    },
    journal: {
      type: DataTypes.STRING,
      allowNull: true
    },
    piece: {
      type: DataTypes.STRING,
      allowNull: true
    },
    libelle: {
      type: DataTypes.STRING,
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
    id_doublon: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    statut: {
      type: DataTypes.ENUM('VALIDE', 'NON_VALIDE'),
      defaultValue: 'NON_VALIDE',
      allowNull: true
    },
    date_validation: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'recherche_doublons',
    timestamps: true
  });

  RechercheDoublon.associate = (models) => {
    RechercheDoublon.belongsTo(models.Dossier, { foreignKey: 'id_dossier' });
    RechercheDoublon.belongsTo(models.Exercice, { foreignKey: 'id_exercice' });
    RechercheDoublon.belongsTo(models.Periode, { foreignKey: 'id_periode' });
    RechercheDoublon.belongsTo(models.Journal, { foreignKey: 'id_jnl' });
  };

  return RechercheDoublon;
};
