import { React, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Paper, Box, Button, Divider } from '@mui/material';
import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import Papa from 'papaparse';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import CircularProgress from '@mui/material/CircularProgress';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import useAxiosPrivate from '../../../../../config/axiosPrivate';
import PopupImportImmobilisations from './PopupImportImmobilisations';

export default function ImportImmobilisations() {
    let initial = init[0];
    const axiosPrivate = useAxiosPrivate();
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [immobilisationsData, setImmobilisationsData] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');
    const [openDialogConfirmImport, setOpenDialogConfirmImport] = useState(false);
    const [anomaliePersiste, setAnomaliePersiste] = useState(false);
    const navigate = useNavigate();

    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);

    const columns = [
        {
            field: 'numero_compte',
            headerName: 'N° Compte',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'code',
            headerName: 'Code',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'intitule',
            headerName: 'Intitulé',
            type: 'string',
            sortable: true,
            flex: 2.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'fournisseur',
            headerName: 'Fournisseur',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'date_acquisition',
            headerName: 'Date Acquisition',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'duree_amort',
            headerName: 'Durée Amort.',
            type: 'string',
            sortable: true,
            flex: 1.2,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'type_amort',
            headerName: 'Type Amort.',
            type: 'string',
            sortable: true,
            flex: 1.2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'montant_ht',
            headerName: 'Montant HT',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'date_reprise',
            headerName: 'Date Reprise',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'amort_ant',
            headerName: 'Amort. Ant.',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'date_sortie',
            headerName: 'Date Sortie',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
    ];

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setFileId(resData.fileInfos[0].id);
                setNoFile(false);
            } else {
                setFileInfos([]);
                setNoFile(true);
            }
        })
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListeExercice(resData.list);
                const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
                setSelectedExerciceId(exerciceNId[0]?.id || 0);
            } else {
                setListeExercice([]);
                //toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
                return
            }
        })
    }

    useEffect(() => {
        GetInfosIdDossier(id);
        GetListeExercice(id);
    }, [id]);

    const telechargerModele = () => {
        const headers = [
            'numero_compte',
            'code',
            'intitule',
            'fournisseur',
            'date_acquisition',
            'duree_amort',
            'type_amort',
            'montant_ht',
            'date_reprise',
            'amort_ant',
            'date_sortie'
        ];

        const csvContent = headers.join(';') + '\n';
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'modele_import_immobilisations.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Modèle téléchargé avec succès');
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const dataWithIds = results.data.map((row, index) => ({
                        ...row,
                        id: index + 1
                    }));
                    setImmobilisationsData(dataWithIds);
                    toast.success(`${results.data.length} ligne(s) chargée(s)`);
                } else {
                    toast.error('Aucune donnée trouvée dans le fichier');
                }
            },
            error: (error) => {
                toast.error('Erreur lors de la lecture du fichier: ' + error.message);
            }
        });
        event.target.value = '';
    };

    const validerDonnees = () => {
        const anomalies = [];

        immobilisationsData.forEach((row, index) => {
            const ligneNum = index + 1;

            if (!row.numero_compte || row.numero_compte.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le numéro de compte est obligatoire`);
            }
            if (!row.code || row.code.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le code est obligatoire`);
            }
            if (!row.intitule || row.intitule.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: L'intitulé est obligatoire`);
            }
            if (!row.date_acquisition || row.date_acquisition.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La date d'acquisition est obligatoire`);
            }
            if (!row.duree_amort || row.duree_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: La durée d'amortissement est obligatoire`);
            }
            if (!row.type_amort || row.type_amort.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le type d'amortissement est obligatoire`);
            }
            if (!row.montant_ht || row.montant_ht.trim() === '') {
                anomalies.push(`Ligne ${ligneNum}: Le montant HT est obligatoire`);
            }

            if (row.date_reprise && row.date_reprise.trim() !== '') {
                if (!row.amort_ant || row.amort_ant.trim() === '') {
                    anomalies.push(`Ligne ${ligneNum}: L'amortissement antérieur est obligatoire si date de reprise est renseignée`);
                }
            }
        });

        setMsgAnomalie(anomalies);
        setNbrAnomalie(anomalies.length);

        if (anomalies.length > 0) {
            setCouleurBoutonAnomalie('#ff6b6b');
            setAnomaliePersiste(true);
            toast.error(`${anomalies.length} anomalie(s) détectée(s)`);
            return false;
        } else {
            setCouleurBoutonAnomalie('white');
            setAnomaliePersiste(false);
            return true;
        }
    };

    const handleImport = () => {
        if (immobilisationsData.length === 0) {
            return toast.error('Aucune donnée à importer');
        }

        const isValid = validerDonnees();
        if (!isValid) {
            return;
        }

        setOpenDialogConfirmImport(true);
    };

    const confirmerImport = (value) => {
        setOpenDialogConfirmImport(false);
        if (!value) return;

        setTraitementWaiting(true);
        setTraitementMsg('Import en cours...');

        axiosPrivate.post('/administration/traitementSaisie/importImmobilisations', {
            data: immobilisationsData,
            id_dossier: Number(fileId),
            id_compte: Number(compteId),
            id_exercice: Number(selectedExerciceId)
        }).then((response) => {
            const resData = response.data;
            setTraitementWaiting(false);

            if (resData.state) {
                toast.success(resData.msg || 'Import réussi');
                setImmobilisationsData([]);
                setNbrAnomalie(0);
                setMsgAnomalie([]);
                setCouleurBoutonAnomalie('white');
                setAnomaliePersiste(false);
            } else {
                toast.error(resData.msg || 'Erreur lors de l\'import');
                if (resData.anomalies && resData.anomalies.length > 0) {
                    setMsgAnomalie(resData.anomalies);
                    setNbrAnomalie(resData.anomalies.length);
                    setCouleurBoutonAnomalie('#ff6b6b');
                    setAnomaliePersiste(true);
                }
            }
        }).catch((error) => {
            setTraitementWaiting(false);
            const errorMsg = error.response?.data?.msg || error.response?.data?.message || "Erreur lors de l'import";
            toast.error(errorMsg);
        });
    };

    return (
        <>
            {noFile ? (
                <PopupTestSelectedFile
                    confirmationState={sendToHome}
                />
            ) : (
                <Box sx={{ width: '100%', typography: 'body1' }}>
                    <InfoFileStyle fileInfos={fileInfos} />

                    <Paper elevation={3} sx={{ padding: '20px', marginTop: '20px' }}>
                        <Typography variant="h5" gutterBottom>
                            Import des Immobilisations
                        </Typography>
                        <Divider sx={{ marginBottom: '20px' }} />

                        <Stack direction="row" spacing={2} sx={{ marginBottom: '20px' }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveAltIcon />}
                                onClick={telechargerModele}
                                style={{
                                    textTransform: 'none',
                                    backgroundColor: initial.button_color,
                                    color: 'white'
                                }}
                            >
                                Télécharger le modèle
                            </Button>

                            <Button
                                variant="contained"
                                component="label"
                                style={{
                                    textTransform: 'none',
                                    backgroundColor: '#4CC0E4',
                                    color: 'white'
                                }}
                            >
                                Charger un fichier CSV
                                <input
                                    type="file"
                                    hidden
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                />
                            </Button>

                            {immobilisationsData.length > 0 && (
                                <Button
                                    variant="contained"
                                    onClick={handleImport}
                                    disabled={traitementWaiting}
                                    style={{
                                        textTransform: 'none',
                                        backgroundColor: '#28a745',
                                        color: 'white'
                                    }}
                                >
                                    {traitementWaiting ? <CircularProgress size={24} /> : 'Importer'}
                                </Button>
                            )}

                            {nbrAnomalie > 0 && (
                                <Button
                                    variant="contained"
                                    onClick={() => setOpenDetailsAnomalie(true)}
                                    style={{
                                        textTransform: 'none',
                                        backgroundColor: couleurBoutonAnomalie,
                                        color: 'black'
                                    }}
                                >
                                    {nbrAnomalie} Anomalie(s)
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                startIcon={<LogoutIcon />}
                                onClick={() => navigate(`/tab/administration/immobilisations/${id}`)}
                                style={{
                                    textTransform: 'none',
                                }}
                            >
                                Retour
                            </Button>
                        </Stack>

                        {immobilisationsData.length > 0 && (
                            <Box sx={{ height: 600, width: '100%' }}>
                                <DataGrid
                                    rows={immobilisationsData}
                                    columns={columns}
                                    pageSize={10}
                                    rowsPerPageOptions={[10, 25, 50]}
                                    disableSelectionOnClick
                                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                    sx={DataGridStyle}
                                    slots={{ toolbar: QuickFilter }}
                                />
                            </Box>
                        )}
                    </Paper>
                </Box>
            )}

            <PopupImportImmobilisations
                open={openDetailsAnomalie}
                onClose={() => setOpenDetailsAnomalie(false)}
                anomalies={msgAnomalie}
            />

            <PopupActionConfirm
                open={openDialogConfirmImport}
                confirmationState={confirmerImport}
                message="Êtes-vous sûr de vouloir importer ces immobilisations ?"
            />
        </>
    );
}
