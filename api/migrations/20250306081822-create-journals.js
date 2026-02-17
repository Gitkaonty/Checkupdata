'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('journals', {
            id_compte: {
                type: Sequelize.BIGINT,
                allowNull: false
            },
            id_dossier: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            id_exercice: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            id_ecriture: {
                type: Sequelize.STRING(25),
                unique: false,
                allowNull: true
            },
            datesaisie: {
                type: Sequelize.DATE,
                unique: false,
                allowNull: true
            },
            dateecriture: {
                type: Sequelize.DATE,
                unique: false,
                allowNull: false
            },
            id_journal: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            id_numcpt: {
                type: Sequelize.BIGINT,
                allowNull: true,
                defaultValue: 0
            },
            id_numcptcentralise: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            piece: {
                type: Sequelize.STRING(50),
                unique: false,
                allowNull: true
            },
            piecedate: {
                type: Sequelize.DATE,
                unique: false,
                allowNull: true
            },
            libelle: {
                type: Sequelize.STRING(50),
                unique: false,
                allowNull: true
            },
            debit: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0
            },
            credit: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0
            },
            devise: {
                type: Sequelize.STRING(10),
                unique: false,
                allowNull: false
            },
            lettrage: {
                type: Sequelize.STRING(10),
                unique: false,
                allowNull: true
            },
            lettragedate: {
                type: Sequelize.DATE,
                unique: false,
                allowNull: true
            },
            saisiepar: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            modifierpar: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            id_devise: {
                type: Sequelize.BIGINT,
                allowNull: false
            },
            taux: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0
            },
            montant_devise: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0
            },
            num_facture: {
                type: Sequelize.CHAR,
                allowNull: false,
                defaultValue: ''
            },
            decltvamois: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            decltvaannee: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            decltva: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            },
            declisimois: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            declisiannee: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            declisi: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            },
            rapprocher: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            },
            date_rapprochement: {
                type: Sequelize.DATEONLY,
                allowNull: true,
                defaultValue: null
            },
            comptegen: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            compteaux: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            libelleaux: {
                type: Sequelize.STRING(50),
                unique: false,
                allowNull: true
            },
            vraiedate: {
                type: Sequelize.DATE,
                unique: false,
                allowNull: true
            },
        },
            { timestamps: true }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('journals');
    }
};
