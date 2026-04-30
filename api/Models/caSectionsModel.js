module.exports = (sequelize, DataTypes) => {
    const caSections = sequelize.define("casections", {
        id_axe: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        section: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        intitule: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        compte: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        fermer: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        par_defaut: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        }
    }, {
        tableName: "casections",
        timestamps: true,
        indexes: [
            { fields: ['id_axe'] },
            { fields: ['id_compte', 'id_dossier'] }
        ]
    });

    caSections.associate = (models) => {
        caSections.belongsTo(models.caAxes, {
            foreignKey: 'id_axe',
            as: 'axe'
        });
    };

    return caSections;
};
