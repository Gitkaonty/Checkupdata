'use strict';

module.exports = (sequelize, DataTypes) => {
    const DossierRevision = sequelize.define('DossierRevision', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_code: {
            type: DataTypes.STRING(255),
            allowNull: false,
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
        statut: {
            type: DataTypes.ENUM('OUI', 'NON', 'NA'),
            allowNull: true,
            defaultValue: null,
        },
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'dossier_revision',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    });

    return DossierRevision;
};
