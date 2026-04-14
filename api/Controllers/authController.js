const bcrypt = require("bcrypt");
const db = require("../Models");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Op } = require('sequelize');

const User = db.users;
const Userscomptes = db.userscomptes;
const roles = db.roles;
const userPermission = db.userPermission;
const permissions = db.permissions;

const rolePermissionMiddleware = require('../Middlewares/RolePermission/rolePermission');
const createUserPermission = rolePermissionMiddleware.createUserPermission;

// User.belongsTo(Userscomptes, { foreignKey: 'compte_id' });
// Userscomptes.hasMany(User, { foreignKey: 'compte_id' });

const handleLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!password || !email) return res.status(400).json({ 'message': 'L\'email et mot de passe sont obligatoires.' });

    const foundUser = await User.findOne({
        where: { email: email },
        // include: [{ model: Userscomptes, attributes: ['nom'] }]
    });

    if (!foundUser) return res.status(401).json({ 'message': 'Compte non trouvé.' });

    const id_role = foundUser.role_id;
    const foundRole = await roles.findByPk(id_role);

    if (!foundRole) return res.status(401).json({ 'message': 'Rôle non trouvé.' });

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        const userRoles = Object.values(foundUser.roles).filter(Boolean);
        const role = foundRole.code;

        let permissionUser = await userPermission.findAll({
            where: {
                user_id: foundUser.id,
                allowed: true
            }
        })

        if (permissionUser.length === 0) {
            const userPermissionCreated = await createUserPermission(foundUser.id, id_role);
            permissionUser = userPermissionCreated.filter(val => val.allowed === true);
        }

        const permissionId = permissionUser.map(val => Number(val.permission_id));

        const permissionData = await permissions.findAll({
            where: {
                id: { [Op.in]: permissionId }
            },
            attributes: ['code']
        })

        const permissioDataName = permissionData.map(val => val.code);

        const accessToken = jwt.sign(
            {
                'UserInfo':
                {
                    'username': foundUser.username,
                    // 'roles': userRoles,
                    'roles': role,
                    'permission': permissioDataName,
                    'compteId': foundUser.compte_id,
                    'compte': foundUser?.userscompte?.nom,
                    'userId': foundUser.id,
                    'portefeuille': foundUser.id_portefeuille
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15s' }
        );

        const refreshToken = jwt.sign(
            { 'username': foundUser.username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        await User.update({ refresh_token: refreshToken }, { where: { id: foundUser.id } });

        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Lax', maxAge: 24 * 60 * 60 * 1000 });
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };