module.exports = (sequelize, DataTypes) => {
  const DetailsImmo = sequelize.define('details_immo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    id_dossier: { type: DataTypes.INTEGER, allowNull: false },
    id_compte: { type: DataTypes.INTEGER, allowNull: false },
    id_exercice: { type: DataTypes.INTEGER, allowNull: false },
    pc_id: { type: DataTypes.INTEGER, allowNull: false },
    pc_id_amort: { type: DataTypes.INTEGER, allowNull: false },

    code: { type: DataTypes.STRING(255), allowNull: false },
    intitule: { type: DataTypes.STRING(255) },
    lien_ecriture_id: { type: DataTypes.INTEGER },
    fournisseur: { type: DataTypes.STRING(255) },

    date_acquisition: { type: DataTypes.DATEONLY },
    date_mise_service: { type: DataTypes.DATEONLY },

    // Comptables (généraux)
    duree_amort_mois: { type: DataTypes.DECIMAL(18, 2) },
    type_amort: { type: DataTypes.STRING(50) },

    montant: { type: DataTypes.DECIMAL(18, 2) },
    taux_tva: { type: DataTypes.DECIMAL(18, 2) },
    montant_tva: { type: DataTypes.DECIMAL(18, 2) },
    montant_ht: { type: DataTypes.DECIMAL(18, 2) },

    compte_amortissement: { type: DataTypes.STRING(50) },
    vnc: { type: DataTypes.DECIMAL(18, 2) },

    date_sortie: { type: DataTypes.DATEONLY },
    prix_vente: { type: DataTypes.DECIMAL(18, 2) },

    reprise_immobilisation: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    date_reprise: { type: DataTypes.DATEONLY },

    reprise_immobilisation_comp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    date_reprise_comp: { type: DataTypes.DATEONLY },

    reprise_immobilisation_fisc: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    date_reprise_fisc: { type: DataTypes.DATEONLY },

    // Comptables (suffixes)
    amort_ant_comp: { type: DataTypes.DECIMAL(18, 2) },
    dotation_periode_comp: { type: DataTypes.DECIMAL(18, 2) },
    amort_exceptionnel_comp: { type: DataTypes.DECIMAL(18, 2) },
    total_amortissement_comp: { type: DataTypes.DECIMAL(18, 2) },
    derogatoire_comp: { type: DataTypes.DECIMAL(18, 2) },

    // Fiscales (suffixes)
    amort_ant_fisc: { type: DataTypes.DECIMAL(18, 2) },
    dotation_periode_fisc: { type: DataTypes.DECIMAL(18, 2) },
    amort_exceptionnel_fisc: { type: DataTypes.DECIMAL(18, 2) },
    total_amortissement_fisc: { type: DataTypes.DECIMAL(18, 2) },
    derogatoire_fisc: { type: DataTypes.DECIMAL(18, 2) },

    // Nouveaux champs fiscaux
    duree_amort_mois_fisc: { type: DataTypes.DECIMAL(18, 2) },
    type_amort_fisc: { type: DataTypes.STRING(50) },

    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
  }, {
    tableName: 'details_immo',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  return DetailsImmo;
};
