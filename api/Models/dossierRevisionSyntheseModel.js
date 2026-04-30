'use strict';

module.exports = (sequelize, DataTypes) => {
    const DossierRevisionSynthese = sequelize.define('DossierRevisionSynthese', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_code: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        cycle: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        progression: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        compte_associe: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        id_compte: {
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
    }, {
        tableName: 'dossier_revision_synthese',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    });

    return DossierRevisionSynthese;
};
