module.exports = (sequelize, DataTypes) => {
    const DossierPasswordAccess = sequelize.define(
        'dossierpasswordaccess',
        {
            user_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                unique: true,
                references: {
                    model: 'users',
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

            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        },
        {
            timestamps: true,
            tableName: 'dossierpasswordaccess'
        }
    );

    return DossierPasswordAccess;
};
