import { Autocomplete, Box, Checkbox, IconButton, Paper, Stack, TextField, Tooltip } from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter, { DataGridStyle } from '../DatagridToolsStyle';

import { TbPlaylistAdd } from "react-icons/tb";
import { IoMdTrash } from "react-icons/io";
import { FaRegPenToSquare } from "react-icons/fa6";
import { init } from '../../../../init';

import PopupConfirmDelete from '../popupConfirmDelete';
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

    // Ouverture du dialogue de suppression
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

    // Fermerture de la dialoge d'ajout
    const handleCloseDialogConfirmAddSousCompte = (value) => {
        setOpenDialogAddSousCompte(false);
    }

    // Charger la liste des portefeuille
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

    // Charger la liste des dossier liés au compte
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

    // Charger la liste des comptes au dossier
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

    // Charger la liste des comptes au portefeuille
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

    // Récupérer la liste des roles
    const getAllRoles = () => {
        axios.get('sous-compte/getAllRoles')
            .then(response => {
                const resData = response?.data;
                setListeRoles(resData);
            })
    }

    // Suppréssion d'une sous-compte
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

    return (
        <>
            {
                openDialogDeleteSousCompte ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment supprimer ${selectedRowSousCompteIds.length > 1 ? 'les lignes sélectionnées ?' : 'la ligne sélectionnée ?'}`}
                        confirmationState={deleteSelectedSousCompte}
                    />
                    :
                    null
            }
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
                    <Stack>
                        <IconButton
                            disabled={!selectedRowCompteIds}
                            onClick={() => handleOpenDialogConfirmAddSousCompte('Ajout')}
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
                    </Stack>
                </Tooltip>

                <Tooltip title="Modifier la ligne sélectionnée">
                    <Stack
                        style={{
                            marginLeft: '3px',
                            marginRight: '3px'
                        }}
                    >
                        <IconButton
                            disabled={selectedRowSousCompteIds.length === 0}
                            onClick={() => handleOpenDialogConfirmAddSousCompte('Modification')}
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
                    </Stack>
                </Tooltip>

                <Tooltip title="Supprimer la ligne sélectionnée">
                    <Stack
                    >
                        <IconButton
                            disabled={selectedRowSousCompteIds.length === 0}
                            onClick={handleOpenDialogConfirmDeleteSousCompte}
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
                    </Stack>
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
                    columns={columns}
                    disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                    disableColumnSelector={DataGridStyle.disableColumnSelector}
                    disableDensitySelector={DataGridStyle.disableDensitySelector}
                    disableRowSelectionOnClick
                    disableSelectionOnClick={true}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    slots={{
                        toolbar: QuickFilter,
                    }}
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