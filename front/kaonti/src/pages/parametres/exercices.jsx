import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, Paper, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Chip, Divider, Breadcrumbs, Link, InputAdornment
} from '@mui/material';
import { 
  ChevronLeft, ChevronRight, AddOutlined, 
  DeleteOutline, CalendarMonthOutlined, NavigateNext,
  RocketLaunchOutlined, CalendarTodayOutlined, InfoOutlined,
  SettingsOutlined
} from '@mui/icons-material';

// --- COMPOSANT INTERNE : POPUP INITIALISATION (1er EXERCICE) ---
const InitPremierExercice = ({ open, onClose }) => {
  const labelStyle = { 
    display: 'block', 
    mb: 0.8, 
    fontWeight: 700, 
    color: '#64748B', 
    textTransform: 'uppercase', 
    fontSize: '0.65rem' 
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '20px', width: 450, p: 1 } }}>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Box sx={{ width: 60, height: 60, bgcolor: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
          <RocketLaunchOutlined sx={{ color: '#6366F1', fontSize: 32 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B' }}>Initialisation du Dossier</Typography>
        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>Configurez votre tout premier exercice comptable</Typography>
      </DialogTitle>

      <DialogContent sx={{ overflowY: 'visible' }}>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          
          {/* NOM EXERCICE */}
          <Box>
            <Typography variant="caption" sx={labelStyle}>Nom de l'exercice (Année)</Typography>
            <TextField
              placeholder="Ex: 2025"
              fullWidth
              size="small"
              InputProps={{ 
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayOutlined sx={{ fontSize: 18, color: '#94A3B8' }} />
                  </InputAdornment>
                ) 
              }}
            />
          </Box>

          {/* DATES DÉBUT ET FIN */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={labelStyle}>Date de début</Typography>
              <TextField type="date" fullWidth size="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={labelStyle}>Date de fin</Typography>
              <TextField type="date" fullWidth size="small" />
            </Box>
          </Stack>

          {/* INFO BOX */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: 1.5 }}>
            <InfoOutlined sx={{ color: '#64748B', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4 }}>
              <strong>Note :</strong> Une fois créé, vous pourrez définir vos périodes (mois, trimestres) manuellement.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}>
          Annuler
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: '#1E293B', 
            textTransform: 'none', 
            borderRadius: '10px', 
            px: 4, 
            fontWeight: 800,
            '&:hover': { bgcolor: '#0F172A' }
          }}
        >
          Lancer le dossier
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const exercices = () => {
  const [openPeriode, setOpenPeriode] = useState(false);
  const [openInit, setOpenInit] = useState(false);
  
  const exerciceActuel = {
    annee: 2025,
    debut: "01/01/2025",
    fin: "31/12/2025"
  };

  return (
    <Box sx={{ p: 3, height: '100%', bgcolor: '#F8FAFC' }}>
      
      {/* --- BREADCRUMBS NAVIGATION --- */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '0.75rem', fontWeight: 600 } }}
      >
        <Link underline="hover" color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Paramètres
        </Link>
        <Typography color="text.primary">Exercices & Périodes</Typography>
      </Breadcrumbs>

      {/* --- HEADER AVEC AFFICHAGE DÉTAILLÉ --- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Paramètres Exercice</Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>Définissez vos périodes de saisie</Typography>
        </Box>

        {/* Navigation avec affichage Année : Début - Fin */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: '#FFF', p: 1, px: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <IconButton onClick={() => setOpenInit(true)} sx={{ bgcolor: '#F1F5F9' }}><ChevronLeft /></IconButton>
          <Stack alignItems="center">
            <Typography sx={{ fontWeight: 900, color: '#1E293B', fontSize: '1.1rem', lineHeight: 1.2 }}>
                {exerciceActuel.annee}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                {exerciceActuel.debut} — {exerciceActuel.fin}
            </Typography>
          </Stack>
          <IconButton onClick={() => setOpenInit(true)} sx={{ bgcolor: '#F1F5F9' }}><ChevronRight /></IconButton>
        </Stack>

        <Button 
          variant="contained" 
          startIcon={<AddOutlined />}
          onClick={() => setOpenPeriode(true)}
          sx={{ bgcolor: '#1E293B', textTransform: 'none', borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#000' } }}
        >
          Créer une période
        </Button>
      </Stack>

      {/* --- GRILLE DES PÉRIODES PERSONNALISÉES --- */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography sx={{ fontWeight: 800, color: '#1E293B' }}>Janvier {exerciceActuel.annee}</Typography>
              <Chip label="Ouvert" size="small" sx={{ bgcolor: '#F0FDFA', color: '#10B981', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
            </Stack>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '0.8rem' }}>Du 01/01/2025 au 31/01/2025</Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" justifyContent="flex-end">
                <IconButton size="small" sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}><DeleteOutline fontSize="small" /></IconButton>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* --- POPUP CRÉATION DE PÉRIODE --- */}
      <Dialog open={openPeriode} onClose={() => setOpenPeriode(false)} PaperProps={{ sx: { borderRadius: '16px', width: 400 } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthOutlined sx={{ color: '#6366F1' }} /> Nouvelle Période
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            
            {/* CHAMP : NOM */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Nom de la période
              </Typography>
              <TextField placeholder="Ex: Janvier, T1..." fullWidth size="small" />
            </Box>

            {/* CHAMP : DÉBUT */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Date de début
              </Typography>
              <TextField 
                value={exerciceActuel.debut} 
                disabled 
                fullWidth 
                size="small" 
                helperText="Liée à l'ouverture de l'exercice." 
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } }}
              />
            </Box>

            {/* CHAMP : FIN */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Date de fin
              </Typography>
              <TextField type="date" fullWidth size="small" />
            </Box>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenPeriode(false)} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
            Annuler
          </Button>
          <Button variant="contained" sx={{ bgcolor: '#0F172A', textTransform: 'none', px: 4, fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: '#1E293B' } }}>
            Valider
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- POPUP INITIALISATION (Appelé par les flèches si l'exercice n'existe pas) --- */}
      <InitPremierExercice open={openInit} onClose={() => setOpenInit(false)} />

    </Box>
  );
};

export default exercices;