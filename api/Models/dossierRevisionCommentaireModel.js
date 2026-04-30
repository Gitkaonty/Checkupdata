'use strict';

module.exports = (sequelize, DataTypes) => {
    const DossierRevisionCommentaire = sequelize.define('DossierRevisionCommentaire', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        cycle: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        id_code: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        id_exercice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_periode: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'dossier_revision_commentaire',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    });

    return DossierRevisionCommentaire;
};
