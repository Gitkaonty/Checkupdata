import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Paper,
  IconButton,
  alpha,
  Badge,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Breadcrumbs,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircleOutline,
  ChatBubbleOutline,
  CheckCircle,
  Cancel,
  ErrorOutline,
  WarningAmberRounded,
  RadioButtonUnchecked,
  TaskAltRounded,
  ChatBubbleOutlineOutlined,
  Search
} from '@mui/icons-material';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';
import { useExercicePeriode } from '../../context/ExercicePeriodeContext';
import CommentDialog from '../../components/commetDialog';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';
import CommentIcon from '@mui/icons-material/Comment';

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

// ─── Système de design (aligné sur le tableau de bord) ───
const T = {
  ink: '#0E2733', canvas: '#F4F6F5', surface: '#FFFFFF', line: '#E2E6EA', ledger: '#EEF1F3',
  text: '#16202B', muted: '#6A7785', faint: '#9AA6B2',
  accent: '#0E7C86', pos: '#1F8A70', warn: '#B5791A', neg: '#BE3A2F', info: '#3A6EA5', accW: '#E2F0F1',
};
const NUM = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };
// Formatage monétaire : séparateur de milliers TOUJOURS visible
// (fr-FR produit une espace fine insécable U+202F souvent invisible → espace normale)
const fmtMoney = (value) =>
  (Number(value) || 0)
    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/\s/g, ' ');
// Tableau natif (MUI Table) : en-tête ET colonnes figés simultanément (le DataGrid
// Community ne sait pas figer l'en-tête des colonnes épinglées — il le déplace par transform).
// Largeurs fixes → offsets d'épinglage exacts. Gauche : compte(100)+libellé(300).
// Droite : anomalies(80)/validé(70)/commentaire(200) → offsets 270/200/0.
const w = (px) => ({ width: px, minWidth: px, maxWidth: px });
const HEADSX = {
  bgcolor: T.ledger, color: T.muted, fontWeight: 700, fontSize: '11px',
  letterSpacing: '.3px', textTransform: 'uppercase', borderBottom: `1px solid ${T.line}`,
  whiteSpace: 'nowrap', py: 1,
};
const CELLSX = { fontSize: '12.5px', color: T.text, borderBottom: '1px solid #F1F4F6', py: 0.5, whiteSpace: 'nowrap' };
// z-index : corps normal 0 < corps épinglé 2 < en-tête normal 3 < coin épinglé 4
const headNormalSx = { ...HEADSX, position: 'sticky', top: 0, zIndex: 3 };
const headPinSx = (side, off, shadow) => ({ ...HEADSX, position: 'sticky', top: 0, [side]: off, zIndex: 4, ...(shadow ? { boxShadow: shadow } : {}) });
const cellPinSx = (side, off, shadow) => ({ ...CELLSX, position: 'sticky', [side]: off, zIndex: 2, bgcolor: 'inherit', ...(shadow ? { boxShadow: shadow } : {}) });
const SH_L = '6px 0 6px -6px rgba(16,39,51,.25)';
const SH_R = '-6px 0 6px -6px rgba(16,39,51,.25)';
const MoneyCell = ({ value, bold }) => {
  const v = Number(value) || 0;
  return (
    <Typography sx={{ ...NUM, fontSize: '12.5px', width: '100%', textAlign: 'right', color: v < 0 ? T.neg : T.text, fontWeight: bold ? 800 : (v !== 0 ? 600 : 400) }}>
      {fmtMoney(value)}
    </Typography>
  );
};

// Filtre déroulant compact (Tous / Oui / Non) pour les colonnes booléennes
const FilterSelect = ({ label, value, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 148 }}>
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      renderValue={(v) => `${label} : ${v === 'all' ? 'Tous' : v === 'oui' ? 'Oui' : 'Non'}`}
      sx={{ borderRadius: '10px', bgcolor: T.canvas, fontSize: '13px', '& .MuiSelect-select': { py: 0.9 } }}
    >
      <MenuItem value="all">Tous</MenuItem>
      <MenuItem value="oui">Oui</MenuItem>
      <MenuItem value="non">Non</MenuItem>
    </Select>
  </FormControl>
);

const RevueMensuelleTable = forwardRef(function RevueMensuelleTable({ id_exercice: id_exercice_prop, id_periode: id_periode_prop }, ref) {
  const NAV_DARK = '#0B1120';
  const BG_SOFT = '#F8FAFC';
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { id_compte, id_dossier } = useParams();
  const [searchParams] = useSearchParams();

  const id_compte_val = parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(id_compte) || parseInt(sessionStorage.getItem('compteId')) || 1;
  const id_dossier_val = parseInt(id_dossier) || parseInt(sessionStorage.getItem('fileId')) || 1;

  const handleExportExcel = async () => {
    if (!id_exercice_prop) return;
    try {
      let url = `/dashboard/revuAnalytiqueMensuelle/${id_compte_val}/${id_dossier_val}/${id_exercice_prop}/export/excel`;
      if (id_periode_prop) url += `?id_periode=${id_periode_prop}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Revue_Mensuelle_${id_dossier_val}_${id_exercice_prop}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!id_exercice_prop) return;
    try {
      let url = `/dashboard/revuAnalytiqueMensuelle/${id_compte_val}/${id_dossier_val}/${id_exercice_prop}/export/pdf`;
      if (id_periode_prop) url += `?id_periode=${id_periode_prop}`;
      const response = await axiosPrivate.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Revue_Mensuelle_${id_dossier_val}_${id_exercice_prop}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    exportExcel: handleExportExcel,
    exportPdf: handleExportPdf
  }));

  // Récupérer les paramètres d'URL si présents
  const urlDateDebut = searchParams.get('date_debut');
  const urlDateFin = searchParams.get('date_fin');

  const [listeExercice, setListeExercice] = useState([]);
  const [fileInfos, setFileInfos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noFile, setNoFile] = useState(false);
  const [fileId, setFileId] = useState(parseInt(id_dossier) || 0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ row: null, checked: false, type: '' });

  // === Dialog commentaire ===
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // === Données du tableau ===
  const [rows, setRows] = useState([]);
  const [moisColumns, setMoisColumns] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const scrollContainerRef = useRef(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const {
    selectedExerciceId,
    selectedPeriodeId,
    selectedPeriodeDates,
    currentExerciceDates,
    listePeriodes: periodesFromContext,
  } = useExercicePeriode();

  // Utiliser les props de DetailsControles, sinon le contexte
  const effectiveExerciceId = id_exercice_prop ?? selectedExerciceId;
  const effectivePeriodeId = id_periode_prop ?? selectedPeriodeId;

  const sendToHome = (value) => {
    setNoFile(!value);
    navigate('/tab/home');
  };

  // Vérifier si un dossier est sélectionné au chargement
  useEffect(() => {
    const idDossier = id_dossier || sessionStorage.getItem('fileId');
    if (!idDossier || idDossier === '0') {
      setNoFile(true);
    } else {
      setFileId(parseInt(idDossier));
      setNoFile(false);
    }
  }, [id_dossier]);

  const getIds = useCallback(() => {
    return {
      id_compte: parseInt(jwtDecode(auth?.accessToken)?.UserInfo?.compteId) || parseInt(id_compte) || parseInt(sessionStorage.getItem('compteId')) || 1,
      id_dossier: parseInt(id_dossier) || fileId || parseInt(sessionStorage.getItem('fileId')) || 1,
      id_exercice: effectiveExerciceId || parseInt(sessionStorage.getItem('exerciceId')) || 1
    };
  }, [id_compte, id_dossier, fileId, effectiveExerciceId]);

  const fetchExercices = useCallback(async () => {
    try {
      const { id_dossier } = getIds();
      const response = await axiosPrivate.get(`/paramExercice/listeExercice/${id_dossier}`);
      const resData = response.data;
      if (resData.state) {
        setListeExercice(resData.list);
        // Sélectionner l'exercice correspondant aux dates URL ou le premier
        if (resData.list && resData.list.length > 0) {
          if (urlDateDebut && urlDateFin) {
            const matchingExercice = resData.list.find(e =>
              e.date_debut === urlDateDebut && e.date_fin === urlDateFin
            );
            if (matchingExercice) {
              setSelectedExerciceId(matchingExercice.id);
            } else {
              setSelectedExerciceId(resData.list[0].id);
            }
          } else if (selectedExerciceId === 0) {
            setSelectedExerciceId(resData.list[0].id);
          }
        }
      } else {
        console.error('[RevuAnalytiqueMensuelleDetail] Erreur dans la réponse exercices - state false:', resData);
      }
    } catch (error) {
      console.error('[RevuAnalytiqueMensuelleDetail] Error fetching exercices:', error);
      console.error('[RevuAnalytiqueMensuelleDetail] Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }, [axiosPrivate, getIds, urlDateDebut, urlDateFin, selectedExerciceId]);

  const fetchDossierInfos = useCallback(async () => {
    try {
      const { id_dossier } = getIds();
      const response = await axiosPrivate.get(`/home/FileInfos/${id_dossier}`);
      const resData = response.data;
      if (resData.state && resData.fileInfos && resData.fileInfos.length > 0) {
        setFileInfos(resData.fileInfos[0]);
      } else {
        console.error('[RevuAnalytiqueMensuelleDetail] Erreur dans la réponse infos dossier - state false ou fileInfos vide:', resData);
      }
    } catch (error) {
      console.error('[RevuAnalytiqueMensuelleDetail] Error fetching dossier infos:', error);
      console.error('[RevuAnalytiqueMensuelleDetail] Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }, [axiosPrivate, getIds]);

  const resolveDatesForAnalysis = useCallback(async () => {
    if (selectedPeriodeDates?.date_debut && selectedPeriodeDates?.date_fin) {
      return {
        date_debut: selectedPeriodeDates.date_debut,
        date_fin: selectedPeriodeDates.date_fin
      };
    }

    if (effectivePeriodeId && effectivePeriodeId !== 'exercice') {
      const periodeFromContext = (periodesFromContext || []).find(p => String(p.id) === String(effectivePeriodeId));
      if (periodeFromContext?.date_debut && periodeFromContext?.date_fin) {
        return {
          date_debut: periodeFromContext.date_debut,
          date_fin: periodeFromContext.date_fin
        };
      }

      if (effectiveExerciceId) {
        const response = await axiosPrivate.get(`/paramExercice/listePeriodes/${effectiveExerciceId}`);
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
  }, [selectedPeriodeDates, effectivePeriodeId, effectiveExerciceId, currentExerciceDates, periodesFromContext, axiosPrivate]);

  useEffect(() => {
    fetchDossierInfos();
  }, [fetchDossierInfos]);

  // Récupérer les données de la revue analytique mensuelle
  useEffect(() => {
    const fetchRevuAnalytiqueMensuelle = async () => {
      try {
        setLoading(true);
        const { id_compte, id_dossier } = getIds();

        // Ne pas faire l'appel si l'exerciceId n'est pas valide
        if (!effectiveExerciceId) {
          console.error('[RevuAnalytiqueMensuelleDetail] effectiveExerciceId invalide - annulation de la requête');
          setRows([]);
          setMoisColumns([]);
          return;
        }

        let url = `/dashboard/revuAnalytiqueMensuelle/${id_compte}/${id_dossier}/${effectiveExerciceId}`;

        const resolvedDates = await resolveDatesForAnalysis();
        if (resolvedDates) {
          url += `?date_debut=${resolvedDates.date_debut}&date_fin=${resolvedDates.date_fin}`;
          if (effectivePeriodeId) {
            url += `&id_periode=${effectivePeriodeId}`;
          }
        }

        const response = await axiosPrivate.get(url);

        if (response.data.state) {
          setRows(response.data.data);
          setMoisColumns(response.data.moisColumns || []);
        } else {
          console.error('[RevuAnalytiqueMensuelleDetail] Erreur dans la réponse revue analytique mensuelle - state false:', response.data);
          setRows([]);
          setMoisColumns([]);
        }
      } catch (error) {
        console.error('[RevuAnalytiqueMensuelleDetail] Erreur lors de la récupération des données mensuelles:', error);
        console.error('[RevuAnalytiqueMensuelleDetail] Détails erreur:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setRows([]);
        setMoisColumns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevuAnalytiqueMensuelle();
  }, [axiosPrivate, getIds, effectiveExerciceId, effectivePeriodeId, resolveDatesForAnalysis]);

  const handleToggleAnomalie = useCallback(
    (row, checked) => {
      // Ouvrir la popup de confirmation pour anomalie
      setConfirmDialogData({ row, checked, type: 'anomalie' });
      setConfirmDialogOpen(true);
    },
    []
  );

  const handleConfirmAnomalie = async () => {
    const { row, checked } = confirmDialogData;
    if (!row) return;

    try {
      const { id_compte, id_dossier, id_exercice } = getIds();
      const id_periode = effectivePeriodeId || null;

      // Appeler l'API RevuAnalytique pour incrémenter/décrémenter
      const endpoint = checked ? '/revuAnalytiqueStats/incrementAnomaly' : '/revuAnalytiqueStats/decrementAnomaly';
      await axiosPrivate.post(endpoint, {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: id_periode,
        compte: row.compte,
        type_revue: 'analytiqueMensuelle'
      });

      // Mettre à jour le commentaire avec anomalies et id_periode
      await axiosPrivate.post('/commentaireAnalytiqueMensuelle/addOrUpdate', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: id_periode,
        compte: row.compte,
        commentaire: row.commentaire || '',
        anomalies: checked,
        valide_anomalie: row.valide_anomalie
      });

      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, anomalies: checked } : r)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour anomalie:', error);
    } finally {
      setConfirmDialogOpen(false);
      setConfirmDialogData({ row: null, checked: false, type: '' });
    }
  };

  const handleToggleValide = useCallback(
    (row, checked) => {
      // Ouvrir la popup de confirmation pour validation
      setConfirmDialogData({ row, checked, type: 'validation' });
      setConfirmDialogOpen(true);
    },
    []
  );

  const handleConfirmValidation = async () => {
    const { row, checked } = confirmDialogData;
    if (!row) return;

    try {
      const { id_compte, id_dossier, id_exercice } = getIds();

      await axiosPrivate.post('/revuAnalytiqueStats/validateAnomaly', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: effectivePeriodeId || null,
        compte: row.compte,
        type_revue: 'analytiqueMensuelle',
        validated: checked
      });

      await axiosPrivate.post('/commentaireAnalytiqueMensuelle/addOrUpdate', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: effectivePeriodeId || null,
        compte: row.compte,
        commentaire: row.commentaire || '',
        anomalies: row.anomalies,
        valide_anomalie: checked
      });

      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, valide_anomalie: checked } : r)));
    } catch (error) {
      console.error('Erreur lors de la validation anomalie:', error);
    } finally {
      setConfirmDialogOpen(false);
      setConfirmDialogData({ row: null, checked: false });
    }
  };

  const handleCancelValidation = () => {
    setConfirmDialogOpen(false);
    setConfirmDialogData({ row: null, checked: false });
  };

  const handleSaveCommentaire = async (comment) => {
    if (!selectedRow) return;
    try {
      setCommentLoading(true);
      const { id_compte, id_dossier, id_exercice } = getIds();
      const id_periode = effectivePeriodeId || null;

      const response = await axiosPrivate.post('/commentaireAnalytiqueMensuelle/addOrUpdate', {
        id_compte: id_compte,
        id_exercice: id_exercice,
        id_dossier: id_dossier,
        id_periode: id_periode,
        compte: selectedRow.compte,
        commentaire: comment,
        anomalies: selectedRow.anomalies || false,
        valide_anomalie: selectedRow.valide_anomalie || false
      });

      if (response.data.state) {
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.compte === selectedRow.compte
              ? { ...row, commentaire: comment }
              : row
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
    } finally {
      setCommentLoading(false);
      setOpenCommentDialog(false);
      setSelectedRow(null);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // === Recherche & filtres ===
  const [search, setSearch] = useState('');
  const [anomalieFilter, setAnomalieFilter] = useState('all'); // all | oui | non
  const [valideFilter, setValideFilter] = useState('all');     // all | oui | non

  const q = search.trim().toLowerCase();
  const filteredRows = rows.filter((r) => {
    if (q && !(`${r.compte || ''} ${r.libelle || ''}`.toLowerCase().includes(q))) return false;
    if (anomalieFilter === 'oui' && !r.anomalies) return false;
    if (anomalieFilter === 'non' && r.anomalies) return false;
    if (valideFilter === 'oui' && !r.valide_anomalie) return false;
    if (valideFilter === 'non' && r.valide_anomalie) return false;
    return true;
  });

  // Ramener la pagination sur une page valide quand le filtre réduit le nombre de lignes
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredRows.length, rowsPerPage, page]);

  // Lignes de la page courante
  const displayedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Statistiques (sur l'ensemble, indépendamment du filtre)
  const totalAnomalies = rows.filter((r) => r.anomalies).length;
  const restantAValider = rows.filter((r) => r.anomalies && !r.valide_anomalie).length;

  return (
    <>
      {noFile ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h6">Veuillez sélectionner un dossier</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

          {/* HEADER DE STATISTIQUES (Fixe en haut) */}
          <Stack direction="row" spacing={3} alignItems="center" sx={{ px: 2.5, py: 1.5, bgcolor: T.canvas, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
            <Box>
              <Typography sx={{ fontSize: '10px', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>Anomalies signalées</Typography>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography sx={{ ...NUM, color: T.warn, fontWeight: 800, fontSize: '20px', lineHeight: 1 }}>{totalAnomalies}</Typography>
                <WarningAmberRounded sx={{ color: T.warn, fontSize: 16 }} />
              </Stack>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: T.line }} />
            <Box>
              <Typography sx={{ fontSize: '10px', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>Restant à valider</Typography>
              <Typography sx={{ ...NUM, color: restantAValider > 0 ? T.neg : T.pos, fontWeight: 800, fontSize: '20px', lineHeight: 1 }}>{restantAValider}</Typography>
            </Box>
          </Stack>

          {/* BARRE DE RECHERCHE & FILTRES */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ px: 2.5, py: 1.25, bgcolor: T.surface, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Rechercher un compte ou un libellé…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search sx={{ fontSize: 18, color: T.faint }} /></InputAdornment>
                ),
              }}
              sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: T.canvas, fontSize: '13px' } }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <FilterSelect label="Anomalie" value={anomalieFilter} onChange={(v) => { setAnomalieFilter(v); setPage(0); }} />
            <FilterSelect label="Validé" value={valideFilter} onChange={(v) => { setValideFilter(v); setPage(0); }} />
          </Stack>

          {/* ZONE DU TABLEAU AVEC SCROLL INTERNE (en-tête + colonnes figés) */}
          <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table
                stickyHeader
                size="small"
                sx={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 'max-content' }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headPinSx('left', 0), ...w(100) }}>Compte</TableCell>
                    <TableCell sx={{ ...headPinSx('left', 100, SH_L), ...w(300) }}>Libellé</TableCell>
                    <TableCell align="right" sx={{ ...headNormalSx, ...w(120) }}>Total</TableCell>
                    {moisColumns.map((mois) => (
                      <TableCell key={mois.nom} align="right" sx={{ ...headNormalSx, ...w(110) }}>{mois.nomAffiche}</TableCell>
                    ))}
                    <TableCell align="center" sx={{ ...headPinSx('right', 270, SH_R), ...w(80) }}>Anomalies</TableCell>
                    <TableCell align="center" sx={{ ...headPinSx('right', 200), ...w(70) }}>Validé</TableCell>
                    <TableCell align="center" sx={{ ...headPinSx('right', 0), ...w(200) }}>Commentaire</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRows.map((row) => {
                    const hasAnomaly = !!row.anomalies;
                    const isValid = !!row.valide_anomalie;
                    const hasComment = row.commentaire && String(row.commentaire).trim();
                    return (
                      <TableRow
                        key={row.id}
                        sx={{ bgcolor: T.surface, '&:hover': { bgcolor: '#FAFBFB' } }}
                      >
                        {/* Compte (figé gauche) */}
                        <TableCell sx={{ ...cellPinSx('left', 0), ...w(100) }}>
                          <Typography sx={{ ...NUM, fontSize: '12.5px', fontWeight: 700, color: T.ink }}>{row.compte}</Typography>
                        </TableCell>
                        {/* Libellé (figé gauche) */}
                        <TableCell sx={{ ...cellPinSx('left', 100, SH_L), ...w(300), overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Typography noWrap title={row.libelle || ''} sx={{ fontSize: '12.5px', color: T.text }}>{row.libelle}</Typography>
                        </TableCell>
                        {/* Total */}
                        <TableCell align="right" sx={{ ...CELLSX, ...w(120) }}><MoneyCell value={row.total_exercice} bold /></TableCell>
                        {/* Mois (défilants) */}
                        {moisColumns.map((mois) => (
                          <TableCell key={mois.nom} align="right" sx={{ ...CELLSX, ...w(110) }}><MoneyCell value={row[mois.nom]} /></TableCell>
                        ))}
                        {/* Anomalies (figé droite) */}
                        <TableCell align="center" sx={{ ...cellPinSx('right', 270, SH_R), ...w(80) }}>
                          <Tooltip title={hasAnomaly ? 'Anomalie signalée — cliquer pour retirer' : 'Conforme — cliquer pour signaler'} arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleAnomalie(row, !hasAnomaly)}
                              sx={{ p: 0.25, color: hasAnomaly ? T.warn : T.pos, transition: '.15s', '&:hover': { transform: 'scale(1.12)' } }}
                            >
                              {hasAnomaly ? <WarningAmberRounded fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        {/* Validé (figé droite) */}
                        <TableCell align="center" sx={{ ...cellPinSx('right', 200), ...w(70) }}>
                          <Tooltip title={isValid ? 'Validé — cliquer pour dévalider' : (hasAnomaly ? 'À valider — cliquer pour valider' : 'Rien à valider')} arrow>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleValide(row, !isValid)}
                                disabled={!hasAnomaly && !isValid}
                                sx={{ p: 0.25, color: isValid ? T.pos : (hasAnomaly ? T.warn : T.faint), transition: '.15s', '&:hover': { transform: 'scale(1.12)' } }}
                              >
                                {isValid ? <TaskAltRounded fontSize="small" /> : <RadioButtonUnchecked fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                        {/* Commentaire (figé droite) */}
                        <TableCell align="center" sx={{ ...cellPinSx('right', 0), ...w(200) }}>
                          <Badge
                            variant={hasComment ? 'dot' : 'standard'}
                            overlap="circular"
                            sx={{ '& .MuiBadge-badge': { backgroundColor: T.warn, color: T.warn } }}
                          >
                            <Tooltip
                              title={row.commentaire || ''}
                              arrow
                              componentsProps={{
                                tooltip: { sx: { backgroundColor: 'white', color: '#334155', fontSize: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 250 } },
                                arrow: { sx: { color: 'white' } },
                              }}
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => { setSelectedRow(row); setOpenCommentDialog(true); }}
                                  sx={{ color: hasComment ? T.accent : T.faint, '&:hover': { bgcolor: T.accW } }}
                                >
                                  <ChatBubbleOutlineOutlined fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {displayedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5 + moisColumns.length} align="center" sx={{ ...CELLSX, color: T.faint, py: 4 }}>
                        {loading ? 'Chargement…' : (rows.length > 0 ? 'Aucun résultat pour ces critères' : 'Aucune donnée')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100, 200]}
              labelRowsPerPage="Lignes par page"
              sx={{ borderTop: `1px solid ${T.line}`, flexShrink: 0 }}
            />
          </Box>
        </Box>
      )}

      {/* Dialog de confirmation pour validation/anomalie */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onClose={() => { setConfirmDialogOpen(false); setConfirmDialogData({ row: null, checked: false, type: '' }); }}
        onConfirm={confirmDialogData.type === 'anomalie' ? handleConfirmAnomalie : handleConfirmValidation}
        title={confirmDialogData.type === 'anomalie'
          ? (confirmDialogData.checked ? 'Signaler une anomalie' : 'Retirer l\'anomalie')
          : (confirmDialogData.checked ? 'Valider l\'anomalie' : 'Annuler la validation')}
        message={confirmDialogData.type === 'anomalie'
          ? (confirmDialogData.checked
            ? `Voulez-vous signaler le compte ${confirmDialogData.row?.compte} comme anomalie ?`
            : `Voulez-vous retirer l'anomalie du compte ${confirmDialogData.row?.compte} ?`)
          : (confirmDialogData.checked
            ? `Voulez-vous valider l'anomalie du compte ${confirmDialogData.row?.compte} ?`
            : `Voulez-vous annuler la validation du compte ${confirmDialogData.row?.compte} ?`)}
        confirmText="Confirmer"
        cancelText="Annuler"
      />

      {/* Dialog commentaire */}
      <CommentDialog
        open={openCommentDialog}
        onClose={() => { setOpenCommentDialog(false); setSelectedRow(null); }}
        onSave={handleSaveCommentaire}
        initialValue={selectedRow?.commentaire || ''}
        title={`Commentaire - ${selectedRow?.compte || ''}`}
        placeholder="Saisissez votre commentaire..."
        loading={commentLoading}
      />
    </>
  );
});

export default RevueMensuelleTable;