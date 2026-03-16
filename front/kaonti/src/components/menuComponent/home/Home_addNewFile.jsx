import { useState, useEffect } from 'react';
import { Typography, Stack, Paper, TextField, FormControl, Select, MenuItem, Tooltip, Button, IconButton, FormHelperText, Input, Autocomplete, Checkbox, RadioGroup, Radio, InputLabel } from '@mui/material';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { MdExpandCircleDown } from "react-icons/md";
import toast from 'react-hot-toast';
import { useFormik, Field, Formik, Form, ErrorMessage } from 'formik';
import * as Yup from "yup";
import { init } from '../../../../init';
import useAuth from '../../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import axios from '../../../../config/axios';
import { VscLinkExternal } from "react-icons/vsc";
import { FaTools } from "react-icons/fa";
import { FaHotel, FaRegPenToSquare } from "react-icons/fa6";
import { FaIndustry } from "react-icons/fa6";
import { GiMineWagon } from "react-icons/gi";
import { FaTruck } from "react-icons/fa6";
import { MdOutlineTravelExplore } from "react-icons/md";
import { VscClose } from "react-icons/vsc";
import PopupConfirmDelete from '../../componentsTools/popupConfirmDelete';
import { TfiSave } from "react-icons/tfi";
import { DataGridStyle } from '../../componentsTools/DatagridToolsStyle';
import QuickFilter from '../../componentsTools/DatagridToolsStyle';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import { TbPlaylistAdd } from 'react-icons/tb';
import { IoMdTrash } from 'react-icons/io';
import { FormControlLabel } from '@mui/material';
import MontantCapitalField from './Field/MontantCapitalField';
import useAxiosPrivate from '../../../../config/axiosPrivate';
import { FcBusinessContact } from 'react-icons/fc';
import { FaRectangleList } from "react-icons/fa6";
import { HiMiniDocumentText } from "react-icons/hi2";
import { MdContacts } from "react-icons/md";
import { MdOutlineSecurity } from "react-icons/md";

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PasswordField from './Field/PasswordField';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const TextFieldComponent = ({ text, name, handleChange, handleBlur, values, error, helperText, width }) => {
    return (
        <Stack spacing={1}>
            <label htmlFor={name} style={{ fontSize: 14, color: 'black', marginBottom: '-5px' }}>{text}</label>
            <TextField
                required
                name={name}
                onChange={handleChange}
                onBlur={handleBlur}
                value={values}
                type='text'
                placeholder=""
                style={{
                    borderTop: 'none',
                    borderLeft: 'none', borderRight: 'none',
                    outline: 'none', fontSize: 12, borderWidth: '0.5px',
                }}
                sx={{
                    width: '100%',
                    '& .MuiFormHelperText-root': {
                        marginLeft: 0
                    },
                    '& .MuiInputBase-root': {
                        height: 32
                    }
                }}
                error={error}
                helperText={error ? helperText : ''}
            />
        </Stack>
    )
}

export default function AddNewFile({ confirmationState }) {
    const apiRef = useGridApiRef();
    const closed = () => {
        confirmationState(false);
    }

    const axiosPrivate = useAxiosPrivate();

    const [value, setValue] = useState("1");
    const [listModel, setListModel] = useState([]);
    const [listAssocie, setListAssocie] = useState([]);
    const [listFiliales, setListFiliales] = useState([]);
    const [listConsolidation, setListConsolidation] = useState([]);
    const [listDomBank, setListDomBank] = useState([]);
    const [listPays, setListPays] = useState([]);
    const [listProvinces, setListProvinces] = useState([]);
    const [listRegions, setListRegions] = useState([]);
    const [listDistricts, setListDistricts] = useState([]);
    const [listCommunes, setListCommunes] = useState([]);
    const [listeDossier, setListeDossier] = useState([]);

    const selectedDossierIds = listConsolidation
        .map(val => Number(val.idDossier))
        .filter(Boolean);

    const availableDossier = listeDossier.filter(d =>
        !selectedDossierIds.includes(d.id) || d.id === value
    );

    const initial = init[0];
    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);
    const [disableAddRowBoutonDomBank, setDisableAddRowBoutonDomBank] = useState(false);

    const [editableRow, setEditableRow] = useState(true);
    const [openDialogDeleteAssocieRow, setOpenDialogDeleteAssocieRow] = useState(false);

    const [selectedRowIdFiliale, setSelectedRowIdFiliale] = useState([]);
    const [rowModesModelFiliale, setRowModesModelFiliale] = useState({});
    const [disableModifyBoutonFiliale, setDisableModifyBoutonFiliale] = useState(true);
    const [disableCancelBoutonFiliale, setDisableCancelBoutonFiliale] = useState(true);
    const [disableSaveBoutonFiliale, setDisableSaveBoutonFiliale] = useState(true);
    const [disableDeleteBoutonFiliale, setDisableDeleteBoutonFiliale] = useState(true);
    const [disableAddRowBoutonFiliale, setDisableAddRowBoutonFiliale] = useState(false);

    const [editableRowFiliale, setEditableRowFiliale] = useState(true);
    const [openDialogDeleteFilialeRow, setOpenDialogDeleteFilialeRow] = useState(false);

    const [selectedRowIdConsolidation, setSelectedRowIdConsolidation] = useState([]);
    const [rowModesModelConsolidation, setRowModesModelConsolidation] = useState({});
    const [disableModifyBoutonConsolidation, setDisableModifyBoutonConsolidation] = useState(true);
    const [disableCancelBoutonConsolidation, setDisableCancelBoutonConsolidation] = useState(true);
    const [disableSaveBoutonConsolidation, setDisableSaveBoutonConsolidation] = useState(true);
    const [disableDeleteBoutonConsolidation, setDisableDeleteBoutonConsolidation] = useState(true);
    const [disableAddRowBoutonConsolidation, setDisableAddRowBoutonConsolidation] = useState(false);
    const [editableRowConsolidation, setEditableRowConsolidation] = useState(true);
    const [openDialogDeleteConsolidationRow, setOpenDialogDeleteConsolidationRow] = useState(false);
    const [selectedRowConsolidations, setSelectedRowConsolidations] = useState([]);

    const [selectedRowAssocie, setSelectedRowAssocie] = useState([]);
    const [selectedRowFiliales, setSelectedRowFiliales] = useState([]);

    const [selectedRowIdDomBank, setSelectedRowIdDomBank] = useState([]);
    const [rowModesModelDomBank, setRowModesModelDomBank] = useState({});
    const [disableModifyBoutonDomBank, setDisableModifyBoutonDomBank] = useState(true);
    const [disableCancelBoutonDomBank, setDisableCancelBoutonDomBank] = useState(true);
    const [disableSaveBoutonDomBank, setDisableSaveBoutonDomBank] = useState(true);
    const [disableDeleteBoutonDomBank, setDisableDeleteBoutonDomBank] = useState(true);
    const [editableRowDomBank, setEditableRowDomBank] = useState(true);
    const [openDialogDeleteDomBankRow, setOpenDialogDeleteDomBankRow] = useState(false);

    const [bankDomBankValidationColor, setBankDomBankValidationColor] = useState('transparent');
    const [numCompteDomBankValidationColor, setNumCompteDomBankValidationColor] = useState('transparent');
    const [deviseDomBankValidationColor, setDeviseDomBankValidationColor] = useState('transparent');

    const [selectedRowDomBank, setSelectedRowDomBank] = useState([]);
    const [listePortefeuille, setListePortefeuille] = useState([]);

    //récupération infos compte
    const { auth } = useAuth();
    const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
    const compteId = decoded.UserInfo.compteId || null;
    const userId = decoded.UserInfo.userId || null;

    const [fileId, setFileId] = useState(0);
    const [fileInfos, setFileInfos] = useState('');
    const [noFile, setNoFile] = useState(false);
    //useFormik pour le tableau des domiciliations bancaires
    const useFormikDomBank = useFormik({
        initialValues: {
            idCompte: compteId,
            idDossier: fileId,
            idDomBank: '',
            banque: '',
            numcompte: '',
            devise: '',
            pays: '',
            enactivite: false,
        },
        validateOnChange: false,
        validateOnBlur: true,
    });

    //Form pour l'enregistrement des données
    const InfosNewFileInitialValues = {
        centrefisc: 'DGE', // Valeur par défaut, synchronisée avec le radio fiscal

        action: 'new',
        itemId: 0,
        idCompte: 0,
        nomdossier: '',
        raisonsociale: '',
        denomination: '',
        nif: '',
        stat: '',
        rcs: '',
        responsable: '',
        expertcomptable: '',
        cac: '',
        forme: '',
        activite: '',
        detailsactivite: '',
        adresse: '',
        email: '',
        telephone: '',
        province: '',
        region: '',
        district: '',
        commune: '',
        plancomptable: 0,
        longueurcptstd: 6,
        longueurcptaux: 6,
        autocompletion: true,
        avecanalytique: false,
        tauxir: '',
        assujettitva: false,
        montantcapital: 0,
        nbrpart: 0,
        valeurpart: 0,
        listeAssocies: [],
        listeFiliales: [],
        listeDomBank: [],
        // Immobilisation
        immo_amort_base_jours: '365',
        portefeuille: [],
        typecomptabilite: 'Français',
        devisepardefaut: 'MGA',
        consolidation: false,
        listeConsolidation: [],
        pays: '',
        avecMotDePasse: false,
        motDePasse: '',
        motDePasseConfirmation: ''
    };

    const formInfosNewFileValidationSchema = Yup.object({
        nomdossier: Yup.string().required("Veuillez tapez un nom pour votre dossier"),
        raisonsociale: Yup.string().required("Veuillez insérer la raison sociale de votre société"),
        forme: Yup.string().required("Veuillez sélection la forme de votre société"),
        activite: Yup.string().required("Veuillez renseigner l'activité de votre société"),
        longueurcptstd: Yup.number().moreThan(1, 'Taper une longueur de compte supérieur à 1'),
        longueurcptaux: Yup.number().moreThan(1, 'Taper une longueur de compte supérieur à 1'),
        tauxir: Yup.number().moreThan(0, 'Taper votre taux IR'),
        portefeuille: Yup.array().min(1, "Sélectionnez au moins un portefeuille"),
        pays: Yup.string().required("Sélectionnez une pays"),

        motDePasse: Yup.string().when('avecMotDePasse', {
            is: true,
            then: (schema) =>
                schema
                    .required("Le mot de passe est obligatoire")
                    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
                    .max(30, "Le mot de passe est trop long")
                    .matches(/[A-Z]/, "Doit contenir une majuscule")
                    .matches(/[a-z]/, "Doit contenir une minuscule")
                    .matches(/[0-9]/, "Doit contenir un chiffre")
                    .matches(/[^a-zA-Z0-9]/, "Doit contenir un caractère spécial"),
            otherwise: (schema) => schema.notRequired()
        }),

        motDePasseConfirmation: Yup.string().when('avecMotDePasse', {
            is: true,
            then: (schema) =>
                schema
                    .oneOf([Yup.ref('motDePasse')], "Les mots de passe ne correspondent pas")
                    .required("Le mot de passe de confirmation est obligatoire"),
            otherwise: (schema) => schema.notRequired()
        }),
    });

    const fieldOrder = [
        'nomdossier',
        'raisonsociale',
        'forme',
        'activite',
        'longueurcptstd',
        'longueurcptaux',
        'tauxir',
        'portefeuille',
        'pays',
        'motDePasse',
        'motDePasseConfirmation'
    ]

    const getFirstErrorField = (errors, fieldOrder) => {
        return fieldOrder.find(field => errors[field]);
    };

    //GESTION DU TABLEAU ASSOCIE-------------------------------------------------------------------------------
    const TypesOptions = [
        { value: 'PP', label: 'Personne physique' },
        { value: 'PM', label: 'Personne morale' },
    ];

    //Entête tableau liste associé
    const AssocieColumnHeader = [
        {
            field: 'type',
            headerName: 'Type',
            type: 'singleSelect',
            valueOptions: TypesOptions.map((type) => type.value),
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = TypesOptions.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.value;
            },
        },
        {
            field: 'nom',
            headerName: 'Nom',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRow,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
        },
        {
            field: 'adresse',
            headerName: 'Adresse',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
        },
        {
            field: 'dateentree',
            headerName: 'Date entrée',
            type: 'date',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            type="date"
                            name="dateentree"
                            value={
                                value instanceof Date
                                    ? value.toISOString().substring(0, 10)
                                    : value
                                        ? value.substring(0, 10)
                                        : ''
                            }
                            onChange={handleChange}
                            disableUnderline
                            style={{ height: '100%', outline: 'none' }}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'datesortie',
            headerName: 'Date sortie',
            type: 'date',
            align: 'left',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            type="date"
                            name="datesortie"
                            value={
                                value instanceof Date
                                    ? value.toISOString().substring(0, 10)
                                    : value
                                        ? value.substring(0, 10)
                                        : ''
                            }
                            onChange={handleChange}
                            disableUnderline
                            style={{ height: '100%', outline: 'none' }}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'nbrpart',
            headerName: 'Nombre parts',
            type: 'number',
            sortable: true,
            flex: 1,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
        },
        {
            field: 'enactivite',
            headerName: 'En activité',
            type: 'boolean',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
        },
    ];

    const saveSelectedRow = (ids) => {
        if (ids.length === 1) {
            setSelectedRowId(ids);
            setDisableModifyBouton(false);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
            setDisableDeleteBouton(false);
        } else {
            setSelectedRowId([]);
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
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
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
        setDisableSaveBouton(true);
        toast.success("Informations sauvegardées");
        setDisableAddRowBouton(false);
    };

    const handleOpenDialogConfirmDeleteAssocieRow = () => {
        setOpenDialogDeleteAssocieRow(true);
        setDisableAddRowBouton(false);
    }

    const deleteAssocieRow = (value) => {
        if (value === true) {
            setListAssocie(listAssocie.filter((row) => row.id !== selectedRowId[0]));
            setOpenDialogDeleteAssocieRow(false);
            setDisableAddRowBouton(false);
            toast.success('Ligne supprimée avec succès');
        } else {
            setOpenDialogDeleteAssocieRow(false);
        }
    }

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBouton(false);
    };

    const processRowUpdate = (setFieldValue) => (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setListAssocie(listAssocie.map((row) => (row.id === newRow.id ? updatedRow : row)));
        setFieldValue('listeAssocies', listAssocie.map((row) => (row.id === newRow.id ? updatedRow : row)));
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

        const newRow = {
            id: newId,
            type: '',
            nom: '',
            adresse: '',
            dateentree: null,
            datesortie: null,
            nbrpart: 0,
            enactivite: false,
        };

        const updatedList = [...listAssocie, newRow];
        setListAssocie(updatedList);

        setSelectedRowAssocie([newRow.id]);
        setSelectedRowId([newRow.id]);

        setDisableAddRowBouton(true);
    };

    //GESTION DU TABLEAU FILIALE-------------------------------------------------------------------------------

    //Entête tableau liste associé
    const FilialeColumnHeader = [
        {
            field: 'nom',
            headerName: 'Nom',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRowFiliale,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
        },
        {
            field: 'dateentree',
            headerName: 'Date entrée',
            type: 'date',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRowFiliale,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            type="date"
                            name="dateentree"
                            value={
                                value instanceof Date
                                    ? value.toISOString().substring(0, 10)
                                    : value
                                        ? value.substring(0, 10)
                                        : ''
                            }
                            onChange={handleChange}
                            disableUnderline
                            style={{ height: '100%', outline: 'none' }}
                        />
                    </FormControl>
                );
            }
        },
        {
            field: 'datesortie',
            headerName: 'Date sortie',
            type: 'date',
            align: 'left',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRowFiliale,
            valueGetter: (params) => {
                if (!params.value) return null;
                return new Date(params.value);
            },
            renderCell: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({ id, field, value: e.target.value });
                };

                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            type="date"
                            name="datesortie"
                            value={
                                value instanceof Date
                                    ? value.toISOString().substring(0, 10)
                                    : value
                                        ? value.substring(0, 10)
                                        : ''
                            }
                            onChange={handleChange}
                            disableUnderline
                            style={{ height: '100%', outline: 'none' }}
                        />
                    </FormControl>
                );
            }
        },
        {
            field: 'nbrpart',
            headerName: 'Nombre parts',
            type: 'number',
            sortable: true,
            flex: 1,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            editable: editableRowFiliale,
        },
        {
            field: 'enactivite',
            headerName: 'En activité',
            type: 'boolean',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            editable: editableRowFiliale,
        },
    ];

    const saveSelectedRowFiliale = (ids) => {
        if (ids.length === 1) {
            setSelectedRowIdFiliale(ids);
            setDisableModifyBoutonFiliale(false);
            setDisableSaveBoutonFiliale(false);
            setDisableCancelBoutonFiliale(false);
            setDisableDeleteBoutonFiliale(false);
        } else {
            setSelectedRowIdFiliale([]);
            setDisableModifyBoutonFiliale(true);
            setDisableSaveBoutonFiliale(true);
            setDisableCancelBoutonFiliale(true);
            setDisableDeleteBoutonFiliale(true);
        }
    }

    const saveSelectedRowConsolidation = (ids) => {
        if (ids.length === 1) {
            setSelectedRowIdConsolidation(ids);
            setDisableModifyBoutonConsolidation(false);
            setDisableSaveBoutonConsolidation(false);
            setDisableCancelBoutonConsolidation(false);
            setDisableDeleteBoutonConsolidation(false);
        } else {
            setSelectedRowIdConsolidation([]);
            setDisableModifyBoutonConsolidation(true);
            setDisableSaveBoutonConsolidation(true);
            setDisableCancelBoutonConsolidation(true);
            setDisableDeleteBoutonConsolidation(true);
        }
    }

    const saveSelectedRowDomBank = (ids) => {
        if (ids.length === 1) {
            setSelectedRowIdDomBank(ids);
            setDisableModifyBoutonDomBank(false);
            setDisableSaveBoutonDomBank(false);
            setDisableCancelBoutonDomBank(false);
            setDisableDeleteBoutonDomBank(false);
        } else {
            setSelectedRowIdDomBank([]);
            setDisableModifyBoutonDomBank(true);
            setDisableSaveBoutonDomBank(true);
            setDisableCancelBoutonDomBank(true);
            setDisableDeleteBoutonDomBank(true);
        }
    }

    const handleRowEditStopFiliale = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleRowEditStopConsolidation = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClickFiliale = (id) => () => {
        setRowModesModelFiliale({ ...rowModesModelFiliale, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBoutonFiliale(false);
    };

    const handleEditClickConsolidation = (id) => () => {
        setRowModesModelConsolidation({ ...rowModesModelConsolidation, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBoutonConsolidation(false);
    };

    const handleSaveClickFiliale = (setFieldValue) => () => {
        setRowModesModelFiliale({ ...rowModesModelFiliale, [selectedRowIdFiliale]: { mode: GridRowModes.View } });
        setDisableSaveBoutonFiliale(true);
        setDisableAddRowBoutonFiliale(false);
        toast.success("Informations sauvegardées");
    };

    const handleSaveClickConsolidation = (setFieldValue) => () => {
        setRowModesModelConsolidation({ ...rowModesModelConsolidation, [selectedRowIdConsolidation]: { mode: GridRowModes.View } });
        setDisableSaveBoutonConsolidation(true);
        setDisableAddRowBoutonConsolidation(false);
        toast.success("Informations sauvegardées");
    };

    const handleOpenDialogConfirmDeleteAssocieRowFiliale = () => {
        setOpenDialogDeleteFilialeRow(true);
        setDisableAddRowBoutonFiliale(false);
    }

    const handleOpenDialogConfirmDeleteConsolidationRow = () => {
        setOpenDialogDeleteConsolidationRow(true);
        setDisableAddRowBoutonConsolidation(false);
    }

    const deleteFilialeRow = (value) => {
        if (value === true) {
            setListFiliales(listFiliales.filter((row) => row.id !== selectedRowIdFiliale[0]));
            setOpenDialogDeleteFilialeRow(false);
            setDisableAddRowBoutonFiliale(false);
            toast.success('Ligne supprimée avec succès');
        } else {
            setOpenDialogDeleteFilialeRow(false);
        }
    }

    const handleCancelClickFiliale = (id) => () => {
        setRowModesModelFiliale({
            ...rowModesModelFiliale,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBoutonFiliale(false);
    };

    const deleteConsolidationRow = (value) => {
        if (value === true) {
            setListConsolidation(listConsolidation.filter((row) => row.id !== selectedRowIdConsolidation[0]));
            setOpenDialogDeleteConsolidationRow(false);
            setDisableAddRowBoutonConsolidation(false);
            toast.success('Ligne supprimée avec succès');
        } else {
            setOpenDialogDeleteConsolidationRow(false);
        }
    }

    const handleCancelClickConsolidation = (id) => () => {
        setRowModesModelConsolidation({
            ...rowModesModelConsolidation,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBoutonConsolidation(false);
    };

    const processRowUpdateFiliale = (setFieldValue) => (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setListFiliales(listFiliales.map((row) => (row.id === newRow.id ? updatedRow : row)));
        setFieldValue('listeFiliales', listFiliales.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const processRowUpdateConsolidation = (setFieldValue) => (newRow) => {
        const updatedRow = { ...newRow };
        setListConsolidation(listConsolidation.map((row) => (row.id === newRow.id ? updatedRow : row)));
        setFieldValue('listeConsolidation', listConsolidation.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChangeFiliale = (newRowModesModel) => {
        setRowModesModelFiliale(newRowModesModel);
    };

    const handleRowModesModelChangeConsolidation = (newRowModesModel) => {
        setRowModesModelConsolidation(newRowModesModel);
    };

    const handleCellEditCommitFiliale = (params) => {
        if (selectedRowIdFiliale.length > 1 || selectedRowIdFiliale.length === 0) {
            setEditableRowFiliale(false);
            setDisableModifyBoutonFiliale(true);
            setDisableSaveBoutonFiliale(true);
            setDisableCancelBoutonFiliale(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
        } else {
            setDisableModifyBoutonFiliale(false);
            setDisableSaveBoutonFiliale(false);
            setDisableCancelBoutonFiliale(false);
            if (!selectedRowIdFiliale.includes(params.id)) {
                setEditableRowFiliale(false);
                toast.error("Sélectionnez une ligne pour pouvoir la modifier");
            } else {
                setEditableRowFiliale(true);
            }
        }
    };

    //Ajouter une ligne dans le tableau liste associé
    const handleOpenDialogAddNewFiliale = () => {
        setDisableModifyBoutonFiliale(false);
        setDisableCancelBoutonFiliale(false);
        setDisableDeleteBoutonFiliale(false);
        const newRow = {
            id: listFiliales.length + 1,
            nom: '',
            dateentree: null,
            datesortie: null,
            nbrpart: 0,
            enactivite: false,
        };
        setListFiliales([...listFiliales, newRow]);
        setSelectedRowFiliales([newRow.id]);
        setSelectedRowIdFiliale([newRow.id]);
        setDisableAddRowBoutonFiliale(true);
    }

    //Ajouter une ligne dans le tableau liste consolidation
    const handleOpenDialogAddNewConsolidation = () => {
        setDisableModifyBoutonConsolidation(false);
        setDisableCancelBoutonConsolidation(false);
        setDisableDeleteBoutonConsolidation(false);
        const newRow = {
            id: listConsolidation.length + 1,
        };
        setListConsolidation([...listConsolidation, newRow]);
        setSelectedRowConsolidations([newRow.id]);
        setSelectedRowIdConsolidation([newRow.id]);
        setDisableAddRowBoutonConsolidation(true);
    }

    //Choix TAB value-------------------------------------------------------------------------------------
    const handleChangeTAB = (event, newValue) => {
        setValue(newValue);
    };

    //Récupération de la liste des modèles de plan comptable
    const GetListePlanComptableModele = () => {
        axios.post(`/paramPlanComptableModele/model`, { compteId, userId }).then((response) => {
            const resData = response.data;
            setListModel(resData.modelList);
        });
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
        }).catch((error) => {
            console.error('Erreur lors du chargement des districts:', error);
        });
    }

    const getListeCommunes = (province, region, district) => {
        if (!province || !region || !district) {
            setListCommunes([]);
            return;
        }
        axios.get(`/paramPlanComptable/getCommunes/${province}/${region}/${district}`).then((response) => {
            const communes = response.data.map(name => ({ id: name, name: name }));
            setListCommunes(communes);
        }).catch((error) => {
            console.error('Erreur lors du chargement des communes:', error);
        });
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

    const getInfosDomBank = (id) => {
        axios.get(`/paramCrm/listeDomBank/${id}`).then((response) => {
            const resData = response.data;
            const safeList = Array.isArray(resData?.list) ? resData.list : [];
            setListDomBank(safeList);
        }).catch(() => setListDomBank([]));
    };

    const getMaxID = (data) => {
        const Ids = data.map(item => item.id);
        return Math.max(...Ids);
    };

    const getListeDossier = () => {
        axios.get(`/home/file/${compteId}`, { params: { userId: userId } }).then((response) => {
            const resData = response.data;
            setListeDossier(resData.fileList);
        })
    }

    useEffect(() => {
        GetListePlanComptableModele();
        getListeDossier();
    }, [compteId]);
    useEffect(() => {
        getListePays();
        getListeProvinces();
    }, []);
    useEffect(() => {
        getInfosDomBank(fileId);
    }, [fileId]);


    //Données pour les listbox
    const listeFormeJuridique = [
        { id: 'SAPP', libelle: 'SAPP - Société anonyme à participation publique' },
        { id: 'SA', libelle: 'SA - Société anonyme' },
        { id: 'SAS', libelle: 'SAS - Société par action simplifiée' },
        { id: 'SARL', libelle: 'SARL - Société à responsabilité limitée' },
        { id: 'SARLU', libelle: 'SARLU - Société à responsabilité limitée unipersonnel' },
        { id: 'SCS', libelle: 'SCS - Société en commandité simple' },
        { id: 'SNC', libelle: 'SNC - Société en nom collectif' },
        { id: 'SP', libelle: 'SP - Société en participation' },
    ];

    const listeActivite = [
        { id: 'ART', libelle: 'Artisanale', icon: <FaTools style={{ color: 'green' }} /> },
        { id: 'IND', libelle: 'Industrielle', icon: <FaIndustry style={{ color: 'green' }} /> },
        { id: 'MIN', libelle: 'Minière', icon: <GiMineWagon style={{ color: 'green' }} /> },
        { id: 'HOT', libelle: 'Hôtelière', icon: <FaHotel style={{ color: 'green' }} /> },
        { id: 'TOU', libelle: 'Touristique', icon: <MdOutlineTravelExplore style={{ color: 'green' }} /> },
        { id: 'TRA', libelle: 'Transport', icon: <FaTruck style={{ color: 'green' }} /> },
        { id: 'AUT', libelle: 'Autres', icon: <VscLinkExternal style={{ color: 'green' }} /> },
    ];

    const handleOnChangeFormeSelect = (setFieldValue) => (e) => {
        const value = e.target.value;
        setFieldValue('forme', value);
        setFieldValue('idCompte', compteId);
        setFieldValue('action', 'new');
    }

    const handleOnChangeActiviteSelect = (setFieldValue) => (e) => {
        const value = e.target.value;
        setFieldValue('activite', value);
    }

    const handleOnChangePlanComptableSelect = (setFieldValue) => (e) => {
        const value = e.target.value;
        setFieldValue('plancomptable', value);
    }
    //submit les informations du nouveau dossier
    const handlSubmitNewFile = (values) => {
        const montantcapitalRaw = values.montantcapital || "0";
        const montantcapitalNumber = parseFloat(
            montantcapitalRaw.replace(/\s/g, "").replace(",", ".") || montantcapitalRaw
        ).toFixed(2);
        const montantCapitalFormatted = Number(montantcapitalNumber);
        values.montantcapital = montantCapitalFormatted;
        // Construit un payload incluant idCompte et la liste DomBank depuis le state

        const portefeuilleIds = values.portefeuille.map(val => Number(val.id));
        const payload = {
            ...values,
            idCompte: compteId,
            portefeuille: portefeuilleIds,
            listeDomBank: (Array.isArray(listDomBank) ? listDomBank : []).map(item => ({
                banque: item.banque || '',
                numcompte: item.numcompte || '',
                devise: item.devise || '',
                pays: item.pays || '',
                enactivite: Boolean(item.enactivite),
            })),
        };

        axiosPrivate.post(`/home/newFile`, payload).then((response) => {
            const resData = response.data;
            if (resData.state) {
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
            closed();
        })
    }

    const deselectRowAssocie = (ids) => {
        const deselected = selectedRowId.filter(id => !ids.includes(id));

        const updatedRowModes = { ...rowModesModel };
        deselected.forEach((id) => {
            updatedRowModes[id] = { mode: GridRowModes.View, ignoreModifications: true };
        });
        setRowModesModel(updatedRowModes);

        setDisableAddRowBouton(false);
        setSelectedRowId(ids);
    }

    const deselectRowFiliale = (ids) => {
        const deselected = selectedRowIdFiliale.filter(id => !ids.includes(id));

        const updatedRowModes = { ...rowModesModelFiliale };
        deselected.forEach((id) => {
            updatedRowModes[id] = { mode: GridRowModes.View, ignoreModifications: true };
        });
        setRowModesModelFiliale(updatedRowModes);

        setDisableAddRowBoutonFiliale(false);
        setSelectedRowIdFiliale(ids);
    }

    const deselectRowConsolidation = (ids) => {
        const deselected = selectedRowIdConsolidation.filter(id => !ids.includes(id));

        const updatedRowModes = { ...rowModesModelConsolidation };
        deselected.forEach((id) => {
            updatedRowModes[id] = { mode: GridRowModes.View, ignoreModifications: true };
        });
        setRowModesModelConsolidation(updatedRowModes);

        setDisableAddRowBoutonConsolidation(false);
        setSelectedRowIdConsolidation(ids);
    }

    const handleOpenDialogAddNewDomBank = () => {

        setDisableModifyBoutonDomBank(false);
        setDisableCancelBoutonDomBank(false);
        setDisableDeleteBoutonDomBank(false);
        setDisableSaveBoutonDomBank(false);

        const newId = -Date.now();
        let arrayId = [];
        arrayId = [...arrayId, newId];

        useFormikDomBank.setFieldValue("idDomBank", newId);
        useFormikDomBank.setFieldValue("idCompte", compteId);
        useFormikDomBank.setFieldValue("idDossier", fileId);
        useFormikDomBank.setFieldValue("banque", "");
        useFormikDomBank.setFieldValue("numcompte", "");
        useFormikDomBank.setFieldValue("devise", "");
        useFormikDomBank.setFieldValue("pays", "");
        useFormikDomBank.setFieldValue("enactivite", false);

        const newRow = {
            id: newId,
            banque: '',
            numcompte: '',
            devise: '',
            pays: '',
        };
        setListDomBank([...listDomBank, newRow]);
        setSelectedRowIdDomBank(arrayId);
        setRowModesModelDomBank({ ...rowModesModelDomBank, [arrayId]: { mode: GridRowModes.Edit } });
        setDisableSaveBoutonDomBank(false);
        setSelectedRowDomBank([newId]);
        setDisableAddRowBoutonDomBank(true);
    }

    const handleEditClickDomBank = (id) => () => {
        //réinitialiser les couleurs des champs
        setBankDomBankValidationColor('transparent');
        setNumCompteDomBankValidationColor('transparent');
        setDeviseDomBankValidationColor('transparent');

        //charger dans le formik les données de la ligne
        const selectedRowInfos = listDomBank?.filter((item) => item.id === id[0]);

        useFormikDomBank.setFieldValue("idCompte", compteId);
        useFormikDomBank.setFieldValue("idDossier", fileId);
        useFormikDomBank.setFieldValue("idDomBank", selectedRowInfos[0].id);
        useFormikDomBank.setFieldValue("banque", selectedRowInfos[0].banque);
        useFormikDomBank.setFieldValue("numcompte", selectedRowInfos[0].numcompte);
        useFormikDomBank.setFieldValue("devise", selectedRowInfos[0].devise);
        useFormikDomBank.setFieldValue("pays", selectedRowInfos[0].pays);
        useFormikDomBank.setFieldValue("enactivite", selectedRowInfos[0].enactivite);

        setRowModesModelDomBank({ ...rowModesModelDomBank, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBoutonDomBank(false);
    };


    const handleSaveClickDomBank = (id) => () => {
        let saveBoolbanque = false;
        let saveBoolNumCompte = false;
        let saveBoolDevise = false;
        let saveBoolPays = false;

        if (useFormikDomBank.values.banque === '') {
            setBankDomBankValidationColor('#F6D6D6');
            saveBoolbanque = false;
        } else {
            setBankDomBankValidationColor('transparent');
            saveBoolbanque = true;
        }

        if (!useFormikDomBank.values.numcompte) {
            setNumCompteDomBankValidationColor('#F6D6D6');
            saveBoolNumCompte = false;
        } else {
            setNumCompteDomBankValidationColor('transparent');
            saveBoolNumCompte = true;
        }

        if (!useFormikDomBank.values.devise) {
            setDeviseDomBankValidationColor('#F6D6D6');
            saveBoolDevise = false;
        } else {
            setDeviseDomBankValidationColor('transparent');
            saveBoolDevise = true;
        }

        if (saveBoolbanque && saveBoolNumCompte && saveBoolDevise && saveBoolPays) {
            // Sauvegarde locale seulement (comme les associés)
            setRowModesModelDomBank({ ...rowModesModelDomBank, [selectedRowIdDomBank]: { mode: GridRowModes.View } });
            setDisableSaveBoutonDomBank(true);
            setDisableAddRowBoutonDomBank(false);
            toast.success("Informations sauvegardées");

            // Réinitialiser le formulaire
            useFormikDomBank.resetForm();
        } else {
            toast.error('Les champs en surbrillances sont obligatoires');
            setDisableAddRowBoutonDomBank(false);
        }
    };

    const handleOpenDialogConfirmDeleteAssocieRowDomBank = () => {
        setOpenDialogDeleteDomBankRow(true);
        setDisableAddRowBoutonDomBank(false);
    }

    const handleCancelClickDomBank = (id) => () => {
        setRowModesModelDomBank({
            ...rowModesModelDomBank,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBoutonDomBank(false);
    };

    const deleteDomBankRow = (value) => {
        if (value === true) {
            setListDomBank(listDomBank.filter((row) => row.id !== selectedRowIdDomBank[0]));
            setOpenDialogDeleteDomBankRow(false);
            setDisableAddRowBoutonDomBank(false);
            toast.success('Ligne supprimée avec succès');
        } else {
            setOpenDialogDeleteDomBankRow(false);
        }
    }

    const processRowUpdateDomBank = (setFieldValue) => (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setListDomBank(listDomBank.map((row) => (row.id === newRow.id ? updatedRow : row)));
        setFieldValue('listeDomBank', listDomBank.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChangeDomBank = (newRowModesModel) => {
        setRowModesModelDomBank(newRowModesModel);
    };

    const handleCellEditCommitDomBank = (params) => {
        if (selectedRowIdDomBank.length > 1 || selectedRowIdDomBank.length === 0) {
            setEditableRowDomBank(false);
            setDisableModifyBoutonDomBank(true);
            setDisableSaveBoutonDomBank(true);
            setDisableCancelBoutonDomBank(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
        } else {
            setDisableModifyBoutonDomBank(false);
            setDisableSaveBoutonDomBank(false);
            setDisableCancelBoutonDomBank(false);
            if (!selectedRowIdDomBank.includes(params.id)) {
                setEditableRowDomBank(false);
                toast.error("Sélectionnez une ligne pour pouvoir la modifier");
            } else {
                setEditableRowDomBank(true);
            }
        }
    };

    const handleCellEditCommitConsolidation = (params) => {
        if (selectedRowIdConsolidation.length > 1 || selectedRowIdConsolidation.length === 0) {
            setEditableRowConsolidation(false);
            setDisableModifyBoutonConsolidation(true);
            setDisableSaveBoutonConsolidation(true);
            setDisableCancelBoutonConsolidation(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
        } else {
            setDisableModifyBoutonConsolidation(false);
            setDisableSaveBoutonConsolidation(false);
            setDisableCancelBoutonConsolidation(false);
            if (!selectedRowIdConsolidation.includes(params.id)) {
                setEditableRowConsolidation(false);
                toast.error("Sélectionnez une ligne pour pouvoir la modifier");
            } else {
                setEditableRowConsolidation(true);
            }
        }
    };

    const handleRowEditStopDomBank = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    // Charger la liste des portefeuille
    const getAllPortefeuille = () => {
        axios.get(`/param/portefeuille/getAllPortefeuille/${compteId}`)
            .then(response => {
                const resData = response?.data;
                if (resData?.state) {
                    setListePortefeuille(resData?.list)
                } else {
                    toast.error(resData?.message);
                }
            })
    };

    //Entête tableau liste domiciliation bancaire
    const DomBankColumnHeader = [
        {
            field: 'banque',
            headerName: 'Banque',
            type: 'text',
            sortable: true,
            width: 350,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRowDomBank,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '120%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: bankDomBankValidationColor
                            }}
                            type="text"
                            value={useFormikDomBank.values.banque}
                            onChange={(e) => {
                                const v = e.target.value;
                                useFormikDomBank.setFieldValue('banque', v);
                                params.api.setEditCellValue({ id: params.id, field: params.field, value: v });
                            }}
                            label="banque"
                            disableUnderline={true}
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {useFormikDomBank.errors.banque && useFormikDomBank.touched.banque && useFormikDomBank.errors.banque}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'numcompte',
            headerName: 'N° de compte',
            type: 'text',
            sortable: true,
            width: 300,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRowDomBank,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '120%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: numCompteDomBankValidationColor
                            }}
                            type="text"
                            value={useFormikDomBank.values.numcompte}
                            onChange={(e) => {
                                const v = e.target.value;
                                useFormikDomBank.setFieldValue('numcompte', v);
                                params.api.setEditCellValue({ id: params.id, field: params.field, value: v });
                            }}
                            label="numcompte"
                            disableUnderline={true}
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {useFormikDomBank.errors.numcompte && useFormikDomBank.touched.numcompte && useFormikDomBank.errors.numcompte}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'devise',
            headerName: 'Devise',
            type: 'text',
            sortable: true,
            width: 120,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRowDomBank,
            renderCell: (params) => {
                return <div>{params.value}</div>;
            },
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '120%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: deviseDomBankValidationColor
                            }}
                            type="text"
                            value={useFormikDomBank.values.devise}
                            onChange={(e) => {
                                const v = e.target.value;
                                useFormikDomBank.setFieldValue('devise', v);
                                params.api.setEditCellValue({ id: params.id, field: params.field, value: v });
                            }}
                            label="devise"
                            disableUnderline={true}
                        />

                        <FormHelperText
                            style={{
                                color: 'red',
                                marginLeft: 0,
                                fontSize: "12px",
                            }}
                        >
                            {useFormikDomBank.errors.devise && useFormikDomBank.touched.devise && useFormikDomBank.errors.devise}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: "pays",
            headerName: "Pays",
            sortable: true,
            width: 250,
            headerAlign: "left",
            align: "left",
            headerClassName: "HeaderbackColor",
            editable: editableRowDomBank,
            // valueFormatter: (params) => {
            //     const selectedType = listPays.find((option) => option.code === params.value);
            //     return selectedType ? selectedType.nompays : params.value;
            // },
            renderEditCell: (params) => {
                return (
                    <Autocomplete
                        fullWidth
                        options={listPays}
                        getOptionLabel={(option) => option.nompays}
                        value={
                            listPays.find((option) => option.nompays === params.value) || null
                        }
                        onChange={(event, newValue) => {
                            params.api.setEditCellValue({
                                id: params.id,
                                field: params.field,
                                value: newValue ? newValue.nompays : "",
                            });
                            useFormikDomBank.setFieldValue('pays', newValue ? newValue.nompays : "");

                        }}
                        noOptionsText="Aucun pays trouvé"
                        renderInput={(paramsInput) => (
                            <TextField
                                {...paramsInput}
                                variant="standard"
                                error={
                                    Boolean(
                                        useFormikDomBank.touched.pays && useFormikDomBank.errors.pays
                                    )
                                }
                                helperText={
                                    useFormikDomBank.touched.pays && useFormikDomBank.errors.pays
                                }
                                sx={{
                                    "& .MuiInputBase-root": {
                                        height: 50,
                                        fontSize: 14,
                                    },
                                }}
                            />
                        )}
                    />
                );
            },
        },
        {
            field: 'enactivite',
            headerName: 'En activité',
            type: 'boolean',
            sortable: true,
            width: 150,
            headerAlign: 'center',
            headerClassName: 'HeaderbackColor',
            editable: editableRowDomBank,
            renderEditCell: (params) => {
                return (
                    <input
                        checked={Boolean(params.value)}
                        type="checkbox"
                        onChange={(e) => {
                            const v = e.target.checked;
                            useFormikDomBank.setFieldValue('enactivite', v);
                            params.api.setEditCellValue({ id: params.id, field: params.field, value: v });
                            setListDomBank(prev => prev.map(row => row.id === params.id ? { ...row, enactivite: v } : row));
                        }}
                    />
                );
            }
        },
    ];

    // Entête tableau consolidation
    const ConsolidationColumnHeader = [
        {
            field: 'idDossier',
            headerName: 'Dossier',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRowConsolidation,
            renderCell: (params) => {
                const dossier = listeDossier.find(
                    val => val.id === Number(params.value)
                );

                return <div>{dossier?.dossier || ''}</div>;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    api.setEditCellValue({
                        id,
                        field,
                        value: e.target.value,
                    });
                };

                const dossier = listeDossier.filter(
                    val => val.id === Number(value)
                );

                return (
                    <FormControl fullWidth>
                        <InputLabel id="select-compte-label">Choisir...</InputLabel>
                        <Select
                            labelId="select-compte-label"
                            value={value ?? ''}
                            onChange={handleChange}
                        >
                            {(availableDossier.length > 0 ? availableDossier : dossier)
                                .map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.dossier}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                );
            }
        },
    ];

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


    useEffect(() => {
        getAllPortefeuille();
    }, [compteId]);

    return (
        <Box
            sx={{
                paddingX: 3,
                paddingY: 2,
                backgroundColor: '#f1f3f7',
            }}
        >
            {/* MODAL POUR LA SUPPRESSION D'UNE LIGNE DU TABLEAU ASSOCIE */}
            {openDialogDeleteAssocieRow ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"} confirmationState={deleteAssocieRow} /> : null}

            {/* MODAL POUR LA SUPPRESSION D'UNE LIGNE DU TABLEAU FILIALE */}
            {openDialogDeleteFilialeRow ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"} confirmationState={deleteFilialeRow} /> : null}

            {/* MODAL POUR LA SUPPRESSION D'UNE LIGNE DU TABLEAU DOMICILIATION BANCAIRE */}
            {openDialogDeleteDomBankRow ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"} confirmationState={deleteDomBankRow} /> : null}

            {/* MODAL POUR LA SUPPRESSION D'UNE LIGNE DU TABLEAU FILIALE */}
            {openDialogDeleteConsolidationRow ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"} confirmationState={deleteConsolidationRow} /> : null}

            <Formik
                initialValues={InfosNewFileInitialValues}
                validationSchema={formInfosNewFileValidationSchema}
                onSubmit={(values) => {

                    // S'assurer que la valeur centrefisc est bien DGE ou CFISC (pas 'centre fiscale')
                    const payload = {
                        ...values,
                        centrefisc: values.centrefisc === 'CFISC' || values.centrefisc === 'DGE' ? values.centrefisc : (values.centrefisc === 'centre fiscale' ? 'CFISC' : 'DGE')
                    };
                    handlSubmitNewFile(payload);
                }}
            >
                {({ handleChange, handleSubmit, setFieldValue, resetForm, values, isValid, errors, setTouched, handleBlur, touched }) => {

                    const calculateValeurPart = (capital, nbrPart) => {
                        const numCapital = parseFloat(capital?.toString().replace(/\s/g, '').replace(',', '.')) || 0;
                        const numParts = parseFloat(nbrPart) || 0;
                        if (numParts === 0) return 0;
                        const valPart = numCapital / numParts;
                        const valPartFormatted = Number((valPart).toFixed(2));
                        return valPartFormatted;
                    };

                    return (
                        <Form style={{ width: '100%' }}>
                            <Stack width={"100%"} height={"85%"} spacing={2} alignItems={"flex-start"} justifyContent={"stretch"}>
                                <Stack width={"100%"} height={"30px"} spacing={2} alignItems={"center"} alignContent={"center"}
                                    direction={"row"} justifyContent={"right"}
                                >
                                    <Typography variant='h6' sx={{ color: "black", width: 'calc(100% - 120px)' }} align='left'>Paramétrages: CRM</Typography>
                                    <Button variant="contained"
                                        onClick={() => {
                                            if (!isValid) {
                                                const touchedFields = Object.keys(errors).reduce((acc, field) => {
                                                    acc[field] = true;
                                                    return acc;
                                                }, {});

                                                setTouched(touchedFields);

                                                const firstErrorField = fieldOrder.find(
                                                    field => errors[field]
                                                );

                                                if (firstErrorField) {
                                                    toast.error(errors[firstErrorField]);
                                                }

                                                return;
                                            }

                                            handleSubmit();
                                        }}
                                        style={{
                                            borderRadius: "0",
                                            height: '43px', marginLeft: "5px", width: '120px',
                                            textTransform: 'none', outline: 'none', border: 'none', backgroundColor: initial.theme
                                        }}
                                    >
                                        Enregistrer
                                    </Button>
                                </Stack>

                                <Box sx={{ width: '100%', typography: 'body1' }}>
                                    <TabContext value={value}>
                                        <Box>
                                            <TabList onChange={handleChangeTAB} aria-label="lab API tabs example" variant='scrollable'>
                                                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Infos société" value="1" />
                                                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Comptabilité" value="2" />
                                                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Fiscales" value="3" />
                                                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Associés" value="4" />
                                                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Filiales" value="5" />
                                                <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Domiciliations bancaires" value="6" />
                                                {values.consolidation === true ? <Tab style={{ textTransform: 'none', outline: 'none', border: 'none' }} label="Consolidation" value="7" /> : null}
                                            </TabList>
                                        </Box>

                                        <TabPanel value="1">
                                            <Stack width={"100%"} height={"100%"} spacing={1} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"} >
                                                <Accordion
                                                    elevation={0}
                                                    style={{
                                                        width: "100%",
                                                        borderBlockColor: "transparent",
                                                        borderRadius: '10px',
                                                        border: '0px'
                                                    }}
                                                    sx={{
                                                        width: '100%',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        boxShadow: 'none',
                                                        '&:before': {
                                                            display: 'none',
                                                        },
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        aria-controls="panel1-content"
                                                        id="panel1-header"
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0 8px',
                                                        }}
                                                        expandIcon={<MdExpandCircleDown size={35} style={{ color: '#37709c' }} />}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="flex-end" alignContent={'baseline'} style={{ marginLeft: '15px' }}>
                                                            <FaRectangleList size={35} style={{ color: '#37709c' }} />
                                                            <Typography sx={{ fontWeight: 'normal', fontSize: 20 }}>Coordonnées</Typography>
                                                        </Stack>
                                                    </AccordionSummary>

                                                    <AccordionDetails>
                                                        <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{
                                                                paddingInline: '25px',
                                                                paddingBottom: '20px'
                                                            }}
                                                        >
                                                            <Stack
                                                                direction={'row'}
                                                                alignItems={'flex-start'}
                                                                width={'100%'}
                                                                spacing={5}
                                                            >
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Nom du dossier *"
                                                                        name="nomdossier"
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.nomdossier}
                                                                        error={Boolean(touched.nomdossier && errors.nomdossier)}
                                                                        helperText={touched.nomdossier ? errors.nomdossier : ''}
                                                                    />
                                                                </Stack>

                                                                <Stack
                                                                    style={{
                                                                        width: '30%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Raison sociale *"
                                                                        name="raisonsociale"
                                                                        width={"50%"}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.raisonsociale}
                                                                        error={Boolean(touched.raisonsociale && errors.raisonsociale)}
                                                                        helperText={touched.raisonsociale ? errors.raisonsociale : ''}
                                                                    />
                                                                </Stack>
                                                            </Stack>

                                                            <Stack
                                                                direction={'row'}
                                                                alignItems={'flex-start'}
                                                                width={'100%'}
                                                                spacing={5}
                                                            >
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >

                                                                    <TextFieldComponent
                                                                        text="Dénomination"
                                                                        name="denomination"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.denomination}
                                                                        error={Boolean(touched.denomination && errors.denomination)}
                                                                        helperText={touched.denomination ? errors.denomination : ''}
                                                                    />
                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Numéro NIF"
                                                                        name="nif"
                                                                        width={200}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.nif}
                                                                        error={Boolean(touched.nif && errors.nif)}
                                                                        helperText={touched.nif ? errors.nif : ''}
                                                                    />
                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Numéro Statistique"
                                                                        name="stat"
                                                                        width={200}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.stat}
                                                                        error={Boolean(touched.stat && errors.stat)}
                                                                        helperText={touched.stat ? errors.stat : ''}
                                                                    />

                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Numéro RCS"
                                                                        name="rcs"
                                                                        width={200}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.rcs}
                                                                        error={Boolean(touched.rcs && errors.rcs)}
                                                                        helperText={touched.rcs ? errors.rcs : ''}
                                                                    />
                                                                </Stack>
                                                            </Stack>
                                                            <Stack
                                                                direction={'row'}
                                                                alignItems={'flex-start'}
                                                                width={'100%'}
                                                                spacing={5}
                                                            >
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Responsable"
                                                                        name="responsable"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.responsable}
                                                                        error={Boolean(touched.responsable && errors.responsable)}
                                                                        helperText={touched.responsable ? errors.responsable : ''}
                                                                    />
                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Expert comptable"
                                                                        name="expertcomptable"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.expertcomptable}
                                                                        error={Boolean(touched.expertcomptable && errors.expertcomptable)}
                                                                        helperText={touched.expertcomptable ? errors.expertcomptable : ''}
                                                                    />
                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Commissaire aux comptes"
                                                                        name="cac"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.cac}
                                                                        error={Boolean(touched.cac && errors.cac)}
                                                                        helperText={touched.cac ? errors.cac : ''}
                                                                    />
                                                                </Stack>
                                                            </Stack>

                                                        </Stack>

                                                    </AccordionDetails>
                                                </Accordion>

                                                <Accordion
                                                    elevation={0}
                                                    style={{
                                                        width: "100%",
                                                        borderBlockColor: "transparent",
                                                        borderRadius: '10px',
                                                        borderColor: 'transparent'
                                                    }}
                                                    sx={{
                                                        width: '100%',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        boxShadow: 'none',
                                                        '&:before': {
                                                            display: 'none',
                                                        },
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        aria-controls="panel1-content"
                                                        id="panel1-header"
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0 8px',
                                                        }}
                                                        expandIcon={<MdExpandCircleDown size={35} style={{ color: '#37709c' }} />}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="flex-end" style={{ marginLeft: '15px' }}>
                                                            <HiMiniDocumentText size={35} style={{ color: '#37709c' }} />
                                                            <Typography sx={{ fontWeight: 'normal', fontSize: 20 }}>Juridique</Typography>
                                                        </Stack>
                                                    </AccordionSummary>

                                                    <AccordionDetails>
                                                        <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{
                                                                paddingInline: '25px',
                                                                paddingBottom: '20px'
                                                            }}
                                                        >
                                                            <Stack
                                                                direction={'row'}
                                                                alignItems={'flex-end'}
                                                                width={'100%'}
                                                                spacing={5}
                                                            >
                                                                <Stack spacing={1}>
                                                                    <label htmlFor="forme" style={{ fontSize: 13, color: 'black' }}>Forme</label>
                                                                    <Field
                                                                        as={Select}
                                                                        required
                                                                        name='forme'
                                                                        type='text'
                                                                        placeholder=""
                                                                        onChange={handleOnChangeFormeSelect(setFieldValue)}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            width: 500,
                                                                            height: 40,
                                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none', // Supprime le cadre
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none', // Supprime le cadre
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none', // Supprime le cadre
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                        }}
                                                                    >
                                                                        {listeFormeJuridique.sort((a, b) => a.libelle.localeCompare(b.libelle)).map((item) => (
                                                                            <MenuItem key={item.id} value={item.id}>{item.libelle}</MenuItem>
                                                                        ))};
                                                                    </Field>
                                                                    <ErrorMessage name='forme' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                                </Stack>

                                                                <Stack spacing={1}>
                                                                    <label htmlFor="activite" style={{ fontSize: 13, color: 'black' }}>Activité</label>
                                                                    <Field
                                                                        as={Select}
                                                                        required
                                                                        name='activite'
                                                                        type='text'
                                                                        placeholder=""
                                                                        onChange={handleOnChangeActiviteSelect(setFieldValue)}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            width: 250,
                                                                            height: 40,
                                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none', // Supprime le cadre
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none', // Supprime le cadre
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none', // Supprime le cadre
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                        }}
                                                                    >
                                                                        {listeActivite.sort((a, b) => a.libelle.localeCompare(b.libelle)).map((item) => (
                                                                            <MenuItem key={item.id} value={item.id}>
                                                                                <Stack direction={'row'} spacing={2}
                                                                                    style={{ alignContent: 'center', alignItems: 'center' }}
                                                                                >
                                                                                    <Stack direction={'row'}>
                                                                                        {item.icon}
                                                                                    </Stack>

                                                                                    <Stack direction={'row'}>
                                                                                        {item.libelle}
                                                                                    </Stack>
                                                                                </Stack>

                                                                            </MenuItem>
                                                                        ))};
                                                                    </Field>
                                                                    <ErrorMessage name='activite' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                                </Stack>

                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Détails activités"
                                                                        name="detailsactivite"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.detailsactivite}
                                                                        error={Boolean(touched.detailsactivite && errors.detailsactivite)}
                                                                        helperText={touched.detailsactivite ? errors.detailsactivite : ''}
                                                                    />
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                    </AccordionDetails>
                                                </Accordion>

                                                <Accordion
                                                    elevation={0}
                                                    style={{
                                                        width: "100%",
                                                        borderBlockColor: "transparent",
                                                        borderRadius: '10px'
                                                    }}
                                                    sx={{
                                                        width: '100%',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        boxShadow: 'none',
                                                        '&:before': {
                                                            display: 'none',
                                                        },
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        aria-controls="panel1-content"
                                                        id="panel1-header"
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0 8px',
                                                        }}
                                                        expandIcon={<MdExpandCircleDown size={35} style={{ color: '#37709c' }} />}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="flex-end" style={{ marginLeft: '15px' }}>
                                                            <MdContacts size={35} style={{ color: '#37709c' }} />
                                                            <Typography sx={{ fontWeight: 'normal', fontSize: 20 }}>Contact</Typography>
                                                        </Stack>
                                                    </AccordionSummary>

                                                    <AccordionDetails>
                                                        <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{
                                                                paddingInline: '25px',
                                                                paddingBottom: '20px'
                                                            }}
                                                        >
                                                            <Stack
                                                                direction={'row'}
                                                                alignItems={'flex-start'}
                                                                width={'100%'}
                                                                spacing={5}
                                                            >
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Adresse"
                                                                        name="adresse"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.adresse}
                                                                        error={Boolean(touched.adresse && errors.adresse)}
                                                                        helperText={touched.adresse ? errors.adresse : ''}
                                                                    />
                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >
                                                                    <TextFieldComponent
                                                                        text="Email"
                                                                        name="email"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.email}
                                                                        error={Boolean(touched.email && errors.email)}
                                                                        helperText={touched.email ? errors.email : ''}
                                                                    />
                                                                </Stack>
                                                                <Stack
                                                                    style={{
                                                                        width: '20%'
                                                                    }}
                                                                >

                                                                    <TextFieldComponent
                                                                        text="Téléphone"
                                                                        name="telephone"
                                                                        width={400}
                                                                        handleChange={handleChange}
                                                                        handleBlur={handleBlur}
                                                                        values={values.telephone}
                                                                        error={Boolean(touched.telephone && errors.telephone)}
                                                                        helperText={touched.telephone ? errors.telephone : ''}
                                                                    />
                                                                </Stack>
                                                            </Stack>

                                                            <Stack direction="row" spacing={2}>
                                                                <Stack spacing={1}>
                                                                    <label htmlFor="province" style={{ fontSize: 13, color: 'black' }}>Province</label>
                                                                    <Field
                                                                        as={Select}
                                                                        name='province'
                                                                        onChange={(e) => {
                                                                            handleChange(e);
                                                                            getListeRegions(e.target.value);
                                                                            setFieldValue('region', '');
                                                                            setFieldValue('district', '');
                                                                            setFieldValue('commune', '');
                                                                        }}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            width: 200,
                                                                            height: 30,
                                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                        }}
                                                                    >
                                                                        {listProvinces.map((item) => (
                                                                            <MenuItem key={item.id} value={item.name}>
                                                                                {item.name}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Field>
                                                                    <ErrorMessage name='province' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                                </Stack>

                                                                <Stack spacing={1}>
                                                                    <label htmlFor="region" style={{ fontSize: 13, color: 'black' }}>Région</label>
                                                                    <Field
                                                                        as={Select}
                                                                        name='region'
                                                                        onChange={(e) => {
                                                                            handleChange(e);
                                                                            const province = values.province;
                                                                            getListeDistricts(province, e.target.value);
                                                                            setFieldValue('district', '');
                                                                            setFieldValue('commune', '');
                                                                        }}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            width: 200,
                                                                            height: 30,
                                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                        }}
                                                                    >
                                                                        {listRegions.map((item) => (
                                                                            <MenuItem key={item.id} value={item.name}>
                                                                                {item.name}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Field>
                                                                    <ErrorMessage name='region' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                                </Stack>
                                                                <Stack spacing={1}>
                                                                    <label htmlFor="district" style={{ fontSize: 13, color: 'black' }}>District</label>
                                                                    <Field
                                                                        as={Select}
                                                                        name='district'
                                                                        onChange={(e) => {
                                                                            handleChange(e);
                                                                            const province = values.province;
                                                                            const region = values.region;
                                                                            getListeCommunes(province, region, e.target.value);
                                                                            setFieldValue('commune', '');
                                                                        }}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            width: 200,
                                                                            height: 30,
                                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                        }}
                                                                    >
                                                                        {listDistricts.map((item) => (
                                                                            <MenuItem key={item.id} value={item.name}>
                                                                                {item.name}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Field>
                                                                    <ErrorMessage name='district' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                                </Stack>

                                                                <Stack spacing={1}>
                                                                    <label htmlFor="commune" style={{ fontSize: 13, color: 'black' }}>Commune</label>
                                                                    <Field
                                                                        as={Select}
                                                                        name='commune'
                                                                        onChange={handleChange}
                                                                        sx={{
                                                                            borderRadius: 0,
                                                                            width: 200,
                                                                            height: 30,
                                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderTop: 'none',
                                                                                borderLeft: 'none',
                                                                                borderRight: 'none',
                                                                                borderWidth: '0.5px'
                                                                            },
                                                                        }}
                                                                    >
                                                                        {listCommunes.map((item) => (
                                                                            <MenuItem key={item.id} value={item.name}>
                                                                                {item.name}
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Field>
                                                                    <ErrorMessage name='commune' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                                </Stack>
                                                                <Stack spacing={1}>
                                                                    <label htmlFor="pays" style={{ fontSize: 13, color: 'black' }}>Pays</label>
                                                                    <Autocomplete
                                                                        options={listPays}
                                                                        autoHighlight
                                                                        getOptionLabel={(option) => option.nompays || ''}
                                                                        isOptionEqualToValue={(option, value) =>
                                                                            option.code === value.code
                                                                        }
                                                                        value={
                                                                            listPays.find(p => p.code === values.pays) || null
                                                                        }
                                                                        onChange={(event, newValue) => {
                                                                            setFieldValue('pays', newValue ? newValue.code : '');
                                                                        }}
                                                                        renderInput={(params) => (
                                                                            <TextField
                                                                                {...params}
                                                                                name="pays"
                                                                                variant="standard"
                                                                                sx={{
                                                                                    width: 400,
                                                                                    '& .MuiInput-underline:before': {
                                                                                        borderBottomWidth: '0.5px'
                                                                                    },
                                                                                    '& .MuiInput-underline:after': {
                                                                                        borderBottomWidth: '0.5px'
                                                                                    },
                                                                                    '& .MuiFormHelperText-root': {
                                                                                        marginLeft: 0
                                                                                    },
                                                                                }}
                                                                                error={Boolean(touched.pays && errors.pays)}
                                                                                helperText={touched.pays ? errors.pays : ''}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>

                                                    </AccordionDetails>
                                                </Accordion>

                                                <Accordion
                                                    elevation={0}
                                                    style={{
                                                        width: "100%",
                                                        borderBlockColor: "transparent",
                                                        borderRadius: '10px'
                                                    }}
                                                    sx={{
                                                        width: '100%',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        boxShadow: 'none',
                                                        '&:before': {
                                                            display: 'none',
                                                        },
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        aria-controls="panel1-content"
                                                        id="panel1-header"
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0 8px',
                                                        }}
                                                        expandIcon={<MdExpandCircleDown size={35} style={{ color: '#37709c' }} />}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="flex-end" style={{ marginLeft: '15px' }}>
                                                            <MdOutlineSecurity size={35} style={{ color: '#37709c' }} />
                                                            <Typography sx={{ fontWeight: 'normal', fontSize: 20 }}>Sécurité</Typography>
                                                        </Stack>
                                                    </AccordionSummary>

                                                    <AccordionDetails>
                                                        <Stack width={"100%"} height={"100%"} spacing={2} alignItems={"flex-start"}
                                                            alignContent={"flex-start"} justifyContent={"stretch"} direction={"column"}
                                                            style={{
                                                                paddingInline: '25px',
                                                                paddingBottom: '20px'
                                                            }}
                                                        >
                                                            <PasswordField handleChange={handleChange} values={values} setFieldValue={setFieldValue} type={'ADD'} password={""} />
                                                        </Stack>

                                                    </AccordionDetails>
                                                </Accordion>
                                            </Stack>
                                        </TabPanel>

                                        <TabPanel value="2">
                                            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"}
                                            >
                                                <Stack spacing={5} direction={'row'}>
                                                    <div>
                                                        <label htmlFor="plancomptable" style={{ fontSize: 12, color: '#3FA2F6' }}>Plan comptable</label>
                                                        <Stack direction="row" spacing={4} alignItems="center">
                                                            <Field
                                                                as={Select}
                                                                required
                                                                name='plancomptable'
                                                                type='text'
                                                                placeholder=""
                                                                onChange={handleOnChangePlanComptableSelect(setFieldValue)}
                                                                sx={{
                                                                    borderRadius: 0,
                                                                    width: 300,
                                                                    height: 40,
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderTop: 'none', // Supprime le cadre
                                                                        borderLeft: 'none',
                                                                        borderRight: 'none',
                                                                        borderWidth: '0.5px'
                                                                    },
                                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                        borderTop: 'none', // Supprime le cadre
                                                                        borderLeft: 'none',
                                                                        borderRight: 'none',
                                                                        borderWidth: '0.5px'
                                                                    },
                                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                        borderTop: 'none', // Supprime le cadre
                                                                        borderLeft: 'none',
                                                                        borderRight: 'none',
                                                                        borderWidth: '0.5px'
                                                                    },
                                                                }}
                                                            >
                                                                <MenuItem key={0} value={0}><em>Aucun</em></MenuItem>
                                                                {listModel?.map((item) => (
                                                                    <MenuItem key={item.id} value={item.id}>{item.nom}</MenuItem>
                                                                ))};
                                                            </Field>
                                                            <ErrorMessage name='plancomptable' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                        </Stack>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="devisepardefaut" style={{ fontSize: 12, color: '#3FA2F6' }}>Devise par défaut</label>
                                                        <Stack direction="row" spacing={4} alignItems="center">
                                                            <RadioGroup
                                                                row
                                                                value={values.devisepardefaut}
                                                                onChange={(e) => setFieldValue("devisepardefaut", e.target.value)}
                                                                defaultValue={'MGA'}
                                                            >
                                                                <FormControlLabel
                                                                    value="MGA"
                                                                    control={<Radio />}
                                                                    label="MGA"
                                                                />
                                                                <FormControlLabel
                                                                    value="Autres"
                                                                    control={<Radio />}
                                                                    label="Autres"
                                                                />
                                                            </RadioGroup>
                                                            <ErrorMessage name='devisepardefaut' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                        </Stack>
                                                    </div>
                                                    <div>
                                                        <Stack spacing={0} direction={'row'}
                                                            style={{ alignItems: 'center', marginTop: 25 }}
                                                        >
                                                            <Field
                                                                required
                                                                values={values.consolidation}
                                                                name='consolidation'
                                                                type='checkbox'
                                                                placeholder=""
                                                                style={{
                                                                    height: 20, borderTop: 'none',
                                                                    borderLeft: 'none', borderRight: 'none',
                                                                    outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                                    width: 20, marginRight: 10,
                                                                }}
                                                            />
                                                            <label htmlFor="consolidation" style={{ fontSize: 15, color: 'black' }}>Consolidation</label>
                                                        </Stack>
                                                    </div>
                                                </Stack>

                                                <Typography style={{ fontWeight: 'bold', fontSize: "18px", marginLeft: "0px", marginTop: "50px" }}>Paramétrages de longueur des comptes</Typography>

                                                <Stack width={"100%"} height={"30px"} spacing={10} alignItems={"center"}
                                                    alignContent={"center"} justifyContent={"stretch"} direction={"row"}
                                                    style={{ marginLeft: "0px" }}
                                                >
                                                    <Stack spacing={1}>
                                                        <label htmlFor="longueurcptstd" style={{ fontSize: 12, color: '#3FA2F6' }}>Compte standard</label>
                                                        <Field
                                                            required
                                                            name='longueurcptstd'
                                                            onChange={handleChange}
                                                            type='text'
                                                            placeholder=""
                                                            style={{
                                                                height: 22, borderTop: 'none',
                                                                borderLeft: 'none', borderRight: 'none',
                                                                outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                                width: '200px'
                                                            }}
                                                        />
                                                        <ErrorMessage name='longueurcptstd' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>

                                                    <Stack spacing={1}>
                                                        <label htmlFor="longueurcptaux" style={{ fontSize: 12, color: '#3FA2F6' }}>Compte auxiliaire</label>
                                                        <Field
                                                            required
                                                            name='longueurcptaux'
                                                            onChange={handleChange}
                                                            type='text'
                                                            placeholder=""
                                                            style={{
                                                                height: 22, borderTop: 'none',
                                                                borderLeft: 'none', borderRight: 'none',
                                                                outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                                width: '200px',
                                                            }}
                                                        />
                                                        <ErrorMessage name='longueurcptaux' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>

                                                    <Stack spacing={0} direction={'row'}
                                                        style={{ alignItems: 'center', marginTop: 25 }}
                                                    >
                                                        <Field
                                                            required
                                                            name='autocompletion'
                                                            type='checkbox'
                                                            placeholder=""
                                                            style={{
                                                                height: 20, borderTop: 'none',
                                                                borderLeft: 'none', borderRight: 'none',
                                                                outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                                width: 20, marginRight: 10
                                                            }}
                                                        />
                                                        <label htmlFor="autocompletion" style={{ fontSize: 15, color: 'black' }}>Auto-complétion</label>
                                                        <ErrorMessage name='autocompletion' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>
                                                </Stack>

                                                <Stack spacing={0} direction={'row'}
                                                    style={{ alignItems: 'center', marginTop: 40 }}
                                                >
                                                    <Field
                                                        required
                                                        name='avecanalytique'
                                                        type='checkbox'
                                                        placeholder=""
                                                        style={{
                                                            height: 20, borderTop: 'none',
                                                            borderLeft: 'none', borderRight: 'none',
                                                            outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                            width: 20, marginRight: 10,
                                                        }}
                                                    />
                                                    <label htmlFor="avecanalytique" style={{ fontSize: 15, color: 'black' }}>Avec analytique</label>
                                                    <ErrorMessage name='avecanalytique' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                </Stack>

                                                {/* Immobilisation */}
                                                <Typography style={{ fontWeight: 'bold', fontSize: "18px", marginLeft: "0px", marginTop: "20px" }}>Immobilisation</Typography>
                                                <Stack spacing={1} sx={{ mt: 1 }}>
                                                    <Stack direction="row" spacing={4} alignItems="center">
                                                        <Typography style={{ fontSize: "14px", marginLeft: 0 }}>Base de calcul de l'amort (en jours)</Typography>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Field type="radio" name="immo_amort_base_jours" value="365" /> 365 jours
                                                        </label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Field type="radio" name="immo_amort_base_jours" value="360" /> 360 jours
                                                        </label>
                                                    </Stack>
                                                    <ErrorMessage name='immo_amort_base_jours' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                </Stack>

                                                <Stack spacing={1} style={{ width: "50%" }}>
                                                    <label htmlFor="portefeuille" style={{ fontSize: 12, color: '#3FA2F6' }}>Portefeuille</label>
                                                    <Autocomplete
                                                        multiple
                                                        id="checkboxes-tags-demo"
                                                        options={listePortefeuille}
                                                        disableCloseOnSelect
                                                        getOptionLabel={(option) => option.nom}
                                                        onChange={(_event, newValue) => {
                                                            setFieldValue("portefeuille", newValue);
                                                        }}
                                                        value={values.portefeuille || []}
                                                        renderOption={(props, option, { selected }) => {
                                                            const { key, ...optionProps } = props;
                                                            return (
                                                                <li
                                                                    key={key}
                                                                    {...optionProps}
                                                                    style={{
                                                                        paddingBottom: 2,
                                                                        paddingLeft: 4,
                                                                        paddingRight: 4,
                                                                        fontSize: "0.8rem",
                                                                        display: "flex",
                                                                        alignItems: "center"
                                                                    }}
                                                                >
                                                                    <Checkbox
                                                                        icon={icon}
                                                                        checkedIcon={checkedIcon}
                                                                        style={{ marginRight: 8 }}
                                                                        checked={selected}
                                                                    />
                                                                    {option.nom}
                                                                </li>
                                                            );
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                variant="standard"
                                                            />
                                                        )}
                                                    />
                                                    <ErrorMessage name='portefeuille' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                </Stack>

                                                <Stack spacing={1}>
                                                    <Typography
                                                        style={{ fontWeight: 'bold', fontSize: "18px", marginLeft: "0px", marginTop: "5px" }}
                                                    >
                                                        Type de comptabilité
                                                    </Typography>

                                                    <Stack direction="row" spacing={4} alignItems="center">
                                                        <RadioGroup
                                                            row
                                                            value={values.typecomptabilite}
                                                            onChange={(e) => setFieldValue("typecomptabilite", e.target.value)}
                                                            defaultValue={'Français'}
                                                        >
                                                            <FormControlLabel
                                                                value="Français"
                                                                control={<Radio />}
                                                                label="Français"
                                                            />
                                                            <FormControlLabel
                                                                value="Autres"
                                                                control={<Radio />}
                                                                label="Autres"
                                                            />
                                                        </RadioGroup>
                                                        <ErrorMessage name='typecomptabilite' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>
                                                </Stack>

                                            </Stack>
                                        </TabPanel>

                                        <TabPanel value="3">
                                            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"} alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"20px"}>
                                                <Typography style={{ fontWeight: 'bold', fontSize: "18px", marginLeft: "0px", marginTop: "5px" }}>Impôt sur le revenu (IR)</Typography>

                                                {/* Bloc radio DGE / centre fiscale */}
                                                <Stack direction="column" spacing={1} sx={{ mt: 2, mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#888' }}>Type de centre fiscal</Typography>
                                                    <Stack direction="row" spacing={4} alignItems="center">
                                                        <FormControlLabel
                                                            control={<Field type="radio" name="centrefisc" value="DGE" as="input" />}
                                                            label={<span style={{ fontWeight: values.centrefisc === 'DGE' ? 600 : 400 }}>DGE</span>}
                                                        />
                                                        <FormControlLabel
                                                            control={<Field type="radio" name="centrefisc" value="CFISC" as="input" />}
                                                            label={<span style={{ fontWeight: values.centrefisc === 'CFISC' ? 600 : 400 }}>centre fiscale</span>}
                                                        />
                                                    </Stack>
                                                </Stack>

                                                <Stack spacing={1}>
                                                    <label htmlFor="tauxir" style={{ fontSize: 12, color: '#3FA2F6' }}>Taux IR</label>
                                                    <Field
                                                        required
                                                        name='tauxir'
                                                        onChange={handleChange}
                                                        type='text'
                                                        placeholder=""
                                                        style={{
                                                            height: 22, borderTop: 'none',
                                                            borderLeft: 'none', borderRight: 'none',
                                                            outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                            width: '100px',
                                                        }}
                                                    />
                                                    <ErrorMessage name='tauxir' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                </Stack>

                                                <Typography style={{ fontWeight: 'bold', fontSize: "14px", marginLeft: "0px", marginTop: "30px" }}>Paramétrages minimum de perception</Typography>

                                                <Stack width={"100%"} height={"30px"} spacing={10} alignItems={"center"}
                                                    alignContent={"center"} justifyContent={"stretch"} direction={"row"}
                                                    style={{ marginLeft: "0px" }}
                                                >
                                                    <Stack spacing={1}>
                                                        <label htmlFor="pourcentageca" style={{ fontSize: 12, color: '#3FA2F6' }}>Pourcentage CA</label>
                                                        <Field
                                                            required
                                                            name='pourcentageca'
                                                            onChange={handleChange}
                                                            type='text'
                                                            placeholder=""
                                                            style={{
                                                                height: 22, borderTop: 'none',
                                                                borderLeft: 'none', borderRight: 'none',
                                                                outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                                width: '100px'
                                                            }}
                                                        />
                                                        <ErrorMessage name='pourcentageca' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>

                                                    <Stack spacing={1}>
                                                        <label htmlFor="montantmin" style={{ fontSize: 12, color: '#3FA2F6' }}>Montant minimum</label>
                                                        <Field
                                                            required
                                                            name='montantmin'
                                                            onChange={handleChange}
                                                            type='number'
                                                            placeholder=""
                                                            style={{
                                                                height: 22, borderTop: 'none',
                                                                borderLeft: 'none', borderRight: 'none',
                                                                outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                                width: '150px', textAlign: 'right',
                                                            }}
                                                        />
                                                        <ErrorMessage name='montantmin' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>
                                                </Stack>

                                                <Typography style={{ fontWeight: 'bold', fontSize: "18px", marginLeft: "0px", marginTop: "50px" }}>Taxe sur la valeur ajoutée (TVA)</Typography>

                                                <Stack spacing={0} direction={'row'}
                                                    style={{ alignItems: 'center', marginTop: 20 }}
                                                >
                                                    <Field
                                                        required
                                                        name='assujettitva'
                                                        type='checkbox'
                                                        placeholder=""
                                                        style={{
                                                            height: 20, borderTop: 'none',
                                                            borderLeft: 'none', borderRight: 'none',
                                                            outline: 'none', fontSize: 14, borderWidth: '0.5px',
                                                            width: 20, marginRight: 10,
                                                        }}
                                                    />
                                                    <label htmlFor="assujettitva" style={{ fontSize: 15, color: 'black' }}>Assujettie à la TVA</label>
                                                    <ErrorMessage name='assujettitva' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                </Stack>
                                            </Stack>
                                        </TabPanel>

                                        <TabPanel value="4">
                                            <Stack width={"100%"} height={"100%"} spacing={6} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"} marginLeft={"20px"}
                                            >
                                                <Stack width={"100%"} height={"30px"} spacing={10} alignItems={"center"}
                                                    alignContent={"center"} justifyContent={"stretch"} direction={"row"}
                                                >
                                                    <Stack spacing={1}>
                                                        <label htmlFor="montantcapital" style={{ fontSize: 12, color: '#3FA2F6' }}>Capitale</label>
                                                        <MontantCapitalField setFieldValue={setFieldValue} calculateValeurPart={calculateValeurPart} values={values} />
                                                        <ErrorMessage name='montantcapital' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>

                                                    <Stack spacing={1}>
                                                        <label htmlFor="nbrpart" style={{ fontSize: 12, color: '#3FA2F6' }}>Nombre parts</label>
                                                        <Field
                                                            required
                                                            name='nbrpart'
                                                            onChange={(e) => {
                                                                // handleChange(e);
                                                                const nbrPartValue = e.target.value;
                                                                const nbrPartFormatted = Number(nbrPartValue);
                                                                setFieldValue('nbrpart', nbrPartFormatted);
                                                                const newValeurPart = calculateValeurPart(values.montantcapital, nbrPartFormatted);
                                                                setFieldValue('valeurpart', newValeurPart);
                                                            }}
                                                            type='text'
                                                            placeholder=""
                                                            style={{
                                                                height: 22,
                                                                borderTop: 'none',
                                                                borderLeft: 'none',
                                                                borderRight: 'none',
                                                                outline: 'none',
                                                                fontSize: 14,
                                                                borderWidth: '0.5px',
                                                                width: '100px',
                                                                textAlign: "right",
                                                            }}
                                                        />
                                                        <ErrorMessage name='nbrpart' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>

                                                    <Stack spacing={1}>
                                                        <label htmlFor="valeurpart" style={{ fontSize: 12, color: '#3FA2F6' }}>Valeur d'une part</label>
                                                        <Field name="valeurpart">
                                                            {({ field }) => {
                                                                const numericValue = parseFloat(field.value?.toString().replace(/\s/g, '').replace(',', '.')) || 0;
                                                                const formattedValue = numericValue.toLocaleString("fr-FR", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                });

                                                                return (
                                                                    <input
                                                                        {...field}
                                                                        type="text"
                                                                        disabled
                                                                        value={formattedValue}
                                                                        style={{
                                                                            height: 22,
                                                                            borderTop: 'none',
                                                                            borderLeft: 'none',
                                                                            borderRight: 'none',
                                                                            outline: 'none',
                                                                            fontSize: 14,
                                                                            borderWidth: '0.5px',
                                                                            width: '120px',
                                                                            textAlign: 'right',
                                                                            color: 'black'
                                                                        }}
                                                                    />
                                                                );
                                                            }}
                                                        </Field>
                                                        <ErrorMessage name='valeurpart' component="div" style={{ color: 'red', fontSize: 12, marginTop: -2 }} />
                                                    </Stack>

                                                </Stack>

                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}
                                                >
                                                    <Tooltip title="Ajouter une ligne">
                                                        <span>
                                                            <IconButton
                                                                variant="contained"
                                                                onClick={handleOpenDialogAddNewAssocie}
                                                                disabled={disableAddRowBouton}
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
                                                                disabled={disableModifyBouton}
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
                                                                disabled={disableSaveBouton}
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
                                                                disabled={disableDeleteBouton}
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

                                                <Stack
                                                    width={"100%"}
                                                    height={"500px"}
                                                >
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
                                                        rows={listAssocie}
                                                        onRowClick={(e) => handleCellEditCommit(e.row)}
                                                        onRowSelectionModelChange={ids => {
                                                            setSelectedRowAssocie(ids)
                                                            saveSelectedRow(ids);
                                                            deselectRowAssocie(ids);
                                                        }}
                                                        editMode='row'
                                                        rowModesModel={rowModesModel}
                                                        onRowModesModelChange={handleRowModesModelChange}
                                                        onRowEditStop={handleRowEditStop}
                                                        processRowUpdate={processRowUpdate(setFieldValue)}

                                                        columns={AssocieColumnHeader}
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
                                                        rowSelectionModel={selectedRowAssocie}
                                                        onCellKeyDown={handleCellKeyDown}
                                                    />
                                                </Stack>
                                            </Stack>
                                        </TabPanel>

                                        <TabPanel value="5">
                                            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"}
                                            >
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}
                                                >
                                                    <Tooltip title="Ajouter une ligne">
                                                        <span>
                                                            <IconButton
                                                                disabled={disableAddRowBoutonFiliale}
                                                                variant="contained"
                                                                onClick={handleOpenDialogAddNewFiliale}
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
                                                                disabled={disableModifyBoutonFiliale}
                                                                variant="contained"
                                                                onClick={handleEditClickFiliale(selectedRowIdFiliale)}
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
                                                                disabled={disableSaveBoutonFiliale}
                                                                variant="contained"
                                                                onClick={handleSaveClickFiliale(setFieldValue)}
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
                                                                disabled={disableCancelBoutonFiliale}
                                                                variant="contained"
                                                                onClick={handleCancelClickFiliale(selectedRowIdFiliale)}
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
                                                                disabled={disableDeleteBoutonFiliale}
                                                                onClick={handleOpenDialogConfirmDeleteAssocieRowFiliale}
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

                                                <Stack
                                                    width={"100%"}
                                                    height={"500px"}
                                                >
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
                                                        rows={listFiliales}
                                                        onRowClick={(e) => handleCellEditCommitFiliale(e.row)}
                                                        onRowSelectionModelChange={ids => {
                                                            setSelectedRowFiliales(ids);
                                                            saveSelectedRowFiliale(ids);
                                                            deselectRowFiliale(ids);
                                                        }}
                                                        editMode='row'
                                                        rowModesModel={rowModesModelFiliale}
                                                        onRowModesModelChange={handleRowModesModelChangeFiliale}
                                                        onRowEditStop={handleRowEditStopFiliale}
                                                        processRowUpdate={processRowUpdateFiliale(setFieldValue)}

                                                        columns={FilialeColumnHeader}
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
                                                        rowSelectionModel={selectedRowFiliales}
                                                        onCellKeyDown={handleCellKeyDown}
                                                    />
                                                </Stack>

                                            </Stack>
                                        </TabPanel>

                                        <TabPanel value="6">
                                            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"} >
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}
                                                >
                                                    <Tooltip title="Ajouter une ligne">
                                                        <span>
                                                            <IconButton
                                                                disabled={disableAddRowBouton}
                                                                variant="contained"
                                                                onClick={handleOpenDialogAddNewDomBank}
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
                                                                disabled={disableModifyBouton}
                                                                variant="contained"
                                                                onClick={handleEditClickDomBank(selectedRowIdDomBank)}
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
                                                                disabled={disableSaveBouton}
                                                                variant="contained"
                                                                onClick={handleSaveClickDomBank(selectedRowIdDomBank)}
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
                                                                onClick={handleCancelClickDomBank(selectedRowIdDomBank)}
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
                                                                disabled={disableDeleteBouton}
                                                                onClick={handleOpenDialogConfirmDeleteAssocieRowDomBank}
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

                                                <Stack width={"100%"} height={'60vh'}>
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
                                                        rows={Array.isArray(listDomBank) ? listDomBank : []}
                                                        onRowClick={(e) => handleCellEditCommitDomBank(e.row)}
                                                        onRowSelectionModelChange={ids => {
                                                            setSelectedRowDomBank(ids);
                                                            saveSelectedRowDomBank(ids);
                                                            deselectRow(ids);
                                                        }}
                                                        rowSelectionModel={selectedRowDomBank}

                                                        editMode='row'
                                                        selectionModel={selectedRowIdDomBank}
                                                        rowModesModel={rowModesModelDomBank}
                                                        onRowModesModelChange={handleRowModesModelChangeDomBank}
                                                        onRowEditStop={handleRowEditStopDomBank}
                                                        processRowUpdate={processRowUpdateDomBank(setFieldValue)}

                                                        columns={DomBankColumnHeader}
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
                                                        onCellKeyDown={handleCellKeyDown}
                                                    />
                                                </Stack>

                                            </Stack>
                                        </TabPanel>

                                        <TabPanel value="7">
                                            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                                                alignContent={"flex-start"} justifyContent={"stretch"}
                                            >
                                                <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                                                    direction={"row"} justifyContent={"right"}
                                                >
                                                    <Tooltip title="Ajouter une ligne">
                                                        <span>
                                                            <IconButton
                                                                disabled={disableAddRowBoutonConsolidation || availableDossier.length === 0}
                                                                variant="contained"
                                                                onClick={handleOpenDialogAddNewConsolidation}
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
                                                                disabled={disableModifyBoutonConsolidation}
                                                                variant="contained"
                                                                onClick={handleEditClickConsolidation(selectedRowIdConsolidation)}
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
                                                                disabled={disableSaveBoutonConsolidation}
                                                                variant="contained"
                                                                onClick={handleSaveClickConsolidation(setFieldValue)}
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
                                                                disabled={disableCancelBoutonConsolidation}
                                                                variant="contained"
                                                                onClick={handleCancelClickConsolidation(selectedRowIdConsolidation)}
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
                                                                disabled={disableDeleteBoutonConsolidation}
                                                                onClick={handleOpenDialogConfirmDeleteConsolidationRow}
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

                                                <Stack
                                                    width={"100%"}
                                                    height={"500px"}
                                                >
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
                                                        rows={listConsolidation}
                                                        onRowClick={(e) => handleCellEditCommitConsolidation(e.row)}
                                                        onRowSelectionModelChange={ids => {
                                                            setSelectedRowConsolidations(ids);
                                                            saveSelectedRowConsolidation(ids);
                                                            deselectRowConsolidation(ids);
                                                        }}
                                                        editMode='row'
                                                        rowModesModel={rowModesModelConsolidation}
                                                        onRowModesModelChange={handleRowModesModelChangeConsolidation}
                                                        onRowEditStop={handleRowEditStopConsolidation}
                                                        processRowUpdate={processRowUpdateConsolidation(setFieldValue)}

                                                        columns={ConsolidationColumnHeader}
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
                                                        rowSelectionModel={selectedRowConsolidations}
                                                        onCellKeyDown={handleCellKeyDown}
                                                    />
                                                </Stack>

                                            </Stack>
                                        </TabPanel>

                                    </TabContext>
                                </Box>
                            </Stack>
                        </Form>
                    );
                }}
            </Formik>
        </Box>
    )
}
