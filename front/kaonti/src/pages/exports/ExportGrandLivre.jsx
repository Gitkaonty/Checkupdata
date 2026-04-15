import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  TextField, InputAdornment, Autocomplete,
  Chip
} from '@mui/material';
import { 
  NavigateNext, FileDownloadOutlined, 
  HistoryOutlined, DateRangeOutlined,
  PictureAsPdfOutlined, TableChartOutlined,
  AccountBalanceWalletOutlined,
  DashboardOutlined
} from '@mui/icons-material';

const ExportGrandLivre = () => {
  const [exercise, setExercise] = useState('2024');
  const [accountRange, setAccountRange] = useState('TOUS');
  const [dateArrete, setDateArrete] = useState('2024-12-31');

  // Mise à jour auto de la date selon l'exercice
  useEffect(() => {
    const datesFin = {
      '2024': '2024-12-31',
      '2025': '2025-12-31',
    };
    setDateArrete(datesFin[exercise] || '');
  }, [exercise]);

  const handleExport = (type) => {
    console.log(`Export GL ${type} | Ex: ${exercise} | Comptes: ${accountRange} | Au: ${dateArrete}`);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* --- HEADER --- */}
      <Box sx={{ mb: 4 }}>
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
                <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Grand Livre</Typography>
            </Breadcrumbs>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#0F172A', display: 'flex' }}>
            <AccountBalanceWalletOutlined sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}>
            Export du Grand Livre
          </Typography>
        </Stack>
      </Box>

      {/* --- CONFIGURATION --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FCFDFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>CRITÈRES D'EXTRACTION</Typography>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={3} alignItems="flex-start">
                
                {/* BLOC SÉLECTEURS GROUPÉS */}
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  sx={{ 
                    p: 0.5, 
                    bgcolor: '#FFFFFF', 
                    borderRadius: '10px', 
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Exercice */}
                  <Box sx={{ px: 2, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontSize: '0.55rem' }}>
                      Exercice
                    </Typography>
                    <Select 
                      value={exercise} 
                      onChange={(e) => setExercise(e.target.value)} 
                      variant="standard"
                      disableUnderline
                      sx={{ height: 24, fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', minWidth: 100 }}
                    >
                      <MenuItem value="2024">Exercice 2024</MenuItem>
                      <MenuItem value="2025">Exercice 2025</MenuItem>
                    </Select>
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', borderColor: '#E2E8F0' }} />

                  {/* Choix de Compte */}
                  <Box sx={{ px: 2, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontSize: '0.55rem' }}>
                      Sélection de compte
                    </Typography>
                    <Select 
                      value={accountRange} 
                      onChange={(e) => setAccountRange(e.target.value)} 
                      variant="standard"
                      disableUnderline
                      sx={{ height: 24, fontSize: '0.8rem', fontWeight: 700, color: '#6366F1', minWidth: 160 }}
                    >
                      <MenuItem value="TOUS">Tous les comptes</MenuItem>
                      <MenuItem value="CLASSE6">Classe 6 (Charges)</MenuItem>
                      <MenuItem value="CLASSE7">Classe 7 (Produits)</MenuItem>
                      <MenuItem value="TIERS">Comptes de Tiers (411/401)</MenuItem>
                    </Select>
                  </Box>
                </Stack>

                {/* Date Arrêté */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                    Arrêté au
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    value={dateArrete}
                    onChange={(e) => setDateArrete(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeOutlined sx={{ fontSize: 16, color: '#6366F1' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        height: 35, 
                        fontSize: '0.8rem', 
                        fontWeight: 700,
                        borderRadius: '8px',
                        bgcolor: '#F8FAFC'
                      } 
                    }}
                  />
                </Box>
              </Stack>

              <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

              {/* FORMATS D'EXPORT */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleExport('EXCEL')}
                  startIcon={<TableChartOutlined />}
                  sx={{ 
                    py: 1.5, 
                    bgcolor: '#10B981', 
                    textTransform: 'none', 
                    fontWeight: 800, 
                    borderRadius: '12px',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Exporter Excel (.xlsx)
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleExport('PDF')}
                  startIcon={<PictureAsPdfOutlined />}
                  sx={{ 
                    py: 1.5, 
                    bgcolor: '#EF4444', 
                    textTransform: 'none', 
                    fontWeight: 800, 
                    borderRadius: '12px',
                    '&:hover': { bgcolor: '#DC2626' }
                  }}
                >
                  Exporter PDF (.pdf)
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* --- ASIDE INFO --- */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>
                Options du Grand Livre
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#1E293B', mb: 1, fontWeight: 500 }}>
                • Inclut le report à nouveau (RAN).
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#1E293B', mb: 1, fontWeight: 500 }}>
                • Détail ligne par ligne avec lettrage.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#1E293B', fontWeight: 500 }}>
                • Sous-totaux par compte comptable.
              </Typography>
            </Paper>
            
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 700 }}>
                Astuce : L'export au format PDF est optimisé pour l'impression A4 paysage.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportGrandLivre;