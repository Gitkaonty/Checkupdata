import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Typography, Stack, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../init';
import { CiWarning } from "react-icons/ci";
import { IoIosWarning } from "react-icons/io";
import { DataGridStyle } from './DatagridToolsStyle';
import QuickFilter from './DatagridToolsStyle';
import { DataGrid, frFR, GridRowEditStopReasons, GridRowModes } from '@mui/x-data-grid';
import { FaRegPenToSquare } from "react-icons/fa6";
import { VscClose } from "react-icons/vsc";
import { TfiSave } from "react-icons/tfi";
import { BsCheckLg } from "react-icons/bs";
import axios from '../../../config/axios';
import toast from 'react-hot-toast';

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const PopupDetailAnomalie = ({ title, rows, confirmationState, canEdit = true, onAnomaliesChanged }) => {
    const handleCloseDeleteModel = () => {
        confirmationState(true);
    }

    const [selectedRowId, setSelectedRowId] = useState([]);
    const [newRow, setNewRow] = useState([]);
    const [editRow, setEditRow] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [disableModifyBouton, setDisableModifyBouton] = useState(!canEdit);
    const [disableCancelBouton, setDisableCancelBouton] = useState(!canEdit);
    const [disableSaveBouton, setDisableSaveBouton] = useState(!canEdit);
    const [listeAnomalie, setListeAnomalie] = useState(Array.isArray(rows) ? rows : []);

    // Synchroniser avec la liste reçue (sans vider)
    useEffect(() => {
        const safe = Array.isArray(rows) ? rows : [];
        // Ne pas écraser la saisie locale si on est en train d'éditer
        if (!isEditing) {
            setListeAnomalie(safe);
            // Préserver la sélection si l'ID est toujours présent
            const setIds = new Set(safe.map(r => String(r.id)));
            if (selectedRowId && selectedRowId.length === 1 && setIds.has(String(selectedRowId[0]))) {
                // keep selection
            } else {
                // clear selection si la ligne n'existe plus
                setSelectedRowId([]);
                setDisableModifyBouton(!canEdit);
                setDisableSaveBouton(!canEdit);
                setDisableCancelBouton(!canEdit);
            }
        }
    }, [rows, selectedRowId, isEditing, canEdit]);

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
            field: 'groupe',
            headerName: 'Groupe',
            width: 100,
            editable: false,
        },
        {
            field: 'anomalie',
            headerName: 'Anomalies',
            width: 900,
            editable: false,
            renderCell: (params) => (
                <span style={{
                    whiteSpace: 'pre-line',
                    lineHeight: 1.4,
                    overflowWrap: 'anywhere'
                }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'valide',
            headerName: 'Validée',
            width: 100,
            editable: true,
            type: 'boolean',
            renderCell: (params) => (
                <span style={{
                    color: params.value ? 'green' : 'red',
                    fontWeight: 'bold'
                }}>
                    {params.value ? <BsCheckLg style={{ width: 20, height: 20 }} /> : <CloseIcon fontSize="small" />}
                </span>
            )
        },
        {
            field: 'commentaire',
            headerName: 'Commentaires',
            width: 470,
            editable: true,
        },
    ];

    const handleEditClick = (ids) => {
        // console.log('[ANOMS][POPUP] handleEditClick ids=', ids, 'selectedRowId=', selectedRowId);
        if (ids.length === 1 && canEdit) {
            const row = listeAnomalie.find(r => String(r.id) === String(ids[0]));
            if (row && row._persisted === false) {
                toast.error("Impossible de modifier une anomalie non enregistrée en base");
                return;
            }
            // console.log('[ANOMS][POPUP] editing row found=', row);
            setEditRow(row);
            setNewRow(null);
            setRowModesModel(prev => ({
                ...prev,
                [ids[0]]: { mode: GridRowModes.Edit }
            }));
            setIsEditing(true);
            setDisableSaveBouton(false);
            setDisableCancelBouton(false);
        }
    };


    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const processRowUpdate = (updatedRow) => {
        // console.log('[ANOMS][POPUP] processRowUpdate updatedRow=', updatedRow);
        editRowRef.current = updatedRow;
        setListeAnomalie(prev => prev.map(r => String(r.id) === String(updatedRow.id)
            ? { ...r, commentaire: updatedRow.commentaire, valide: updatedRow.valide }
            : r));
        return updatedRow;
    }

    const saveSelectedRow = (ids) => {
        // console.log('[ANOMS][POPUP] saveSelectedRow ids=', ids);
        if (ids.length === 1) {
            setSelectedRowId(ids);
            // console.log('[ANOMS][POPUP] selection set to', ids);
            setDisableModifyBouton(!canEdit ? true : false);
            setDisableSaveBouton(!canEdit ? true : false);
            setDisableCancelBouton(!canEdit ? true : false);
        } else {
            setSelectedRowId([]);
            // console.log('[ANOMS][POPUP] selection cleared');
            setDisableModifyBouton(true);
            setDisableSaveBouton(true);
            setDisableCancelBouton(true);
        }
    }

    // Sauvegarder via API (PATCH /declaration/tva/anomalies/:id)
    const handleSaveClick = () => async () => {
        try {
            if (!(selectedRowId && selectedRowId.length === 1)) return;
            const id = selectedRowId[0];
            // 1) Forcer la sortie du mode édition pour valider les changements via processRowUpdate
            setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.View } }));
            // 2) Récupérer la dernière valeur éditée
            const latest = editRowRef.current || listeAnomalie.find(r => String(r.id) === String(id));
            if (!latest) return;
            if (latest._persisted === false) {
                toast.error("Impossible d'enregistrer: anomalie non persistée en base");
                return;
            }
            // Préparer payload par clé fonctionnelle (contexte + code + kind)
            const payload = {
                id_dossier: latest.id_dossier,
                id_compte: latest.id_compte,
                id_exercice: latest.id_exercice,
                mois: latest.mois,
                annee: latest.annee,
                code: latest.code,
                kind: latest.kind,
                commentaire: latest.commentaire ?? null,
                valide: !!latest.valide,
            };
            const { data } = await axios.patch(`/declaration/tva/anomalies/by-key`, payload);
            if (data?.state) {
                const updated = data.item || latest;
                setListeAnomalie(prev => prev.map(r => String(r.id) === String(id) ? { ...r, commentaire: updated.commentaire, valide: updated.valide } : r));
                setEditRow(null);
                setDisableModifyBouton(true);
                setDisableSaveBouton(true);
                setDisableCancelBouton(true);
                setSelectedRowId([]);
                setIsEditing(false);
                toast.success('Anomalie enregistrée');
                try { onAnomaliesChanged && onAnomaliesChanged(); } catch { }
            } else {
                toast.error(data?.msg || 'Échec de la sauvegarde');
            }
        } catch (e) {
            console.error('[POPUP][PATCH] error', e);
            toast.error('Erreur serveur lors de la sauvegarde');
        }
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
        setEditRow(null);
        setDisableModifyBouton(true);
        setDisableSaveBouton(true);
        setDisableCancelBouton(true);
        setSelectedRowId([]);
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
                        direction={"row"} justifyContent={"right"}>

                        <Tooltip title={canEdit ? "Modifier la ligne sélectionnée" : "Edition désactivée (aucune anomalie en base)"}>
                            <span>
                                <IconButton
                                    disabled={disableModifyBouton || !canEdit}
                                    onClick={() => handleEditClick(selectedRowId)}
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
                            </span>
                        </Tooltip>

                        <Tooltip title={canEdit ? "Sauvegarder les modifications" : "Edition désactivée (aucune anomalie en base)"}>
                            <span>
                                <IconButton
                                    disabled={disableSaveBouton || !canEdit}
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

                    <DataGrid
                        disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                        disableColumnSelector={DataGridStyle.disableColumnSelector}
                        disableDensitySelector={DataGridStyle.disableDensitySelector}
                        disableRowSelectionOnClick={false}
                        disableSelectionOnClick={false}
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                        slots={{ toolbar: QuickFilter }}
                        sx={{
                            ...DataGridStyle.sx,
                            '& .MuiDataGrid-cell': { alignItems: 'flex-start' },
                            '& .MuiDataGrid-cellContent': { whiteSpace: 'pre-line' },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                                border: 'none',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                maxHeight: '100%',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: initial.theme,
                                color: 'white',
                                fontWeight: 'bold',
                            }
                        }}
                        getRowHeight={() => 'auto'}
                        rowHeight={null}

                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                        editMode='row'
                        columns={columns}
                        rows={listeAnomalie}
                        getRowId={(row) => String(row.id)}
                        rowSelectionModel={selectedRowId}
                        onRowSelectionModelChange={ids => {
                            // console.log('[ANOMS][POPUP] onRowSelectionModelChange=', ids);
                            // Normalize to string IDs to match getRowId
                            const norm = Array.isArray(ids) ? ids.map(x => String(x)) : [];
                            saveSelectedRow(norm);
                        }}
                        onCellDoubleClick={(params) => {
                            const id = params?.id;
                            if (id !== undefined) {
                                saveSelectedRow([id]);
                                handleEditClick([id]);
                            }
                        }}
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        onRowEditStop={(params, event) => {
                            // Empêcher la sortie d'édition sur perte de focus pour éviter pertes de frappe
                            if (params.reason === GridRowEditStopReasons.rowFocusOut) {
                                event.defaultMuiPrevented = true;
                            }
                        }}
                        processRowUpdate={processRowUpdate}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 100 },
                            },
                        }}
                        experimentalFeatures={{ newEditingApi: true }}
                        pageSizeOptions={[50, 100]}
                        pagination={DataGridStyle.pagination}
                        checkboxSelection
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
