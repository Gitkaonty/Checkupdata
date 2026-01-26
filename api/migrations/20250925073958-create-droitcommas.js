'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('droitcommas', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      id_compte: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'userscomptes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_dossier: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'dossiers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_exercice: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        references: {
          model: 'exercices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      nif: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      nif_representaires: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      num_stat: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      cin: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      date_cin: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      lieu_cin: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      nature_autres: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reference: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      raison_sociale: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      adresse: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      ville: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      ex_province: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      pays: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      nature: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      comptabilisees: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0
      },
      versees: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('droitcommas');
  }
};