import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Stack, Paper, MenuItem, Select, 
  Autocomplete, TextField, IconButton, Divider, Tooltip, Chip,
  Breadcrumbs,
  Link
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  NavigateBefore, NavigateNext, AccountBalanceWalletOutlined,
  DownloadOutlined, PrintOutlined, InfoOutlined,
  DashboardOutlined
} from '@mui/icons-material';

const ConsultationComptes = () => {
  const listeComptes = [
    { code: '401100', libelle: 'Fournisseurs divers' },
    { code: '411100', libelle: 'Clients divers' },
    { code: '512000', libelle: 'Banque BNI' },
    { code: '606100', libelle: 'Fournitures de bureau' },
    { code: '707000', libelle: 'Ventes de marchandises' },
  ];

  const [exercice, setExercice] = useState('2024');
  const [selectedCompte, setSelectedCompte] = useState(listeComptes[0]);

  // Simulation de données (à remplacer par ton appel API)
  const rows = [
    { id: 1, date: '01/03/2026', journal: 'HA', piece: 'F2026-045', libelle: 'Facture Bureau Vallée', debit: 450.00, credit: 0, solde: 450.00 },
    { id: 2, date: '05/03/2026', journal: 'HA', piece: 'F2026-089', libelle: 'Achat consommables', debit: 125.50, credit: 0, solde: 575.50 },
  ];

  // Calcul des totaux pour le résumé
  const totals = useMemo(() => {
    const d = rows.reduce((acc, curr) => acc + curr.debit, 0);
    const c = rows.reduce((acc, curr) => acc + curr.credit, 0);
    return { debit: d, credit: c, solde: d - c };
  }, [rows]);

  const handleNavigate = (direction) => {
    const currentIndex = listeComptes.findIndex(c => c.code === selectedCompte.code);
    if (direction === 'next' && currentIndex < listeComptes.length - 1) {
      setSelectedCompte(listeComptes[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedCompte(listeComptes[currentIndex - 1]);
    }
  };

  const columns = [
    { field: 'date', headerName: 'DATE', width: 100 },
    { field: 'journal', headerName: 'JOURNAL', width: 90 },
    { field: 'piece', headerName: 'PIÈCE', width: 120 },
    { field: 'libelle', headerName: 'LIBELLÉ', flex: 1 },
    { 
      field: 'debit', 
      headerName: 'DÉBIT', 
      width: 130, 
      align: 'right',
      renderCell: (p) => p.value !== 0 ? p.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '-' 
    },
    { 
      field: 'credit', 
      headerName: 'CRÉDIT', 
      width: 130, 
      align: 'right',
      renderCell: (p) => p.value !== 0 ? p.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '-' 
    },
    { 
      field: 'solde', 
      headerName: 'SOLDE CUMULÉ', 
      width: 140, 
      align: 'right',
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: p.value < 0 ? '#EF4444' : '#10B981' }}>
          {p.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
  ];

  return (
    <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
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
            <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Consultation</Typography>
            </Breadcrumbs>
        </Stack>

        <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Consultation Grand Livre</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Visualiser les détails de votre balance</Typography>
        </Box>
      
      {/* --- TOP BAR : FILTRES & NAVIGATION --- */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3, border: '1px solid #E2E8F0' }}>
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', mb: 0.5, fontSize: '0.55rem' }}>EXERCICE</Typography>
              <Select value={exercice} onChange={(e) => setExercice(e.target.value)} variant="standard" disableUnderline sx={{ fontSize: '0.9rem', fontWeight: 800 }}>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
              </Select>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ height: 32 }} />

            <Box sx={{ width: 350 }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', mb: 0.5, fontSize: '0.55rem' }}>COMPTE COMPTABLE</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Autocomplete
                  fullWidth
                  size="small"
                  options={listeComptes}
                  getOptionLabel={(option) => `${option.code} - ${option.libelle}`}
                  value={selectedCompte}
                  onChange={(event, newValue) => newValue && setSelectedCompte(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} variant="standard" InputProps={{ ...params.InputProps, disableUnderline: true }}
                      sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem', fontWeight: 700 } }}
                    />
                  )}
                />
                <Stack direction="row" sx={{ bgcolor: '#F1F5F9', borderRadius: '8px', p: 0.5 }}>
                  <IconButton size="small" onClick={() => handleNavigate('prev')} disabled={listeComptes.findIndex(c => c.code === selectedCompte.code) === 0}>
                    <NavigateBefore fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleNavigate('next')} disabled={listeComptes.findIndex(c => c.code === selectedCompte.code) === listeComptes.length - 1}>
                    <NavigateNext fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* --- AFFICHAGE DU SOLDE (RÉSUMÉ) --- */}
          <Stack direction="row" spacing={4} sx={{ px: 3 }}>
             <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', fontSize: '0.55rem' }}>TOTAL DÉBIT</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{totals.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</Typography>
             </Box>
             <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', fontSize: '0.55rem' }}>TOTAL CRÉDIT</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{totals.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</Typography>
             </Box>
             <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#94A3B8', display: 'block', fontSize: '0.55rem' }}>SOLDE ACTUEL</Typography>
                <Typography sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 900, 
                  color: totals.solde < 0 ? '#EF4444' : '#10B981',
                  bgcolor: totals.solde < 0 ? '#FEF2F2' : '#F0FDF4',
                  px: 1, borderRadius: '4px'
                }}>
                  {totals.solde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </Typography>
             </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* --- TABLEAU DES ÉCRITURES --- */}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', height: 'calc(100vh - 200px)' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          density="compact"
          disableSelectionOnClick
          sx={dataGridStyle}
        />
      </Paper>
    </Box>
  );
};

const dataGridStyle = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: '#FCFDFF',
    borderBottom: '1px solid #E2E8F0',
    '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }
  },
  '& .MuiDataGrid-cell': { fontSize: '0.75rem', borderBottom: '1px solid #F1F5F9' },
  '& .MuiDataGrid-row:hover': { bgcolor: '#F8FAFC' }
};

export default ConsultationComptes;