module.exports = (sequelize, DataTypes) => {
  const DetailsImmoLignes = sequelize.define('details_immo_lignes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Clés de rattachement (toujours présentes)
    id_dossier: { type: DataTypes.INTEGER, allowNull: false },
    id_compte: { type: DataTypes.INTEGER, allowNull: false },
    id_exercice: { type: DataTypes.INTEGER, allowNull: false },

    // Immobilisation source
    id_detail_immo: { type: DataTypes.INTEGER, allowNull: false },

    // Informations d'exercice/échéance
    date_mise_service: { type: DataTypes.DATEONLY },
    date_fin_exercice: { type: DataTypes.DATEONLY },
    annee_nombre: { type: DataTypes.DECIMAL(18, 2) },

    // Montants comptables (calculés côté service)
    montant_immo_ht: { type: DataTypes.DECIMAL(18, 2) },
    amort_ant_comp: { type: DataTypes.DECIMAL(18, 2) },
    dotation_periode_comp: { type: DataTypes.DECIMAL(18, 2) },
    cumul_amort_comp: { type: DataTypes.DECIMAL(18, 2) },
    vnc: { type: DataTypes.DECIMAL(18, 2) },

    // Montants fiscaux (calculés côté service)
    amort_ant_fisc: { type: DataTypes.DECIMAL(18, 2) },
    dotation_periode_fisc: { type: DataTypes.DECIMAL(18, 2) },
    cumul_amort_fisc: { type: DataTypes.DECIMAL(18, 2) },
    dot_derogatoire: { type: DataTypes.DECIMAL(18, 2) },
    type: { type: DataTypes.STRING(20), allowNull: true }, // 'comp' ou 'fisc'

    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
  }, {
    tableName: 'details_immo_lignes',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  return DetailsImmoLignes;
};
