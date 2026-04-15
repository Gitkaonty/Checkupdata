module.exports = (sequelize, DataTypes) => {
    const periodes = sequelize.define("periodes", {
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        libelle: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        date_debut: {
            type: DataTypes.DATE,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATE,
            allowNull: false
        },
        rang: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
    }, { timestamps: true });
    return periodes;
};
