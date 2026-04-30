'use strict';

module.exports = (sequelize, DataTypes) => {
    const DossierRevisionMatrice = sequelize.define('DossierRevisionMatrice', {
        cycle: {
            type: DataTypes.STRING(50),
            allowNull: false,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true,
        },
        questionnaire: {
            type: DataTypes.STRING(255),
            allowNull: false,
            primaryKey: true,
        },
        type: {
            type: DataTypes.STRING(100),
            allowNull: false,
            primaryKey: true,
        },
    }, {
        tableName: 'dossier_revision_matrice',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    });

    return DossierRevisionMatrice;
};
