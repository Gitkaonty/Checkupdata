import React from 'react';
import { 
  Box, Typography, Stack, IconButton, Divider, Tooltip 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  CheckCircleOutline, 
  ChatBubbleOutline, 
  CheckCircle,
  ErrorOutline
} from '@mui/icons-material';

const RevueMensuelleTable = () => {
  const rows = [
    { 
      id: 1, compte: '707000', libelle: 'Ventes de marchandises', 
      m01: 12000, m02: 15000, m03: 14000, m04: 18000, m05: 11000, m06: 13000,
      m07: 16000, m08: 5000, m09: 14000, m10: 19000, m11: 21000, m12: 25000,
      valide: true 
    },
    { 
      id: 2, compte: '606100', libelle: 'Fournitures (Eau, Elec)', 
      m01: 800, m02: 950, m03: 0, m04: 850, m05: 900, m06: 1100,
      m07: 750, m08: 800, m09: 0, m10: 920, m11: 1050, m12: 1200,
      valide: false 
    },
    // Ajoutez d'autres lignes ici pour tester le scroll vertical
  ];

  const columns = [
    { 
      field: 'compte', 
      headerName: 'Compte', 
      width: 90, 
      headerClassName: 'sticky-header',
      cellClassName: 'font-bold sticky-cell' 
    },
    { 
      field: 'libelle', 
      headerName: 'Libellé', 
      width: 200, 
      headerClassName: 'sticky-header',
      cellClassName: 'sticky-cell' 
    },
    
    ...['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((mois, index) => ({
      field: `m${(index + 1).toString().padStart(2, '0')}`,
      headerName: mois,
      width: 85,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          fontSize: '0.75rem', 
          color: params.value === 0 ? '#EF4444' : '#1E293B',
          fontWeight: params.value === 0 ? 800 : 400 
        }}>
          {params.value === 0 ? '—' : params.value.toLocaleString()}
        </Typography>
      )
    })),

    { 
      field: 'total', 
      headerName: 'TOTAL', 
      width: 110, 
      type: 'number',
      cellClassName: 'total-cell',
      valueGetter: (params) => {
        return Object.keys(params.row)
          .filter(key => key.startsWith('m'))
          .reduce((sum, key) => sum + (params.row[key] || 0), 0);
      },
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {params.value.toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'valide',
      headerName: 'État',
      width: 60,
      align: 'center',
      renderCell: (params) => (
        params.value ? 
        <CheckCircle sx={{ color: '#10B981', fontSize: 18 }} /> : 
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B' }} />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: () => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Valider">
            <IconButton size="small" sx={{ color: '#10B981' }}><CheckCircleOutline fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Commenter">
            <IconButton size="small" sx={{ color: '#64748B' }}><ChatBubbleOutline fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* HEADER DE STATISTIQUES (Fixe en haut) */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>MOIS À ZÉRO</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>02</Typography>
            <ErrorOutline sx={{ color: '#EF4444', fontSize: 16 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>08</Typography>
        </Box>
      </Stack>

      {/* ZONE DU TABLEAU AVEC SCROLL INTERNE */}
      <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
        <DataGrid 
          rows={rows} 
          columns={columns} 
          density="compact"
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-main': {
                overflow: 'auto', // Permet le scroll horizontal et vertical interne
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#FFFFFF',
              borderBottom: '2px solid #E2E8F0',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F1F5F9',
              '&:focus': { outline: 'none' }
            },
            '& .total-cell': {
              bgcolor: '#F8FAFC',
              borderLeft: '1px solid #E2E8F0',
            },
            '& .font-bold': { fontWeight: 700 },
            
            // --- ASTUCE POUR LE "STICKY" SANS VERSION PRO ---
            // On peut simuler le blocage des premières colonnes si besoin via CSS
            // Mais la DataGrid Community gère déjà bien le scroll si le conteneur est bridé.
          }}
        />
      </Box>
    </Box>
  );
};

export default RevueMensuelleTable;