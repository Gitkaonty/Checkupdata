import { useState, useEffect } from 'react';
import { Typography, Stack, TextField, FormControl, Tooltip, Box, Input } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import InputAdornment from '@mui/material/InputAdornment';
import { TfiSave } from "react-icons/tfi";
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes, useGridApiRef } from '@mui/x-data-grid';
import { TbPlaylistAdd } from 'react-icons/tb';
import { IoMdTrash } from 'react-icons/io';
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";

import QuickFilter from '../../DatagridToolsStyle';
import PopupConfirmDelete from '../../popupConfirmDelete';
import { init } from '../../../../../init';
import axios from '../../../../../config/axios';
import FormatedInput from '../../FormatedInput';
import { DataGridStyle } from '../../DatagridToolsStyle';
import useAxiosPrivate from '../../../../../config/axiosPrivate';

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupAjustRubriqueEbilanEtatFinancier = ({ actionState, row, column, setIsRefreshed, value, canModify, canAdd, canDelete, canView, deviseParDefaut }) => {
    const apiRef = useGridApiRef();
    const axiosPrivate = useAxiosPrivate();
    const [selectedRowId, setSelectedRowId] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [disableDeleteBouton, setDisableDeleteBouton] = useState(true);
    const [disableAddRowBouton, setDisableAddRowBouton] = useState(false);

    const [editableRow, setEditableRow] = useState(true);
    const [openDialogDeleteRow, setOpenDialogDeleteRow] = useState(false);
    const nature = column === 'montantamort' ? 'AMORT' : 'BRUT';
    const [listAjust, setListAjust] = useState([]);
    const [totalAjustement, setTotalAjustement] = useState(0);
    const [stateUpdateTable, setStateUpdateTable] = useState({ tableName: '', state: false });

    const [selectedRow, setSelectedRow] = useState([]);

    const data = { ...row };
    const rubriqueCaption = data['libelle'];
    const idCompte = data.id_compte;
    const idDossier = data.id_dossier;
    const idExercice = data.id_exercice;
    const idRubrique = data.id_rubrique;
    const idEtat = data.id_etat;

    const [formDataFinal, setFormDataFinal] = useState({
        id: 0,
        state: false,
        id_compte: idCompte,
        id_dossier: idDossier,
        id_exercice: idExercice,
        id_rubrique: idRubrique,
        id_etat: idEtat,
        nature: nature,
        motif: '',
        montant: 0,
    });

    useEffect(() => {
        setTotalAjustement(totalColumn(listAjust, 'montant'));
    }, [listAjust]);

    const totalColumn = (rows, columnId) => {

        const total = rows.reduce((acc, item) => {
            const Value = parseFloat(item[columnId]) || 0;
            return acc + Value;
        }, 0);

        return total;
    };

    useEffect(() => {
        if (canView) {
            setListAjust(row?.ajusts?.filter(item => item.nature === nature) || []);
        }
    }, [row, canView]);

    const columnHeader = [
        {
            field: 'motif',
            headerName: 'Motif',
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
            renderEditCell: (params) => {
                return (
                    <FormControl fullWidth style={{ height: '120%' }}>
                        <Input
                            style={{
                                height: '100%', alignItems: 'center',
                                outline: 'none',
                                backgroundColor: 'transparent'
                            }}
                            type="text"
                            value={formDataFinal.motif}
                            onChange={handleChange}
                            label="motif"
                            name="motif"
                            disableUnderline={true}
                        />
                    </FormControl>
                );
            },
        },
        {
            field: 'montant',
            headerName: 'Montant',
            type: 'text',
            sortable: true,
            flex: 0.40,
            headerAlign: 'right',
            headerClassName: 'HeaderbackColor',
            disableClickEventBubbling: true,
            editable: editableRow,
            renderCell: (params) => (
                <TextField
                    size="small"
                    name="montantcharge"
                    value={params.value}
                    fullWidth
                    variant="standard"
                    InputProps={{
                        inputComponent: FormatedInput,
                        disableUnderline: true,
                        endAdornment: (
                            <InputAdornment position="end" sx={{ fontSize: 12 }}>
                                <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                            </InputAdornment>
                        ),
                        sx: {
                            height: '30px',
                            padding: 0,
                            '& .MuiInputBase-input': {
                                textAlign: 'right',
                                fontSize: 14,
                            },
                        },
                    }}
                />
            ),
            renderEditCell: (params) => {
                return (
                    <TextField
                        size="small"
                        name="montant"
                        value={formDataFinal.montant}
                        onChange={handleChange}
                        fullWidth
                        variant="standard"
                        style={{
                            width: '100%',
                            textAlign: 'right',
                        }}
                        onFocus={(e) => {
                            e.target.setSelectionRange(0, 0);
                        }}
                        InputProps={{
                            inputComponent: FormatedInput,
                            disableUnderline: true,
                            endAdornment: (
                                <InputAdornment position="end" sx={{ fontSize: 12 }}>
                                    <span style={{ fontSize: '13px' }}>{deviseParDefaut}</span>
                                </InputAdornment>
                            ),
                            sx: {
                                height: '30px',
                                padding: 0,
                                '& .MuiInputBase-input': {
                                    textAlign: 'right',
                                    fontSize: 14,
                                    display: 'flex',
                                    alignItems: 'right',
                                },
                            },
                        }}
                    />
                );
            },
        },
    ];

    const getInfosAjust = (compteId, dossierId, exerciceId, etatId, rubriqueId, nature) => {
        axios.get(`/administration/etatFinancier/getAjustementExterne`, {
            params: {
                compteId, dossierId, exerciceId, etatId, rubriqueId, nature
            }
        }).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setListAjust([]);
                const filteredData = resData.liste.filter(item => item.nature === nature);
                setListAjust(filteredData);
            } else {
                setListAjust([]);
            }
        });
    }

    const handleClose = async () => {
        actionState(stateUpdateTable);
    }

    const saveSelectedRow = (ids) => {
        if (ids?.length === 1) {
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
        const selectedRowInfos = listAjust?.filter((item) => item.id === id[0]);

        setFormDataFinal((prev) => ({
            ...prev,
            id: selectedRowInfos[0].id,
            id_compte: selectedRowInfos[0].id_compte,
            id_dossier: selectedRowInfos[0].id_dossier,
            id_exercice: selectedRowInfos[0].id_exercice,
            id_rubrique: selectedRowInfos[0].id_rubrique,
            id_etat: selectedRowInfos[0].id_etat,
            nature: selectedRowInfos[0].nature,
            motif: selectedRowInfos[0].motif,
            montant: selectedRowInfos[0].montant,
        }));

        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
        setDisableSaveBouton(false);
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        const newFormDataFinal = { ...formDataFinal, state: true };
        axiosPrivate.post(`/administration/etatFinancier/addModifyAjustementExterne`, newFormDataFinal).then((response) => {
            const resData = response.data;
            if (resData.state) {
                setIsRefreshed();
                setDisableSaveBouton(true);
                setDisableAddRowBouton(false);
                getInfosAjust(idCompte, idDossier, idExercice, idEtat, idRubrique, nature);
                toast.success(resData.msg);
            } else {
                toast.error(resData.msg);
            }
        });
    };

    const handleOpenDialogConfirmDelete = () => {
        setOpenDialogDeleteRow(true);
        setDisableAddRowBouton(false);
    }

    const deleteRow = (value) => {
        if (value === true) {
            if (selectedRowId?.length === 1) {
                const idToDelete = selectedRowId[0];
                if (idToDelete < 0) {
                    setOpenDialogDeleteRow(false);
                    setListAjust(listAjust?.filter((row) => row.id !== idToDelete));
                    return
                }
                axiosPrivate.delete(`/administration/etatFinancier/deleteAjustementExterne/${Number(idToDelete)}`).then((response) => {
                    const resData = response.data;

                    if (resData.state) {
                        setIsRefreshed();
                        setListAjust(listAjust?.filter((row) => row.id !== idToDelete));
                        setDisableAddRowBouton(false);

                        toast.success(resData.msg);
                        setOpenDialogDeleteRow(false);
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

    const processRowUpdate = () => (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setListAjust(listAjust?.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleCellEditCommit = (params) => {
        if (selectedRowId?.length > 1 || selectedRowId?.length === 0) {
            setEditableRow(false);
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
            setDisableCancelBouton(true);
        } else {
            setDisableModifyBouton(false);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
            if (!selectedRowId.includes(params.id)) {
                setEditableRow(false);
            } else {
                setEditableRow(true);
            }
        }
    };

    //Ajouter une ligne dans le tableau
    const handleOpenDialogAddNew = () => {
        setDisableModifyBouton(false);
        setDisableCancelBouton(false);
        setDisableDeleteBouton(false);

        const newId = -Date.now();
        let arrayId = [];
        arrayId = [...arrayId, newId];

        setFormDataFinal((prev) => ({
            ...prev,
            id: newId,
        }));

        const newRow = {
            id: newId,
            id_compte: idCompte,
            id_dossier: idDossier,
            id_exercice: idExercice,
            id_rubrique: idRubrique,
            id_etat: idEtat,
            nature: nature,
            motif: '',
            montant: 0
        };
        setListAjust([...listAjust, newRow]);
        setSelectedRowId([newRow.id]);
        setSelectedRow([newRow.id]);
        setDisableAddRowBouton(true);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormDataFinal((prev) => ({
            ...prev,
            [name]: value,
        }));
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
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth={true}
                maxWidth='md'
            >
                <DialogTitle sx={{ ml: 1, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'normal', width: '850px', height: '50px', backgroundColor: 'transparent' }}>
                    <Typography variant={'h8'} style={{ fontZise: 10 }}>
                        Ajustement {nature} - {rubriqueCaption}
                    </Typography>
                </DialogTitle>

                <IconButton
                    style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>

                    <Stack width={"97%"} height={"500px"} spacing={2} alignItems={'left'} alignContent={"center"}
                        direction={"column"} justifyContent={"center"} style={{ marginLeft: '10px', marginRight: '10px' }}
                    >
                        <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                            direction={"row"} justifyContent={"right"}
                        >
                            <Tooltip title="Ajouter une ligne">
                                <IconButton
                                    disabled={!canAdd || disableAddRowBouton}
                                    onClick={handleOpenDialogAddNew}
                                    variant="contained"
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
                                    onClick={handleEditClick(selectedRowId)}
                                    variant="contained"
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
                                        onClick={handleSaveClick(selectedRowId)}
                                        disabled={(!canAdd && !canModify) || disableSaveBouton}
                                        variant="contained"
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
                                        onClick={handleCancelClick(selectedRowId)}
                                        variant="contained"
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
                                        onClick={handleOpenDialogConfirmDelete}
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
                            height={"420px"}
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
                                sx={{
                                    ...DataGridStyle.sx,
                                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                        outline: 'none',
                                        border: 'none',
                                    },
                                }}
                                rowHeight={DataGridStyle.rowHeight}
                                columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                                rows={listAjust}
                                onRowClick={(e) => handleCellEditCommit(e.row)}
                                onRowSelectionModelChange={ids => {
                                    const singleSelection = ids.length > 0 ? [ids[ids.length - 1]] : [];

                                    setSelectedRow(singleSelection);
                                    saveSelectedRow(singleSelection);
                                    deselectRow(singleSelection);
                                }}
                                editMode='row'
                                selectionModel={selectedRowId}
                                rowModesModel={rowModesModel}
                                onRowModesModelChange={(newModel) => handleRowModesModelChange(newModel)}
                                onRowEditStop={handleRowEditStop}
                                processRowUpdate={processRowUpdate}

                                columns={columnHeader}
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

                                    setFormDataFinal((prev) => ({
                                        ...prev,
                                        id: rowId,
                                        id_compte: rowData.id_compte,
                                        id_dossier: rowData.id_dossier,
                                        id_exercice: rowData.id_exercice,
                                        id_rubrique: rowData.id_rubrique,
                                        id_etat: rowData.id_etat,
                                        nature: rowData.nature,
                                        motif: rowData.motif,
                                        montant: rowData.montant,
                                    }));

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

                        <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                            direction={"row"} justifyContent={"right"}
                            style={{ marginTop: 10 }}
                        >
                            <Box display="flex" alignItems="center" mb={0}>
                                <Typography
                                    variant="body2"
                                    style={{ marginRight: 1, width: '150px', color: '#1976d2' }}
                                >
                                    Total des ajustements:
                                </Typography>
                                <TextField
                                    size="small"
                                    name="montantcharge"
                                    value={totalAjustement}
                                    fullWidth
                                    variant="standard"
                                    style={{
                                        width: '150px',
                                        textAlign: 'right',
                                    }}
                                    InputProps={{
                                        inputComponent: FormatedInput,
                                        disableUnderline: true,
                                        endAdornment: (
                                            <InputAdornment position="end" sx={{ fontSize: 12 }}>
                                                <span style={{ fontSize: '13px', color: '#1976d2' }}>{deviseParDefaut}</span>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            height: '30px',
                                            padding: 0,
                                            '& .MuiInputBase-input': {
                                                textAlign: 'right',
                                                fontSize: 14,
                                                padding: '4px 0 4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: '#1976d2'
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Stack>

                </DialogContent>
                <DialogActions>
                    <Button
                        autoFocus
                        onClick={handleClose}
                        style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                    >
                        Fermer
                    </Button>
                </DialogActions>
            </BootstrapDialog>
        </>

    )
}

export default PopupAjustRubriqueEbilanEtatFinancier;
