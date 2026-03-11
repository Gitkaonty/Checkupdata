module.exports = (sequelize, DataTypes) => {
    const periodes = sequelize.define("periodes", {
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
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
    }, { timestamps: true })
    return periodes
}