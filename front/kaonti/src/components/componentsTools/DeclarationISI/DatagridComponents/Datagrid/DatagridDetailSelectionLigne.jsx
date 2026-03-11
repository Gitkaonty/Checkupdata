import { useState, useEffect } from 'react';
import { Autocomplete, Button, FormControl, Stack, TextField, Tooltip } from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import { DataGridStyle } from '../../../DatagridToolsStyle.jsx';
import QuickFilter from '../../../DatagridToolsStyle.jsx';
import { init } from '../../../../../../init.js';

import DatagridColumnsSelectionLigne from '../../DatagridHeaders/DatagridColumnsSelectionLigne.jsx';
import axios from '../../../../../../config/axios.js';

import { GrPrevious } from "react-icons/gr";
import { GrNext } from "react-icons/gr";
import toast from 'react-hot-toast';

import { IoMdRemoveCircleOutline } from "react-icons/io";
import { FaRegCheckCircle } from "react-icons/fa";
import useAxiosPrivate from '../../../../../../config/axiosPrivate.js';

const initial = init[0];

const DatagridDetailSelectionLigne = ({
    DATAGRID_HEIGHT,
    valSelectMois,
    valSelectAnnee,
    compteId,
    selectedExerciceId,
    fileId,
    compteisi,
    valSelectedCompte,
    setValSelectedCompte,
    setIsDetailSelectionRefreshed,
    setIsDetailEcritureRefreshed,
    isDetailSelectionRefreshed,
    listDetailSelection,
    listePlanComptable,
    filteredList,
    canModify,
    canAdd,
    canDelete,
    canView
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [selectedDetailRows, setSelectedDetailRows] = useState([]);

    //Variable qui recupère si il y a au moins une declisi true sur les lignes selectionnées
    const hasDeclisiTrue = selectedDetailRows.some(id => {
        const row = listDetailSelection.find(item => item.id === id);
        return row?.declisi === true;
    });

    //Variable qui recupère si il y a au moins une declisi false sur les lignes selectionnées
    const hasDeclisiFalse = selectedDetailRows.some(id => {
        const row = listDetailSelection.find(item => item.id === id);
        return row?.declisi === false;
    });

    const handlePrevious = () => {
        const currentIndex = listePlanComptable.findIndex(item => item.id === Number(valSelectedCompte));
        if (currentIndex > 0) {
            setValSelectedCompte(listePlanComptable[currentIndex - 1].id);
        } else if (currentIndex === 0) {
            setValSelectedCompte("tout");
        }
    };

    const handleNext = () => {
        const currentIndex = listePlanComptable.findIndex(item => item.id === Number(valSelectedCompte));
        if (currentIndex < listePlanComptable.length - 1) {
            setValSelectedCompte(listePlanComptable[currentIndex + 1].id);
        }
    };

    // Modification du moi et année dans journal
    const updateAnneeMois = (type) => {
        if (type === 'Ajouter') {
            axiosPrivate.put(`/declaration/isi/ajoutMoisAnnee`, {
                id_compte: Number(compteId),
                id_exercice: Number(selectedExerciceId),
                id_dossier: Number(fileId),
                selectedDetailRows,
                declisimois: valSelectMois,
                declisiannee: valSelectAnnee,
                declisi: true,
                compteisi
            }).then((response) => {
                const data = response?.data;

                if (!data) return toast.error("Aucune réponse du serveur");

                if (data.state) {
                    if (data.message === 'Compte ISI non trouvé à chacune des lignes') {
                        toast.error(data.message);
                    } else {
                        toast.success(data.message);
                        setSelectedDetailRows([]);
                    }

                    setIsDetailSelectionRefreshed(prev => !prev);
                    setIsDetailEcritureRefreshed(prev => !prev);

                } else {
                    toast.error(data.message || "Erreur inconnue");
                }
            }).catch(err => {
                console.error(err);
                toast.error("Erreur lors de la requête");
            });
        } else {
            axiosPrivate.put(`/declaration/isi/suppressionMoisAnnee`, {
                id_compte: Number(compteId),
                id_exercice: Number(selectedExerciceId),
                id_dossier: Number(fileId),
                selectedDetailRows: selectedDetailRows,
                declisimois: valSelectMois,
                declisiannee: valSelectAnnee,
                declisi: false
            }).then((response) => {
                if (response?.data?.state) {
                    toast.success(response?.data?.message);
                    setSelectedDetailRows([]);
                    setIsDetailSelectionRefreshed(prev => !prev);
                    setIsDetailEcritureRefreshed(prev => !prev);
                } else {
                    toast.error(response?.data?.message);
                }
            })
        }
    }

    useEffect(() => {
        if (canView) {
            const handleKeyDown = (e) => {
                if (e.ctrlKey && e.key === "ArrowRight") {
                    handleNext();
                } else if (e.ctrlKey && e.key === "ArrowLeft") {
                    handlePrevious();
                }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [listePlanComptable, valSelectedCompte, isDetailSelectionRefreshed]);

    return (
        <>
            <Stack
                width={"100%"}
                height={"100%"}
                alignItems={"flex-start"}
                alignContent={"flex-start"}
                justifyContent={"stretch"}
            >
                <Stack
                    width={"100%"}
                    paddingLeft={"5px"}
                    alignItems={"left"}
                    alignContent={"center"}
                    direction={"row"}
                    justifyContent={"space-between"}
                    style={{
                        marginLeft: "0px",
                        backgroundColor: '#F4F9F9',
                        borderRadius: "5px"
                    }}
                >
                    <FormControl
                        variant="standard"
                    >
                        <Stack
                            direction={'row'}
                            alignContent={'center'}
                        >
                            <Stack
                                sx={{
                                    width: 500,
                                    mr: 2
                                }}
                            >
                                <Autocomplete
                                    value={listePlanComptable.find(item => item.id === Number(valSelectedCompte)) || null}
                                    onChange={(event, newValue) => {
                                        setValSelectedCompte(newValue?.id || "tout");
                                    }}
                                    options={listePlanComptable}
                                    getOptionLabel={(option) => `${option.compte || ''} - ${option.libelle || ''}`}
                                    renderInput={(params) => <TextField {...params} label="Compte" variant="standard" />}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    noOptionsText="Aucun compte trouvé"
                                />
                            </Stack>
                            <Stack
                                direction="row"
                                alignItems="center"
                                height="100%"
                                spacing={1}
                                sx={{ flex: 1 }}
                            >
                                <Tooltip title="Ctrl + < -">
                                    <span>
                                        <Button
                                            disabled={!canView || valSelectedCompte === 'tout'}
                                            sx={{
                                                minWidth: 0,
                                                padding: 1,
                                                backgroundColor: 'transparent',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                },
                                                '&:focus': {
                                                    outline: 'none',
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                },
                                                '&:active': {
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                },
                                            }}
                                            onClick={handlePrevious}
                                        >
                                            <GrPrevious
                                                color="gray"
                                                size={20}
                                            />
                                        </Button>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Ctrl + - >">
                                    <span>
                                        <Button
                                            disabled={
                                                !canView ||
                                                listePlanComptable.findIndex(item => item.id === valSelectedCompte) >= listePlanComptable.length - 1
                                            }
                                            sx={{
                                                minWidth: 0,
                                                padding: 1,
                                                backgroundColor: 'transparent',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                },
                                                '&:focus': {
                                                    outline: 'none',
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                },
                                                '&:active': {
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'none',
                                                },
                                            }}
                                            onClick={handleNext}
                                        >
                                            <GrNext
                                                color="gray"
                                                size={20}
                                            />
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </FormControl>
                    <Stack
                        direction="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ borderRadius: "5px" }}
                        style={{
                            marginLeft: "0px",
                            borderRadius: "5px"
                        }}>

                        <Tooltip title="Ajouter le mois et l'année sélectionnés">
                            <span>
                                <Button
                                    variant="contained"
                                    disabled={!canAdd || selectedDetailRows.length === 0 || hasDeclisiTrue}
                                    style={{
                                        textTransform: 'none',
                                        outline: 'none',
                                        backgroundColor: initial.theme,
                                        color: "white",
                                        height: "39px"
                                    }}
                                    onClick={() => updateAnneeMois('Ajouter')}
                                    startIcon={<FaRegCheckCircle size={20} />}
                                >
                                    Ajouter
                                </Button>
                            </span>
                        </Tooltip>

                        <Tooltip title="Enlever le mois et l'année sélectionnés">
                            <span>
                                <Button
                                    variant="contained"
                                    disabled={!canDelete || selectedDetailRows.length === 0 || hasDeclisiFalse}
                                    style={{
                                        textTransform: 'none',
                                        outline: 'none',
                                        backgroundColor: '#FF8A8A',
                                        color: "white",
                                        height: "39px"
                                    }}
                                    onClick={() => updateAnneeMois('Enlever')}
                                    startIcon={<IoMdRemoveCircleOutline size={20} />}
                                >
                                    Enlever
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>

                <Stack
                    width={"100%"}
                    height={"50vh"}
                >
                    <Stack
                        width={"100%"}
                        style={{
                            marginLeft: "0px",
                            marginTop: "20px",
                        }}
                        height={DATAGRID_HEIGHT}>
                        <DataGrid
                            disableMultipleSelection={DataGridStyle.disableMultipleSelection}
                            disableColumnSelector={DataGridStyle.disableColumnSelector}
                            disableDensitySelector={DataGridStyle.disableDensitySelector}
                            disableRowSelectionOnClick
                            disableSelectionOnClick={true}
                            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                            slots={{
                                toolbar: QuickFilter
                            }}
                            sx={{
                                ...DataGridStyle.sx,
                                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                    outline: 'none',
                                    border: 'none',
                                },
                                '& .MuiDataGrid-row.highlight-row': {
                                    backgroundColor: '#d9fdd3 !important',
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: initial.theme,
                                    color: 'white',
                                    fontWeight: 'bold',
                                },
                            }}
                            rowHeight={DataGridStyle.rowHeight}
                            columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                            editMode='row'
                            columns={DatagridColumnsSelectionLigne}
                            rows={(filteredList ?? listDetailSelection) || []}
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
                            rowSelectionModel={selectedDetailRows}
                            onRowSelectionModelChange={(ids) => {
                                setSelectedDetailRows(ids);
                            }}
                            getRowClassName={(params) =>
                                params.row.declisimois === valSelectMois && params.row.declisiannee === valSelectAnnee && params.row.declisi === true
                                    ? 'highlight-row'
                                    : ''
                            }
                        />
                    </Stack>
                </Stack>
            </Stack>
        </>
    )
}

export default DatagridDetailSelectionLigne