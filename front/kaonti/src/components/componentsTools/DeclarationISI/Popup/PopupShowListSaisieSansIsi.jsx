import React, { useState } from 'react';
import { Typography, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../../init';

import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter, { DataGridStyle } from '../../DatagridToolsStyle';
import DatagridColumnsNonCompteIsi from '../DatagridHeaders/DatagridColumnsNonCompteIsi';

import { IoIosWarning } from "react-icons/io";

let initial = init[0];

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiPaper-root': {
        minHeight: '60%',
    },
}));

const PopupShowListSaisieSansIsi = ({ confirmationState, listSaiseSansIsi, selectedDetailRows }) => {

    const handleClose = () => {
        confirmationState();
    }

    return (
        <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={true}
            PaperProps={{
                sx: {
                    width: 1500,
                    maxWidth: '1500px',
                }
            }}
            fullWidth={true}
        >

            <DialogTitle
                id="customized-dialog-title"
                sx={{
                    ml: 1,
                    p: 2,
                    height: '50px',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box'
                }}
            >
                <Stack
                    direction={"row"}
                    spacing={1}
                    alignItems={"flex-end"}
                >
                    <IoIosWarning style={{ width: '40px', height: '40px', color: 'red' }} />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: 16, color: 'red' }}>
                        Attention, les lignes suivantes ne sont pas associées à un compte d'ISI paramétré dans le CRM. Impossible de les déclarer. Veuillez les corriger
                    </Typography>
                </Stack>
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
                <Stack
                    width={"100%"}
                    height={"60vh"}
                >
                    <Stack
                        width={"100%"}
                        // height={'80%'}
                        style={{
                            marginLeft: "0px",
                            marginTop: "0px",
                        }}
                        height="60vh"
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
                                '& .MuiDataGrid-row.highlight-separator': {
                                    borderBottom: '1px solid red',
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
                            columns={DatagridColumnsNonCompteIsi}
                            rows={listSaiseSansIsi || []}
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
                        />
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button autoFocus
                    onClick={handleClose}
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                >
                    Fermer
                </Button>
            </DialogActions>
        </BootstrapDialog>
    )
}

export default PopupShowListSaisieSansIsi