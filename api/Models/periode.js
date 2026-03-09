module.exports = (sequelize, DataTypes) => {
    const periodes = sequelize.define("periodes", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
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
    }, { timestamps: true })
    return periodes
}