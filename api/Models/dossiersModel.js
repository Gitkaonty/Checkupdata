module.exports = (sequelize, DataTypes) => {
    const dossiers = sequelize.define("dossiers", {
        id_compte: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        id_portefeuille: {
            type: DataTypes.ARRAY(DataTypes.BIGINT),
            allowNull: true,
        },
        id_user: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        dossier: {
            type: DataTypes.STRING(150),
            unique: false,
            allowNull: false
        },
        responsable: {
            type: DataTypes.STRING(150),
            unique: false,
            allowNull: true
        },
        nbrpart: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: false,
            defaultValue: 0
        },
        avecmotdepasse: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        motdepasse: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        seuil_revu_analytique: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 30.0
        }
    }, { timestamps: true },)
    return dossiers
}