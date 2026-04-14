import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, Paper, Grid,
  Breadcrumbs, Link, MenuItem, Select, Divider,
  LinearProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow
} from '@mui/material';
import { 
  NavigateNext, FileUploadOutlined, 
  DownloadOutlined, CloudUploadOutlined, ErrorOutline,
  CheckCircleOutline, HistoryOutlined
} from '@mui/icons-material';

const ImportJournal = () => {
  const [importMode, setImportMode] = useState('update');
  const [exercise, setExercise] = useState('2024');
  const [uploadProgress, setUploadProgress] = useState(65);

  const headerStyle = {
    fontWeight: 800, color: '#94A3B8', fontSize: '0.65rem',
    textTransform: 'uppercase', letterSpacing: '0.05rem',
    py: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#FCFDFF'
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* --- HEADER COMPACT --- */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 12 }} />} sx={{ mb: 0.5 }}>
          <Link underline="none" color="inherit" href="/" sx={{ fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <HistoryOutlined sx={{ mr: 0.5, fontSize: 14 }} /> Écritures
          </Link>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#1E293B' }}>Import Journal</Typography>
        </Breadcrumbs>
        
        <Stack direction="column" spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FileUploadOutlined sx={{ color: '#6366F1', fontSize: 24 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.5px' }}>
              Import Journal
            </Typography>
          </Stack>

          {/* SÉLECTEUR EXERCICE PLACÉ EN BAS DU TITRE AVEC LABEL */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.3, textTransform: 'uppercase', fontSize: '0.6rem' }}>
              Exercice Comptable
            </Typography>
            <Select 
              value={exercise} 
              onChange={(e) => setExercise(e.target.value)} 
              size="small" 
              sx={{ height: 30, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#FFF', minWidth: 120 }}
            >
              <MenuItem value="2024">Exercice 2024</MenuItem>
              <MenuItem value="2025">Exercice 2025</MenuItem>
            </Select>
          </Box>
        </Stack>
      </Box>

      {/* --- ZONE DE CONFIGURATION --- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 3,
              border: '1px dashed #6366F1', bgcolor: 'rgba(99, 102, 241, 0.02)'
            }}
          >
            <CloudUploadOutlined sx={{ fontSize: 32, color: '#6366F1' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Glissez votre fichier ici ou <span style={{color:'#6366F1'}}>parcourez</span></Typography>
              <Typography variant="caption" color="textSecondary">XLSX, CSV (Max 10Mo)</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>Mode d'import</Typography>
              <Select value={importMode} onChange={(e) => setImportMode(e.target.value)} fullWidth size="small" sx={{ height: 32, fontSize: '0.8rem' }}>
                <MenuItem value="update">Mettre à jour</MenuItem>
                <MenuItem value="overwrite">Écraser</MenuItem>
              </Select>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadOutlined />} 
              fullWidth 
              size="small"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', height: 36 }}
            >
              Modèle Excel
            </Button>
            <Box>
               <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>Progression : {uploadProgress}%</Typography>
                  <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800, fontSize: '0.65rem' }}>4 Erreurs</Typography>
               </Stack>
               <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 4, borderRadius: 2 }} />
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* --- DATAGRID --- */}
      <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <Box sx={{ px: 2, py: 1, bgcolor: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.75rem' }}>APERÇU DES DONNÉES</Typography>
          <Button variant="contained" size="small" sx={{ bgcolor: '#10B981', fontWeight: 800, textTransform: 'none', px: 3 }}>
            Lancer l'import
          </Button>
        </Box>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={headerStyle}>Date</TableCell>
                <TableCell sx={headerStyle}>Journal</TableCell>
                <TableCell sx={headerStyle}>Compte</TableCell>
                <TableCell sx={headerStyle}>Libellé</TableCell>
                <TableCell sx={headerStyle}>Débit</TableCell>
                <TableCell sx={headerStyle}>Crédit</TableCell>
                <TableCell align="right" sx={headerStyle}>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { d: '01/04/26', j: 'AC', c: '401000', l: 'Orange', db: '120.00', cr: '0.00', s: 'valid' },
                { d: '01/04/26', j: 'AC', c: '626000', l: 'Frais Tél', db: '100.00', cr: '0.00', s: 'valid' },
                { d: '01/04/26', j: 'AC', c: '445660', l: 'TVA', db: '20.00', cr: '0.00', s: 'error' },
                { d: '01/04/26', j: 'BQ', c: '512000', l: 'Paiement', db: '0.00', cr: '120.00', s: 'valid' },
              ].map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.d}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 800 }}>{row.j}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366F1' }}>{row.c}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.l}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.db}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.cr}</TableCell>
                  <TableCell align="right">
                    {row.s === 'valid' ? 
                      <CheckCircleOutline sx={{ color: '#10B981', fontSize: 16 }} /> : 
                      <ErrorOutline sx={{ color: '#EF4444', fontSize: 16 }} />
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ImportJournal;