module.exports = (sequelize, DataTypes) => {
    const balances = sequelize.define("balances", {
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
        id_exercice: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        id_numcompte: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        id_numcomptecentr: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
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
        rubriquebilanbrut: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        rubriquebilanamort: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        rubriquecrn: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        rubriquecrf: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        rubriquetftd: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        rubriquetfti: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        rubriqueevcp: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        nature: {
            type: DataTypes.STRING(25),
            unique: false,
            allowNull: true
        },

        senscalculbilan: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
        senscalculcrn: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
        senscalculcrf: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
        senscalcultftd: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
        senscalcultfti: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
        rubriquebilanactifbrutexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquebilanactifamortexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquebilanpassifbrutexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquecrnexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquecrfexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquetftdexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquetftiexterne: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        rubriquesig: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 0
        },
        senscalculbilanamort: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
        senscalculbilanbrut: {
            type: DataTypes.STRING(3),
            unique: false,
            allowNull: true
        },
    }, { timestamps: true },)

    balances.associate = (models) => {
        balances.belongsTo(models.dossierplancomptables, { foreignKey: 'id_numcompte', as: 'compteLibelle' });
        balances.belongsTo(models.dossierplancomptables, { foreignKey: 'id_numcomptecentr', as: 'compteCentralisation' });
    };

    return balances
}