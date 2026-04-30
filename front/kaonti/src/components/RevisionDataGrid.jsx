import React from 'react';
import {
    Box,
    Chip,
    Paper,
    IconButton,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';

// Helper pour formater les montants sans espace insécable
const formatMontant = (value, options = {}) => {
    const number = parseFloat(value) || 0;
    const formatted = number.toLocaleString('fr-FR', {
        minimumFractionDigits: options.fractions || 2,
        maximumFractionDigits: options.fractions || 2
    });
    return formatted.replace(/\u00A0/g, ' ');
};

// Styles standardisés
const tableStyles = {
    headRow: { bgcolor: '#F8FAFC' },
    headCell: { fontWeight: 700, fontSize: '0.85rem', py: 1.5 },
    bodyCell: { fontSize: '0.85rem', py: 1 },
    cellRight: { textAlign: 'right' },
    cellCenter: { textAlign: 'center' },
    montant: { fontWeight: 800 }
};

// Colonnes disponibles (locale pour éviter les problèmes HMR)
const AVAILABLE_COLUMNS = {
    date: {
        field: 'dateecriture',
        headerName: 'Date',
        width: 120,
        renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('fr-FR') : '-',
        sortable: true
    },
    compte: {
        field: 'compte',
        headerName: 'Compte',
        width: 120,
        renderCell: (params) => {
            const compte = params.row?.comptegen || params.row?.compteaux || '-';
            return compte;
        },
        sortable: true
    },
    piece: {
        field: 'piece',
        headerName: 'Pièce',
        width: 120,
        renderCell: (params) => params.value || '-',
        sortable: true
    },
    libelle: {
        field: 'libelle',
        headerName: 'Libellé',
        width: 250,
        renderCell: (params) => params.value || '-',
        sortable: true
    },
    debit: {
        field: 'debit',
        headerName: 'Débit',
        width: 120,
        type: 'number',
        renderCell: (params) => params.value ? formatMontant(params.value) : '-',
        align: 'right',
        sortable: true
    },
    credit: {
        field: 'credit',
        headerName: 'Crédit',
        width: 120,
        type: 'number',
        renderCell: (params) => params.value ? formatMontant(params.value) : '-',
        align: 'right',
        sortable: true
    },
    lettrage: {
        field: 'lettrage',
        headerName: 'Lettrage',
        width: 100,
        renderCell: (params) => params.value || '-',
        sortable: true
    },
    analytique: {
        field: 'analytique',
        headerName: 'Analytique',
        width: 120,
        renderCell: (params) => params.value || '-',
        sortable: true
    },
    valide: {
        field: 'valide',
        headerName: 'Validé',
        width: 100,
        renderCell: (params) => {
            const isValide = params.row._anomaly?.valide || params.row.valide;
            return (
                <Chip
                    label={isValide ? 'Oui' : 'Non'}
                    color={isValide ? 'success' : 'error'}
                    size="small"
                />
            );
        },
        sortable: true
    },
    commentaire: {
        field: 'commentaire',
        headerName: 'Commentaire',
        width: 150,
        renderCell: (params) => {
            const comment = params.row._anomaly?.commentaire || params.row.commentaire || '-';
            return comment;
        },
        sortable: true
    },
    action: {
        field: 'action',
        headerName: 'Action',
        width: 180,
        renderCell: (params) => {
            const { onComment, onValidate, authGradientEnd = '#1976d2' } = params.api.getColumnValue('action')?.config || {};
            const lineAnomaly = params.row._anomaly || params.row;
            
            return (
                <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                        variant="outlined"
                        size="small"
                        onClick={() => onComment?.(params.row, lineAnomaly)}
                        sx={{ borderColor: '#1203e0ff' }}
                    >
                        <EditNoteIcon fontSize="small" sx={{ color: '#1203e0ff' }} />
                    </IconButton>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => onValidate?.(params.row, lineAnomaly)}
                        sx={{
                            minWidth: 80,
                            height: 28,
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            backgroundColor: lineAnomaly?.valide ? '#d32f2f' : authGradientEnd,
                            color: 'white',
                            '&:hover': {
                                backgroundColor: lineAnomaly?.valide ? '#b71c1c' : authGradientEnd,
                            }
                        }}
                    >
                        {lineAnomaly?.valide ? 'Annuler' : 'Valider'}
                    </Button>
                </Stack>
            );
        },
        sortable: false
    },
    // Colonnes spécifiques ATYPIQUE
    montant: {
        field: 'montant',
        headerName: 'Montant',
        width: 120,
        type: 'number',
        renderCell: (params) => formatMontant(params.value),
        align: 'right',
        sortable: true
    },
    moyenne: {
        field: 'moyenne',
        headerName: 'Moyenne',
        width: 120,
        type: 'number',
        renderCell: (params) => formatMontant(params.value),
        align: 'right',
        sortable: true
    },
    seuil: {
        field: 'seuil',
        headerName: 'Seuil',
        width: 120,
        type: 'number',
        renderCell: (params) => formatMontant(params.value),
        align: 'right',
        sortable: true
    }
};

// Configuration prédéfinie pour les colonnes standards
export const COLUMN_PRESETS = {
    standard: ['date', 'compte', 'piece', 'libelle', 'debit', 'credit', 'lettrage', 'analytique', 'valide', 'commentaire', 'action'],
    standardNoAction: ['date', 'compte', 'piece', 'libelle', 'debit', 'credit', 'lettrage', 'analytique', 'valide', 'commentaire'],
    atypique: ['date', 'piece', 'libelle', 'montant', 'moyenne', 'seuil', 'action'],
    simple: ['date', 'compte', 'libelle', 'debit', 'credit', 'action']
};

/**
 * Composant Tableau réutilisable pour les révisions
 */
function RevisionDataGrid({
    lines = [],
    columns = COLUMN_PRESETS.standard,
    config = {},
    height = 500,
    showToolbar = true,
    pageSize = 25,
    sx = {}
}) {
    console.log('DEBUG RevisionDataGrid:', { lines: lines.length, columns, config });

    if (lines.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
                Aucune ligne à afficher
            </Box>
        );
    }

    // Définition des colonnes pour le tableau standard
    const renderCell = (line, columnKey) => {
        const { onComment, onValidate, authGradientEnd = '#1976d2' } = config;
        
        switch (columnKey) {
            case 'date':
                return line?.dateecriture ? new Date(line.dateecriture).toLocaleDateString('fr-FR') : '-';
            case 'compte':
                return line?.comptegen || line?.compteaux || '-';
            case 'piece':
                return line?.piece || '-';
            case 'libelle':
                return line?.libelle || '-';
            case 'debit':
                return line?.debit ? formatMontant(line.debit) : '-';
            case 'credit':
                return line?.credit ? formatMontant(line.credit) : '-';
            case 'lettrage':
                return line?.lettrage || '-';
            case 'analytique':
                return line?.analytique || '-';
            case 'valide':
                const isValide = line._anomaly?.valide || line.valide;
                return (
                    <Chip
                        label={isValide ? 'Oui' : 'Non'}
                        color={isValide ? 'success' : 'error'}
                        size="small"
                    />
                );
            case 'commentaire':
                const comment = line._anomaly?.commentaire || line.commentaire || '-';
                return comment;
            case 'action':
                const lineAnomaly = line._anomaly || line;
                return (
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                            variant="outlined"
                            size="small"
                            onClick={() => onComment?.(line, lineAnomaly)}
                            sx={{ borderColor: '#1203e0ff' }}
                        >
                            <EditNoteIcon fontSize="small" sx={{ color: '#1203e0ff' }} />
                        </IconButton>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => onValidate?.(line, lineAnomaly)}
                            sx={{
                                minWidth: 80,
                                height: 28,
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                backgroundColor: lineAnomaly?.valide ? '#d32f2f' : authGradientEnd,
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: lineAnomaly?.valide ? '#b71c1c' : authGradientEnd,
                                }
                            }}
                        >
                            {lineAnomaly?.valide ? 'Annuler' : 'Valider'}
                        </Button>
                    </Stack>
                );
            default:
                return '-';
        }
    };

    const getHeaderName = (columnKey) => {
        const headers = {
            date: 'Date',
            compte: 'Compte',
            piece: 'Pièce',
            libelle: 'Libellé',
            debit: 'Débit',
            credit: 'Crédit',
            lettrage: 'Lettrage',
            analytique: 'Analytique',
            valide: 'Validé',
            commentaire: 'Commentaire',
            action: 'Action'
        };
        return headers[columnKey] || columnKey;
    };

    const getAlign = (columnKey) => {
        const aligns = {
            debit: 'right',
            credit: 'right',
            valide: 'center',
            action: 'center'
        };
        return aligns[columnKey] || 'left';
    };

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: height, ...sx }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow sx={tableStyles.headRow}>
                        {columns.map(col => {
                            const key = typeof col === 'string' ? col : col.key;
                            return (
                                <TableCell 
                                    key={key}
                                    sx={{ 
                                        ...tableStyles.headCell, 
                                        textAlign: getAlign(key)
                                    }}
                                >
                                    {getHeaderName(key)}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {lines.map((line, lineIdx) => (
                        <TableRow key={line?.id || lineIdx} hover>
                            {columns.map(col => {
                                const key = typeof col === 'string' ? col : col.key;
                                return (
                                    <TableCell 
                                        key={key}
                                        sx={{ 
                                            ...tableStyles.bodyCell, 
                                            textAlign: getAlign(key)
                                        }}
                                    >
                                        {renderCell(line, key)}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export { formatMontant };
export default RevisionDataGrid;
