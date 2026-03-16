'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('details_immo_lignes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      id_dossier: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dossiers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_compte: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'userscomptes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_exercice: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'exercices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_detail_immo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'details_immo',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date_mise_service: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_fin_exercice: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      annee_nombre: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      montant_immo_ht: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      amort_ant_comp: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      dotation_periode_comp: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      cumul_amort_comp: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      vnc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      amort_ant_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      dotation_periode_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      cumul_amort_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      dot_derogatoire: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('details_immo_lignes', ['id_detail_immo']);
    await queryInterface.addIndex('details_immo_lignes', ['id_dossier', 'id_exercice']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('details_immo_lignes');
  }
};
