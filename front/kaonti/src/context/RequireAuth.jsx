import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { jwtDecode } from 'jwt-decode';

const RequireAuth = ({ allowedRoles }) => {
    const { auth } = useAuth();
    const location = useLocation();

    // ⛔ Pas encore d'accessToken → on attend (PersistLogin)
    if (!auth?.accessToken) {
        return null; // très important
    }

    let decoded;
    try {
        decoded = jwtDecode(auth.accessToken);
    } catch (err) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    const role = decoded?.UserInfo?.roles;

    return (
        allowedRoles.includes(role)
            ? <Outlet />
            : <Navigate to="/unauthorized" state={{ from: location }} replace />
    );
};

export default RequireAuth;