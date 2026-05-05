module.exports = (sequelize, DataTypes) => {
    const compteDossier = sequelize.define("comptedossiers", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        id_dossier: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            unique: false,
            references: {
                model: 'dossiers',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            unique: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
    }, { timestamps: true })
    return compteDossier
}