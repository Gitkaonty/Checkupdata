module.exports = (sequelize, DataTypes) => {
    const dossierpcdetailcptchg = sequelize.define( "dossierplancomptabledetailcptchgs", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
        id_detail: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
        compte: {
            type: DataTypes.STRING,
            allowNull: true
        },
        libelle: {
            type: DataTypes.STRING,
            allowNull: true
        },
        id_comptecompta: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
    }, {timestamps: true},)
    return dossierpcdetailcptchg
 }
