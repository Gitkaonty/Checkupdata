import { useParams, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAxiosPrivate from '../../config/axiosPrivate';
import useAuth from '../hooks/useAuth';
import {jwtDecode} from 'jwt-decode';
import useRefreshToken from '../hooks/useRefreshToken';

export default function ProtectedDossier() {
    const navigate = useNavigate();
    const { auth, setAuth } = useAuth(); // si ton context le permet
    const { id } = useParams();
    const [access, setAccess] = useState(null);
    const axiosPrivate = useAxiosPrivate();
    const refresh = useRefreshToken();

    useEffect(() => {
        let isMounted = true;

        const verifyAccess = async () => {
            try {
                // 1️⃣ Rafraîchir le token et récupérer le nouveau accessToken
                const newAccessToken = await refresh(); 
                
                // 2️⃣ Décoder le token
                const decoded = jwtDecode(newAccessToken);
                const userId = decoded?.UserInfo?.userId;

                // 3️⃣ Vérifier l'accès au dossier
                const response = await axiosPrivate.get(`/home/checkAccessDossier/${id}`, {
                    headers: { 'Authorization': `Bearer ${newAccessToken}` }
                });

                if (!isMounted) return;

                if (response?.data?.state) {
                    setAccess(true);
                } else {
                    setAccess(false);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setAccess(false);
            }
        };

        verifyAccess();

        return () => { isMounted = false };
    }, [id]);

    if (access === null) {
        // Loader pendant la vérification
        return <div>Chargement...</div>;
    }

    if (access === false) {
        return <Navigate to="/tab/unauthorized-dossier" replace />;
    }

    return <Outlet />;
}