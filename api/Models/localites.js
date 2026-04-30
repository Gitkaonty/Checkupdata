module.exports = (sequelize, DataTypes) => {
    const localites = sequelize.define("localites", {
        province: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        region: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        commune: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, { timestamps: true })
    return localites
}
