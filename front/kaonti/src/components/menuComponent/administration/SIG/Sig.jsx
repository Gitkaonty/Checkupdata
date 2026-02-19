import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, IconButton } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useState } from 'react';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { TbRefresh } from "react-icons/tb";
import Tooltip from '@mui/material/Tooltip';

import { init } from '../../../../../init';
import useAuth from '../../../../hooks/useAuth';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';

import axios, { URL } from '../../../../../config/axios';
import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";

import VirtualTableEbilanEtatFinacier from '../../../componentsTools/EtatFinancier/virtualTableEbilanEtatFinancier';

import ExportEtatFinancierButton from '../../../componentsTools/EtatFinancier/ButtonEtatFinancierExport/ExportEtatFinancierButton/ExportEtatFinancierButton';

import usePermission from '../../../../hooks/usePermission';

const sigColumn = [
    {
        id: 'libelle',
        label: 'Rubriques',
        minWidth: 500,
        align: 'left',
        //format: (value) => value.toLocaleString('en-US'),
        isNumber: false
    },
    {
        id: 'montantnet',
        label: 'Montant net N',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'pourcentagen',
        label: '%',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'montantnetn1',
        label: 'Montant net N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'pourcentagen1',
        label: '%',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'variation',
        label: 'Variation N/N-1',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
    {
        id: 'pourcentagevariation',
        label: '%',
        minWidth: 200,
        align: 'right',
        format: (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isNumber: true
    },
];

export default function Sig() {
    const { canAdd, canModify, canDelete, canView } = usePermission();

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);

    const [verrSig, setVerrSig] = useState(false);

    const [sigData, setSigData] = useState([]);

    const [showTableRefresh, setShowTableRefresh] = useState(false);
    const [tableToRefresh, setTableToRefresh] = useState('');
    const [msgRefresh, setMsgRefresh] = useState('');

    const [isRefreshed, setIsRefreshed] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const navigate = useNavigate();

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);

        getVerouillageEtatFinancier(compteId, fileId, exercice_id);
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);

        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);

            getVerouillageEtatFinancier(compteId, fileId, selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    const handleOpenDialogConfirmRefresh = () => {
        setShowTableRefresh(true);
    }

    const handleCloseDialogConfirmRefresh = () => {
        setShowTableRefresh(false);
    }

    //Refresh tableau
    const handleRefreshTable = async (value) => {
        if (value) {
            setIsLoading(true);
            try {
                await axios.post('/administration/etatFinancier/generateTableEtatFinancier', {
                    id_compte: Number(compteId),
                    id_dossier: Number(fileId),
                    id_exercice: Number(selectedExerciceId),
                    id_etat: tableToRefresh
                }).then((response) => {
                    const resData = response?.data;
                    if (resData.state) {
                        toast.success(resData?.message);
                        setIsRefreshed(prev => !prev);
                    } else {
                        toast.error(resData?.message)
                    }
                })
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
                toast.error(errMsg);
            } finally {
                handleCloseDialogConfirmRefresh();
            }
        } else {
            handleCloseDialogConfirmRefresh();
        }
        setIsLoading(false);
    }

    //refresh table SIG
    const refreshSig = () => {
        setTableToRefresh('SIG');
        setMsgRefresh(`Voulez-vous vraiment actualiser les calculs pour le tableau SIG?`);
        handleOpenDialogConfirmRefresh();
    }

    //verouiller ou non le tableau de SIG
    const lockTableSig = () => {
        lockEtatFinancier(compteId, fileId, selectedPeriodeId, 'SIG', verrSig);
        setVerrSig(!verrSig);
    }

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

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //Récupérer la liste des exercices
    const GetListeExercice = (id) => {
        axios.get(`/paramExercice/listeExercice/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {

                setListeExercice(resData.list);

                const exerciceNId = resData.list?.filter((item) => item.libelle_rang === "N");
                setListeSituation(exerciceNId);

                setSelectedExerciceId(exerciceNId[0].id);
                setSelectedPeriodeChoiceId(0);
                setSelectedPeriodeId(exerciceNId[0].id);

                getVerouillageEtatFinancier(compteId, id, exerciceNId[0].id);
            } else {
                setListeExercice([]);
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    //get information de vérouillage ou non des tableaus
    const getVerouillageEtatFinancier = (compteId, fileId, exerciceId) => {
        axios.post(`/administration/etatFinancier/getVerouillageEtatFinancier`, { compteId, fileId, exerciceId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setVerrSig(resData.liste.find((item) => item.code === 'SIG')?.valide);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //get information de vérouillage ou non des tableaus
    const lockEtatFinancier = (compteId, fileId, exerciceId, tableau, stateVerr) => {
        const verr = !stateVerr;
        axios.post(`/administration/etatFinancier/lockEtatFinancier`, { compteId, fileId, exerciceId, tableau, verr }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                getVerouillageEtatFinancier(compteId, fileId, selectedPeriodeId);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    //Récupérer la liste des exercices
    const GetListeSituation = (id) => {
        axios.get(`/paramExercice/listeSituation/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const list = resData.list;
                setListeSituation(resData.list);
                if (list.length > 0) {
                    setSelectedPeriodeId(list[0].id);
                }
            } else {
                setListeSituation([]);
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
    }

    const getEtatFinancierGlobal = () => {
        axios.post(`/administration/etatFinancier/getSig`, {
            id_compte: Number(compteId),
            id_dossier: Number(fileId),
            id_exercice: Number(selectedExerciceId)
        })
            .then((response) => {
                if (response?.data?.state) {
                    const resData = response?.data;
                    setSigData(resData.liste);
                } else {
                    toast.error(resData.message);
                }
            })
    }

    // Générer une tableau en PDF ou Excel
    const exportFile = (type) => {
        let libelle = "SIG";

        if (type === "PDF") {
            window.open(
                `${URL}/administration/etatFinancier/exportEtatFinancierToPdf/${compteId}/${fileId}/${selectedExerciceId}/${libelle}`,
                "_blank"
            );
        } else {
            const link = document.createElement('a');
            link.href = `${URL}/administration/etatFinancier/exportEtatFinancierToExcel/${compteId}/${fileId}/${selectedExerciceId}/${libelle}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    //récupérer les informations du dossier sélectionné
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
        GetListeExercice(idFile);
    }, []);

    useEffect(() => {
        if (canView && fileId && compteId && selectedExerciceId) {
            getEtatFinancierGlobal();
        }
    }, [fileId, compteId, selectedExerciceId, isRefreshed])

    return (
        <>
            {
                noFile
                    ?
                    <PopupTestSelectedFile
                        confirmationState={sendToHome}
                    />
                    :
                    null
            }
            {
                showTableRefresh
                    ?
                    <PopupActionConfirm
                        msg={msgRefresh}
                        confirmationState={handleRefreshTable}
                        isLoading={isLoading}
                    />
                    :
                    null
            }

            <Box>
                <TabContext value={"1"}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example" style={{ textTransform: 'none', outline: 'none', border: 'none', }}>
                            <Tab
                                style={{
                                    textTransform: 'none',
                                    outline: 'none',
                                    border: 'none',
                                    margin: -5
                                }}
                                label={InfoFileStyle(fileInfos?.dossier)} value="1"
                            />
                        </TabList>
                    </Box>
                    <TabPanel value="1" style={{ height: '100%' }}>
                        <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Administration - SIG</Typography>

                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <Stack
                                    direction={'row'}
                                >
                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Exercice:</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedExerciceId}
                                            label={"valSelect"}
                                            onChange={(e) => handleChangeExercice(e.target.value)}
                                            sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            {listeExercice.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                            ))
                                            }
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Période</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedPeriodeChoiceId}
                                            label={"valSelect"}
                                            onChange={(e) => handleChangePeriode(e.target.value)}
                                            sx={{ width: "150px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            <MenuItem value={0}>Toutes</MenuItem>
                                            <MenuItem value={1}>Situations</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Du</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-standard-label"
                                            id="demo-simple-select-standard"
                                            value={selectedPeriodeId}
                                            label={"valSelect"}
                                            onChange={(e) => handleChangeDateIntervalle(e.target.value)}
                                            sx={{ width: "300px", display: "flex", justifyContent: "left", alignItems: "flex-start", alignContent: "flex-start", textAlign: "left" }}
                                            MenuProps={{
                                                disableScrollLock: true
                                            }}
                                        >
                                            {listeSituation?.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                            ))
                                            }
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Stack>

                            <Box sx={{ width: '100%', typography: 'body1' }}>

                                <Stack
                                    width={"100%"}
                                    height={"100%"}
                                    spacing={0.5}
                                    alignItems={"flex-start"}
                                    alignContent={"flex-start"}
                                    justifyContent={"stretch"}
                                >
                                    <Stack width={"100%"} height={"20px"} alignItems={"center"}
                                        alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                        <Typography variant='h6' sx={{ color: "black" }} align='center'>Soldes intermédiaires de géstion</Typography>
                                    </Stack>

                                    <Stack width={"100%"} height={"50px"} alignItems={"center"} alignContent={"center"}
                                        direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                        <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                            direction={"row"} justifyContent={"right"}>

                                            <ExportEtatFinancierButton
                                                exportToExcel={() => exportFile("EXCEL")}
                                                exportToPdf={() => exportFile("PDF")}
                                                value={'SIG'}
                                            />

                                            <Tooltip title={verrSig ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}>
                                                <IconButton
                                                    onClick={lockTableSig}
                                                    variant="contained"
                                                    style={{
                                                        width: "45px", height: '45px',
                                                        borderRadius: "2px", borderColor: "transparent",
                                                        backgroundColor: verrSig ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                        textTransform: 'none', outline: 'none'
                                                    }}
                                                >
                                                    {verrSig
                                                        ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    }
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>

                                    <Stack
                                        width={"100%"}
                                        alignItems={"start"}
                                        style={{ overflow: "auto" }}
                                    >
                                        <VirtualTableEbilanEtatFinacier
                                            canView={canView}
                                            canAdd={canAdd}
                                            canDelete={canDelete}
                                            canModify={canModify}
                                            columns={sigColumn}
                                            rows={sigData}
                                            state={verrSig}
                                            setIsRefreshed={() => setIsRefreshed(prev => !prev)}
                                        />
                                    </Stack>

                                </Stack>
                            </Box>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box >
        </>
    )
}
