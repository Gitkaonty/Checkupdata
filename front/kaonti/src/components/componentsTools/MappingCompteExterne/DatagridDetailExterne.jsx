import { useState, useEffect } from 'react';
import {
    Typography, Stack, FormControl,
    InputLabel, Select, MenuItem,
    FormHelperText,
    Input,
    Checkbox
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import toast from 'react-hot-toast';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { useFormik } from 'formik';
import * as Yup from "yup";
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from 'react-icons/vsc';
import { TfiSave } from 'react-icons/tfi';
import { init } from '../../../../init';
import axios from '../../../../config/axios';
import QuickFilter, { DataGridStyle } from '../DatagridToolsStyle';
import PopupConfirmDelete from '../popupConfirmDelete';
import useAxiosPrivate from '../../../../config/axiosPrivate';

const DatagridDetailExterne = ({ compteId, fileId, exerciceId, id_etat, rubriqueId, nature, rubriqueData, typeRubrique, isCompteRubriqueRefreshed, setIsCompteRubriqueRefreshed, canModify, canAdd, canDelete, canView }) => {
    const apiRef = useGridApiRef();
    const axiosPrivate = useAxiosPrivate();
    let initial = init[0];
    const DataDetail = rubriqueData;
    const [compteRubriqueData, setCompteRubriqueData] = useState([]);

    const [editableRow, setEditableRow] = useState(true);

    const [compteValidationColor, setCompteValidationColor] = useState('transparent');
    const [idEtatValidationColor, setIdEtatValidationColor] = useState('transparent');
    const [equationValidationColor, setEquationValidationColor] = useState('transparent');

    const [selectedRow, setSelectedRow] = useState([]);

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(true);

    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const [disableDefaultFieldModif, setDisableDefaultFieldModif] = useState(false);

    const getListeCompteRubriqueAfterUpdating = () => {
        const choixPoste = nature;
        const tableau = id_etat;
        axios.post(`/paramRubriqueExterne/getCompteRubriqueExterne`, { compteId, fileId, exerciceId, tableau, choixPoste, rubriqueId }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setCompteRubriqueData(resData.liste);
            } else {
                toast.error(resData.msg);
            }
        });
    }

    useEffect(() => {
        getListeCompteRubriqueAfterUpdating();
    }, [isCompteRubriqueRefreshed])

    useEffect(() => {
        if (rubriqueId === 0 || !rubriqueId) {
            setDisableAddRowBouton(true);
        } else {
            setDisableAddRowBouton(false);
        }
    }, [rubriqueId]);

    useEffect(() => {
        setCompteRubriqueData(DataDetail);
    }, [rubriqueData]);

    const sensCalcul = [
        { value: 'D-C', label: 'Débit - Crédit' },
        { value: 'C-D', label: 'Crédit - Débit' },
    ];

    const condition = [
        { value: 'SOLDE', label: 'Solde' },
        { value: 'SiD', label: 'Si débiteur' },
        { value: 'SiC', label: 'Si créditeur' },
    ];

    const equation = [
        { value: 'ADDITIF', label: 'Additif' },
        { value: 'SOUSTRACTIF', label: 'Soustractif' },
    ];

    const tableau = [
        { value: 'BILAN_ACTIF', label: 'Bilan actif' },
        { value: 'BILAN_PASSIF', label: 'Bilan passif' },
        { value: 'CRN', label: 'Crn' },
        { value: 'CRF', label: 'Crf' },
        { value: 'TFTD', label: 'Tftd' },
        { value: 'TFTI', label: 'Tfti' },
        { value: 'SIG', label: 'Sig' },
    ]

    //formulaire pour la sauvegarde
    const formNewParam = useFormik({
        initialValues: {
            idParam: 0,
            compteId: compteId,
            fileId: fileId,
            exerciceId: exerciceId,
            id_etat: '',
            tableau: '',
            rubriqueId: rubriqueId,
            nature: nature,
            compte: '',
            senscalcul: '',
            condition: '',
            equation: '',
            par_default: true,
            active: true,
        },
        validationSchema: Yup.object({
            senscalcul: Yup.string().required("Ce champ est obligatoire"),
            condition: Yup.string().required("Ce champ est obligatoire"),
            equation: Yup.string().required("Ce champ est obligatoire")
        }),
        onSubmit: (values) => {

        },
        validateOnChange: false,
        validateOnBlur: true,
    });

    const handleChangeCompte = (value) => {
        formNewParam.setFieldValue('compte', value);
    }

    const handleChangeSensCalcul = (value) => {
        formNewParam.setFieldValue('senscalcul', value);
    }

    const handleChangeCondition = (value) => {
        formNewParam.setFieldValue('condition', value);
    }

    const handleChangeEquation = (value) => {
        formNewParam.setFieldValue('equation', value);
    }

    const handleChangeTableau = (value) => {
        formNewParam.setFieldValue('tableau', value);
    }

    const columnHeader = [
        {
            field: 'compte',
            headerName: 'Compte/Rubrique',
            type: 'string',
            sortable: true,
            flex: 3.3,
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
                                backgroundColor: compteValidationColor
                            }}
                            type="text"
                            value={formNewParam.values.compte}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                handleChangeCompte(value);
                            }}
                            label="libelle"
                            disableUnderline={true}
                            disabled={disableDefaultFieldModif}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'tableau',
            headerName: 'Tableau',
            type: 'text',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const typesAvecIdEtat = ['RUBRIQUE', 'TITRE', 'TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'SOUS-RUBRIQUE'];

                if (typesAvecIdEtat.includes(typeRubrique)) {
                    const selectedType = tableau.find(option => option.value === id_etat);
                    return selectedType ? selectedType.label : id_etat;
                } else {
                    const selectedType = tableau
                        ?.filter(val => {
                            if (val.value === id_etat) return false;
                            if (id_etat === 'TFTD' && val.value === 'TFTI') return false;
                            if (id_etat === 'TFTI' && val.value === 'TFTD') return false;
                            return true;
                        })
                        .find(option => option.value === params.value);

                    return selectedType ? selectedType.label : params.value;
                }
            },
            renderEditCell: (params) => {
                const typesAvecIdEtat = ['RUBRIQUE', 'TITRE', 'TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'SOUS-RUBRIQUE'];

                const options = typesAvecIdEtat.includes(typeRubrique)
                    ? tableau.filter(val => val.value === id_etat) 
                    : tableau.filter(val => {
                        if (val.value === id_etat) return false;
                        if (id_etat === 'TFTD' && val.value === 'TFTI') return false;
                        if (id_etat === 'TFTI' && val.value === 'TFTD') return false; 
                        return true;
                    });

                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            disabled={disableDefaultFieldModif}
                            style={{ backgroundColor: idEtatValidationColor }}
                            value={formNewParam.values.tableau}
                            onChange={(e) => handleChangeTableau(e.target.value)}
                            label="tableau"
                        >
                            {options.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText style={{ color: 'red' }}>
                            {formNewParam.errors.tableau && formNewParam.touched.tableau && formNewParam.errors.tableau}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'senscalcul',
            headerName: 'Sens calcul',
            type: 'singleSelect',
            sortable: true,
            flex: 3.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = sensCalcul?.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.label;
            },

            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            disabled={disableDefaultFieldModif || (typeRubrique === "SOUS-TOTAL" || typeRubrique === "TOTAL" || typeRubrique === "TOTAL SOUS-RUBRIQUES" || typeRubrique === 'LIAISON' || typeRubrique === 'LIAISON VAR ACTIF' || typeRubrique === 'LIAISON VAR PASSIF' || typeRubrique === 'LIAISON N1')}
                            value={formNewParam.values.senscalcul}
                            onChange={(e) => handleChangeSensCalcul(e.target.value)}
                            label="sensCalucl"
                        >
                            {sensCalcul?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText style={{ color: 'red' }}>
                            {formNewParam.errors.compte && formNewParam.touched.compte && formNewParam.errors.compte}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'condition',
            headerName: 'Condtion',
            type: 'singleSelect',
            sortable: true,
            flex: 3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = condition?.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.label;
            },
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            disabled={disableDefaultFieldModif || (typeRubrique === "SOUS-TOTAL" || typeRubrique === "TOTAL" || typeRubrique === "TOTAL SOUS-RUBRIQUES" || typeRubrique === 'LIAISON' || typeRubrique === 'LIAISON VAR ACTIF' || typeRubrique === 'LIAISON VAR PASSIF' || typeRubrique === 'LIAISON N1')}
                            value={formNewParam.values.condition}
                            onChange={(e) => handleChangeCondition(e.target.value)}
                            label="sensCalucl"
                        >
                            {condition?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText style={{ color: 'red' }}>
                            {formNewParam.errors.condition && formNewParam.touched.condition && formNewParam.errors.condition}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'equation',
            headerName: 'Opération',
            type: 'text',
            sortable: true,
            flex: 2.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = equation?.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.label;
            },

            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth>
                        <InputLabel><em>Choisir...</em></InputLabel>
                        <Select
                            disabled={disableDefaultFieldModif}
                            style={{ backgroundColor: equationValidationColor }}
                            value={formNewParam.values.equation}
                            onChange={(e) => handleChangeEquation(e.target.value)}
                            label="equation"
                        >
                            {equation?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText style={{ color: 'red' }}>
                            {formNewParam.errors.equation && formNewParam.touched.equation && formNewParam.errors.equation}
                        </FormHelperText>
                    </FormControl>
                );
            },
        },
        {
            field: 'active',
            headerName: 'Activé',
            type: 'boolean',
            sortable: true,
            flex: 2,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: (params) => {
                return (
                    <Checkbox
                        checked={formNewParam.values.active}
                        type="checkbox"
                        onChange={(e) => handleCheckboxChange(e.target.checked)}
                    />
                );
            },
        },
        {
            field: 'par_default',
            headerName: 'Par défaut',
            type: 'boolean',
            sortable: true,
            flex: 2.5,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            editable: false
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
        setCompteValidationColor('transparent');
        setEquationValidationColor('transparent');
        setIdEtatValidationColor('transparent');
        const selectedRowInfos = compteRubriqueData?.filter((item) => item.id === id[0]);

        //rendre inaccessible les champs si des champs de paramétrages par défaut       
        if (selectedRowInfos[0]?.par_default) {
            setDisableDefaultFieldModif(true);
        } else {
            setDisableDefaultFieldModif(false);
        }

        formNewParam.setFieldValue("idParam", selectedRowInfos[0]?.id ? selectedRowInfos[0]?.id : 0);
        formNewParam.setFieldValue("compte", selectedRowInfos[0]?.compte ? selectedRowInfos[0]?.compte : '');
        formNewParam.setFieldValue("nature", selectedRowInfos[0]?.nature ? selectedRowInfos[0].nature : nature);
        formNewParam.setFieldValue("senscalcul", selectedRowInfos[0]?.senscalcul ? selectedRowInfos[0]?.senscalcul : '');
        formNewParam.setFieldValue("tableau", selectedRowInfos[0]?.tableau ? selectedRowInfos[0]?.tableau : '');
        formNewParam.setFieldValue("condition", selectedRowInfos[0]?.condition ? selectedRowInfos[0]?.condition : '');
        formNewParam.setFieldValue("equation", selectedRowInfos[0]?.equation ? selectedRowInfos[0]?.equation : '');
        formNewParam.setFieldValue("par_default", selectedRowInfos[0]?.par_default ? selectedRowInfos[0]?.par_default : false);
        formNewParam.setFieldValue("active", selectedRowInfos[0]?.active ? selectedRowInfos[0]?.active : false);

        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (id) => async () => {
        let saveBoolCompte = false;
        let saveBoolEquation = false;
        let saveBoolIdEtat = false;

        setCompteValidationColor('transparent');
        setEquationValidationColor('transparent');
        setIdEtatValidationColor('transparent')

        if (formNewParam.values.compte === '') {
            setCompteValidationColor('#F6D6D6');
            saveBoolCompte = false;
        } else {
            setCompteValidationColor('transparent');
            saveBoolCompte = true;
        }

        if (formNewParam.values.equation === '') {
            setEquationValidationColor('#F6D6D6');
            saveBoolEquation = false;
        } else {
            setEquationValidationColor('transparent');
            saveBoolEquation = true;
        }

        if (formNewParam.values.tableau === '') {
            setIdEtatValidationColor('#F6D6D6');
            saveBoolIdEtat = false;
        } else {
            setIdEtatValidationColor('transparent');
            saveBoolIdEtat = true;
        }

        if (saveBoolCompte && saveBoolEquation && saveBoolIdEtat) {
            setRowModesModel({
                ...rowModesModel,
                [id]: { mode: GridRowModes.View, ignoreModifications: true },
            });

            const dataToSend = { ...formNewParam.values, compteId: compteId, exerciceId: exerciceId, fileId: fileId, rubriqueId: rubriqueId, id_etat, nature };

            axiosPrivate.post(`/paramRubriqueExterne/addOrUpdateCompteRubriqueExterne`, dataToSend).then((response) => {
                const resData = response.data;

                if (resData.state) {
                    setIsCompteRubriqueRefreshed(prev => !prev);
                    setDisableAddRowBouton(false);
                    setDisableSaveBouton(true);
                    formNewParam.resetForm();
                    toast.success(resData.msg);
                } else {
                    toast.error(resData.msg);
                }
            });
        } else {
            toast.error('Les champs en surbrillances sont obligatoires');
        }
    };

    const handleOpenDialogConfirmDeleteRow = () => {
        setOpenDialogDeleteRow(true);
        setDisableAddRowBouton(false);
    }

    const deleteRow = (value) => {
        if (value === true) {
            if (selectedRowId.length === 1) {
                const idToDelete = selectedRowId[0];
                if (idToDelete < 0) {
                    setOpenDialogDeleteRow(false);
                    toast.success('Ligne supprimé avec succès');
                    setCompteRubriqueData(compteRubriqueData.filter((row) => row.id !== idToDelete));
                    return;
                }

                let DefaultRow = true;
                const RowInfos = compteRubriqueData.filter((row) => row.id === idToDelete);

                if (RowInfos) {
                    DefaultRow = RowInfos[0].par_default;
                }

                if (DefaultRow) {
                    toast.error("Vous ne pouvez pas supprimer les paramétrages par défault. désactivez-les en cas de nécessité.");
                } else {
                    axiosPrivate.delete(`/paramRubriqueExterne/deleteCompteRubriqueExterne/${idToDelete}`).then((response) => {
                        const resData = response.data;
                        if (resData.state) {
                            setOpenDialogDeleteRow(false);
                            setDisableAddRowBouton(false);
                            setCompteRubriqueData(compteRubriqueData.filter((row) => row.id !== selectedRowId[0]));
                            toast.success(resData.message);
                        } else {
                            setOpenDialogDeleteRow(false);
                            toast.error(resData.msg);
                        }
                    });
                }
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
        setSelectedRow([]);
        setSelectedRowId([]);
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setCompteRubriqueData(compteRubriqueData.map((row) => (row.id === newRow.id ? updatedRow : row)));
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

    //Ajouter une ligne dans le tableau
    const handleOpenDialogAddNewRow = () => {
        setDisableModifyBouton(false);
        setDisableCancelBouton(false);
        setDisableDeleteBouton(false);

        const newId = -Date.now();
        formNewParam.setFieldValue("idParam", newId);
        formNewParam.setFieldValue("par_default", false);
        const newRow = {
            id: newId,
            compte: '',
            senscalcul: '',
            condition: '',
            equation: '',
            id_etat: id_etat,
            tableau: ['RUBRIQUE', 'TITRE', 'TOTAL', 'TOTAL SOUS-RUBRIQUES', 'SOUS-TOTAL', 'SOUS-RUBRIQUE'].includes(typeRubrique) ? id_etat : '',
            par_default: false,
            active: true,
        };
        setCompteRubriqueData([...compteRubriqueData, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRow([newRow.id]);

        setDisableAddRowBouton(true);
    }

    //enregistrer le choix activer ou non d'une nouvelle ligne ou de la modification en cours
    const handleCheckboxChange = (value) => {
        formNewParam.setFieldValue("active", value);
    }

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
                (openDialogDeleteRow && canDelete)
                    ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"}
                        confirmationState={deleteRow}
                    />
                    :
                    null
            }
            <Stack direction={'column'} alignContent={'left'} alignItems={"left"} spacing={1} width={"100%"} height={"100%"}>

                <Stack direction={'row'} alignContent={'center'} alignItems={"center"} spacing={1} width={"100%"} height={"30px"}>
                    <Stack width={"100%"} height={"10px"} spacing={0} alignItems={"center"} alignContent={"center"}
                        direction={"row"} style={{ marginTop: "20px" }}>

                        <Stack width={"50%"} height={"30px"} spacing={2} alignItems={"left"} alignContent={"left"}
                            direction={"row"} justifyContent={"left"}>
                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)" }} align='left'>Détails des calculs</Typography>
                        </Stack>
                    </Stack>

                    <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"left"} alignContent={"left"}
                        direction={"row"} justifyContent={"right"} style={{ marginRight: "0px" }}>
                        <Tooltip title="Ajouter une ligne">
                            <IconButton
                                disabled={!canAdd || disableAddRowBouton || typeRubrique === "TITRE"}
                                variant="contained"
                                onClick={handleOpenDialogAddNewRow}
                                style={{
                                    width: "35px", height: '35px',
                                    borderRadius: "2px", borderColor: "transparent",
                                    backgroundColor: initial.theme,
                                    textTransform: 'none', outline: 'none'
                                }}
                            >
                                <TbPlaylistAdd style={{ width: '25px', height: '25px', color: 'white' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Modifier la ligne sélectionnée">
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
                        </Tooltip>

                        <Tooltip title="Sauvegarder les modifications">
                            <span>
                                <IconButton
                                    disabled={(!canAdd && !canModify) || disableSaveBouton}
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
                                    onClick={handleOpenDialogConfirmDeleteRow}
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
                </Stack>
                <Stack
                    width="100%"
                    height="707px"
                    style={{
                        marginLeft: "0px",
                        marginTop: "20px",
                    }}
                >
                    <DataGrid
                        apiRef={apiRef}
                        disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                        disableColumnSelector={DataGridStyle.disableColumnSelector}
                        disableDensitySelector={DataGridStyle.disableDensitySelector}
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                        disableRowSelectionOnClick
                        disableSelectionOnClick={true}
                        slots={{ toolbar: QuickFilter }}
                        sx={{
                            ...DataGridStyle.sx,
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                                border: 'none',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                maxHeight: '100%',
                            },
                        }}
                        rowHeight={DataGridStyle.rowHeight}
                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                        editMode='row'
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 100 },
                            },
                        }}
                        pageSizeOptions={[50, 100]}
                        pagination={DataGridStyle.pagination}
                        checkboxSelection={DataGridStyle.checkboxSelection}
                        columnVisibilityModel={{
                            id: false,
                        }}

                        rows={compteRubriqueData}
                        columns={columnHeader}
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        onRowEditStop={handleRowEditStop}
                        processRowUpdate={processRowUpdate}
                        rowSelectionModel={selectedRow}
                        onRowClick={(e) => handleCellEditCommit(e.row)}
                        onRowSelectionModelChange={ids => {
                            const singleSelection = ids.length > 0 ? [ids[ids.length - 1]] : [];
                            setSelectedRow(singleSelection);
                            saveSelectedRow(singleSelection);
                            deselectRow(singleSelection);
                        }}
                        onRowEditStart={(params, event) => {
                            const rowId = params.id;
                            const rowData = params.row;

                            const isNewRow = rowId < 0;

                            if (!canModify && !isNewRow) {
                                event.defaultMuiPrevented = true;
                                return;
                            }

                            event.stopPropagation();

                            setCompteValidationColor('transparent');
                            setEquationValidationColor('transparent');
                            setIdEtatValidationColor('transparent');

                            if (rowData.par_default) {
                                setDisableDefaultFieldModif(true);
                            } else {
                                setDisableDefaultFieldModif(false);
                            }

                            formNewParam.setFieldValue("idParam", rowId);
                            formNewParam.setFieldValue("compte", rowData.compte ?? '');
                            formNewParam.setFieldValue("senscalcul", rowData.senscalcul ?? '');
                            formNewParam.setFieldValue("condition", rowData.condition ?? '');
                            formNewParam.setFieldValue("equation", rowData.equation ?? '');
                            formNewParam.setFieldValue("tableau", rowData.tableau ?? '');
                            formNewParam.setFieldValue("active", rowData.active ?? true);
                            formNewParam.setFieldValue("par_default", rowData.par_default ?? false);

                            setRowModesModel((oldModel) => ({
                                ...oldModel,
                                [rowId]: { mode: GridRowModes.Edit },
                            }));

                            setDisableAddRowBouton(true);
                            setDisableSaveBouton(false);
                        }}
                        onCellKeyDown={handleCellKeyDown}
                    />
                </Stack>
            </Stack>
        </>
    );
}

export default DatagridDetailExterne