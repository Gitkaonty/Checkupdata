module.exports = (sequelize, Sequelize) => {
    const Paiement = sequelize.define("paiements", {
        id: { 
            type: Sequelize.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        compte_id: { 
            type: Sequelize.INTEGER, 
            allowNull: false 
        },
        compte: { 
            type: Sequelize.STRING 
        },
        date_paiement: { 
            type: Sequelize.DATEONLY, 
            defaultValue: Sequelize.NOW 
        },
        montant_paye: { 
            type: Sequelize.DECIMAL(15, 2), 
            defaultValue: 0 
        },
        mode_paiement: { 
            type: Sequelize.STRING 
        },
        periode_date_debut: { 
            type: Sequelize.DATEONLY 
        },
        periode_date_fin: { 
            type: Sequelize.DATEONLY 
        }
    }, {
        timestamps: true,
        freezeTableName: true,
        underscored: true,
    });

    return Paiement;
};