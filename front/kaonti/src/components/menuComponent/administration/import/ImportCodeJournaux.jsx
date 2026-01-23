import { React, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Paper, Box, Tab, Badge, Button, Divider, TextField, FormHelperText } from '@mui/material';
import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from "yup";
import Papa from 'papaparse';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import ImportProgressBar from '../../../componentsTools/ImportProgressBar';
import PopupInformation from '../../../componentsTools/popupInformation';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

export default function ImportCodeJournaux() {
    let initial = init[0];
    const axiosPrivate = useAxiosPrivate();
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);
    const [nbrAnomalie, setNbrAnomalie] = useState(0);
    const [openDetailsAnomalie, setOpenDetailsAnomalie] = useState(false);
    const [couleurBoutonAnomalie, setCouleurBoutonAnomalie] = useState('white');
    const [codeJournauxData, setCodeJournauxData] = useState([]);
    const [msgAnomalie, setMsgAnomalie] = useState([]);
    const [traitementWaiting, setTraitementWaiting] = useState(false);
    const [traitementMsg, setTraitementMsg] = useState('');
    const [progressValue, setProgressValue] = useState(0);
    const [openDialogConfirmImport, setOpenDialogConfirmImport] = useState(false);
    const [anomaliePersiste, setAnomaliePersiste] = useState(false);
    const navigate = useNavigate();

    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    const columns = [
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
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'type',
            headerName: 'Type',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'compteassocie',
            headerName: 'Compte associé',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'nif',
            headerName: 'NIF',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'stat',
            headerName: 'STAT',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'adresse',
            headerName: 'Adresse',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
    ];

    const formikImport = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            codeJournauxData: []
        },
        validationSchema: Yup.object({
            codeJournauxData: Yup.array().min(1, "Veuillez importer un fichier")
        }),
        validateOnChange: false,
        validateOnBlur: true,
    });

    useEffect(() => {
        const navigationEntries = performance.getEntriesByType('navigation');
        let idFile = 0;

        if (navigationEntries.length > 0) {
            const navigationType = navigationEntries[0].type;
            if (navigationType === 'reload') {
                const idDossier = sessionStorage.getItem("fileId");
                setFileId(idDossier);
                idFile = idDossier;
            } else {
                sessionStorage.setItem('fileId', id);
                setFileId(id);
                idFile = id;
            }
        }
        GetInfosIdDossier(idFile);
    }, []);

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setFileInfos(resData.fileInfos[0]);
                setNoFile(false);
            } else {
                setFileInfos([]);
                setNoFile(true);
            }
        })
    }

    const validateHeaders = (headers) => {
        const expectedHeaders = ["code", "libelle", "type", "compteassocie", "nif", "stat", "adresse"];

        const normalize = (s) => (s || "")
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const actual = new Set(headers.map(normalize));
        const missing = expectedHeaders.filter(h => !actual.has(normalize(h)));
        if (missing.length > 0) {
            toast.error(`Les en-têtes suivants sont manquants : ${missing.join(', ')}`);
            return false;
        }
        return true;
    }

    const validationData = (data) => {
        const couleurAnom = "#EB5B00";
        let nbrAnom = 0;
        let msg = [];

        const missingCode = data.filter(item => !item.code || item.code.trim() === '');
        if (missingCode.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de code journal.`);
            nbrAnom = nbrAnom + 1;
        }

        const missingLibelle = data.filter(item => !item.libelle || item.libelle.trim() === '');
        if (missingLibelle.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de libellé.`);
            nbrAnom = nbrAnom + 1;
        }

        const missingType = data.filter(item => !item.type || item.type.trim() === '');
        if (missingType.length > 0) {
            msg.push(`Certaines lignes ne contiennent pas de type.`);
            nbrAnom = nbrAnom + 1;
        }

        const expectedTypeValues = ["ACHAT", "BANQUE", "CAISSE", "OD", "RAN", "VENTE"];
        const invalidTypes = data.filter(item => item.type && !expectedTypeValues.includes(item.type.toUpperCase()));
        if (invalidTypes.length > 0) {
            msg.push(`Certains types sont invalides. Types acceptés : ${expectedTypeValues.join(', ')}`);
            nbrAnom = nbrAnom + 1;
        }

        const banqueOrCaisse = data.filter(item => 
            item.type && (item.type.toUpperCase() === 'BANQUE' || item.type.toUpperCase() === 'CAISSE')
        );
        const missingCompteAssocie = banqueOrCaisse.filter(item => !item.compteassocie || item.compteassocie.trim() === '');
        if (missingCompteAssocie.length > 0) {
            msg.push(`Les codes journaux de type BANQUE ou CAISSE doivent avoir un compte associé.`);
            nbrAnom = nbrAnom + 1;
        }

        const banqueTypes = data.filter(item => item.type && item.type.toUpperCase() === 'BANQUE');
        const missingBanqueFields = banqueTypes.filter(item => 
            !item.nif || item.nif.trim() === '' || 
            !item.stat || item.stat.trim() === '' || 
            !item.adresse || item.adresse.trim() === ''
        );
        if (missingBanqueFields.length > 0) {
            msg.push(`Les codes journaux de type BANQUE doivent avoir NIF, STAT et Adresse renseignés.`);
            nbrAnom = nbrAnom + 1;
        }

        setNbrAnomalie(nbrAnom);
        setCouleurBoutonAnomalie(nbrAnom > 0 ? couleurAnom : 'white');
        setMsgAnomalie(msg);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];

        if (file) {
            Papa.parse(file, {
                complete: (result) => {
                    const headers = result?.meta?.fields || [];

                    if (validateHeaders(headers)) {
                        setTraitementMsg('Traitement des données en cours...');
                        setTraitementWaiting(true);
                        setProgressValue(30);

                        setMsgAnomalie([]);
                        setCouleurBoutonAnomalie('white');
                        setNbrAnomalie(0);

                        const DataWithId = result.data.map((row, index) => ({
                            id: index,
                            code: row.code || '',
                            libelle: row.libelle || '',
                            type: (row.type || '').toUpperCase(),
                            compteassocie: row.compteassocie || '',
                            nif: row.nif || '',
                            stat: row.stat || '',
                            adresse: row.adresse || ''
                        }));

                        validationData(DataWithId);
                        setCodeJournauxData(DataWithId);
                        formikImport.setFieldValue('codeJournauxData', DataWithId);

                        toast.success(`${DataWithId.length} ligne(s) chargée(s)`);

                        event.target.value = null;
                        setProgressValue(100);
                        setTimeout(() => {
                            setTraitementWaiting(false);
                            setProgressValue(0);
                        }, 600);
                        handleOpenAnomalieDetails();
                    }
                },
                header: true,
                skipEmptyLines: true,
                encoding: "UTF-8",
                delimiter: ';'
            });
        }
    }

    const handleOpenAnomalieDetails = () => {
        setOpenDetailsAnomalie(true);
    }

    const handleCloseAnomalieDetails = (value) => {
        setOpenDetailsAnomalie(value);
    }

    const handleCloseInformation = (value) => {
        setAnomaliePersiste(false);
    }

    const handleOpenDialogConfirmImport = () => {
        if (nbrAnomalie > 0) {
            setAnomaliePersiste(true);
        } else {
            setOpenDialogConfirmImport(true);
        }
    }

    const handleCloseDialogConfirmImport = (value) => {
        setOpenDialogConfirmImport(false);
    }

    const confirmImport = (value) => {
        if (value) {
            setOpenDialogConfirmImport(false);
            setTraitementMsg('Import des codes journaux en cours...');
            setTraitementWaiting(true);

            const dataToSend = {
                idCompte: compteId,
                idDossier: fileId,
                codeJournauxData: formikImport.values.codeJournauxData
            };

            axiosPrivate.post('/paramCodeJournaux/importCodeJournaux', dataToSend)
                .then((response) => {
                    const resData = response.data;
                    setTraitementWaiting(false);
                    if (resData.state) {
                        toast.success(resData.msg);
                        navigate(`/tab/parametrages/codeJournaux/${fileId}`);
                    } else {
                        toast.error(resData.msg);
                        if (resData.anomalies && resData.anomalies.length > 0) {
                            setMsgAnomalie(resData.anomalies);
                            setNbrAnomalie(resData.anomalies.length);
                            setCouleurBoutonAnomalie("#EB5B00");
                            handleOpenAnomalieDetails();
                        }
                    }
                })
                .catch((error) => {
                    setTraitementWaiting(false);
                    toast.error("Une erreur est survenue lors de l'import");
                    console.error(error);
                });
        } else {
            setOpenDialogConfirmImport(false);
        }
    }

    const handleReturnToCodeJournaux = () => {
        navigate(`/tab/parametrages/codeJournaux/${fileId}`);
    }

    return (
        <>
            {openDetailsAnomalie && (
                <PopupInformation
                    msg={msgAnomalie}
                    confirmationState={handleCloseAnomalieDetails}
                />
            )}
            {anomaliePersiste && (
                <PopupInformation
                    msg={["Veuillez corriger les anomalies avant d'importer les données."]}
                    confirmationState={handleCloseInformation}
                />
            )}
            {openDialogConfirmImport && (
                <PopupActionConfirm
                    msg={"Voulez-vous vraiment importer ces codes journaux ?"}
                    confirmationState={confirmImport}
                />
            )}
            <Box>
                <TabContext value={"1"}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example">
                            <Tab
                                style={{
                                    textTransform: 'none',
                                    outline: 'none',
                                    border: 'none',
                                    margin: -5
                                }}
                                label={InfoFileStyle(fileInfos?.dossier)}
                                value="1"
                            />
                        </TabList>
                    </Box>
                    <TabPanel value="1">
                        <Typography variant='h6' sx={{ color: "black" }} align='left'>
                            Import : codes journaux
                        </Typography>

                        <Stack spacing={2} sx={{ mt: 3 }}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Sélectionner le fichier à importer
                                </Typography>
                                <Typography variant='body2' sx={{ mb: 2, color: 'gray' }}>
                                    Format accepté : CSV séparé par point-virgule (;) avec les colonnes suivantes : code, libelle, type, compteassocie, nif, stat, adresse
                                </Typography>
                                <Typography variant='body2' sx={{ mb: 2, color: 'gray' }}>
                                    Types acceptés : ACHAT, BANQUE, CAISSE, OD, RAN, VENTE
                                </Typography>
                                <input
                                    accept=".csv"
                                    style={{ display: 'none' }}
                                    id="raised-button-file"
                                    type="file"
                                    onChange={handleFileSelect}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        style={{
                                            backgroundColor: initial.theme,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Choisir un fichier
                                    </Button>
                                </label>

                                <ImportProgressBar
                                    isVisible={traitementWaiting}
                                    message={traitementMsg}
                                    variant="determinate"
                                    progress={progressValue}
                                />

                                {nbrAnomalie > 0 && (
                                    <Badge
                                        badgeContent={nbrAnomalie}
                                        color="error"
                                        sx={{ mt: 2, ml: 2 }}
                                    >
                                        <Button
                                            variant="outlined"
                                            onClick={handleOpenAnomalieDetails}
                                            style={{
                                                borderColor: couleurBoutonAnomalie,
                                                color: couleurBoutonAnomalie,
                                                textTransform: 'none'
                                            }}
                                        >
                                            Voir les anomalies
                                        </Button>
                                    </Badge>
                                )}
                            </Paper>

                            {codeJournauxData.length > 0 && (
                                <Paper elevation={3} sx={{ p: 3 }}>
                                    <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                                        Aperçu des données ({codeJournauxData.length} lignes)
                                    </Typography>
                                    <Box sx={{ height: 400, width: '100%' }}>
                                        <DataGrid
                                            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                            slots={{ toolbar: QuickFilter }}
                                            sx={DataGridStyle.sx}
                                            rowHeight={DataGridStyle.rowHeight}
                                            columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                            columns={columns}
                                            rows={codeJournauxData}
                                            initialState={{
                                                pagination: {
                                                    paginationModel: { page: 0, pageSize: 50 },
                                                },
                                            }}
                                            pageSizeOptions={[50, 100]}
                                            pagination
                                            checkboxSelection={false}
                                        />
                                    </Box>
                                </Paper>
                            )}

                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    startIcon={<LogoutIcon />}
                                    onClick={handleReturnToCodeJournaux}
                                    style={{
                                        borderColor: initial.button_delete_color,
                                        color: initial.button_delete_color,
                                        textTransform: 'none'
                                    }}
                                >
                                    Retour
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveAltIcon />}
                                    onClick={handleOpenDialogConfirmImport}
                                    disabled={codeJournauxData.length === 0 || nbrAnomalie > 0}
                                    style={{
                                        backgroundColor: initial.theme,
                                        textTransform: 'none'
                                    }}
                                >
                                    Importer
                                </Button>
                            </Stack>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box>
        </>
    )
}
