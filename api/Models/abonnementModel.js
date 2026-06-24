module.exports = (sequelize, DataTypes) => {
    const abonnement = sequelize.define("abonnement", {
        compte_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            unique: false,
            references: {
                model: 'userscomptes',
                key: 'id'
            }
        },
        date_debut: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        date_fin: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expire: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: "abonnements",
        timestamps: true
    },)
    return abonnement;
}