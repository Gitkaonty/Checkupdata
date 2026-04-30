module.exports = (sequelize, DataTypes) => {
    const codejournals = sequelize.define("codejournals", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        code: {
            type: DataTypes.STRING(10),
            unique: false,
            allowNull: true
        },
        libelle: {
            type: DataTypes.STRING(100),
            unique: false,
            allowNull: true
        },
        type: {
            type: DataTypes.STRING(20),
            unique: false,
            allowNull: true
        },
        compteassocie: {
            type: DataTypes.STRING(30),
            unique: false,
            allowNull: true
        },
        nif: {
            type: DataTypes.STRING(25),
            unique: false,
            allowNull: true
        },
        stat: {
            type: DataTypes.STRING(25),
            unique: false,
            allowNull: true
        },
        adresse: {
            type: DataTypes.STRING(200),
            unique: false,
            allowNull: true
        },
        taux_tva: {
            type: DataTypes.DECIMAL(10, 4),
            unique: false,
            allowNull: true
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['id_compte', 'id_dossier'] },
            { fields: ['code'] },
            { fields: ['type'] }
        ]
    });
    return codejournals;
};
