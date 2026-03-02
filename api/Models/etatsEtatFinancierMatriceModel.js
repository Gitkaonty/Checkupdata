module.exports = (sequelize, DataTypes) => {
    const etatsetatfinanciermatrices = sequelize.define("etatsetatfinanciermatrices", {
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
    return etatsetatfinanciermatrices;
}