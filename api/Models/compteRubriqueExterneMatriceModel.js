module.exports = (sequelize, DataTypes) => {
    const compterubriqueexternesmatrices = sequelize.define("compterubriqueexternesmatrices", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        id_rubrique: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 0
        },
        id_etat: {
            type: DataTypes.STRING(25),
            allowNull: false,
            defaultValue: 0
        },
        tableau: {
            type: DataTypes.STRING(25),
            allowNull: false,
            defaultValue: 0
        },
        compte: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        nature: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        senscalcul: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        condition: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        equation: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        par_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, { timestamps: true }
    )
    return compterubriqueexternesmatrices;
}