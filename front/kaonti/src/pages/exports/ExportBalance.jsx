import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  TextField, FormControlLabel, Switch,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; // Assurez-vous d'avoir installé @mui/x-data-grid
import { 
  NavigateNext, HistoryOutlined, DateRangeOutlined,
  PictureAsPdfOutlined, TableChartOutlined,
  AccountBalanceOutlined, FilterListOutlined,
  DashboardOutlined
} from '@mui/icons-material';

const ExportBalance = () => {
  const [exercise, setExercise] = useState('2024');
  const [dateArrete, setDateArrete] = useState('2024-12-31');
  const [isCentralized, setIsCentralized] = useState(false);

  useEffect(() => {
    const datesFin = {
      '2024': '2024-12-31',
      '2025': '2025-12-31',
    };
    setDateArrete(datesFin[exercise] || '');
  }, [exercise]);

  // Définition des colonnes pour le DataGrid
  const columns = [
    { 
      field: 'compte', 
      headerName: 'N° COMPTE', 
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'libelle', 
      headerName: 'INTITULÉ DU COMPTE', 
      flex: 2,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E293B' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'debit', 
      headerName: 'SOLDE DÉBIT', 
      flex: 1, 
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'credit', 
      headerName: 'SOLDE CRÉDIT', 
      flex: 1, 
      align: 'right', 
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {params.value}
        </Typography>
      )
    },
  ];

  const rows = [
    { id: 1, compte: '101000', libelle: 'Capital', debit: '0.00', credit: '50 000.00' },
    { id: 2, compte: '401100', libelle: 'Fournisseurs', debit: '1 200.00', credit: '4 500.00' },
    { id: 3, compte: '411100', libelle: 'Clients', debit: '8 500.00', credit: '0.00' },
    { id: 4, compte: '512000', libelle: 'Banque', debit: '15 400.00', credit: '0.00' },
    { id: 5, compte: '606000', libelle: 'Achats fournitures', debit: '450.00', credit: '0.00' },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- HEADER --- */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Chip 
            label="Cabinet Randria & Associés" 
            sx={{ 
                borderRadius: '4px', // Rectangulaire comme demandé
                bgcolor: '#F1F5F9', 
                color: '#475569', 
                fontWeight: 700,
                fontSize: '0.95rem',
                border: '1px solid #E2E8F0',
                height: 24,
            }} 
            />
            <Breadcrumbs 
                separator={<NavigateNext fontSize="small" />} 
                sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 600 } }}
                >
                <Link underline="hover" color="inherit" href="/dashboard" 
                    sx={{ display: 'flex', alignItems: 'center' }}
                    >
                    <DashboardOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
                </Link>
                <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Balance Générale</Typography>
            </Breadcrumbs>
        </Stack>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#00B8D4', display: 'flex' }}>
              <AccountBalanceOutlined sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}>
              Balance des Comptes
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<TableChartOutlined />} sx={{ textTransform: 'none', fontWeight: 700, color: '#10B981', borderColor: '#10B981', borderRadius: '8px' }}>Excel</Button>
            <Button variant="contained" startIcon={<PictureAsPdfOutlined />} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#EF4444', borderRadius: '8px', '&:hover': { bgcolor: '#DC2626' } }}>PDF</Button>
          </Stack>
        </Stack>
      </Box>

      {/* --- CONFIGURATION --- */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '12px', bgcolor: '#FFF' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
              Exercice
            </Typography>
            <Select 
              value={exercise} 
              onChange={(e) => setExercise(e.target.value)} 
              size="small"
              sx={{ height: 35, fontSize: '0.8rem', fontWeight: 700, minWidth: 120, borderRadius: '8px' }}
            >
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2025">2025</MenuItem>
            </Select>
          </Grid>

          <Grid item>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
              Arrêté au
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dateArrete}
              onChange={(e) => setDateArrete(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { height: 35, fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' } }}
            />
          </Grid>

          <Grid item sx={{ borderLeft: '1px solid #E2E8F0', ml: 2, pl: 4, mt:4 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={isCentralized} 
                  onChange={(e) => setIsCentralized(e.target.checked)}
                  sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366F1' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366F1' }
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                  Compte centralisé
                </Typography>
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* --- DATAGRID BALANCE --- */}
      <Paper 
        variant="outlined" 
        sx={{ 
          borderRadius: '12px', 
          overflow: 'hidden', 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 400 
        }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#FCFDFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterListOutlined sx={{ fontSize: 18, color: '#64748B' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#1E293B' }}>
              APERÇU DE LA BALANCE
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            density="compact"
            disableSelectionOnClick
            hideFooter
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#FCFDFF',
                borderBottom: '1px solid #E2E8F0',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#94A3B8',
                  letterSpacing: '0.05rem',
                }
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #F1F5F9',
              },
              '& .MuiDataGrid-virtualScroller': {
                bgcolor: '#FFF',
              }
            }}
          />
        </Box>

        {/* LIGNE DE TOTAL FIXE EN BAS */}
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#F8FAFC', 
            borderTop: '2px solid #E2E8F0', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center' 
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#1E293B' }}>
            TOTAL GÉNÉRAL
          </Typography>
          <Stack direction="row" spacing={10} sx={{ mr: 4 }}>
             <Stack alignItems="flex-end">
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.6rem' }}>TOTAL DÉBIT</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: '#1E293B' }}>25 550.00</Typography>
             </Stack>
             <Stack alignItems="flex-end">
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.6rem' }}>TOTAL CRÉDIT</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: '#1E293B' }}>25 550.00</Typography>
             </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ExportBalance;