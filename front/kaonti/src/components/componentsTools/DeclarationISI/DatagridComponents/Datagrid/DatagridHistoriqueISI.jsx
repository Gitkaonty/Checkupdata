import { useState } from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material'
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter, { DataGridStyle } from '../../../DatagridToolsStyle';
import { IoMdTrash } from "react-icons/io";
import { init } from '../../../../../../init';
import PopupConfirmDelete from '../../../popupConfirmDelete';
import axios from '../../../../../../config/axios';
import toast from 'react-hot-toast';
import useAxiosPrivate from '../../../../../../config/axiosPrivate';

const initial = init[0];

const DatagridHistoriqueISI = ({ columns, rows, DATAGRID_HEIGHT, setHistoriqueIsi, canDelete }) => {
    const axiosPrivate = useAxiosPrivate();
    const [selectedHistoriqueIds, setSelectedHistoriqueIds] = useState([]);
    const [showPopupConfirmDelete, setShowPopupConfirmDelete] = useState(false);

    // Ouverture de popup de suppression
    const handleOpenPopupDeleteHistorique = () => {
        setShowPopupConfirmDelete(true);
    }

    const handleDeleteRow = (value) => {
        if (value) {
            axiosPrivate.post('/declaration/isi/deleteSelectedHistoriqueIsi', { selectedHistoriqueIds })
                .then((response) => {
                    if (response?.data?.state) {
                        toast.success(response?.data?.message);
                        const updatedRowsList = rows.filter((row) => !selectedHistoriqueIds.includes(row.id));
                        setHistoriqueIsi(updatedRowsList);
                        setShowPopupConfirmDelete(false);
                        setSelectedHistoriqueIds([]);
                    } else {
                        toast.error(response?.data?.message);
                    }
                })
        } else {
            setShowPopupConfirmDelete(false);
            setSelectedHistoriqueIds([]);
        }
    }

    return (
        <>
            {
                (showPopupConfirmDelete && canDelete) ?
                    <PopupConfirmDelete
                        msg={`Voulez-vous vraiment supprimer ${selectedHistoriqueIds.length > 1 ? 'les lignes sélectionnées ?' : 'la ligne sélectionnée ?'}`}
                        confirmationState={handleDeleteRow}
                        presonalisedMessage={true}
                    />
                    : null
            }

            <Stack width={"100%"} height={DATAGRID_HEIGHT} spacing={3} alignItems={"flex-start"}
                alignContent={"flex-start"} justifyContent={"stretch"} >
                <Stack
                    width={"100%"}
                    height={"30px"}
                    spacing={0.5}
                    alignItems={"center"}
                    alignContent={"center"}
                    direction={"row"}
                    justifyContent={"right"}
                    style={{
                        marginTop: '15px'
                    }}
                >
                    <Tooltip title="Supprimer toutes les lignes du tableau">
                        <IconButton
                            variant="contained"
                            style={{
                                width: "45px",
                                height: '45px',
                                borderRadius: "1px",
                                borderColor: "transparent",
                                textTransform: 'none',
                                outline: 'none',
                                backgroundColor: initial.button_delete_color,
                            }}
                            onClick={handleOpenPopupDeleteHistorique}
                            disabled={!canDelete || selectedHistoriqueIds.length === 0}
                        >
                            <IoMdTrash style={{ width: '25px', height: '25px', color: 'white' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Stack
                    width={"100%"}
                    style={{
                        marginLeft: "0px",
                        marginTop: "5px",
                    }}
                    height={DATAGRID_HEIGHT}
                >
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
                            height: "100%",
                            minHeight: DATAGRID_HEIGHT
                        }}
                        rowHeight={DataGridStyle.rowHeight}
                        columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                        editMode='row'
                        columns={columns}
                        rows={rows || []}
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
                        onRowSelectionModelChange={(newSelection) => {
                            setSelectedHistoriqueIds(newSelection);
                        }}
                        rowSelectionModel={selectedHistoriqueIds}
                    />
                </Stack>
            </Stack>
        </>
    )
}

export default DatagridHistoriqueISI