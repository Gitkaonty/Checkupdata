import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, Paper, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Chip, Divider, Breadcrumbs, Link, InputAdornment
} from '@mui/material';

import { 
  ChevronLeft, ChevronRight, AddOutlined, 
  DeleteOutline, CalendarMonthOutlined, NavigateNext,
  RocketLaunchOutlined, CalendarTodayOutlined, InfoOutlined,
  DashboardOutlined
} from '@mui/icons-material';

import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';

// --- COMPOSANT INTERNE : POPUP INITIALISATION (1er EXERCICE) ---
const InitPremierExercice = ({ open, onClose, values, setValues, onSubmit }) => {
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
              value={values.annee}
              onChange={(e) => setValues((p) => ({ ...p, annee: e.target.value }))}
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
              <TextField
                type="date"
                fullWidth
                size="small"
                value={values.date_debut}
                onChange={(e) => setValues((p) => ({ ...p, date_debut: e.target.value }))}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={labelStyle}>Date de fin</Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={values.date_fin}
                onChange={(e) => setValues((p) => ({ ...p, date_fin: e.target.value }))}
              />
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
          onClick={onSubmit}
        >
          Lancer le dossier
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const exercices = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const decoded = auth?.accessToken ? jwtDecode(auth.accessToken) : undefined;
  const compteId = decoded?.UserInfo?.compteId || null;

  const fileId = useMemo(() => {
    const raw = sessionStorage.getItem('fileId');
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
  }, []);

  const [openPeriode, setOpenPeriode] = useState(false);
  const [openInit, setOpenInit] = useState(false);
  const [openNewExercice, setOpenNewExercice] = useState(false);
  const [newExerciceType, setNewExerciceType] = useState(null); // 'NEXT' ou 'PREV'

  const [exercicesList, setExercicesList] = useState([]);
  const [selectedExerciceIndex, setSelectedExerciceIndex] = useState(0);
  const selectedExercice = exercicesList[selectedExerciceIndex] || null;

  const [periodesList, setPeriodesList] = useState([]);

  const [initValues, setInitValues] = useState({
    annee: '',
    date_debut: '',
    date_fin: '',
  });

  const [newPeriodeValues, setNewPeriodeValues] = useState({
    libelle: '',
    date_fin: '',
  });

  const formatDateFr = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const refreshExercices = async () => {
    if (!fileId) return;
    try {
      const response = await axiosPrivate.get(`/api/exercices/listeExercice/${fileId}`);
      const resData = response?.data;
      const list = Array.isArray(resData?.list) ? resData.list : [];
      setExercicesList(list);
      if (list.length === 0) {
        setSelectedExerciceIndex(0);
        setOpenInit(true);
      } else {
        setSelectedExerciceIndex(0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des exercices');
      setExercicesList([]);
    }
  };

  const refreshPeriodes = async (exerciceId) => {
    if (!exerciceId) {
      setPeriodesList([]);
      return;
    }
    try {
      const response = await axiosPrivate.get(`/api/exercices/listePeriodes/${exerciceId}`);
      const resData = response?.data;
      setPeriodesList(Array.isArray(resData?.list) ? resData.list : []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des périodes');
      setPeriodesList([]);
    }
  };

  useEffect(() => {
    refreshExercices();
  }, [fileId]);

  useEffect(() => {
    refreshPeriodes(selectedExercice?.id);
  }, [selectedExercice?.id]);

  const exerciceActuel = useMemo(() => {
    const year = selectedExercice?.date_fin ? new Date(selectedExercice.date_fin).getFullYear() : '';
    return {
      annee: year,
      debut: formatDateFr(selectedExercice?.date_debut),
      fin: formatDateFr(selectedExercice?.date_fin),
    };
  }, [selectedExercice]);

  const handleCreateFirstExercice = async () => {
    if (!compteId || !fileId) {
      toast.error('Compte ou dossier manquant');
      return;
    }
    if (!initValues.date_debut || !initValues.date_fin) {
      toast.error('Veuillez saisir les dates de début et de fin');
      return;
    }

    const payload = {
      id_compte: compteId,
      id_dossier: fileId,
      date_debut: initValues.date_debut,
      date_fin: initValues.date_fin,
    };

    try {
      const response = await axiosPrivate.post('/api/exercices/createFirstExercice', payload);
      const resData = response?.data;
      if (resData?.state) {
        toast.success('Exercice créé');
        setOpenInit(false);
        setInitValues({ annee: '', date_debut: '', date_fin: '' });
        await refreshExercices();
      } else {
        toast.error(resData?.msg || 'Création échouée');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur serveur');
    }
  };

  const handleCreateNextExercice = async () => {
    if (!compteId || !fileId) {
      toast.error('Compte ou dossier manquant');
      return;
    }

    try {
      const payload = { compteId, fileId };
      const response = await axiosPrivate.post('/api/exercices/createNextExercice', payload);
      const resData = response?.data;
      if (resData?.state) {
        toast.success('Exercice créé');
        setOpenNewExercice(false);
        setNewExerciceType(null);
        await refreshExercices();
      } else {
        toast.error(resData?.msg || 'Création échouée');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur serveur');
    }
  };

  const handleCreatePrevExercice = async () => {
    if (!compteId || !fileId) {
      toast.error('Compte ou dossier manquant');
      return;
    }

    try {
      const payload = { compteId, fileId };
      const response = await axiosPrivate.post('/api/exercices/createPreviewExercice', payload);
      const resData = response?.data;
      if (resData?.state) {
        toast.success('Exercice créé');
        setOpenNewExercice(false);
        setNewExerciceType(null);
        await refreshExercices();
      } else {
        toast.error(resData?.msg || 'Création échouée');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur serveur');
    }
  };

  const handleChevronLeft = () => {
    if (selectedExerciceIndex < exercicesList.length - 1) {
      // Un exercice existe avant (plus ancien) → défilement
      setSelectedExerciceIndex((p) => p + 1);
    } else {
      // Aucun exercice avant → créer et afficher popup
      setNewExerciceType('PREV');
      setOpenNewExercice(true);
    }
  };

  const handleChevronRight = () => {
    if (selectedExerciceIndex > 0) {
      // Un exercice existe après (plus récent) → défilement
      setSelectedExerciceIndex((p) => p - 1);
    } else {
      // Aucun exercice après → créer et afficher popup
      setNewExerciceType('NEXT');
      setOpenNewExercice(true);
    }
  };

  const handleConfirmNewExercice = () => {
    if (newExerciceType === 'NEXT') {
      handleCreateNextExercice();
    } else if (newExerciceType === 'PREV') {
      handleCreatePrevExercice();
    }
  };

  const handleCreatePeriode = async () => {
    if (!selectedExercice?.id || !compteId || !fileId) {
      toast.error('Exercice/compte/dossier manquant');
      return;
    }
    if (!newPeriodeValues.libelle.trim()) {
      toast.error('Veuillez saisir le nom de la période');
      return;
    }
    if (!newPeriodeValues.date_fin) {
      toast.error('Veuillez saisir la date de fin');
      return;
    }
    if (!selectedExercice?.date_debut) {
      toast.error("Date de début d'exercice manquante");
      return;
    }

    // Validation des dates
    const dateDebut = new Date(selectedExercice.date_debut);
    const dateFin = new Date(newPeriodeValues.date_fin);

    if (dateFin <= dateDebut) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    const payload = {
      id_exercice: selectedExercice.id,
      id_compte: compteId,
      id_dossier: fileId,
      libelle: newPeriodeValues.libelle.trim(),
      date_debut: selectedExercice.date_debut,
      date_fin: newPeriodeValues.date_fin,
    };

    try {
      const response = await axiosPrivate.post('/api/exercices/createPeriode', payload);
      const resData = response?.data;
      if (resData?.state) {
        toast.success('Période créée');
        setOpenPeriode(false);
        setNewPeriodeValues({ libelle: '', date_fin: '' });
        await refreshPeriodes(selectedExercice.id);
      } else {
        toast.error(resData?.msg || 'Création échouée');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur serveur');
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', bgcolor: '#F8FAFC' }}>
      
      {/* --- BREADCRUMBS NAVIGATION --- */}
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
          <Typography color="text.primary" sx={{ fontWeight: 600, color: '#64748B' }}>Exercices & Périodes</Typography>
        </Breadcrumbs>
      </Stack>

      {/* --- HEADER AVEC AFFICHAGE DÉTAILLÉ --- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E293B' }}>Paramètres Exercice</Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>Définissez vos périodes de saisie</Typography>
        </Box>

        {/* Navigation avec affichage Année : Début - Fin */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: '#FFF', p: 1, px: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <IconButton
            onClick={handleChevronLeft}
            disabled={exercicesList.length === 0}
            sx={{ bgcolor: '#F1F5F9' }}
          >
            <ChevronLeft />
          </IconButton>
          <Stack alignItems="center">
            <Typography sx={{ fontWeight: 900, color: '#1E293B', fontSize: '1.1rem', lineHeight: 1.2 }}>
                {exerciceActuel.annee}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                {exerciceActuel.debut} — {exerciceActuel.fin}
            </Typography>
          </Stack>
          <IconButton
            onClick={handleChevronRight}
            disabled={exercicesList.length === 0}
            sx={{ bgcolor: '#F1F5F9' }}
          >
            <ChevronRight />
          </IconButton>
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
        {periodesList.map((p) => (
          <Grid key={p.id} item xs={12} sm={6} md={4} lg={3}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography sx={{ fontWeight: 800, color: '#1E293B' }}>{p.libelle}</Typography>
                <Chip label="Ouvert" size="small" sx={{ bgcolor: '#F0FDFA', color: '#10B981', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
              </Stack>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '0.8rem' }}>
                Du {formatDateFr(p.date_debut)} au {formatDateFr(p.date_fin)}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Stack direction="row" justifyContent="flex-end">
                <IconButton size="small" sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          </Grid>
        ))}
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
              <TextField
                placeholder="Ex: Janvier, T1..."
                fullWidth
                size="small"
                value={newPeriodeValues.libelle}
                onChange={(e) => setNewPeriodeValues((p) => ({ ...p, libelle: e.target.value }))}
              />
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
              <TextField
                type="date"
                fullWidth
                size="small"
                value={newPeriodeValues.date_fin}
                onChange={(e) => setNewPeriodeValues((p) => ({ ...p, date_fin: e.target.value }))}
              />
            </Box>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenPeriode(false)} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
            Annuler
          </Button>
          <Button variant="contained" sx={{ bgcolor: '#0F172A', textTransform: 'none', px: 4, fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: '#1E293B' } }} onClick={handleCreatePeriode}>
            Valider
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- POPUP INITIALISATION (Appelé par les flèches si l'exercice n'existe pas) --- */}
      <InitPremierExercice
        open={openInit}
        onClose={() => setOpenInit(false)}
        values={initValues}
        setValues={setInitValues}
        onSubmit={handleCreateFirstExercice}
      />

      {/* --- POPUP CRÉATION NOUVEL EXERCICE (NEXT/PREV) --- */}
      <Dialog open={openNewExercice} onClose={() => setOpenNewExercice(false)} PaperProps={{ sx: { borderRadius: '20px', width: 450 } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ width: 60, height: 60, bgcolor: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <CalendarMonthOutlined sx={{ color: '#6366F1', fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B' }}>
            Créer un nouvel exercice
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
            {newExerciceType === 'NEXT' 
              ? 'Créer l\'exercice suivant automatiquement' 
              : 'Créer l\'exercice précédent automatiquement'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            {newExerciceType === 'NEXT'
              ? 'Un nouvel exercice sera créé pour l\'année suivante avec les périodes par défaut.'
              : 'Un nouvel exercice sera créé pour l\'année précédente avec les périodes par défaut.'}
          </Typography>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
              Cette action est automatique et ne peut pas être annulée.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center', gap: 1 }}>
          <Button 
            onClick={() => {
              setOpenNewExercice(false);
              setNewExerciceType(null);
            }} 
            sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}
          >
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
            onClick={handleConfirmNewExercice}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default exercices;