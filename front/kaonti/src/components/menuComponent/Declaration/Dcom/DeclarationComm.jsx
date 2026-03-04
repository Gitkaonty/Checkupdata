import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, Box, Tab } from '@mui/material';
import { IconButton, Tooltip } from '@mui/material';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";
import { IoMdTrash } from "react-icons/io";
import { TbRefresh } from "react-icons/tb";
import { TbPlaylistAdd } from "react-icons/tb";

import { init } from '../../../../../init';
import axios, { URL } from '../../../../../config/axios';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CiImport } from "react-icons/ci";

import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupImportComma from '../../../componentsTools/DeclarationDroitComm/Popup/Import/PopupImportComma';

import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

import VirtualTableDroitComm from '../../../componentsTools/DeclarationDroitComm/VirtualTableDroitComm';
import VirtualTableDroitCommPlp from '../../../componentsTools/DeclarationDroitComm/VirtualTableDroitCommPlp.jsx';
import PopupDeclarationComm from '../../../componentsTools/DeclarationDroitComm/Popup/PopupDeclarationComm';
import PopupPlpEdit from '../../../componentsTools/DeclarationDroitComm/Popup/PopupPlpEdit';

//Colonne
import VirtualTableDroitCommasColumns from '../../../componentsTools/DeclarationDroitComm/TableColumn/VirtualTableDroitCommasColumns.jsx';
import VirtualTableDroitCommbsColumns from '../../../componentsTools/DeclarationDroitComm/TableColumn/VirtualTableDroitCommbsColumns.jsx';
import VirtualTableDroitCommPLColumns from '../../../componentsTools/DeclarationDroitComm/TableColumn/VirtualTableDroitCommPLColumns.jsx';
import droitCommColumnPLP from '../../../componentsTools/DeclarationDroitComm/TableColumn/DroitColumnPLP';

import usePermission from '../../../../hooks/usePermission.jsx';
import useAxiosPrivate from '../../../../../config/axiosPrivate.js';
import PopupActionConfirm from '../../../componentsTools/popupActionConfirm';
import ExportDComButton from '../../../componentsTools/DeclarationDroitComm/ButtonDComButton/ExportDComButton.jsx';

const getNature = (value) => {
    if (value === '1') return 'SVT'
    else if (value === '2') return 'ADR'
    else if (value === '3') return 'AC'
    else if (value === '4') return 'AI'
    else if (value === '5') return 'DEB'
    else if (value === '6') return 'MV'
    else if (value === '7') return 'PSV'
    else if (value === '8') return 'PL'
    else if (value === '9') return 'PLP'
}

export default function DeclarationComm() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const axiosPrivate = useAxiosPrivate();

    let initial = init[0];
    const [fileInfos, setFileInfos] = useState('');
    const [fileId, setFileId] = useState(0);
    const { id } = useParams();
    const [noFile, setNoFile] = useState(false);
    let tabCom = ""
    if (typeof window !== 'undefined') {
        tabCom = localStorage.getItem('tabCom');
    }
    const [value, setValue] = useState(tabCom || "1");

    //récupération infos de connexion
    const navigate = useNavigate();

    const [selectedExerciceId, setSelectedExerciceId] = useState(0);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState(0);
    const [selectedPeriodeChoiceId, setSelectedPeriodeChoiceId] = useState(0);
    const [listeExercice, setListeExercice] = useState([]);
    const [listeSituation, setListeSituation] = useState([]);

    const [rowToModify, setRowToModify] = useState(null);
    const [idToDelete, setIdToDelete] = useState(null);
    const [typeDelete, setTypeDelete] = useState(null);
    const [idNumcptToDelete, setIdNumcptToDelete] = useState(null);

    const [deviseParDefaut, setDeviseParDefaut] = useState('MGA');

    const [isLoading, setIsLoading] = useState(false);

    const [isRefreshed, setIsRefreshed] = useState(false);

    // State formulaire
    const [showFormSVT, setShowFormSVT] = useState(false);
    const [showFormEditPlp, setShowFormEditPlp] = useState(false);
    const [showPopupImport, setShowPopupImport] = useState(false);

    //Action formulaire
    const [typeActionSVT, setTypeActionSVT] = useState('');
    const [nature, setNature] = useState('');
    const [textTitle, setTextTitle] = useState('');

    //State des droit comm
    const [dataSvt, setDataSvt] = useState([]);
    const [dataAdr, setDataAdr] = useState([]);
    const [dataAc, setDataAc] = useState([]);
    const [dataAi, setDataAi] = useState([]);
    const [dataDeb, setDataDeb] = useState([]);
    const [dataMv, setDataMv] = useState([]);
    const [dataPsv, setDataPsv] = useState([]);
    const [dataPl, setDataPl] = useState([]);
    const [dataPlp, setDataPlp] = useState([]);

    //State des verrouillages des tableaux
    const [verrouillageSvt, setVerrouillageSvt] = useState(false);
    const [verrouillageAdr, setVerrouillageAdr] = useState(false);
    const [verrouillageAc, setVerrouillageAc] = useState(false);
    const [verrouillageAi, setVerrouillageAi] = useState(false);
    const [verrouillageDeb, setVerrouillageDeb] = useState(false);
    const [verrouillageMv, setVerrouillageMv] = useState(false);
    const [verrouillagePsv, setVerrouillagePsv] = useState(false);
    const [verrouillagePl, setVerrouillagePl] = useState(false);
    const [verrouillagePlp, setVerrouillagePlp] = useState(false);

    //récupération des informations de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    //Modal suppression
    const [openDialogDeleteAllComm, setOpenDialogDeleteAllComm] = useState(false);
    const [openDialogDeleteOneComm, setOpenDialogDeleteOneComm] = useState(false);

    //Modal de confirmation de génération auto
    const [openDialogGenerateAuto, setOpenDialogGenerateAuto] = useState(false);

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //Choix exercice
    const handleChangeExercice = (exercice_id) => {
        setSelectedExerciceId(exercice_id);
        setSelectedPeriodeChoiceId("0");
        setListeSituation(listeExercice?.filter((item) => item.id === exercice_id));
        setSelectedPeriodeId(exercice_id);
    }

    //Choix période
    const handleChangePeriode = (choix) => {
        setSelectedPeriodeChoiceId(choix);
        if (choix === 0) {
            setListeSituation(listeExercice?.filter((item) => item.id === selectedExerciceId));
            setSelectedPeriodeId(selectedExerciceId);
        } else if (choix === 1) {
            GetListeSituation(selectedExerciceId);
        }
    }

    const handleChangeTAB = (event, newValue) => {
        setValue(newValue);
        localStorage.setItem('tabCom', newValue);
        const nature = getNature(newValue);
        setNature(nature);
    };

    //Fonction formulaire
    const handleOpenFormSVT = (type, nature) => {
        setTypeActionSVT(type);
        setShowFormSVT(true);
        setNature(nature);
        const textTitle = getTextTitle(nature);
        setTextTitle(textTitle);
    }

    // Obtenir le titre
    const getTextTitle = (text) => {
        if (text === 'SVT') {
            return 'Sommes versées à des tiers';
        } else if (text === 'ADR') {
            return 'Achats de marchandises destinées à la revente';
        } else if (text === 'AC') {
            return 'Achats non destinés à la vente';
        } else if (text === 'AI') {
            return 'Achats immobilisés';
        } else if (text === 'DEB') {
            return 'Debours';
        } else if (text === 'MV') {
            return 'Marchandises vendues';
        } else if (text === 'PSV') {
            return 'Prestations de services vendues';
        } else if (text === 'PL') {
            return 'Produits locaux';
        }
    }

    // Fonction popup import
    const handleOpenPopupImport = (nature) => {
        const textTitle = getTextTitle(nature);
        setTextTitle(textTitle);
        setShowPopupImport(true);
    }

    const handleClosePopupImport = (value) => {
        setShowPopupImport(value);
    }

    const handleCloseFormSVT = (value) => {
        setShowFormSVT(value);
        setRowToModify(null);
    }

    const handleCloseFormEditPlp = (value) => {
        setShowFormEditPlp(value);
    }

    //Ouvrir la dialogue de suppression
    const handleOpenDialogConfirmDeleteComm = (nature) => {
        setOpenDialogDeleteAllComm(true);
    }

    //Suppression ligne ----------------------------------------------------------------------------------

    const deleteOneRowSvt = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowAdr = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowAc = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowAi = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowDeb = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowMv = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowPsv = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    const deleteOneRowPl = (row) => {
        setIdToDelete(Number(row.id));
        setIdNumcptToDelete(Number(row?.id_numcpt));
        setTypeDelete(row.type);
        setOpenDialogDeleteOneComm(true);
    }

    //Modification ligne ---------------------------------------------------------------------------------

    const modifyOneRowSvt = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowAdr = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowAc = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowAi = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowDeb = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowMv = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowPsv = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    const modifyOneRowPl = (row, nature) => {
        setRowToModify(row);
        setShowFormSVT(true);
        setTypeActionSVT('Modification');
        setNature(nature);
    }

    //Modification Plp
    const modifyOneRowPlp = (row, nature) => {
        setRowToModify(row);
        setShowFormEditPlp(true);
        setNature(nature);
    }

    const lockTableSvt = () => {
        lockTableFunction('SVT', verrouillageSvt);
        setVerrouillageSvt(!verrouillageSvt);
    }

    const lockTableAdr = () => {
        lockTableFunction('ADR', verrouillageAdr);
        setVerrouillageAdr(!verrouillageAdr);
    }

    const lockTableAc = () => {
        lockTableFunction('AC', verrouillageAc);
        setVerrouillageAc(!verrouillageAc);
    }

    const lockTableAi = () => {
        lockTableFunction('AI', verrouillageAi);
        setVerrouillageAi(!verrouillageAi);
    }

    const lockTableDeb = () => {
        lockTableFunction('DEB', verrouillageDeb);
        setVerrouillageDeb(!verrouillageDeb);
    }

    const lockTableMv = () => {
        lockTableFunction('MV', verrouillageMv);
        setVerrouillageMv(!verrouillageMv);
    }

    const lockTablePsv = () => {
        lockTableFunction('PSV', verrouillagePsv);
        setVerrouillagePsv(!verrouillagePsv);
    }

    const lockTablePl = () => {
        lockTableFunction('PL', verrouillagePl);
        setVerrouillagePl(!verrouillagePl);
    }

    const lockTablePlp = () => {
        lockTableFunction('PLP', verrouillagePlp);
        setVerrouillagePlp(!verrouillagePlp);
    }

    //Verrouillage d'un tableau ---------------------------------------------------------------------------

    // Appel API
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

    //Récupération données liste des devises
    const getListeDevises = () => {
        axios.get(`/devises/devise/compte/${compteId}/${fileId}`)
            .then((response) => {
                const data = response.data;
                const defaultDevise = data.find(val => val.par_defaut === true);
                if (defaultDevise) {
                    setDeviseParDefaut(defaultDevise.code);
                }
            })
    };

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

            } else {
                setListeExercice([]);
                toast.error("une erreur est survenue lors de la récupération de la liste des exercices");
            }
        })
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

    const handleDeleteOneCommByType = (value) => {
        if (value) {
            setOpenDialogDeleteOneComm(false);
            axiosPrivate.delete('/declaration/comm/deleteOneCommByType',
                {
                    data: { id: idToDelete, type: nature, action: typeDelete, id_numcpt: idNumcptToDelete }
                }).then((response) => {
                    if (response?.data?.state) {
                        setIsRefreshed(!isRefreshed);
                        toast.success(response?.data?.message);
                    } else {
                        toast.error(response?.data?.message);
                    }
                })
        } else {
            setOpenDialogDeleteOneComm(false);
        }
    }

    //Verrouillage d'un tableau ---------------------------------------------------------------------------
    const lockTableFunction = (tableau, verrouillage) => {
        const valide = !verrouillage;
        axios.post('/declaration/comm/verrouillerTableComm',
            {
                tableau,
                valide,
                id_dossier: Number(fileId),
                id_exercice: Number(selectedExerciceId),
                id_compte: Number(compteId)
            }
        )
            .then((response) => {
                if (response?.data?.state) {
                } else {
                    toast.error(response?.data?.message);
                }
            })
    }

    //Suppression droit de communication par type
    const handleDeleteAllCommByType = (value) => {
        if (value) {
            axiosPrivate.delete('/declaration/comm/deleteAllCommByType', { data: { type: nature } })
                .then((response) => {
                    if (response.data.state) {
                        setIsRefreshed(!isRefreshed);
                        toast.success(response?.data?.message);
                    } else {
                        toast.error(response.data.message);
                    }
                })
            setOpenDialogDeleteAllComm(false);
        } else {
            setOpenDialogDeleteAllComm(false);
        }
    }

    //Recupération des données de la table comm global
    const handleGetDroitCommGLobal = () => {
        axios.get(`/declaration/comm/getDroitCommGlobal/${compteId}/${fileId}/${selectedExerciceId}`).then((response) => {
            const data = response?.data?.data;
            if (response?.data?.state) {
                setDataSvt(data?.SVT);
                setDataAdr(data?.ADR);
                setDataAc(data?.AC);
                setDataAi(data?.AI);
                setDataDeb(data?.DEB);
                setDataMv(data?.MV);
                setDataPsv(data?.PSV);
                setDataPl(data?.PL);
                setDataPlp(data?.PLP);

            } else {
                toast.error(response?.data?.message);
            }
        })
    }

    //Récupération des vérouillages des tableaux
    const handleGetVerrouillage = () => {
        axios.get(`/declaration/comm/getVerrouillageComm/${compteId}/${fileId}/${selectedExerciceId}`).then((response) => {
            const data = response?.data?.data;
            if (response?.data?.state) {
                setVerrouillageSvt(data?.find((item) => item.code === 'SVT')?.valide);
                setVerrouillageAdr(data?.find((item) => item.code === 'ADR')?.valide);
                setVerrouillageAc(data?.find((item) => item.code === 'AC')?.valide);
                setVerrouillageAi(data?.find((item) => item.code === 'AI')?.valide);
                setVerrouillageDeb(data?.find((item) => item.code === 'DEB')?.valide);
                setVerrouillageMv(data?.find((item) => item.code === 'MV')?.valide);
                setVerrouillagePsv(data?.find((item) => item.code === 'PSV')?.valide);
                setVerrouillagePl(data?.find((item) => item.code === 'PL')?.valide);
                setVerrouillagePlp(data?.find((item) => item.code === 'PLP')?.valide);
            }
        })
    }

    //Afficher le modal de confirmation de génération automatique
    const handleOpenDialogConfirmGenerateAuto = (nature) => {
        setOpenDialogGenerateAuto(true);
        setNature(nature);
    }

    //Génération automatique d'une table
    const handleGenerateDComAuto = async (value) => {
        if (value) {
            setIsLoading(true);
            try {
                await axios.post(`/declaration/comm/generateDCommAuto`, {
                    id_dossier: Number(fileId),
                    id_exercice: Number(selectedExerciceId),
                    id_compte: Number(compteId),
                    nature
                }).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        toast.success(response?.data?.message);
                        setIsRefreshed(prev => !prev);
                    } else {
                        toast.error(resData.message)
                    }
                })
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
                toast.error(errMsg);
            } finally {
                setOpenDialogGenerateAuto(false);
            }
        } else {
            setOpenDialogGenerateAuto(false);
        }
        setIsLoading(false);
    }

    const droitCommColumnsA = VirtualTableDroitCommasColumns(fileId);
    const droitCommColumnsB = VirtualTableDroitCommbsColumns(fileId);
    const droitCommColumnPL = VirtualTableDroitCommPLColumns(fileId);

    const exportFile = (type, nature) => {
        if (type === 'PDF') {
            window.open(
                `${URL}/declaration/comm/exportToPDF/${compteId}/${fileId}/${selectedExerciceId}/${nature}`,
                "_blank"
            );
        } else {
            const link = document.createElement('a');
            link.href = `${URL}/declaration/comm/exportToExcel/${compteId}/${fileId}/${selectedExerciceId}/${nature}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    //récupérer les informations du dossier sélectionné
    useEffect(() => {
        //tester si la page est renvoyer par useNavigate
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
        if (canView) {
            handleGetDroitCommGLobal();
            handleGetVerrouillage();
            getListeDevises();
        }
    }, [compteId, fileId, selectedExerciceId, isRefreshed])

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
                (openDialogDeleteAllComm && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment toutes les lignes du ${nature} ?`}
                        confirmationState={handleDeleteAllCommByType} />
                    :
                    null
            }
            {
                (openDialogDeleteOneComm && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment la ligne selectionné`}
                        confirmationState={handleDeleteOneCommByType} />
                    :
                    null
            }
            {
                (showFormSVT && (canAdd || canModify)) ?
                    <PopupDeclarationComm
                        type={typeActionSVT}
                        confirmationState={handleCloseFormSVT}
                        selectedExerciceId={selectedExerciceId}
                        fileId={fileId}
                        compteId={compteId}
                        nature={nature}
                        // rowToModify={rowToModify?.lignes[0]}
                        rowToModify={rowToModify}
                        setIsRefreshed={() => setIsRefreshed(!isRefreshed)}
                        textTitle={textTitle}
                        deviseParDefaut={deviseParDefaut}
                    /> : null
            }
            {
                (showFormEditPlp && canModify) ?
                    <PopupPlpEdit
                        confirmationState={handleCloseFormEditPlp}
                        rowToModify={rowToModify}
                        setIsRefreshed={() => setIsRefreshed(!isRefreshed)}
                        deviseParDefaut={deviseParDefaut}
                    />
                    : null
            }
            {
                showPopupImport ?
                    <PopupImportComma
                        nature={nature}
                        selectedExerciceId={selectedExerciceId}
                        fileId={fileId}
                        compteId={compteId}
                        confirmationState={handleClosePopupImport}
                        setIsRefreshed={() => setIsRefreshed(!isRefreshed)}
                        textTitle={textTitle}
                    />
                    :
                    null
            }
            {
                openDialogGenerateAuto ?
                    <PopupActionConfirm
                        msg={`Voulez-vous vraiment générer automatiquement les ${nature} ? Toutes les anciennes données seront supprimées.`}
                        confirmationState={handleGenerateDComAuto}
                        isLoading={isLoading}
                    />
                    :
                    null
            }
            <Box>
                <TabContext value={"1"} >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example">
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
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>{"Déclarations - DCom (Droit de communication)"}</Typography>
                            <Stack width={"100%"} height={"80px"} spacing={4} alignItems={"left"} alignContent={"center"} direction={"row"} style={{ marginLeft: "0px", marginTop: "20px" }}>
                                <Stack
                                    direction={"row"}
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
                                                <MenuItem
                                                    key={option.id}
                                                    value={option.id}
                                                >{option.libelle_rang}: {format(option.date_debut, "dd/MM/yyyy")} - {format(option.date_fin, "dd/MM/yyyy")}</MenuItem>
                                            ))
                                            }
                                        </Select>
                                    </FormControl>

                                    <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                                        <InputLabel id="demo-simple-select-standard-label">Période</InputLabel>
                                        <Select
                                            disabled
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
                                <TabContext value={value}>
                                    <Box sx={{
                                        borderBottom: 1,
                                        borderColor: 'transparent',
                                        // width: 'fit-content',
                                        // mx: 'auto',
                                    }}>
                                        <TabList onChange={handleChangeTAB} aria-label="lab API tabs example" variant='scrollable'>
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="SVT" value="1" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="ADR" value="2" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="AC" value="3" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="AI" value="4" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="DEB" value="5" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="MV" value="6" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="PSV" value="7" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="PL" value="8" />
                                            <Tab disabled={!listeExercice || listeExercice.length === 0 || !selectedExerciceId || selectedExerciceId === 0} style={{ textTransform: 'none', outline: 'none', border: 'none', }} label="PLP" value="9" />
                                        </TabList>
                                    </Box>
                                    <TabPanel
                                        value="1"
                                    >
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Sommes versées à des tiers"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('SVT')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillageSvt ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'SVT')}
                                                        exportToPdf={() => exportFile('PDF', 'SVT')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'SVT')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageSvt ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('SVT')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageSvt ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('SVT')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageSvt ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillageSvt ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTableSvt}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillageSvt ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillageSvt
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'SVT'}
                                                    columns={droitCommColumnsA}
                                                    rows={dataSvt}
                                                    verrouillage={verrouillageSvt}
                                                    deleteState={deleteOneRowSvt}
                                                    modifyState={modifyOneRowSvt}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="2">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Achats de marchandises destinées à la revente"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('ADR')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillageAdr ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'ADR')}
                                                        exportToPdf={() => exportFile('PDF', 'ADR')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'ADR')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAdr ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('ADR')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAdr ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('ADR')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAdr ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillageAdr ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTableAdr}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillageAdr ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillageAdr
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'ADR'}
                                                    columns={droitCommColumnsA}
                                                    rows={dataAdr}
                                                    verrouillage={verrouillageAdr}
                                                    deleteState={deleteOneRowAdr}
                                                    modifyState={modifyOneRowAdr}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="3">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Achats non destinés à la vente"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>
                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('AC')}
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillageAc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'AC')}
                                                        exportToPdf={() => exportFile('PDF', 'AC')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'AC')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('AC')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('AC')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAc ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillageAc ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTableAc}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillageAc ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillageAc
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>

                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'AC'}
                                                    columns={droitCommColumnsA}
                                                    verrouillage={verrouillageAc}
                                                    rows={dataAc}
                                                    deleteState={deleteOneRowAc}
                                                    modifyState={modifyOneRowAc}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="4">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Achats immobilisés"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('AI')}
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillageAi ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'AI')}
                                                        exportToPdf={() => exportFile('PDF', 'AI')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'AI')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAi ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('AI')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAi ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('AI')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageAi ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillageAi ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTableAi}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillageAi ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillageAi
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'AI'}
                                                    columns={droitCommColumnsA}
                                                    rows={dataAi}
                                                    verrouillage={verrouillageAi}
                                                    deleteState={deleteOneRowAi}
                                                    modifyState={modifyOneRowAi}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="5">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Debours"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('DEB')}
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillageDeb ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'DEB')}
                                                        exportToPdf={() => exportFile('PDF', 'DEB')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'DEB')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageDeb ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('DEB')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageDeb ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('DEB')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageDeb ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillageDeb ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTableDeb}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillageDeb ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillageDeb
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'DEB'}
                                                    columns={droitCommColumnsA}
                                                    verrouillage={verrouillageDeb}
                                                    rows={dataDeb}
                                                    deleteState={deleteOneRowDeb}
                                                    modifyState={modifyOneRowDeb}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="6">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Marchandises vendues"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('MV')}
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillageMv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'MV')}
                                                        exportToPdf={() => exportFile('PDF', 'MV')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'MV')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageMv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('MV')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageMv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('MV')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillageMv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillageMv ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTableMv}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillageMv ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillageMv
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'MV'}
                                                    columns={droitCommColumnsB}
                                                    verrouillage={verrouillageMv}
                                                    rows={dataMv}
                                                    deleteState={deleteOneRowMv}
                                                    modifyState={modifyOneRowMv}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="7">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Prestations de services vendues"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('PSV')}
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillagePsv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'PSV')}
                                                        exportToPdf={() => exportFile('PDF', 'PSV')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'PSV')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillagePsv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('PSV')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillagePsv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('PSV')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillagePsv ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={verrouillagePsv ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTablePsv}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillagePsv ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillagePsv
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'PSV'}
                                                    columns={droitCommColumnsB}
                                                    verrouillage={verrouillagePsv}
                                                    rows={dataPsv}
                                                    deleteState={deleteOneRowPsv}
                                                    modifyState={modifyOneRowPsv}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="8">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Produis locaux"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <Tooltip title="Importer des données">
                                                        <IconButton
                                                            onClick={() => handleOpenPopupImport('PL')}
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                borderRadius: "2px",
                                                                border: "2px solid rgba(5,96,116,0.60)",
                                                                backgroundColor: "transparent",
                                                                textTransform: "none",
                                                                outline: "none",
                                                                display: verrouillagePl ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <CiImport style={{ width: '25px', height: '25px', color: 'rgba(5,96,116,0.60)' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'PL')}
                                                        exportToPdf={() => exportFile('PDF', 'PL')}
                                                        value={nature}
                                                    />

                                                    <Tooltip title="Ajouter une ligne">
                                                        <IconButton
                                                            disabled={!canAdd}
                                                            onClick={() => handleOpenFormSVT('Ajout', 'PL')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillagePl ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Supprimer toutes les lignes du tableau">
                                                        <IconButton
                                                            disabled={!canDelete}
                                                            onClick={() => handleOpenDialogConfirmDeleteComm('PL')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.button_delete_color,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillagePl ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Actualiser les calculs">
                                                        <IconButton
                                                            // onClick={refreshBHIAPC}
                                                            onClick={() => handleOpenDialogConfirmGenerateAuto('PL')}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "1px", borderColor: "transparent",
                                                                backgroundColor: initial.theme,
                                                                textTransform: 'none', outline: 'none',
                                                                display: verrouillagePl ? 'none' : 'inline-flex',
                                                            }}
                                                        >
                                                            <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                        </IconButton>
                                                    </Tooltip>


                                                    <Tooltip
                                                        title={verrouillagePl ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            // onClick={lockTableBHIAPC}
                                                            onClick={lockTablePl}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillagePl ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillagePl
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitComm
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'PL'}
                                                    columns={droitCommColumnPL}
                                                    verrouillage={verrouillagePl}
                                                    rows={dataPl}
                                                    deleteState={deleteOneRowPl}
                                                    modifyState={modifyOneRowPl}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel value="9">
                                        <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                            alignContent={"flex-start"} justifyContent={"stretch"} >
                                            <Stack width={"100%"} height={"20px"} spacing={1} alignItems={"center"}
                                                alignContent={"center"} direction={"row"} justifyContent={"center"}>
                                                <Typography variant='h6' sx={{ color: "black" }} align='center'>{"Produis locaux par produits"}</Typography>
                                            </Stack>
                                            <Stack width={"100%"} height={"50px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                                direction={"row"} style={{ marginLeft: "0px", marginTop: "0px" }}>
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}>

                                                    <ExportDComButton
                                                        exportToExcel={() => exportFile('EXCEL', 'PLP')}
                                                        exportToPdf={() => exportFile('PDF', 'PLP')}
                                                        value={nature}
                                                    />

                                                    <Tooltip
                                                        title={verrouillagePlp ? 'Déverrouiller le tableau' : 'Vérrouiller le tableau'}
                                                    >
                                                        <IconButton
                                                            onClick={lockTablePlp}
                                                            variant="contained"
                                                            style={{
                                                                width: "45px", height: '45px',
                                                                borderRadius: "2px", borderColor: "transparent",
                                                                backgroundColor: verrouillagePlp ? "rgba(240, 43, 33, 1)" : "rgba(9, 77, 31, 0.8)",
                                                                textTransform: 'none', outline: 'none'
                                                            }}
                                                        >
                                                            {verrouillagePlp
                                                                ? <CiLock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                                : <CiUnlock style={{ width: '25px', height: '25px', color: 'white' }} />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>

                                                </Stack>
                                            </Stack>
                                            <Stack
                                                width={"100%"}
                                                height={"50vh"}
                                                alignItems={'start'}
                                                style={{ overflow: 'auto' }}
                                            >
                                                <VirtualTableDroitCommPlp
                                                    canModify={canModify}
                                                    canDelete={canDelete}
                                                    nature={'PLP'}
                                                    columns={droitCommColumnPLP}
                                                    verrouillage={verrouillagePlp}
                                                    rows={dataPlp}
                                                    modifyState={modifyOneRowPlp}
                                                />
                                            </Stack>
                                        </Stack>
                                    </TabPanel>
                                </TabContext>
                            </Box>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box >
        </>
    )
}