import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, Paper, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Chip, Divider, Breadcrumbs, Link, InputAdornment
} from '@mui/material';

import { 
  ChevronLeft, ChevronRight, AddOutlined, 
  DeleteOutline, CalendarMonthOutlined, NavigateNext,
  RocketLaunchOutlined, CalendarTodayOutlined, InfoOutlined, DashboardOutlined
} from '@mui/icons-material';

import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useParams, useNavigate } from 'react-router-dom';
import PopupTestSelectedFile from '../../components/PopupTestSelectedFile';
import ConfirmDeleteDialog from '../../components/ConfirmDeleteDialog';

// ─── Système de design (aligné sur ExportBalance / le tableau de bord) ───
const T = {
  ink: '#0E2733',
  canvas: '#F4F6F5',
  surface: '#FFFFFF',
  line: '#E2E6EA',
  ledger: '#EEF1F3',
  text: '#16202B',
  muted: '#6A7785',
  faint: '#9AA6B2',
  accent: '#0E7C86',
  accentDark: '#0a5d65',
  pos: '#1F8A70',
  warn: '#B5791A',
  neg: '#BE3A2F',
  accW: '#E2F0F1',
};
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };
const CARD_SHADOW = '0 1px 2px rgba(16,39,51,.04), 0 8px 24px -16px rgba(16,39,51,.18)';
const panelSx = {
  border: `1px solid ${T.line}`,
  borderRadius: '16px',
  bgcolor: T.surface,
  boxShadow: CARD_SHADOW,
};
const primaryBtnSx = {
  bgcolor: T.accent,
  color: '#fff',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '13px',
  borderRadius: '8px',
  boxShadow: 'none',
  '&:hover': { bgcolor: T.accentDark },
};

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
        <Box sx={{ width: 60, height: 60, bgcolor: T.accW, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
          <RocketLaunchOutlined sx={{ color: T.accent, fontSize: 32 }} />
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
            bgcolor: T.accent, 
            textTransform: 'none', 
            borderRadius: '10px', 
            px: 4, 
            fontWeight: 800,
            '&:hover': { bgcolor: T.accentDark }
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
  const compteName = decoded?.UserInfo?.compte || 'Espace Client';
  const { id } = useParams();
  const navigate = useNavigate();

  const [fileId, setFileId] = useState(0);
  const [noFile, setNoFile] = useState(false);

  useEffect(() => {
    const storedFileId = sessionStorage.getItem('fileId');
    const currentId = id || storedFileId;
    if (currentId && currentId !== '0' && currentId !== 0) {
      setFileId(Number(currentId));
      setNoFile(false);
    } else {
      setNoFile(true);
    }
  }, [id]);

  const sendToHome = () => {
    navigate('/home');
  };

  const [openPeriode, setOpenPeriode] = useState(false);
  const [deletePeriodeDialogOpen, setDeletePeriodeDialogOpen] = useState(false);
  const [periodeToDelete, setPeriodeToDelete] = useState(null);
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
      const response = await axiosPrivate.get(`/paramExercice/listeExercice/${fileId}`);
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
      const response = await axiosPrivate.get(`/paramExercice/listePeriodes/${exerciceId}`);
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
      const response = await axiosPrivate.post('/paramExercice/createFirstExercice', payload);
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
      const response = await axiosPrivate.post('/paramExercice/createNextExercice', payload);
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
      const response = await axiosPrivate.post('/paramExercice/createPreviewExercice', payload);
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
    console.log('[handleCreatePeriode] Starting...', { selectedExercice, compteId, fileId, newPeriodeValues });
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

    console.log('[handleCreatePeriode] Sending payload:', payload);

    try {
      const response = await axiosPrivate.post('/paramExercice/createPeriode', payload);
      const resData = response?.data;
      console.log('[handleCreatePeriode] Response:', resData);
      if (resData?.state) {
        toast.success('Période créée');
        setOpenPeriode(false);
        setNewPeriodeValues({ libelle: '', date_fin: '' });
        await refreshPeriodes(selectedExercice.id);
      } else {
        toast.error(resData?.msg || 'Création échouée');
      }
    } catch (err) {
      console.error('[handleCreatePeriode] Error:', err);
      toast.error('Erreur serveur');
    }
  };

  if (noFile) {
    return <PopupTestSelectedFile confirmationState={sendToHome} />;
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 120px)', width: 'calc(100vw - 130px)', bgcolor: T.canvas, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* --- EN-TÊTE --- */}
      <Box sx={{ mb: 2.5, flexShrink: 0 }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: T.faint }} />}
          sx={{ mb: 1.5, '& .MuiTypography-root, & a': { fontSize: '12.5px', fontWeight: 600 } }}
        >
          <Link underline="hover" onClick={() => navigate(`/tab/dashboard/${fileId}`)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: T.muted }}>
            <DashboardOutlined sx={{ mr: 0.5, fontSize: 16 }} /> Dashboard
          </Link>
          <Typography sx={{ color: T.ink, fontWeight: 700 }}>Exercices &amp; périodes</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 38, height: 38, flex: 'none', borderRadius: '11px', display: 'grid', placeItems: 'center', color: T.accent, bgcolor: `${T.accent}14`, '& svg': { fontSize: 20 } }}>
              <CalendarMonthOutlined />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.ink, letterSpacing: '.2px', lineHeight: 1.2 }}>
                Exercices &amp; périodes
              </Typography>
              <Typography sx={{ fontSize: '12px', color: T.muted, mt: 0.2 }}>
                Définissez vos exercices et périodes de saisie · {compteName}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {/* Navigation exercice : Année · Début — Fin */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ...panelSx, p: 0.75, px: 1.25, borderRadius: '10px' }}>
              <IconButton onClick={handleChevronLeft} disabled={exercicesList.length === 0} size="small" sx={{ bgcolor: T.ledger, color: T.accent, '&:hover': { bgcolor: T.accW } }}>
                <ChevronLeft fontSize="small" />
              </IconButton>
              <Stack alignItems="center" sx={{ minWidth: 130 }}>
                <Typography sx={{ ...NUM, fontWeight: 800, color: T.ink, fontSize: '17px', lineHeight: 1.1 }}>
                  {exerciceActuel.annee || '—'}
                </Typography>
                <Typography sx={{ ...NUM, color: T.muted, fontWeight: 600, fontSize: '11px' }}>
                  {exerciceActuel.debut} — {exerciceActuel.fin}
                </Typography>
              </Stack>
              <IconButton onClick={handleChevronRight} disabled={exercicesList.length === 0} size="small" sx={{ bgcolor: T.ledger, color: T.accent, '&:hover': { bgcolor: T.accW } }}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </Stack>

            <Button
              variant="contained"
              disableElevation
              startIcon={<AddOutlined />}
              onClick={() => setOpenPeriode(true)}
              disabled={!selectedExercice}
              sx={{ ...primaryBtnSx, px: 3, height: 40 }}
            >
              Créer une période
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* --- GRILLE DES PÉRIODES (défilante) --- */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        {periodesList.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%', textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '16px', display: 'grid', placeItems: 'center', color: T.faint, bgcolor: T.ledger }}>
              <CalendarMonthOutlined sx={{ fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: T.muted }}>Aucune période définie</Typography>
            <Typography sx={{ fontSize: '12.5px', color: T.faint, maxWidth: 340 }}>
              Créez une période (mois, trimestre…) pour cet exercice via le bouton « Créer une période ».
            </Typography>
          </Stack>
        ) : (
          <Grid container spacing={2}>
            {periodesList.map((p) => (
              <Grid key={p.id} item xs={12} sm={6} md={4} lg={3}>
                <Paper elevation={0} sx={{ ...panelSx, p: 2, transition: 'transform .15s, box-shadow .15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 24px -14px rgba(16,39,51,.28)' } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography sx={{ fontWeight: 700, color: T.ink, fontSize: '14px' }}>{p.libelle}</Typography>
                    <Chip label="Ouvert" size="small" sx={{ bgcolor: T.accW, color: T.pos, fontWeight: 700, fontSize: '10px', height: 20 }} />
                  </Stack>
                  <Typography sx={{ ...NUM, color: T.muted, mb: 1.5, fontSize: '12px' }}>
                    Du {formatDateFr(p.date_debut)} au {formatDateFr(p.date_fin)}
                  </Typography>
                  <Divider sx={{ mb: 1, borderColor: T.ledger }} />
                  <Stack direction="row" justifyContent="flex-end">
                    <IconButton size="small" sx={{ color: T.neg, '&:hover': { bgcolor: T.negW || '#F7E7E4' } }} onClick={() => { setPeriodeToDelete(p.id); setDeletePeriodeDialogOpen(true); }}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* --- POPUP SUPPRESSION DE PÉRIODE --- */}
      <ConfirmDeleteDialog
        open={deletePeriodeDialogOpen}
        onClose={() => { setDeletePeriodeDialogOpen(false); setPeriodeToDelete(null); }}
        onConfirm={async () => {
          if (!periodeToDelete) return;
          try {
            const response = await axiosPrivate.post('/paramExercice/deletePeriode', { id_periode: periodeToDelete });
            const resData = response?.data;
            if (resData?.state) {
              toast.success('Période supprimée');
              await refreshPeriodes(selectedExercice?.id);
            } else {
              toast.error(resData?.msg || 'Erreur lors de la suppression');
            }
          } catch (err) {
            console.error(err);
            toast.error('Erreur serveur');
          } finally {
            setDeletePeriodeDialogOpen(false);
            setPeriodeToDelete(null);
          }
        }}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette période ? Cette action est irréversible."
      />

      {/* --- POPUP CRÉATION DE PÉRIODE --- */}
      <Dialog open={openPeriode} onClose={() => setOpenPeriode(false)} PaperProps={{ sx: { borderRadius: '16px', width: 400 } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthOutlined sx={{ color: T.accent }} /> Nouvelle Période
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
          <Button variant="contained" sx={{ bgcolor: T.accentDark, textTransform: 'none', px: 4, fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: T.accent } }} onClick={handleCreatePeriode}>
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
          <Box sx={{ width: 60, height: 60, bgcolor: T.accW, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <CalendarMonthOutlined sx={{ color: T.accent, fontSize: 32 }} />
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
              bgcolor: T.accent, 
              textTransform: 'none', 
              borderRadius: '10px', 
              px: 4, 
              fontWeight: 800,
              '&:hover': { bgcolor: T.accentDark }
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