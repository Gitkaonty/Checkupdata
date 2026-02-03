import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAxiosPrivate from '../../config/axiosPrivate';
import useRefreshToken from '../hooks/useRefreshToken';

export default function ProtectedDossier() {
    const { id } = useParams();
    const axiosPrivate = useAxiosPrivate();
    const refresh = useRefreshToken();
    const [access, setAccess] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const verifyAccess = async () => {
            try {
                const newToken = await refresh(); // rafraîchit le token si nécessaire

                const response = await axiosPrivate.get(`/home/checkAccessDossier/${id}`, {
                    headers: { Authorization: `Bearer ${newToken}` }
                });

                if (!isMounted) return;
                setAccess(response?.data?.state ?? false);

            } catch (err) {
                console.error(err);
                if (isMounted) setAccess(false);
            }
        };

        verifyAccess();
        return () => { isMounted = false };
    }, [id]);

    if (access === null) return <div>Chargement...</div>;
    if (access === false) return <Navigate to="/tab/unauthorized-dossier" replace />;

    return <Outlet />;
}