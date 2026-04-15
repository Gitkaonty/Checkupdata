import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  TextField, InputAdornment,
  Chip
} from '@mui/material';
import { 
  NavigateNext, FileDownloadOutlined, 
  HistoryOutlined, DateRangeOutlined,
  PictureAsPdfOutlined, TableChartOutlined,
  BookOutlined,
  DashboardOutlined
} from '@mui/icons-material';

const ExportJournal = () => {
  const [exercise, setExercise] = useState('2024');
  const [journalCode, setJournalCode] = useState('TOUS');
  const [dateArrete, setDateArrete] = useState('2024-12-31');

  // Simulation de la logique de récupération automatique de la date fin d'exercice
  useEffect(() => {
    const datesFin = {
      '2024': '2024-12-31',
      '2025': '2025-12-31',
    };
    setDateArrete(datesFin[exercise] || '');
  }, [exercise]);

  const handleExport = (type) => {
    console.log(`Export ${type} pour l'exercice ${exercise}, journal ${journalCode}, arrêté au ${dateArrete}`);
    // Logique d'export ici
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
                <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Export Journal</Typography>
            </Breadcrumbs>
        </Stack>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#6366F1', display: 'flex' }}>
            <FileDownloadOutlined sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}>
            Export des Journaux
          </Typography>
        </Stack>
      </Box>

      {/* --- CONFIGURATION DE L'EXPORT --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 0, borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FCFDFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>CRITÈRES DE GÉNÉRATION</Typography>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={4} alignItems="flex-start">
                
                {/* BLOC SÉLECTEURS GROUPÉS (Style Pro) */}
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  sx={{ 
                    p: 0.5, 
                    bgcolor: '#FFFFFF', 
                    borderRadius: '10px', 
                    border: '1px solid #E2E8F0',
                    width: 'fit-content',
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

                  {/* Code Journal */}
                  <Box sx={{ px: 2, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontSize: '0.55rem' }}>
                      Code Journal
                    </Typography>
                    <Select 
                      value={journalCode} 
                      onChange={(e) => setJournalCode(e.target.value)} 
                      variant="standard"
                      disableUnderline
                      sx={{ height: 24, fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', minWidth: 120 }}
                    >
                      <MenuItem value="TOUS">Tous les journaux</MenuItem>
                      <MenuItem value="AC">Achats (AC)</MenuItem>
                      <MenuItem value="VE">Ventes (VE)</MenuItem>
                      <MenuItem value="BQ">Banque (BQ)</MenuItem>
                      <MenuItem value="OD">Opérations Diverses (OD)</MenuItem>
                    </Select>
                  </Box>
                </Stack>

                {/* Date Arrêté (Champ Date moderne) */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                    Date d'arrêté
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

              {/* ACTIONS D'EXPORTATION */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#475569' }}>Sélectionnez le format d'export :</Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => handleExport('EXCEL')}
                    startIcon={<TableChartOutlined />}
                    sx={{ 
                      flex: 1, 
                      py: 1.5, 
                      textTransform: 'none', 
                      fontWeight: 800, 
                      borderRadius: '12px',
                      color: '#10B981',
                      borderColor: '#10B981',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)', borderColor: '#059669' }
                    }}
                  >
                    Exporter en Excel
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleExport('PDF')}
                    startIcon={<PictureAsPdfOutlined />}
                    sx={{ 
                      flex: 1, 
                      py: 1.5, 
                      textTransform: 'none', 
                      fontWeight: 800, 
                      borderRadius: '12px',
                      color: '#EF4444',
                      borderColor: '#EF4444',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', borderColor: '#DC2626' }
                    }}
                  >
                    Générer le PDF
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* --- INFO PANEL (ASIDE) --- */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#F1F5F9', border: 'none' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <BookOutlined sx={{ color: '#64748B' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Aide à l'export</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.5 }}>
                L'export inclut toutes les écritures validées jusqu'à la date d'arrêté choisie. 
                Si vous choisissez "Tous les journaux", un seul fichier consolidé sera généré.
              </Typography>
              <Divider />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Note : Pour un export légal (FEC), veuillez vous rendre dans le menu Paramètres\Conformité.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportJournal;