import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './context/Layout';
import RequireAuth from './context/RequireAuth';
import NotFoundPage from './pages/NotFoundPage';
import Unauthorized from './pages/Unauthorized';
import Login from './Auth/Login';
import PersistLogin from './Auth/PersistLogin';
import useAutoLogout from './hooks/useAutoLogout';
import theme from './theme';
import { ThemeProvider, CssBaseline } from '@mui/material';
import MainLayout from './pages/MainLayout';
import DashboardHome from './pages/DashboardHome';
import Exercices from './pages/parametres/exercices';
import DossiersPage from './pages/Home';
import DetailsControles from './pages/DetailsControles';
import Portefeuille from './pages/parametres/Portefeuille';
import CRM from './pages/parametres/Crm';
import ImportJournal from './pages/traitement/ImportJournal';
// Importe ton hook d'auth pour remplacer "isAuthenticated" par une vraie valeur
import useAuth from './hooks/useAuth'; 

const ROLES = {
  'SuperAdmin': 3355,
  'User': 2001,
  'Editor': 1984,
  'Admin': 5150
}

export default function App() {
  useAutoLogout();
  const { auth } = useAuth(); // On récupère l'état d'auth réel

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          
          {/* --- ROUTES PUBLIQUES --- */}
          <Route path='/' element={<Login />} />
          <Route path='/unauthorized' element={<Unauthorized />} />

          {/* --- ROUTES PROTEGEES --- */}
          <Route element={<PersistLogin />}>
            <Route element={<RequireAuth allowedRoles={[ROLES.Admin, ROLES.User, ROLES.Editor, ROLES.SuperAdmin]} />}>
              
              {/* Le MainLayout entoure ici toutes les pages "Admin" DossiersPage*/}
              <Route path="/home" element={<MainLayout><DossiersPage /></MainLayout>} />
              <Route path="/dashboard" element={<MainLayout><DashboardHome /></MainLayout>} />
              <Route path="/controles/details" element={<MainLayout><DetailsControles /></MainLayout>} />

               {/* menu Parametres */}
              <Route path="/traitement/importjournal" element={<MainLayout><ImportJournal /></MainLayout>} />
              
              {/* Sous-menu Parametres */}
              <Route path="/parametres/exercice" element={<MainLayout><Exercices /></MainLayout>} />
              <Route path="/parametres/portefeuille" element={<MainLayout><Portefeuille /></MainLayout>} />
              <Route path="/parametres/crm" element={<MainLayout><CRM /></MainLayout>} />
            </Route>
          </Route>

          {/* CATCH ALL  */}
          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}