import { useState, useEffect } from 'react';
import { Stack, Box, FormControl, Input } from '@mui/material';
import { IconButton, Tooltip } from '@mui/material';

import { IoMdTrash } from "react-icons/io";
import { TbPlaylistAdd } from "react-icons/tb";
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from 'react-icons/vsc';

import { init } from '../../../../../init';
import axios from '../../../../../config/axios';
import toast from 'react-hot-toast';
import { DataGridStyle } from '../../../componentsTools/DatagridToolsStyle';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import QuickFilter from '../../../componentsTools/DatagridToolsStyle';
import { TfiSave } from 'react-icons/tfi';

import { useFormik } from 'formik';
import * as Yup from "yup";
import PopupConfirmDelete from '../../popupConfirmDelete.jsx';
import useAxiosPrivate from '../../../../../config/axiosPrivate.js';

const DatagridAnalitiqueAxe = ({ id_compte, id_dossier, selectedRowAxeId, setSelectedRowAxeId, isCaActive, canModify, canAdd, canDelete, canView }) => {
    const apiRef = useGridApiRef();
    const axiosPrivate = useAxiosPrivate();
    let initial = init[0];
    const [axesData, setAxesData] = useState([]);

    const [editableRow, setEditableRow] = useState(true);
    const [codeValidationColor, setCodeValidationColor] = useState('transparent');
    const [libelleValidationColor, setLibelleValidationColor] = useState('transparent');

    const [isRefreshed, setIsRefreshed] = useState(false);

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);

    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const [disableDefaultFieldModif, setDisableDefaultFieldModif] = useState(false);

    // Normaliser un code pour comparaison (trim + uppercase)
    const normalizeCode = (v) => (v || '').toString().trim().toUpperCase();

    //formulaire pour la sauvegarde
    const formNewParam = useFormik({
        initialValues: {
            id: 0,
            compteId: id_compte,
            fileId: id_dossier,
            code: '',
            libelle: '',
        },
        validationSchema: Yup.object({
            code: Yup.string().required("Ce champ est obligatoire"),
            libelle: Yup.string().required("Ce champ est obligatoire"),
        }),
        onSubmit: (values) => {

        },
        validateOnChange: false,
        validateOnBlur: true,
    });

    const handleChangeCode = (value) => {
        formNewParam.setFieldValue('code', value);
    }

    const handleChangeLibelle = (value) => {
        formNewParam.setFieldValue('libelle', value);
    }

    const columnHeader = [
        {
            field: 'code',
            headerName: 'Code Axe',
            flex: 0.5,
            sortable: true,
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
                                backgroundColor: codeValidationColor
                            }}
                            type="text"
                            value={formNewParam.values.code}
                            onChange={(e) => handleChangeCode(e.target.value)}
                            label="libelle"
                            disableUnderline={true}
                            disabled={disableDefaultFieldModif}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'libelle',
            headerName: 'Libellé',
            flex: 1.5,
            sortable: true,
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
                                backgroundColor: libelleValidationColor
                            }}
                            type="text"
                            value={formNewParam.values.libelle}
                            onChange={(e) => handleChangeLibelle(e.target.value)}
                            label="libelle"
                            disableUnderline={true}
                            disabled={disableDefaultFieldModif}
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

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id) => () => {
        setCodeValidationColor('transparent');
        setLibelleValidationColor('transparent');
        const selectedRowInfos = axesData?.filter((item) => item.id === id[0]);

        formNewParam.setFieldValue("id", selectedRowInfos[0]?.id ? selectedRowInfos[0]?.id : 0);
        formNewParam.setFieldValue("code", selectedRowInfos[0]?.code ? selectedRowInfos[0]?.code : '');
        formNewParam.setFieldValue("libelle", selectedRowInfos[0]?.libelle ? selectedRowInfos[0]?.libelle : '');

        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (id) => async () => {
        let saveBoolCode = false;
        let saveBoolLibelle = false;

        setCodeValidationColor('transparent');
        setLibelleValidationColor('transparent');

        if (formNewParam.values.code === '') {
            setCodeValidationColor('#F6D6D6');
            saveBoolCode = false;
        } else {
            setCodeValidationColor('transparent');
            saveBoolCode = true;
        }

        if (formNewParam.values.libelle === '') {
            setLibelleValidationColor('#F6D6D6');
            saveBoolLibelle = false;
        } else {
            setLibelleValidationColor('transparent');
            saveBoolLibelle = true;
        }

        if (saveBoolCode && saveBoolLibelle) {
            const currentId = Number(formNewParam.values.id) || 0;
            const newCode = normalizeCode(formNewParam.values.code);
            const exists = Array.isArray(axesData) && axesData.some(r => Number(r.id) !== currentId && normalizeCode(r.code) === newCode);
            if (exists) {
                toast.error('Ce code Axe existe déjà');
                return;
            }

            setRowModesModel({
                ...rowModesModel,
                [id]: { mode: GridRowModes.View, ignoreModifications: true },
            });

            const dataToSend = { ...formNewParam.values, compteId: id_compte, fileId: id_dossier };

            axiosPrivate.post(`/paramCa/addOrUpdateAxes`, dataToSend).then((response) => {
                const resData = response.data;

                if (resData.state) {
                    setDisableAddRowBouton(false);
                    setDisableSaveBouton(true);
                    formNewParam.resetForm();
                    setIsRefreshed(prev => !prev);
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
                    setAxesData(axesData.filter((row) => row.id !== idToDelete));
                    toast.success('Axe supprimé avec succès');
                    return;
                }

                const dataToSend = { fileId: id_dossier, compteId: id_compte, idToDelete };

                axiosPrivate.post(`/paramCa/deleteAxes`, dataToSend).then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        setOpenDialogDeleteRow(false);
                        setDisableAddRowBouton(false);
                        setSelectedRowAxeId([]);
                        setAxesData(axesData.filter((row) => row.id !== selectedRowId[0]));
                        toast.success(resData.msg);
                    } else {
                        setOpenDialogDeleteRow(false);
                        setSelectedRowAxeId([]);
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
        setSelectedRowAxeId([]);
        setSelectedRowId([]);
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setAxesData(axesData.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleCellEditCommit = (params) => {
        const idClicked = params.id;
        const isSelected = selectedRowId.includes(idClicked);

        if (!isSelected) {
            toast.error("Sélectionnez la ligne avant de la modifier");
            return;
        }

        setEditableRow(true);
        setDisableModifyBouton(false);
        setDisableSaveBouton(false);
        setDisableCancelBouton(false);
    };

    //Ajouter une ligne dans le tableau
    const handleOpenDialogAddNewRow = () => {
        setDisableModifyBouton(false);
        setDisableCancelBouton(false);
        setDisableDeleteBouton(false);

        const newId = -Date.now();
        formNewParam.setFieldValue("id", newId);
        const newRow = {
            id: newId,
            code: '',
            libelle: '',
        };
        setAxesData([...axesData, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRowAxeId([newRow.id]);

        setDisableAddRowBouton(true);
    }

    const handleGetAxes = () => {
        axios.get(`/paramCa/getAxes/${id_compte}/${id_dossier}`)
            .then((response) => {
                if (response?.data?.state) {
                    setAxesData(response?.data?.data)
                } else {
                    toast.error(response?.data?.message);
                }
            })
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

    useEffect(() => {
        if (canView) {
            handleGetAxes();
        }
    }, [id_compte, id_dossier, isRefreshed])

    return (
        <>
            {
                openDialogDeleteRow && canDelete
                    ?
                    <PopupConfirmDelete
                        msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"}
                        confirmationState={deleteRow}
                        presonalisedMessage={true}
                    />
                    :
                    null
            }
            <Box
                sx={{ width: '30%' }}
                style={{
                    borderRight: '15px solid #F4F9F9'
                }}
            >

                <Stack
                    sx={{
                        width: '100%',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-start',
                        padding: '10px',
                    }}
                    direction={'row'}
                    spacing={0.5}
                >
                    <Tooltip title="Ajouter une ligne">
                        <div>
                            <IconButton
                                disabled={!canAdd || disableAddRowBouton || !isCaActive}
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
                        </div>
                    </Tooltip>

                    <Tooltip title="Modifier la ligne sélectionnée">
                        <div>
                            <IconButton
                                disabled={(!canModify && selectedRowId > 0) || disableModifyBouton || !isCaActive}
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
                        </div>
                    </Tooltip>

                    <Tooltip title="Sauvegarder les modifications">
                        <div>
                            <IconButton
                                disabled={(!canAdd && !canModify) || disableSaveBouton || !formNewParam.isValid || !isCaActive}
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
                        </div>
                    </Tooltip>

                    <Tooltip title="Annuler les modifications">
                        <div>
                            <IconButton
                                disabled={disableCancelBouton || !isCaActive}
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
                        </div>
                    </Tooltip>

                    <Tooltip title="Supprimer la ligne sélectionné">
                        <div>
                            <IconButton
                                disabled={!canDelete || disableDeleteBouton || !isCaActive}
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
                        </div>
                    </Tooltip>
                </Stack>

                <Stack
                    sx={{ height: 450 }}
                    style={{
                        marginTop: '0px'
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
                            '& .MuiInputBase-root': {
                                boxShadow: 'none',
                                border: 'none',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                border: 'none',
                            },
                        }}
                        rowHeight={DataGridStyle.rowHeight}
                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                        editMode='row'
                        onRowClick={(e) => handleCellEditCommit(e.row)}
                        onRowSelectionModelChange={(ids) => {
                            const arr = Array.isArray(ids) ? ids : [ids];
                            const single = arr.length ? [arr[arr.length - 1]] : [];
                            setSelectedRowAxeId(single);
                            saveSelectedRow(single);
                            deselectRow(single);
                        }}
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        onRowEditStop={handleRowEditStop}
                        processRowUpdate={processRowUpdate}
                        rows={axesData}
                        columns={columnHeader}
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
                        rowSelectionModel={selectedRowAxeId}
                        hideFooterSelectedRowCount
                        onRowEditStart={(params, event) => {
                            const rowId = params.id;
                            const rowData = params.row;

                            const isNewRow = rowId < 0;

                            if (!canModify && !isNewRow) {
                                event.defaultMuiPrevented = true;
                                return;
                            }

                            event.stopPropagation();

                            setCodeValidationColor('transparent');
                            setLibelleValidationColor('transparent');

                            formNewParam.setValues({
                                ...formNewParam.values,
                                id: rowId ?? null,
                                code: rowData.code ?? '',
                                libelle: rowData.libelle ?? ''
                            });

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
            </Box>
        </>
    );
}

export default DatagridAnalitiqueAxe