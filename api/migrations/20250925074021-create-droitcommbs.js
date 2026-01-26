'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('droitcommbs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      id_compte: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'userscomptes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_dossier: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'dossiers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_exercice: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        references: {
          model: 'exercices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_numcpt: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'dossierplancomptables',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nom: Sequelize.STRING(30),
      prenom: Sequelize.STRING(30),
      nif: Sequelize.STRING(20),
      nif_representaires: Sequelize.STRING(20),
      num_stat: Sequelize.STRING(15),
      cin: Sequelize.STRING(20),
      date_cin: Sequelize.DATEONLY,
      lieu_cin: Sequelize.STRING(50),
      nature_autres: Sequelize.STRING(50),
      reference: Sequelize.STRING(50),
      raison_sociale: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      nom_commercial: Sequelize.STRING(50),
      fokontany: Sequelize.STRING(30),
      adresse: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      ville: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      ex_province: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      pays: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      nature: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      mode_payement: Sequelize.STRING(50),
      montanth_tva: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0
      },
      tva: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      typeTier: {
        type: Sequelize.STRING(50),
        allowNull: false
      }
    },
      { timestamps: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('droitcommbs');
  }
};
