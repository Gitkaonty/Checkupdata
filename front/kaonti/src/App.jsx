import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './context/Layout';
import RequireAuth from './context/RequireAuth';
import NotFoundPage from './pages/NotFoundPage';
import Unauthorized from './pages/Unauthorized';
import Login from './Auth/Login';
import PersistLogin from './Auth/PersistLogin';
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
              
            </Route>
          </Route>
          {/* catch all */}
          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
