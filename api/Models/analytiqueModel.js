module.exports = (sequelize, DataTypes) => {
    const analytiques = sequelize.define("analytiques", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_ligne_ecriture: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_axe: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_section: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        debit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        credit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        pourcentage: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: "analytiques",
        timestamps: true,
        indexes: [
            { fields: ['id_ligne_ecriture'] },
            { fields: ['id_axe'] },
            { fields: ['id_section'] },
            { fields: ['id_compte', 'id_dossier'] }
        ]
    });

    analytiques.associate = (models) => {
        analytiques.belongsTo(models.caAxes, {
            foreignKey: 'id_axe',
            as: 'axe'
        });
        analytiques.belongsTo(models.caSections, {
            foreignKey: 'id_section',
            as: 'section'
        });
        analytiques.belongsTo(models.journals, {
            foreignKey: 'id_ligne_ecriture',
            as: 'ligne'
        });
    };

    return analytiques;
};
