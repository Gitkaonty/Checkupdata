const { Sequelize, DataTypes } = require('sequelize');
 module.exports = (sequelize, DataTypes) => {
    const etatsCentresFiscales = sequelize.define("etatsCentresfiscales", {
        id_cfisc: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
     libelle: {
        type: DataTypes.STRING(250),
        unique: false,
        allowNull: false
    },
    montant: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        unique: false,
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
    },
    id_exercice: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        references: {
            model: 'exercices',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    },
    {timestamps: true},)
    return etatsCentresFiscales;
}