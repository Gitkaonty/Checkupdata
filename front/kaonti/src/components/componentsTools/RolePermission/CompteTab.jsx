/* eslint-disable react/prop-types */
import { Autocomplete, Box, Checkbox, IconButton, Paper, Stack, TextField, Tooltip, Button } from '@mui/material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import QuickFilter, { DataGridStyle } from '../DatagridToolsStyle';

import { TbPlaylistAdd } from "react-icons/tb";
import { EditOutlined, DeleteOutline, AddOutlined } from "@mui/icons-material";
import { init } from '../../../../init';

import ConfirmDeleteDialog from '../../ConfirmDeleteDialog';
import { useEffect, useState } from 'react';
import PopupAddSousCompte from '../../menuComponent/Compte/PopupAddSousCompte';
import axios from '../../../../config/axios';
import toast from 'react-hot-toast';

const initial = init[0];

const CompteTab = ({
    rows,
    setRows,
    columns,
    selectedRowCompteIds,
    infoCompte,
    isRefreshedSousCompte,
    setIsRefreshedSousCompte,
    userId
}) => {
    const [selectedRowSousCompteIds, setSelectedRowSousCompteIds] = useState([]);
    const [rowSelectionModel, setRowSelectionModel] = useState([]);
    const [selectedRow, setSelectedRow] = useState({});

    const [listeRoles, setListeRoles] = useState([]);
    const [listePortefeuille, setListePortefeuille] = useState([]);
    const [listeDossier, setListeDossier] = useState([]);
    const [listeCompteDossier, setListeCompteDossier] = useState([]);
    const [listeComptePortefeuille, setListeComptePortefeuille] = useState([]);
    const [actionSousCompte, setActionSousCompte] = useState('');

    const [openDialogDeleteSousCompte, setOpenDialogDeleteSousCompte] = useState(false);
    const [openDialogAddSousCompte, setOpenDialogAddSousCompte] = useState(false);

    const handleOpenDialogConfirmDeleteSousCompte = () => {
        setOpenDialogDeleteSousCompte(true);
    }

    // Ouverture du dialogue d'ajout
    const handleOpenDialogConfirmAddSousCompte = (type) => {
        if (!selectedRowCompteIds) {
            setOpenDialogAddSousCompte(false);
            return toast.error('Veuillez sélectionner une seule compte pour ajouter une sous compte');
        }
        setActionSousCompte(type);
        setOpenDialogAddSousCompte(true);
    }

    const handleCloseDialogConfirmAddSousCompte = (value) => {
        setOpenDialogAddSousCompte(false);
    }

    const getAllPortefeuille = () => {
        axios.get(`/param/portefeuille/getAllPortefeuille/${selectedRowCompteIds}`)
            .then(response => {
                const resData = response?.data;
                if (resData?.state) {
                    setListePortefeuille(resData?.list)
                } else {
                    toast.error(resData?.message);
                }
            })
    };

    const getAllDossierByCompte = () => {
        axios.get(`/home/getAllDossierByCompte/${selectedRowCompteIds}`)
            .then(response => {
                const resData = response?.data;
                if (resData?.state) {
                    setListeDossier(resData?.fileList);
                } else {
                    toast.error(resData?.message);
                }
            })
    }

    const getCompteDossier = () => {
        axios.get(`/home/getCompteDossier/${selectedRow.id}`)
            .then(response => {
                const resData = response?.data;
                if (resData?.state) {
                    setListeCompteDossier(resData?.fileList);
                } else {
                    toast.error(resData?.message);
                }
            })
    }

    const getAllComptePortefeuilles = () => {
        axios.get(`/sous-compte/getAllComptePortefeuilles/${selectedRow.id}`)
            .then(response => {
                const resData = response?.data;
                if (resData?.state) {
                    setListeComptePortefeuille(resData?.walletlist);
                } else {
                    toast.error(resData?.message);
                }
            })
    }

    const getAllRoles = () => {
        axios.get('sous-compte/getAllRoles')
            .then(response => {
                const resData = response?.data;
                setListeRoles(resData);
            })
    }

    const deleteSelectedSousCompte = (value) => {
        if (value) {
            axios.post('/sous-compte/deleteSelectedSousCompte', {
                sousCompteIds: selectedRowSousCompteIds
            })
                .then((response) => {
                    if (response?.data?.state) {
                        const updatedRowsList = rows.filter((row) => !selectedRowSousCompteIds.includes(row.id));
                        setRows(updatedRowsList);
                        setOpenDialogDeleteSousCompte(false);
                        setSelectedRowSousCompteIds([]);
                        toast.success(response?.data?.message);
                    } else {
                        toast.error(response?.data?.message);
                    }
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.message) {
                        toast.error(err.response.data.message);
                    } else {
                        toast.error(err.message || "Erreur inconnue");
                    }
                })
        } else {
            setOpenDialogDeleteSousCompte(false);
        }
    }

    useEffect(() => {
        if (selectedRowCompteIds) {
            getAllRoles();
            getAllPortefeuille();
            getAllDossierByCompte();
        }
    }, [selectedRowCompteIds])

    useEffect(() => {
        if (selectedRow?.id) {
            getCompteDossier();
            getAllComptePortefeuilles();
        } else {
            setListeCompteDossier([]);
        }
    }, [selectedRow]);
    const buttonStyle = {
        minWidth: 120,
        height: 32,
        px: 2,
        textTransform: 'none',
        fontSize: '0.85rem',
        borderRadius: '2px',
        boxShadow: 'none',
        '& .MuiTouchRipple-root': {
            display: 'none',
        },
        '&:focus': {
            outline: 'none',
        },
        '&.Mui-focusVisible': {
            outline: 'none',
            boxShadow: 'none',
        },

        '&:hover': {
            boxShadow: 'none',
            backgroundColor: 'action.hover',
            border: 'none',
        },

        '&.Mui-disabled': {
            opacity: 0.4
        },
    };

    const actionColumn = {
        field: 'actions',
        type: 'actions',
        headerName: 'ACTIONS',
        width: 100,
        cellClassName: 'actions',
        getActions: ({ id, row }) => {
            return [
                <GridActionsCellItem
                    icon={<EditOutlined sx={{ color: '#2563EB' }} />}
                    label="Edit"
                    onClick={() => {
                        setSelectedRow(row);
                        setSelectedRowSousCompteIds([id]);
                        handleOpenDialogConfirmAddSousCompte('Modification');
                    }}
                    sx={{ bgcolor: '#EEF2FF', mr: 1 }}
                />,
                <GridActionsCellItem
                    icon={<DeleteOutline sx={{ color: '#94A3B8' }} />}
                    label="Delete"
                    onClick={() => {
                        setSelectedRowSousCompteIds([id]);
                        handleOpenDialogConfirmDeleteSousCompte();
                    }}
                    sx={{ bgcolor: '#FEF2F2' }}
                />,
            ];
        }
    };

    const finalColumns = [...columns, actionColumn];

    return (
        <>
            <ConfirmDeleteDialog
                open={openDialogDeleteSousCompte}
                onClose={() => setOpenDialogDeleteSousCompte(false)}
                onConfirm={() => deleteSelectedSousCompte(true)}
                message={`Voulez-vous vraiment supprimer ${selectedRowSousCompteIds.length > 1 ? 'les lignes sélectionnées ?' : 'la ligne sélectionnée ?'}`}
            />
            {
                openDialogAddSousCompte
                    ?
                    <PopupAddSousCompte
                        confirmationState={handleCloseDialogConfirmAddSousCompte}
                        selectedRowCompteIds={selectedRowCompteIds}
                        isRefreshedSousCompte={isRefreshedSousCompte}
                        setIsRefreshedSousCompte={setIsRefreshedSousCompte}
                        rowSelectedData={infoCompte}
                        listeRoles={listeRoles}
                        listePortefeuille={listePortefeuille}
                        listeDossier={listeDossier}
                        selectedRow={selectedRow}
                        setSelectedRow={setSelectedRow}
                        actionSousCompte={actionSousCompte}
                        listeCompteDossier={listeCompteDossier}
                        setListeCompteDossier={setListeCompteDossier}
                        userId={userId}
                        listeComptePortefeuille={listeComptePortefeuille}
                        setListeComptePortefeuille={setListeComptePortefeuille}
                    />
                    :
                    null
            }
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-start',
                    padding: '10px',
                }}
            >
                <Tooltip title="Ajouter une ligne">
                    <Button
                        onClick={() => handleOpenDialogConfirmAddSousCompte('Ajout')}
                        variant="contained"
                        size="small"
                        startIcon={<AddOutlined />}
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
                </Tooltip>
            </Box>
            <Stack
                width="100%"
                height="700px"
                style={{
                    marginLeft: "0px",
                    marginTop: "20px",
                    overflow: "auto",
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={finalColumns}
                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                    disableRowSelectionOnClick
                    disableSelectionOnClick={true}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
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
                    editMode='row'
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 100 },
                        },
                    }}
                    experimentalFeatures={{ newEditingApi: true }}
                    pageSizeOptions={[5, 10, 20, 30, 50, 100]}
                    pagination={DataGridStyle.pagination}
                    checkboxSelection={DataGridStyle.checkboxSelection}
                    columnVisibilityModel={{
                        id: false,
                    }}
                    columnResizable
                    rowSelectionModel={rowSelectionModel}
                    onRowSelectionModelChange={(newSelection) => {
                        const single = Array.isArray(newSelection) && newSelection.length ? [newSelection[newSelection.length - 1]] : [];

                        const row = rows.find(row => row.id === single[0]);
                        setSelectedRow(row);

                        setRowSelectionModel(single);
                        setSelectedRowSousCompteIds(single);
                    }}
                />


            </Stack>
        </>
    )
}

export default CompteTab