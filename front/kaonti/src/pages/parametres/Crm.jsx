import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, Paper, Grid,
  TextField, Chip, Breadcrumbs, Link, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, Select, InputAdornment
} from '@mui/material';
import { 
  SettingsOutlined, NavigateNext, BusinessOutlined, 
  AddOutlined, EditOutlined, DeleteOutline, SaveOutlined,
  AnalyticsOutlined, MenuBookOutlined, AccountTreeOutlined,
  ListAltOutlined, AdminPanelSettingsOutlined,
  ChevronRight,
  DashboardOutlined
} from '@mui/icons-material';

const CRM = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAxe, setSelectedAxe] = useState(0);

  // Style Header Tableau (Pro & Minimaliste)
  const headerStyle = {
    fontWeight: 800, 
    color: '#94A3B8', 
    fontSize: '0.65rem',
    textTransform: 'uppercase', 
    letterSpacing: '0.05rem',
    py: 1.5, 
    borderBottom: '1px solid #E2E8F0',
    bgcolor: '#FCFDFF'
  };

  const FieldLabel = ({ children }) => (
    <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02rem' }}>
      {children}
    </Typography>
  );

  return (
    <Box sx={{ p: 2, height: '100%', bgcolor: '#F8FAFC' }}>
        {/* --- BREADCRUMBS --- */}
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
          <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>CRM & Dossier</Typography>
        </Breadcrumbs>
      </Stack>
      
      {/* --- TITRE DE LA PAGE --- */}
      <Box sx={{ mb: 3 , mt:2}}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <AdminPanelSettingsOutlined sx={{ color: '#1E293B', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-1px' }}>
            CRM
          </Typography>
        </Stack>
        <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600, ml: 6, mt: -0.5 }}>
          SARL Kaonty Demo
        </Typography>
      </Box>

      {/* --- HEADER ÉDITABLE --- */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', mb: 4, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <Grid container spacing={10} alignItems="flex-end">
          <Grid item xs={5} md={2.7}>
            <FieldLabel>Nom complet du dossier</FieldLabel>
            <TextField sx={{width:350}} defaultValue="SARL Kaonty Demo" fullWidth size="small" variant="outlined" />
          </Grid>
          <Grid item xs={12} md={2.3}>
            <FieldLabel>Portefeuille associé</FieldLabel>
            <Select sx={{width:300}} defaultValue={10} fullWidth size="small">
              <MenuItem value={10}>Dossiers Permanents</MenuItem>
              <MenuItem value={20}>Archives Fiscales</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button variant="contained" startIcon={<SaveOutlined />} fullWidth sx={{width:'150px', bgcolor: '#1E293B', textTransform: 'none', borderRadius: '10px', height: '40px', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#000' } }}>
              Enregistrer
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* --- NAVIGATION --- */}
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ 
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px', bgcolor: '#6366F1' },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: '0.9rem', color: '#64748B', minWidth: 120 }
          }}
        >
          <Tab label="Seuils" />
          <Tab label="Plan Comptable" />
          <Tab label="Codes Journaux" />
          <Tab label="Analytique" />
        </Tabs>
      </Box>

      {/* --- CONTENU --- */}
      
      {/* ONGLET 0 : SEUILS */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', bgcolor: '#FFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsOutlined sx={{ color: '#6366F1' }} /> Paramètres d'Anomalies
              </Typography>
              <FieldLabel>Seuil de variation analytique N/N-1 (%)</FieldLabel>
              <TextField fullWidth type="number" defaultValue={15} size="small" />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', bgcolor: '#FFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListAltOutlined sx={{ color: '#6366F1' }} /> Délais de Paiement
              </Typography>
              <Stack direction="row" spacing={3}>
                <Box sx={{ flex: 1 }}>
                  <FieldLabel>Retard Fournisseurs (Mois)</FieldLabel>
                  <TextField fullWidth type="number" defaultValue={3} size="small" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FieldLabel>Retard Clients (Mois)</FieldLabel>
                  <TextField fullWidth type="number" defaultValue={3} size="small" />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ONGLET 1 : PLAN COMPTABLE */}
      {activeTab === 1 && (
        <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, bgcolor: '#FFF' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>RÉFÉRENTIEL PLAN COMPTABLE</Typography>
            <Button startIcon={<AddOutlined sx={{ color: '#10B981' }} />} sx={{ bgcolor: '#000', color: '#FFF', textTransform: 'none', px: 2, borderRadius: '8px', fontWeight: 700 }}>Ajouter un compte</Button>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle}>Compte</TableCell>
                  <TableCell sx={headerStyle}>Libellé</TableCell>
                  <TableCell sx={headerStyle}>Nature</TableCell>
                  <TableCell sx={headerStyle}>Base</TableCell>
                  <TableCell align="right" sx={headerStyle}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[ {c: '401000', l: 'Fournisseurs', n: 'Collectif', b: 'TVA 20%'}, {c: '411000', l: 'Clients', n: 'Collectif', b: 'TVA 20%'} ].map((row, i) => (
                  <TableRow key={i} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#6366F1' }}>{row.c}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{row.l}</TableCell>
                    <TableCell>
                      <Chip label={row.n} size="small" sx={{ borderRadius: '6px', fontWeight: 800, fontSize: '0.65rem', bgcolor: '#F1F5F9' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{row.b}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ mr: 1 }}><EditOutlined fontSize="small" /></IconButton>
                      <IconButton size="small" sx={{ color: '#EF4444' }}><DeleteOutline fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ONGLET 2 : CODES JOURNAUX */}
      {activeTab === 2 && (
        <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, bgcolor: '#FFF' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>REGISTRE DES JOURNAUX</Typography>
            <Button startIcon={<AddOutlined sx={{ color: '#10B981' }} />} sx={{ bgcolor: '#000', color: '#FFF', textTransform: 'none', px: 2, borderRadius: '8px', fontWeight: 700 }}>Nouveau Journal</Button>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerStyle}>Code</TableCell>
                  <TableCell sx={headerStyle}>Libellé</TableCell>
                  <TableCell sx={headerStyle}>Type</TableCell>
                  <TableCell align="right" sx={headerStyle}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[ {c: 'AC', l: 'Achats marchandises', t: 'Achat', clr: '#FEF2F2', txt: '#EF4444'}, {c: 'BQ', l: 'Banque Société Générale', t: 'Banque', clr: '#F0F9FF', txt: '#0EA5E9'} ].map((row, i) => (
                  <TableRow key={i} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 900 }}>{row.c}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{row.l}</TableCell>
                    <TableCell>
                      <Chip label={row.t} size="small" sx={{ borderRadius: '6px', fontWeight: 800, fontSize: '0.65rem', bgcolor: row.clr, color: row.txt }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ mr: 1 }}><EditOutlined fontSize="small" /></IconButton>
                      <IconButton size="small" sx={{ color: '#EF4444' }}><DeleteOutline fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ONGLET 3 : ANALYTIQUE */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ p: 2, bgcolor: '#FFF' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>AXES</Typography>
                    <Button size="small" startIcon={<AddOutlined sx={{ color: '#10B981' }} />} sx={{ bgcolor: '#000', color: '#FFF', textTransform: 'none' }}>Ajouter</Button>
                </Stack>
                <Table size="small">
                    <TableHead><TableRow>
                        <TableCell sx={headerStyle}>Code Axe</TableCell>
                        <TableCell sx={headerStyle}>Libellé</TableCell>
                        <TableCell align="right" sx={headerStyle}>Action</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        <TableRow selected sx={{ bgcolor: '#F1F5F9' }}>
                            <TableCell sx={{ fontWeight: 800 }}>DEP</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>Département</TableCell>
                            <TableCell align="right"><IconButton size="small"><EditOutlined fontSize="small" /></IconButton></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', borderLeft: '4px solid #6366F1' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ p: 2, bgcolor: '#FFF' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>SECTIONS ASSOCIÉES</Typography>
                    <Button size="small" startIcon={<AddOutlined sx={{ color: '#10B981' }} />} sx={{ bgcolor: '#000', color: '#FFF', textTransform: 'none' }}>Ajouter Section</Button>
                </Stack>
                <Table size="small">
                    <TableHead><TableRow>
                        <TableCell sx={headerStyle}>Code Section</TableCell>
                        <TableCell sx={headerStyle}>Libellé</TableCell>
                        <TableCell align="right" sx={headerStyle}>Action</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>SUD_01</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>Pôle Sud Logistique</TableCell>
                            <TableCell align="right"><IconButton size="small" sx={{ color: '#EF4444' }}><DeleteOutline fontSize="small" /></IconButton></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CRM;