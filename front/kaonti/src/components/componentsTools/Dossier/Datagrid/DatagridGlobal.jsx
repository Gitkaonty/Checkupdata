import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { DataGrid, frFR, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import { useState } from "react";
import toast from "react-hot-toast";
import QuickFilter, { DataGridStyle } from "../../DatagridToolsStyle";
import PopupConfirmDelete from "../../popupConfirmDelete";
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/HighlightOff';

const DatagridGlobal = ({ datagridHeight, setFieldValue, setList, list, columnHeader, setEditableRow, name, newRow, onSaveRow, onDeleteRow }) => {
    const apiRef = useGridApiRef();
    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [openDialogDelete, setOpenDialogDelete] = useState(false);

    const handleSaveClick = (id) => async () => {
        const rowToSave = list.find(r => r.id === id);
        if (onSaveRow) {
            await onSaveRow(rowToSave);
            setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
            setEditableRow(false);
        } else {
            setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
            toast.success("Informations sauvegardées");
            setEditableRow(false);
        }
    };

    const handleEditClick = (id) => () => {
        setEditableRow(true);
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleOpenDialogConfirmDelete = (id) => () => {
        setSelectedRowId([id]);
        setOpenDialogDelete(true);
    }

    const deleteAssocieRow = async (value) => {
        if (value === true) {
            if (onDeleteRow) {
                await onDeleteRow(selectedRowId[0]);
                setList(list.filter((row) => row.id !== selectedRowId[0]));
                setOpenDialogDelete(false);
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
    };

    const handleCellEditCommit = () => {
        setEditableRow(false);
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
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const processRowUpdate = (setFieldValue) => (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setList(list.map((row) => (row.id === newRow.id ? updatedRow : row)));
        setFieldValue(name, list.map((row) => (row.id === newRow.id ? updatedRow : row)));
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

    const QuickFilterWithButton = (props) => <QuickFilter withAddButton={true} addAction={handleOpenDialogAddNew} {...props} />;

    const actionsColumn = {
        field: 'actions',
        headerName: 'ACTIONS',
        type: 'actions',
        width: 100,
        getActions: (params) => {
            const id = params.id;
            const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;
            return [
                isInEditMode ? (
                    (
                        <>
                            <Tooltip key='save' title="Enregistrer">
                                <IconButton
                                    style={{
                                        width: "35px", height: '35px', borderRadius: "5px",
                                        borderColor: "transparent",
                                        textTransform: 'none', outline: 'none'
                                    }}
                                    onClick={handleSaveClick(params.id)}
                                >
                                    <SaveIcon sx={{ color: 'green' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip key='cancel' title="Annuler">
                                <IconButton
                                    style={{
                                        width: "35px", height: '35px', borderRadius: "5px",
                                        borderColor: "transparent",
                                        textTransform: 'none', outline: 'none'
                                    }}
                                    onClick={handleCancelClick(params.id)}
                                >
                                    <CancelIcon sx={{ color: '#EF4444' }} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )
                ) : (
                    <>
                        <Tooltip key='edit' title="Modifier">
                            <IconButton
                                style={{
                                    width: "35px", height: '35px', borderRadius: "5px",
                                    borderColor: "transparent",
                                    textTransform: 'none', outline: 'none'
                                }}
                                onClick={handleEditClick(params.id)}
                            >
                                <EditIcon sx={{ color: '#64748B' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip key='delete' title="Supprimer">
                            <IconButton
                                style={{
                                    width: "35px", height: '35px', borderRadius: "5px",
                                    borderColor: "transparent",
                                    textTransform: 'none', outline: 'none'
                                }}
                                onClick={handleOpenDialogConfirmDelete(params.id)}
                            >
                                <DeleteIcon sx={{ color: '#EF4444' }} />
                            </IconButton>
                        </Tooltip>
                    </>
                ),
            ];
        }
    }

    const columns = [
        ...columnHeader,
        actionsColumn
    ];

    return (
        <>
            {openDialogDelete ? <PopupConfirmDelete msg={"Voulez-vous vraiment supprimer la ligne sélectionnée ?"} confirmationState={deleteAssocieRow} /> : null}
            <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', p: 2 }}>
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
                        onRowClick={(e) => handleCellEditCommit(e.row)}
                        editMode='row'
                        experimentalFeatures={{ newEditingApi: true }}
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        processRowUpdate={processRowUpdate(setFieldValue)}
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
                    />
                </Stack>
            </Box>
        </>
    )
}

export default DatagridGlobal