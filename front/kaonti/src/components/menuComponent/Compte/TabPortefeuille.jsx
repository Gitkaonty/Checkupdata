import { useState } from "react";
import { Button, ButtonGroup, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tooltip } from "@mui/material";
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, GridActionsCellItem } from '@mui/x-data-grid';

import { TbPlaylistAdd } from 'react-icons/tb';
import { EditOutlined, DeleteOutline, CheckOutlined, CloseOutlined, AddOutlined } from "@mui/icons-material";

import QuickFilter, { DataGridStyle } from "../../componentsTools/DatagridToolsStyle";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";
import { useFormik } from "formik";
import { init } from "../../../../init";
import toast from "react-hot-toast";

const initial = init[0];

const TabPortefeuille = ({ listeComptePortefeuille, setListeComptePortefeuille, listePortefeuille }) => {
    const buttonStyle = {
        height: 32,
        fontSize: 12,
        fontWeight: 600,
        boxShadow: 'none',
        border: 'none',
        textTransform: 'none',
        minWidth: 110,
        px: 2,
    };

    const useFormikComptePortefeuille = useFormik({
        initialValues: {
            idComptePortefeuille: '',
            idPortefeuille: ''
        },
        validateOnChange: false,
        validateOnBlur: true,
    })

    const [selectedRowIdComptePortefeuille, setSelectedRowIdComptePortefeuille] = useState([]);
    const [rowModesModelComptePortefeuille, setRowModesModelComptePortefeuille] = useState({});
    const [disableModifyBoutonComptePortefeuille, setDisableModifyBoutonComptePortefeuille] = useState(true);
    const [disableCancelBoutonComptePortefeuille, setDisableCancelBoutonComptePortefeuille] = useState(true);
    const [disableSaveBoutonComptePortefeuille, setDisableSaveBoutonComptePortefeuille] = useState(true);
    const [disableDeleteBoutonComptePortefeuille, setDisableDeleteBoutonComptePortefeuille] = useState(true);
    const [disableAddRowBoutonComptePortefeuille, setDisableAddRowBoutonComptePortefeuille] = useState(false);
    const [editableRowComptePortefeuille, setEditableRowComptePortefeuille] = useState(true);
    const [openDialogDeleteComptePortefeuilleRow, setOpenDialogDeleteComptePortefeuilleRow] = useState(false);
    const [selectedRowComptePortefeuilles, setSelectedRowComptePortefeuilles] = useState([]);

    const selectedDossierIds = listeComptePortefeuille
        .map(val => Number(val.id_portefeuille))
        .filter(Boolean);

    const availablePortefeuille = listePortefeuille.filter(d =>
        !selectedDossierIds.includes(Number(d.id))
    );

    const handleCellEditCommitComptePortefeuille = (params) => {
        if (selectedRowIdComptePortefeuille.length > 1 || selectedRowIdComptePortefeuille.length === 0) {
            setEditableRowComptePortefeuille(false);
            setDisableModifyBoutonComptePortefeuille(true);
            setDisableSaveBoutonComptePortefeuille(true);
            setDisableCancelBoutonComptePortefeuille(true);
            toast.error("Sélectionnez une seule ligne pour pouvoir la modifier");
        } else {
            setDisableModifyBoutonComptePortefeuille(false);
            setDisableSaveBoutonComptePortefeuille(false);
            setDisableCancelBoutonComptePortefeuille(false);
            if (!selectedRowIdComptePortefeuille.includes(params.id)) {
                setEditableRowComptePortefeuille(false);
                toast.error("Sélectionnez une ligne pour pouvoir la modifier");
            } else {
                setEditableRowComptePortefeuille(true);
            }
        }
    };

    const saveSelectedRowComptePortefeuille = (ids) => {
        if (ids.length === 1) {
            setSelectedRowIdComptePortefeuille(ids);
            setDisableModifyBoutonComptePortefeuille(false);
            setDisableSaveBoutonComptePortefeuille(false);
            setDisableCancelBoutonComptePortefeuille(false);
            setDisableDeleteBoutonComptePortefeuille(false);
        } else {
            setSelectedRowIdComptePortefeuille([]);
            setDisableModifyBoutonComptePortefeuille(true);
            setDisableSaveBoutonComptePortefeuille(true);
            setDisableCancelBoutonComptePortefeuille(true);
            setDisableDeleteBoutonComptePortefeuille(true);
        }
    }

    const deselectRowComptePortefeuille = (ids) => {
        const deselected = selectedRowIdComptePortefeuille.filter(id => !ids.includes(id));

        const updatedRowModes = { ...rowModesModelComptePortefeuille };
        deselected.forEach((id) => {
            updatedRowModes[id] = { mode: GridRowModes.View, ignoreModifications: true };
        });
        setRowModesModelComptePortefeuille(updatedRowModes);

        setDisableAddRowBoutonComptePortefeuille(false);
        setSelectedRowIdComptePortefeuille(ids);
    }

    const handleRowModesModelChangeComptePortefeuille = (newRowModesModel) => {
        setRowModesModelComptePortefeuille(newRowModesModel);
    };

    const handleRowEditStopComptePortefeuille = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow };
        setListeComptePortefeuille(listeComptePortefeuille.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const columnComptePortefeuille = [
        {
            field: 'id_portefeuille',
            headerName: 'Portefeuille',
            type: 'text',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRowComptePortefeuille,
            renderCell: (params) => {
                const portefeuille = listePortefeuille.find(
                    val => val.id === Number(params.value)
                );

                return <div>{portefeuille?.nom || ''}</div>;
            },
            renderEditCell: (params) => {
                const { id, field, value, api } = params;

                const handleChange = (e) => {
                    useFormikComptePortefeuille.setFieldValue('idPortefeuille', e.target.value);
                    api.setEditCellValue({
                        id,
                        field,
                        value: e.target.value,
                    });
                };

                const selectedIdsExceptCurrent = listeComptePortefeuille
                    .filter(row => row.id !== id)
                    .map(row => Number(row.id_portefeuille));

                const options = listePortefeuille.filter(
                    d =>
                        !selectedIdsExceptCurrent.includes(Number(d.id)) ||
                        Number(d.id) === Number(value)
                )

                return (
                    <FormControl fullWidth>
                        <InputLabel id="select-compte-label">Choisir...</InputLabel>
                        <Select
                            labelId="select-compte-label"
                            value={value ?? ''}
                            onChange={handleChange}
                        >
                            {options.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.nom}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            }
        },
    ];

    const actionColumn = {
        field: 'actions',
        type: 'actions',
        headerName: 'ACTIONS',
        width: 100,
        cellClassName: 'actions',
        getActions: ({ id }) => {
            const isInEditMode = rowModesModelComptePortefeuille[id]?.mode === GridRowModes.Edit;

            if (isInEditMode) {
                return [
                    <GridActionsCellItem
                        icon={<CheckOutlined sx={{ color: '#10B981' }} />}
                        label="Save"
                        onClick={() => {
                            setSelectedRowIdComptePortefeuille([id]);
                            handleSaveClickComptePortefeuille();
                        }}
                        sx={{ bgcolor: '#e6fff5ff', mr: 1 }}
                    />,
                    <GridActionsCellItem
                        icon={<CloseOutlined sx={{ color: '#EF4444' }} />}
                        label="Cancel"
                        onClick={handleCancelClickComptePortefeuille([id])}
                        sx={{ bgcolor: '#FEF2F2' }}
                    />,
                ];
            }

            return [
                <GridActionsCellItem
                    icon={<EditOutlined sx={{ color: '#2563EB' }} />}
                    label="Edit"
                    onClick={() => {
                        setSelectedRowIdComptePortefeuille([id]);
                        setSelectedRowComptePortefeuilles([id]);
                        handleEditClickComptePortefeuille([id])();
                    }}
                    sx={{ bgcolor: '#EEF2FF', mr: 1 }}
                />,
                <GridActionsCellItem
                    icon={<DeleteOutline sx={{ color: '#94A3B8' }} />}
                    label="Delete"
                    onClick={() => {
                        setSelectedRowIdComptePortefeuille([id]);
                        setSelectedRowComptePortefeuilles([id]);
                        handleOpenDialogConfirmDeleteComptePortefeuilleRow();
                    }}
                    sx={{ bgcolor: '#FEF2F2' }}
                />,
            ];
        }
    };

    const finalColumns = [...columnComptePortefeuille, actionColumn];

    const deleteComptePortefeuilleRow = (value) => {
        if (value === true) {
            if (selectedRowComptePortefeuilles.length === 1) {
                setListeComptePortefeuille(listeComptePortefeuille.filter((row) => row.id !== selectedRowIdComptePortefeuille[0]));
                toast.success('Ligne supprimée avec succès');
                setOpenDialogDeleteComptePortefeuilleRow(false);
                setDisableAddRowBoutonComptePortefeuille(false);
            }
        } else {
            setOpenDialogDeleteComptePortefeuilleRow(false);
        }
    }

    // Ajouter une ligne dans le tableau liste compte dossier
    const handleOpenDialogAddNewComptePortefeuille = () => {
        setDisableModifyBoutonComptePortefeuille(false);
        setDisableCancelBoutonComptePortefeuille(false);
        setDisableDeleteBoutonComptePortefeuille(false);
        const newId = -Date.now();
        const newRow = {
            id: newId,
        };
        setListeComptePortefeuille([...listeComptePortefeuille, newRow]);
        setSelectedRowComptePortefeuilles([newRow.id]);
        setSelectedRowIdComptePortefeuille([newRow.id]);
        setDisableAddRowBoutonComptePortefeuille(true);
    }

    const handleEditClickComptePortefeuille = (id) => () => {
        const selectedRowInfos = listeComptePortefeuille?.filter((item) => item.id === id[0]);

        useFormikComptePortefeuille.setFieldValue("idPortefeuille", selectedRowInfos[0].id_portefeuille);
        useFormikComptePortefeuille.setFieldValue("idComptePortefeuille", selectedRowInfos[0].id);

        setRowModesModelComptePortefeuille({ ...rowModesModelComptePortefeuille, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBoutonComptePortefeuille(false);
    };

    const handleCancelClickComptePortefeuille = (id) => () => {
        setRowModesModelComptePortefeuille({
            ...rowModesModelComptePortefeuille,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setDisableAddRowBoutonComptePortefeuille(false);
    };

    const handleOpenDialogConfirmDeleteComptePortefeuilleRow = () => {
        setOpenDialogDeleteComptePortefeuilleRow(true);
        setDisableAddRowBoutonComptePortefeuille(false);
    }

    const handleSaveClickComptePortefeuille = () => {
        let saveBoolidPortefeuilleAutre = false;

        if (useFormikComptePortefeuille.values.idPortefeuille === '') {
            saveBoolidPortefeuilleAutre = false;
        } else {
            saveBoolidPortefeuilleAutre = true;
        }

        if (saveBoolidPortefeuilleAutre) {
            setRowModesModelComptePortefeuille({ ...rowModesModelComptePortefeuille, [selectedRowIdComptePortefeuille]: { mode: GridRowModes.View } });
            toast.success("Ligne sauvegardé avec succès");
            setDisableSaveBoutonComptePortefeuille(true);
            setDisableAddRowBoutonComptePortefeuille(false);
        }
    };

    return (
        <>
            <ConfirmDeleteDialog
                open={openDialogDeleteComptePortefeuilleRow}
                onClose={() => setOpenDialogDeleteComptePortefeuilleRow(false)}
                onConfirm={() => deleteComptePortefeuilleRow(true)}
                message="Voulez-vous vraiment supprimer la ligne sélectionnée ?"
            />
            <Stack width={"100%"} height={"100%"} spacing={3} alignItems={"flex-start"}
                alignContent={"flex-start"} justifyContent={"stretch"}
            >
                <Stack width={"100%"} minHeight={"56px"} spacing={1} alignItems={"center"} alignContent={"center"}
                    direction={"row"} justifyContent={"right"}
                >
                    <Tooltip title="Ajouter une ligne">
                        <span>
                            <Button
                                startIcon={<AddOutlined />}
                                // disabled={disableAddRowBoutonComptePortefeuille || availablePortefeuille.length === 0}
                                onClick={handleOpenDialogAddNewComptePortefeuille}
                                sx={{
                                    bgcolor: '#000000',
                                    color: '#FFFFFF',
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    px: 3,
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: '#222' },
                                    '&:disabled': { bgcolor: '#CCCCCC', color: '#666' }
                                }}
                            >
                                Ajouter
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>

                <Stack
                    width={"100%"}
                    height={"450px"}
                >
                    <DataGrid
                        disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                        disableColumnSelector={DataGridStyle.disableColumnSelector}
                        disableDensitySelector={DataGridStyle.disableDensitySelector}
                        disableRowSelectionOnClick
                        disableSelectionOnClick={true}
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                        slots={{ toolbar: QuickFilter }}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: '#F8FAFC',
                                borderBottom: '1px solid #E2E8F0',
                                '& .MuiDataGrid-columnHeaderTitle': {
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    color: '#64748B',
                                    textTransform: 'uppercase',
                                }
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid #F1F5F9',
                                '&:focus': { outline: 'none' }
                            },
                            '& .MuiDataGrid-row:hover': {
                                bgcolor: '#F1F5F930'
                            }
                        }}
                        rowHeight={DataGridStyle.rowHeight}
                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                        rows={listeComptePortefeuille}
                        onRowClick={(e) => handleCellEditCommitComptePortefeuille(e.row)}
                        onRowSelectionModelChange={ids => {
                            setSelectedRowComptePortefeuilles(ids);
                            saveSelectedRowComptePortefeuille(ids);
                            deselectRowComptePortefeuille(ids);
                        }}
                        editMode='row'
                        rowModesModel={rowModesModelComptePortefeuille}
                        onRowModesModelChange={handleRowModesModelChangeComptePortefeuille}
                        onRowEditStop={handleRowEditStopComptePortefeuille}
                        processRowUpdate={processRowUpdate}

                        columns={finalColumns}
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
                        rowSelectionModel={selectedRowComptePortefeuilles}
                        onRowEditStart={(params, event) => {
                            const rowId = params.id;
                            const rowData = params.row;

                            const isNewRow = rowId < 0;

                            if (!isNewRow) {
                                event.defaultMuiPrevented = true;
                                return;
                            }

                            event.stopPropagation();
                            setDisableAddRowBoutonComptePortefeuille(true);

                            useFormikComptePortefeuille.setFieldValue("idPortefeuille", rowData.id_portefeuille);
                            useFormikComptePortefeuille.setFieldValue("idComptePortefeuille", rowData.id);

                            setRowModesModelComptePortefeuille((oldModel) => ({
                                ...oldModel,
                                [rowId]: { mode: GridRowModes.Edit },
                            }));

                            setDisableSaveBoutonComptePortefeuille(false);
                        }}
                    />
                </Stack>

            </Stack>
        </>
    )
}

export default TabPortefeuille

