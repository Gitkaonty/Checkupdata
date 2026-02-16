module.exports = (sequelize, DataTypes) => {
    const journals = sequelize.define("journals", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        id_ecriture: {
            type: DataTypes.STRING(25),
            unique: false,
            allowNull: true
        },
        datesaisie: {
            type: DataTypes.DATE,
            unique: false,
            allowNull: true
        },
        dateecriture: {
            type: DataTypes.DATE,
            unique: false,
            allowNull: false
        },
        id_journal: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        id_numcpt: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: 0
        },
        id_numcptcentralise: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        piece: {
            type: DataTypes.STRING(50),
            unique: false,
            allowNull: true
        },
        piecedate: {
            type: DataTypes.DATE,
            unique: false,
            allowNull: true
        },
        libelle: {
            type: DataTypes.STRING(50),
            unique: false,
            allowNull: true
        },
        debit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        credit: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        devise: {
            type: DataTypes.STRING(10),
            unique: false,
            allowNull: false
        },
        lettrage: {
            type: DataTypes.STRING(10),
            unique: false,
            allowNull: true
        },
        lettragedate: {
            type: DataTypes.DATE,
            unique: false,
            allowNull: true
        },
        saisiepar: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        modifierpar: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        fichier: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        id_devise: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: 0
        },
        taux: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        montant_devise: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 0
        },
        id_immob: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        num_facture: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        decltvamois: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        decltvaannee: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        decltva: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        declisimois: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        declisiannee: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        declisi: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        rapprocher: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        date_rapprochement: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: null
        },
        comptegen: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        compteaux: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        libelleaux: {
            type: DataTypes.STRING(250),
            unique: false,
            allowNull: true
        },
        libellecompte: {
            type: DataTypes.STRING(250),
            unique: false,
            allowNull: true
        },
        vraiedate: {
            type: DataTypes.DATE,
            unique: false,
            allowNull: true
        },
    }, { timestamps: true },)
    return journals
}