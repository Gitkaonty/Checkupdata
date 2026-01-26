import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, IconButton, Tooltip, TextField } from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import QuickFilter, { DataGridStyle } from '../DatagridToolsStyle';
import CloseIcon from '@mui/icons-material/Close';
import { init } from '../../../../init';
import { useEffect, useState } from 'react';
import { TfiSave } from "react-icons/tfi";
import FormatedInput from '../FormatedInput';
import toast from 'react-hot-toast';
import axios from '../../../../config/axios';

const initial = init[0];

export default function PopupAjustCa({
    open,
    onClose,
    data,
    type,
    setListCaFinal,
    listCaFinal,
    listCa
}) {
    const [popupRows, setPopupRows] = useState([]);

    const [isDisabledSaveButton, setIsDisabledSaveButton] = useState(false);

    const handleSaveClick = () => {
        if (!data?.type || !data?.rowId) return;

        const lignes = popupRows.filter(row => row.id_ligne_ecriture === data.rowId);

        const axesGrouped = lignes.reduce((acc, row) => {
            if (!acc[row.id_axe]) acc[row.id_axe] = [];
            acc[row.id_axe].push(row);
            return acc;
        }, {});

        const axesWithErrors = Object.entries(axesGrouped).filter(([idAxe, rows]) => {
            const totalMontant = rows.reduce((sum, r) => sum + Number(r.debit || r.credit || 0), 0);
            return totalMontant !== Number(data?.montant);
        });

        if (axesWithErrors.length > 0) {
            const axesLabels = axesWithErrors.map(([idAxe, rows]) => rows[0].libelle_axe).join(', ');
            toast.error(`Le total des montants pour l'axe "${axesLabels}" ne correspond pas au montant de l'écriture !`);
            return;
        }

        setListCaFinal(prev =>
            prev.map(item => {
                const ligne = lignes.find(
                    l => l.id_section === item.id_section && l.id_ligne_ecriture === item.id_ligne_ecriture
                );
                return ligne ? { ...item, ...ligne } : item;
            })
        );

        toast.success('Répartition enregistrée avec succès !');
    };

    const handleCellClick = (params) => {
        if (params.field === '__check__') return;

        if (params.field !== data?.type && params.field !== 'pourcentage') {
            toast.error('Seul le montant et le pourcentage peuvent être modifiés');
            return;
        }
    };

    const getRepartitionCA = () => {
        if (!data?.rowId || data.rowId <= 0) {
            const localRows = listCaFinal
                .filter(item => item.id_ligne_ecriture === data?.rowId)
                .map(item => {
                    const localPourcentage = item.pourcentage ?? listCa.find(p => p.id_section === item.id_section)?.pourcentage ?? 0;
                    const montantCalc = (data?.montant || 0) * (localPourcentage / 100);

                    return {
                        ...item,
                        debit: data?.type === 'debit' ? montantCalc : 0,
                        credit: data?.type === 'credit' ? montantCalc : 0,
                        pourcentage: localPourcentage,
                        libelle_axe: item.libelle_axe || '',
                        section: item.section || '',
                    };
                });

            setPopupRows(localRows);
            return;
        }

        try {
            axios.get(`/paramCa/getRepartitionCA/${data.rowId}`).then((response) => {
                const resData = response?.data;
                if (!resData?.state) return;

                const fetchedRows = resData?.list || [];
                const mergedRows = listCaFinal
                    .filter(item => item.id_ligne_ecriture === data.rowId)
                    .map(item => {
                        const fetched = fetchedRows.find(f => f.id_section === item.id_section);

                        const localPourcentage = fetched?.pourcentage
                            ?? item.pourcentage
                            ?? listCa.find(p => p.id_section === item.id_section)?.pourcentage
                            ?? 0;

                        const debit = fetched?.debit ?? (data?.type === 'debit' ? (data?.montant || 0) * (localPourcentage / 100) : 0);
                        const credit = fetched?.credit ?? (data?.type === 'credit' ? (data?.montant || 0) * (localPourcentage / 100) : 0);

                        return {
                            ...item,
                            debit,
                            credit,
                            pourcentage: localPourcentage,
                            libelle_axe: item.libelle_axe || fetched?.libelle_axe || '',
                            section: item.section || fetched?.section || '',
                        };
                    });

                const missingRows = listCaFinal
                    .filter(item => item.id_ligne_ecriture === data.rowId)
                    .filter(item =>
                        !fetchedRows.some(f => f.id_section === item.id_section)
                    )
                    .map(item => {
                        const localPourcentage = item.pourcentage ?? listCa.find(
                            p => p.id_section === item.id_section
                        )?.pourcentage ?? 0;

                        const montantCalc = (data?.montant || 0) * (localPourcentage / 100);

                        return {
                            ...item,
                            debit: data?.type === 'debit' ? montantCalc : 0,
                            credit: data?.type === 'credit' ? montantCalc : 0,
                            pourcentage: localPourcentage,
                            libelle_axe: item.libelle_axe || '',
                            section: item.section || '',
                        };
                    });

                setPopupRows(mergedRows);
            });
        } catch (error) {
            toast.error('Impossible de récupérer les données existantes');
            console.error(error);
        }
    };

    const CaColumnsHeader = [
        {
            field: 'libelle_axe',
            headerName: 'Axe',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: false
        },
        {
            field: 'section',
            headerName: 'Section',
            type: 'string',
            sortable: true,
            flex: 1,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: false
        },
        {
            field: 'pourcentage',
            headerName: 'Pourcentage',
            type: 'string',
            sortable: true,
            flex: 0.4,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => {
                let localValue = params.formattedValue ?? '';
                const handleChange = (event) => {
                    const rawValue = event.target.value ?? '';
                    localValue = rawValue;

                    const cleaned = rawValue.toString().replace(/\s/g, '').replace(',', '.');
                    const numericValue = Number(cleaned);
                    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
                        params.api.setEditCellValue(
                            { id: params.id, field: 'pourcentage', value: numericValue },
                            event
                        );

                        const montant = Number(data?.montant) || 0;
                        const calculated = (montant * numericValue) / 100;

                        params.api.setEditCellValue(
                            { id: params.id, field: data?.type, value: calculated },
                            event
                        );
                    }
                };

                return (
                    <TextField
                        size="small"
                        fullWidth
                        value={params.value ?? ''}
                        onChange={handleChange}
                        InputProps={{
                            inputComponent: FormatedInput,
                        }}
                    />
                );
            },
            renderCell: (params) => {
                const raw = params.value;
                const value = raw === undefined || raw === '' ? 0 : Number(raw);

                const formatted = value.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                return `${formatted.replace(/\u202f/g, ' ')}%`;
            },
        },
        {
            field: data?.type,
            headerName: 'Montant',
            type: 'text',
            sortable: true,
            flex: 0.7,
            headerAlign: 'right',
            align: 'right',
            headerClassName: 'HeaderbackColor',
            editable: true,
            renderEditCell: (params) => {
                let localValue = params.formattedValue ?? '';
                return (
                    <TextField
                        size="small"
                        name={data?.type}
                        fullWidth
                        value={localValue}
                        onChange={(event) => {
                            const rawValue = event.target.value ?? '';
                            localValue = rawValue;

                            const cleaned = rawValue.toString().replace(/\s/g, '').replace(',', '.');
                            const numeric = Number(cleaned);

                            if (!isNaN(numeric) && numeric >= 0) {
                                params.api.setEditCellValue(
                                    {
                                        id: params.id,
                                        field: data?.type,
                                        value: numeric,
                                    },
                                    event
                                );

                                const montantGlobal = Number(data?.montant) || 0;
                                const nouveauPourcentage = montantGlobal
                                    ? (numeric / montantGlobal) * 100
                                    : 0;

                                params.api.setEditCellValue(
                                    { id: params.id, field: 'pourcentage', value: nouveauPourcentage },
                                    event
                                );
                            }
                        }}
                        onFocus={(e) => {
                            e.target.setSelectionRange(0, 0);
                        }}
                        style={{ marginBottom: '0px', textAlign: 'right' }}
                        InputProps={{
                            inputComponent: FormatedInput,
                            sx: {
                                '& input': { textAlign: 'right' },
                            },
                        }}
                    />
                );
            },
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

    useEffect(() => {
        getRepartitionCA();
    }, [data?.rowId]);

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
                        Répartition analytique
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
                        width="100%"
                        height="30px"
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ paddingTop: '38px' }}
                    >
                        <Typography variant="subtitle1" fontWeight={500}>
                            Montant actuel : {data?.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>

                        <Tooltip title="Sauvegarder les modifications">
                            <span>
                                <IconButton
                                    disabled={isDisabledSaveButton}
                                    onClick={handleSaveClick}
                                    variant="contained"
                                    style={{
                                        width: "35px",
                                        height: "35px",
                                        borderRadius: "2px",
                                        borderColor: "transparent",
                                        backgroundColor: initial.theme,
                                        textTransform: "none",
                                        outline: "none",
                                    }}
                                >
                                    <TfiSave style={{ width: "50px", height: "50px", color: "white" }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                    <Stack
                        width={"100%"}
                        style={{
                            marginLeft: "0px",
                            marginTop: "20px",
                        }}
                        height={"475px"}>
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
                            columns={CaColumnsHeader}
                            rows={popupRows}
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
                            onCellClick={handleCellClick}
                            getRowId={(row) => `${row.id_ligne_ecriture}_${row.id_section}`}
                            processRowUpdate={(newRow, oldRow) => {
                                const updatedRows = popupRows.map((row) =>
                                    `${row.id_ligne_ecriture}_${row.id_section}` === `${oldRow.id_ligne_ecriture}_${oldRow.id_section}`
                                        ? { ...row, ...newRow }
                                        : row
                                );
                                setPopupRows(updatedRows);

                                setListCaFinal(prev =>
                                    prev.map(item =>
                                        `${item.id_ligne_ecriture}_${item.id_section}` === `${oldRow.id_ligne_ecriture}_${oldRow.id_section}`
                                            ? { ...item, ...newRow }
                                            : item
                                    )
                                );

                                return newRow;
                            }}
                            getRowClassName={(params) => {
                                const index = popupRows.findIndex(
                                    row => `${row.id_ligne_ecriture}_${row.id_section}` === params.id
                                );

                                if (index < 0 || index === popupRows.length - 1) return '';

                                const current = popupRows[index];
                                const next = popupRows[index + 1];

                                if (current.id_axe !== next.id_axe) {
                                    return 'highlight-separator';
                                }
                                return '';
                            }}
                            onRowEditStart={() => setIsDisabledSaveButton(true)}
                            onRowEditStop={() => setIsDisabledSaveButton(false)}
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
    );
}
