module.exports = (sequelize, DataTypes) => {
    const compterubriqueexternes = sequelize.define("compterubriqueexternes", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
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
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'dossiers',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'exercices',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
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
        exercice_label: {
            type: DataTypes.STRING(5),
            allowNull: true,
        },
    },{ timestamps: true })
    return compterubriqueexternes;
}