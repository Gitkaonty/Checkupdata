import { useState, useRef } from 'react';
import { Stack, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../init';
import { DataGridStyle } from './DatagridToolsStyle';
import QuickFilter from './DatagridToolsStyle';
import { DataGrid, frFR, GridRowModes } from '@mui/x-data-grid';
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";
import { TfiSave } from "react-icons/tfi";
import axios from '../../../../kaonti/config/axios';
import toast from 'react-hot-toast';
import { BsCheckLg } from "react-icons/bs";
import ListeCompteNonAssocie from './DeclarationEbilan/ListeCompteNonAssocie';

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupDetailAnomalie = ({ id_compte, id_dossier, id_exercice, title, rows, confirmationState, tableToRefresh }) => {
    const handleCloseDeleteModel = () => {
        confirmationState(true);
    }

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [newRow, setNewRow] = useState([]);
    const [editRow, setEditRow] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [disableModifyBouton, setDisableModifyBouton] = useState(true);
    const [disableCancelBouton, setDisableCancelBouton] = useState(true);
    const [disableSaveBouton, setDisableSaveBouton] = useState(true);
    const [listeAnomalie, setListeAnomalie] = useState(rows);

    const editRowRef = useRef(null);

    //colonne du tableau
    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            width: 80,
            editable: false
        },
        {
            field: 'anomalie',
            headerName: 'Anomalies',
            width: 900,
            editable: false
        },
        {
            field: 'valide',
            headerName: 'Validée',
            width: 80,
            editable: true,
            type: 'boolean',
            renderCell: (params) => (
                <span style={{
                    color: params.value ? 'green' : 'red',
                    fontWeight: 'bold'
                }}>
                    {params.value ? <BsCheckLg style={{ width: 25, height: 25 }} /> : <CloseIcon />}
                </span>
            )
        },
        {
            field: 'comments',
            headerName: 'Commentaires',
            width: 470,
            editable: true,
        },
    ];

    //save modification
    const handleEditClick = (ids) => () => {
        if (ids.length === 1) {
            const row = rows.find(r => r.id === ids[0]);
            setEditRow(row);
            setNewRow(null);
            setRowModesModel({ ...rowModesModel, [ids[0]]: { mode: GridRowModes.Edit } });
            setDisableSaveBouton(false);
        }
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const processRowUpdate = (updatedRow) => {
        //setEditRow(updatedRow);
        editRowRef.current = updatedRow;
        return updatedRow;
    }

    const saveSelectedRow = (ids) => {
        if (ids.length === 1) {
            setSelectedRowId(ids);
            setDisableModifyBouton(false);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
        } else {
            setSelectedRowId([]);
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
            setDisableCancelBouton(true);
        }
    }

    const handleSaveClick = (ids) => () => {
        if (ids.length === 1) {
            const id = ids[0];

            // Étape 1 : forcer la fin d’édition
            setRowModesModel((prevModel) => ({
                ...prevModel,
                [id]: { mode: GridRowModes.View },
            }));

            setTimeout(() => {
                const rowToSave = editRowRef.current;
                if (rowToSave) {
                    axios.put(`/declaration/ebilan/savemodifAnom/${rowToSave.id}`, rowToSave)
                        .then(res => {
                            if (res.data && res.data.state) {
                                //fetchPersonnels();
                                setEditRow(null);
                                setNewRow(null);
                                setRowModesModel({});
                                setSelectedRowId([]);
                                setDisableSaveBouton(true);
                                setDisableModifyBouton(true);
                                setDisableCancelBouton(true);
                                setListeAnomalie(res.data.liste);
                                editRowRef.current = null;
                                toast.success(res.data.msg || 'Modifications effectuées avec succès.');
                            } else {
                                toast.error(res.data.msg || 'Erreur lors de la modification');
                            }
                        })
                        .catch(() => toast.error('Erreur lors de la modification'));
                }
            }, 100);
        }
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
    };

    return (
        <BootstrapDialog
            onClose={handleCloseDeleteModel}
            aria-labelledby="customized-dialog-title"
            open={true}
            maxWidth='xl'
            fullWidth={true}
        >
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title" style={{ fontWeight: 'normal', width: '600px', height: '50px', backgroundColor: 'transparent' }}>
                Liste des anomalies du tableau {title}
            </DialogTitle>

            <IconButton
                style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                aria-label="close"
                onClick={handleCloseDeleteModel}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent >
                <Stack width={'100%'} height={'30vw'}>
                    <Stack width={"100%"} height={"30px"} spacing={0.5} alignItems={"center"} alignContent={"center"}
                        direction={"row"} justifyContent={'space-between'} >
                        <Stack
                            width={'50%'}
                        >
                            {
                                ['TFTD'].includes(tableToRefresh) && (
                                    <ListeCompteNonAssocie
                                        id_compte={id_compte}
                                        id_dossier={id_dossier}
                                        id_exercice={id_exercice}
                                        id_etat={tableToRefresh}
                                    />
                                )
                            }
                        </Stack>
                        <Stack
                            direction={'row'} spacing={0.5}
                        >
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
                        </Stack>
                    </Stack>

                    <DataGrid
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
                        columns={columns}
                        rows={listeAnomalie}
                        onRowSelectionModelChange={ids => {
                            saveSelectedRow(ids);
                        }}
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
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
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={handleCloseDeleteModel}
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                >
                    Fermer
                </Button>
            </DialogActions>
        </BootstrapDialog>
    )
}

export default PopupDetailAnomalie;
