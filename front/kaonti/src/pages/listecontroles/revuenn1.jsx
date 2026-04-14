import React from 'react';
import { Box, Typography, Stack, Chip, IconButton, Tooltip, Button, Divider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  CheckCircleOutline, 
  ChatBubbleOutline, 
  ErrorOutline, 
  CheckCircle 
} from '@mui/icons-material';

const RevueAnalytiqueTable = () => {
  // Simulation de données
  const rows = [
    { id: 1, compte: '607000', libelle: 'Achats de marchandises', soldeN: 152400, soldeN1: 120000, valide: true },
    { id: 2, compte: '613000', libelle: 'Locations immobilières', soldeN: 24000, soldeN1: 24000, valide: false },
    { id: 3, compte: '622600', libelle: 'Honoraires', soldeN: 8500, soldeN1: 3200, valide: false },
    { id: 4, compte: '626100', libelle: 'Frais postaux', soldeN: 450, soldeN1: 1200, valide: false },
  ];

  const columns = [
    { field: 'compte', headerName: 'Compte', width: 90, cellClassName: 'font-bold' },
    { field: 'libelle', headerName: 'Libellé', flex: 1 },
    { 
      field: 'soldeN1', 
      headerName: 'Solde N-1', 
      width: 120, 
      type: 'number',
      renderCell: (params) => params.value.toLocaleString()
    },
    { 
      field: 'soldeN', 
      headerName: 'Solde N', 
      width: 120, 
      type: 'number',
      renderCell: (params) => params.value.toLocaleString()
    },
    { 
      field: 'variation', 
      headerName: 'Var. Abs', 
      width: 110,
      valueGetter: (params) => params.row.soldeN - params.row.soldeN1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: params.value >= 0 ? '#1e293b' : '#ef4444' }}>
          {params.value > 0 ? `+${params.value.toLocaleString()}` : params.value.toLocaleString()}
        </Typography>
      )
    },
    { 
      field: 'pourcentage', 
      headerName: 'Var. %', 
      width: 100,
      valueGetter: (params) => {
        if (params.row.soldeN1 === 0) return 0;
        return ((params.row.soldeN - params.row.soldeN1) / params.row.soldeN1) * 100;
      },
      renderCell: (params) => {
        const val = Math.round(params.value);
        const isHigh = Math.abs(val) > 20; // Seuil d'alerte à 20%
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: isHigh ? '#ef4444' : '#10b981' }}>
              {val > 0 ? `+${val}%` : `${val}%`}
            </Typography>
            {isHigh && <ErrorOutline sx={{ fontSize: 14, color: '#ef4444' }} />}
          </Stack>
        );
      }
    },
    {
      field: 'valide',
      headerName: 'État',
      width: 80,
      align: 'center',
      renderCell: (params) => (
        params.value ? 
        <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} /> : 
        <Tooltip title="En attente de revue">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
        </Tooltip>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Valider la ligne">
            <IconButton size="small" sx={{ color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.05)' }}>
              <CheckCircleOutline fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ajouter un commentaire">
            <IconButton size="small" sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}>
              <ChatBubbleOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* STATISTIQUES INTERNES AU CONTRÔLE */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>ANOMALIES DÉTECTÉES</Typography>
          <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 900, lineHeight: 1 }}>12</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 900, lineHeight: 1 }}>05</Typography>
        </Box>
      </Stack>

      {/* TABLEAU */}
      <Box sx={{ height: 500 }}>
        <DataGrid 
          rows={rows} 
          columns={columns} 
          sx={dataGridStyle} 
          disableRowSelectionOnClick 
          density="compact"
        />
      </Box>
    </Box>
  );
};

// Style harmonisé
const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#ffffff',
    color: '#64748b',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    borderBottom: '1px solid #e2e8f0',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    '&:focus': { outline: 'none' }
  },
  '& .font-bold': {
    fontWeight: 700,
    color: '#1e293b'
  }
};

export default RevueAnalytiqueTable;