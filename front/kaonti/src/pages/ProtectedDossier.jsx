import { useParams, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAxiosPrivate from '../../config/axiosPrivate';
import useAuth from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import useRefreshToken from '../hooks/useRefreshToken';
export default function ProtectedDossier({ type }) {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { id } = useParams();
    const [access, setAccess] = useState(null);
    const axiosPrivate = useAxiosPrivate();
    const refresh = useRefreshToken();
 
    const decoded = auth?.accessToken
        ? jwtDecode(auth.accessToken)
        : undefined
 
    const userId = decoded.UserInfo.userId || null;
 
    useEffect(() => {
        const verifyAccess = async () => {
            await refresh();
            try {
                axiosPrivate.get(`/home/checkAccessDossier/${id}`).then((response) => {
                    if (response?.data?.state) {
                        // setAccess(true);
                    } else {
                        // setAccess(false);
                        navigate(`/tab/home`);
                    }
                })
            } catch {
                // setAccess(false);
            }
        };
 
        verifyAccess();
    }, [id, userId]);
 
    // if (access === false) return <Navigate to="/tab/unauthorized-dossier" replace />;
 
    return <Outlet />;
}