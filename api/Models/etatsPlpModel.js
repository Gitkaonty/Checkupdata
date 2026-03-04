module.exports = (sequelize, DataTypes) => {
    const etatsplp = sequelize.define("etatsplp", {
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
            defaultValue: 0,
            references: {
                model: 'exercices',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        code_cn: {
            type: DataTypes.STRING(15),
            unique: false,
            allowNull: false
        },
        nature_produit: {
            type: DataTypes.STRING(250),
            unique: false,
            allowNull: false
        },
        unite_quantite: {
            type: DataTypes.STRING(50),
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        commercant_quantite: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        commercant_valeur: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        producteur_quantite: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        producteur_valeur: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        }
    }, { timestamps: true },)
    return etatsplp;
}