import React from 'react';
import { 
  Box, Typography, Stack, Divider, IconButton, Paper, Tooltip, Chip 
} from '@mui/material';
import { 
  CheckCircleOutline, 
  ChatBubbleOutline, 
  ErrorOutline,
  AssessmentOutlined,
  QueryStatsOutlined
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const ControleAnalytique = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* --- STATISTIQUES GLOBALES --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ERREURS D'IMPUTATION</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>05</Typography>
            <AssessmentOutlined sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>NON RENSEIGNÉS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>12</Typography>
            <QueryStatsOutlined sx={{ color: '#F59E0B', fontSize: 18 }} />
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* --- TABLEAU ANALYTIQUE --- */}
        <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: '8px', overflow: 'hidden', bgcolor: '#FFFFFF' }}>
          <DataGrid
            rows={[]} // Données avec codes analytiques
            columns={[
              { field: 'compte', headerName: 'Compte', width: 90, cellClassName: 'font-bold' },
              { 
                field: 'analytique', 
                headerName: 'Code Analytique', 
                width: 150,
                renderCell: (params) => (
                  <Chip 
                    label={params.value || 'NON RENSEIGNÉ'} 
                    size="small" 
                    sx={{ 
                      bgcolor: params.value ? '#EEF2FF' : '#FEF2F2', 
                      color: params.value ? '#6366F1' : '#EF4444',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      borderRadius: '4px'
                    }} 
                  />
                )
              },
              { field: 'journal', headerName: 'Jour.', width: 70 },
              { field: 'piece', headerName: 'Pièce', width: 100 },
              { field: 'libelle', headerName: 'Libellé', flex: 1 },
              { field: 'debit', headerName: 'Débit', width: 110, type: 'number' },
              { field: 'credit', headerName: 'Crédit', width: 110, type: 'number' },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 110,
                sortable: false,
                renderCell: () => (
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" sx={{ color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.05)' }}>
                      <CheckCircleOutline fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#64748B', bgcolor: '#F1F5F9' }}>
                      <ChatBubbleOutline fontSize="small" />
                    </IconButton>
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

export default ControleAnalytique;