const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const dossierplancomptables = sequelize.define("dossierplancomptables", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        compte: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        libelle: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        nature: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        baseaux: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        cptcharge: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        typetier: {
            type: DataTypes.STRING(15),
            allowNull: true
        },
        cpttva: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        nif: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        statistique: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        adresse: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        motcle: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        cin: {
            type: DataTypes.STRING(15),
            allowNull: true
        },
        datecin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        autrepieceid: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        refpieceid: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        adressesansnif: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        nifrepresentant: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        adresseetranger: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        pays: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        mvtdebit: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        mvtcredit: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        soldedebit: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        soldecredit: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        mvtdebittreso: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        mvtcredittreso: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        soldedebittreso: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        soldecredittreso: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        valeur: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        valeurtreso: {
            type: DataTypes.DOUBLE,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        rubriquebilan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rubriquecrn: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rubriquecrf: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rubriquetftd: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rubriquetfti: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rubriqueevcp: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        baseaux_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
        nom: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        province: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        region: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        commune: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        fokontany: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        typecomptabilite: {
            type: DataTypes.STRING(20),
            defaultValue: 'Français',
            allowNull: true
        },
        compteautre: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        libelleautre: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
    }, { timestamps: true,
        indexes: [
            { fields: ['id_compte', 'id_dossier'] },
            { fields: ['compte'] }
        ]
     },)

    dossierplancomptables.associate = (models) => {
        dossierplancomptables.belongsTo(models.dossiers, {
            foreignKey: 'id_dossier',
            as: 'dossier'
        });
        dossierplancomptables.belongsTo(models.dossierplancomptables, {
            foreignKey: 'baseaux_id',
            as: 'BaseAux'
        });
    };

    return dossierplancomptables
}