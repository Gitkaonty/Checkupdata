module.exports = (sequelize, DataTypes) => {
    const commentaireAnalytiqueMensuelle = sequelize.define("commentaireAnalytiqueMensuelle", {
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
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        anomalies: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        valide_anomalie: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    }, {
        timestamps: true,
        tableName: 'commentaire_analytique_mensuelle'
    });

    return commentaireAnalytiqueMensuelle;
};
