import React from 'react';
import { 
  Box, Typography, Stack, Divider, IconButton, 
  Paper, Tooltip, Chip 
} from '@mui/material';
import { 
  CheckCircleOutline, 
  ChatBubbleOutline, 
  ErrorOutline,
  HourglassEmptyOutlined,
  HistoryToggleOffOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const EcrituresSuspense = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* --- STATISTIQUES GLOBALES (Sous le titre) --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ÉCRITURES EN ATTENTE</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>09</Typography>
            <HourglassEmptyOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>05</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>PLUS DE 30 JOURS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#6366F1', fontWeight: 900, lineHeight: 1 }}>03</Typography>
            <HistoryToggleOffOutlined sx={{ color: '#6366F1', fontSize: 18 }} />
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* --- TABLEAU DES ÉCRITURES (Même style que Doublons) --- */}
        <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: '8px', overflow: 'hidden', bgcolor: '#FFFFFF' }}>
          <DataGrid
            rows={[]} // Données des comptes 471, etc.
            columns={[
              { field: 'compte', headerName: 'Compte', width: 100, cellClassName: 'font-bold' },
              { field: 'journal', headerName: 'Journal', width: 80 },
              { field: 'piece', headerName: 'Pièce', width: 110 },
              { field: 'libelle', headerName: 'Libellé', flex: 1 },
              { field: 'debit', headerName: 'Débit', width: 120, type: 'number' },
              { field: 'credit', headerName: 'Crédit', width: 120, type: 'number' },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 120,
                sortable: false,
                renderCell: () => (
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Valider">
                      <IconButton size="small" sx={{ color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.05)' }}>
                        <CheckCircleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Commenter">
                      <IconButton size="small" sx={{ color: '#64748B', bgcolor: '#F1F5F9' }}>
                        <ChatBubbleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
            ]}
            density="compact"
            sx={dataGridStyle}
            disableRowSelectionOnClick
          />
        </Paper>
      </Box>
    </Box>
  );
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#F8FAFC',
    color: '#64748B',
    fontSize: '0.65rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    borderBottom: '1px solid #E2E8F0'
  },
  '& .MuiDataGrid-cell': { 
    fontSize: '0.8rem', 
    borderBottom: '1px solid #F1F5F9',
    '&:focus': { outline: 'none' }
  },
  '& .font-bold': { color: '#1E293B', fontWeight: 700 }
};

export default EcrituresSuspense;