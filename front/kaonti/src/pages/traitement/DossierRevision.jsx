import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Paper, List, ListItemButton, ListItemText, 
  Tabs, Tab, Divider, Chip, LinearProgress, Button, MenuItem, Select,
  Grid, Link,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Breadcrumbs
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  AssignmentOutlined, HistoryOutlined, AnalyticsOutlined, 
  AddCommentOutlined, CalendarTodayOutlined, FolderOpenOutlined,
  CheckCircleOutline, AccessTimeOutlined,
  NavigateNext,
  DashboardOutlined
} from '@mui/icons-material';
import CommentDialog from '../../components/commetDialog';

const GestionRevisionCycles = () => {
  const [selectedCycle, setSelectedCycle] = useState('ACHATS');
  const [tabValue, setTabValue] = useState(0);
  const [openComment, setOpenComment] = useState(false);
  
  const [exercise, setExercise] = useState('2024');
    const [periode, setPeriode] = useState('2024');


  const cycles = [
    { id: 'ACHATS', label: 'Cycle Achats', progress: 65 },
    { id: 'VENTES', label: 'Cycle Ventes', progress: 40 },
    { id: 'TRESORERIE', label: 'Cycle Trésorerie', progress: 10 },
    { id: 'IMMOB', label: 'Immobilisations', progress: 0 },
  ];

  const currentCycleLabel = cycles.find(c => c.id === selectedCycle)?.label;

  // --- RENDU SYNTHÈSE (STYLE ÉPURÉ) ---
  const RenderSynthese = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', bgcolor: '#FFF', border: '1px solid #E2E8F0' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>
                Indicateurs de complétude
              </Typography>
              <Chip label="En cours" size="small" sx={{ fontWeight: 800, bgcolor: '#EFF6FF', color: '#2563EB', height: 20, fontSize: '0.6rem' }} />
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>Questionnaires validés</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>12 / 15</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={80} sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>Justificatifs de revue analytique</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#6366F1' }}>4 / 10</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={40} sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#6366F1' } }} />
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', bgcolor: '#FFF' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>
                Notes & Observations
              </Typography>
              <IconButton size="small" onClick={() => setOpenComment(true)} sx={{ color: '#2563EB' }}>
                <AddCommentOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
              <Stack spacing={2}>
                {[
                  { user: 'Admin', text: 'Point de vigilance sur le cut-off achats de décembre.', date: 'Il y a 2h' },
                  { user: 'Réviseur', text: 'Toutes les factures > 10k€ ont été pointées.', date: 'Hier' }
                ].map((note, i) => (
                  <Box key={i} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px' }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E293B' }}>{note.user}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>{note.date}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>{note.text}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // --- RENDU QUESTIONNAIRE ---
  const RenderQuestionnaire = () => {
    const columns = [
      { field: 'question', headerName: 'QUESTION DE CONTRÔLE', flex: 2, renderCell: (p) => <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.value}</Typography> },
      { 
        field: 'reponse', 
        headerName: 'VALIDATION', 
        width: 220,
        renderCell: (params) => (
          <ToggleButtonGroup value={params.value} exclusive size="small" sx={{ height: 28 }}>
            <ToggleButton value="OUI" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#ECFDF5', color: '#10B981' } }}>OUI</ToggleButton>
            <ToggleButton value="NON" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#FEF2F2', color: '#EF4444' } }}>NON</ToggleButton>
            <ToggleButton value="NA" sx={{ fontSize: '0.6rem', fontWeight: 800, px: 1.5, '&.Mui-selected': { bgcolor: '#F1F5F9', color: '#64748B' } }}>N/A</ToggleButton>
          </ToggleButtonGroup>
        )
      }
    ];

    const rows = [
      { id: 1, question: 'Les factures > 500€ sont-elles toutes présentes ?', reponse: 'OUI' },
      { id: 2, question: 'La séparation des exercices est-elle respectée ?', reponse: 'NON' },
      { id: 3, question: 'Validation des signatures autorisées ?', reponse: 'NA' },
    ];

    return (
      <Box sx={{ p: 3, height: 'calc(100vh - 250px)' }}>
        <Paper variant="outlined" sx={{ height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
          <DataGrid rows={rows} columns={columns} density="compact" disableSelectionOnClick sx={dataGridStyle} />
        </Paper>
      </Box>
    );
  };

  // --- RENDU REVUE ANALYTIQUE ---
  const RenderRevue = () => {
    const columns = [
      { field: 'date', headerName: 'DATE', width: 100 },
      { field: 'compte', headerName: 'COMPTE', width: 100, renderCell: (p) => <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#6366F1' }}>{p.value}</Typography> },
      { field: 'libelle', headerName: 'LIBELLÉ', flex: 1 },
      { field: 'debit', headerName: 'DÉBIT', width: 120, align: 'right' },
      { field: 'credit', headerName: 'CRÉDIT', width: 120, align: 'right' },
    ];

    const rows = [
      { id: 1, date: '12/12/2024', compte: '606100', libelle: 'Achat fournitures bureau', debit: '150.00', credit: '0.00' },
      { id: 2, date: '15/12/2024', compte: '401100', libelle: 'Fournisseur ABC', debit: '0.00', credit: '150.00' },
    ];

    return (
      <Box sx={{ p: 3, height: 'calc(100vh - 250px)' }}>
        <Paper variant="outlined" sx={{ height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
          <DataGrid rows={rows} columns={columns} density="compact" disableSelectionOnClick sx={dataGridStyle} />
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 1, bgcolor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
                    <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Dossiers de révision</Typography>
                </Breadcrumbs>
            </Stack>
    
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F8FAFC' }}>
        {/* SIDEBAR CYCLES */}
        <Box sx={{ width: 280, bgcolor: '#FFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, bgcolor: '#0F172A', color: '#FFF' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <FolderOpenOutlined sx={{ color: '#00B8D4', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Dossiers de Révision</Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>Expertise & Audit</Typography>
            </Box>
            
            <List sx={{ px: 1.5, py: 2 }}>
            {cycles.map((cycle) => (
                <ListItemButton 
                key={cycle.id}
                selected={selectedCycle === cycle.id}
                onClick={() => setSelectedCycle(cycle.id)}
                sx={{ 
                    borderRadius: '8px', mb: 0.5,
                    '&.Mui-selected': { bgcolor: '#F1F5F9', '& .MuiTypography-root': { color: '#2563EB' } }
                }}
                >
                <ListItemText 
                    primary={<Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{cycle.label}</Typography>}
                    secondary={<LinearProgress variant="determinate" value={cycle.progress} sx={{ mt: 1, height: 3, borderRadius: 2, bgcolor: '#E2E8F0' }} />}
                />
                </ListItemButton>
            ))}
            </List>
        </Box>

        {/* CONTENU PRINCIPAL */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* BARRE HAUTE (Exercice, Période & Label Cycle) */}
            <Box sx={{ px: 3, py: 1.5, bgcolor: '#FFF', borderBottom: '1px solid #E2E8F0' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack 
                        direction="row" 
                        alignItems="center" 
                        sx={{ 
                          mb: 3, 
                          p: 0.5, 
                          bgcolor: '#FFFFFF', 
                          borderRadius: '10px', 
                          border: '1px solid #E2E8F0',
                          width: 'fit-content',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        {/* BLOC EXERCICE */}
                        <Box sx={{ px: 2, py: 0.5 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 800, 
                              color: '#94A3B8', 
                              display: 'block', 
                              mb: 0, 
                              textTransform: 'uppercase', 
                              fontSize: '0.55rem',
                              letterSpacing: '0.02rem'
                            }}
                          >
                            Exercice
                          </Typography>
                          <Select 
                            value={exercise} 
                            onChange={(e) => setExercise(e.target.value)} 
                            variant="standard"
                            disableUnderline
                            size="small" 
                            sx={{ 
                              height: 24, 
                              fontSize: '0.8rem', 
                              fontWeight: 700, 
                              color: '#1E293B',
                              minWidth: 100,
                              '& .MuiSelect-select': { py: 0 }
                            }}
                          >
                            <MenuItem value="2024">Exercice 2024</MenuItem>
                            <MenuItem value="2025">Exercice 2025</MenuItem>
                          </Select>
                        </Box>
                
                        <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', borderColor: '#E2E8F0' }} />
                
                        {/* BLOC PÉRIODE */}
                        <Box sx={{ px: 2, py: 0.5 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 800, 
                              color: '#94A3B8', 
                              display: 'block', 
                              mb: 0, 
                              textTransform: 'uppercase', 
                              fontSize: '0.55rem',
                              letterSpacing: '0.02rem'
                            }}
                          >
                            Période
                          </Typography>
                          <Select 
                            value={periode} 
                            onChange={(e) => setPeriode(e.target.value)} 
                            variant="standard"
                            disableUnderline
                            size="small" 
                            sx={{ 
                              height: 24, 
                              fontSize: '0.8rem', 
                              fontWeight: 700, 
                              color: '#1E293B',
                              minWidth: 140,
                              '& .MuiSelect-select': { py: 0 }
                            }}
                          >
                            <MenuItem value="01-2024">Janvier 2024</MenuItem>
                            <MenuItem value="02-2024">Février 2024</MenuItem>
                            <MenuItem value="T1-2024">Trimestre 1 2024</MenuItem>
                          </Select>
                        </Box>
                      </Stack>

                {/* LABEL DU CYCLE SÉLECTIONNÉ */}
                <Chip 
                label={currentCycleLabel} 
                sx={{ 
                    bgcolor: '#0F172A', color: '#00B8D4', 
                    fontWeight: 900, borderRadius: '6px', 
                    fontSize: '0.75rem', textTransform: 'uppercase' 
                }} 
                />
            </Stack>
            </Box>

            {/* ONGLETS DES RUBRIQUES */}
            <Box sx={{ bgcolor: '#FFF', borderBottom: '1px solid #E2E8F0', px: 2 }}>
            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ minHeight: 48 }}>
                <Tab icon={<AnalyticsOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Synthèse" sx={tabStyle} />
                <Tab icon={<AssignmentOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Questionnaire" sx={tabStyle} />
                <Tab icon={<HistoryOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Revue Analytique" sx={tabStyle} />
            </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#F8FAFC' }}>
            {tabValue === 0 && <RenderSynthese />}
            {tabValue === 1 && <RenderQuestionnaire />}
            {tabValue === 2 && <RenderRevue />}
            </Box>
        </Box>

        <CommentDialog open={openComment} onClose={() => setOpenComment(false)} onSave={() => setOpenComment(false)} />
        </Box>
    </Box>
  );
};

const tabStyle = {
  textTransform: 'none', 
  fontWeight: 800, 
  fontSize: '0.75rem', 
  minHeight: 48,
  minWidth: 140,
  color: '#64748B',
  '&.Mui-selected': { color: '#0F172A' }
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

export default GestionRevisionCycles;