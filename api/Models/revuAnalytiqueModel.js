module.exports = (sequelize, DataTypes) => {
    const RevuAnalytique = sequelize.define("RevuAnalytique", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_periode: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        compte: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        type_revue: {
            type: DataTypes.ENUM('analytiqueNN1', 'analytiqueMensuelle'),
            allowNull: false,
        },
        nbr_anomalies: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        anomalies_valides: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        }
    }, {
        timestamps: true,
        tableName: 'revu_analytique'
    });

    return RevuAnalytique;
};
