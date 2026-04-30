module.exports = (sequelize, DataTypes) => {
    const caAxes = sequelize.define("caaxes", {
        code: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        libelle: {
            type: DataTypes.STRING(100),
            allowNull: false
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
        }
    }, {
        tableName: "caaxes",
        timestamps: true
    });
    return caAxes;
};
