import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './context/Layout';
import RequireAuth from './context/RequireAuth';
import NotFoundPage from './pages/NotFoundPage';
import Unauthorized from './pages/Unauthorized';
import Login from './Auth/Login';
import PersistLogin from './Auth/PersistLogin';

import MainPage from './pages/MainPage';
import DashboardComponent from './components/menuComponent/Dashboard/Dashboard';
import Home from './components/menuComponent/home/Home';
import SaisieComponent from './components/menuComponent/administration/saisie/Saisie';
import ConsultationComponent from './components/menuComponent/administration/consultation/Consultation';
import ImportBalance from './components/menuComponent/administration/import/ImportBalance';
import ImportJournal from './components/menuComponent/administration/import/ImportJournal';
// import ImportModelePlanComptable from './components/menuComponent/administration/import/ImportModelePlanComptable';
import ImportAnnexeComponent from './components/ImportAnnexeComponent';
import ImportAnnexeDeclarationFiscaleComponent from './components/ImportAnnexeDeclarationFiscaleComponent';
import ExportBalance from './components/menuComponent/administration/export/ExportBalance';
import DeclarationEbilan from './components/menuComponent/Declaration/Ebilan/DeclarationEbilan';
import RevisionAnomalieEbilanComponent from './components/RevisionAnomalieEbilanComponent';
import RevisionPrecontroleFiscalComponent from './components/RevisionPrecontroleFiscalComponent';
import ParamCodeJournalComponent from './components/menuComponent/Parametrages/CodesJournaux/CodesJournaux';
import ParamPlanComptableComponent from './components/menuComponent/Parametrages/PlanComptable/ParamPlanComptable';
import ParamPCModele from './components/menuComponent/Parametrages/PlanComptableModele/ParamPCModele';
import ParamTVAComponent from './components/menuComponent/Parametrages/Tva/ParamTva';
import ParamDeviseComponent from './components/ParamDeviseComponent';
import ParamExerciceComponent from './components/menuComponent/Parametrages/Exercice/Exercice';
import ParamCRM from './components/menuComponent/Parametrages/crm/ParamCRM';
import ParamMappingComponent from './components/menuComponent/Parametrages/mappingcompte/ParamMapping';
import AnalitiqueComponent from './components/menuComponent/Parametrages/analytiques/AnalitiqueComponent';
import DeclarationComm from './components/menuComponent/Declaration/Dcom/DeclarationComm';
import ClassificationSalariesComponent from './components/menuComponent/Parametrages/classifications/ClassificationSalariesComponent';
import PersonnelComponent from './components/menuComponent/administration/personnel/PersonnelComponent';
import FonctionsComponent from './components/menuComponent/Parametrages/fonctions/FonctionsComponent';
import DeclarationIRSAComponent from './components/menuComponent/Declaration/IRSA/DeclarationIRSAComponent';
import HistoriqueDeclaration from './components/menuComponent/Declaration/Historique/HistoriqueDeclaration';
import DeclarationTVA from './components/menuComponent/Declaration/Tva/ParamTva';
import ParamChiffreAffaires from './components/menuComponent/Parametrages/chiffreAffaires/ParamChiffreAffaires';
import DeclarationIsi from './components/menuComponent/Declaration/ISI/DeclarationIsi';
import ExportJournal from './components/menuComponent/administration/export/ExportJournal';
import ExportGrandLivre from './components/menuComponent/administration/export/ExportGrandLivre';
import RapprochementsBancaires from './components/menuComponent/administration/rapprochements/RapprochementsBancaires';
import Immobilisations from './components/menuComponent/administration/immobilisations/Immobilisations';
import ParamMappingExterne from './components/menuComponent/Parametrages/mappingCompteExterne/ParamMappingExterne';
import EtatFinancier from './components/menuComponent/administration/etatFinancier/EtatFinancier';
import Sig from './components/menuComponent/administration/SIG/Sig';
import EtatFinancierAnalytique from './components/menuComponent/administration/etatFinancierAnalytique/EtatFinancierAnalytique';
import PortefeuilleComponent from './components/menuComponent/Parametrages/portefeuille/Portefeuille';
import RolePermission from './components/menuComponent/Parametrages/rolePermission/RolePermission';
import Consolidation from './components/menuComponent/Parametrages/Consolidation/Consolidation';

import ProtectedDossier from './pages/ProtectedDossier';
import ProtectedDossierConsolidation from './pages/ProtectedDossierConsolidation';
import useAutoLogout from './hooks/useAutoLogout';
import UnauthorizedDossierConsolidation from './pages/UnauthorizedDossierConsolidation';
import UnauthorizedDossier from './pages/UnauthorizedDossier';

const ROLES = {
  'SuperAdmin': 3355,
  'User': 2001,
  'Editor': 1984,
  'Admin': 5150
}

export default function App() {
  useAutoLogout();
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />} >
          {/*Publics routes */}
          <Route path='/' element={<Login />} />
          <Route path='/unauthorized' element={<Unauthorized />} />

          {/*Protected routes */}
          <Route element={<PersistLogin />}>
            <Route element={<RequireAuth allowedRoles={[ROLES.Admin, ROLES.User, ROLES.Editor, ROLES.SuperAdmin]} />}>
              <Route path='/tab' element={<MainPage />} >

                <Route path="/tab/unauthorized-dossier" element={<UnauthorizedDossier />} />
                <Route path="/tab/unauthorized-consolidation" element={<UnauthorizedDossierConsolidation />} />

                <Route path='/tab/home' element={<Home />} />

                <Route path='/tab/revision/revisionAnomalieEbilan' element={<RevisionAnomalieEbilanComponent />} />
                <Route path='/tab/revision/revisionPrecontrolFiscal' element={<RevisionPrecontroleFiscalComponent />} />
                <Route path='/tab/parametrages/paramPlanComptableModele' element={<ParamPCModele />} />
                <Route path='/tab/administration/importAnnexeDeclarationFiscale' element={<ImportAnnexeDeclarationFiscaleComponent />} />
                <Route path='/tab/parametrages/paramPortefeuille' element={<PortefeuilleComponent />} />

                <Route element={<RequireAuth allowedRoles={[ROLES.Admin, ROLES.SuperAdmin]} />} >
                  <Route path='/tab/parametrages/role-permission' element={<RolePermission />} />
                </Route>

                {/* Routes dossier protégé */}
                <Route element={<ProtectedDossier />}>

                  <Route path='/tab/dashboard/:id' element={<DashboardComponent />} />

                  <Route path='/tab/administration/saisie/:id' element={<SaisieComponent />} />
                  <Route path='/tab/administration/consultation/:id' element={<ConsultationComponent />} />
                  <Route path='/tab/administration/importBalance/:id' element={<ImportBalance />} />
                  <Route path='/tab/administration/importJournal/:id' element={<ImportJournal />} />
                  <Route path='/tab/administration/importAnnexeDeclarationEbilan/:id' element={<ImportAnnexeComponent />} />
                  <Route path='/tab/administration/exportBalance/:id' element={<ExportBalance />} />
                  <Route path='/tab/administration/personnel/:id' element={<PersonnelComponent />} />
                  <Route path='/tab/administration/exportJournal/:id' element={<ExportJournal />} />
                  <Route path='/tab/administration/exportGrandLivre/:id' element={<ExportGrandLivre />} />
                  <Route path='/tab/administration/rapprochements/:id' element={<RapprochementsBancaires />} />
                  <Route path='/tab/administration/immobilisations/:id' element={<Immobilisations />} />
                  <Route path='/tab/administration/etatFinacier/:id' element={<EtatFinancier />} />
                  <Route path='/tab/administration/etatFinacierAnalytique/:id' element={<EtatFinancierAnalytique />} />
                  <Route path='/tab/administration/sig/:id' element={<Sig />} />

                  <Route path='/tab/parametrages/paramCodeJournal/:id' element={<ParamCodeJournalComponent />} />
                  <Route path='/tab/parametrages/paramPlanComptable/:id' element={<ParamPlanComptableComponent />} />
                  <Route path='/tab/parametrages/paramTVA/:id' element={<ParamTVAComponent />} />
                  <Route path='/tab/parametrages/paramDevise/:id' element={<ParamDeviseComponent />} />
                  <Route path='/tab/parametrages/paramExercice/:id' element={<ParamExerciceComponent />} />
                  <Route path='/tab/parametrages/paramAnalytique/:id' element={<AnalitiqueComponent />} />
                  <Route path='/tab/parametrages/paramCrm/:id' element={<ParamCRM />} />
                  <Route path='/tab/parametrages/paramMapping/:id' element={<ParamMappingComponent />} />
                  <Route path='/tab/parametrages/paramClassification/:id' element={<ClassificationSalariesComponent />} />
                  <Route path='/tab/parametrages/paramFonctions/:id' element={<FonctionsComponent />} />
                  <Route path='/tab/parametrages/chiffreDaffaires/:id' element={<ParamChiffreAffaires />} />
                  <Route path='/tab/parametrages/paramMapping-externe/:id' element={<ParamMappingExterne />} />

                  <Route element={<ProtectedDossierConsolidation />}>
                    <Route path='/tab/parametrages/consolidation-correpondance/:id' element={<Consolidation />} />
                  </Route>

                  <Route path='/tab/declaration/declarationIRSA/:id' element={<DeclarationIRSAComponent />} />
                  <Route path='/tab/declaration/declarationISI/:id' element={<DeclarationIsi />} />
                  <Route path='/tab/declaration/declarationEbilan/:id' element={<DeclarationEbilan />} />
                  <Route path='/tab/declaration/declarationDroitComm/:id' element={<DeclarationComm />} />
                  <Route path='/tab/declaration/declarationTVA/:id' element={<DeclarationTVA />} />

                </Route>

              </Route>
            </Route>
          </Route>
          {/* catch all */}
          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
