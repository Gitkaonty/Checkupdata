module.exports = (sequelize, DataTypes) => {
    const dossierRevisionAnalytique = sequelize.define("dossier_revision_analytique", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
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
        id_periode: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: null
        },
        id_jnl: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        valider: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        tableName: "dossier_revision_analytique",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return dossierRevisionAnalytique;
};
