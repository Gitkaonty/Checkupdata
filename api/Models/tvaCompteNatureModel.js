module.exports = (sequelize, DataTypes) => {
  const TvaCompteNature = sequelize.define('TvaCompteNature', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_compte: { type: DataTypes.BIGINT, allowNull: false },
    id_dossier: { type: DataTypes.BIGINT, allowNull: false },
    compte: { type: DataTypes.STRING(50), allowNull: false },   // ex. 445xxxxx
    nature: { type: DataTypes.STRING(20), allowNull: false }     // IMMO | DED | COLL | CA | AUTRE
  }, {
    tableName: 'tva_comptes_nature',
    timestamps: true,
  });

  return TvaCompteNature;
};
