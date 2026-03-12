import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, IconButton } from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import QuickFilter, { DataGridStyle } from '../../DatagridToolsStyle';
import { init } from '../../../../../init';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const initial = init[0];

const PopupLettrageDesequilibre = ({ onClose, open, data }) => {

    const column = [
        {
            field: 'compte',
            headerName: 'Compte',
            type: 'string',
            sortable: true,
            flex: 0.8,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: false
        },
        {
            field: 'lettrage',
            headerName: 'Lettrage',
            type: 'string',
            sortable: true,
            flex: 0.8,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: false
        },
        {
            field: 'total_debit',
            headerName: 'Total debit',
            type: 'text',
            sortable: true,
            flex: 0.7,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            editable: false,
            renderCell: (params) => {
                const raw = params.value;
                const value = raw === undefined || raw === '' ? 0 : Number(raw);

                const formatted = value.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                return formatted.replace(/\u202f/g, ' ');
            },
        },
        {
            field: 'total_credit',
            headerName: 'Total credit',
            type: 'text',
            sortable: true,
            flex: 0.7,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            editable: false,
            renderCell: (params) => {
                const raw = params.value;
                const value = raw === undefined || raw === '' ? 0 : Number(raw);

                const formatted = value.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                return formatted.replace(/\u202f/g, ' ');
            },
        },
        {
            field: 'solde',
            headerName: 'Solde',
            type: 'text',
            sortable: true,
            flex: 0.7,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            editable: false,
            renderCell: (params) => {
                const raw = params.value;
                const value = raw === undefined || raw === '' ? 0 : Number(raw);

                const formatted = value.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                return formatted.replace(/\u202f/g, ' ');
            },
        }
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    height: '640px',
                    maxHeight: '640px',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <DialogTitle
                sx={{
                    m: 0,
                    py: 1,
                    px: 2,
                    bgcolor: "#f5f5f5",
                    borderBottom: "1px solid #ddd",
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography
                        variant="h6"
                        component="div"
                        fontWeight="bold"
                        color="text.primary"
                    >
                        Lettrage déséquilibré
                    </Typography>

                    <IconButton
                        onClick={onClose}
                        style={{ color: 'red', textTransform: 'none', outline: 'none' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack height={"100%"} spacing={2} alignItems={'left'} alignContent={"center"}
                    direction={"column"} justifyContent={"center"}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                            mt: 1.5,
                            p: 2,
                            backgroundColor: 'rgba(244, 67, 54, 0.08)',
                            border: '1px solid rgba(244, 67, 54, 0.3)',
                            borderRadius: '10px',
                            color: '#b71c1c',
                        }}
                        style={{
                            marginTop: '20px'
                        }}
                    >
                        <WarningAmberIcon sx={{ fontSize: 28 }} />

                        <span>
                            Les comptes mentionnés dans le tableau ci-dessous ont des lettrages déséquilibrés et la génération automatique a été interrompue.
                            Pour continuer, veuillez rétablir l'équilibre de ces comptes.
                        </span>
                    </Stack>
                    <Stack
                        width={"100%"}
                        style={{
                            marginLeft: "0px",
                            marginTop: "10px"
                        }}
                        height={"390px"}>
                        <DataGrid
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
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: initial.theme,
                                    color: 'white',
                                    fontWeight: 'bold',
                                },
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
                                '& .MuiDataGrid-row.highlight-separator': {
                                    borderBottom: `2px solid ${initial.theme}`
                                },
                            }}
                            rowHeight={DataGridStyle.rowHeight}
                            columnHeaderHeight={DataGridStyle.columnHeaderHeight}
                            editMode='row'
                            columns={column}
                            rows={data}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 100 },
                                },
                            }}
                            experimentalFeatures={{ newEditingApi: true }}
                            pageSizeOptions={[5, 10, 20, 30, 50, 100]}
                            pagination={DataGridStyle.pagination}
                            columnVisibilityModel={{
                                id: false,
                            }}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button
                    autoFocus
                    onClick={onClose}
                    style={{ backgroundColor: initial.theme, color: 'white', width: "100px", textTransform: 'none', outline: 'none' }}
                >
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default PopupLettrageDesequilibre