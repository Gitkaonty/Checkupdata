'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('details_immo', {
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
      pc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dossierplancomptables',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pc_id_amort: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dossierplancomptables',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      code: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      intitule: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      lien_ecriture_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      fournisseur: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      date_acquisition: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_mise_service: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      duree_amort_mois: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      type_amort: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      montant: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      taux_tva: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      montant_tva: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      montant_ht: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      compte_amortissement: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      vnc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      date_sortie: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      prix_vente: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      reprise_immobilisation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      date_reprise: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      reprise_immobilisation_comp: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      date_reprise_comp: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      reprise_immobilisation_fisc: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      date_reprise_fisc: {
        type: Sequelize.DATEONLY,
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
      amort_exceptionnel_comp: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      total_amortissement_comp: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      derogatoire_comp: {
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
      amort_exceptionnel_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      total_amortissement_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      derogatoire_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      duree_amort_mois_fisc: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      type_amort_fisc: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      etat: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      amort_avant_reprise: { type: Sequelize.DECIMAL(18, 2) },
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
    await queryInterface.addIndex('details_immo', ['id_dossier', 'id_exercice', 'pc_id']);
    await queryInterface.addIndex('details_immo', ['code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('details_immo');
  }
};
