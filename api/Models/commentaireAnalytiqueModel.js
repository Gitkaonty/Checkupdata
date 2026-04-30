module.exports = (sequelize, DataTypes) => {
    const commentaireAnalytique = sequelize.define("commentaireAnalytique", {
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
            comment: 'Référence au compte général (comptegen)'
        },
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        valide_anomalie: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Checkbox pour valider que l\'anomalie a été traitée'
        }
    }, {
        timestamps: true,
        tableName: 'commentaireanalytiques'
    });

    return commentaireAnalytique;
};
