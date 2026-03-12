import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Stack, Box, Tab, Chip } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { init } from '../../../../../init';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { DataGrid, frFR } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import { format } from 'date-fns';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { TbCircleLetterCFilled, TbCircleLetterGFilled, TbCircleLetterAFilled } from "react-icons/tb";
import { DetailsInformation } from '../../../componentsTools/DetailsInformation';
import { BsCheckCircleFill } from "react-icons/bs";
import { PiIdentificationCardFill } from "react-icons/pi";
import { BsPersonFillSlash } from "react-icons/bs";
import { FaGlobeAmericas } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import PopupAddNewAccount from '../../../componentsTools/PlanComptable/PopupAddNewAccount';
import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';
import { TbRefresh } from "react-icons/tb";

export default function ParamPlanComptable() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const axiosPrivate = useAxiosPrivate();

    let initial = init[0];
    const { auth } = useAuth();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const compte = searchParams.get("compte");

    const [pc, setPc] = useState([]);
    const [selectedRow, setSelectedRow] = useState([]);

    const [listCptChg, setListCptChg] = useState([]);
    const [listCptTva, setListCptTva] = useState([]);

    const [pcAllselectedRow, setPcAllselectedRow] = useState([]);
    const [openDialogDeleteItemsPc, setOpenDialogDeleteItemsPc] = useState(false);
    const { id } = useParams();
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);
    const [rowCptInfos, setRowCptInfos] = useState([]);
    const [openInfos, setOpenInfos] = useState(false);
    const [consolidation, setConsolidation] = useState(false);
    const [isTypeComptaAutre, setIsTypeComptaAutre] = useState(false);

    const [openDialogAddNewAccount, setOpenDialogAddNewAccount] = useState(false);
    const [typeAction, setTypeAction] = useState('');
    const [isRefresh, setisRefresh] = useState(false);

    const handleOpenDialogAddNewAccount = (type) => {
        setTypeAction(type);
        setOpenDialogAddNewAccount(true);
    }

    const handleCloseDialogAddNewAccount = () => {
        setOpenDialogAddNewAccount(false);
        setisRefresh(prev => !prev);
    }

    const handleActualize = () => {
        try {
            axios.post(`/paramPlanComptable/recupPcConsolidation`, { fileId, compteId })
                .then((response) => {
                    const listePc = response?.data?.liste;
                    const unique = Object.values(
                        (Array.isArray(listePc) ? listePc : []).reduce((acc, r) => {
                            const k = String(r.compte || '');
                            if (!acc[k]) acc[k] = r;
                            return acc;
                        }, {})
                    );

                    setPc(unique);
                    toast.success('Liste mis à jour avec succès')
                })
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
            toast.error(errMsg);
        }
    }

    const columnHeaderDetail = [
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            sortable: true,
            width: 70,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'dossier',
            headerName: 'Dossier',
            type: 'string',
            sortable: true,
            width: 100,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'compte',
            headerName: 'Compte',
            type: 'string',
            sortable: true,
            width: 175,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                return (
                    <span
                        style={{ cursor: 'pointer', width: '100%' }}
                        onClick={() => handleShowCptInfos(params.row)}
                    >
                        {params.row.compte}
                    </span>
                );
            }
        },
        {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            width: 300,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'typecomptabilite',
            headerName: 'Type comptabilité',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'nature',
            headerName: 'Nature',
            type: 'string',
            sortable: true,
            width: 130,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                if (params.row.nature === 'General') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip
                                icon={<TbCircleLetterGFilled style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Général"

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#48A6A7',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                } else if (params.row.nature === 'Collectif') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>

                            <Chip
                                icon={<TbCircleLetterCFilled style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Collectif"

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#A6D6D6',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                } else {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>

                            <Chip
                                icon={<TbCircleLetterAFilled style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Auxiliaire"

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#123458',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }
            }
        },
        {
            field: 'baseCompte',
            headerName: 'Centr. / base aux.',
            type: 'string',
            sortable: true,
            width: 175,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'cptcharge',
            headerName: 'Cpt charge',
            type: 'string',
            sortable: true,
            width: 100,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                if (params.row.cptcharge === 0) {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: 25,
                                height: 25,
                                backgroundColor: '#DBDBDB',
                                borderRadius: 15,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                {params.row.cptcharge}
                            </div>
                        </Stack>
                    )
                } else {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: 25,
                                height: 25,
                                backgroundColor: '#FDA403',
                                borderRadius: 15,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                {params.row.cptcharge}
                            </div>
                        </Stack>

                    )
                }
            }
        },
        {
            field: 'cpttva',
            headerName: 'Cpt TVA',
            type: 'string',
            sortable: true,
            width: 100,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                if (params.row.cpttva === 0) {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: 25,
                                height: 25,
                                backgroundColor: '#DBDBDB',
                                borderRadius: 15,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                {params.row.cpttva}
                            </div>
                        </Stack>
                    )
                } else {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: 25,
                                height: 25,
                                backgroundColor: '#FDA403',
                                borderRadius: 15,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                {params.row.cpttva}
                            </div>
                        </Stack>

                    )
                }
            }
        },
        {
            field: 'typetier',
            headerName: 'Type de tier',
            type: 'string',
            sortable: true,
            width: 130,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                if (params.row.typetier === 'sans-nif') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip
                                icon={<BsPersonFillSlash style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Sans NIF"

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#FF9149',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                } else if (params.row.typetier === 'avec-nif') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip
                                icon={<PiIdentificationCardFill style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Avec NIF"

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#006A71',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                } else if (params.row.typetier === 'general') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip
                                icon={<BsCheckCircleFill style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Général"

                                style={{
                                    width: "100%",
                                    display: 'flex', // ou block, selon le rendu souhaité
                                    justifyContent: 'space-between',
                                    backgroundColor: '#67AE6E',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                } else if (params.row.typetier === 'etranger') {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <Chip
                                icon={<FaGlobeAmericas style={{ color: 'white', width: 18, height: 18, marginLeft: 10 }} />}
                                label="Etranger"
                                style={{
                                    width: "100%",
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#FBA518',
                                    color: 'white'
                                }}
                            />
                        </Stack>
                    )
                }
            }
        },
        {
            field: 'nif',
            headerName: 'Nif',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'statistique',
            headerName: 'N° statistique',
            type: 'string',
            sortable: true,
            width: 200,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'adresse',
            headerName: 'Adresse',
            type: 'string',
            sortable: true,
            width: 250,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'cin',
            headerName: 'CIN',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'datecin',
            headerName: 'Date CIN',
            type: 'text',
            sortable: true,
            width: 120,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                if (params.row.datecin !== null) {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div>{format(params.row.datecin, "dd/MM/yyyy")}</div>
                        </Stack>
                    )
                }
            }
        },
        {
            field: 'autrepieceid',
            headerName: 'Autre pièces Ident.',
            type: 'text',
            sortable: true,
            width: 200,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'refpieceid',
            headerName: 'Réf pièces Ident.',
            type: 'text',
            sortable: true,
            width: 200,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'adressesansnif',
            headerName: 'Adresse CIN',
            type: 'text',
            sortable: true,
            width: 250,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'nifrepresentant',
            headerName: 'NIF représentant',
            type: 'text',
            sortable: true,
            width: 175,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'addresseetranger',
            headerName: 'Adresse représentant',
            type: 'text',
            sortable: true,
            width: 250,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'pays',
            headerName: 'Pays',
            type: 'text',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'province',
            headerName: 'Province',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'region',
            headerName: 'Région',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'district',
            headerName: 'District',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'commune',
            headerName: 'Commune',
            type: 'string',
            sortable: true,
            width: 180,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        },
        {
            field: 'motcle',
            headerName: 'Mot clé',
            type: 'string',
            sortable: true,
            width: 150,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor'
        }
    ]

    const typeIndex = columnHeaderDetail.findIndex(c => c.field === 'libelle');

    const typeComptabiliteAutre = [
        {
            field: 'compteautre',
            headerName: 'Compte (Autre)',
            type: 'number',
            sortable: true,
            width: 175,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
        },
        {
            field: 'libelleautre',
            headerName: 'Libelle (Autre)',
            type: 'string',
            sortable: true,
            width: 300,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
        },
    ]

    if (isTypeComptaAutre && typeIndex !== -1) {
        columnHeaderDetail.splice(typeIndex + 1, 0, ...typeComptabiliteAutre)
    }

    //paramètres de connexion------------------------------------
    const decoded = auth?.accessToken
        ? jwtDecode(auth.accessToken)
        : undefined
    const compteId = decoded.UserInfo.compteId || 0;

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //Suppression des comptes sélectionnés dans le tableau du plan comptable
    const handleOpenDialogCptDelete = () => {
        setOpenDialogDeleteItemsPc(true);
    }

    const showCptInfos = (state) => {
        setOpenInfos(state);
    }

    const handleShowCptInfos = (row) => {
        const itemId = row.id;
        axios.get(`/paramPlanComptable/keepListCptChgTvaAssoc/${itemId}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListCptChg(resData.detailChg);
                setListCptTva(resData.detailTva);
                setRowCptInfos(row);
                setOpenInfos(true);
            } else {
                toast.error(resData.msg);
            }
        })
    }

    const GetInfosIdDossier = (id) => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                const isTypeComptaAutre = resData.fileInfos[0].typecomptabilite === 'Autres';
                setFileInfos(resData.fileInfos[0]);
                setConsolidation(resData.fileInfos[0].consolidation);
                setIsTypeComptaAutre(isTypeComptaAutre)
                setNoFile(false);
            } else {
                setFileInfos([]);
                setNoFile(true);
            }
        })
    }

    //Affichage du plan comptable
    const showPc = () => {
        axios.post(`/paramPlanComptable/pc`, { fileId: Number(fileId), compteId: Number(compteId) }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                let listePc = resData.liste;

                if (compte) {
                    listePc = listePc.filter((row) => row.compte === compte);
                }

                const unique = Object.values(
                    (Array.isArray(listePc) ? listePc : []).reduce((acc, r) => {
                        const k = String(r.compte || '');
                        if (!acc[k]) acc[k] = r;
                        return acc;
                    }, {})
                );

                setPc(unique);
            } else {
                toast.error(resData.msg);
            }
        })
    }

    //Récupération de l'ID de la ligne sélectionner dans le tableau détail du modèle sélectionné
    const listPCSelectedRow = (selectedRow) => {
        const itemId = selectedRow[0];
        setPcAllselectedRow(selectedRow);

        const itemInfos = pc.find(row => row.id === itemId);
        if (itemInfos) {
            setSelectedRow(itemInfos);

            //récupérer la liste des comptes de charges et compte de TVA associées à la ligne sélectionnée
            axios.get(`/paramPlanComptable/keepListCptChgTvaAssoc/${itemId}`).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setListCptChg(resData.detailChg);
                    setListCptTva(resData.detailTva);
                } else {
                    toast.error(resData.msg);
                }
            })
        }
    }

    const deleteItemsPC = (value) => {
        if (value === true) {
            if (pcAllselectedRow.length >= 1) {
                const listId = pcAllselectedRow;

                axiosPrivate.post(`/paramPlanComptable/deleteItemPc`, { listId, compteId, fileId }).then((response) => {
                    const resData = response.data;
                    showPc();
                    setOpenDialogDeleteItemsPc(false);

                    // Si certains comptes n'ont pas pu être supprimés, on n'affiche PAS le toast de succès.
                    if (resData.stateUndeletableCpt) {
                        toast.error(resData.msgUndeletableCpt || resData.msg);
                        return;
                    }

                    if (resData.state) {
                        toast.success(resData.msg);
                    } else {
                        toast.error(resData.msg);
                    }
                });

            } else {
                toast.error("Veuillez sélectionner au moins une ligne dans le tableau plan comptable.");
            }
        } else {
            setOpenDialogDeleteItemsPc(false);
        }
    }

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

    useEffect(() => {
        if (canView && fileId && compteId) {
            showPc();
        }
    }, [fileId, compteId, compte, isRefresh]);

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
                (openInfos && canView) ?
                    <DetailsInformation
                        row={rowCptInfos}
                        confirmOpen={showCptInfos}
                        listCptChg={listCptChg}
                        listCptTva={listCptTva}
                    />
                    :
                    null}
            {
                openDialogAddNewAccount && (canAdd || canModify) && (
                    <PopupAddNewAccount
                        id_dossier={fileId}
                        id_compte={compteId}
                        selectedRow={selectedRow}
                        open={openDialogAddNewAccount}
                        onClose={handleCloseDialogAddNewAccount}
                        stateAction={typeAction}
                        isTypeComptaAutre={isTypeComptaAutre}
                        setSelectedRow={setSelectedRow}
                    />
                )
            }
            {
                (openDialogDeleteItemsPc && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer les comptes sélectionnés ?"}
                        confirmationState={deleteItemsPC}
                    />
                    :
                    null
            }
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
                                label={InfoFileStyle(fileInfos?.dossier)} value="1"
                            />
                        </TabList>
                    </Box>
                    <TabPanel value="1">
                        <Stack width={"100%"} height={"90%"} spacing={0.5} alignItems={"flex-start"} justifyContent={"stretch"}>
                            <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages : Plan comptable</Typography>
                            <Stack width={"100%"} height={"30px"} spacing={0} alignItems={"center"} alignContent={"center"}
                                direction={"row"} style={{ marginLeft: "0px", marginTop: "30px", justifyContent: "right" }}>

                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                    direction={"row"} justifyContent={"right"}>
                                    {
                                        consolidation && (
                                            <Tooltip title="Actualiser les comptes">
                                                <span>
                                                    <IconButton
                                                        // disabled={statutDeleteButton}  
                                                        onClick={handleActualize}
                                                        variant="contained"
                                                        style={{
                                                            width: "35px", height: '35px',
                                                            borderRadius: "5px", borderColor: "transparent",
                                                            backgroundColor: initial.theme,
                                                            textTransform: 'none', outline: 'none'
                                                        }}
                                                    >
                                                        <TbRefresh style={{ width: '25px', height: '25px', color: 'white' }} />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )
                                    }
                                    <Tooltip title="Ajouter un nouveau compte">
                                        <span>
                                            <IconButton
                                                disabled={!canAdd}
                                                // disabled={statutDeleteButton}  
                                                onClick={() => handleOpenDialogAddNewAccount('ajout')}
                                                variant="contained"
                                                style={{
                                                    width: "35px", height: '35px',
                                                    borderRadius: "5px", borderColor: "transparent",
                                                    backgroundColor: initial.theme,
                                                    textTransform: 'none', outline: 'none'
                                                }}
                                            >
                                                <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Modifier le compte sélectionné">
                                        <span>
                                            <IconButton
                                                disabled={(!canModify) || selectedRow.length === 0}
                                                onClick={() => handleOpenDialogAddNewAccount('modification')}
                                                variant="contained"
                                                style={{
                                                    width: "35px", height: '35px',
                                                    borderRadius: "5px", borderColor: "transparent",
                                                    backgroundColor: initial.theme,
                                                    textTransform: 'none', outline: 'none'
                                                }}
                                            >
                                                <FaRegPenToSquare style={{ width: '25px', height: '25px', color: 'white' }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Supprimer le compte sélectionné">
                                        <span>
                                            <IconButton
                                                disabled={!canDelete || selectedRow.length === 0}
                                                onClick={handleOpenDialogCptDelete}
                                                variant="contained"
                                                style={{
                                                    width: "35px", height: '35px',
                                                    borderRadius: "5px", borderColor: "transparent",
                                                    backgroundColor: initial.button_delete_color,
                                                    textTransform: 'none', outline: 'none'
                                                }}
                                            >
                                                <IoMdTrash style={{ width: '40px', height: '40px', color: 'white' }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                            <Stack height={"70vh"} width={'100%'}>
                                <DataGrid
                                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                    disableRowSelectionOnClick
                                    disableSelectionOnClick={true}
                                    slots={{ toolbar: QuickFilter }}
                                    sx={DataGridStyle.sx}
                                    rowHeight={DataGridStyle.rowHeight}
                                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                    onRowSelectionModelChange={ids => {
                                        const lastId = ids && ids.length ? ids[ids.length - 1] : null;
                                        listPCSelectedRow(lastId != null ? [lastId] : []);
                                    }}
                                    rowSelectionModel={pcAllselectedRow}
                                    rows={pc}
                                    columns={columnHeaderDetail}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { page: 0, pageSize: 100 },
                                        },
                                    }}
                                    experimentalFeatures={{ columnPinning: true }}
                                    pageSizeOptions={[50, 100]}
                                    pagination={DataGridStyle.pagination}
                                    checkboxSelection={DataGridStyle.checkboxSelection}
                                    columnVisibilityModel={{
                                        id: false,
                                    }}
                                />
                            </Stack>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box>
        </>
    )
}
