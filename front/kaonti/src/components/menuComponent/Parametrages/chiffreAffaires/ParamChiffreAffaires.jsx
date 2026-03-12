import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Stack, IconButton, FormControl, InputLabel, Select, MenuItem, Input, FormHelperText } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Tooltip from '@mui/material/Tooltip';
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";
import { TfiSave } from "react-icons/tfi";
import { IoMdTrash } from "react-icons/io";
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { init } from '../../../../../init';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import useAuth from '../../../../hooks/useAuth';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import * as Yup from "yup";
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { jwtDecode } from "jwt-decode";

import { useFormik, Field, Formik, Form, ErrorMessage } from 'formik';
import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

export default function ParamChiffreAffairesComponent() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const apiRef = useGridApiRef();
    const axiosPrivate = useAxiosPrivate();

    const initial = init[0];
    const { id } = useParams();
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);
    const [listeCodeTva, setListeCodeTva] = useState([]);
    const [listeCodeTvaUnfiltered, setListeCodeTvaUnfiltered] = useState([]);
    const [selectedRow, setSelectedRow] = useState([]); // tableau d'ids
    const [selectedRowId, setSelectedRowId] = useState([]); // idem
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);
    const [editableRow, setEditableRow] = useState(true);
    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const [pc, setPc] = useState([]);
    const [paramTva, setParamTva] = useState([]);
    const [compteValidationColor, setCompteValidationColor] = useState('transparent');
    const [codeValidationColor, setCodeValidationColor] = useState('transparent');

    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded?.UserInfo?.compteId || null;
    const userId = decoded?.UserInfo?.userId || null;
    const navigate = useNavigate();

    const formikNewParamTva = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            idCode: 0,
            compte: '',
            libelle: '',
            code: '',
            codedescription: ''
        },
        validationSchema: Yup.object({
            compte: Yup.string().required("Veuillez ajouter un compte de tva"),
            code: Yup.string().required("Veuillez ajouter un code de Tva"),
        }),
        validateOnChange: false,
        validateOnBlur: true,
    });

    // --- dossier info init (inchangé)
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
    }, [id]);

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
        }).catch(err => {
            console.error(err);
            setNoFile(true);
        });
    }

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    const GetListeCodeTva = () => {
        axios.get(`/paramTva/listeCodeTva`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const all = Array.isArray(resData.list) ? resData.list : [];
                const onlyCode1 = all.filter(row => String(row.code || '').startsWith('1'));
                setListeCodeTva(onlyCode1);
                setListeCodeTvaUnfiltered(onlyCode1);
            } else {
                setListeCodeTva([]);
                setListeCodeTvaUnfiltered([]);
                toast.error(resData.msg);
            }
        }).catch(err => {
            console.error(err);
            setListeCodeTva([]);
            setListeCodeTvaUnfiltered([]);
        });
    }

    const recupPc = () => {
        axios.post(`/paramPlanComptable/pc`, { fileId: Number(fileId), compteId: Number(compteId) }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const pcToFilter = resData.liste || [];
                const filteredPc = pcToFilter.filter((row) => String(row.compte || '').startsWith('7'));
                const uniquePc = Array.from(new Map((filteredPc || []).map(r => [r.id, r])).values());
                setPc(uniquePc);
            } else {
                toast.error(resData.msg);
            }
        }).catch((error) => {
            console.error('Erreur PC:', error);
        })
    }

    const getListeParamTva = () => {
        axios.get(`/paramTva/listeParamTva/${fileId}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setParamTva(resData.list || []);
            } else {
                setParamTva([]);
                toast.error(resData.msg);
            }
        }).catch(err => {
            console.error(err);
        });
    }

    useEffect(() => {
        if (fileId && compteId) {
            recupPc();
            GetListeCodeTva();
            getListeParamTva();
        }
    }, [fileId, compteId]);

    const handleChangeCompte = (value) => {
        const infosCompte = pc?.filter((row) => row.id === value) || [];
        const first = infosCompte[0];
        if (!first) return;

        formikNewParamTva.setFieldValue('compte', first.id);
        if (String(first.compte).startsWith('4456')) {
            const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'DED');
            setListeCodeTva(filteredCode);
        } else if (String(first.compte).startsWith('4457')) {
            const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'COLL');
            setListeCodeTva(filteredCode);
        } else {
            GetListeCodeTva();
        }
        formikNewParamTva.setFieldValue('libelle', first.libelle || '');
    }

    const handleChangeCodeTva = (value) => {
        const infosCode = listeCodeTva?.filter((row) => row.id === value) || [];
        const infosInit = infosCode[0];
        formikNewParamTva.setFieldValue('code', value);
        formikNewParamTva.setFieldValue('codedescription', infosInit?.libelle || '');
    };

    // --- Columns : j'utilise valueGetter pour champs imbriqués
    const paramTvaColumnHeader = [
        {
            field: 'compte_display',
            headerName: 'Compte',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            type: 'singleSelect',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueGetter: (params) => params.row?.['dossierplancomptable.compte'] || '',
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel id="select-compte-label"><em>Choisir...</em></InputLabel>
                        <Select
                            labelId="select-compte-label"
                            style={{ backgroundColor: compteValidationColor }}
                            value={formikNewParamTva.values.compte}
                            onChange={(e) => handleChangeCompte(e.target.value)}
                            label="Type"
                            MenuProps={{
                                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                transformOrigin: { vertical: 'top', horizontal: 'left' },
                                PaperProps: { sx: { maxHeight: 300 } },
                            }}
                        >
                            {Array.from(new Map((pc || []).map(o => [`${o.compte}||${o.libelle}`, o])).values()).map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.compte} - {option.libelle}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewParamTva.errors.compte && formikNewParamTva.touched.compte && formikNewParamTva.errors.compte}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 2.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueGetter: (params) => params.row?.['dossierplancomptable.libelle'] || formikNewParamTva.values.libelle,
            renderEditCell: (params) => (
                <FormControl fullWidth style={{ height: '100%' }}>
                    <Input
                        style={{ height: '100%', alignItems: 'center', outline: 'none', backgroundColor: 'transparent' }}
                        type="text"
                        value={formikNewParamTva.values.libelle}
                        disableUnderline={true}
                    />
                </FormControl>
            ),
        },
        {
            field: 'code_display',
            headerName: 'Code tva',
            sortable: true,
            flex: 0.5,
            headerAlign: 'left',
            align: 'left',
            type: 'singleSelect',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueGetter: (params) => params.row?.['listecodetva.code'] || '',
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel id="select-code-tva-label"><em>Choisir...</em></InputLabel>
                        <Select
                            labelId="select-code-tva-label"
                            style={{ backgroundColor: codeValidationColor }}
                            value={formikNewParamTva.values.code}
                            onChange={(e) => handleChangeCodeTva(e.target.value)}
                            label="Type"
                            MenuProps={{
                                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                                transformOrigin: { vertical: 'top', horizontal: 'left' },
                                PaperProps: { sx: { maxHeight: 300 } },
                            }}
                        >
                            {listeCodeTva?.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.code} - {option.libelle}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {formikNewParamTva.errors.code && formikNewParamTva.touched.code && formikNewParamTva.errors.code}
                        </FormHelperText>
                    </FormControl>
                );
            },
            renderCell: (params) => {
                const val = params.value || '';
                const startsWith2 = typeof val === 'string' && val.startsWith('2');
                const bg = startsWith2 ? '#FFA62F' : '#3D5300';
                return (
                    <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: 90,
                            height: 25,
                            backgroundColor: bg,
                            borderRadius: 15,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white'
                        }}>
                            {val}
                        </div>
                    </Stack>
                );
            }
        },
        {
            field: 'codedescription',
            headerName: 'Déscription',
            type: 'string',
            sortable: true,
            flex: 2.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueGetter: (params) => params.row?.['listecodetva.libelle'] || formikNewParamTva.values.codedescription,
            renderEditCell: (params) => (
                <FormControl fullWidth style={{ height: '100%' }}>
                    <Input
                        style={{ height: '100%', alignItems: 'center', outline: 'none', backgroundColor: 'transparent' }}
                        type="text"
                        value={formikNewParamTva.values.codedescription}
                        disableUnderline={true}
                    />
                </FormControl>
            ),
        },
    ];

    // --- gestion selection & boutons
    const saveSelectedRow = (ids) => {
        setSelectedRowId(ids);
        if (ids.length === 1) {
            setDisableModifyBouton(false);
            setDisableSaveBouton(true);
            setDisableCancelBouton(false);
            setDisableDeleteBouton(false);
        } else {
            setDisableModifyBouton(true);
            setDisableSaveBouton(false);
            setDisableCancelBouton(true);
            setDisableDeleteBouton(true);
        }
    }

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (ids) => () => {
        if (!Array.isArray(ids) || ids.length !== 1) {
            toast.error("Sélectionnez une seule ligne à modifier");
            return;
        }
        const id = ids[0];
        // charger les données de la ligne
        const selectedRowInfos = paramTva?.find((item) => item.id === id);
        if (!selectedRowInfos) return;

        const compte = selectedRowInfos['dossierplancomptable.compte'];
        const libelle = selectedRowInfos['dossierplancomptable.libelle'];
        const description = selectedRowInfos['listecodetva.libelle'];

        if (compte?.startsWith('7')) {
            const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'DED');
            setListeCodeTva(filteredCode);
        } else if (compte?.startsWith('4457')) {
            const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'COLL');
            setListeCodeTva(filteredCode);
        } else {
            GetListeCodeTva();
        }

        formikNewParamTva.setFieldValue("idCode", id);
        formikNewParamTva.setFieldValue("idDossier", fileId);
        formikNewParamTva.setFieldValue("idCompte", compteId);
        formikNewParamTva.setFieldValue("compte", selectedRowInfos.id_cptcompta);
        formikNewParamTva.setFieldValue("libelle", libelle);
        formikNewParamTva.setFieldValue("code", selectedRowInfos.type);
        formikNewParamTva.setFieldValue("codedescription", description);

        setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (ids) => () => {
        if (!Array.isArray(ids) || ids.length !== 1) {
            toast.error("Sélectionnez une seule ligne à sauvegarder");
            return;
        }
        const id = ids[0];
        let saveBoolCompte = !!formikNewParamTva.values.compte;
        let saveBoolCode = !!formikNewParamTva.values.code;

        setCompteValidationColor(saveBoolCompte ? 'transparent' : '#F6D6D6');
        setCodeValidationColor(saveBoolCode ? 'transparent' : '#F6D6D6');

        if (saveBoolCode && saveBoolCompte) {
            setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.View } }));
            axiosPrivate.post(`/paramTva/paramTvaAdd`, formikNewParamTva.values).then((response) => {
                const resData = response.data;
                if (resData.state) {
                    setDisableAddRowBouton(false);
                    setDisableSaveBouton(true);
                    setDisableCancelBouton(true);
                    formikNewParamTva.resetForm();
                    getListeParamTva();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            }).catch(err => {
                console.error(err);
                toast.error("Erreur réseau lors de la sauvegarde");
            });
        } else {
            toast.error('Les champs en surbrillance sont obligatoires');
        }
    };

    const handleOpenDialogConfirmDeleteAssocieRow = () => {
        setOpenDialogDeleteRow(true);
    }

    const deleteRow = (value) => {
        if (value === true) {
            if (selectedRowId.length === 1) {
                const idToDelete = selectedRowId[0];
                if (idToDelete < 0) {
                    setOpenDialogDeleteRow(false);
                    setParamTva(paramTva.filter((row) => row.id !== idToDelete));
                    return;
                }
                axiosPrivate.post(`/paramTva/paramTvaDelete`, { fileId, compteId, idToDelete }).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        setDisableAddRowBouton(false);
                        setOpenDialogDeleteRow(false);
                        setParamTva(paramTva.filter((row) => row.id !== idToDelete));
                        toast.success(resData.msg);
                    } else {
                        setOpenDialogDeleteRow(false);
                        toast.error(resData.msg);
                    }
                }).catch(err => {
                    console.error(err);
                    setOpenDialogDeleteRow(false);
                });
            } else {
                toast.error("Sélectionnez une seule ligne à supprimer");
            }
            setOpenDialogDeleteRow(false);
        } else {
            setOpenDialogDeleteRow(false);
        }
    }

    const handleCancelClick = (ids) => () => {
        if (!Array.isArray(ids) || ids.length !== 1) return;
        const id = ids[0];
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBouton(false);
        setDisableSaveBouton(true);
        setDisableDeleteBouton(true);
        setDisableModifyBouton(true);
        setDisableCancelBouton(true);
        setSelectedRow([]);
        setSelectedRowId([]);
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setParamTva(paramTva.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
        setDisableAddRowBouton(false);
    };

    const handleCellEditCommit = (params) => {
        if (selectedRowId.length !== 1) {
            setEditableRow(false);
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
            setDisableCancelBouton(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
            return;
        }
        // si la cellule commit concerne la ligne sélectionnée, autoriser édition
        if (!selectedRowId.includes(params.id)) {
            setEditableRow(false);
            toast.error("Sélectionnez une ligne pour pouvoir la modifier");
        } else {
            setEditableRow(true);
            setDisableModifyBouton(false);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
        }
    };

    const handleOpenDialogAddNewAssocie = () => {
        setDisableModifyBouton(false);
        setDisableCancelBouton(false);
        setDisableDeleteBouton(false);

        const newId = -Date.now();
        formikNewParamTva.setFieldValue("idDossier", fileId);
        const newRow = { id: newId, compte: '', code: '', libelle: '' };
        setParamTva(prev => [...prev, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRow([newRow.id]);
        setDisableAddRowBouton(true);
    }

    const getMaxID = (data) => {
        const Ids = data.map(item => item.id);
        return Math.max(...Ids);
    };

    const displayRows = React.useMemo(() => {
        if (!Array.isArray(paramTva)) return [];
        return paramTva.filter(row => {
            const isNew = Number(row?.id) < 0;
            if (isNew) return true;
            const compte = String(row?.['dossierplancomptable.compte'] || '');
            const code = String(row?.['listecodetva.code'] || '');
            return compte.startsWith('7') && code.startsWith('1');
        });
    }, [paramTva]);

    const deselectRow = (ids) => {
        const deselected = selectedRowId.filter(id => !ids.includes(id));
        const updatedRowModes = { ...rowModesModel };
        deselected.forEach((id) => {
            updatedRowModes[id] = { mode: GridRowModes.View, ignoreModifications: true };
        });
        setRowModesModel(updatedRowModes);
        setDisableAddRowBouton(false);
        setSelectedRowId(ids);
    }

    const handleCellKeyDown = (params, event) => {
        const api = apiRef.current;

        const allCols = api.getAllColumns().filter(c => c.editable);
        const sortedRowIds = api.getSortedRowIds();
        const currentColIndex = allCols.findIndex(c => c.field === params.field);
        const currentRowIndex = sortedRowIds.indexOf(params.id);

        let nextColIndex = currentColIndex;
        let nextRowIndex = currentRowIndex;

        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            nextColIndex = currentColIndex + 1;
            if (nextColIndex >= allCols.length) {
                nextColIndex = 0;
                nextRowIndex = currentRowIndex + 1;
            }
        } else if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();
            nextColIndex = currentColIndex - 1;
            if (nextColIndex < 0) {
                nextColIndex = allCols.length - 1;
                nextRowIndex = currentRowIndex - 1;
            }
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextColIndex = currentColIndex + 1;
            if (nextColIndex >= allCols.length) nextColIndex = allCols.length - 1;
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            nextColIndex = currentColIndex - 1;
            if (nextColIndex < 0) nextColIndex = 0;
        }

        const nextRowId = sortedRowIds[nextRowIndex];
        const targetCol = allCols[nextColIndex];

        if (!nextRowId || !targetCol) return;

        try {
            api.stopCellEditMode({ id: params.id, field: params.field });
        } catch (err) {
            console.warn('Erreur stopCellEditMode ignorée:', err);
        }

        setTimeout(() => {
            const cellInput = document.querySelector(
                `[data-id="${nextRowId}"] [data-field="${targetCol.field}"] input, 
             [data-id="${nextRowId}"] [data-field="${targetCol.field}"] textarea`
            );
            if (cellInput) cellInput.focus();
        }, 50);
    };

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
                (openDialogDeleteRow && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer le code journal sélectionné ?"}
                        confirmationState={deleteRow}
                    />
                    :
                    null
            }
            <Box>

                <TabContext value={"1"}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList aria-label="lab API tabs example">
                            <Tab label={InfoFileStyle(fileInfos?.dossier)} value="1" style={{ textTransform: 'none', outline: 'none', border: 'none', margin: -5 }} />
                        </TabList>
                    </Box>
                    <TabPanel value="1">
                        <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages : Chiffre d'affaires</Typography>

                        <Stack width={"100%"} spacing={1} alignItems={"center"} direction={"column"} style={{ marginTop: "20px" }}>

                            <Stack width={"100%"} spacing={0.5} direction={"row"} justifyContent={"right"}>
                                <Tooltip title="Ajouter une ligne">
                                    <IconButton disabled={!canAdd || disableAddRowBouton} onClick={handleOpenDialogAddNewAssocie} style={{ width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.theme }}>
                                        <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Modifier la ligne sélectionnée">
                                    <IconButton disabled={(!canModify && selectedRowId > 0) || disableModifyBouton} onClick={handleEditClick(selectedRowId)} style={{ width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.theme }}>
                                        <FaRegPenToSquare style={{ width: '25px', height: '25px', color: 'white' }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Sauvegarder les modifications">
                                    <span>
                                        <IconButton disabled={(!canAdd && !canModify) || disableSaveBouton} onClick={handleSaveClick(selectedRowId)} style={{ width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.theme }}>
                                            <TfiSave style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Annuler les modifications">
                                    <span>
                                        <IconButton disabled={disableCancelBouton} onClick={handleCancelClick(selectedRowId)} style={{ width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.button_delete_color }}>
                                            <VscClose style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Supprimer la ligne sélectionné">
                                    <span>
                                        <IconButton disabled={!canDelete || disableDeleteBouton} onClick={handleOpenDialogConfirmDeleteAssocieRow} style={{ width: "35px", height: '35px', borderRadius: "2px", backgroundColor: initial.button_delete_color }}>
                                            <IoMdTrash style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>

                            <Stack width={"100%"} minHeight={'600px'}>
                                <DataGrid
                                    apiRef={apiRef}
                                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                                    disableRowSelectionOnClick
                                    disableSelectionOnClick={true}
                                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                                    slots={{ toolbar: QuickFilter }}
                                    sx={DataGridStyle.sx}
                                    rowHeight={DataGridStyle.rowHeight}
                                    columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                    editMode='row'
                                    columns={paramTvaColumnHeader}
                                    rows={canView ? displayRows : []}
                                    onRowClick={(e) => handleCellEditCommit({ id: e.row.id })}

                                    onRowSelectionModelChange={ids => {
                                        const single = Array.isArray(ids) && ids.length ? [ids[ids.length - 1]] : [];
                                        setSelectedRow(single);
                                        saveSelectedRow(single);
                                        deselectRow(single);
                                    }}
                                    rowModesModel={rowModesModel}
                                    onRowModesModelChange={handleRowModesModelChange}
                                    onRowEditStop={handleRowEditStop}
                                    processRowUpdate={processRowUpdate}
                                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                                    experimentalFeatures={{ newEditingApi: true }}
                                    pageSizeOptions={[50, 100]}
                                    pagination={DataGridStyle.pagination}
                                    checkboxSelection={DataGridStyle.checkboxSelection}
                                    columnVisibilityModel={{ id: false }}
                                    rowSelectionModel={selectedRow}
                                    onRowEditStart={(params, event) => {
                                        const rowId = params.id;
                                        const rowData = params.row;

                                        const isNewRow = rowId < 0;

                                        if (!canModify && !isNewRow) {
                                            event.defaultMuiPrevented = true;
                                            return;
                                        }

                                        event.stopPropagation();

                                        const compte = rowData['dossierplancomptable.compte'];
                                        const libelle = rowData['dossierplancomptable.libelle'];
                                        const description = rowData['listecodetva.libelle'];

                                        if (compte?.startsWith('7')) {
                                            const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'CA');
                                            setListeCodeTva(filteredCode);
                                        } else if (compte?.startsWith('4457')) {
                                            const filteredCode = listeCodeTvaUnfiltered?.filter((row) => row.nature === 'COLL');
                                            setListeCodeTva(filteredCode);
                                        } else {
                                            GetListeCodeTva();
                                        }

                                        formikNewParamTva.setFieldValue("idCode", rowId);
                                        formikNewParamTva.setFieldValue("idDossier", fileId);
                                        formikNewParamTva.setFieldValue("idCompte", compteId);
                                        formikNewParamTva.setFieldValue("compte", rowData.id_cptcompta);
                                        formikNewParamTva.setFieldValue("libelle", libelle);
                                        formikNewParamTva.setFieldValue("code", rowData.type);
                                        formikNewParamTva.setFieldValue("codedescription", description);

                                        setRowModesModel((oldModel) => ({
                                            ...oldModel,
                                            [rowId]: { mode: GridRowModes.Edit },
                                        }));

                                        setDisableSaveBouton(false);
                                    }}
                                    onCellKeyDown={handleCellKeyDown}
                                />
                            </Stack>
                        </Stack>
                    </TabPanel>
                </TabContext>
            </Box>
        </>
    );
}
