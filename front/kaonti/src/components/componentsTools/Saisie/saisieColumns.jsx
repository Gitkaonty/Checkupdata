import { TextField, Autocomplete, Tooltip, Button } from '@mui/material';
import FormatedInput from '../FormatedInput';
import { IoAddSharp } from "react-icons/io5";
import { GoX } from "react-icons/go";
import { useMemo } from 'react';
import { FaRegEdit } from "react-icons/fa";

function CompteEditCell({ params, listePlanComptable }) {
    const options = useMemo(
        () =>
            listePlanComptable.map((pc) => ({
                label: `${pc.compte} - ${pc.libelle}`,
                value: pc.id,
                key: pc.id,
            })),
        [listePlanComptable]
    );

    const currentValue = options.find((opt) => opt.value === params.value) || null;

    return (
        <>
            <Autocomplete
                key={params.id}
                autoHighlight
                autoComplete
                openOnFocus
                disableClearable={false}
                popperprops={{ disablePortal: true }}
                options={options}
                getOptionLabel={(option) => option.label || ''}
                value={currentValue}
                onChange={(e, newValue) => {
                    const newCompteId = newValue ? newValue.value : null;
                    const libelleAssocie1 = newValue
                        ? newValue.label.split(' - ')[1]
                        : '';

                    const currentRow = params.api.getRow(params.id);
                    const currentLibelle = currentRow?.libelle || '';

                    params.api.setEditCellValue(
                        { id: params.id, field: 'compte', value: newCompteId },
                        e
                    );

                    if (!currentLibelle || currentLibelle.trim() === '') {
                        params.api.setEditCellValue(
                            { id: params.id, field: 'libelle', value: libelleAssocie1 },
                            e
                        );
                    }
                }}
                noOptionsText="Aucune compte trouvé"
                renderInput={(paramsInput) => {
                    return (
                        <TextField
                            {...paramsInput}
                            variant="standard"
                            placeholder="Choisir un compte"
                            fullWidth
                            InputProps={{
                                ...paramsInput.InputProps,
                                disableUnderline: true,
                            }}
                            style={{
                                width: 700,
                                transition: 'width 0.2s ease-in-out',
                            }}
                        />
                    );
                }}
            />
        </>
    );
}

export const getSaisieColumnHeader = ({
    formSaisie,
    setInvalidRows,
    invalidRows,
    selectedCell,
    listePlanComptable,
    taux,
    equilibrateDebitCredit,
    tableRows,
    handleOpenDialogConfirmDeleteSaisie,
    isDatagridEditing,
    ajouterNouvelleLigne,
    isCaActive,
    handleOpenPopupCa,
    listeCodeJournaux
}) => {

    const columns = [
        {
            field: 'jour',
            headerName: 'Jour',
            type: 'text',
            editable: true,
            sortable: true,
            flex: 0.4,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',
            renderEditCell: (params) => {
                const selectedMonth = parseInt(formSaisie.values.valSelectMois);
                const selectedYear = parseInt(formSaisie.values.valSelectAnnee) || new Date().getFullYear();
                const maxDay = (selectedMonth >= 1 && selectedMonth <= 12)
                    ? new Date(selectedYear, selectedMonth, 0).getDate()
                    : 31;

                return (
                    <TextField
                        size="small"
                        type="text"
                        name="jour"
                        fullWidth
                        value={params.value ?? ''}
                        onChange={(event) => {
                            const inputValue = event.target.value.replace(/\D/g, '');

                            if (inputValue === '') {
                                params.api.setEditCellValue({
                                    id: params.id,
                                    field: 'jour',
                                    value: '',
                                });

                                setInvalidRows((prev) => {
                                    const exists = prev.find(r => r.id === params.id);
                                    if (exists) {
                                        if (!exists.fields.includes('jour')) {
                                            return prev.map(r =>
                                                r.id === params.id ? { ...r, fields: [...r.fields, 'jour'] } : r
                                            );
                                        }
                                        return prev;
                                    } else {
                                        return [...prev, { id: params.id, fields: ['jour'] }];
                                    }
                                });

                                return;
                            }

                            const intValue = parseInt(inputValue);

                            if (!isNaN(intValue) && intValue >= 1 && intValue <= maxDay) {
                                params.api.setEditCellValue({
                                    id: params.id,
                                    field: 'jour',
                                    value: intValue,
                                });

                                setInvalidRows((prev) => {
                                    const row = prev.find(r => r.id === params.id);
                                    if (!row) return prev;

                                    const updatedFields = row.fields.filter(f => f !== 'jour');
                                    if (updatedFields.length === 0) {
                                        return prev.filter(r => r.id !== params.id);
                                    }
                                    return prev.map(r =>
                                        r.id === params.id ? { ...r, fields: updatedFields } : r
                                    );
                                });
                            }
                        }}

                        inputProps={{
                            min: 1,
                            max: maxDay,
                            step: 1,
                        }}
                        sx={{
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                            textAlign: 'center',
                        }}
                    />
                );
            },
            cellClassName: (params) => {
                const classes = [];

                const rowInvalid = invalidRows.find(row => row.id === params.id);
                if (params.field === 'jour' && rowInvalid?.fields.includes('jour')) {
                    classes.push('cell-error');
                }

                if (selectedCell.id === params.id && selectedCell.field === 'jour') {
                    classes.push('cell-selected');
                }

                return classes.join(' ');
            },
        }, {
            field: 'compte',
            headerName: 'Compte',
            editable: true,
            flex: 0.8,
            renderEditCell: (params) => (
                <CompteEditCell
                    params={params}
                    listePlanComptable={listePlanComptable}
                />
            ),
            cellClassName: (params) => {
                const classes = [];

                const rowInvalid = invalidRows.find(row => row.id === params.id);

                if (rowInvalid && rowInvalid.fields.includes('compte')) {
                    classes.push('cell-error');
                }

                if (selectedCell.id === params.id && selectedCell.field === 'compte') {
                    classes.push('cell-selected');
                }

                return classes.join(' ');
            },
            renderCell: (params) => {
                const pc = listePlanComptable.find((item) => item.id === params.value);

                if (!pc) return params.value || '';

                return `${pc.compte}`;
            },
        },
        {
            field: 'piece',
            headerName: 'Pièce',
            type: 'string',
            sortable: true,
            editable: true,
            flex: 1.3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',

            renderEditCell: (params) => {
                return (
                    <TextField
                        variant="standard"
                        defaultValue={params.value}
                        fullWidth
                        InputProps={{
                            disableUnderline: true,
                        }}
                        sx={{
                            backgroundColor: 'white',
                            border: 'none',
                            outline: 'none',
                            '& input': {
                                padding: '4px 8px',
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& input:focus': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '&.Mui-focused': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& .MuiInput-root:before, & .MuiInput-root:after': {
                                borderBottom: 'none !important',
                            },
                        }}
                        onChange={(e) => {
                            const value = e.target.value;

                            params.api.setEditCellValue({
                                id: params.id,
                                field: 'piece',
                                value: value,
                            }, e);

                            setInvalidRows((prev) => {
                                const row = prev.find(r => r.id === params.id);

                                if (value.trim() === '') {
                                    if (row) {
                                        if (!row.fields.includes('piece')) {
                                            return prev.map(r =>
                                                r.id === params.id ? { ...r, fields: [...r.fields, 'piece'] } : r
                                            );
                                        }
                                        return prev;
                                    } else {
                                        return [...prev, { id: params.id, fields: ['piece'] }];
                                    }
                                } else {
                                    if (!row) return prev;

                                    const updatedFields = row.fields.filter(f => f !== 'piece');
                                    if (updatedFields.length === 0) {
                                        return prev.filter(r => r.id !== params.id);
                                    }

                                    return prev.map(r =>
                                        r.id === params.id ? { ...r, fields: updatedFields } : r
                                    );
                                }
                            });
                        }}
                    />
                );
            },

            cellClassName: (params) => {
                const classes = [];

                if (selectedCell.id === params.id && selectedCell.field === 'piece') {
                    classes.push('cell-selected');
                }

                return classes.join(' ');
            },
        }, {
            field: 'libelle',
            headerName: 'Libellé',
            type: 'string',
            sortable: true,
            editable: true,
            flex: 1.35,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',

            renderEditCell: (params) => {
                return (
                    <TextField
                        variant="standard"
                        defaultValue={params.value}
                        fullWidth
                        InputProps={{
                            disableUnderline: true,
                        }}
                        sx={{
                            backgroundColor: 'white',
                            border: 'none',
                            outline: 'none',
                            '& input': {
                                padding: '4px 8px',
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& input:focus': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& input:focus-visible': {
                                outline: 'none !important',
                            },
                            '&.Mui-focused': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& .MuiInput-root:before, & .MuiInput-root:after': {
                                borderBottom: 'none !important',
                            },
                        }}


                        onChange={(e) => {
                            const value = e.target.value;

                            params.api.setEditCellValue({
                                id: params.id,
                                field: 'libelle',
                                value: value,
                            }, e);

                            setInvalidRows((prev) => {
                                const row = prev.find(r => r.id === params.id);

                                if (value.trim() === '') {
                                    if (row) {
                                        if (!row.fields.includes('libelle')) {
                                            return prev.map(r =>
                                                r.id === params.id
                                                    ? { ...r, fields: [...r.fields, 'libelle'] }
                                                    : r
                                            );
                                        }
                                        return prev;
                                    } else {
                                        return [...prev, { id: params.id, fields: ['libelle'] }];
                                    }
                                } else {
                                    if (!row) return prev;

                                    const updatedFields = row.fields.filter(f => f !== 'libelle');
                                    if (updatedFields.length === 0) {
                                        return prev.filter(r => r.id !== params.id);
                                    }

                                    return prev.map(r =>
                                        r.id === params.id
                                            ? { ...r, fields: updatedFields }
                                            : r
                                    );
                                }
                            });
                        }}
                    />
                );
            },
            cellClassName: (params) => {
                const classes = [];

                const rowInvalid = invalidRows.find(row => row.id === params.id);
                if (params.field === 'libelle' && rowInvalid?.fields.includes('libelle')) {
                    classes.push('cell-error');
                }

                if (selectedCell.id === params.id && selectedCell.field === 'libelle') {
                    classes.push('cell-selected');
                }

                return classes.join(' ');
            }
        },
        {
            field: 'num_facture',
            headerName: 'N° Facture',
            type: 'string',
            sortable: true,
            editable: true,
            flex: 1.3,
            headerAlign: 'left',
            align: 'left',
            headerClassName: 'HeaderbackColor',

            renderEditCell: (params) => {
                return (
                    <TextField
                        variant="standard"
                        defaultValue={params.value}
                        fullWidth
                        InputProps={{
                            disableUnderline: true,
                        }}
                        sx={{
                            backgroundColor: 'white',
                            border: 'none',
                            outline: 'none',
                            '& input': {
                                padding: '4px 8px',
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& input:focus': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '&.Mui-focused': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                            },
                            '& .MuiInput-root:before, & .MuiInput-root:after': {
                                borderBottom: 'none !important',
                            },
                        }}
                        onChange={(e) => {
                            const value = e.target.value;

                            params.api.setEditCellValue({
                                id: params.id,
                                field: 'num_facture',
                                value: value,
                            }, e);

                            setInvalidRows((prev) => {
                                const row = prev.find(r => r.id === params.id);

                                if (value.trim() === '') {
                                    if (row) {
                                        if (!row.fields.includes('num_facture')) {
                                            return prev.map(r =>
                                                r.id === params.id ? { ...r, fields: [...r.fields, 'num_facture'] } : r
                                            );
                                        }
                                        return prev;
                                    } else {
                                        return [...prev, { id: params.id, fields: ['num_facture'] }];
                                    }
                                } else {
                                    if (!row) return prev;

                                    const updatedFields = row.fields.filter(f => f !== 'num_facture');
                                    if (updatedFields.length === 0) {
                                        return prev.filter(r => r.id !== params.id);
                                    }

                                    return prev.map(r =>
                                        r.id === params.id ? { ...r, fields: updatedFields } : r
                                    );
                                }
                            });
                        }}
                    />
                );
            },

            cellClassName: (params) => {
                const classes = [];
                if (selectedCell.id === params.id && selectedCell.field === 'num_facture') {
                    classes.push('cell-selected');
                }

                return classes.join(' ');
            },
        }
    ];

    if (formSaisie.values.choixDevise === 'Devises') {
        columns.push({
            field: 'montant_devise',
            headerName: 'Montant en Devise',
            editable: true,
            headerAlign: 'right',
            align: 'right',
            flex: 1.3,
            renderEditCell: (params) => {
                const debit = params.row.debit;
                const credit = params.row.credit;
                return (
                    <TextField
                        size="small"
                        name="montant_devise"
                        fullWidth
                        value={params.value ?? ''}
                        onChange={(event) => {
                            const rawValue = event.target.value ?? '';
                            const cleaned = rawValue.toString().replace(/\s/g, '').replace(',', '.');
                            const numeric = Number(cleaned);

                            if (!isNaN(numeric)) {
                                params.api.setEditCellValue({
                                    id: params.id,
                                    field: 'montant_devise',
                                    value: numeric,
                                }, event);

                                const isDebitEmpty = debit === 0 || debit === '' || debit === null || debit === undefined;
                                const isCreditEmpty = credit === 0 || credit === '' || credit === null || credit === undefined;
                                if (isDebitEmpty && isCreditEmpty) {
                                    params.api.setEditCellValue({
                                        id: params.id,
                                        field: 'debit',
                                        value: numeric * taux
                                    })

                                } else if (isDebitEmpty) {
                                    params.api.setEditCellValue({
                                        id: params.id,
                                        field: 'credit',
                                        value: numeric * taux
                                    })

                                } else if (isCreditEmpty) {
                                    params.api.setEditCellValue({
                                        id: params.id,
                                        field: 'debit',
                                        value: numeric * taux
                                    })

                                }
                            }
                        }}
                        style={{ marginBottom: '0px', width: '200px', textAlign: 'right' }}
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
            cellClassName: (params) => {
                const classes = [];

                const rowInvalid = invalidRows.find(row => row.id === params.id);
                if (params.field === 'montant_devise' && rowInvalid?.fields.includes('montant_devise')) {
                    classes.push('cell-error');
                }

                if (selectedCell.id === params.id && selectedCell.field === 'montant_devise') {
                    classes.push('cell-selected');
                }

                return classes.join(' ');
            }
        });
    }

    columns.push({
        field: 'debit',
        headerName: 'Débit',
        type: 'string',
        sortable: true,
        editable: true,
        flex: 1.3,
        headerAlign: 'right',
        align: 'right',
        headerClassName: 'HeaderbackColor',
        renderEditCell: (params) => {
            let localValue = params.formattedValue ?? '';

            return (
                <TextField
                    size="small"
                    name="debit"
                    fullWidth
                    value={localValue}
                    onChange={(event) => {
                        const inputValue = event.target.value;
                        localValue = inputValue;

                        const cleaned = inputValue.toString().replace(/\s/g, '').replace(',', '.');
                        const numeric = Number(cleaned);

                        if (!isNaN(numeric) && numeric >= 0) {
                            params.api.setEditCellValue(
                                {
                                    id: params.id,
                                    field: 'debit',
                                    value: numeric,
                                },
                                event
                            );

                            if (numeric > 0) {
                                params.api.setEditCellValue(
                                    {
                                        id: params.id,
                                        field: 'credit',
                                        value: 0,
                                    },
                                    event
                                );
                            }
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.ctrlKey && event.key === 'Enter') {
                            event.preventDefault();
                            equilibrateDebitCredit(params.id, 'debit');
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
        cellClassName: (params) => {
            const classes = [];

            const rowInvalid = invalidRows.find(row => row.id === params.id);
            const debit = Number(params.row.debit) || 0;
            const credit = Number(params.row.credit) || 0;

            if (rowInvalid && debit === 0 && credit === 0 && rowInvalid.fields.includes('debit')) {
                classes.push('cell-error');
            }

            if (selectedCell.id === params.id && selectedCell.field === 'debit') {
                classes.push('cell-selected');
            }

            return classes.join(' ');
        }

    })

    if (isCaActive) {
        columns.push({
            field: 'debitAction',
            headerName: '',
            sortable: false,
            width: 50,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => {
                const pc = listePlanComptable.find((item) => item.id === params.row.compte);
                const valueDebit = params.row.debit;
                if (!pc) return null
                const compteValue = String(pc?.compte || '');

                if (!isCaActive
                    || tableRows.length === 0
                    || valueDebit === 0
                    // || !['2', '6', '7'].some(prefix => compteValue.startsWith(prefix))
                ) {
                    return null;
                }
                return (
                    <Tooltip title="Modifier le debit">
                        <span>
                            <Button
                                onClick={() => handleOpenPopupCa(params.id, 'debit', valueDebit)}
                                disabled={isDatagridEditing()}
                                sx={{
                                    outline: 'none',
                                    boxShadow: 'none',
                                    '&:focus': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    },
                                    '&:focus-visible': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    },
                                    ml: 0,
                                }}
                            >
                                <FaRegEdit style={{ width: '30px', height: '30px' }} />
                            </Button>
                        </span>
                    </Tooltip>
                )
            }
        });
    }

    columns.push({
        field: 'credit',
        headerName: 'Crédit',
        type: 'string',
        sortable: true,
        editable: true,
        flex: 1.3,
        headerAlign: 'right',
        align: 'right',
        headerClassName: 'HeaderbackColor',
        renderEditCell: (params) => {
            let localValue = params.formattedValue ?? '';
            return (
                <TextField
                    size="small"
                    name="credit"
                    fullWidth
                    value={localValue}
                    onChange={(event) => {
                        const inputValue = event.target.value;
                        localValue = inputValue;

                        if (Number(inputValue) >= 0 || isNaN(inputValue)) {
                            params.api.setEditCellValue({
                                id: params.id,
                                field: 'credit',
                                value: inputValue,
                            }, event);

                            const rawValue = inputValue ?? '';
                            const cleaned = rawValue.toString().replace(/\s/g, '').replace(',', '.');
                            const numeric = Number(cleaned);

                            if (!isNaN(numeric) && numeric > 0) {
                                params.api.setEditCellValue({
                                    id: params.id,
                                    field: 'debit',
                                    value: 0,
                                }, event);
                            }
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.ctrlKey && event.key === 'Enter') {
                            event.preventDefault();
                            equilibrateDebitCredit(params.id, 'credit');
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
        cellClassName: (params) => {
            const classes = [];

            const rowInvalid = invalidRows.find(row => row.id === params.id);
            const debit = Number(params.row.debit) || 0;
            const credit = Number(params.row.credit) || 0;

            if (rowInvalid && credit === 0 && debit === 0 && rowInvalid.fields.includes('credit')) {
                classes.push('cell-error');
            }

            if (selectedCell.id === params.id && selectedCell.field === 'credit') {
                classes.push('cell-selected');
            }

            return classes.join(' ');
        }
    })

    if (isCaActive) {
        columns.push({
            field: 'creditAction',
            headerName: '',
            sortable: false,
            width: 50,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => {
                const pc = listePlanComptable.find((item) => item.id === params.row.compte);
                if (!pc) return null
                const compteValue = String(pc?.compte || '');
                const valueCredit = params.row.credit;

                if (!isCaActive
                    || tableRows.length === 0
                    || valueCredit === 0
                    // || !['2', '6', '7'].some(prefix => compteValue.startsWith(prefix))
                ) {
                    return null;
                }
                return (
                    <Tooltip title="Modifier le crédit">
                        <span>
                            <Button
                                onClick={() => handleOpenPopupCa(params.id, 'credit', valueCredit)}
                                disabled={isDatagridEditing()}
                                sx={{
                                    outline: 'none',
                                    boxShadow: 'none',
                                    '&:focus': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    },
                                    '&:focus-visible': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    },
                                    ml: 0,
                                }}
                            >
                                <FaRegEdit style={{ width: '30px', height: '30px' }} />
                            </Button>
                        </span>
                    </Tooltip>
                )
            }
        });
    }

    columns.push(
        {
            field: 'actions',
            headerName: 'Action',
            width: 150,
            sortable: false,
            headerAlign: 'center',
            renderCell: (params) => {
                const isLastRow = params.id === tableRows[tableRows.length - 1]?.id;
                return (
                    <>
                        <Tooltip title="Supprimer une ligne">
                            <span>
                                <Button
                                    onClick={() => handleOpenDialogConfirmDeleteSaisie(params.id)}
                                    disabled={(() => {
                                        if (tableRows.length === 1 || isDatagridEditing()) return true;
                                        const selectedJournalId = formSaisie.values.valSelectCodeJnl;
                                        const codeJournal = listeCodeJournaux?.find(cj => cj.id === selectedJournalId);
                                        return codeJournal && codeJournal.type === 'RAN';
                                    })()}
                                    color="error"
                                    sx={{
                                        outline: 'none',
                                        boxShadow: 'none',
                                        '&:focus': {
                                            outline: 'none',
                                            boxShadow: 'none',
                                        },
                                        '&:focus-visible': {
                                            outline: 'none',
                                            boxShadow: 'none',
                                        },
                                        ml: 0,
                                        pointerEvents: (() => {
                                            if (tableRows.length === 1) return 'none';
                                            const selectedJournalId = formSaisie.values.valSelectCodeJnl;
                                            const codeJournal = listeCodeJournaux?.find(cj => cj.id === selectedJournalId);
                                            return (codeJournal && codeJournal.type === 'RAN') ? 'none' : 'auto';
                                        })(),
                                    }}
                                >
                                    <GoX style={{ width: '30px', height: '30px' }} />
                                </Button>
                            </span>
                        </Tooltip>

                        {isLastRow && (
                            <Tooltip title="Ajouter une ligne">
                                <Button
                                    onClick={ajouterNouvelleLigne}
                                    sx={{
                                        boxShadow: 'none',
                                        '&:focus': {
                                            outline: 'none',
                                            boxShadow: 'none',
                                        }
                                    }}
                                    disabled={isDatagridEditing()}
                                >
                                    <IoAddSharp style={{ width: '30px', height: '30px' }} />
                                </Button>
                            </Tooltip>
                        )}
                    </>
                )
            },
        }
    );
    return columns;
}