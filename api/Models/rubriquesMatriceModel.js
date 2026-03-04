module.exports = (sequelize, DataTypes) => {
    const rubriquesmatrices = sequelize.define("rubriquesmatrices", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        id_etat: {
            type: DataTypes.STRING(25),
            allowNull: false,
            defaultValue: 0
        },
        subtable: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        id_rubrique: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        note: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 0
        },
        libelle: {
            type: DataTypes.STRING(250),
            allowNull: false,
            defaultValue: 0
        },
        senscalcul: {
            type: DataTypes.STRING(25),
            allowNull: false,
            defaultValue: 0
        },
        nature: {
            type: DataTypes.STRING(15),
            allowNull: false,
            defaultValue: 0
        },
        ordre: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        niveau: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
    }, { timestamps: true },)
    return rubriquesmatrices;
}