import { Box, Chip, Stack, Typography } from '@mui/material';

import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

import { FaUserShield, FaUserCog, FaUser, FaEye } from "react-icons/fa";
import { useEffect, useState } from 'react';

import axios from '../../../../config/axios';
import useAuth from '../../../hooks/useAuth';
import CompteTab from '../../componentsTools/RolePermission/CompteTab';

const roleStyles = {
    SuperAdmin: { color: "error", icon: <FaUserShield size={14} /> },
    Admin: { color: "warning", icon: <FaUserCog size={14} /> },
    User: { color: "primary", icon: <FaUser size={14} /> },
    Lector: { color: "default", icon: <FaEye size={14} /> },
};

const RoleChip = ({ value }) => {
    const style = roleStyles[value] || { color: "default" };

    return (
        <Chip
            label={value}
            color={style.color}
            icon={style.icon}
            sx={{ cursor: "default" }}
        />
    );
};

const RolePermission = () => {
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const comptename = decoded.UserInfo.compte || null;
    const userId = decoded.UserInfo.userId || null;

    const infoCompte = {
        nom: comptename
    }

    const [listSousCompte, setListSousCompte] = useState([]);
    const [listRole, setListRole] = useState([]);
    const [isRefreshedSousCompte, setIsRefreshedSousCompte] = useState(false);

    const getAllRoles = () => {
        axios.get('sous-compte/getAllRoles')
            .then(response => {
                setListRole(response.data);
            })
            .catch(err => {
                console.error(err);
            });
    };

    const getAllSousComptesByIdCompte = () => {
        axios.post('/sous-compte/getAllSousComptesByIdCompte', {
            compteIds: [compteId]
        })
            .then((response) => {
                if (response?.data?.state) {
                    setListSousCompte(response?.data?.list);
                } else {
                    toast.error(response?.data?.message);
                }
            })
            .catch((err) => {
                if (err.response && err.response.data && err.response.data.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error(err.message || "Erreur inconnue");
                }
            })
    }

    useEffect(() => {
        getAllRoles();
    }, []);

    useEffect(() => {
        getAllSousComptesByIdCompte();
    }, [isRefreshedSousCompte])

    const columnCompte = [
        { field: 'username', headerName: 'Utilisateur', width: 250 },
        { field: 'email', headerName: 'Email', flex: 2 },
        {
            field: 'role_id',
            headerName: 'Rôle',
            width: 200,
            renderCell: (params) => {
                const role = listRole.find(r => r.id === params.value);
                return <RoleChip value={role?.nom || '---'} />;
            }
        },
        {
            field: 'refresh_token',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => {
                const isOnline = params.value !== null && params.value !== '';
                return (
                    <Chip
                        label={isOnline ? 'Actif' : 'Hors ligne'}
                        color={isOnline ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                );
            }
        }
    ];

    return (
        <Box>
            <Stack width="100%" height="100%" spacing={1} alignItems="flex-start" alignContent="flex-start" justifyContent="stretch">
                <Typography
                    variant='h7'
                    sx={{
                        color: "black",
                        maxWidth: "100%",
                        whiteSpace: "normal",
                        wordBreak: "break-word"
                    }}
                    align='left'
                >
                    Gestion de compte utilisateur
                </Typography>
                <Box sx={{ width: '100%', pl: '1%' }}>
                    <CompteTab
                        rows={listSousCompte}
                        setRows={setListSousCompte}
                        columns={columnCompte}
                        selectedRowCompteIds={compteId}
                        infoCompte={infoCompte}
                        isRefreshedSousCompte={isRefreshedSousCompte}
                        setIsRefreshedSousCompte={setIsRefreshedSousCompte}
                        userId={userId}
                    />
                </Box>
            </Stack>
        </Box>
    )
}

export default RolePermission