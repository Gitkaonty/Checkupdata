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
db.userscomptes = require('./compteModel')(sequelize, DataTypes);
db.dossiers = require('./dossiersModel')(sequelize, DataTypes);
db.dossierassocies = require('./dossiersAssociesModel')(sequelize, DataTypes);
db.dossierfiliales = require('./dossiersFilialesModel')(sequelize, DataTypes);
db.modelePlanComptable = require('./modelePCModele')(sequelize, DataTypes);
db.dossierplancomptable = require('./dossierPCModel')(sequelize, DataTypes);
db.modeleplancomptabledetail = require('./modelePCDetailModel')(sequelize, DataTypes);
db.modeleplancomptabledetailcptchg = require('./modelePCDetailsCptChgModel')(sequelize, DataTypes);
db.modeleplancomptabledetailcpttva = require('./modelePCDetailCptTvaModel')(sequelize, DataTypes);
db.exercices = require('./exercicesModel')(sequelize, DataTypes);
db.dombancaires = require('./domBancaireModel')(sequelize, DataTypes);
db.balances = require('./balanceModel')(sequelize, DataTypes);
db.codejournals = require('./codejournalsModel')(sequelize, DataTypes);
db.dossierpcdetailcptchg = require('./dossierPCDetailCptChgModel')(sequelize, DataTypes);
db.dossierpcdetailcpttva = require('./dossierPCDetailCptTvaModel')(sequelize, DataTypes);
db.listecodetvas = require('./listeCodetvasModel')(sequelize, DataTypes);
db.paramtvas = require('./paramtvasModel')(sequelize, DataTypes);
db.liassebhiapcs = require('./liassebhiapcModel')(sequelize, DataTypes);
db.liassebilans = require('./liassebilanModel')(sequelize, DataTypes);
db.liassecrfs = require('./liassecrfModel')(sequelize, DataTypes);
db.liassecrns = require('./liassecrnModel')(sequelize, DataTypes);
db.liassedas = require('./liassedaModel')(sequelize, DataTypes);
db.liassedps = require('./liassedpModel')(sequelize, DataTypes);
db.liassedrfs = require('./liassedrfModel')(sequelize, DataTypes);
db.liasseeiafncs = require('./liasseeiafncModel')(sequelize, DataTypes);
db.liasseevcps = require('./liasseevcpModel')(sequelize, DataTypes);
db.liassempautres = require('./liassempautreModel')(sequelize, DataTypes);
db.liassemps = require('./liassempModel')(sequelize, DataTypes);
db.liassenotes = require('./liassenoteModel')(sequelize, DataTypes);
db.liassesads = require('./liassesadModel')(sequelize, DataTypes);
db.liassesdrs = require('./liassesdrModel')(sequelize, DataTypes);
db.liasseses = require('./liasseseModel')(sequelize, DataTypes);
db.liassetftds = require('./liassetftdModel')(sequelize, DataTypes);
db.liassetftis = require('./liassetftiModel')(sequelize, DataTypes);
db.etats = require('./etatsModel')(sequelize, DataTypes);
db.etatsdeclarations = require('./etatsDeclarationsModel')(sequelize, DataTypes);
db.pays = require('./paysModel')(sequelize, DataTypes);
db.etatsmatrices = require('./etatsMatriceModel')(sequelize, DataTypes);
db.rubriques = require('./rubriquesModel')(sequelize, DataTypes);
db.rubriquesmatrices = require('./rubriquesMatriceModel')(sequelize, DataTypes);
db.compterubriques = require('./compterubriqueModel')(sequelize, DataTypes);
db.compterubriquematrices = require('./compterubriqueMatriceModel')(sequelize, DataTypes);
db.situations = require('./situationsModel')(sequelize, DataTypes);
db.journals = require('./journalsModel')(sequelize, DataTypes);
db.detailsimmo = require('./detailsImmoModel')(sequelize, DataTypes);
db.detailsImmoLignes = require('./detailsImmoLignesModel')(sequelize, DataTypes);
db.balanceimportees = require('./balanceimporteesModel')(sequelize, DataTypes);
db.ajustements = require('./ajustementModel')(sequelize, DataTypes);
db.devises = require('./deviseModel')(sequelize, DataTypes);
db.controles = require('./controlesModel')(sequelize, DataTypes);
db.controlematrices = require('./controlematricesModel')(sequelize, DataTypes);
db.controlematricedetails = require('./controlematricedetailsModel')(sequelize, DataTypes);
db.etatsCentresFiscales = require('./etatsCentresFiscales')(sequelize, DataTypes);
db.etatsCentresFiscalesmatrices = require('./etatsCentresFiscalesMatrices')(sequelize, DataTypes);
db.etatsDge = require('./etatsDge')(sequelize, DataTypes);
db.etatsDgeMatrices = require('./etatsDgeMatrices')(sequelize, DataTypes);
// Unified TVA form tables
db.formulaireTvaAnnexes = require('./formulaireTvaAnnexes')(sequelize, DataTypes);
db.formulaireTvaAnnexesMatrices = require('./formulaireTvaAnnexesMatrices')(sequelize, DataTypes);
db.etatsTvaAnnexes = require('./etatsTvaAnnexes')(sequelize, DataTypes);
db.anomaliesFormulaireTva = require('./anomaliesFormulaireTvaModel')(sequelize, DataTypes);
//
db.droitcommas = require('./droitCommModelA')(sequelize, DataTypes);
db.droitcommbs = require('./droitCommModelB')(sequelize, DataTypes);
db.etatscomms = require('./etatsCommModel')(sequelize, DataTypes);
db.etatscomatrices = require('./etatsCommMatriceModel')(sequelize, DataTypes);
db.etatsplp = require('./etatsPlpModel')(sequelize, DataTypes);
db.etatsplpmatrices = require('./etatsPlpMatriceModel')(sequelize, DataTypes);
db.resetToken = require('./resetTokenModel')(sequelize, DataTypes);
db.isi = require('./isiModel')(sequelize, DataTypes);
db.compteDossiers = require('./compteDossierModel')(sequelize, DataTypes);
db.comptePortefeuilles = require('./comptePortefeuilleModel')(sequelize, DataTypes);

db.consolidationDossier = require('./consolidationDossierModel')(sequelize, DataTypes);
db.consolidationCompte = require('./consolidationCompteModel')(sequelize, DataTypes);
db.dossierPasswordAccess = require('./dossiersMotDePasseAcces')(sequelize, DataTypes);

db.periodes = require('./periode')(sequelize, DataTypes);

//
db.compteRubriquesExternesMatrices = require('./compteRubriqueExterneMatriceModel')(sequelize, DataTypes);
db.rubriquesExternesMatrices = require('./rubriquesExterneMatriceModel')(sequelize, DataTypes);
//

//
db.caSections = require('./caSectionMolel')(sequelize, DataTypes);
db.caAxes = require('./caAxeModel')(sequelize, DataTypes);
db.analytiques = require('./analytiqueModel')(sequelize, DataTypes);
//

//
db.localites = require('./localites')(sequelize, DataTypes);
//

//
db.abonnements = require('./abonnementModel')(sequelize, DataTypes);
db.paiements = require('./paiementModel')(sequelize, DataTypes);
//

//
db.rapprochements = require('./rapprochementsModel')(sequelize, DataTypes);
db.rubriquesExternes = require('./rubriquesExternesModel')(sequelize, DataTypes);
db.compteRubriquesExternes = require('./compteRubriqueExterneModel')(sequelize, DataTypes);
db.rubriqueExternesEvcp = require('./rubriqueExternesEvcpModel')(sequelize, DataTypes);
db.ajustementExternes = require('./ajustementExterneModel')(sequelize, DataTypes);
//

//
db.rubriquesExternesAnalytiques = require('./rubriquesExternesAnalytiqueModel')(sequelize, DataTypes);
db.ajustemenExternesAnalytiques = require('./ajustementExterneAnalytiqueModel')(sequelize, DataTypes);
db.etatsEtatFinancierAnalitiques = require('./etatsEtatFinancierAnalytiqueModel')(sequelize, DataTypes);
db.balanceAnalytiques = require('./balanceAnalytiqueModel')(sequelize, DataTypes);
db.rubriqueExternesEvcpAnalytiques = require('./rubriqueExternesEvcpAnalytiqueModel')(sequelize, DataTypes);
//

//
db.etatsEtatFinancier = require('./etatsEtatFinancierModel')(sequelize, DataTypes);
db.etatsEtatFinancierMatrice = require('./etatsEtatFinancierMatriceModel')(sequelize, DataTypes);
//

//
db.portefeuille = require('./portefeuilleModel')(sequelize, DataTypes);
//

//Gsetion rôle et permission
db.roles = require('./rolesModel')(sequelize, DataTypes);
db.permissions = require('./permissionsModel')(sequelize, DataTypes);
db.userPermission = require('./userPermissionsModel')(sequelize, DataTypes);
db.rolePermission = require('./rolePermissionsModel')(sequelize, DataTypes);
//

const Devise = require('./deviseModel')(sequelize, DataTypes);
db.Devise = Devise;
db.Devise.belongsTo(db.userscomptes, { foreignKey: 'id_compte' });
db.userscomptes.hasMany(db.Devise, { foreignKey: 'id_compte' });
db.classifications = require('./classificationModel')(sequelize, DataTypes);
db.fonctions = require('./fonctionModel')(sequelize, DataTypes);
db.personnels = require('./personnelModel')(sequelize, DataTypes);
db.irsa = require('./irsaModel')(sequelize, DataTypes);
db.paies = require('./paie')(sequelize, DataTypes);
db.historiqueDeclaration = require('./historiqueDeclarationModel')(sequelize, DataTypes);
db.tva_annexes = require('./etatsTvaAnnexes')(sequelize, DataTypes);


// Appel explicite de la méthode associate pour HistoriqueIrsa
if (db.historiqueDeclaration.associate) {
    db.historiqueDeclaration.associate(db);
}

//définition des associations
db.rubriques.belongsTo(db.rubriquesmatrices, { as: 'rubriquematrix', foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.rubriques.hasMany(db.ajustements, { as: 'ajusts', foreignKey: 'id_rubrique', sourceKey: 'id_rubrique' });
db.rubriques.hasMany(db.balances, { as: 'details', foreignKey: 'rubriquebilanbrut', sourceKey: 'id_rubrique' });
db.rubriques.hasMany(db.balances, { as: 'detailsCRN', foreignKey: 'rubriquecrn', sourceKey: 'id_rubrique' });
db.rubriques.hasMany(db.balances, { as: 'detailsCRF', foreignKey: 'rubriquecrf', sourceKey: 'id_rubrique' });
db.rubriques.hasMany(db.balances, { as: 'detailsTFTI', foreignKey: 'rubriquetfti', sourceKey: 'id_rubrique' });
db.rubriques.hasMany(db.balances, { as: 'detailsTFTD', foreignKey: 'rubriquetftd', sourceKey: 'id_rubrique' });

//
db.userscomptes.hasMany(db.devises, { foreignKey: 'id_compte', sourceKey: 'id' });
db.dossierplancomptable.hasMany(db.journals, { foreignKey: 'id_numcpt', sourceKey: 'id' });
db.codejournals.hasMany(db.journals, { foreignKey: 'id_journal', sourceKey: 'id' });
db.dossiers.hasMany(db.journals, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.dossiers.hasMany(db.dossierplancomptable, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.dossierplancomptable.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.balances.belongsTo(db.dossierplancomptable, { as: 'infosCompte', foreignKey: 'id_numcompte', targetKey: 'id' });
db.liassebhiapcs.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassedas.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassedps.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassedrfs.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassedrfs.hasMany(db.ajustements, { as: 'ajustsDRF', foreignKey: 'id_rubrique', sourceKey: 'id_rubrique' });
db.liasseeiafncs.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liasseevcps.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liasseevcps.hasMany(db.ajustements, { as: 'ajustsEVCP', foreignKey: 'id_rubrique', sourceKey: 'id_rubrique' });
db.liassempautres.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassemps.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassenotes.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassesads.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassesads.hasMany(db.ajustements, { as: 'ajustsSAD', foreignKey: 'id_rubrique', sourceKey: 'id_rubrique' });
db.liassesdrs.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });
db.liassesdrs.hasMany(db.ajustements, { as: 'ajustsSDR', foreignKey: 'id_rubrique', sourceKey: 'id_rubrique' });
db.liasseses.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });

//
db.devises.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.journals.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id' });
db.journals.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcptcentralise', targetKey: 'id', as: 'compteCentralise' });
db.journals.belongsTo(db.codejournals, { foreignKey: 'id_journal', targetKey: 'id' });
db.journals.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

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

// Compte dossier
// db.users.hasMany(db.compteDossiers, { foreignKey: 'user_id', sourceKey: 'id' });
// db.compteDossiers.belongsToMany(db.users, { foreignKey: 'user_id', targetKey: 'id' });

// db.dossiers.hasMany(db.compteDossiers, { foreignKey: 'id_dossier', sourceKey: 'id' });
// db.compteDossiers.belongsToMany(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

// db.users.belongsToMany(db.dossiers, { through: db.compteDossiers, foreignKey: 'user_id', otherKey: 'id_dossier'});
// db.dossiers.belongsToMany(db.users, { through: db.compteDossiers, foreignKey: 'id_dossier',otherKey: 'user_id'});

db.users.belongsToMany(db.dossiers, { through: db.compteDossiers, foreignKey: 'user_id', otherKey: 'id_dossier' });
db.dossiers.belongsToMany(db.users, { through: db.compteDossiers, foreignKey: 'id_dossier', otherKey: 'user_id' });

db.compteDossiers.belongsTo(db.users, { foreignKey: 'user_id' });
db.compteDossiers.belongsTo(db.dossiers, { foreignKey: 'id_dossier' });

// Compte portefeuille
db.users.belongsToMany(db.portefeuille, { through: db.comptePortefeuilles, foreignKey: 'user_id', otherKey: 'id_portefeuille' });
db.portefeuille.belongsToMany(db.users, { through: db.comptePortefeuilles, foreignKey: 'id_portefeuille', otherKey: 'user_id' });

db.comptePortefeuilles.belongsTo(db.users, { foreignKey: 'user_id' });
db.comptePortefeuilles.belongsTo(db.portefeuille, { foreignKey: 'id_portefeuille' });


// Dossier password access
db.users.hasMany(db.dossierPasswordAccess, { foreignKey: 'user_id', sourceKey: 'id' });
db.dossierPasswordAccess.belongsTo(db.users, { foreignKey: 'user_id', targetKey: 'id' });

db.dossiers.hasMany(db.dossierPasswordAccess, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.dossierPasswordAccess.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

// Portefeuille
// db.portefeuille.hasMany(db.dossiers, { foreignKey: 'id_portefeuille', sourceKey: 'id' });
// db.dossiers.belongsTo(db.portefeuille, { foreignKey: 'id_portefeuille', targetKey: 'id' });

// Droit de communication
// Première table
db.userscomptes.hasMany(db.droitcommas, { foreignKey: 'id_compte', sourceKey: 'id' });
db.droitcommas.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.droitcommas, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.droitcommas.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.droitcommas, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.droitcommas.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.dossierplancomptable.hasMany(db.droitcommas, { foreignKey: 'id_numcpt', sourceKey: 'id' });
db.droitcommas.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id' });

// Deuxième table
db.userscomptes.hasMany(db.droitcommbs, { foreignKey: 'id_compte', sourceKey: 'id' });
db.droitcommbs.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.droitcommbs, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.droitcommbs.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.droitcommbs, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.droitcommbs.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.dossierplancomptable.hasMany(db.droitcommbs, { foreignKey: 'id_numcpt', sourceKey: 'id' });
db.droitcommbs.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id' });

// Etat comm
db.userscomptes.hasMany(db.etatscomms, { foreignKey: 'id_compte', sourceKey: 'id' });
db.etatscomms.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.droitcommas, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.etatscomms.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.etatscomms, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.etatscomms.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

// Etat plp
db.userscomptes.hasMany(db.etatsplp, { foreignKey: 'id_compte', sourceKey: 'id' });
db.etatsplp.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.droitcommas, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.etatsplp.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.etatsplp, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.etatsplp.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

// Comptabilité analitique

// Axe
db.userscomptes.hasMany(db.caAxes, { foreignKey: 'id_compte', sourceKey: 'id' });
db.caAxes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.caAxes, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.caAxes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

// Section
db.userscomptes.hasMany(db.caSections, { foreignKey: 'id_compte', sourceKey: 'id' });
db.caSections.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.caSections, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.caSections.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.caSections.belongsTo(db.caAxes, { foreignKey: 'id_axe', targetKey: 'id', as: 'axe' });
db.caAxes.hasMany(db.caSections, { foreignKey: 'id_axe', sourceKey: 'id', as: 'sections' });

// Periode
db.userscomptes.hasMany(db.periodes, { foreignKey: 'id_compte', sourceKey: 'id' });
db.periodes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.periodes, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.periodes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.periodes, { foreignKey: 'id_exercice', sourceKey: 'id', as: 'periodes' });
db.periodes.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id', as: 'exercice' });

// Analytique
db.userscomptes.hasMany(db.analytiques, { foreignKey: 'id_compte', sourceKey: 'id' });
db.analytiques.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.analytiques, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.analytiques.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.analytiques, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.analytiques.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.analytiques.belongsTo(db.caAxes, { foreignKey: 'id_axe', targetKey: 'id', as: 'axe' });
db.caAxes.hasMany(db.analytiques, { foreignKey: 'id_axe', sourceKey: 'id' });

db.analytiques.belongsTo(db.caSections, { foreignKey: 'id_section', targetKey: 'id', as: 'section' });
db.caSections.hasMany(db.analytiques, { foreignKey: 'id_section', sourceKey: 'id' });

db.analytiques.belongsTo(db.journals, { foreignKey: 'id_ligne_ecriture', targetKey: 'id', as: 'journals' });
db.journals.hasMany(db.analytiques, { foreignKey: 'id_ligne_ecriture', sourceKey: 'id' });

// Balance analytique
db.userscomptes.hasMany(db.balanceAnalytiques, { foreignKey: 'id_compte', sourceKey: 'id' });
db.balanceAnalytiques.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.balanceAnalytiques, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.balanceAnalytiques.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.balanceAnalytiques, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.balanceAnalytiques.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.dossierplancomptable.hasMany(db.balanceAnalytiques, { foreignKey: 'id_numcpt', sourceKey: 'id', as: 'balanceanalytique' });
db.balanceAnalytiques.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id', as: 'compteLibelle' });

db.balanceAnalytiques.belongsTo(db.caAxes, { foreignKey: 'id_axe', targetKey: 'id' });
db.caAxes.hasMany(db.balanceAnalytiques, { foreignKey: 'id_axe', sourceKey: 'id' });

db.balanceAnalytiques.belongsTo(db.caSections, { foreignKey: 'id_section', targetKey: 'id' });
db.caSections.hasMany(db.balanceAnalytiques, { foreignKey: 'id_section', sourceKey: 'id' });

// Reset Token
db.users.hasMany(db.resetToken, { foreignKey: 'user_id', sourceKey: 'id' });
db.resetToken.belongsTo(db.users, { foreignKey: 'user_id', targetKey: 'id' });

// Déclaration isi
db.userscomptes.hasMany(db.isi, { foreignKey: 'id_compte', sourceKey: 'id' });
db.isi.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.isi, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.isi.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.isi, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.isi.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.dossierplancomptable.hasMany(db.isi, { foreignKey: 'id_numcpt', sourceKey: 'id' });
db.isi.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id' });

// Rubriques externes
db.userscomptes.hasMany(db.rubriquesExternes, { foreignKey: 'id_compte', sourceKey: 'id' });
db.rubriquesExternes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.rubriquesExternes, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.rubriquesExternes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.rubriquesExternes, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.rubriquesExternes.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.rubriquesExternes.hasMany(db.ajustementExternes, { foreignKey: 'id_rubrique', sourceKey: 'id_rubrique', as: 'ajusts' });
db.ajustementExternes.belongsTo(db.rubriquesExternes, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique', });

db.rubriquesExternes.hasMany(db.compteRubriquesExternes, { foreignKey: 'id_rubrique', sourceKey: 'id_rubrique', as: 'comptes' });
db.compteRubriquesExternes.belongsTo(db.rubriquesExternes, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique', });

// Rubriques analytique
db.userscomptes.hasMany(db.rubriquesExternesAnalytiques, { foreignKey: 'id_compte', sourceKey: 'id' });
db.rubriquesExternesAnalytiques.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.rubriquesExternesAnalytiques, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.rubriquesExternesAnalytiques.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.rubriquesExternesAnalytiques, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.rubriquesExternesAnalytiques.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.rubriquesExternesAnalytiques.hasMany(db.ajustemenExternesAnalytiques, { foreignKey: 'id_rubrique', sourceKey: 'id_rubrique', as: 'ajusts' });
db.ajustemenExternesAnalytiques.belongsTo(db.rubriquesExternesAnalytiques, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique', });

db.rubriquesExternesAnalytiques.hasMany(db.compteRubriquesExternes, { foreignKey: 'id_rubrique', sourceKey: 'id_rubrique', as: 'comptes' });
db.compteRubriquesExternes.belongsTo(db.rubriquesExternesAnalytiques, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique', });

// Comptes Rubriques externes
db.userscomptes.hasMany(db.compteRubriquesExternes, { foreignKey: 'id_compte', sourceKey: 'id' });
db.compteRubriquesExternes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.compteRubriquesExternes, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.compteRubriquesExternes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.compteRubriquesExternes, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.compteRubriquesExternes.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

// Ajustement externes
db.userscomptes.hasMany(db.ajustementExternes, { foreignKey: 'id_compte', sourceKey: 'id' });
db.ajustementExternes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.ajustementExternes, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.ajustementExternes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.ajustementExternes, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.ajustementExternes.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

// Rubrique externe EVCP
db.userscomptes.hasMany(db.rubriqueExternesEvcp, { foreignKey: 'id_compte', sourceKey: 'id' });
db.rubriqueExternesEvcp.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.rubriqueExternesEvcp, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.rubriqueExternesEvcp.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.rubriqueExternesEvcp, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.rubriqueExternesEvcp.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.rubriqueExternesEvcp.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });

db.rubriqueExternesEvcp.hasMany(db.ajustementExternes, { foreignKey: 'id_rubrique', sourceKey: 'id_rubrique', as: 'ajusts' });
db.ajustementExternes.belongsTo(db.rubriqueExternesEvcp, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique', });

// Rubrique externe EVCP analytiques
db.userscomptes.hasMany(db.rubriqueExternesEvcpAnalytiques, { foreignKey: 'id_compte', sourceKey: 'id' });
db.rubriqueExternesEvcpAnalytiques.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.rubriqueExternesEvcpAnalytiques, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.rubriqueExternesEvcpAnalytiques.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.rubriqueExternesEvcpAnalytiques, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.rubriqueExternesEvcpAnalytiques.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

db.rubriqueExternesEvcpAnalytiques.belongsTo(db.rubriquesmatrices, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique' });

db.rubriqueExternesEvcpAnalytiques.hasMany(db.ajustemenExternesAnalytiques, { foreignKey: 'id_rubrique', sourceKey: 'id_rubrique', as: 'ajusts' });
db.ajustemenExternesAnalytiques.belongsTo(db.rubriqueExternesEvcpAnalytiques, { foreignKey: 'id_rubrique', targetKey: 'id_rubrique', });

// Etats etat financier
db.userscomptes.hasMany(db.etatsEtatFinancier, { foreignKey: 'id_compte', sourceKey: 'id' });
db.etatsEtatFinancier.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.etatsEtatFinancier, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.etatsEtatFinancier.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.etatsEtatFinancier, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.etatsEtatFinancier.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

// Etats etat financier analytique
db.userscomptes.hasMany(db.etatsEtatFinancierAnalitiques, { foreignKey: 'id_compte', sourceKey: 'id' });
db.etatsEtatFinancierAnalitiques.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.etatsEtatFinancierAnalitiques, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.etatsEtatFinancierAnalitiques.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });

db.exercices.hasMany(db.etatsEtatFinancierAnalitiques, { foreignKey: 'id_exercice', sourceKey: 'id' });
db.etatsEtatFinancierAnalitiques.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });

// Abonnement
db.userscomptes.hasMany(db.abonnements, { foreignKey: 'compte_id', sourceKey: 'id' });
db.abonnements.belongsTo(db.userscomptes, { foreignKey: 'compte_id', targetKey: 'id' });

// Paiement
db.userscomptes.hasMany(db.paiements, { foreignKey: 'compte_id', sourceKey: 'id' });
db.paiements.belongsTo(db.userscomptes, { foreignKey: 'compte_id', targetKey: 'id' });

db.classifications.belongsTo(db.dossiers, { foreignKey: 'id_dossier' });
db.dossiers.hasMany(db.classifications, { foreignKey: 'id_dossier' });

db.fonctions.hasMany(db.personnels, { foreignKey: 'id_fonction' });
db.personnels.belongsTo(db.fonctions, { foreignKey: 'id_fonction', as: 'fonction' });

db.classifications.hasMany(db.personnels, { foreignKey: 'id_classe' });
db.personnels.belongsTo(db.classifications, { foreignKey: 'id_classe', as: 'classification' });

db.personnels.hasMany(db.irsa, { foreignKey: 'personnelId' });
db.irsa.belongsTo(db.personnels, { foreignKey: 'personnelId', as: 'personnel' });

db.personnels.hasMany(db.paies, { foreignKey: 'personnelId' });
db.paies.belongsTo(db.personnels, { foreignKey: 'personnelId', as: 'personnel' });

// Consolidation dossier
db.userscomptes.hasMany(db.consolidationDossier, { foreignKey: 'id_compte', sourceKey: 'id' });
db.consolidationDossier.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.consolidationDossier, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.consolidationDossier.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id', as: 'dossierPrincipal', });

db.dossiers.hasMany(db.consolidationDossier, { foreignKey: 'id_dossier_autre', sourceKey: 'id' });
db.consolidationDossier.belongsTo(db.dossiers, { foreignKey: 'id_dossier_autre', targetKey: 'id', as: 'dossierAutre' });

// Consolidation compte
db.userscomptes.hasMany(db.consolidationCompte, { foreignKey: 'id_compte', sourceKey: 'id' });
db.consolidationCompte.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });

db.dossiers.hasMany(db.consolidationCompte, { foreignKey: 'id_dossier', sourceKey: 'id' });
db.consolidationCompte.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id', as: 'dossierPrincipal' });

db.dossiers.hasMany(db.consolidationCompte, { foreignKey: 'id_dossier_autre', sourceKey: 'id' });
db.consolidationCompte.belongsTo(db.dossiers, { foreignKey: 'id_dossier_autre', targetKey: 'id', as: 'dossierAutre' });

db.dossierplancomptable.hasMany(db.consolidationCompte, { foreignKey: 'id_numcpt', sourceKey: 'id' });
db.consolidationCompte.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id', as: 'numCptPrincipal' });

db.dossierplancomptable.hasMany(db.consolidationCompte, { foreignKey: 'id_numcpt_autre', sourceKey: 'id' });
db.consolidationCompte.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt_autre', targetKey: 'id', as: 'numCptAutre' });

//etatsCentresFiscales
db.etatsCentresFiscales.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });
db.dossiers.hasMany(db.etatsCentresFiscales, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.etatsCentresFiscales.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });
db.exercices.hasMany(db.etatsCentresFiscales, { foreignKey: 'id_exercice', sourceKey: 'id' });

db.etatsCentresFiscales.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.userscomptes.hasMany(db.etatsCentresFiscales, { foreignKey: 'id_compte', sourceKey: 'id' });

//etatsDge
db.etatsDge.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });
db.dossiers.hasMany(db.etatsDge, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.etatsDge.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });
db.exercices.hasMany(db.etatsDge, { foreignKey: 'id_exercice', sourceKey: 'id' });

db.etatsDge.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.userscomptes.hasMany(db.etatsDge, { foreignKey: 'id_compte', sourceKey: 'id' });

// TVA Annexes (legacy)
db.etatsTvaAnnexes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });
db.dossiers.hasMany(db.etatsTvaAnnexes, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.etatsTvaAnnexes.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });
db.exercices.hasMany(db.etatsTvaAnnexes, { foreignKey: 'id_exercice', sourceKey: 'id' });

db.etatsTvaAnnexes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.userscomptes.hasMany(db.etatsTvaAnnexes, { foreignKey: 'id_compte', sourceKey: 'id' });

db.etatsTvaAnnexes.belongsTo(db.journals, { foreignKey: 'id_ecriture', targetKey: 'id' });
db.journals.hasMany(db.etatsTvaAnnexes, { foreignKey: 'id_ecriture', sourceKey: 'id' });

db.etatsTvaAnnexes.belongsTo(db.dossierplancomptable, { foreignKey: 'id_numcpt', targetKey: 'id' });
db.dossierplancomptable.hasMany(db.etatsTvaAnnexes, { foreignKey: 'id_numcpt', sourceKey: 'id' });

// Unified TVA Form tables associations
db.formulaireTvaAnnexes.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });
db.dossiers.hasMany(db.formulaireTvaAnnexes, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.formulaireTvaAnnexes.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });
db.exercices.hasMany(db.formulaireTvaAnnexes, { foreignKey: 'id_exercice', sourceKey: 'id' });

db.formulaireTvaAnnexes.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.userscomptes.hasMany(db.formulaireTvaAnnexes, { foreignKey: 'id_compte', sourceKey: 'id' });

// Anomalies Formulaire TVA associations
db.anomaliesFormulaireTva.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });
db.dossiers.hasMany(db.anomaliesFormulaireTva, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.anomaliesFormulaireTva.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });
db.exercices.hasMany(db.anomaliesFormulaireTva, { foreignKey: 'id_exercice', sourceKey: 'id' });

db.anomaliesFormulaireTva.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.userscomptes.hasMany(db.anomaliesFormulaireTva, { foreignKey: 'id_compte', sourceKey: 'id' });

// Etats de déclarations (verrouillage par période)
db.etatsdeclarations.belongsTo(db.dossiers, { foreignKey: 'id_dossier', targetKey: 'id' });
db.dossiers.hasMany(db.etatsdeclarations, { foreignKey: 'id_dossier', sourceKey: 'id' });

db.etatsdeclarations.belongsTo(db.exercices, { foreignKey: 'id_exercice', targetKey: 'id' });
db.exercices.hasMany(db.etatsdeclarations, { foreignKey: 'id_exercice', sourceKey: 'id' });

db.etatsdeclarations.belongsTo(db.userscomptes, { foreignKey: 'id_compte', targetKey: 'id' });
db.userscomptes.hasMany(db.etatsdeclarations, { foreignKey: 'id_compte', sourceKey: 'id' });

//exporting the module
module.exports = db;