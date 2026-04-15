module.exports = (sequelize, DataTypes) => {
    const portefeuille = sequelize.define("portefeuilles", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'userscomptes',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        nom: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
    }, {
        tableName: "portefeuilles",
        timestamps: true
    },)
    return portefeuille;
}