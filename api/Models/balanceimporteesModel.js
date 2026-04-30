module.exports = (sequelize, DataTypes) => {
    const balanceimportees = sequelize.define( "balanceimportees", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
        compte: {
            type: DataTypes.STRING(50),
            unique: false,
            allowNull: true
        },
        libelle: {
            type: DataTypes.STRING(100),
            unique: false,
            allowNull: true
        },
        mvtdebit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue:0
        },
        mvtcredit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue:0
        },
        soldedebit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue:0
        },
        soldecredit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue:0
        },
    }, {timestamps: true}, )
    return balanceimportees
 }