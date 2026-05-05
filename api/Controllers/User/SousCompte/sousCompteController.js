require('dotenv').config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require('sequelize');

const db = require("../../../Models");
const users = db.users;
const userscomptes = db.userscomptes;
const resettokens = db.resetToken;
const userPermission = db.userPermission;
const rolePermission = db.rolePermission;
const roles = db.roles;
const permissions = db.permissions;

const compteDossiers = db.compteDossiers;
const comptePortefeuilles = db.comptePortefeuilles;
const dossiers = db.dossiers;
const portefeuilles = db.portefeuille;

const transporter = require('../../../config/mailer');

const rolePermissionMiddleware = require('../../../Middlewares/RolePermission/rolePermission');
const createUserPermission = rolePermissionMiddleware.createUserPermission;

exports.getAllSousComptes = async (req, res) => {
    try {
        const sousComptes = await users.findAll({
            order: [["compte_id", "ASC"]]
        })
        if (!sousComptes) {
            return res.status(409).json({ message: 'Sous-comptes non trouvés', state: false })
        }
        return res.status(200).json({ message: "Sous-comptes reçues aves succès", state: true, list: sousComptes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.getAllSousComptesByIdCompte = async (req, res) => {
    try {
        const { compteIds } = req.body;
        if (!Array.isArray(compteIds)) {
            return res.status(409).json({ message: 'Ids des comptes non trouvé', state: false })
        }
        const sousComptes = (await users.findAll({
            where: {
                compte_id: compteIds
            },
            include: [{ model: roles, as: "role", attributes: ["nom"] }],
            order: [["compte_id", "ASC"], ["id", "ASC"]]
        })).map(val => {
            const data = val.toJSON();

            return {
                ...data,
                role_nom: data?.role?.nom || ""
            };
        });
        if (!sousComptes) {
            return res.status(409).json({ message: 'Sous-comptes non trouvés', state: false })
        }
        return res.status(200).json({ message: "Sous-comptes filtrés avec les comptes reçues aves succès", state: true, list: sousComptes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.addSousCompte = async (req, res) => {
    try {
        const { username, email, password, compte_id, roles, portefeuille, role_id, dossier, action, user_id } = req.body;

        if (action === 'Ajout') {
            const hashedPwd = await bcrypt.hash(password, 10);

            const sousCompteCreated = await users.create({
                role_id,
                username,
                email,
                password: hashedPwd,
                compte_id,
                roles,
                id_portefeuille: portefeuille
            });

            const user_id = sousCompteCreated.id;

            await createUserPermission(user_id, role_id);

            const dossiersExistants = await dossiers.findAll({
                where: {
                    id: { [Op.in]: dossier }
                },
                attributes: ['id']
            });

            const portefeuillesExistants = await portefeuilles.findAll({
                where: {
                    id: { [Op.in]: portefeuille }
                },
                attributes: ['id']
            })

            const dossiersValides = dossiersExistants.map(d => d.id);
            const portefeuillesValides = portefeuillesExistants.map(d => d.id);

            if (dossiersValides.length > 0) {
                const dossiersDejaLies = await compteDossiers.findAll({
                    where: {
                        user_id,
                        id_dossier: { [Op.in]: dossiersValides }
                    },
                    attributes: ['id_dossier']
                });

                const dossiersDejaLiesIds = dossiersDejaLies.map(d => d.id_dossier);

                const dossiersAInserer = dossiersValides.filter(
                    id => !dossiersDejaLiesIds.includes(id)
                );

                if (dossiersAInserer.length > 0) {
                    await compteDossiers.bulkCreate(
                        dossiersAInserer.map(id_dossier => ({
                            user_id,
                            id_dossier
                        }))
                    );
                }
            }

            if (portefeuillesValides.length > 0) {
                const portefeuillesDejaLies = await comptePortefeuilles.findAll({
                    where: {
                        user_id,
                        id_portefeuille: { [Op.in]: portefeuillesValides }
                    },
                    attributes: ['id_portefeuille']
                });

                const portefeuillesDejaLiesIds = portefeuillesDejaLies.map(d => d.id_portefeuille);

                const portefeuillesAInserer = portefeuillesValides.filter(
                    id => !portefeuillesDejaLiesIds.includes(id)
                );

                if (portefeuillesAInserer.length > 0) {
                    await comptePortefeuilles.bulkCreate(
                        portefeuillesAInserer.map(id_portefeuille => ({
                            user_id,
                            id_portefeuille
                        }))
                    );
                }
            }

            const compteParent = await userscomptes.findByPk(compte_id);

            if (compteParent && compteParent.email) {
                transporter.sendMail({
                    from: `"Kaonti" <${process.env.MAIL_USER}>`,
                    to: compteParent.email,
                    subject: "Nouveau sous-compte créé",
                    text: `Bonjour, un nouveau sous-compte a été créé : Nom: ${username}, Email: ${email}`,
                    html: `<div style="font-family:Arial,sans-serif;">
                <h2 style="color:#1976d2;">Nouveau sous-compte créé</h2>
                <p>Bonjour,</p>
                <p>Un nouveau sous-compte a été créé :</p>
                <ul>
                  <li><strong>Nom:</strong> ${username}</li>
                  <li><strong>Email:</strong> ${email}</li>
                </ul>
                <p>Cordialement,<br>L'équipe Kaonti</p>
               </div>`
                })
                    .then(info => console.log("Email envoyé pour ajout de sous-compte :", info.messageId))
                    .catch(err => console.error("Erreur envoi mail :", err));
            }

            return res.status(200).json({
                message: "Sous-compte ajouté avec succès",
                state: true,
                compte: {}
            });

        } else {
            await users.update({
                role_id,
                username,
                email,
                compte_id,
                roles,
                id_portefeuille: portefeuille
            }, {
                where: {
                    id: user_id
                }
            });

            await compteDossiers.destroy({
                where: {
                    user_id
                }
            })

            await comptePortefeuilles.destroy({
                where: {
                    user_id
                }
            })

            const dossiersExistants = await dossiers.findAll({
                where: {
                    id: { [Op.in]: dossier }
                },
                attributes: ['id']
            });

            const portefeuillesExistants = await portefeuilles.findAll({
                where: {
                    id: { [Op.in]: portefeuille }
                },
                attributes: ['id']
            })

            const dossiersValides = dossiersExistants.map(d => d.id);
            const portefeuillesValides = portefeuillesExistants.map(d => d.id);

            if (dossiersValides.length > 0) {
                const dossiersDejaLies = await compteDossiers.findAll({
                    where: {
                        user_id,
                        id_dossier: { [Op.in]: dossiersValides }
                    },
                    attributes: ['id_dossier']
                });

                const dossiersDejaLiesIds = dossiersDejaLies.map(d => d.id_dossier);

                const dossiersAInserer = dossiersValides.filter(
                    id => !dossiersDejaLiesIds.includes(id)
                );

                if (dossiersAInserer.length > 0) {
                    await compteDossiers.bulkCreate(
                        dossiersAInserer.map(id_dossier => ({
                            user_id,
                            id_dossier
                        }))
                    );
                }
            }

            if (portefeuillesValides.length > 0) {
                const portefeuillesDejaLies = await comptePortefeuilles.findAll({
                    where: {
                        user_id,
                        id_portefeuille: { [Op.in]: portefeuillesValides }
                    },
                    attributes: ['id_portefeuille']
                });

                const portefeuillesDejaLiesIds = portefeuillesDejaLies.map(d => d.id_portefeuille);

                const portefeuillesAInserer = portefeuillesValides.filter(
                    id => !portefeuillesDejaLiesIds.includes(id)
                );

                if (portefeuillesAInserer.length > 0) {
                    await comptePortefeuilles.bulkCreate(
                        portefeuillesAInserer.map(id_portefeuille => ({
                            user_id,
                            id_portefeuille
                        }))
                    );
                }
            }

            const compteUpdated = await users.findByPk(user_id);

            return res.status(200).json({
                message: "Sous-compte modifié avec succès",
                state: true,
                compte: compteUpdated
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur serveur",
            state: false,
            error: error.message
        });
    }
};

exports.deleteSelectedSousCompte = async (req, res) => {
    try {
        const { sousCompteIds } = req.body;

        if (!Array.isArray(sousCompteIds)) {
            return res.status(404).json({ message: 'Ids des sous-comptes non trouvés', state: false });
        }

        const sousComptes = await users.findAll({
            where: { id: sousCompteIds }
        });

        const result = await users.destroy({
            where: { id: sousCompteIds }
        });

        const comptesMap = {};
        sousComptes.forEach(sc => {
            if (!comptesMap[sc.compte_id]) comptesMap[sc.compte_id] = [];
            comptesMap[sc.compte_id].push(sc);
        });

        for (const compteId in comptesMap) {
            const compteParent = await userscomptes.findByPk(compteId);
            if (compteParent && compteParent.email) {
                const rows = comptesMap[compteId].map(sc => `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 6px">${sc.username}</td>
                        <td style="border: 1px solid #ccc; padding: 6px">${sc.email}</td>
                    </tr>
                `).join('');

                const htmlTable = `
                    <div style="font-family:Arial,sans-serif;">
                      <h2 style="color:#d32f2f;">Sous-comptes supprimés</h2>
                      <p>Bonjour,</p>
                      <p>Les sous-comptes suivants ont été supprimés :</p>
                      <table style="border-collapse: collapse; width: 100%;">
                        <thead>
                          <tr>
                            <th style="border: 1px solid #ccc; padding: 6px; background:#1A5276; text-align: left; color : #fff">Nom du sous-compte</th>
                            <th style="border: 1px solid #ccc; padding: 6px; background:#1A5276; text-align: left; color : #fff">Email du sous-compte</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rows}
                        </tbody>
                      </table>
                      <p>Cordialement,<br>L'équipe Kaonti</p>
                    </div>
                `;

                transporter.sendMail({
                    from: `"Kaonti" <${process.env.MAIL_USER}>`,
                    to: compteParent.email,
                    subject: "Suppression de sous-comptes",
                    text: `Bonjour, les sous-comptes suivants ont été supprimés : ${comptesMap[compteId].map(sc => sc.email).join(', ')}`,
                    html: htmlTable
                })
                    .then(info => console.log("Email envoyé pour suppression de sous-compte :", info.messageId))
                    .catch(err => console.error("Erreur envoi mail :", err));
            }
        }

        return res.status(200).json({
            state: true,
            message: `${result} sous-compte(s) supprimé(s) avec succès`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.matchPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!id) {
            return res.status(409).json({ message: 'Id du sous-compte non trouvés', state: false });
        }
        if (!password) {
            return res.status(409).json({ message: 'Veuillez saisir le mot de passe s\'il vous plaît', state: false });
        }
        const sousCompte = await users.findByPk(id);
        if (!sousCompte) {
            return res.status(409).json({ message: 'Sous-compte non trouvé', state: false });
        }
        const match = await bcrypt.compare(password, sousCompte.password);
        if (match) {
            return res.status(200).json({ message: 'Mot de passe correcte', state: true });
        }
        else {
            return res.status(200).json({ message: 'Mot de passe incorrecte', state: false });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.sendCodeToEmail = async (req, res) => {
    try {
        const { code, id_compte } = req.body;

        if (!code || !id_compte) {
            return res.status(409).json({ message: 'Champ incomplet', state: false });
        }

        const sousCompte = await users.findByPk(id_compte);

        if (!sousCompte || !sousCompte.email) {
            return res.status(404).json({ message: 'Sous-compte non trouvé ou email manquant', state: false });
        }

        await transporter.sendMail({
            from: `"Kaonti" <${process.env.MAIL_USER}>`,
            to: sousCompte.email,
            subject: "Code de validation",
            text: `Bonjour,\n\nVoici votre code de validation : ${code}\n\nMerci de ne pas le partager.`,
            html: `<div style="font-family:Arial,sans-serif;">
                    <h2 style="color:#1976d2;">Code de validation</h2>
                    <p>Bonjour,</p>
                    <p>Voici votre code de validation : <strong>${code}</strong></p>
                    <p>Merci de ne pas le partager.</p>
                  </div>`
        })
            .then(info => console.log("Email envoyé pour le code de validation :", info.messageId))
            .catch(err => console.error("Erreur envoi mail :", err));

        return res.status(200).json({
            message: 'Code envoyé avec succès',
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!id) {
            return res.status(409).json({ message: 'Id non trouvé', state: false });
        }
        if (!password) {
            return res.status(409).json({ message: 'Mot de passe non fourni', state: false });
        }

        const sousCompte = await users.findByPk(id);

        if (!sousCompte) {
            return res.status(409).json({ message: 'Sous-compte non trouvé', state: false });
        }

        const hashedPwd = await bcrypt.hash(password, 10);

        await sousCompte.update({
            password: hashedPwd
        });

        res.status(200).json({
            message: 'Mot de passe modifié avec succès',
            state: true
        });

        transporter.sendMail({
            from: `"Kaonti" <${process.env.MAIL_USER}>`,
            to: sousCompte.email,
            subject: "Confirmation de modification du mot de passe",
            text: `Bonjour ${sousCompte.username || ''},\n\nVotre mot de passe a été modifié avec succès.\n\nSi vous n'êtes pas à l'origine de cette action, veuillez contacter immédiatement le support.`,
            html: `<div style="font-family:Arial,sans-serif;">
                    <h2 style="color:#1976d2;">Modification du mot de passe</h2>
                    <p>Bonjour <strong>${sousCompte.username || ''}</strong>,</p>
                    <p>Votre mot de passe a été modifié avec succès.</p>
                    <p>Si vous n'êtes pas à l'origine de cette action, <span style="color:red;">contactez immédiatement notre support</span>.</p>
                  </div>`
        })
            .then(info => console.log("Email envoyé pour la modification de mot de passe :", info.messageId))
            .catch(err => console.error("Erreur envoi mail :", err));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(409).json({ message: "Veuillez saisir l'email s'il vous plaît", state: false });
        }

        const sousCompte = await users.findOne({ where: { email } });
        if (!sousCompte) {
            return res.status(409).json({ message: "Sous-compte non trouvé", state: false });
        }

        const lastToken = await resettokens.findOne({
            where: {
                user_id: sousCompte.id,
            },
            order: [['createdAt', 'DESC']],
        })

        const now = new Date();
        if (lastToken) {
            const elapsed = (now - lastToken.createdAt) / 1000;
            if (elapsed < 60) {
                return res.status(429).json({
                    message: `Veuillez patienter ${Math.ceil(60 - elapsed)}s avant de réessayer.`,
                    state: false
                });
            }
        }

        await resettokens.destroy({
            where: {
                user_id: sousCompte.id,
            }
        })

        const token = jwt.sign(
            { userId: sousCompte.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Création du token dans la base
        await resettokens.create({
            user_id: sousCompte.id,
            token_hash: token,
            expires_at: expiresAt,
            used: false
        });

        // Envoi de l'email de réinitialisation
        const resetUrl = `${process.env.FRONT_END_ADMIN_LINK}=${token}`;
        await transporter.sendMail({
            from: `"Kaonti" <${process.env.MAIL_USER}>`,
            to: sousCompte.email,
            subject: "Réinitialisation de votre mot de passe",
            text: `Bonjour ${sousCompte.username || ''},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}\n\nCe lien est valable 1 heure.`,
            html: `<div style="font-family:Arial,sans-serif;">
                    <h2 style="color:#1976d2;">Réinitialisation du mot de passe</h2>
                    <p>Bonjour <strong>${sousCompte.username || ''}</strong>,</p>
                    <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
                    <p><a href="${resetUrl}" style="background-color:#1976d2;color:white;padding:8px 12px;text-decoration:none;border-radius:4px;">Réinitialiser le mot de passe</a></p>
                    <p>Ce lien expire dans 1 heure.</p>
                  </div>`
        })
            .then(info => console.log("Email envoyé :", info.messageId))
            .catch(err => console.error("Erreur envoi mail :", err));

        return res.status(200).json({
            message: "Email de réinitialisation envoyé avec succès",
            state: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.updateForgotPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, token } = req.body;

        if (!id) {
            return res.status(409).json({ message: 'Id non trouvé', state: false });
        }
        if (!password || !token) {
            return res.status(409).json({ message: 'Champ non fourni', state: false });
        }

        const expiredToken = await resettokens.findOne({
            where: {
                user_id: id,
                token_hash: token
            }
        })

        if (!expiredToken) {
            return res.status(409).json({ message: 'Token invalide', state: false });
        }

        if (expiredToken.used) {
            return res.status(409).json({ message: 'Le token est déjà utilisé, veuillez renvoyer un autre code', state: false });
        }

        if (expiredToken.expires_at.getTime() <= Date.now()) {
            return res.status(409).json({ message: 'Le token est expiré, veuillez renvoyer une autre code', state: false });
        }

        await expiredToken.destroy();

        const sousCompte = await users.findByPk(id);

        if (!sousCompte) {
            return res.status(409).json({ message: 'Sous-compte non trouvé', state: false });
        }

        const hashedPwd = await bcrypt.hash(password, 10);

        await sousCompte.update({
            password: hashedPwd
        });

        res.status(200).json({
            message: 'Mot de passe modifié avec succès',
            state: true
        });

        transporter.sendMail({
            from: `"Kaonti" <${process.env.MAIL_USER}>`,
            to: sousCompte.email,
            subject: "Confirmation de modification du mot de passe",
            text: `Bonjour ${sousCompte.username || ''},\n\nVotre mot de passe a été modifié avec succès.\n\nSi vous n'êtes pas à l'origine de cette action, veuillez contacter immédiatement le support.`,
            html: `<div style="font-family:Arial,sans-serif;">
                    <h2 style="color:#1976d2;">Modification du mot de passe</h2>
                    <p>Bonjour <strong>${sousCompte.username || ''}</strong>,</p>
                    <p>Votre mot de passe a été modifié avec succès.</p>
                    <p>Si vous n'êtes pas à l'origine de cette action, <span style="color:red;">contactez immédiatement notre support</span>.</p>
                  </div>`
        })
            .then(info => console.log("Email envoyé pour la modification de mot de passe :", info.messageId))
            .catch(err => console.error("Erreur envoi mail :", err));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.verifyResetToken = async (req, res) => {
    try {
        const { token, userId } = req.body;

        if (!token || !userId) {
            return res.status(409).json({ message: 'Token ou Id incomplet', state: false });
        }

        const expiredToken = await resettokens.findOne({
            where: {
                user_id: userId,
                token_hash: token
            }
        })

        if (!expiredToken) {
            return res.status(409).json({ message: 'Token non trouvé', state: false });
        }

        if (expiredToken.used) {
            return res.status(200).json({ message: 'Le token est déjà utilisé', state: false });
        }

        if (expiredToken.expires_at.getTime() <= Date.now()) {
            return res.status(409).json({ message: 'Le token est expiré, veuillez renvoyer une autre code', state: false });
        } else {
            return res.status(200).json({ message: 'Le token n\'est pas encore est expiré, veuillez renvoyer une autre code', state: true });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
}

exports.getUserPermissions = async (req, res) => {
    try {
        const { sousCompteId } = req.body;

        if (!Array.isArray(sousCompteId) || sousCompteId.length === 0) {
            return res.status(409).json({ message: 'Aucun sous-compte sélectionné', state: false });
        }

        const permissionData = await permissions.findAll({});
        const roleData = await roles.findAll({});

        for (const id of sousCompteId) {

            const userData = await users.findByPk(id, {
                include: [{ model: roles, as: "role" }]
            });

            if (!userData) continue;

            let userPermissionData = await userPermission.findAll({
                where: { user_id: id }
            });

            if (userPermissionData.length === 0) {

                const rolePermissionData = await rolePermission.findAll({
                    where: { role_id: userData.role_id }
                });

                for (const rp of rolePermissionData) {
                    await userPermission.create({
                        user_id: id,
                        permission_id: rp.permission_id,
                        allowed: rp.allowed
                    });
                }
            }
        }

        const results = await users.findAll({
            where: { id: sousCompteId },
            include: [
                { model: roles, as: "role" },
                {
                    model: userPermission,
                    as: "userpermissions",
                    include: [
                        {
                            model: permissions,
                            as: "permission",
                            attributes: ["id", "nom"]
                        }
                    ],
                    order: [[{ model: permissions, as: 'permission' }, 'id', 'ASC']]
                }
            ]
        });

        return res.status(200).json({
            state: true,
            list: results,
            listPermissions: permissionData,
            listRoles: roleData
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", state: false, error: error.message });
    }
};

exports.updateUserPermission = async (req, res) => {
    try {
        const { userId, permissionId, allowed } = req.body;

        if (!userId || !permissionId) {
            return res.status(409).json({ message: 'Réponse non trouvée', state: false });
        }

        await userPermission.update(
            { allowed },
            {
                where: {
                    user_id: userId,
                    permission_id: permissionId
                }
            }
        );

        return res.status(200).json({ message: 'Permission mise à jour', state: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;

        if (!userId || !roleId) {
            return res.status(409).json({ message: 'Données incomplet', state: false });
        }

        await users.update(
            { role_id: roleId },
            {
                where: {
                    id: userId,
                }
            }
        );

        return res.status(200).json({ message: 'Rôle mise à jour', state: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
};

exports.getAllRoles = async (req, res) => {
    try {
        const rolesData = await roles.findAll({ order: [['id', 'ASC']] });
        return res.status(200).json(rolesData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
}

exports.getAllCompteDossiers = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(409).json({ message: 'Utilisateur non trouvé', state: false });
        }
        const user_id = Number(userId);
        const compteDossierData = (await compteDossiers.findAll({
            where: {
                user_id
            },
            include: [
                { model: dossiers, attributes: ['dossier'] }
            ]
        })).map(val => {
            const data = val.toJSON();
            data.id_dossier = Number(val.id_dossier);
            data.user_id = Number(val.user_id);
            data.dossier = val?.dossier?.dossier;
            return data;
        })
        return res.status(200).json(compteDossierData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
}

exports.deleteCompteDossiers = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(409).json({ message: 'Identifiant non trouvé', state: false })
        }
        const compteDossiersData = await compteDossiers.findByPk(id);
        if (compteDossiersData) {
            await compteDossiersData.destroy();
            return res.status(200).json({ message: 'Supprimé avec succès', state: true })
        } else {
            return res.status(409).json({ message: 'Données non trouvé', state: false })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
}

exports.addCompteDossiers = async (req, res) => {
    try {
        const { idDossier, userId } = req.body;
        if (!idDossier || !userId) {
            return res.status(409).json({ message: 'Paramètres manquantes', state: false });
        }
        const id_dossier = Number(idDossier);
        const user_id = Number(userId);

        const testIfExist = await compteDossiers.findOne({
            where: {
                id_dossier,
                user_id
            }
        })

        if (testIfExist) {
            return res.status(200).json({ message: 'Ces données existes déjà', state: false })
        }

        const compteDossierCreated = await compteDossiers.create({
            id_dossier,
            user_id
        });

        if (compteDossierCreated) {
            return res.status(200).json({ message: 'Ajouté avec succès', state: true })
        } else {
            return res.status(400).json({ message: 'Erreur lors de l\'ajout', state: false })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
}

exports.addOrUpdateCompteDossier = async (req, res) => {
    try {
        const { userId, idCompteDossier, idDossier } = req.body;

        if (!userId || !idDossier) {
            return res.status(400).json({
                state: false,
                msg: 'Champs obligatoires manquants'
            });
        }

        const user_id = Number(userId);
        const id_dossier = Number(idDossier);
        const id_compte_dossier = Number(idCompteDossier);

        if ([user_id, id_dossier, id_compte_dossier].some(isNaN)) {
            return res.status(400).json({
                state: false,
                msg: "Identifiants invalides"
            });
        }

        let resData = { state: false, msg: '' };

        if (!id_compte_dossier || id_compte_dossier <= 0) {
            await compteDossiers.create({
                user_id,
                id_dossier,
            });

            resData.state = true;
            resData.msg = "Nouvelle ligne sauvegardée avec succès.";
        }
        else {
            const exist = await compteDossiers.findOne({
                where: {
                    id: id_compte_dossier,
                    user_id,
                    id_dossier
                }
            });

            if (!exist) {
                return res.status(404).json({
                    state: false,
                    msg: "Consolidation introuvable"
                });
            }

            await compteDossiers.update(
                { id_dossier },
                { where: { id: id_compte_dossier } }
            );

            resData.state = true;
            resData.msg = "Modification effectuée avec succès.";
        }

        return res.json(resData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            state: false,
            msg: "Erreur serveur",
            error: error.message
        });
    }
};

exports.getAllComptePortefeuilles = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(409).json({ message: 'Utilisateur non trouvé', state: false });
        }
        const user_id = Number(userId);
        const comptePortefeuilleData = (await comptePortefeuilles.findAll({
            where: {
                user_id
            },
            include: [
                { model: portefeuilles, attributes: ['nom'] }
            ]
        })).map(val => {
            const data = val.toJSON();
            data.id = Number(val.id);
            data.id_portefeuille = Number(val.id_portefeuille);
            data.user_id = Number(val.user_id);
            data.portefeuille = val?.portefeuille?.nom;
            return data;
        })
        return res.status(200).json({ state: true, walletlist: comptePortefeuilleData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
}