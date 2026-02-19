import { useState } from 'react';
import {
    Typography, Stack, FormControl, Select, MenuItem, Input, Checkbox
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import toast from 'react-hot-toast';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { useFormik } from 'formik';
import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from 'react-icons/vsc';
import { TfiSave } from 'react-icons/tfi';
import { init } from '../../../../init';
import QuickFilter, { DataGridStyle } from '../DatagridToolsStyle';
import PopupConfirmDelete from '../popupConfirmDelete';
import useAxiosPrivate from '../../../../config/axiosPrivate';

const DatagirdBaseExterne = ({ row_id, tableRow, compteId, fileId, exerciceId, id_etat, setTableRow, setIsRefreshed, subtable, canModify, canAdd, canDelete, canView }) => {
    const listType = [
        { value: "RUBRIQUE", label: "Rubrique" },
        { value: "TITRE", label: "Titre" },

    ]
    if (['TFTD', 'TFTI'].includes(id_etat)) {
        listType.push(
            { value: "LIAISON", label: "Liaison N" },
            { value: "LIAISON N1", label: "Liaison N-1" },
            { value: "LIAISON VAR ACTIF", label: "Liaison var actif" },
            { value: "LIAISON VAR PASSIF", label: "Liaison var passif" },
        )
    }
    listType.push(
        { value: "TOTAL", label: "Total" },
        { value: "TOTAL SOUS-RUBRIQUES", label: "Total sous-rubriques" },
        { value: "SOUS-TOTAL", label: "Sous-Total" },
        { value: "SOUS-RUBRIQUE", label: "Sous-Rubrique" },
    )

    const apiRef = useGridApiRef();
    const axiosPrivate = useAxiosPrivate();
    let initial = init[0];

    const [editableRow, setEditableRow] = useState(true);

    const [idRubriqueValidationColor, setIdRubriqueValidationColor] = useState('transparent');
    const [libelleValidationColor, setLibelleValidationColor] = useState('transparent');
    const [typeValidationColor, setTypeValidationColor] = useState('transparent');
    const [ordreValidationColor, setOrdreValidationColor] = useState('transparent');

    const [selectedRow, setSelectedRow] = useState([]);

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});

    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);

    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const [disableDefaultFieldModif, setDisableDefaultFieldModif] = useState(false);

    const maxOrdre = (tableRow.length > 0 ? Math.max(...tableRow.map(val => val.ordre)) : 0) + 1;

    //formulaire pour la sauvegarde
    const formNewParam = useFormik({
        initialValues: {
            idExterne: 0,
            compteId: compteId,
            fileId: fileId,
            exerciceId: exerciceId,
            id_etat: id_etat,
            id_rubrique: '',
            libelle: '',
            type: '',
            ordre: '',
            par_default: true,
            active: true,
        },
        validateOnChange: false,
        validateOnBlur: true,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        formNewParam.setFieldValue(name, value);
    }

    const handleCheckboxChange = (value) => {
        formNewParam.setFieldValue("active", value);
    }

    const columnHeader = [
        {
            field: 'id_rubrique',
            headerName: 'ID Rubrique',
            type: 'string',
            sortable: true,
            flex: 1.5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: () => {
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: idRubriqueValidationColor
                            }}
                            name="id_rubrique"
                            type="text"
                            value={formNewParam.values.id_rubrique}
                            onChange={handleChange}
                            label="id_rubrique"
                            disableUnderline={true}
                            disabled={disableDefaultFieldModif}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'libelle',
            headerName: 'Libelle',
            type: 'string',
            sortable: true,
            flex: 5,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: () => {
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: libelleValidationColor
                            }}
                            name="libelle"
                            type="text"
                            value={formNewParam.values.libelle}
                            onChange={handleChange}
                            label="libelle"
                            disableUnderline={true}
                            disabled={disableDefaultFieldModif}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'type',
            headerName: 'Type',
            type: 'singleSelect',
            sortable: true,
            flex: 2.4,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            valueFormatter: (params) => {
                const selectedType = listType?.find((option) => option.value === params.value);
                return selectedType ? selectedType.label : params.label;
            },
            renderEditCell: () => {
                return (
                    <FormControl fullWidth>
                        <Select
                            disabled={disableDefaultFieldModif}
                            style={{ backgroundColor: typeValidationColor }}
                            value={formNewParam.values.type}
                            onChange={handleChange}
                            name="type"
                            label="type"
                        >
                            {listType?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            },
        },
        {
            field: 'ordre',
            headerName: 'Ordre',
            type: 'number',
            sortable: true,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            editable: editableRow,
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '100%' }}>
                        <Input
                            style={{
                                height: '100%',
                                alignItems: 'center',
                                outline: 'none',
                                backgroundColor: ordreValidationColor
                            }}
                            name="ordre"
                            type="text"
                            value={formNewParam.values.ordre}
                            onChange={handleChange}
                            label="ordre"
                            disableUnderline={true}
                            disabled={disableDefaultFieldModif}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'active',
            headerName: 'Activé',
            type: 'boolean',
            sortable: true,
            flex: 1,
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
            flex: 1.5,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'HeaderbackColor',
            editable: false
        },
    ];

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
        setIdRubriqueValidationColor('transparent');
        setLibelleValidationColor('transparent');
        setTypeValidationColor('transparent');
        setOrdreValidationColor('transparent');
        const selectedRowInfos = tableRow?.filter((item) => item.id === id[0]);

        if (selectedRowInfos[0]?.par_default) {
            setDisableDefaultFieldModif(true);
        } else {
            setDisableDefaultFieldModif(false);
        }

        formNewParam.setFieldValue("idExterne", selectedRowInfos[0]?.id ? selectedRowInfos[0]?.id : 0);
        formNewParam.setFieldValue("type", selectedRowInfos[0]?.type ? selectedRowInfos[0]?.type : '');
        formNewParam.setFieldValue("id_etat", selectedRowInfos[0]?.id_etat ? selectedRowInfos[0]?.id_etat : '');
        formNewParam.setFieldValue("id_rubrique", selectedRowInfos[0]?.id_rubrique ? selectedRowInfos[0].id_rubrique : '');
        formNewParam.setFieldValue("libelle", selectedRowInfos[0]?.libelle ? selectedRowInfos[0]?.libelle : '');
        formNewParam.setFieldValue("ordre", selectedRowInfos[0]?.ordre ? selectedRowInfos[0]?.ordre : '');
        formNewParam.setFieldValue("par_default", selectedRowInfos[0]?.par_default ? selectedRowInfos[0]?.par_default : false);
        formNewParam.setFieldValue("active", selectedRowInfos[0]?.active ? selectedRowInfos[0]?.active : false);

        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (id) => async () => {
        let saveBoolIdRubrique = false;
        let saveBoolLibelleRubrique = false;
        let saveBoolTypeRubrique = false;
        let saveBoolOrdreRubrique = false;

        setIdRubriqueValidationColor('transparent');
        setLibelleValidationColor('transparent');
        setTypeValidationColor('transparent');
        setOrdreValidationColor('transparent');

        if (formNewParam.values.id_rubrique === '') {
            setIdRubriqueValidationColor('#F6D6D6');
            saveBoolIdRubrique = false;
        } else {
            setIdRubriqueValidationColor('transparent');
            saveBoolIdRubrique = true;
        }

        if (formNewParam.values.libelle === '') {
            setLibelleValidationColor('#F6D6D6');
            saveBoolLibelleRubrique = false;
        } else {
            setLibelleValidationColor('transparent');
            saveBoolLibelleRubrique = true;
        }

        if (formNewParam.values.type === '') {
            setTypeValidationColor('#F6D6D6');
            saveBoolTypeRubrique = false;
        } else {
            setTypeValidationColor('transparent');
            saveBoolTypeRubrique = true;
        }

        if (formNewParam.values.ordre === '') {
            setOrdreValidationColor('#F6D6D6');
            saveBoolOrdreRubrique = false;
        } else {
            setOrdreValidationColor('transparent');
            saveBoolOrdreRubrique = true;
        }

        if (saveBoolIdRubrique && saveBoolLibelleRubrique && saveBoolTypeRubrique && saveBoolOrdreRubrique) {
            setRowModesModel({
                ...rowModesModel,
                [id]: { mode: GridRowModes.View, ignoreModifications: true },
            });

            const dataToSend = { ...formNewParam.values, compteId: Number(compteId), exerciceId: exerciceId, fileId: Number(fileId), subtable, id_etat };

            axiosPrivate.post(`/paramRubriqueExterne/addOrUpdateRubriqueExterne`, dataToSend).then((response) => {
                const resData = response.data;

                if (resData.state) {
                    setIsRefreshed(prev => !prev);
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
                    setTableRow(tableRow.filter((row) => row.id !== idToDelete));
                    toast.success('Ligne supprimé avec succès');
                    return;
                }

                let DefaultRow = true;
                const RowInfos = tableRow.filter((row) => row.id === idToDelete)

                if (RowInfos) {
                    DefaultRow = RowInfos[0].par_default;
                }

                if (DefaultRow) {
                    toast.error("Vous ne pouvez pas supprimer les paramétrages par défault. désactivez-les en cas de nécessité.");
                } else {
                    axiosPrivate.delete(`/paramRubriqueExterne/deleteRubriquesExternes/${idToDelete}`).then((response) => {
                        const resData = response.data;
                        if (resData.state) {
                            setOpenDialogDeleteRow(false);
                            setDisableAddRowBouton(false);
                            setTableRow(tableRow.filter((row) => row.id !== selectedRowId[0]));
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
        setTableRow(tableRow.map((row) => (row.id === newRow.id ? updatedRow : row)));
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
        formNewParam.setFieldValue("idExterne", newId);
        const newRow = {
            id: newId,
            id_rubrique: '',
            libelle: '',
            type: 'RUBRIQUE',
            id_etat: id_etat,
            ordre: maxOrdre,
            par_default: false,
            active: true,
        };
        setTableRow([...tableRow, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRow([newRow.id]);

        setDisableAddRowBouton(true);
    }

    const sendId = (id) => {
        const rowSelectedInfo = tableRow?.find((item) => item.id === id[0]);
        row_id(rowSelectedInfo?.id_rubrique ?? null);
    };

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
                        presonalisedMessage={true}
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
                            <Typography variant='h7' sx={{ color: "rgba(5,96,116,0.60)" }} align='left'>Liste des rubriques extèrnes</Typography>
                        </Stack>
                    </Stack>

                    <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"left"} alignContent={"left"}
                        direction={"row"} justifyContent={"right"} style={{ marginRight: "0px" }}>
                        <Tooltip title="Ajouter une ligne">
                            <IconButton
                                disabled={!canAdd || disableAddRowBouton}
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
                        checkboxSelection
                        columnVisibilityModel={{
                            id: false,
                        }}

                        rows={tableRow}
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
                            sendId(singleSelection);
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

                            setIdRubriqueValidationColor('transparent');
                            setLibelleValidationColor('transparent');
                            setTypeValidationColor('transparent');
                            setOrdreValidationColor('transparent');

                            formNewParam.setFieldValue("idExterne", rowId);
                            formNewParam.setFieldValue("type", rowData.type ?? "");
                            formNewParam.setFieldValue("id_rubrique", rowData.id_rubrique ?? "");
                            formNewParam.setFieldValue("libelle", rowData.libelle ?? "");
                            formNewParam.setFieldValue("ordre", rowData.ordre ?? maxOrdre);
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

export default DatagirdBaseExterne