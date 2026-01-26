module.exports = (sequelize, DataTypes) => {
    const droitcommbs = sequelize.define("droitcommbs", {
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
        id_numcpt: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'dossierplancomptables',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        nom: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        prenom: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        nif: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        nif_representaires: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        num_stat: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        cin: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        date_cin: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        lieu_cin: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nature_autres: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        reference: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        raison_sociale: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nom_commercial: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        fokontany: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        adresse: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        ville: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        ex_province: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        pays: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        nature: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        mode_payement: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        montanth_tva: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        tva: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        typeTier: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    }, { timestamps: true },)
    return droitcommbs
}