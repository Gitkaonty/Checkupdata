module.exports = (sequelize, DataTypes) => {
    const droitcommas = sequelize.define("droitcommas", {
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
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: ''
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
        comptabilisees: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        versees: {
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
    return droitcommas
}