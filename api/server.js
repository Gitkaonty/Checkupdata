const express = require('express');
const errorHandler = require('./Middlewares/errorHandler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./Models');
const corsOptions = require('./config/corsOptions');
const verifyJWT = require('./Middlewares/verifyJWT');
const credentials = require('./Middlewares/credentials');

const pg = require('pg');
pg.types.setTypeParser(20, val => parseInt(val));

//const userRoutes = require ('./Routes/UserRoutes/userRoutes');
//const dossierRoutes = require ('./Routes/HomeRoutes/dossierRoutes');
//const paramPCModeleRoute = require ('./Routes/Parametres/paramPCModeleRoute');
//const modelePlanComptableDetailRoutes = require ('./Routes/modelePlanComptableRoutes/modelePlanComptableDetailRoutes');
//const modelePlanComptableDetailAddRoutes = require ('./Routes/modelePlanComptableRoutes/modelePlanComptableDetailAddRoutes');
//const modelePlanComptableAddNewRoutes = require('./Routes/modelePlanComptableRoutes/modelePlanComptableAddNewRoutes');
//const modelePlanComptableDeleteRoutes = require('./Routes/modelePlanComptableRoutes/modelePlanComptableDeleteRoutes');
require('dotenv').config();

const PORT = process.env.NODE_API_PORT || 5100;

//Définition du moteur d'affichage
const app = express();
app.use(credentials);
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, '/public')));
app.use('/public', express.static(path.join(__dirname, '/public')));

//synchronizing the database and forcing it to false so we dont lose data (ito no ampiasaina ra toa ka executena ny DROP TABLE am sequelize)
//db.sequelize.sync({ force: true }).then(() => {
//console.log("db has been re sync")
//})

// Static folder
// app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

//synchronizing the database and forcing it to false so we dont lose data
db.sequelize.sync().then(() => {
    console.log("db has been re synchronized")
})

//----------------------------------------------------------------------------------------------------------------
// AUTHENTIFICATION
//----------------------------------------------------------------------------------------------------------------

//register
app.use('/register', require('./Routes/registerRoute'));
//Login
app.use('/', require('./Routes/authRoute'));
//refreshToken
app.use('/refreshToken', require('./Routes/refreshRoute'));
//logout
app.use('/logout', require('./Routes/logoutRoute'));



//placer la vérification pour les routes qui ne nécessite pas de vérification
// app.use(verifyJWT);


//routes pour l'authentification
//app.use('/', userRoutes);

//----------------------------------------------------------------------------------------------------------------
// MENU HOME
//----------------------------------------------------------------------------------------------------------------

//routes pour home
app.use('/home', require('./Routes/Home/homeRoutes'));

//routes pour dashboard
app.use('/dashboard', require('./Routes/Dashboard/dashboardRoutes'));

//----------------------------------------------------------------------------------------------------------------
// MENU ADMINISTRATION
//----------------------------------------------------------------------------------------------------------------
app.use('/administration/ImportJournal', require('./Routes/Administration/importJournalRoute'));

app.use('/administration/ImportBalance', require('./Routes/Administration/importBalanceRoute'));

app.use('/administration/ImportModelePc', require('./Routes/Administration/importModelePCRoute'));

app.use('/administration/personnel', require('./Routes/Administration/personnels/personnelRoute'));

app.use('/administration/etatFinancier', require('./Routes/Administration/etatFinancier/etatFinancierRoute'));

app.use('/administration/etatFinancierAnalytique', require('./Routes/Administration/etatFinancierAnalytique/etatFinancierAnalytiqueRoute'));

//export
app.use('/administration/exportBalance', require('./Routes/Administration/exportBalanceRoute'));

app.use('/administration/exportJournal', require('./Routes/Administration/exportJournalRoute'));

app.use('/administration/exportGrandLivre', require('./Routes/Administration/exportGrandLivreRoute'));

//saisie
app.use('/administration/traitementSaisie', require('./Routes/Administration/saisieRoute'));

app.use('/parametres/classification', require('./Routes/Parametres/Sociales/classificationRoute'));

//----------------------------------------------------------------------------------------------------------------
// MENU PARAMETRE
//----------------------------------------------------------------------------------------------------------------

//routes pour envoyer la liste des modèles de plan comptable associé au compte de l'utilisateur
app.use('/paramPlanComptableModele', require('./Routes/Parametres/paramPCModeleRoute'));

//routes pour les paramétrages plan comptable
app.use('/paramPlanComptable', require('./Routes/Parametres/paramPCRoute'));

//routes pour paramètres liste exercice
app.use('/paramExercice', require('./Routes/Parametres/exerciceRoute'));

//routes pour paramètres liste code journaux
app.use('/paramCodeJournaux', require('./Routes/Parametres/codejournauxRoute'));

//routes pour paramètres le CRM
app.use('/paramCrm', require('./Routes/Parametres/crmRoute'));

//routes pour paramètres compte de TVA
app.use('/paramTva', require('./Routes/Parametres/paramTvaRoute'));

//routes pour paramètres mapping de compte
app.use('/paramMappingCompte', require('./Routes/Parametres/paramMappingCompte'));

//routes pour paramètres compabilité analytique
app.use('/paramCa', require('./Routes/Parametres/paramCARoute'));

app.use('/parametres/fonction', require('./Routes/Parametres/personnels/fonctionsRoute'));

app.use('/devises/devise', require('./Routes/Parametres/Devises/deviseRoutes'));

// Route pour paramètres rubrique externes
app.use('/paramRubriqueExterne', require('./Routes/Parametres/RubriqueExtrenes/paramRubriquesExternesRoute'));

// Route pour portefeuille
app.use('/param/portefeuille', require('./Routes/Parametres/Portefeuille/portefeuilleRoute'));

// Route pour consolidation
app.use('/param/consolidation', require('./Routes/Parametres/Consolidation/paramConsolidationRoute'));

//----------------------------------------------------------------------------------------------------------------
// MENU DECLARATION
//----------------------------------------------------------------------------------------------------------------

//Déclaration Droit de communication---------------------------
app.use('/declaration/comm', require('./Routes/Declaration/Dcom/DeclarationCommRoute'));

//Déclaration Ebilan-------------------------------------------
app.use('/declaration/ebilan', require('./Routes/Declaration/declEbilanRoute'));

app.use('/irsa/irsa', require('./Routes/Declaration/irsa/irsaRoutes'));

app.use('/paie/paie', require('./Routes/Declaration/paie/paieRoutes'));

app.use('/historique/declaration', require('./Routes/Declaration/historiquesDeclarationRoutes'));

// Déclaration TVA CFISC
app.use('/declaration/tva', require('./Routes/Declaration/tva/tvaDeclarationRoutes'));


//Déclaration ISI
app.use('/declaration/isi', require('./Routes/Declaration/DIsi/DeclarationISIRoute'));

//----------------------------------------------------------------------------------------------------------------
// COMPTE ET SOUS-COMPTE
//----------------------------------------------------------------------------------------------------------------

// Compte
app.use('/compte', require('./Routes/User/Compte/compteRoutes'));

// Sous compte
app.use('/sous-compte', require('./Routes/User/SousComptes/sousCompteRoutes'));

/*app.all('*', (req,res) => {
    res.status(404);
    if(req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    }else if (req.accepts('json')){
        res.json({error: '404 Not Found'});
    }else{
        res.type('txt').send('404 Not Found');
    }
});*/

//app.use(errorHandler);

app.get('/', function (req, res) {
    res.send('hello');
})

app.listen(PORT, () => {
    console.log(`listen on port ${PORT}`);
});
