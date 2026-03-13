import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack, Paper, IconButton, FormControl, InputLabel, Select, MenuItem, Input, FormHelperText } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { InfoFileStyle } from '../../../componentsTools/InfosFileStyle';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";
import { TfiSave } from "react-icons/tfi";
import PopupConfirmDelete from '../../../componentsTools/popupConfirmDelete';
import PopupTestSelectedFile from '../../../componentsTools/popupTestSelectedFile';
import { init } from '../../../../../init';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import useAuth from '../../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from "yup";
import usePermission from '../../../../hooks/usePermission';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

export default function ParamTVAComponent() {
    const { canAdd, canModify, canDelete, canView } = usePermission();
    const apiRef = useGridApiRef();

    const axiosPrivate = useAxiosPrivate();

    const initial = init[0];
    //récupération information du dossier sélectionné
    const { id } = useParams();
    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);
    const [listeCodeJournaux, setListeCodeJournaux] = useState([]);
    const [listeCodeTva, setListeCodeTva] = useState([]);
    const [listeCodeTvaUnfiltered, setListeCodeTvaUnfiltered] = useState([]);

    const [selectedRow, setSelectedRow] = useState([]);

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);

    const [editableRow, setEditableRow] = useState(true);
    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const [listeCptAssocie, setListeCptAssocie] = useState([]);
    const [pc, setPc] = useState([]);
    const [paramTva, setParamTva] = useState([]);
    const [compteValidationColor, setCompteValidationColor] = useState('transparent');
    const [codeValidationColor, setCodeValidationColor] = useState('transparent');

    //récupération infos de connexion
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;
    const navigate = useNavigate();

    //sauvegarde de la nouvelle ligne ajoutée
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

    const sendToHome = (value) => {
        setNoFile(!value);
        navigate('/tab/home');
    }

    //récupération données liste code journaux
    //Chargement de la liste des exercices associés à l'id dossier sélectionné
    const GetListeCodeTva = () => {
        axios.get(`/paramTva/listeCodeTva`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const all = Array.isArray(resData.list) ? resData.list : [];
                // Charger la liste complète ici; le filtrage final se fera selon la nature + «≠1*» dans handleChangeCompte/handleEditClick
                setListeCodeTva(all);
                setListeCodeTvaUnfiltered(all);
            } else {
                setListeCodeTva([]);
                setListeCodeTvaUnfiltered([]);
                toast.error(resData.msg);
            }
        });
    }

    //Récupération du plan comptable
    const recupPc = () => {
        axios.post(`/paramPlanComptable/pc`, { fileId: Number(fileId), compteId: Number(compteId) }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                const pcToFilter = resData.liste;
                const filteredPc = pcToFilter?.filter((row) => row.compte.startsWith('445'));
                const uniquePc = Array.from(new Map((filteredPc || []).map(r => [r.id, r])).values());
                setPc(uniquePc);
            } else {
                toast.error(resData.msg);
            }
        })
    }

    //Récupération du tableau des paramétrages de tva effectués
    const getListeParamTva = () => {
        const id = fileId;
        axios.get(`/paramTva/listeParamTva/${id}`).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setParamTva(resData.list);
            } else {
                setParamTva([]);
                toast.error(resData.msg);
            }
        });
    }

    useEffect(() => {
        if (fileId && compteId) {
            recupPc();
            GetListeCodeTva();
            getListeParamTva();
        }
    }, [fileId, compteId]);

    //filtrer et associer à formik le choix de compte
    const handleChangeCompte = (value) => {
        const infosCompte = pc?.filter((row) => row.id === value);
        // console.log('Compte sélectionné:', infosCompte[0]);
        // console.log('Liste codes TVA non filtrée:', listeCodeTvaUnfiltered);

        formikNewParamTva.setFieldValue('compte', infosCompte[0].id);

        if (infosCompte[0]?.compte.startsWith('4456')) {
            const filteredCode = (listeCodeTvaUnfiltered || [])
                .filter((row) => row.nature === 'DED')
                .filter((row) => !String(row.code || '').startsWith('1'));
            // console.log('Codes TVA filtrés pour 4456 (DED):', filteredCode);
            setListeCodeTva(filteredCode);
        } else if (infosCompte[0]?.compte.startsWith('4457')) {
            const filteredCode = (listeCodeTvaUnfiltered || [])
                .filter((row) => row.nature === 'COLL')
                .filter((row) => !String(row.code || '').startsWith('1'));
            // console.log('Codes TVA filtrés pour 4457 (COLL):', filteredCode);
            setListeCodeTva(filteredCode);
        } else {
            // console.log('Compte ne commence pas par 445x, chargement de tous les codes');
            GetListeCodeTva();
        }

        //affecter le libellé dans la colonne libellé
        formikNewParamTva.setFieldValue('libelle', infosCompte[0].libelle);
    }

    //associé déscriptioncode la déscription du code sélectionné
    const handleChangeCodeTva = (value) => {
        const infosCode = listeCodeTva?.filter((row) => row.id === value);
        const infosInit = infosCode[0];

        formikNewParamTva.setFieldValue('code', value)
        formikNewParamTva.setFieldValue('codedescription', infosInit.libelle);
    }

    //Entete du tableau
    const paramTvaColumnHeader = [
        {
            field: 'dossierplancomptable.compte',
            headerName: 'Compte',
            type: 'singleSelect',
            valueOptions: Array.from(new Set((pc || []).map((code) => code.compte))),
            sortable: true,
            flex: 2.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = pc?.find((option) => option.compte === params.compte);
                return selectedType ? selectedType.compte : params.compte;
            },

            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            style={{ backgroundColor: compteValidationColor }}
                            value={formikNewParamTva.values.compte ?? ''}
                            onChange={(e) => handleChangeCompte(e.target.value)}
                            label="Type"
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
            field: 'dossierplancomptable.libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            flex: 2,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: 'transparent'
                            }}
                            type="text"
                            value={formikNewParamTva.values.libelle}
                            //onChange = {(e) => formikNewParamTva.setFieldValue('libelle', e.target.value)}
                            label="libelle"
                            disableUnderline={true}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'listecodetva.code',
            headerName: 'Code tva',
            type: 'singleSelect',
            valueOptions: () => listeCodeTva.map((row) => row.code),
            sortable: true,
            flex: 0.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = listeCodeTva.find((option) => option.code === params.code);
                return selectedType ? selectedType.code : params.code;
            },

            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            style={{ backgroundColor: codeValidationColor }}
                            value={params.value ?? ''}
                            onChange={(e) => handleChangeCodeTva(e.target.value)}
                            label="Type"
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
                if (params.value && typeof params.value === 'string' && params.value.startsWith('2')) {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: 90,
                                height: 25,
                                backgroundColor: '#FFA62F',
                                borderRadius: 15,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white'
                            }}>
                                {params.value}
                            </div>
                        </Stack>
                    )
                } else {
                    return (
                        <Stack width={'100%'} style={{ display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: 90,
                                height: 25,
                                backgroundColor: '#3D5300',
                                borderRadius: 15,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white'
                            }}>
                                {params.value}
                            </div>
                        </Stack>
                    )
                }
            }
        },
        {
            field: 'listecodetva.libelle',
            headerName: 'Déscription',
            type: 'string',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: 'transparent'
                            }}
                            type="text"
                            value={formikNewParamTva.values.libelle || ''}
                            //onChange = {(e) => formikNewParamTva.setFieldValue('libelle', e.target.value)}
                            label="libelle"
                            disableUnderline={true}
                        />
                    </FormControl>
                );
            },
        },
    ];

    //gestion ajout + modification + suppression ligne dans le tableau liste code journaux
    const saveSelectedRow = (ids) => {
        if (ids.length === 1) {
            setSelectedRowId(ids);
            setDisableModifyBouton(false);
            setDisableSaveBouton(true);
            setDisableCancelBouton(false);
            setDisableDeleteBouton(false);
        } else {
            setSelectedRowId([]);
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

    const handleEditClick = (id) => () => {
        //réinitialiser les couleurs des champs
        setCodeValidationColor('transparent');
        setCompteValidationColor('transparent');

        //charger dans le formik les données de la ligne
        const selectedRowInfos = paramTva?.filter((item) => item.id === id[0]);

        const compteInit = selectedRowInfos[0];
        const compte = compteInit['dossierplancomptable.compte'];
        const libelle = compteInit['dossierplancomptable.libelle'];
        const description = compteInit['listecodetva.libelle'];

        if (compte?.startsWith('4456')) {
            const filteredCode = (listeCodeTvaUnfiltered || [])
                .filter((row) => row.nature === 'DED')
                .filter((row) => !String(row.code || '').startsWith('1'));
            setListeCodeTva(filteredCode);
        } else if (compte?.startsWith('4457')) {
            const filteredCode = (listeCodeTvaUnfiltered || [])
                .filter((row) => row.nature === 'COLL')
                .filter((row) => !String(row.code || '').startsWith('1'));
            setListeCodeTva(filteredCode);
        } else {
            GetListeCodeTva();
        }

        formikNewParamTva.setFieldValue("idCode", id);
        formikNewParamTva.setFieldValue("idDossier", fileId);
        formikNewParamTva.setFieldValue("idCompte", compteId);
        formikNewParamTva.setFieldValue("compte", selectedRowInfos[0].id_cptcompta);
        formikNewParamTva.setFieldValue("libelle", libelle);
        formikNewParamTva.setFieldValue("code", selectedRowInfos[0].type);
        formikNewParamTva.setFieldValue("codedescription", description);

        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (id) => () => {
        let saveBoolCompte = false;
        let saveBoolCode = false;

        setCompteValidationColor('transparent');
        setCodeValidationColor('transparent');

        if (formikNewParamTva.values.compte === '') {
            setCompteValidationColor('#F6D6D6');
            saveBoolCompte = false;
        } else {
            setCompteValidationColor('transparent');
            saveBoolCompte = true;
        }

        if (formikNewParamTva.values.code === '') {
            setCodeValidationColor('#F6D6D6');
            saveBoolCode = false;
        } else {
            setCodeValidationColor('transparent');
            saveBoolCode = true;
        }

        // return console.log('formikNewParamTva.values : ', formikNewParamTva.values);

        if (saveBoolCode && saveBoolCompte) {
            setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
            axiosPrivate.post(`/paramTva/paramTvaAdd`, formikNewParamTva.values).then((response) => {
                const resData = response.data;

                if (resData.state) {
                    setDisableAddRowBouton(false);
                    setDisableSaveBouton(true);

                    formikNewParamTva.resetForm();
                    getListeParamTva(fileId);
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            toast.error('Les champs en surbrillances sont obligatoires');
        }
    };

    const handleOpenDialogConfirmDeleteAssocieRow = () => {
        setOpenDialogDeleteRow(true);
        setDisableAddRowBouton(false);
    }

    const deleteRow = (value) => {
        if (value === true) {
            if (selectedRowId.length === 1) {
                const idToDelete = selectedRowId[0];
                if (idToDelete < 0) {
                    setOpenDialogDeleteRow(false);
                    setParamTva(paramTva.filter((row) => row.id !== idToDelete));
                    toast.success('Ligne supprimé avec succès');
                    return;
                }
                axiosPrivate.post(`/paramTva/paramTvaDelete`, { fileId, compteId, idToDelete }).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        setDisableAddRowBouton(false);
                        setOpenDialogDeleteRow(false);
                        setParamTva(paramTva.filter((row) => row.id !== selectedRowId[0]));
                        toast.success('Ligne supprimé avec succès');
                    } else {
                        setOpenDialogDeleteRow(false);
                        toast.error(resData.msg);
                    }
                });
            }
            setOpenDialogDeleteRow(false);
        } else {
            setOpenDialogDeleteRow(false);
        }
    }

    const handleCancelClick = (id) => () => {
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
        //setFieldValue('listeAssocies', listAssocie.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleCellEditCommit = (params) => {
        if (selectedRowId.length > 1 || selectedRowId.length === 0) {
            setEditableRow(false);
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
            setDisableCancelBouton(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
        } else {
            setDisableModifyBouton(false);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
            if (!selectedRowId.includes(params.id)) {
                setEditableRow(false);
                toast.error("Sélectionnez une ligne pour pouvoir la modifier");
            } else {
                setEditableRow(true);
            }
        }
    };

    //Ajouter une ligne dans le tableau liste associé
    const handleOpenDialogAddNewAssocie = () => {
        setDisableModifyBouton(false);
        setDisableCancelBouton(false);
        setDisableDeleteBouton(false);

        const newId = -Date.now();

        formikNewParamTva.setFieldValue("idDossier", fileId);
        const newRow = {
            id: newId,
            compte: '',
            code: '',
            libelle: '',
        };
        setParamTva([...paramTva, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRow([newRow.id]);
        setDisableAddRowBouton(true);
    }

    //récupérer le numéro id le plus grand dans le tableau
    const getMaxID = (data) => {
        const Ids = data.map(item => item.id);
        return Math.max(...Ids);
    };

    // Filtrer l'affichage du tableau: comptes commençant par 445 ET codes ne commençant pas par 1
    // Conserver les nouvelles lignes (id négatif) visibles pour pouvoir les éditer
    const paramTvaDisplayRows = React.useMemo(() => {
        if (!Array.isArray(paramTva)) return [];
        return paramTva.filter((row) => {
            const isNew = Number(row?.id) < 0;
            if (isNew) return true;
            const compte = String(row?.['dossierplancomptable.compte'] || '');
            const code = String(row?.['listecodetva.code'] || '');
            return compte.startsWith('445')
            //  && !code.startsWith('1');
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
                        <Typography variant='h6' sx={{ color: "black" }} align='left'>Paramétrages : TVA</Typography>

                        <Stack width={"100%"} height={"30px"} spacing={1} alignItems={"center"} alignContent={"center"}
                            direction={"column"} style={{ marginLeft: "0px", marginTop: "20px", justifyContent: "right" }}>

                            <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                direction={"row"} justifyContent={"right"}>
                                <Tooltip title="Ajouter une ligne">
                                    <span>
                                        <IconButton
                                            disabled={!canAdd || disableAddRowBouton}
                                            variant="contained"
                                            onClick={handleOpenDialogAddNewAssocie}
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.theme,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Modifier la ligne sélectionnée">
                                    <span>
                                        <IconButton
                                            disabled={(!canModify && selectedRowId > 0) || disableModifyBouton}
                                            variant="contained"
                                            onClick={handleEditClick(selectedRowId)}
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.theme,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <FaRegPenToSquare style={{ width: '25px', height: '25px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Sauvegarder les modifications">
                                    <span>
                                        <IconButton
                                            disabled={(!canAdd && !canModify) || !formikNewParamTva.isValid}
                                            variant="contained"
                                            onClick={handleSaveClick(selectedRowId)}
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.theme,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <TfiSave style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Annuler les modifications">
                                    <span>
                                        <IconButton
                                            disabled={disableCancelBouton}
                                            variant="contained"
                                            onClick={handleCancelClick(selectedRowId)}
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.button_delete_color,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <VscClose style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Tooltip title="Supprimer la ligne sélectionné">
                                    <span>
                                        <IconButton
                                            disabled={!canDelete || disableDeleteBouton}
                                            onClick={handleOpenDialogConfirmDeleteAssocieRow}
                                            variant="contained"
                                            style={{
                                                width: "35px", height: '35px',
                                                borderRadius: "2px", borderColor: "transparent",
                                                backgroundColor: initial.button_delete_color,
                                                textTransform: 'none', outline: 'none'
                                            }}
                                        >
                                            <IoMdTrash style={{ width: '50px', height: '50px', color: 'white' }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>

                            <Stack width={"100%"} height={'100%'} minHeight={'600px'}>
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
                                    rows={canView ? paramTvaDisplayRows : []}
                                    onRowClick={(e) => handleCellEditCommit(e.row)}
                                    // onCellClick={(e) => test(e.row)}
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
                                    initialState={{
                                        pagination: {
                                            paginationModel: { page: 0, pageSize: 100 },
                                        },
                                    }}
                                    experimentalFeatures={{ newEditingApi: true }}
                                    pageSizeOptions={[50, 100]}
                                    pagination={DataGridStyle.pagination}
                                    checkboxSelection={DataGridStyle.checkboxSelection}
                                    columnVisibilityModel={{
                                        id: false,
                                    }}
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
                                        setDisableAddRowBouton(true);

                                        const compte = rowData['dossierplancomptable.compte'];
                                        const libelle = rowData['dossierplancomptable.libelle'];
                                        const description = rowData['listecodetva.libelle'];

                                        if (compte?.startsWith('4456')) {
                                            const filteredCode = (listeCodeTvaUnfiltered || [])
                                                .filter((row) => row.nature === 'DED')
                                                .filter((row) => !String(row.code || '').startsWith('1'));
                                            setListeCodeTva(filteredCode);
                                        } else if (compte?.startsWith('4457')) {
                                            const filteredCode = (listeCodeTvaUnfiltered || [])
                                                .filter((row) => row.nature === 'COLL')
                                                .filter((row) => !String(row.code || '').startsWith('1'));
                                            setListeCodeTva(filteredCode);
                                        } else {
                                            GetListeCodeTva();
                                        }

                                        setCodeValidationColor('transparent');
                                        setCompteValidationColor('transparent');

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
    )
}
