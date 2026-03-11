import { useState } from 'react';
import { Button, Stack, Tooltip } from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import { DataGridStyle } from '../../../DatagridToolsStyle';
import QuickFilter from '../../../DatagridToolsStyle';
import { init } from '../../../../../../init';

import DatagridColumnsEcritureAssocie from '../../DatagridHeaders/DatagridColumnsEcritureAssocie';
import PopupConfirmDelete from '../../../popupConfirmDelete';

import { MdOutlineAutoMode } from "react-icons/md";
import { MdReplay } from "react-icons/md";

import toast from 'react-hot-toast';
import useAxiosPrivate from '../../../../../../config/axiosPrivate';

import PopupActionConfirm from '../../../../componentsTools/popupActionConfirm';

const initial = init[0];

const DatagridDetailEcritureAssocie = ({
    valSelectMois,
    valSelectAnnee,
    compteId,
    fileId,
    selectedExerciceId,
    DATAGRID_HEIGHT,
    compteisi,
    listDetailEcriture,
    setIsDetailEcritureRefreshed,
    setIsDetailSelectionRefreshed,
    setIsAnnexeRefreshed,
    canModify,
    canAdd,
    canDelete,
    canView
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [selectedDetailRows, setSelectedDetailRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [openDialogGenerateAuto, setOpenDialogGenerateAuto] = useState(false);
    const [openDialogReinitialize, setOpenDialogReinitialize] = useState(false);

    // Génération auto de ISI
    const generateIsiAuto = async (value) => {
        if (value) {
            setIsLoading(true);
            try {
                await axiosPrivate.post(`/declaration/isi/generateIsiAutoDetail`, {
                    id_compte: compteId,
                    id_exercice: selectedExerciceId,
                    id_dossier: fileId,
                    declisiannee: valSelectAnnee,
                    declisimois: valSelectMois,
                    compteisi: compteisi
                })
                    .then((response) => {
                        const resData = response.data;
                        if (resData.state) {
                            toast.success(response?.data?.message);
                            setIsDetailEcritureRefreshed(prev => !prev);
                            setIsDetailSelectionRefreshed(prev => !prev);
                            setOpenDialogGenerateAuto(false);
                        } else {
                            toast.error(resData.message)
                        }
                    })
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message || "Erreur inconnue";
                toast.error(errMsg);
            } finally {
                setOpenDialogGenerateAuto(false);
            }
        } else {
            setOpenDialogGenerateAuto(false);
        }
        setIsLoading(false);
    }

    // Réinitalisation de ISI
    const reinitializeIsi = (value) => {
        if (value) {
            axiosPrivate.post(`/declaration/isi/reinitializeIsi`, {
                id_compte: compteId,
                id_exercice: selectedExerciceId,
                id_dossier: fileId,
                declisiannee: valSelectAnnee,
                declisimois: valSelectMois,
                compteisi: compteisi
            })
                .then((response) => {
                    const resData = response.data;
                    if (resData.state) {
                        toast.success(response?.data?.message);
                        setIsDetailEcritureRefreshed(prev => !prev);
                        setIsDetailSelectionRefreshed(prev => !prev);
                        setIsAnnexeRefreshed(prev => !prev);
                        setOpenDialogReinitialize(false);
                    } else {
                        toast.error(resData.message)
                    };
                })
                .catch((error) => {
                    toast.error(error.response?.data?.message || error.message);
                })
            setOpenDialogReinitialize(false);
        } else {
            setOpenDialogReinitialize(false);
        }
    }

    //Afficher le modal de confirmation de génération automatique
    const handleOpenDialogConfirmGenerateAuto = () => {
        setOpenDialogGenerateAuto(true);
    }

    //Afficher le modal de confirmation de réinitialisation
    const handleOpenDialogConfirmReinitialize = () => {
        setOpenDialogReinitialize(true);
    }

    return (
        <>
            {
                openDialogGenerateAuto && canAdd
                    ?
                    <PopupActionConfirm
                        msg={`Voulez-vous vraiment générer automatiquement les details ? Toutes les anciennes données seront supprimées.`}
                        confirmationState={generateIsiAuto}
                        isLoading={isLoading}
                    />
                    :
                    null
            }
            {
                openDialogReinitialize && canDelete
                    ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment réinitaliser le mois et l'année de toutes ces lignes ?`}
                        confirmationState={reinitializeIsi}
                        type={"Reinialiser"}
                    />
                    :
                    null
            }
            <Stack width={"100%"} height={"100%"} alignItems={"flex-start"}
                alignContent={"flex-start"} justifyContent={"stretch"} >
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    width="100%"
                    spacing={0.5}
                    sx={{ borderRadius: "5px" }}
                    style={{
                        marginLeft: "0px",
                        borderRadius: "5px"
                    }}>
                    <Tooltip title="Réinitialiser les écritures">
                        <span>
                            <Button
                                variant="contained"
                                style={{
                                    textTransform: 'none',
                                    outline: 'none',
                                    backgroundColor: initial.theme,
                                    color: "white",
                                    height: "39px",
                                }}
                                startIcon={<MdReplay size={20} />}
                                onClick={handleOpenDialogConfirmReinitialize}
                                disabled={!canDelete || listDetailEcriture.length === 0}
                            >
                                Réinitialiser
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Générer automatiquement les écritures">
                        <span>
                            <Button
                                disabled={!canAdd}
                                variant="contained"
                                style={{
                                    textTransform: 'none',
                                    outline: 'none',
                                    backgroundColor: '#3bbc24ff',
                                    color: "white",
                                    height: "39px",
                                }}
                                onClick={handleOpenDialogConfirmGenerateAuto}
                                startIcon={<MdOutlineAutoMode size={20} />}
                            >
                                Générer auto
                            </Button>
                        </span>
                    </Tooltip>
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
                            columns={DatagridColumnsEcritureAssocie}
                            rows={listDetailEcriture || []}
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
                        />
                    </Stack>
                </Stack>
            </Stack>
        </>
    )
}

export default DatagridDetailEcritureAssocie