module.exports = (sequelize, DataTypes) => {
    const exercices = sequelize.define( "exercices", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue:0
        },
        date_debut: {
            type: DataTypes.DATE,
            unique: false,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATE,
            unique: true,
            allowNull: false
        },
        libelle_rang: {
            type: DataTypes.STRING(5),
            unique: false,
            allowNull: true
        },
        rang: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: true,
            defaultValue:0
        },
        cloture: {
            type: DataTypes.BOOLEAN,
            unique: false,
            allowNull: true,
            defaultValue:false
        },
    }, {timestamps: true}, )
    return exercices
 }