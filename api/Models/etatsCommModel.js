module.exports = (sequelize, DataTypes) => {
    const etatscomms = sequelize.define("etatscomms", {
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
        valide: {
            type: DataTypes.BOOLEAN,
            unique: false,
            allowNull: false,
            defaultValue: false
        }
    }, { timestamps: true },)
    return etatscomms;
}