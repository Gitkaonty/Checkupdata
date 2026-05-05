import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Divider, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, TextField, Tooltip, Paper, Chip, Tabs, Tab
} from '@mui/material';

import {
  CheckCircleOutline, ChatBubbleOutline, ChevronLeft, ChevronRight,
  ErrorOutline, PeopleOutline, ShoppingCartOutlined
} from '@mui/icons-material';

import { Cancel, CheckCircle, Search } from '@mui/icons-material';
import CommentIcon from '@mui/icons-material/Comment';
import { DataGrid } from '@mui/x-data-grid';
import axios from '../../../config/axios';

import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import ExercicePeriodeSelector from '../ExercicePeriodeSelector';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';
import CommentDialog from '../../components/commetDialog';

// Format date as dd-mm-yy
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const ANOMALIE_TYPES = {
  paiement_sans_facture: {
    label: 'Paiement sans facture',
    color: 'warning',
    description: 'Le paiement a été effectué sans qu’une facture soit enregistrée.'
  },
  facture_3mois_non_reglee: {
    label: 'Factures > 3 mois non réglées',
    color: 'error',
    description: 'Cette facture n’a pas été réglée depuis plus de 3 mois.'
  },
  ajustement_non_traite: {
    label: 'Ajustements non traité',
    color: 'info',
    description: 'Certains ajustements comptables n’ont pas encore été traités.'
  },
  solde_suspens: {
    label: 'Solde en suspens',
    color: 'default',
    description: 'Le compte présente un solde en suspens à vérifier.'
  }
};

const AnalyseTiers = ({ id_exercice, id_periode }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  // Utiliser le contexte global pour exercice et période
  const {
    selectedExerciceId,
    selectedPeriodeId,
    selectedPeriodeDates,
    listePeriodes,
    currentExerciceDates,
    handleChangeExercice,
    handleChangePeriode,
    loading: contextLoading,
    getApiParams
  } = useExercicePeriode();

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const [activeTab, setActiveTab] = useState(0);

  const [openConfirmValidationDialog, setOpenConfirmValidationDialog] = useState(false);
  const [pendingValidation, setPendingValidation] = useState(null);

  const [fileInfos, setFileInfos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noFile, setNoFile] = useState(false);
  const [fileId, setFileId] = useState(0);

  // === Résultats séparés par onglet ===
  const [resultatsFournisseur, setResultatsFournisseur] = useState([]);
  const [resultatsClient, setResultatsClient] = useState([]);
  const [selectedCompte, setSelectedCompte] = useState(null);

  // === Dialog validation ===
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);
  const [validationCommentaire, setValidationCommentaire] = useState('');

  // === Dialog commentaire ===
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [selectedCommentAnomalie, setSelectedCommentAnomalie] = useState(null);
  const [commentaireText, setCommentaireText] = useState('');

  // === Dialog confirmation analyse ===

  const [periodeErrorPopup, setPeriodeErrorPopup] = useState({ open: false, message: '' });

  const handleOpenCommentDialog = (anomalie, sourceType) => {
    setSelectedCommentAnomalie({
      ...anomalie,
      sourceType
    });
    setCommentaireText(anomalie?.commentaire_validation || '');
    setOpenCommentDialog(true);
  };

  const handleCloseCommentDialog = () => {
    setOpenCommentDialog(false);
    setSelectedCommentAnomalie(null);
    setCommentaireText('');
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const effectiveExerciceId = id_exercice ?? selectedExerciceId;
  const effectivePeriodeId = id_periode ?? selectedPeriodeId;

  const handleAnalyserClick = () => {
    if (!effectivePeriodeId || effectivePeriodeId === 'exercice') {
      setPeriodeErrorPopup({
        open: true,
        message: 'Veuillez sélectionner une période spécifique avant de lancer l\'analyse.'
      });
      return;
    }
    setOpenConfirmDialog(true);
  };

  const handleConfirmAnalyser = async () => {
    setOpenConfirmDialog(false);
    await handleAnalyser();
  };

  const handleRequestValidationChange = (anomalie, valider) => {
    setPendingValidation({ anomalie, valider });
    setOpenConfirmValidationDialog(true);
  };

  const handleCloseConfirmValidationDialog = () => {
    setOpenConfirmValidationDialog(false);
    setPendingValidation(null);
  };

  const handleConfirmValidationChange = async () => {
    if (!pendingValidation?.anomalie) return;
    setOpenConfirmValidationDialog(false);
    const { anomalie, valider } = pendingValidation;
    setPendingValidation(null);
    await handleValiderAnomalie(anomalie, valider);
  };

  const getIds = () => {
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf('revisionFournisseurClient') + 1;
    return {
      id_compte: parseInt(sessionStorage.getItem('compteId')) || 1,
      id_dossier: parseInt(sessionStorage.getItem('fileId')) || parseInt(pathParts[idIndex]) || 1,
      id_exercice: effectiveExerciceId || parseInt(sessionStorage.getItem('exerciceId')) || 1
    };
  };

  const fetchDossierInfos = async () => {
    try {
      const { id_dossier } = getIds();
      const response = await axiosPrivate.get(`/home/FileInfos/${id_dossier}`);
      const resData = response.data;
      if (resData.state && resData.fileInfos && resData.fileInfos.length > 0) {
        setFileInfos(resData.fileInfos[0]);
      }
    } catch (error) {
      console.error('Error fetching dossier infos:', error);
    }
  };

  useEffect(() => {
    fetchDossierInfos();
  }, []);

  const getApiBasePath = (type) => {
    return type === 'fournisseur'
      ? '/administration/analyseFournisseurClient'
      : '/administration/analyseClient';
  };

  const resolveDatesForAnalysis = async () => {
    if (selectedPeriodeDates?.date_debut && selectedPeriodeDates?.date_fin) {
      return {
        date_debut: selectedPeriodeDates.date_debut,
        date_fin: selectedPeriodeDates.date_fin
      };
    }

    if (effectivePeriodeId && effectivePeriodeId !== 'exercice') {
      const periodeFromContext = (listePeriodes || []).find(p => String(p.id) === String(effectivePeriodeId));
      if (periodeFromContext?.date_debut && periodeFromContext?.date_fin) {
        return {
          date_debut: periodeFromContext.date_debut,
          date_fin: periodeFromContext.date_fin
        };
      }

      if (effectiveExerciceId) {
        const response = await axios.get(`/paramExercice/listePeriodes/${effectiveExerciceId}`);
        if (response?.data?.state) {
          const periode = (response.data.list || []).find(p => String(p.id) === String(effectivePeriodeId));
          if (periode?.date_debut && periode?.date_fin) {
            return {
              date_debut: periode.date_debut,
              date_fin: periode.date_fin
            };
          }
        }
      }
    }

    if (currentExerciceDates?.date_debut && currentExerciceDates?.date_fin) {
      return {
        date_debut: currentExerciceDates.date_debut,
        date_fin: currentExerciceDates.date_fin
      };
    }

    return null;
  };

  const lastContextKeyRef = useRef('');
  const handleAnalyserRef = useRef();

  const handleAnalyser = async () => {
    if (!effectiveExerciceId) return;

    setLoading(true);
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();

      const resolvedDates = await resolveDatesForAnalysis();
      if (!resolvedDates?.date_debut || !resolvedDates?.date_fin) {
        setPeriodeErrorPopup({
          open: true,
          message: 'Dates de période introuvables. Veuillez re-sélectionner la période avant de lancer l\'analyse.'
        });
        return;
      }

      const params = new URLSearchParams();
      params.append('date_debut', resolvedDates.date_debut);
      params.append('date_fin', resolvedDates.date_fin);
      if (effectivePeriodeId) {
        params.append('id_periode', effectivePeriodeId);
      }
      const queryString = params.toString();

      const [fournisseurResponse, clientResponse] = await Promise.all([
        axiosPrivate.post(`/administration/analyseFournisseurClient/${id_compte}/${id_dossier}/${id_exercice}/analyser?${queryString}`),
        axiosPrivate.post(`/administration/analyseClient/${id_compte}/${id_dossier}/${id_exercice}/analyser?${queryString}`)
      ]);

      if (fournisseurResponse.data.state) {
        setResultatsFournisseur(fournisseurResponse.data.resultats || []);
      } else {
        setResultatsFournisseur([]);
      }

      if (clientResponse.data.state) {
        setResultatsClient(clientResponse.data.resultats || []);
      } else {
        setResultatsClient([]);
      }
    } catch (error) {
      console.error('Error executing analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  handleAnalyserRef.current = handleAnalyser;

  useEffect(() => {
    const contextKey = `${effectiveExerciceId}-${effectivePeriodeId}`;
    const contextChanged = contextKey !== lastContextKeyRef.current;

    if (effectiveExerciceId && contextChanged) {
      lastContextKeyRef.current = contextKey;
      handleAnalyserRef.current();
    }
  }, [effectiveExerciceId, effectivePeriodeId]);

  const handleValiderAnomalie = async (anomalie, valider) => {
    if (!anomalie || !anomalie.id) {
      console.error('Anomalie ID is undefined');
      return;
    }
    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const basePath = getApiBasePath(anomalie.sourceType);
      const url = `${basePath}/${id_compte}/${id_dossier}/${id_exercice}/anomalies/${anomalie.id}`;

      await axiosPrivate.patch(url, {
        valider,
        commentaire_validation: anomalie.commentaire_validation || ''
      });

      const updateResultats = (prev) => prev.map(compte => ({
        ...compte,
        lignes: compte.lignes.map(ligne => ({
          ...ligne,
          anomalies: ligne.anomalies.map(a =>
            a.id === anomalie.id
              ? { ...a, valider }
              : a
          )
        }))
      }));

      if (anomalie.sourceType === 'fournisseur') {
        setResultatsFournisseur(prevState => updateResultats(prevState));
      } else {
        setResultatsClient(prevState => updateResultats(prevState));
      }
    } catch (error) {
      console.error('Error validating anomaly:', error);
    }
  };

  const handleSaveComment = async (nextComment) => {
    try {
      if (!selectedCommentAnomalie) return;

      const commentToSave = typeof nextComment === 'string' ? nextComment : commentaireText;

      const { id_compte, id_dossier, id_exercice } = getIds();
      const basePath = getApiBasePath(selectedCommentAnomalie.sourceType);
      const url = `${basePath}/${id_compte}/${id_dossier}/${id_exercice}/anomalies/${selectedCommentAnomalie.id}`;

      await axiosPrivate.patch(url, {
        valider: selectedCommentAnomalie.valider,
        commentaire_validation: commentToSave
      });

      const updateResultats = (prev) => prev.map(compte => ({
        ...compte,
        lignes: compte.lignes.map(ligne => ({
          ...ligne,
          anomalies: ligne.anomalies.map(a =>
            a.id === selectedCommentAnomalie.id
              ? { ...a, commentaire_validation: commentToSave }
              : a
          )
        }))
      }));

      if (selectedCommentAnomalie.sourceType === 'fournisseur') {
        setResultatsFournisseur(prevState => updateResultats(prevState));
      } else {
        setResultatsClient(prevState => updateResultats(prevState));
      }

      handleCloseCommentDialog();
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const flattenResultatsToRows = (res) => {
    const flatRows = [];
    res.forEach((compte, compteIdx) => {
      (compte.lignes || []).forEach((ligne, ligneIdx) => {
        (ligne.anomalies || []).forEach((anomalie, anomalieIdx) => {
          flatRows.push({
            id: `${compteIdx}-${ligneIdx}-${anomalieIdx}`,
            compte: compte.compte,
            id_ligne: ligne.id_ligne_originale || ligne.id,
            date_ecriture: ligne.date_ecriture,
            piece: ligne.piece,
            libelle: ligne.libelle,
            debit: ligne.debit,
            credit: ligne.credit,
            lettrage: ligne.lettrage,
            code_journal: ligne.code_journal,
            type_anomalie: anomalie.type,
            commentaire: anomalie.commentaire,
            commentaire_validation: anomalie.commentaire_validation,
            valider: anomalie.valider,
            anomalie_id: anomalie.id,
          });
        });
      });
    });
    return flatRows;
  };

  const rowsFournisseur = useMemo(
    () => flattenResultatsToRows(resultatsFournisseur),
    [resultatsFournisseur]
  );

  const rowsClient = useMemo(
    () => flattenResultatsToRows(resultatsClient),
    [resultatsClient]
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <ConfirmActionDialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmAnalyser}
        title="Lancer l'analyse"
        message="Voulez-vous lancer l'analyse des fournisseurs et clients ?"
        confirmText="Lancer"
        cancelText="Annuler"
        loading={loading}
        color="#06b6d4"
      />

      <CommentDialog
        open={openCommentDialog}
        onClose={handleCloseCommentDialog}
        onSave={(value) => {
          setCommentaireText(value);
          return handleSaveComment(value);
        }}
        initialValue={commentaireText}
        title="Ajouter un commentaire"
        placeholder="Saisissez votre note ici..."
        loading={loading}
      />

      <ConfirmActionDialog
        open={openConfirmValidationDialog}
        onClose={handleCloseConfirmValidationDialog}
        onConfirm={handleConfirmValidationChange}
        title={pendingValidation?.valider ? 'Validation' : 'Annulation de validation'}
        message={pendingValidation?.valider
          ? 'Voulez-vous valider cette anomalie ?'
          : 'Voulez-vous annuler la validation de cette anomalie ?'
        }
        confirmText={pendingValidation?.valider ? 'Valider' : 'Annuler la validation'}
        cancelText="Annuler"
        loading={loading}
        color={pendingValidation?.valider ? '#06b6d4' : '#EF4444'}
      />

      {/* --- RÉCAPITULATIF GLOBAL --- */}
      <Stack direction="row" spacing={3} sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ANOMALIES TIERS</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 900, lineHeight: 1 }}>{rowsFournisseur.length + rowsClient.length}</Typography>
            <ErrorOutline sx={{ color: '#EF4444', fontSize: 18 }} />
          </Stack>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>RESTANT À VALIDER</Typography>
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>
            {rowsFournisseur.filter(r => !r.valider).length + rowsClient.filter(r => !r.valider).length}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          {/* <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>.</Typography> */}
          {/* <br /> */}
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleAnalyserClick}
            disabled={!effectiveExerciceId || loading}
            sx={{
              height: '25px',
              bgcolor: '#064E3B',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              borderRadius: '8px'
            }}
          >
            {loading ? 'Analyse...' : 'Analyser'}
          </Button>
        </Box>

      </Stack>

      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 42,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, minHeight: 42 },
              '& .MuiTab-root.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.10)' },
              '& .MuiTab-root:first-of-type.Mui-selected': { borderTopLeftRadius: '12px' },
              '& .MuiTab-root:last-of-type.Mui-selected': { borderTopRightRadius: '12px' },
              '& .MuiTabs-indicator': { bgcolor: '#064E3B', height: 3 }
            }}
          >
            <Tab label={`Fournisseurs`} />
            <Tab label={`Clients`} />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <SectionTiersUnique
            title="Analyse Fournisseurs"
            icon={<ShoppingCartOutlined sx={{ color: '#3B82F6' }} />}
            stats={{
              anomalies: rowsFournisseur.length,
              restants: rowsFournisseur.filter(r => !r.valider).length,
            }}
            rows={rowsFournisseur}
            type="fournisseur"
            handleValiderAnomalie={handleValiderAnomalie}
            handleRequestValidationChange={handleRequestValidationChange}
            handleOpenCommentDialog={handleOpenCommentDialog}
          />
        )}

        {activeTab === 1 && (
          <SectionTiersUnique
            title="Analyse Clients"
            icon={<PeopleOutline sx={{ color: '#10B981' }} />}
            stats={{
              anomalies: rowsClient.length,
              restants: rowsClient.filter(r => !r.valider).length,
            }}
            rows={rowsClient}
            type="client"
            handleValiderAnomalie={handleValiderAnomalie}
            handleRequestValidationChange={handleRequestValidationChange}
            handleOpenCommentDialog={handleOpenCommentDialog}
          />
        )}

      </Box>
    </Box>
  );
};

// --- COMPOSANT DE SECTION UNIQUE (SANS ONGLETS) ---
const SectionTiersUnique = ({ title, icon, stats, rows, type, handleValiderAnomalie, handleRequestValidationChange, handleOpenCommentDialog }) => {

  const [selectedCompte, setSelectedCompte] = useState(null);

  const comptesOptions = useMemo(() => {
    const unique = Array.from(new Set((rows || []).map(r => r.compte).filter(Boolean))).sort();
    return unique;
  }, [rows]);

  const compteIndex = useMemo(() => {
    if (!selectedCompte) return -1;
    return (comptesOptions || []).findIndex(c => c === selectedCompte);
  }, [comptesOptions, selectedCompte]);

  const handlePrevCompte = () => {
    if (!comptesOptions?.length) return;
    if (compteIndex <= 0) return;
    setSelectedCompte(comptesOptions[compteIndex - 1]);
  };

  const handleNextCompte = () => {
    if (!comptesOptions?.length) return;
    if (compteIndex === -1) {
      setSelectedCompte(comptesOptions[0]);
      return;
    }
    if (compteIndex >= comptesOptions.length - 1) return;
    setSelectedCompte(comptesOptions[compteIndex + 1]);
  };

  const filteredRows = useMemo(() => {
    if (!selectedCompte) return rows;
    return (rows || []).filter(r => r.compte === selectedCompte);
  }, [rows, selectedCompte]);

  // Fonction pour styliser les labels d'anomalies
  const renderAnomalieLabel = (type) => {
    const config = {
      "Solde en suspens": { color: "#EF4444", bg: "#FEF2F2" },
      "Paiement sans facture": { color: "#F59E0B", bg: "#FFFBEB" },
      "Ajustement non traité": { color: "#6366F1", bg: "#EEF2FF" },
      "Facture non réglée": { color: "#64748B", bg: "#F8FAFC" }
    };
    const style = config[type] || config["Facture non réglée"];
    return (
      <Chip
        label={type}
        size="small"
        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.65rem', borderRadius: '4px' }}
      />
    );
  };

  const columns = [
    {
      field: 'compte',
      headerName: 'Compte',
      width: 90,
      cellClassName: 'font-bold',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'date_ecriture',
      headerName: 'Date',
      width: 100,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: 'code_journal',
      headerName: 'Jour.',
      width: 60
    },
    {
      field: 'piece',
      headerName: 'Pièce',
      width: 110
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      width: 350
    },
    {
      field: 'debit',
      headerName: 'Débit',
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => params.value ? Number(params.value).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '',

    },
    {
      field: 'credit',
      headerName: 'Crédit',
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => params.value ? Number(params.value).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '',

    },
    {
      field: 'lettrage',
      headerName: 'Let.',
      width: 50,
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value || '-'}
          size="small"
          variant={params.value ? "filled" : "outlined"}
          color={params.value ? "success" : "default"}
        />
      ),
    },
    {
      field: 'type_anomalie',
      headerName: 'Type d\'anomalie',
      width: 180,
      renderCell: (params) => {
        const config = ANOMALIE_TYPES[params.value] || { label: params.value, color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" />;
      },
    },
    {
      field: 'commentaire_validation',
      headerName: 'Commentaire',
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontStyle: params.value ? 'normal' : 'italic', color: params.value ? 'inherit' : '#999' }}>
          {params.value || ' '}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title={params.row.valider ? "Annuler la validation" : "Valider"}>
            <IconButton
              size="small"
              color={params.row.valider ? "error" : "success"}
              onClick={() => handleRequestValidationChange({
                id: params.row.anomalie_id,
                valider: params.row.valider,
                commentaire_validation: params.row.commentaire_validation,
                sourceType: type
              }, !params.row.valider)}
            >
              {params.row.valider ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Ajouter/Modifier commentaire">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenCommentDialog({
                id: params.row.anomalie_id,
                valider: params.row.valider,
                commentaire_validation: params.row.commentaire_validation
              }, type)}
            >
              <CommentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      {/* Header de Section avec stats */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>{title}</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip label={`${stats.anomalies} anomalies`} size="small" sx={{ height: 20, bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 800, fontSize: '0.6rem' }} />
          <Chip label={`${stats.restants} à valider`} size="small" sx={{ height: 20, bgcolor: '#FFFBEB', color: '#F59E0B', fontWeight: 800, fontSize: '0.6rem' }} />
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        {/* Navigateur de compte intégré */}
        <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Autocomplete
            size="small"
            options={comptesOptions}
            value={selectedCompte}
            onChange={(e, value) => setSelectedCompte(value)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Navigateur de compte..." sx={{ width: 250, '& .MuiInputBase-root': { fontSize: '0.75rem', height: 30, bgcolor: '#FFF' } }} />
            )}
          />
          <IconButton
            size="small"
            onClick={handlePrevCompte}
            disabled={compteIndex <= 0}
            sx={{ border: '1px solid #E2E8F0', bgcolor: '#FFF' }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleNextCompte}
            disabled={!comptesOptions?.length || compteIndex >= comptesOptions.length - 1}
            sx={{ border: '1px solid #E2E8F0', bgcolor: '#FFF' }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>

        {/* Tableau Unique */}
        <Box sx={{ height: 350, width: '100%' }}>
          <DataGrid
            rows={filteredRows || []}
            columns={columns}
            density="compact"
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', color: '#64748B', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' },
              '& .MuiDataGrid-cell': { fontSize: '0.8rem', borderBottom: '1px solid #F1F5F9' },
              '& .font-bold': { fontWeight: 700 }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AnalyseTiers;