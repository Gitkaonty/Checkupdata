module.exports = (sequelize, DataTypes) => {
    const etatscomatrices = sequelize.define("etatscomatrices", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        code: {
            type: DataTypes.STRING(15),
            unique: false,
            allowNull: false
        },
        nom: {
            type: DataTypes.STRING(250),
            unique: false,
            allowNull: false
        },
        ordre: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },

    }, { timestamps: true },)
    return etatscomatrices;
}