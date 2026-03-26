import { useEffect, useState } from 'react';
import {
    Box, Typography, IconButton, Drawer, Stack, Chip,
    TextField, Button,
    Fade, Tooltip,
    Autocomplete
} from '@mui/material';
import {
    Close as CloseIcon,
    VisibilityOutlined as ViewIcon, EditOutlined as EditIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import usePermission from '../../../../hooks/usePermission';
import axios from '../../../../../config/axios';
import useAxiosPrivate from '../../../../../config/axiosPrivate';
import DatagridGlobal from '../../../componentsTools/Dossier/Datagrid/DatagridGlobal';
import { Formik } from 'formik';
import { FormikAutocomplete, FormikDateField, FormikTextField } from '../../../componentsTools/Global/Input/FieldFormik';
import { format } from 'date-fns';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';

const PlanComptablePage = () => {
    const apiRef = useGridApiRef();
    const axiosPrivate = useAxiosPrivate();
    const [selectedRow, setSelectedRow] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { id } = useParams();
    const [pc, setPc] = useState([]);
    const [pcCollectif, setPcCollectif] = useState([]);
    const { auth } = useAuth();
    const decoded = auth?.accessToken
        ? jwtDecode(auth.accessToken)
        : undefined
    const compteId = decoded.UserInfo.compteId || 0;
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const [searchParams] = useSearchParams();
    const compte = searchParams.get("compte");
    const [rowModesModel, setRowModesModel] = useState({});
    const [consolidation, setConsolidation] = useState(false);
    const [isTypeComptaAutre, setIsTypeComptaAutre] = useState(false);
    const navigate = useNavigate();
    const [noFile, setNoFile] = useState(false);

    const [listPays, setListPays] = useState([]);
    const [listProvinces, setListProvinces] = useState([]);
    const [listRegions, setListRegions] = useState([]);
    const [listDistricts, setListDistricts] = useState([]);
    const [listCommunes, setListCommunes] = useState([]);

    const initialValues = {
        itemId: 0,
        idCompte: Number(compteId),
        idDossier: Number(id),
        nif: '',
        statistique: '',
        adresse: '',
        motcle: '',
        cin: '',
        dateCin: '',
        autrepieceid: '',
        refpieceid: '',
        adressesansnif: '',
        nifrepresentant: '',
        adresseetranger: '',
        pays: '',
        province: '',
        region: '',
        district: '',
        commune: '',
        compteautre: '',
        libelleautre: ''
    };

    const savePopupRows = async (values) => {
        const response = await axios.post('/paramPlanComptable/editPcFromPopup', { row: values });
        if (response?.data?.state) {
            toast.success(response?.data?.message);
            setSelectedRow(response.data.row[0]);
        } else {
            toast.error(response?.data?.message);
        }
    }

    const natureOptions = [
        { value: 'General', label: 'General' },
        { value: 'Collectif', label: 'Collectif' },
        { value: 'Aux', label: 'Auxilliaire' },
    ];

    const typeTierOptions = [
        { value: 'sans-nif', label: 'Sans nif' },
        { value: 'avec-nif', label: 'Avec nif' },
        { value: 'etranger', label: 'Etranger' },
        { value: 'general', label: 'General' },
    ];

    const handleOpenDetails = (row) => {
        setSelectedRow(row);
        setDrawerOpen(true);
    };

    const showPc = () => {
        axios.post(`/paramPlanComptable/pc`, { fileId: Number(id), compteId: Number(compteId) }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                let listePc = resData.liste;

                if (compte) {
                    listePc = listePc.filter((row) => row.compte === compte);
                }

                const compteCollectif = listePc.filter(val => val.nature === 'Collectif');

                setPc(listePc);
                setPcCollectif(compteCollectif);
            } else {
                toast.error(resData.msg);
            }
        })
    }

    const columnHeaderDetail = [
        {
            field: 'dossier',
            headerName: 'Dossier',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                return (
                    <Stack sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {params.value}
                    </Stack>
                )
            }
        },
        {
            field: 'compte',
            headerName: 'Compte',
            type: 'string',
            sortable: true,
            editable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
        },
        {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 5,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderCell: (params) => {
                return (
                    <Stack sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {params.value}
                    </Stack>
                )
            },
            renderEditCell: (params) => (
                <TextField
                    variant="standard"
                    defaultValue={params.value}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                    }}
                    sx={{
                        backgroundColor: 'white',
                        border: 'none',
                        outline: 'none',
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            fontSize: '13px',
                            paddingLeft: '10px'
                        },
                    }}
                    onChange={(e) => {
                        params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: e.target.value,
                        });
                    }}
                />
            ),
        },
        {
            field: 'nature',
            headerName: 'Nature',
            type: 'string',
            sortable: true,
            width: 130,
            headerAlign: 'center',
            editable: true,
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                const nature = params.row.nature;
                const color = nature === 'General' ? 'rgba(0, 229, 255, 0.2)' : nature === 'Collectif' ? 'rgba(34, 123, 33, 0.2)' : 'rgba(22, 41, 180, 0.1)';
                return (
                    <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                        <Chip label={params.value} sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800, backgroundColor: color, textTransform: 'uppercase' }} />
                    </Stack>
                )
            },
            renderEditCell: (params) => {
                return (
                    <Autocomplete
                        key={params.id}
                        autoHighlight
                        autoComplete
                        openOnFocus
                        disableClearable={false}
                        popperprops={{ disablePortal: true }}
                        fullWidth
                        options={natureOptions}
                        getOptionLabel={(option) => option.label}
                        value={
                            natureOptions.find((option) => option.value === params.value) || null
                        }
                        onChange={(event, newValue) => {
                            params.api.setEditCellValue({
                                id: params.id,
                                field: params.field,
                                value: newValue ? newValue.value : "",
                            });
                        }}
                        noOptionsText="Aucune nature trouvé"
                        slotProps={{
                            paper:
                            {
                                sx: {
                                    '& .MuiAutocomplete-option': {
                                        fontSize: '13px',
                                    },
                                    '& .MuiAutocomplete-noOptions': {
                                        fontSize: '13px',
                                    }
                                }
                            }
                        }}
                        renderInput={(paramsInput) => {
                            return (
                                <TextField
                                    {...paramsInput}
                                    variant="standard"
                                    placeholder="Choisir un nature"
                                    fullWidth
                                    InputProps={{
                                        ...paramsInput.InputProps,
                                        disableUnderline: true,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            padding: '4px 8px',
                                            fontSize: '13px',
                                            paddingLeft: '10px'
                                        },
                                        "& .MuiInputBase-root": {
                                            height: 50,
                                        },
                                        paddingLeft: '10px'
                                    }}
                                />
                            );
                        }}
                    />
                )
            }
        },
        {
            field: 'baseaux_id',
            headerName: 'Base',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderCell: (params) => {
                const value = params.value;
                const pcFind = pc.find(val => val.id === value);
                return (
                    <Stack sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary' }}>
                        {pcFind?.compte}
                    </Stack>
                )
            },
            renderEditCell: (params) => {
                const updatedRow = params.api.getRowWithUpdatedValues(params.id);
                const currentNature = updatedRow?.nature ?? params.row.nature;

                const isNatureAux = currentNature === 'Aux';

                return (
                    <Autocomplete
                        key={params.id}
                        autoHighlight
                        autoComplete
                        openOnFocus
                        disableClearable={false}
                        fullWidth

                        options={isNatureAux ? pcCollectif : []}

                        getOptionLabel={(option) => option.compte + ' - ' + option.libelle}
                        value={
                            pcCollectif.find((option) => option.id === params.value) || null
                        }

                        onChange={(event, newValue) => {
                            params.api.setEditCellValue({
                                id: params.id,
                                field: params.field,
                                value: newValue ? newValue.id : "",
                            });
                        }}

                        noOptionsText={
                            isNatureAux
                                ? "Aucun compte trouvé"
                                : "Sélectionnez d'abord Nature = Aux"
                        }
                        slotProps={{
                            paper:
                            {
                                sx: {
                                    '& .MuiAutocomplete-option': {
                                        fontSize: '13px',
                                    },
                                    '& .MuiAutocomplete-noOptions': {
                                        fontSize: '13px',
                                    }
                                }
                            }
                        }}
                        renderInput={
                            (paramsInput) => {
                                return (
                                    <TextField
                                        {...paramsInput}
                                        variant="standard"
                                        placeholder="Choisir un compte"
                                        fullWidth
                                        InputProps={{ ...paramsInput.InputProps, disableUnderline: true }}
                                        style={{
                                            width: 400,
                                            transition: "width 0.2s ease-in-out",
                                            fontSize: "13px",
                                        }}
                                        sx={{
                                            "& .MuiInputBase-input": {
                                                padding: "4px 8px",
                                                fontSize: "13px",
                                                paddingLeft: "10px",
                                            },
                                            "& .MuiInputBase-root": { height: 50 },
                                            paddingLeft: "10px",
                                        }}
                                    />
                                );
                            }

                        }
                    />
                );
            }
        },
        {
            field: 'typetier',
            headerName: 'Type de tier',
            type: 'string',
            sortable: true,
            editable: true,
            width: 130,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            renderCell: (params) => {
                return (
                    <Stack width={'100%'} sx={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 800, color: '#0A192F', textTransform: 'uppercase' }}>
                        {params.value}
                    </Stack>
                )
            },
            renderEditCell: (params) => {
                return (
                    <Autocomplete
                        key={params.id}
                        autoHighlight
                        autoComplete
                        openOnFocus
                        disableClearable={false}
                        popperprops={{ disablePortal: true }}
                        fullWidth
                        options={typeTierOptions}
                        getOptionLabel={(option) => option.label}
                        value={
                            typeTierOptions.find((option) => option.value === params.value) || null
                        }
                        onChange={(event, newValue) => {
                            params.api.setEditCellValue({
                                id: params.id,
                                field: params.field,
                                value: newValue ? newValue.value : "",
                            });
                        }}
                        noOptionsText="Aucune tier trouvé"
                        slotProps={{
                            paper: {
                                sx: {
                                    '& .MuiAutocomplete-option': {
                                        fontSize: '13px',
                                    }
                                }
                            }
                        }}
                        renderInput={(paramsInput) => {
                            return (
                                <TextField
                                    {...paramsInput}
                                    variant="standard"
                                    placeholder="Choisir un tier"
                                    fullWidth
                                    InputProps={{
                                        ...paramsInput.InputProps,
                                        disableUnderline: true,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            padding: '4px 8px',
                                            fontSize: '13px',
                                            paddingLeft: '10px'
                                        },
                                        "& .MuiInputBase-root": {
                                            height: 50,
                                        },
                                        paddingLeft: '10px'
                                    }}
                                />
                            );
                        }}
                    />
                )
            }
        }
    ]

    const verifyCanUpdate = async (id_nucpt) => {
        const response = await axios.post('/paramPlanComptable/verifyCanUpdate', {
            id_numcpt: Number(id_nucpt),
            id_compte: Number(compteId),
            id_dossier: Number(id)
        })
        const data = response?.data;
        return data;
    }

    const addCompte = () => {
        const newRow = {
            id: Date.now(),
            id_dossier: Number(id),
            id_compte: Number(compteId),
            compte: "",
            libelle: "",
            nature: "",
            typetier: "",

            baseaux_id: null,

            isNew: true
        };

        setPc(prev => [newRow, ...prev]);
        setRowModesModel(prev => ({
            ...prev,
            [newRow.id]: { mode: GridRowModes.Edit }
        }));
    };

    const anotherActionButton = (params) => {
        return (
            <Tooltip key='voir' title="Voir">
                <IconButton
                    size="small"
                    sx={{ color: '#00E5FF' }}
                    onClick={() => handleOpenDetails(params.row)}
                >
                    <ViewIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        )
    }

    const handleActualize = () => {
        try {
            axios.post(`/paramPlanComptable/recupPcConsolidation`, { fileId: Number(id), compteId: Number(compteId) })
                .then((response) => {
                    const listePc = response?.data?.liste;
                    setPc(listePc);
                    toast.success('Liste mis à jour avec succès')
                })
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
            toast.error(errMsg);
        }
    }

    const GetInfosIdDossier = () => {
        axios.get(`/home/FileInfos/${id}`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                const isTypeComptaAutre = resData.fileInfos[0].typecomptabilite === 'Autres';
                setConsolidation(resData.fileInfos[0].consolidation);
                setIsTypeComptaAutre(isTypeComptaAutre)
                setNoFile(false);
            } else {
                setNoFile(true);
            }
        })
    }

    //récupérer la liste des pays 
    const getListePays = async () => {
        await axios.get(`/paramCrm/getListePays/`).then((response) => {
            const resData = response.data;

            if (resData.state) {
                setListPays(resData.list);
            } else {
                setListPays([]);
            }
        });
    }

    const onSaveRow = async (row) => {
        const baseaux_id = row?.baseaux_id || 0;
        const id_numcpt = row?.id;
        let baseaux = row?.baseaux;
        if (baseaux_id !== id_numcpt) {
            const compteBaseaux = pcCollectif.find(val => val.id === baseaux_id);
            baseaux = compteBaseaux?.compte;
        }
        const response = await axios.post('/paramPlanComptable/editPc', { row: { ...row, baseaux } });
        if (response?.data?.state) {
            toast.success(response?.data?.message);
            setPc(prev => prev.map(r => r.id === row.id ? response.data.row[0] : r));
        } else {
            toast.error(response?.data?.message);
        }
    };

    const onDeleteRow = async (id_numcpt) => {
        let state = true;
        const row = pc.find(val => val.id === id_numcpt);
        if (!row.isNew) {
            await axiosPrivate.post(`/paramPlanComptable/deleteItemPc`, { listId: Number(id_numcpt), compteId, fileId: Number(id) }).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    toast.success(resData.msg);
                    state = true;
                } else {
                    toast.error(resData.msg);
                    state = false;
                }
            });
            return state;
        } else {
            toast.success('Ligne supprimé avec succès');
            return true;
        }
    }

    //Récupération des données géographiques depuis l'API existante
    const getListeProvinces = () => {
        axios.get('/paramPlanComptable/getProvinces').then((response) => {
            const provinces = response.data.map(name => ({ id: name, name: name }));
            setListProvinces(provinces);
        }).catch((error) => {
            console.error('Erreur lors du chargement des provinces:', error);
        });
    }

    const getListeRegions = (province) => {
        if (!province) {
            setListRegions([]);
            return;
        }
        axios.get(`/paramPlanComptable/getRegions/${province}`).then((response) => {
            const regions = response.data.map(name => ({ id: name, name: name }));
            setListRegions(regions);
            return regions;
        }).catch((error) => {
            console.error('Erreur lors du chargement des régions:', error);
        });
    }

    const getListeDistricts = (province, region) => {
        if (!province || !region) {
            setListDistricts([]);
            return;
        }
        axios.get(`/paramPlanComptable/getDistricts/${province}/${region}`).then((response) => {
            const districts = response.data.map(name => ({ id: name, name: name }));
            setListDistricts(districts);
            return districts;
        }).catch((error) => {
            console.error('Erreur lors du chargement des districts:', error);
        });
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    const getListeCommunes = (province, region, district) => {
        if (!province || !region || !district) {
            setListCommunes([]);
            return;
        }
        axios.get(`/paramPlanComptable/getCommunes/${province}/${region}/${district}`).then((response) => {
            const communes = response.data.map(name => ({ id: name, name: name }));
            setListCommunes(communes);
            return communes;
        }).catch((error) => {
            console.error('Erreur lors du chargement des communes:', error);
        });
    }

    useEffect(() => {
        if (canView && id && compteId) {
            showPc();
        }
    }, [id, compteId]);

    useEffect(() => {
        const navigationEntries = performance.getEntriesByType('navigation');
        let idFile = 0;

        if (navigationEntries.length > 0) {
            const navigationType = navigationEntries[0].type;
            if (navigationType === 'reload') {
                const idDossier = sessionStorage.getItem("fileId");
                idFile = idDossier;
            } else {
                sessionStorage.setItem('fileId', id);
                idFile = id;
            }
        }
        GetInfosIdDossier(idFile);
    }, []);

    useEffect(() => {
        getListePays();
        getListeProvinces();
    }, []);

    const processRowUpdateSimple = async (newRow) => {
        const updatedList = list.map(row => row.id === newRow.id ? newRow : row);
        setList(updatedList);

        return newRow;
    };

    return (
        <>
            {
                noFile ?
                    <PopupTestSelectedFile
                        confirmationState={sendToHome}
                    />
                    :
                    null
            }
            <Box sx={{ width: '100%' }}>
                <Box sx={{ px: 3, py: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end">

                        <Stack direction="row" spacing={2} width={'100%'} justifyContent={'end'} alignItems="center">
                            <Button
                                variant="contained"
                                onClick={addCompte}
                                sx={{ backgroundColor: '#0A192F', color: '#00E5FF', fontWeight: 700, borderRadius: '8px', border: '1px solid #00E5FF', fontSize: '0.8rem' }}
                            >
                                NOUVEAU COMPTE
                            </Button>
                            {
                                consolidation && (
                                    <Button
                                        variant="contained"
                                        onClick={handleActualize}
                                        sx={{ backgroundColor: '#0A192F', color: '#00E5FF', fontWeight: 700, borderRadius: '8px', border: '1px solid #00E5FF', fontSize: '0.8rem' }}
                                    >
                                        ACTUALISER
                                    </Button>
                                )
                            }

                        </Stack>
                    </Stack>
                </Box>
                <Stack sx={{ px: 3, pb: 4 }}>
                    <DatagridGlobal
                        apiRefPops={apiRef}
                        list={pc}
                        setList={setPc}
                        columnHeader={columnHeaderDetail}
                        withAddButton={false}
                        withColumnActions={true}
                        datagridHeight={'650px'}
                        executeCellEditCommit={false}
                        setFieldValueProps={processRowUpdateSimple}
                        anotherActionButton={anotherActionButton}
                        onSaveRow={onSaveRow}
                        onDeleteRow={onDeleteRow}
                        verifyCanUpdate={verifyCanUpdate}
                        rowModesModel={rowModesModel}
                        setRowModesModel={setRowModesModel}
                        id_dossier={Number(id)}
                    />
                </Stack>

                <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    PaperProps={{ sx: { width: 550, backgroundColor: 'rgba(10, 25, 47, 0.9)', color: '#FFF', borderLeft: '2px solid #00E5FF' } }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        },
                    }}
                >
                    {selectedRow && (
                        <Box sx={{ p: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6, marginTop: -1 }}>
                                <Box>
                                    <Typography variant="overline" sx={{ color: '#00E5FF', fontSize: '18px', fontWeight: 700 }}>Détails</Typography>
                                    <Stack>
                                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '14px', color: '#94A3B8' }}>{selectedRow.libelle}</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '18px', color: '#94A3B8' }}>{selectedRow.compte}</Typography>
                                    </Stack>
                                </Box>
                                <Stack
                                    sx={{
                                        position: 'absolute',
                                        top: 15,
                                        right: 15
                                    }}
                                >
                                    <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#FFF', bgcolor: 'rgba(255,255,255,0.05)' }}><CloseIcon /></IconButton>
                                </Stack>
                            </Stack>

                            <Fade in={drawerOpen}>
                                <Stack spacing={2} sx={{ marginTop: -3 }}>
                                    <Formik
                                        initialValues={initialValues}
                                        enableReinitialize
                                        validateOnBlur={false}
                                        onSubmit={(values) => {
                                            savePopupRows(values);
                                        }}
                                    >
                                        {({ values, handleSubmit, setFieldValue }) => {
                                            useEffect(() => {
                                                setFieldValue("itemId", Number(selectedRow.id));
                                                setFieldValue("idCompte", Number(compteId));
                                                setFieldValue("idDossier", Number(id));
                                                setFieldValue("compte", selectedRow.compte || "");
                                                setFieldValue("libelle", selectedRow.libelle || "");
                                                setFieldValue("nature", selectedRow.nature || "");

                                                setFieldValue("nif", selectedRow.nif || "");
                                                setFieldValue("statistique", selectedRow.statistique || "");
                                                setFieldValue("adresse", selectedRow.adresse || "");
                                                setFieldValue("motcle", selectedRow.motcle || "");
                                                setFieldValue("cin", selectedRow.cin || "");
                                                setFieldValue("datecin", selectedRow.datecin ? format(selectedRow?.datecin, 'yyyy-MM-dd') : null);
                                                setFieldValue("autrepieceid", selectedRow.autrepieceid || "");
                                                setFieldValue("refpieceid", selectedRow.refpieceid || "");
                                                setFieldValue("adressesansnif", selectedRow.adressesansnif || "");
                                                setFieldValue("nifrepresentant", selectedRow.nifrepresentant || "");
                                                setFieldValue("adresseetranger", selectedRow.adresseetranger || "");
                                                setFieldValue("pays", selectedRow.pays || "");

                                                setFieldValue("province", selectedRow.province || "");
                                                setFieldValue("region", selectedRow.region || "");
                                                setFieldValue("district", selectedRow.district || "");
                                                setFieldValue("commune", selectedRow.commune || "");

                                                setFieldValue("compteautre", selectedRow?.compteautre || "");
                                                setFieldValue("libelleautre", selectedRow?.libelleautre || "");

                                            }, [selectedRow]);

                                            useEffect(() => {
                                                if (values.province) {
                                                    getListeRegions(values.province);
                                                } else {
                                                    setListRegions([]);
                                                    setListDistricts([]);
                                                    setListCommunes([]);
                                                }
                                            }, [values.province]);

                                            useEffect(() => {
                                                if (values.province && values.region) {
                                                    getListeDistricts(values.province, values.region);
                                                }
                                            }, [values.province, values.region]);

                                            useEffect(() => {
                                                if (values.province && values.region && values.district) {
                                                    getListeCommunes(values.province, values.region, values.district);
                                                }
                                            }, [values.province, values.region, values.district]);

                                            return (
                                                <>
                                                    {
                                                        selectedRow?.nature === 'Aux' && (
                                                            <>
                                                                {
                                                                    selectedRow?.typetier === 'general' ?
                                                                        (
                                                                            null
                                                                        )
                                                                        : selectedRow?.typetier === 'avec-nif' ?
                                                                            (
                                                                                <Stack direction={'column'} spacing={2}>
                                                                                    <Stack
                                                                                        direction="row"
                                                                                        alignItems="center"
                                                                                        spacing={2}
                                                                                        width="100%"
                                                                                    >
                                                                                        <Box flex={1}>
                                                                                            <FormikTextField
                                                                                                name="nif"
                                                                                                label="NIF"
                                                                                                width="100%"
                                                                                                backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                                color={'white'}
                                                                                                border={'1px solid rgba(255,255,255,0.08)'}
                                                                                                labelColor={'white'}
                                                                                            />
                                                                                        </Box>
                                                                                        <Box flex={1}>
                                                                                            <FormikTextField
                                                                                                name="statistique"
                                                                                                label="Numéro statistique"
                                                                                                width="100%"
                                                                                                backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                                color={'white'}
                                                                                                border={'1px solid rgba(255,255,255,0.08)'}
                                                                                                labelColor={'white'}
                                                                                            />
                                                                                        </Box>
                                                                                    </Stack>
                                                                                    <FormikTextField
                                                                                        name="adresse"
                                                                                        label="Adresse"
                                                                                        width="100%"
                                                                                        backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                        color={'white'}
                                                                                        border={'1px solid rgba(255,255,255,0.08)'}
                                                                                        labelColor={'white'}
                                                                                    />
                                                                                </Stack>
                                                                            )
                                                                            : selectedRow?.typetier === 'sans-nif' ?
                                                                                (
                                                                                    <Stack direction={'column'} spacing={2} width={'100%'}>
                                                                                        <Stack
                                                                                            direction="row"
                                                                                            alignItems="center"
                                                                                            spacing={2}
                                                                                            width="100%"
                                                                                        >
                                                                                            <Box flex={1}>
                                                                                                <FormikTextField
                                                                                                    name="cin"
                                                                                                    label="CIN"
                                                                                                    width="100%"
                                                                                                    backgroundColor="rgba(255,255,255,0.03)"
                                                                                                    color="white"
                                                                                                    border="1px solid rgba(255,255,255,0.08)"
                                                                                                    labelColor="white"
                                                                                                />
                                                                                            </Box>

                                                                                            <Box flex={1}>
                                                                                                <FormikDateField
                                                                                                    name="datecin"
                                                                                                    label="Date CIN"
                                                                                                    width="100%"
                                                                                                    backgroundColor="rgba(255,255,255,0.03)"
                                                                                                    color="white"
                                                                                                    border="1px solid rgba(255,255,255,0.08)"
                                                                                                />
                                                                                            </Box>
                                                                                        </Stack>
                                                                                        <Stack
                                                                                            direction="row"
                                                                                            alignItems="center"
                                                                                            spacing={2}
                                                                                            width="100%"
                                                                                        >
                                                                                            <Box flex={1}>
                                                                                                <FormikTextField
                                                                                                    name="autrepieceid"
                                                                                                    label="Autres pièces d'identité"
                                                                                                    width="100%"
                                                                                                    backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                                    color={'white'}
                                                                                                    border={'1px solid rgba(255,255,255,0.08)'}
                                                                                                    labelColor={'white'}
                                                                                                />
                                                                                            </Box>
                                                                                            <Box flex={1}>
                                                                                                <FormikTextField
                                                                                                    name="refpieceid"
                                                                                                    label="Référence piéce d'identité"
                                                                                                    width="100%"
                                                                                                    backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                                    color={'white'}
                                                                                                    border={'1px solid rgba(255,255,255,0.08)'}
                                                                                                    labelColor={'white'}
                                                                                                />
                                                                                            </Box>
                                                                                        </Stack>
                                                                                        <FormikTextField
                                                                                            name="adressesansnif"
                                                                                            label="Adresse"
                                                                                            width="100%"
                                                                                            backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                            color={'white'}
                                                                                            border={'1px solid rgba(255,255,255,0.08)'}
                                                                                            labelColor={'white'}
                                                                                        />
                                                                                    </Stack>
                                                                                )
                                                                                :
                                                                                (
                                                                                    <Stack direction={'column'} spacing={2}>
                                                                                        <FormikTextField
                                                                                            name="nifrepresentant"
                                                                                            label="Nif du représentant"
                                                                                            width="48%"
                                                                                            backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                            color={'white'}
                                                                                            border={'1px solid rgba(255,255,255,0.08)'}
                                                                                            labelColor={'white'}
                                                                                        />
                                                                                        <Stack
                                                                                            direction="row"
                                                                                            alignItems="center"
                                                                                            spacing={2}
                                                                                            width="100%"
                                                                                        >
                                                                                            <Box flex={1}>
                                                                                                <FormikTextField
                                                                                                    name="adresseetranger"
                                                                                                    label="Adresse"
                                                                                                    width="100%"
                                                                                                    backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                                    color={'white'}
                                                                                                    border={'1px solid rgba(255,255,255,0.08)'}
                                                                                                    labelColor={'white'}
                                                                                                />
                                                                                            </Box>
                                                                                            <Box flex={1}>
                                                                                                <FormikAutocomplete
                                                                                                    name='pays'
                                                                                                    label="Pays"
                                                                                                    type="select"
                                                                                                    width="100%"
                                                                                                    options={listPays.map(item => ({
                                                                                                        value: item.code,
                                                                                                        label: item.nompays
                                                                                                    }))}
                                                                                                    values={values}
                                                                                                    setFieldValue={setFieldValue}
                                                                                                    backgroundColor={'rgba(255,255,255,0.03)'}
                                                                                                    color={'white'}
                                                                                                    border={'1px solid rgba(255,255,255,0.08)'}
                                                                                                    labelColor={'white'}
                                                                                                    listColor={'rgba(10, 25, 47)'}
                                                                                                    listeTextColor={'white'}
                                                                                                />
                                                                                            </Box>
                                                                                        </Stack>
                                                                                    </Stack>
                                                                                )
                                                                }
                                                            </>
                                                        )
                                                    }
                                                    {
                                                        (selectedRow?.typetier === 'avec-nif' || selectedRow?.typetier === 'sans-nif') && (
                                                            <>
                                                                <Stack
                                                                    direction="row"
                                                                    alignItems="center"
                                                                    spacing={2}
                                                                    width="100%"
                                                                >
                                                                    <Box flex={1}>
                                                                        <FormikAutocomplete
                                                                            name='province'
                                                                            label="Province"
                                                                            type="select"
                                                                            width="100%"
                                                                            options={listProvinces.map(item => ({
                                                                                value: item.name,
                                                                                label: item.name
                                                                            }))}
                                                                            values={values}
                                                                            setFieldValue={(name, value) => {
                                                                                setFieldValue(name, value);
                                                                                setFieldValue('region', '');
                                                                                setFieldValue('district', '');
                                                                                setFieldValue('commune', '');
                                                                                getListeRegions(value);
                                                                            }}
                                                                            backgroundColor={'rgba(255,255,255,0.03)'}
                                                                            color={'white'}
                                                                            border={'1px solid rgba(255,255,255,0.08)'}
                                                                            labelColor={'white'}
                                                                            listColor={'rgba(10, 25, 47)'}
                                                                            listeTextColor={'white'}
                                                                        />
                                                                    </Box>
                                                                    <Box flex={1}>
                                                                        <FormikAutocomplete
                                                                            name='region'
                                                                            label="Region"
                                                                            type="select"
                                                                            width="100%"
                                                                            options={listRegions.length > 0 ? listRegions.map(item => ({
                                                                                value: item.name,
                                                                                label: item.name
                                                                            })) : []}
                                                                            values={values}
                                                                            setFieldValue={(name, value) => {
                                                                                const province = values.province;
                                                                                setFieldValue(name, value);
                                                                                setFieldValue('district', '');
                                                                                setFieldValue('commune', '');
                                                                                getListeDistricts(province, value);
                                                                            }}
                                                                            backgroundColor={'rgba(255,255,255,0.03)'}
                                                                            color={'white'}
                                                                            border={'1px solid rgba(255,255,255,0.08)'}
                                                                            labelColor={'white'}
                                                                            listColor={'rgba(10, 25, 47)'}
                                                                            listeTextColor={'white'}
                                                                        />
                                                                    </Box>
                                                                </Stack>

                                                                <Stack
                                                                    direction="row"
                                                                    alignItems="center"
                                                                    spacing={2}
                                                                    width="100%"
                                                                >
                                                                    <Box flex={1}>
                                                                        <FormikAutocomplete
                                                                            name='district'
                                                                            label="District"
                                                                            type="select"
                                                                            width="100%"
                                                                            options={listDistricts.map(item => ({
                                                                                value: item.name,
                                                                                label: item.name
                                                                            }))}
                                                                            values={values}
                                                                            setFieldValue={(name, value) => {
                                                                                const province = values.province;
                                                                                const region = values.region;
                                                                                setFieldValue(name, value);
                                                                                setFieldValue('commune', '');
                                                                                getListeCommunes(province, region, value);
                                                                            }}
                                                                            backgroundColor={'rgba(255,255,255,0.03)'}
                                                                            color={'white'}
                                                                            border={'1px solid rgba(255,255,255,0.08)'}
                                                                            labelColor={'white'}
                                                                            listColor={'rgba(10, 25, 47)'}
                                                                            listeTextColor={'white'}
                                                                        />
                                                                    </Box>
                                                                    <Box flex={1}>
                                                                        <FormikAutocomplete
                                                                            name='commune'
                                                                            label="Commune"
                                                                            type="select"
                                                                            width="100%"
                                                                            options={listCommunes.map(item => ({
                                                                                value: item.name,
                                                                                label: item.name
                                                                            }))}
                                                                            values={values}
                                                                            setFieldValue={setFieldValue}
                                                                            backgroundColor={'rgba(255,255,255,0.03)'}
                                                                            color={'white'}
                                                                            border={'1px solid rgba(255,255,255,0.08)'}
                                                                            labelColor={'white'}
                                                                            listColor={'rgba(10, 25, 47)'}
                                                                            listeTextColor={'white'}
                                                                        />
                                                                    </Box>
                                                                </Stack>
                                                            </>
                                                        )
                                                    }
                                                    {
                                                        isTypeComptaAutre && (
                                                            <Stack
                                                                direction="row"
                                                                alignItems="center"
                                                                spacing={2}
                                                                width="100%"
                                                            >
                                                                <Box flex={1}>
                                                                    <FormikTextField
                                                                        name="compteautre"
                                                                        label="Compte autre"
                                                                        width="100%"
                                                                        backgroundColor="rgba(255,255,255,0.03)"
                                                                        color="white"
                                                                        border="1px solid rgba(255,255,255,0.08)"
                                                                        labelColor="white"
                                                                    />
                                                                </Box>

                                                                <Box flex={1}>
                                                                    <FormikTextField
                                                                        name="libelleautre"
                                                                        label="Libellé autre"
                                                                        width="100%"
                                                                        backgroundColor="rgba(255,255,255,0.03)"
                                                                        color="white"
                                                                        border="1px solid rgba(255,255,255,0.08)"
                                                                        labelColor="white"
                                                                    />
                                                                </Box>
                                                            </Stack>
                                                        )
                                                    }
                                                    <FormikTextField
                                                        name="motcle"
                                                        label="Mot clé"
                                                        width="100%"
                                                        backgroundColor={'rgba(255,255,255,0.03)'}
                                                        color={'white'}
                                                        border={'1px solid rgba(255,255,255,0.08)'}
                                                        labelColor={'white'}
                                                    />
                                                    <Stack
                                                        position="sticky"
                                                        bottom={20}
                                                    >
                                                        <Button
                                                            variant="contained"
                                                            fullWidth
                                                            startIcon={<EditIcon />}
                                                            onClick={handleSubmit}
                                                            sx={{
                                                                backgroundColor: '#00E5FF',
                                                                color: '#0A192F',
                                                                fontWeight: 800,
                                                                mt: 2,
                                                                borderRadius: '8px',
                                                                '&.Mui-disabled': {
                                                                    backgroundColor: '#00E5FF',
                                                                    color: '#0A192F',
                                                                    opacity: 0.6,
                                                                }
                                                            }}
                                                            disabled={selectedRow?.id_dossier !== id}
                                                        >
                                                            MODIFIER LE COMPTE
                                                        </Button>
                                                    </Stack>
                                                </>
                                            )
                                        }}
                                    </Formik>
                                </Stack>
                            </Fade>
                        </Box>
                    )}
                </Drawer>
            </Box >
        </>
    );
};

export default PlanComptablePage;