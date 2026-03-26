import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import { useState } from "react";
import toast from "react-hot-toast";
import QuickFilter, { DataGridStyle } from "../../DatagridToolsStyle";
import PopupConfirmDelete from "../../popupConfirmDelete";
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/HighlightOff';

const DatagridGlobal = ({ datagridHeight, setFieldValue, setList, list, columnHeader, name, newRow, onSaveRow, onDeleteRow, validateRow, setRowErrors, withColumnActions, withAddButton, anotherActionButton, verifyCanUpdate, rowModesModel, setRowModesModel, id_dossier }) => {
    const apiRefDatagrid = useGridApiRef();
    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedRowId, setSelectedRowId] = useState([]);
    const [openDialogDelete, setOpenDialogDelete] = useState(false);

    const apiRef = apiRefDatagrid;

    const handleSaveClick = (id) => () => {
        apiRef.current.stopRowEditMode({ id });
        setSelectedRow([]);
        setSelectedRowId([]);
    };

    const handleEditClick = (id) => async () => {
        let data = false;
        if (verifyCanUpdate) {
            data = await verifyCanUpdate(id);
            if (!data?.state) {
                return toast.error(data?.message);
            }
        }
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleOpenDialogConfirmDelete = (id) => () => {
        setSelectedRowId([id]);
        setOpenDialogDelete(true);
    }

    const deleteRow = async (value) => {
        if (value === true) {
            if (onDeleteRow) {
                if (selectedRowId[0] > 0) {
                    const data = await onDeleteRow(selectedRowId[0]);
                    if (data) {
                        setList(list.filter((row) => row.id !== selectedRowId[0]));
                        setOpenDialogDelete(false);
                    } else {
                        setOpenDialogDelete(false);
                    }
                } else {
                    setList(list.filter((row) => row.id !== selectedRowId[0]));
                    setOpenDialogDelete(false);
                    toast.success('Ligne supprimée avec succès');
                }
            } else {
                setList(list.filter((row) => row.id !== selectedRowId[0]));
                setOpenDialogDelete(false);
                toast.success('Ligne supprimée avec succès');
            }
        } else {
            setOpenDialogDelete(false);
        }
    }

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setSelectedRow([]);
        setSelectedRowId([]);
        toast.success('Modification annulée avec succès');
    };

    const handleOpenDialogAddNew = () => {
        const newId = -Date.now();

        const rowToAdd = {
            ...newRow(),
            id: newId
        };

        const updatedList = [...list, rowToAdd];
        setList(updatedList);

        setSelectedRow([rowToAdd.id]);
        setSelectedRowId([rowToAdd.id]);

        setRowModesModel(prev => ({
            ...prev,
            [rowToAdd.id]: { mode: GridRowModes.Edit }
        }));
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const processRowUpdate = (setFieldValue) => async (newRow) => {
        if (validateRow) {
            const errors = validateRow(newRow);

            if (Object.keys(errors).length > 0) {

                if (setRowErrors) {
                    setRowErrors(prev => ({
                        ...prev,
                        [newRow.id]: errors
                    }));
                }

                toast.error("Veuillez remplir les champs obligatoires");

                throw new Error("Validation error");
            }

            if (setRowErrors) {
                setRowErrors(prev => {
                    const copy = { ...prev };
                    delete copy[newRow.id];
                    return copy;
                });
            }
        }

        const updatedRow = { ...newRow, isNew: false };

        const updatedList = list.map((row) =>
            row.id === newRow.id ? updatedRow : row
        );

        setList(updatedList);
        setFieldValue(name, updatedList);

        if (onSaveRow) {
            await onSaveRow(updatedRow);
        } else {
            toast.success('Ligne sauvegardés avec succès');
        }

        return updatedRow;
    };

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

    const QuickFilterWithButton = (props) => <QuickFilter withAddButton={withAddButton} addAction={handleOpenDialogAddNew} {...props} />;

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    }

    const actionsColumn = {
        field: 'actions',
        headerName: 'ACTIONS',
        type: 'actions',
        // width: 100,
        getActions: (params) => {
            const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;
            return [
                isInEditMode ? (
                    (
                        <>
                            <Tooltip key='save' title="Enregistrer">
                                <span>
                                    <IconButton
                                        size="small"
                                        sx={{ color: 'green' }}
                                        onClick={handleSaveClick(params.id)}
                                        disabled={params.row.id_dossier !== id_dossier}
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip key='cancel' title="Annuler">
                                <span>
                                    <IconButton
                                        size="small" sx={{ color: '#FF5252' }}
                                        onClick={handleCancelClick(params.id)}
                                        disabled={params.row.id_dossier !== id_dossier}
                                    >
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </>
                    )
                ) : (
                    <>
                        {anotherActionButton ? anotherActionButton(params) : null}
                        <Tooltip key='edit' title="Modifier">
                            <span>
                                <IconButton
                                    size="small"
                                    sx={{ color: '#546E7A' }}
                                    onClick={handleEditClick(params.id)}
                                    disabled={params.row.id_dossier !== id_dossier}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip key='delete' title="Supprimer">
                            <span>
                                <IconButton
                                    size="small" sx={{ color: '#FF5252' }}
                                    onClick={handleOpenDialogConfirmDelete(params.id)}
                                    disabled={params.row.id_dossier !== id_dossier}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </>
                ),
            ];
        }
    }

    const columns = withColumnActions
        ? [...columnHeader, actionsColumn]
        : [...columnHeader];

    const processRowUpdateSafe = async (newRow) => {
        const updatedList = list.map(row => row.id === newRow.id ? newRow : row);
        setList(updatedList);

        if (onSaveRow) {
            await onSaveRow(newRow);
        }
        return newRow;
    };

    return (
        <>
            {openDialogDelete ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"} confirmationState={deleteRow} /> : null}
            <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <Stack
                    width={"100%"}
                    height={datagridHeight}
                >
                    <DataGrid
                        apiRef={apiRef}
                        disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                        disableColumnSelector={DataGridStyle.disableColumnSelector}
                        disableDensitySelector={DataGridStyle.disableDensitySelector}
                        disableRowSelectionOnClick
                        disableSelectionOnClick={true}
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                        slots={{ toolbar: QuickFilterWithButton }}
                        sx={DataGridStyle.sx}
                        rowHeight={DataGridStyle.rowHeight}
                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                        rows={list}
                        editMode='row'
                        experimentalFeatures={{ newEditingApi: true }}
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        onRowEditStop={handleRowEditStop}
                        processRowUpdate={setFieldValue && name ? processRowUpdate(setFieldValue) : processRowUpdateSafe}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 100 },
                            },
                        }}
                        pageSizeOptions={[50, 100]}
                        pagination={DataGridStyle.pagination}
                        checkboxSelection={false}
                        columnVisibilityModel={{
                            id: false,
                        }}
                        rowSelectionModel={selectedRow}
                        onCellKeyDown={handleCellKeyDown}
                        hideFooterSelectedRowCount
                        onProcessRowUpdateError={() => { }}
                        onRowEditStart={(params, event) => {
                            event.defaultMuiPrevented = true;
                        }}
                    />
                </Stack>
            </Box>
        </>
    )
}

export default DatagridGlobal