//importing modules
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

//Database connection with dialect of postgres specifying the database we are using
//port for my database is 5433
//database name is discover
const DB_ConnexionString = `postgresql://${process.env.NODE_API_USER}:${process.env.NODE_API_PWD}@${process.env.NODE_API_URL}:${process.env.DB_PORT}/${process.env.NODE_API_DBNAME}`;
const sequelize = new Sequelize(
    DB_ConnexionString,
    {
        dialect: "postgres",
        logging: false
    }

)
//const sequelize = new Sequelize(`postgresql://postgres:admin@localhost:5432/kaonty`, {dialect: "postgres"})

//checking if connection is done
sequelize.authenticate().then(() => {
    console.log(`Database connected to discover`)
}).catch((err) => {
    console.log(err)
})

const db = {}

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.Sequelize = Sequelize
db.sequelize = sequelize

//connecting to model
db.users = require('./userModel')(sequelize, DataTypes);
db.resetToken = require('./resetTokenModel')(sequelize, DataTypes);

//Gsetion rôle et permission
db.roles = require('./rolesModel')(sequelize, DataTypes);
db.permissions = require('./permissionsModel')(sequelize, DataTypes);
db.userPermission = require('./userPermissionsModel')(sequelize, DataTypes);
db.rolePermission = require('./rolePermissionsModel')(sequelize, DataTypes);

// Rôle et permission
db.roles.hasMany(db.rolePermission, { foreignKey: 'role_id', sourceKey: 'id' });
db.rolePermission.belongsTo(db.roles, { foreignKey: 'role_id', targetKey: 'id' });

db.permissions.hasMany(db.rolePermission, { foreignKey: 'permission_id', sourceKey: 'id' });
db.rolePermission.belongsTo(db.permissions, { foreignKey: 'permission_id', targetKey: 'id' });

db.users.hasMany(db.userPermission, { foreignKey: 'user_id', sourceKey: 'id' });
db.userPermission.belongsTo(db.users, { foreignKey: 'user_id', targetKey: 'id' });

db.permissions.hasMany(db.userPermission, { foreignKey: 'permission_id', sourceKey: 'id' });
db.userPermission.belongsTo(db.permissions, { foreignKey: 'permission_id', targetKey: 'id' });

db.roles.hasMany(db.users, { foreignKey: 'role_id', sourceKey: 'id' });
db.users.belongsTo(db.roles, { foreignKey: 'role_id', targetKey: 'id' });

//exporting the module
module.exports = db;